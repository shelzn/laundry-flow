"use client"

import { useEffect } from "react"
import { Printer } from "lucide-react"

import { Button } from "@/components/ui/button"
import { rupiah, shortDate } from "@/lib/laundry"

export type ReceiptPayment = {
  id: number
  amount: string
  method: "cash" | "transfer" | "qris"
  paidAt: Date | string
  order: {
    invoiceNumber: string
    customerName: string
    totalPrice: string
    paidAmount: string
    items?: {
      serviceName: string
      quantity: string
      unit: "kg" | "item"
      price: string
      subtotal: string
    }[]
  }
}

export function ReceiptPrinter({
  payment,
  autoPrint = false,
}: {
  payment: ReceiptPayment
  autoPrint?: boolean
}) {
  useEffect(() => {
    if (!autoPrint) return

    const timeout = window.setTimeout(() => window.print(), 350)
    return () => window.clearTimeout(timeout)
  }, [autoPrint])

  const remaining =
    Number(payment.order.totalPrice) - Number(payment.order.paidAmount)

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="gap-2"
        onClick={() => window.print()}
      >
        <Printer className="size-4" />
        Print struk
      </Button>

      <section className="print-receipt receipt-paper mx-auto overflow-hidden border border-black bg-white text-[12px] text-black shadow-sm">
        <div className="border-b border-black px-3 py-3 text-center">
          <div className="mx-auto mb-1.5 flex size-8 items-center justify-center rounded-full border border-black text-sm font-bold">
            LF
          </div>
          <p className="text-sm font-semibold tracking-wide">LaundryFlow</p>
          <p className="text-xs text-black">Outlet utama</p>
        </div>

        <div className="space-y-3 p-3">
          <div className="border border-dashed border-black p-2.5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-wide text-black uppercase">
                  Invoice
                </p>
                <p className="font-semibold">{payment.order.invoiceNumber}</p>
              </div>
              <div className="border border-black px-2 py-1 text-xs font-medium">
                {payment.method.toUpperCase()}
              </div>
            </div>
            <div className="space-y-1 text-[11px]">
              <Row label="Pelanggan" value={payment.order.customerName} />
              <Row
                label="Tanggal"
                value={shortDate(new Date(payment.paidAt))}
              />
            </div>
          </div>

          {payment.order.items?.length ? (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-black uppercase">
                Rincian layanan
              </p>
              <div className="space-y-1.5">
                {payment.order.items.map((item) => (
                  <div key={item.serviceName} className="text-[11px]">
                    <div className="flex justify-between gap-3">
                      <span className="font-medium">{item.serviceName}</span>
                      <span className="font-medium">
                        {rupiah(item.subtotal)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex justify-between gap-3 text-black">
                      <span>
                        {Number(item.quantity).toLocaleString("id-ID")}{" "}
                        {item.unit}
                      </span>
                      <span>
                        {rupiah(item.price)}/{item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="border-t border-dashed border-black pt-3">
            <div className="space-y-1 text-[11px]">
              <Row
                label="Total tagihan"
                value={rupiah(payment.order.totalPrice)}
              />
              <Row label="Pembayaran" value={rupiah(payment.amount)} />
              <Row
                label="Sisa tagihan"
                value={rupiah(Math.max(0, remaining))}
              />
            </div>
            <div className="mt-2.5 border border-black px-2.5 py-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs tracking-wide uppercase">Status</span>
                <span className="font-semibold">
                  {remaining <= 0 ? "Lunas" : "Sebagian"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-dashed border-black pt-3 text-center">
            <p className="text-xs font-medium">Terima kasih.</p>
            <p className="mt-1 text-[11px] leading-relaxed text-black">
              Simpan struk ini sebagai bukti pembayaran resmi.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-black">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  )
}
