import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import {
  getMidtransTransactionStatus,
  isPaidMidtransStatus,
  verifyMidtransSignature,
  type MidtransNotification,
} from "@/lib/midtrans"
import { settleMidtransPayment } from "@/lib/payment-settlement"

export async function POST(request: Request) {
  const notification = (await request.json()) as MidtransNotification

  if (!verifyMidtransSignature(notification)) {
    return NextResponse.json(
      { message: "Signature Midtrans tidak valid." },
      { status: 401 },
    )
  }

  if (!notification.order_id) {
    return NextResponse.json(
      { message: "Order ID Midtrans tidak ditemukan." },
      { status: 400 },
    )
  }

  const statusResponse = (await getMidtransTransactionStatus(
    notification.order_id,
  )) as MidtransNotification
  const midtransOrderId = statusResponse.order_id ?? notification.order_id

  if (!isPaidMidtransStatus(statusResponse)) {
    return NextResponse.json({
      message: "Notifikasi diterima.",
      orderId: midtransOrderId,
      transactionStatus: statusResponse.transaction_status,
    })
  }

  const paymentId = await settleMidtransPayment(statusResponse)

  revalidatePath("/pembayaran")
  revalidatePath("/laundry")

  return NextResponse.json({
    message: "Notifikasi pembayaran diproses.",
    orderId: midtransOrderId,
    paymentId,
    transactionStatus: statusResponse.transaction_status,
  })
}
