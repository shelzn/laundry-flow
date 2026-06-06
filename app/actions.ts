"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSession,
  destroySession,
  hashPassword,
  requireAdmin,
  requireUser,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { orderItems, orders, payments, services, users } from "@/lib/db/schema";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function numberValue(formData: FormData, key: string) {
  return Number(text(formData, key));
}

function money(value: number) {
  return value.toFixed(2);
}

function requireId(formData: FormData, key: string, label: string) {
  const value = numberValue(formData, key);

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} tidak valid.`);
  }

  return value;
}

function requirePositiveNumber(formData: FormData, key: string, label: string) {
  const value = numberValue(formData, key);

  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${label} harus lebih dari 0.`);
  }

  return value;
}

function requirePositiveInteger(
  formData: FormData,
  key: string,
  label: string,
) {
  const value = requirePositiveNumber(formData, key, label);

  if (!Number.isInteger(value)) {
    throw new Error(`${label} harus berupa angka bulat.`);
  }

  return value;
}

function requireEmail(formData: FormData, key: string, label: string) {
  const value = requireText(formData, key, label).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error(`${label} tidak valid.`);
  }

  return value;
}

function requireText(formData: FormData, key: string, label: string) {
  const value = text(formData, key);

  if (!value) throw new Error(`${label} wajib diisi.`);

  return value;
}

function revalidateLaundryPaths(...paths: string[]) {
  revalidatePath("/");
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function login(formData: FormData) {
  const email = requireEmail(formData, "email", "Email");
  const password = requireText(formData, "password", "Password");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    throw new Error("Email atau password tidak sesuai.");
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/");
}

export async function loginWithState(
  _prevState: { error: string },
  formData: FormData,
) {
  const email = requireEmail(formData, "email", "Email");
  const password = requireText(formData, "password", "Password");
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email atau password tidak sesuai." };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function createService(formData: FormData) {
  await requireUser();
  const price = requirePositiveNumber(formData, "price", "Harga");
  const estimatedHours = requirePositiveInteger(
    formData,
    "estimatedHours",
    "Estimasi jam",
  );

  await db.insert(services).values({
    name: requireText(formData, "name", "Nama layanan"),
    description: text(formData, "description") || null,
    unit: text(formData, "unit") === "item" ? "item" : "kg",
    price: money(price),
    estimatedHours,
  });
  revalidateLaundryPaths("/layanan", "/laundry");
}

export async function updateService(formData: FormData) {
  await requireUser();
  const price = requirePositiveNumber(formData, "price", "Harga");
  const estimatedHours = requirePositiveInteger(
    formData,
    "estimatedHours",
    "Estimasi jam",
  );

  await db
    .update(services)
    .set({
      name: requireText(formData, "name", "Nama layanan"),
      description: text(formData, "description") || null,
      unit: text(formData, "unit") === "item" ? "item" : "kg",
      price: money(price),
      estimatedHours,
    })
    .where(eq(services.id, requireId(formData, "id", "Layanan")));
  revalidateLaundryPaths("/layanan", "/laundry");
}

export async function deleteService(formData: FormData) {
  await requireAdmin();
  await db
    .delete(services)
    .where(eq(services.id, requireId(formData, "id", "Layanan")));
  revalidateLaundryPaths("/layanan", "/laundry");
}

export async function createOrder(formData: FormData) {
  const user = await requireUser();
  const customerName = requireText(formData, "customerName", "Nama pelanggan");
  const serviceId = requireId(formData, "serviceId", "Layanan");
  const quantity = requirePositiveNumber(formData, "quantity", "Berat/jumlah");

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);
  if (!service) throw new Error("Layanan tidak ditemukan.");

  const subtotal = quantity * Number(service.price);
  const invoiceNumber = `LDY-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${Date.now().toString().slice(-5)}`;
  const estimatedDoneAt = new Date(
    Date.now() + service.estimatedHours * 60 * 60 * 1000,
  );

  await db.transaction(async (tx) => {
    const result = await tx.insert(orders).values({
      invoiceNumber,
      customerName,
      customerPhone: text(formData, "customerPhone") || null,
      customerAddress: text(formData, "customerAddress") || null,
      userId: user.id,
      totalPrice: money(subtotal),
      paidAmount: money(0),
      paymentStatus: "unpaid",
      notes: text(formData, "notes") || null,
      estimatedDoneAt,
    });
    const orderId = Number(result[0].insertId);

    await tx.insert(orderItems).values({
      orderId,
      serviceId,
      quantity: money(quantity),
      price: service.price,
      subtotal: money(subtotal),
    });
  });

  revalidateLaundryPaths("/laundry", "/pembayaran");
}

