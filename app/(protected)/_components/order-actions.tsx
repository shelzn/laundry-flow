"use client";

import { Edit3, Trash2 } from "lucide-react";

import { deleteOrder, updateOrder } from "@/app/actions";
import { ConfirmSubmitButton } from "@/app/(protected)/_components/confirm-submit-button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { orderStatus } from "@/lib/laundry";

type OrderActionsOrder = {
  id: number;
  invoiceNumber: string;
  customerName: string;
  customerPhone: string | null;
  customerAddress: string | null;
  status: string;
  notes: string | null;
};

export function OrderActions({
  order,
  canDelete,
}: {
  order: OrderActionsOrder;
  canDelete: boolean;
}) {
  return (
    <div className="flex min-w-24 gap-2">
      <Dialog>
        <DialogTrigger asChild>
          <Button size="icon" variant="outline" aria-label="Edit order">
            <Edit3 className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit order</DialogTitle>
            <DialogDescription>{order.invoiceNumber}</DialogDescription>
          </DialogHeader>
          <form action={updateOrder} className="space-y-4">
            <input type="hidden" name="id" value={order.id} />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={`customerName-${order.id}`}>
                  Nama pelanggan
                </Label>
                <Input
                  id={`customerName-${order.id}`}
                  name="customerName"
                  defaultValue={order.customerName}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`customerPhone-${order.id}`}>Nomor HP</Label>
                <Input
                  id={`customerPhone-${order.id}`}
                  name="customerPhone"
                  defaultValue={order.customerPhone ?? ""}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select name="status" defaultValue={order.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {orderStatus.map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`customerAddress-${order.id}`}>Alamat</Label>
              <Textarea
                id={`customerAddress-${order.id}`}
                name="customerAddress"
                defaultValue={order.customerAddress ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`notes-${order.id}`}>Catatan</Label>
              <Textarea
                id={`notes-${order.id}`}
                name="notes"
                defaultValue={order.notes ?? ""}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Batal
                </Button>
              </DialogClose>
              <ConfirmSubmitButton
                type="submit"
                message="Simpan perubahan order ini?"
              >
                Simpan
              </ConfirmSubmitButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {canDelete ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="destructive" aria-label="Hapus order">
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus order?</AlertDialogTitle>
              <AlertDialogDescription>
                Order {order.invoiceNumber} akan dihapus bersama item dan
                riwayat pembayarannya.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <form action={deleteOrder}>
                <input type="hidden" name="id" value={order.id} />
                <AlertDialogAction type="submit" className="w-full">
                  Hapus
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
