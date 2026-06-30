"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type MidtransAction = {
  name?: string
  url?: string
}

type CreateTransactionResponse = {
  midtransOrderId: string
  transaction: {
    actions?: MidtransAction[]
    qr_string?: string
    transaction_status?: string
  }
}

type TransactionStatusResponse = {
  paymentId?: number | null
  transaction: {
    transaction_status?: string
    fraud_status?: string
  }
}

type QrisPaymentPanelProps = {
  orderId: number
  invoiceNumber: string
  disabled: boolean
}

function isPaidStatus(status?: string, fraudStatus?: string) {
  if (status === "settlement") return true

  return status === "capture" && (!fraudStatus || fraudStatus === "accept")
}

export function QrisPaymentPanel({
  orderId,
  invoiceNumber,
  disabled,
}: QrisPaymentPanelProps) {
  const router = useRouter()
  const hasRequested = useRef(false)
  const isCheckingRef = useRef(false)
  const [transaction, setTransaction] =
    useState<CreateTransactionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(!disabled)
  const [isChecking, setIsChecking] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [error, setError] = useState("")
  const midtransOrderId = transaction?.midtransOrderId

  const qrCodeUrl = useMemo(() => {
    return transaction?.transaction.actions?.find(
      (action) => action.name === "generate-qr-code",
    )?.url
  }, [transaction])

  useEffect(() => {
    if (disabled || hasRequested.current) return

    hasRequested.current = true

    async function createTransaction() {
      setIsLoading(true)
      setError("")

      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentType: "qris" }),
        })
        const data = (await response.json()) as
          | CreateTransactionResponse
          | { message?: string }

        if (!response.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Gagal membuat transaksi QRIS.",
          )
        }

        setTransaction(data as CreateTransactionResponse)
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal membuat transaksi QRIS.",
        )
      } finally {
        setIsLoading(false)
      }
    }

    void createTransaction()
  }, [disabled, orderId])

  const checkStatus = useCallback(
    async (showLoading = true) => {
      if (!midtransOrderId || isCheckingRef.current) return

      isCheckingRef.current = true
      if (showLoading) setIsChecking(true)
      setError("")

      try {
        const response = await fetch(
          `/api/transactions/${encodeURIComponent(midtransOrderId)}`,
        )
        const data = (await response.json()) as
          | TransactionStatusResponse
          | { message?: string }

        if (!response.ok) {
          throw new Error(
            "message" in data && data.message
              ? data.message
              : "Gagal mengecek status pembayaran.",
          )
        }

        const result = data as TransactionStatusResponse
        const status = result.transaction
        const paid = isPaidStatus(
          status.transaction_status,
          status.fraud_status,
        )

        setIsPaid(paid)

        if (paid && result.paymentId) {
          router.push(`/pembayaran/${result.paymentId}`)
        }
      } catch (err) {
        if (showLoading) {
          setError(
            err instanceof Error
              ? err.message
              : "Gagal mengecek status pembayaran.",
          )
        }
      } finally {
        isCheckingRef.current = false
        if (showLoading) setIsChecking(false)
      }
    },
    [midtransOrderId, router],
  )

  useEffect(() => {
    if (!midtransOrderId || isPaid) return

    const interval = window.setInterval(() => {
      void checkStatus(false)
    }, 3000)

    return () => window.clearInterval(interval)
  }, [checkStatus, isPaid, midtransOrderId])

  if (disabled) {
    return (
      <div className="rounded-md border p-4 text-sm text-muted-foreground">
        Invoice ini sudah tidak memiliki sisa tagihan.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex aspect-square w-full items-center justify-center rounded-md border text-sm text-muted-foreground">
          Membuat QRIS...
        </div>
      ) : qrCodeUrl ? (
        <div className="rounded-md border p-4">
          <Image
            src={qrCodeUrl}
            alt={`QRIS invoice ${invoiceNumber}`}
            width={320}
            height={320}
            unoptimized
            className="mx-auto aspect-square w-full max-w-xs"
          />
        </div>
      ) : (
        <div className="rounded-md border p-4 text-sm text-muted-foreground">
          QRIS belum tersedia.
        </div>
      )}

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {isPaid ? (
        <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700">
          Pembayaran sudah diterima. Riwayat pembayaran akan diperbarui dari
          callback Midtrans.
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          disabled={!transaction || isChecking}
          onClick={() => void checkStatus()}
        >
          {isChecking ? "Mengecek..." : "Cek status"}
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/pembayaran">Kembali</Link>
        </Button>
      </div>
    </div>
  )
}
