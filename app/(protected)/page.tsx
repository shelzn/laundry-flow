import { count, desc, eq, sql } from "drizzle-orm"
import { CreditCard, PackageCheck, ReceiptText, Users } from "lucide-react"

import { StatusBadge } from "@/app/(protected)/_components/status-badge"
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

async function getDashboardData() {
  const [stats] = await db
    .select({
      totalOrders: count(orders.id),
      revenue: sql<string>`coalesce(sum(${payments.amount}), 0)`,
      activeCustomers: sql<number>`count(distinct ${orders.customerName})`,
    })
    .from(orders)
    .leftJoin(payments, eq(payments.orderId, orders.id))

  const [processing] = await db
    .select({ total: count(orders.id) })
    .from(orders)
    .where(sql`${orders.status} not in ('completed', 'cancelled')`)

  const recentOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit: 8,
    with: {
      items: { with: { service: true } },
    },
  })

  const recentPayments = await db.query.payments.findMany({
    orderBy: [desc(payments.paidAt)],
    limit: 8,
    with: { order: true },
  })

  return {
    stats: {
      totalOrders: stats?.totalOrders ?? 0,
      revenue: stats?.revenue ?? "0",
      processing: processing?.total ?? 0,
      activeCustomers: stats?.activeCustomers ?? 0,
    },
    recentOrders,
    recentPayments,
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData()
  const statCards = [
    {
      label: "Order",
      value: data.stats.totalOrders,
      detail: "Total transaksi",
      icon: ReceiptText,
    },
    {
      label: "Pendapatan",
      value: rupiah(data.stats.revenue),
      detail: "Dari pembayaran masuk",
      icon: CreditCard,
    },
    {
      label: "Diproses",
      value: data.stats.processing,
      detail: "Belum selesai",
      icon: PackageCheck,
    },
    {
      label: "Pelanggan",
      value: data.stats.activeCustomers,
      detail: "Pernah bertransaksi",
      icon: Users,
    },
  ]

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Dashboard laundry</h2>
        <p className="text-sm text-muted-foreground">
          Ringkasan transaksi, pembayaran, dan proses harian.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, detail, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <div>
                <CardDescription>{label}</CardDescription>
                <CardTitle className="mt-2 text-2xl">{value}</CardTitle>
              </div>
              <Icon className="size-5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {detail}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Order terbaru</CardTitle>
            <CardDescription>Status cucian paling baru.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.invoiceNumber}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      <StatusBadge value={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      {rupiah(order.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pembayaran terbaru</CardTitle>
            <CardDescription>Kas masuk terakhir.</CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Metode</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Nominal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.order.invoiceNumber}
                    </TableCell>
                    <TableCell>{payment.method}</TableCell>
                    <TableCell>{shortDate(payment.paidAt)}</TableCell>
                    <TableCell className="text-right">
                      {rupiah(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
