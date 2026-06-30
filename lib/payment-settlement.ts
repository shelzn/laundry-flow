import "server-only"

import { desc, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { orders, payments } from "@/lib/db/schema"
import {
  invoiceFromMidtransOrderId,
  type MidtransNotification,
} from "@/lib/midtrans"

function money(value: number) {
  return value.toFixed(2)
}

function paymentMethodFromMidtrans(paymentType?: string) {
  return paymentType === "bank_transfer" ? "transfer" : "qris"
}

export async function settleMidtransPayment(status: MidtransNotification) {
  if (!status.order_id) return null

  const invoiceNumber = invoiceFromMidtransOrderId(status.order_id)
  const grossAmount = Number(status.gross_amount)

  if (!Number.isFinite(grossAmount) || grossAmount <= 0) {
    throw new Error("Nominal transaksi tidak valid.")
  }

  const [paymentId] = await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.invoiceNumber, invoiceNumber))
      .limit(1)

    if (!order) return [null]

    const remainingAmount = Math.max(
      0,
      Number(order.totalPrice) - Number(order.paidAmount),
    )

    if (remainingAmount <= 0) {
      const [latestPayment] = await tx
        .select({ id: payments.id })
        .from(payments)
        .where(eq(payments.orderId, order.id))
        .orderBy(desc(payments.paidAt), desc(payments.id))
        .limit(1)

      return [latestPayment?.id ?? null]
    }

    const paidAmount = Math.min(grossAmount, remainingAmount)
    const nextPaidAmount = Number(order.paidAmount) + paidAmount
    const result = await tx.insert(payments).values({
      orderId: order.id,
      amount: money(paidAmount),
      method: paymentMethodFromMidtrans(status.payment_type),
    })

    await tx
      .update(orders)
      .set({
        paidAmount: money(nextPaidAmount),
        paymentStatus:
          nextPaidAmount >= Number(order.totalPrice) ? "paid" : "partial",
      })
      .where(eq(orders.id, order.id))

    return [Number(result[0].insertId)]
  })

  return paymentId
}
