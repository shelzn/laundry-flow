import { eq } from "drizzle-orm"
import Link from "next/link"
import { notFound } from "next/navigation"

import { ReceiptPrinter } from "@/app/(protected)/_components/receipt-printer"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/lib/db"
import { payments } from "@/lib/db/schema"

type ReceiptItem = {
  serviceName: string
  quantity: string
  unit: "kg" | "item"
  price: string
  subtotal: string
}

export default async function PaymentReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const payment = await db.query.payments.findFirst({
    where: eq(payments.id, Number(id)),
    with: {
      order: {
        with: {
          items: { with: { service: true } },
        },
      },
    },
  })

  if (!payment) notFound()

  const receiptItems: ReceiptItem[] = payment.order.items.map(
    (item): ReceiptItem => ({
      serviceName: item.service.name,
      quantity: item.quantity,
      unit: item.service.unit,
      price: item.price,
      subtotal: item.subtotal,
    })
  )

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Struk pembayaran</h2>
          <p className="text-sm text-muted-foreground">
            Invoice {payment.order.invoiceNumber}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/pembayaran">Kembali</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preview struk</CardTitle>
          <CardDescription>
            Halaman ini otomatis membuka dialog print saat dibuka.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReceiptPrinter
            autoPrint
            payment={{
              id: payment.id,
              amount: payment.amount,
              method: payment.method,
              paidAt: payment.paidAt.toISOString(),
              order: {
                invoiceNumber: payment.order.invoiceNumber,
                customerName: payment.order.customerName,
                totalPrice: payment.order.totalPrice,
                paidAmount: payment.order.paidAmount,
                items: receiptItems,
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
