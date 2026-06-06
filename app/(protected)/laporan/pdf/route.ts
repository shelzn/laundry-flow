import PDFDocument from "pdfkit/js/pdfkit.standalone.js";

import { requireUser } from "@/lib/auth";
import {
  orderStatusLabel,
  paymentStatusLabel,
  rupiah,
  shortDate,
} from "@/lib/laundry";
import { getReportData, getReportFilters } from "@/lib/reports";

function pdfBuffer(doc: PDFKit.PDFDocument) {
  return new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    doc.end();
  });
}

function drawRow(
  doc: PDFKit.PDFDocument,
  values: string[],
  widths: number[],
  y: number,
  options: { bold?: boolean } = {},
) {
  let x = doc.page.margins.left;
  const rowHeight = 24;

  doc.font(options.bold ? "Helvetica-Bold" : "Helvetica").fontSize(8);
  values.forEach((value, index) => {
    doc.rect(x, y, widths[index], rowHeight).stroke("#d1d5db");
    doc.text(value, x + 4, y + 6, {
      width: widths[index] - 8,
      height: rowHeight - 8,
      ellipsis: true,
    });
    x += widths[index];
  });

  return y + rowHeight;
}

export async function GET(request: Request) {
  await requireUser();

  const { searchParams } = new URL(request.url);
  const filters = getReportFilters({
    start: searchParams.get("start") ?? undefined,
    end: searchParams.get("end") ?? undefined,
  });
  const data = await getReportData(filters);
  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margin: 36,
    info: {
      Title: `Daftar Order LaundryFlow ${filters.start} - ${filters.end}`,
      Author: "LaundryFlow",
    },
  });

  doc.font("Helvetica-Bold").fontSize(18).text("Daftar Order LaundryFlow");
  doc
    .font("Helvetica")
    .fontSize(10)
    .text(`Berdasarkan tanggal order: ${filters.start} sampai ${filters.end}`);
  doc.moveDown();

  const summaryY = doc.y;
  const summaryWidths = [110, 140, 140, 140];
  drawRow(
    doc,
    ["Total Order", "Omzet", "Terbayar", "Sisa Tagihan"],
    summaryWidths,
    summaryY,
    { bold: true },
  );
  drawRow(
    doc,
    [
      String(data.stats.totalOrders),
      rupiah(data.stats.totalSales),
      rupiah(data.stats.totalPaid),
      rupiah(data.stats.totalOutstanding),
    ],
    summaryWidths,
    summaryY + 24,
  );

  let y = summaryY + 64;
  const headers = [
    "Tanggal",
    "Invoice",
    "Pelanggan",
    "Layanan",
    "Status",
    "Bayar",
    "Total",
    "Terbayar",
    "Sisa",
  ];
  const widths = [82, 95, 92, 120, 70, 70, 80, 80, 80];

  y = drawRow(doc, headers, widths, y, { bold: true });

  for (const row of data.rows) {
    if (y > doc.page.height - doc.page.margins.bottom - 28) {
      doc.addPage();
      y = doc.page.margins.top;
      y = drawRow(doc, headers, widths, y, { bold: true });
    }

    y = drawRow(
      doc,
      [
        shortDate(row.createdAt),
        row.invoiceNumber,
        row.customerName,
        row.servicesText,
        orderStatusLabel(row.status),
        paymentStatusLabel(row.paymentStatus),
        rupiah(row.totalPrice),
        rupiah(row.paidAmount),
        rupiah(Number(row.totalPrice) - Number(row.paidAmount)),
      ],
      widths,
      y,
    );
  }

  const buffer = await pdfBuffer(doc);
  const filename = `laporan-${filters.start}-${filters.end}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
