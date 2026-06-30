import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { requireUser } from "@/lib/auth"
import {
  getMidtransTransactionStatus,
  isPaidMidtransStatus,
  type MidtransNotification,
} from "@/lib/midtrans"
import { settleMidtransPayment } from "@/lib/payment-settlement"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireUser()

  const { id } = await params

  if (!id) {
    return NextResponse.json(
      { message: "ID transaksi tidak valid." },
      { status: 400 },
    )
  }

  const transaction = (await getMidtransTransactionStatus(
    id,
  )) as MidtransNotification
  const paymentId = isPaidMidtransStatus(transaction)
    ? await settleMidtransPayment(transaction)
    : null

  if (paymentId) {
    revalidatePath("/pembayaran")
    revalidatePath("/laundry")
  }

  return NextResponse.json({ paymentId, transaction })
}
