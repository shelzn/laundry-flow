"use client"

import { useMemo, useState } from "react"

import { addPayment } from "@/app/actions"
import { FieldSelect } from "@/app/(protected)/_components/form-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { rupiah } from "@/lib/laundry"

export type PaymentFormOrder = {
  id: number
  invoiceNumber: string
  customerName: string
  totalPrice: string
  paidAmount: string
}

export function PaymentForm({ orders }: { orders: PaymentFormOrder[] }) {
  const [orderId, setOrderId] = useState("")
  const selectedOrder = orders.find((order) => String(order.id) === orderId)
  const remainingAmount = useMemo(() => {
    if (!selectedOrder) return 0

    return Math.max(
      0,
      Number(selectedOrder.totalPrice) - Number(selectedOrder.paidAmount)
    )
  }, [selectedOrder])

  return (
    <form action={addPayment} className="space-y-4">
      <FieldSelect
        name="orderId"
        label="Invoice"
        placeholder="Pilih invoice"
        value={orderId}
        onValueChange={setOrderId}
        items={orders.map((order) => [
          String(order.id),
          `${order.invoiceNumber} - ${order.customerName}`,
        ])}
      />
      <div className="space-y-2">
        <Label htmlFor="amount">Nominal</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          value={remainingAmount || ""}
          readOnly
          required
        />
        <p className="text-xs text-muted-foreground">
          {selectedOrder
            ? `Sisa tagihan: ${rupiah(remainingAmount)}`
            : "Pilih invoice untuk mengisi nominal otomatis."}
        </p>
      </div>
      <FieldSelect
        name="method"
        label="Metode"
        placeholder="Tunai"
        items={[
          ["cash", "Tunai"],
          ["transfer", "Transfer"],
          ["qris", "QRIS"],
        ]}
      />
      <Button
        className="w-full"
        disabled={!selectedOrder || remainingAmount <= 0}
      >
        Catat pembayaran
      </Button>
    </form>
  )
}
