"use client";

import { useRef, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function ConfirmSubmitButton({
  message,
  children,
  onClick,
  ...props
}: React.ComponentProps<typeof Button> & {
  message: string;
}) {
  const [open, setOpen] = useState(false);
  const confirmedRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <Button
        {...props}
        ref={buttonRef}
        onClick={(event) => {
          if (!confirmedRef.current) {
            event.preventDefault();
            setOpen(true);
            return;
          }

          confirmedRef.current = false;
          onClick?.(event);
        }}
      >
        {children}
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi aksi</AlertDialogTitle>
          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              confirmedRef.current = true;
              setOpen(false);
              window.setTimeout(() => {
                buttonRef.current?.click();
              }, 0);
            }}
          >
            Lanjutkan
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
