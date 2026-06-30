import { eq } from "drizzle-orm"
import { NextResponse } from "next/server"

import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import {
  chargeMidtransTransaction,
  createMidtransOrderId,
  type MidtransBank,
  type MidtransPaymentType,
} from "@/lib/midtrans"

type CreateTransactionRequest = {
  orderId?: number
  paymentType?: MidtransPaymentType | "transfer"
  bank?: MidtransBank
  callbackUrl?: string
}

function normalizePaymentType(paymentType?: CreateTransactionRequest["paymentType"]) {
  if (paymentType === "gopay") return "gopay"
  if (paymentType === "bank_transfer" || paymentType === "transfer") {
    return "bank_transfer"
  }

  return "qris"
}

export async function POST(request: Request) {
  await requireUser()

  const body = (await request.json()) as CreateTransactionRequest
  const orderId = Number(body.orderId)

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ message: "Order tidak valid." }, { status: 400 })
  }

  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  if (!order) {
    return NextResponse.json(
      { message: "Order tidak ditemukan." },
      { status: 404 },
    )
  }

  const grossAmount = Math.round(
    Number(order.totalPrice) - Number(order.paidAmount),
  )

  if (grossAmount <= 0) {
    return NextResponse.json(
      { message: "Invoice sudah lunas." },
      { status: 400 },
    )
  }

  const paymentType = normalizePaymentType(body.paymentType)
  const midtransOrderId = createMidtransOrderId(order.invoiceNumber)
  const parameter: Record<string, unknown> = {
    payment_type: paymentType,
    transaction_details: {
      order_id: midtransOrderId,
      gross_amount: grossAmount,
    },
    customer_details: {
      first_name: order.customerName,
      phone: order.customerPhone ?? undefined,
      billing_address: {
        address: order.customerAddress ?? undefined,
      },
    },
  }

  if (paymentType === "bank_transfer") {
    parameter.bank_transfer = {
      bank: body.bank ?? "bca",
    }
  }

  if (paymentType === "gopay" && body.callbackUrl) {
    parameter.gopay = {
      enable_callback: true,
      callback_url: body.callbackUrl,
    }
  }

  const transaction = await chargeMidtransTransaction(parameter)

  return NextResponse.json({
    orderId: order.id,
    invoiceNumber: order.invoiceNumber,
    midtransOrderId,
    paymentType,
    grossAmount,
    transaction,
  })
}
