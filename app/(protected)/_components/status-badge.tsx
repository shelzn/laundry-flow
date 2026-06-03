import { Badge } from "@/components/ui/badge"
import { orderStatusLabel, paymentStatusLabel } from "@/lib/laundry"

export function StatusBadge({ value }: { value: string }) {
  const done = value === "paid" || value === "completed" || value === "ready"

  return (
    <Badge variant={done ? "default" : "outline"}>
      {paymentStatusLabel(value) !== value
        ? paymentStatusLabel(value)
        : orderStatusLabel(value)}
    </Badge>
  )
}
