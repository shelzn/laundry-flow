"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

function parseDate(value: string) {
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function inputDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function displayDate(value: Date | undefined) {
  if (!value) return "Pilih tanggal";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(value);
}

function ReportDatePicker({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(parseDate(value));

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={date ? inputDate(date) : value} />
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start gap-2 text-left font-normal"
          >
            <CalendarIcon className="size-4" />
            {displayDate(date)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            onSelect={(nextDate) => {
              if (!nextDate) return;

              setDate(nextDate);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ReportDateRangePicker({
  start,
  end,
}: {
  start: string;
  end: string;
}) {
  return (
    <>
      <ReportDatePicker label="Dari tanggal" name="start" value={start} />
      <ReportDatePicker label="Sampai tanggal" name="end" value={end} />
    </>
  );
}
