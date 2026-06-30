import "server-only"

import { createHash } from "node:crypto"

export type MidtransPaymentType = "qris" | "gopay" | "bank_transfer"
export type MidtransBank = "bca" | "bni" | "bri" | "permata"

type MidtransConfig = {
  isProduction: boolean
  serverKey: string
  clientKey: string
}

export type MidtransNotification = {
  order_id?: string
  gross_amount?: string
  status_code?: string
  signature_key?: string
  transaction_status?: string
  fraud_status?: string
  payment_type?: string
}

export class MidtransApiError extends Error {
  status: number
  response: unknown

  constructor(status: number, response: unknown) {
    super("Request Midtrans gagal.")
    this.name = "MidtransApiError"
    this.status = status
    this.response = response
  }
}

function requiredEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]
    if (value) return value
  }

  throw new Error(`Env ${keys.join(" / ")} belum diisi.`)
}

export function getMidtransConfig(): MidtransConfig {
  return {
    isProduction: process.env.APP_ENV === "production",
    serverKey: requiredEnv("MIDTRANS_SERVER_KEY", "NEXT_PUBLIC_SERVER_KEY"),
    clientKey: requiredEnv("MIDTRANS_CLIENT_KEY", "NEXT_PUBLIC_CLIENT_KEY"),
  }
}

function getMidtransBaseUrl() {
  return getMidtransConfig().isProduction
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com"
}

function getAuthorizationHeader() {
  const { serverKey } = getMidtransConfig()
  return `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`
}

async function midtransFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${getMidtransBaseUrl()}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: getAuthorizationHeader(),
      ...init?.headers,
    },
  })
  const data = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    throw new MidtransApiError(response.status, data)
  }

  return data
}

export function chargeMidtransTransaction(parameter: Record<string, unknown>) {
  return midtransFetch("/v2/charge", {
    method: "POST",
    body: JSON.stringify(parameter),
  })
}

export function getMidtransTransactionStatus(orderIdOrTransactionId: string) {
  return midtransFetch(
    `/v2/${encodeURIComponent(orderIdOrTransactionId)}/status`,
  )
}

export function createMidtransOrderId(invoiceNumber: string) {
  return `${invoiceNumber}-MID-${Date.now()}`
}

export function invoiceFromMidtransOrderId(orderId: string) {
  return orderId.split("-MID-")[0] || orderId
}

export function verifyMidtransSignature(notification: MidtransNotification) {
  const { serverKey } = getMidtransConfig()
  const signaturePayload = `${notification.order_id ?? ""}${
    notification.status_code ?? ""
  }${notification.gross_amount ?? ""}${serverKey}`
  const expectedSignature = createHash("sha512")
    .update(signaturePayload)
    .digest("hex")

  return notification.signature_key === expectedSignature
}

export function isPaidMidtransStatus(notification: MidtransNotification) {
  if (notification.transaction_status === "settlement") return true

  return (
    notification.transaction_status === "capture" &&
    (!notification.fraud_status || notification.fraud_status === "accept")
  )
}
