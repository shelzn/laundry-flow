import ExcelJS from "exceljs";

import { requireUser } from "@/lib/auth";
import { orderStatusLabel, paymentStatusLabel } from "@/lib/laundry";
import { getReportData, getReportFilters } from "@/lib/reports";

export async function GET(request: Request) {
  await requireUser();

  const { searchParams } = new URL(request.url);
  const filters = getReportFilters({
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
  });
  const data = await getReportData(filters);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "LaundryFlow";
  workbook.created = new Date();

  const detailSheet = workbook.addWorksheet("Daftar Order");
  detailSheet.columns = [
    { header: "Tanggal", key: "createdAt", width: 20 },
    { header: "Invoice", key: "invoiceNumber", width: 22 },
    { header: "Pelanggan", key: "customerName", width: 24 },
    { header: "Layanan", key: "servicesText", width: 28 },
    { header: "Status", key: "status", width: 16 },
    { header: "Bayar", key: "paymentStatus", width: 16 },
    { header: "Kasir", key: "userName", width: 20 },
    { header: "Total", key: "totalPrice", width: 16 },
    { header: "Terbayar", key: "paidAmount", width: 16 },
    { header: "Sisa", key: "remaining", width: 16 },
  ];
  detailSheet.addRows(
    data.rows.map((row) => ({
      createdAt: row.createdAt,
      invoiceNumber: row.invoiceNumber,
      customerName: row.customerName,
      servicesText: row.servicesText,
      status: orderStatusLabel(row.status),
      paymentStatus: paymentStatusLabel(row.paymentStatus),
      userName: row.userName,
      totalPrice: Number(row.totalPrice),
      paidAmount: Number(row.paidAmount),
      remaining: Number(row.totalPrice) - Number(row.paidAmount),
    })),
  );

  const summarySheet = workbook.addWorksheet("Ringkasan");
  summarySheet.columns = [
    { header: "Periode", key: "period", width: 28 },
    { header: "Total Order", key: "totalOrders", width: 14 },
    { header: "Omzet", key: "totalSales", width: 18 },
    { header: "Terbayar", key: "totalPaid", width: 18 },
    { header: "Sisa Tagihan", key: "totalOutstanding", width: 18 },
  ];
  summarySheet.addRow({
    period: `${filters.start} s/d ${filters.end}`,
    totalOrders: data.stats.totalOrders,
    totalSales: Number(data.stats.totalSales),
    totalPaid: Number(data.stats.totalPaid),
    totalOutstanding: Number(data.stats.totalOutstanding),
  });

  for (const sheet of [summarySheet, detailSheet]) {
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1F2937" },
    };
    sheet.getRow(1).alignment = { vertical: "middle", horizontal: "center" };
    sheet.views = [{ state: "frozen", ySplit: 1 }];
  }

  summarySheet.getColumn("C").numFmt = '"Rp"#,##0';
  summarySheet.getColumn("D").numFmt = '"Rp"#,##0';
  summarySheet.getColumn("E").numFmt = '"Rp"#,##0';
  detailSheet.getColumn("A").numFmt = "dd mmm yyyy hh:mm";
  detailSheet.getColumn("H").numFmt = '"Rp"#,##0';
  detailSheet.getColumn("I").numFmt = '"Rp"#,##0';
  detailSheet.getColumn("J").numFmt = '"Rp"#,##0';

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `laporan-${filters.start}-${filters.end}.xlsx`;

  return new Response(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