export async function updateOrder(formData: FormData) {
  await requireUser();
  const status = text(formData, "status");
  const allowedStatuses = [
    "new",
    "processing",
    "washing",
    "ironing",
    "ready",
    "completed",
    "cancelled",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Status order tidak valid.");
  }

  await db
    .update(orders)
    .set({
      customerName: requireText(formData, "customerName", "Nama pelanggan"),
      customerPhone: text(formData, "customerPhone") || null,
      customerAddress: text(formData, "customerAddress") || null,
      status: status as typeof orders.$inferInsert.status,
      notes: text(formData, "notes") || null,
      completedAt: status === "completed" ? new Date() : null,
    })
    .where(eq(orders.id, requireId(formData, "id", "Order")));

  revalidateLaundryPaths("/laundry", "/pembayaran");
}

export async function deleteOrder(formData: FormData) {
  await requireAdmin();
  const orderId = numberValue(formData, "id");
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error("Order tidak valid.");
  }
  await db.transaction(async (tx) => {
    await tx.delete(payments).where(eq(payments.orderId, orderId));
    await tx.delete(orderItems).where(eq(orderItems.orderId, orderId));
    await tx.delete(orders).where(eq(orders.id, orderId));
  });
  revalidateLaundryPaths("/laundry", "/pembayaran");
}

export async function addPayment(formData: FormData) {
  await requireUser();
  const orderId = requireId(formData, "orderId", "Order");

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  if (!order) throw new Error("Order tidak ditemukan.");

  const totalPrice = Number(order.totalPrice);
  const amount = Math.max(0, totalPrice - Number(order.paidAmount));

  if (amount <= 0) throw new Error("Invoice sudah lunas.");

  const nextPaidAmount = Number(order.paidAmount) + amount;
  let paymentId = 0;

  await db.transaction(async (tx) => {
    const result = await tx.insert(payments).values({
      orderId,
      amount: money(amount),
      method:
        text(formData, "method") === "transfer"
          ? "transfer"
          : text(formData, "method") === "qris"
            ? "qris"
            : "cash",
    });
    paymentId = Number(result[0].insertId);
    await tx
      .update(orders)
      .set({
        paidAmount: money(nextPaidAmount),
        paymentStatus: nextPaidAmount >= totalPrice ? "paid" : "partial",
      })
      .where(eq(orders.id, orderId));
  });

  revalidateLaundryPaths("/pembayaran", "/laundry");
  redirect(`/pembayaran/${paymentId}`);
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const password = requireText(formData, "password", "Password");
  const email = requireEmail(formData, "email", "Email");

  if (password.length < 8) throw new Error("Password minimal 8 karakter.");

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  if (existingUser) throw new Error("Email sudah terdaftar.");

  await db.insert(users).values({
    name: requireText(formData, "name", "Nama"),
    email,
    passwordHash: await hashPassword(password),
    role: text(formData, "role") === "admin" ? "admin" : "staff",
  });
  revalidateLaundryPaths("/users");
}

export async function updateUserRole(formData: FormData) {
  await requireAdmin();
  await db
    .update(users)
    .set({ role: text(formData, "role") === "admin" ? "admin" : "staff" })
    .where(eq(users.id, requireId(formData, "id", "User")));
  revalidateLaundryPaths("/users");
}

export async function deleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const id = requireId(formData, "id", "User");

  if (admin.id === id) throw new Error("Tidak bisa menghapus akun sendiri.");

  const [linkedOrder] = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.userId, id))
    .limit(1);
  if (linkedOrder)
    throw new Error("User sudah punya transaksi, ubah role saja.");

  await db
    .delete(users)
    .where(and(eq(users.id, id), sql`${users.id} != ${admin.id}`));
  revalidateLaundryPaths("/users");
}
