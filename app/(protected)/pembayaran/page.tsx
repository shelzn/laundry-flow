import { desc } from "drizzle-orm"
import { Printer } from "lucide-react"
import Link from "next/link"

import { PaymentForm } from "@/app/(protected)/_components/payment-form"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { db } from "@/lib/db"
import { orders, payments } from "@/lib/db/schema"
import { rupiah, shortDate } from "@/lib/laundry"

type PaymentOrderOption = {
  id: number
  invoiceNumber: string
  customerName: string
  totalPrice: string
  paidAmount: string
  paymentStatus: string
}

type PaymentHistoryRow = {
  id: number
  amount: string
  method: string
  paidAt: Date
  order: {
    invoiceNumber: string
    customerName: string
  }
}

export default async function PembayaranPage() {
  const orderRows: PaymentOrderOption[] = await db
    .select({
      id: orders.id,
      invoiceNumber: orders.invoiceNumber,
      customerName: orders.customerName,
      totalPrice: orders.totalPrice,
      paidAmount: orders.paidAmount,
      paymentStatus: orders.paymentStatus,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .limit(50)
  const paymentRows = await db.query.payments.findMany({
    orderBy: [desc(payments.paidAt)],
    limit: 50,
    with: { order: true },
  })
  const historyRows: PaymentHistoryRow[] = paymentRows.map(
    (payment): PaymentHistoryRow => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      paidAt: payment.paidAt,
      order: {
        invoiceNumber: payment.order.invoiceNumber,
        customerName: payment.order.customerName,
      },
    })
  )

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Pembayaran</h2>
        <p className="text-sm text-muted-foreground">
          Catat pembayaran invoice aktif dan cetak struk transaksi.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Tambah pembayaran</CardTitle>
            <CardDescription>
              Nominal otomatis mengikuti sisa tagihan invoice.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PaymentForm
              orders={orderRows
                .filter((order) => order.paymentStatus !== "paid")
                .map((order) => ({
                  id: order.id,
                  invoiceNumber: order.invoiceNumber,
                  customerName: order.customerName,
                  totalPrice: order.totalPrice,
                  paidAmount: order.paidAmount,
                }))}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Riwayat pembayaran</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Metode</TableHead>
                    <TableHead>Nominal</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyRows.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{payment.order.invoiceNumber}</TableCell>
                      <TableCell>{payment.order.customerName}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{rupiah(payment.amount)}</TableCell>
                      <TableCell>{shortDate(payment.paidAt)}</TableCell>
                      <TableCell>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Link href={`/pembayaran/${payment.id}`}>
                            <Printer className="size-4" />
                            Print
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
