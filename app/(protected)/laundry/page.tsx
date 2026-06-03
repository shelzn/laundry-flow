import { desc } from "drizzle-orm"
import { Trash2 } from "lucide-react"

import { deleteOrder, updateOrderStatus } from "@/app/actions"
import { OrderForm } from "@/app/(protected)/_components/order-form"
import { StatusBadge } from "@/app/(protected)/_components/status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { orders, services } from "@/lib/db/schema"
import { orderStatus, rupiah, shortDate } from "@/lib/laundry"

type LaundryService = {
  id: number
  name: string
  unit: "kg" | "item"
  price: string
}

type LaundryOrderItem = {
  serviceName: string
}

type LaundryOrder = {
  id: number
  invoiceNumber: string
  customerName: string
  status: string
  paymentStatus: string
  totalPrice: string
  estimatedDoneAt: Date | null
  items: LaundryOrderItem[]
}

async function getLaundryData() {
  const serviceRows: LaundryService[] = await db
    .select({
      id: services.id,
      name: services.name,
      unit: services.unit,
      price: services.price,
    })
    .from(services)
    .orderBy(desc(services.createdAt))
  const orderRows = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit: 40,
    with: {
      items: { with: { service: true } },
    },
  })

  return {
    services: serviceRows,
    orders: orderRows.map(
      (order): LaundryOrder => ({
        id: order.id,
        invoiceNumber: order.invoiceNumber,
        customerName: order.customerName,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        estimatedDoneAt: order.estimatedDoneAt,
        items: order.items.map(
          (item): LaundryOrderItem => ({
            serviceName: item.service.name,
          })
        ),
      })
    ),
  }
}

export default async function LaundryPage() {
  const currentUser = await requireUser()
  const data = await getLaundryData()

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Buat laundry</h2>
        <p className="text-sm text-muted-foreground">
          Input order baru, update status cucian, dan kelola transaksi laundry.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Order baru</CardTitle>
            <CardDescription>
              Total tagihan dihitung otomatis dari layanan dan berat/jumlah.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderForm services={data.services} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar order</CardTitle>
            <CardDescription>
              Status cucian, pembayaran, dan estimasi selesai.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Layanan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bayar</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Estimasi</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.invoiceNumber}
                    </TableCell>
                    <TableCell>{order.customerName}</TableCell>
                    <TableCell>
                      {order.items.map((item) => item.serviceName).join(", ")}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={order.status} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={order.paymentStatus} />
                    </TableCell>
                    <TableCell>{rupiah(order.totalPrice)}</TableCell>
                    <TableCell>{shortDate(order.estimatedDoneAt)}</TableCell>
                    <TableCell>
                      <div className="flex min-w-44 gap-2">
                        <form action={updateOrderStatus} className="flex gap-2">
                          <input type="hidden" name="id" value={order.id} />
                          <Select name="status" defaultValue={order.status}>
                            <SelectTrigger className="w-full min-w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {orderStatus.map(([key, label]) => (
                                <SelectItem key={key} value={key}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button size="sm" variant="outline">
                            OK
                          </Button>
                        </form>
                        {currentUser.role === "admin" ? (
                          <form action={deleteOrder}>
                            <input type="hidden" name="id" value={order.id} />
                            <Button size="icon" variant="destructive">
                              <Trash2 className="size-4" />
                            </Button>
                          </form>
                        ) : null}
                      </div>
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
