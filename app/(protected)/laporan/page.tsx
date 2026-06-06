import { FileText, FileSpreadsheet } from "lucide-react";
import Link from "next/link";

import { ReportDateRangePicker } from "@/app/(protected)/_components/report-date-range-picker";
import { StatusBadge } from "@/app/(protected)/_components/status-badge";
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
import {
  orderStatusLabel,
  paymentStatusLabel,
  rupiah,
  shortDate,
} from "@/lib/laundry";
import {
  getReportData,
  getReportFilters,
  type ReportSearchParams,
} from "@/lib/reports";

function exportHref(start: string, end: string) {
  const params = new URLSearchParams({ start, end });
  return `/laporan/export?${params.toString()}`;
}

function pdfHref(start: string, end: string) {
  const params = new URLSearchParams({ start, end });
  return `/laporan/pdf?${params.toString()}`;
}

export default async function LaporanPage({
  searchParams,
}: {
  searchParams?: Promise<ReportSearchParams>;
}) {
  const filters = getReportFilters(await searchParams);
  const data = await getReportData(filters);
  const statCards = [
    ["Total order", data.stats.totalOrders],
    ["Omzet", rupiah(data.stats.totalSales)],
    ["Terbayar", rupiah(data.stats.totalPaid)],
    ["Sisa tagihan", rupiah(data.stats.totalOutstanding)],
  ];

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Laporan</h2>
          <p className="text-sm text-muted-foreground">
            Rekap transaksi laundry berdasarkan tanggal order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href={exportHref(filters.start, filters.end)}>
              <FileSpreadsheet className="size-4" />
              Export Excel
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2">
            <Link href={pdfHref(filters.start, filters.end)}>
              <FileText className="size-4" />
              Export PDF
            </Link>
          </Button>
        </div>
      </div>

      <Card className="no-print">
        <CardHeader>
          <CardTitle>Filter laporan</CardTitle>
          <CardDescription>
            Pilih rentang tanggal yang ingin dicetak.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            action="/laporan"
            method="get"
            className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
          >
            <ReportDateRangePicker start={filters.start} end={filters.end} />
            <Button type="submit">Terapkan</Button>
          </form>
        </CardContent>
      </Card>

      <section className="print-report space-y-6">
        <div className="hidden print:block">
          <h1 className="text-2xl font-semibold">Laporan LaundryFlow</h1>
          <p className="text-sm">
            Periode {filters.start} sampai {filters.end}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map(([label, value]) => (
            <Card key={label}>
              <CardHeader className="pb-3">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
              </CardHeader>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detail transaksi</CardTitle>
            <CardDescription>
              {data.rows.length} transaksi pada periode ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {data.rows.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Pelanggan</TableHead>
                    <TableHead>Layanan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bayar</TableHead>
                    <TableHead>Kasir</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Terbayar</TableHead>
                    <TableHead className="text-right">Sisa</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{shortDate(row.createdAt)}</TableCell>
                      <TableCell className="font-medium">
                        {row.invoiceNumber}
                      </TableCell>
                      <TableCell>{row.customerName}</TableCell>
                      <TableCell>{row.servicesText}</TableCell>
                      <TableCell>
                        <span className="print:hidden">
                          <StatusBadge value={row.status} />
                        </span>
                        <span className="hidden print:inline">
                          {orderStatusLabel(row.status)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="print:hidden">
                          <StatusBadge value={row.paymentStatus} />
                        </span>
                        <span className="hidden print:inline">
                          {paymentStatusLabel(row.paymentStatus)}
                        </span>
                      </TableCell>
                      <TableCell>{row.userName}</TableCell>
                      <TableCell className="text-right">
                        {rupiah(row.totalPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {rupiah(row.paidAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {rupiah(
                          Number(row.totalPrice) - Number(row.paidAmount),
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="rounded-md border p-4 text-sm text-muted-foreground">
                Tidak ada transaksi pada periode ini.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
