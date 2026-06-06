import "server-only";

import { count, desc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { orderItems, orders, services, users } from "@/lib/db/schema";
import { firstParam } from "@/lib/pagination";

export type ReportSearchParams = {
  start?: string | string[];
  end?: string | string[];
};

export type ReportFilters = {
  start: string;
  end: string;
  startDate: Date;
  endExclusive: Date;
};

export type ReportRow = {
  id: number;
  invoiceNumber: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  totalPrice: string;
  paidAmount: string;
  createdAt: Date;
  userName: string;
  servicesText: string;
};

function inputDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function dateFromInput(value: string, fallback: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return fallback;

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

export function getReportFilters(searchParams?: ReportSearchParams) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const startInput = firstParam(searchParams?.start) ?? inputDate(firstDay);
  const endInput = firstParam(searchParams?.end) ?? inputDate(today);
  const startDate = dateFromInput(startInput, firstDay);
  const endDate = dateFromInput(endInput, today);
  const endExclusive = new Date(endDate);
  endExclusive.setDate(endExclusive.getDate() + 1);

  return {
    start: inputDate(startDate),
    end: inputDate(endDate),
    startDate,
    endExclusive,
  };
}

export async function getReportData(filters: ReportFilters) {
  const dateWhere = sql`${orders.createdAt} >= ${filters.startDate} and ${orders.createdAt} < ${filters.endExclusive}`;
  const [stats] = await db
    .select({
      totalOrders: count(orders.id),
      totalSales: sql<string>`coalesce(sum(${orders.totalPrice}), 0)`,
      totalPaid: sql<string>`coalesce(sum(${orders.paidAmount}), 0)`,
      totalOutstanding: sql<string>`coalesce(sum(${orders.totalPrice} - ${orders.paidAmount}), 0)`,
    })
    .from(orders)
    .where(dateWhere);

  const rows: ReportRow[] = await db
    .select({
      id: orders.id,
      invoiceNumber: orders.invoiceNumber,
      customerName: orders.customerName,
      status: orders.status,
      paymentStatus: orders.paymentStatus,
      totalPrice: orders.totalPrice,
      paidAmount: orders.paidAmount,
      createdAt: orders.createdAt,
      userName: users.name,
      servicesText: sql<string>`coalesce(group_concat(distinct ${services.name} separator ', '), '-')`,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .leftJoin(services, eq(orderItems.serviceId, services.id))
    .where(dateWhere)
    .groupBy(
      orders.id,
      orders.invoiceNumber,
      orders.customerName,
      orders.status,
      orders.paymentStatus,
      orders.totalPrice,
      orders.paidAmount,
      orders.createdAt,
      users.name,
    )
    .orderBy(desc(orders.createdAt));

  return {
    stats: {
      totalOrders: stats?.totalOrders ?? 0,
      totalSales: stats?.totalSales ?? "0",
      totalPaid: stats?.totalPaid ?? "0",
      totalOutstanding: stats?.totalOutstanding ?? "0",
    },
    rows,
  };
}
