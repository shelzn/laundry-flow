import { count, desc, eq, like, or } from "drizzle-orm";
import { Printer } from "lucide-react";
import Link from "next/link";

import {
  Pagination,
  SearchForm,
} from "@/app/(protected)/_components/list-controls";
import { PaymentForm } from "@/app/(protected)/_components/payment-form";
import { Button } from "@/components/ui/button";
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
import { db } from "@/lib/db";
import { orders, payments } from "@/lib/db/schema";
import { rupiah, shortDate } from "@/lib/laundry";
import {
  getListParams,
  getTotalPages,
  type PageSearchParams,
} from "@/lib/pagination";

type PaymentOrderOption = {
  id: number;
  invoiceNumber: string;
  customerName: string;
  totalPrice: string;
  paidAmount: string;
  paymentStatus: string;
};

type PaymentHistoryRow = {
  id: number;
  amount: string;
  method: string;
  paidAt: Date;
  order: {
    invoiceNumber: string;
    customerName: string;
  };
};

export default async function PembayaranPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const { query, page, pageSize, offset } = getListParams(await searchParams);
  const paymentWhere = query
    ? or(
        like(orders.invoiceNumber, `%${query}%`),
        like(orders.customerName, `%${query}%`),
        like(payments.method, `%${query}%`),
      )
    : undefined;
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
    .limit(50);
  const [paymentCount] = await db
    .select({ total: count(payments.id) })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(paymentWhere);
  const paymentRows = await db
    .select({
      id: payments.id,
      amount: payments.amount,
      method: payments.method,
      paidAt: payments.paidAt,
      invoiceNumber: orders.invoiceNumber,
      customerName: orders.customerName,
    })
    .from(payments)
    .innerJoin(orders, eq(payments.orderId, orders.id))
    .where(paymentWhere)
    .orderBy(desc(payments.paidAt))
    .limit(pageSize)
    .offset(offset);
  const historyRows: PaymentHistoryRow[] = paymentRows.map(
    (payment): PaymentHistoryRow => ({
      id: payment.id,
      amount: payment.amount,
      method: payment.method,
      paidAt: payment.paidAt,
      order: {
        invoiceNumber: payment.invoiceNumber,
        customerName: payment.customerName,
      },
    }),
  );
  const totalPages = getTotalPages(paymentCount?.total ?? 0, pageSize);

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
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <CardTitle>Riwayat pembayaran</CardTitle>
                <SearchForm
                  action="/pembayaran"
                  query={query}
                  placeholder="Cari invoice, pelanggan..."
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 overflow-x-auto">
              {historyRows.length ? (
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
              ) : (
                <p className="rounded-md border p-4 text-sm text-muted-foreground">
                  Riwayat pembayaran tidak ditemukan.
                </p>
              )}
              <Pagination
                pathname="/pembayaran"
                query={query}
                page={page}
                totalPages={totalPages}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
