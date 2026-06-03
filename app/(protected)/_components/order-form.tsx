"use client"

import { useMemo, useState } from "react"
import { Plus } from "lucide-react"

import { createOrder } from "@/app/actions"
import {
  FieldInput,
  FieldSelect,
  FieldTextarea,
} from "@/app/(protected)/_components/form-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { rupiah } from "@/lib/laundry"

export type OrderFormService = {
  id: number
  name: string
  unit: "kg" | "item"
  price: string
}

export function OrderForm({ services }: { services: OrderFormService[] }) {
  const [serviceId, setServiceId] = useState("")
  const [quantity, setQuantity] = useState("")

  const selectedService = services.find(
    (service) => String(service.id) === serviceId
  )
  const total = useMemo(() => {
    const parsedQuantity = Number(quantity)

    if (
      !selectedService ||
      !Number.isFinite(parsedQuantity) ||
      parsedQuantity <= 0
    ) {
      return 0
    }

    return Number(selectedService.price) * parsedQuantity
  }, [quantity, selectedService])

  return (
    <form action={createOrder} className="space-y-4">
      <FieldInput name="customerName" label="Nama pelanggan" required />
      <FieldInput name="customerPhone" label="Nomor HP" />
      <FieldTextarea name="customerAddress" label="Alamat" />
      <FieldSelect
        name="serviceId"
        label="Layanan"
        placeholder="Pilih layanan"
        value={serviceId}
        onValueChange={setServiceId}
        items={services.map((item) => [
          String(item.id),
          `${item.name} - ${rupiah(item.price)}/${item.unit}`,
        ])}
      />
      <FieldInput
        name="quantity"
        label="Berat/jumlah"
        type="number"
        step="0.01"
        required
        value={quantity}
        onChange={(event) => setQuantity(event.target.value)}
      />
      <Card className="bg-muted/40 shadow-none">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium">Jumlah yang harus dibayar</p>
            <p className="text-xs text-muted-foreground">
              Otomatis dari harga layanan dikali berat/jumlah.
            </p>
          </div>
          <p className="text-lg font-semibold">{rupiah(total)}</p>
        </CardContent>
      </Card>
      <FieldTextarea name="notes" label="Catatan" />
      <Button className="w-full gap-2">
        <Plus className="size-4" />
        Simpan order
      </Button>
    </form>
  )
}
