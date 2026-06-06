import { count, desc, like, or } from "drizzle-orm";
import {
  Pagination,
  SearchForm,
} from "@/app/(protected)/_components/list-controls";
import { OrderForm } from "@/app/(protected)/_components/order-form";
import { OrderActions } from "@/app/(protected)/_components/order-actions";
import { StatusBadge } from "@/app/(protected)/_components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { orders, services } from "@/lib/db/schema";
import { rupiah, shortDate } from "@/lib/laundry";
import {
  getListParams,
  getTotalPages,
  type PageSearchParams,
} from "@/lib/pagination";

type LaundryService = {
  id: number;
  name: string;
  unit: "kg" | "item";
  price: string;
};

type LaundryOrderItem = {
  serviceName: string;
};

type LaundryOrder = {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  status: string;
  paymentStatus: string;
  totalPrice: string;
  estimatedDoneAt: Date | null;
  notes: string | null;
  items: LaundryOrderItem[];
};

async function getLaundryData(searchParams?: PageSearchParams) {
  const { query, page, pageSize, offset } = getListParams(searchParams);
  const orderWhere = query
    ? or(
        like(orders.invoiceNumber, `%${query}%`),
        like(orders.customerName, `%${query}%`),
        like(orders.customerPhone, `%${query}%`),
      )
    : undefined;
  const serviceRows: LaundryService[] = await db
    .select({
      id: services.id,
      name: services.name,
      unit: services.unit,
      price: services.price,
    })
    .from(services)
    .orderBy(desc(services.createdAt));
  const [orderCount] = await db
    .select({ total: count(orders.id) })
    .from(orders)
    .where(orderWhere);
  const orderRows = await db.query.orders.findMany({
    where: orderWhere,
    orderBy: [desc(orders.createdAt)],
    limit: pageSize,
    offset,
    with: {
      items: { with: { service: true } },
    },
  });

  return {
    services: serviceRows,
    query,
    page,
    totalPages: getTotalPages(orderCount?.total ?? 0, pageSize),
    orders: orderRows.map(
      (order): LaundryOrder => ({
        id: order.id,
        invoiceNumber: order.invoiceNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerAddress: order.customerAddress,
        status: order.status,
        paymentStatus: order.paymentStatus,
        totalPrice: order.totalPrice,
        estimatedDoneAt: order.estimatedDoneAt,
        notes: order.notes,
        items: order.items.map(
          (item): LaundryOrderItem => ({
            serviceName: item.service.name,
          }),
        ),
      }),
    ),
  };
}

export default async function LaundryPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const currentUser = await requireUser();
  const data = await getLaundryData(await searchParams);

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
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Daftar order</CardTitle>
                <CardDescription>
                  Status cucian, pembayaran, dan estimasi selesai.
                </CardDescription>
              </div>
              <SearchForm
                action="/laundry"
                query={data.query}
                placeholder="Cari invoice, pelanggan, HP..."
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4 overflow-x-auto">
            {data.orders.length ? (
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
                        <OrderActions
                          order={order}
                          canDelete={currentUser.role === "admin"}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="rounded-md border p-4 text-sm text-muted-foreground">
                Data order tidak ditemukan.
              </p>
            )}
            <Pagination
              pathname="/laundry"
              query={data.query}
              page={data.page}
              totalPages={data.totalPages}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
