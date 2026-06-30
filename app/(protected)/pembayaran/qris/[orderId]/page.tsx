import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { QrisPaymentPanel } from "@/app/(protected)/pembayaran/qris/[orderId]/qris-payment-panel"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/lib/db"
import { orders } from "@/lib/db/schema"
import { rupiah } from "@/lib/laundry"

export default async function QrisPaymentPage({
  params,
}: {
  params: Promise<{ orderId: string }>
}) {
  const { orderId } = await params
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, Number(orderId)),
  })

  if (!order) notFound()

  const remainingAmount = Math.max(
    0,
    Number(order.totalPrice) - Number(order.paidAmount),
  )

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Pembayaran QRIS</h2>
          <p className="text-sm text-muted-foreground">
            Invoice {order.invoiceNumber}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pembayaran">Kembali</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{order.customerName}</CardTitle>
          <CardDescription>
            Total yang harus dibayar {rupiah(remainingAmount)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QrisPaymentPanel
            orderId={order.id}
            invoiceNumber={order.invoiceNumber}
            disabled={remainingAmount <= 0}
          />
        </CardContent>
      </Card>
    </div>
  )
}
