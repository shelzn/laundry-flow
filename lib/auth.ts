import "server-only"

import { createHmac } from "node:crypto"

import bcrypt from "bcryptjs"
import { eq } from "drizzle-orm"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

const SESSION_COOKIE = "laundry_session"
const SESSION_MAX_AGE = 60 * 60 * 24 * 7
const BCRYPT_ROUNDS = 12

type SessionPayload = {
  userId: number
  role: "admin" | "staff"
}

export type CurrentUser = {
  id: number
  name: string
  email: string
  role: "admin" | "staff"
}

function getSecret() {
  return process.env.AUTH_SECRET ?? "dev-secret-change-me"
}

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url")
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url")
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

export async function verifyPassword(password: string, storedHash: string) {
  return bcrypt.compare(password, storedHash)
}

export async function createSession(payload: SessionPayload) {
  const body = base64Url(JSON.stringify(payload))
  const signature = sign(body)
  const cookieStore = await cookies()

  cookieStore.set(SESSION_COOKIE, `${body}.${signature}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}

async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (!token) return null

  const [body, signature] = token.split(".")
  if (!body || !signature || sign(body) !== signature) return null

  try {
    return JSON.parse(
      Buffer.from(body, "base64url").toString()
    ) as SessionPayload
  } catch {
    return null
  }
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await readSession()

  if (!session) return null

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1)

  return user ?? null
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) redirect("/login")

  return user
}

export async function requireAdmin() {
  const user = await requireUser()

  if (user.role !== "admin") {
    throw new Error("Hanya admin yang boleh melakukan aksi ini.")
  }

  return user
}
