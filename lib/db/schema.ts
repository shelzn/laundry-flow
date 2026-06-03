import { relations, sql } from "drizzle-orm"
import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core"

export const userRole = mysqlEnum("role", ["admin", "staff"])

export const orderStatus = mysqlEnum("status", [
  "new",
  "processing",
  "washing",
  "ironing",
  "ready",
  "completed",
  "cancelled",
])

export const paymentStatus = mysqlEnum("payment_status", [
  "unpaid",
  "partial",
  "paid",
])

export const serviceUnit = mysqlEnum("unit", ["kg", "item"])

export const paymentMethod = mysqlEnum("method", ["cash", "transfer", "qris"])

export const users = mysqlTable("users", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 191 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: userRole.notNull().default("staff"),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .onUpdateNow(),
})

export const services = mysqlTable("services", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description"),
  unit: serviceUnit.notNull().default("kg"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  estimatedHours: int("estimated_hours").notNull().default(48),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .onUpdateNow(),
})

export const orders = mysqlTable("orders", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 40 }).notNull().unique(),
  customerName: varchar("customer_name", { length: 120 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 30 }),
  customerAddress: text("customer_address"),
  userId: int("user_id", { unsigned: true })
    .notNull()
    .references(() => users.id),
  status: orderStatus.notNull().default("new"),
  paymentStatus: paymentStatus.notNull().default("unpaid"),
  totalPrice: decimal("total_price", { precision: 12, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 })
    .notNull()
    .default(sql`0`),
  notes: text("notes"),
  estimatedDoneAt: timestamp("estimated_done_at", { mode: "date" }),
  completedAt: timestamp("completed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" })
    .notNull()
    .defaultNow()
    .onUpdateNow(),
})

export const orderItems = mysqlTable("order_items", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  orderId: int("order_id", { unsigned: true })
    .notNull()
    .references(() => orders.id),
  serviceId: int("service_id", { unsigned: true })
    .notNull()
    .references(() => services.id),
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
})

export const payments = mysqlTable("payments", {
  id: int("id", { unsigned: true }).autoincrement().primaryKey(),
  orderId: int("order_id", { unsigned: true })
    .notNull()
    .references(() => orders.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  method: paymentMethod.notNull().default("cash"),
  paidAt: timestamp("paid_at", { mode: "date" }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
})

export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
}))

export const servicesRelations = relations(services, ({ many }) => ({
  orderItems: many(orderItems),
}))

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
  payments: many(payments),
}))

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  service: one(services, {
    fields: [orderItems.serviceId],
    references: [services.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}))
