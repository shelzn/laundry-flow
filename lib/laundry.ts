export const orderStatus = [
  ["new", "Baru"],
  ["processing", "Proses"],
  ["washing", "Dicuci"],
  ["ironing", "Disetrika"],
  ["ready", "Siap ambil"],
  ["completed", "Selesai"],
  ["cancelled", "Batal"],
] as const

export const paymentStatus = {
  unpaid: "Belum bayar",
  partial: "DP",
  paid: "Lunas",
} as const

export function rupiah(value: number | string | null | undefined) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0))
}

export function shortDate(value: Date | null) {
  if (!value) return "-"

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}

export function orderStatusLabel(value: string) {
  return orderStatus.find(([key]) => key === value)?.[1] ?? value
}

export function paymentStatusLabel(value: string) {
  return paymentStatus[value as keyof typeof paymentStatus] ?? value
}
