import { desc } from "drizzle-orm"
import { Trash2 } from "lucide-react"

import { createService, deleteService, updateService } from "@/app/actions"
import {
  FieldInput,
  FieldSelect,
  FieldTextarea,
} from "@/app/(protected)/_components/form-fields"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { services } from "@/lib/db/schema"

export default async function LayananPage() {
  const currentUser = await requireUser()
  const rows = await db
    .select()
    .from(services)
    .orderBy(desc(services.createdAt))

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">Layanan</h2>
        <p className="text-sm text-muted-foreground">
          Atur paket laundry, satuan, harga, dan estimasi pengerjaan.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Layanan baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createService} className="space-y-4">
              <FieldInput name="name" label="Nama layanan" required />
              <FieldInput name="price" label="Harga" type="number" required />
              <FieldInput
                name="estimatedHours"
                label="Estimasi jam"
                type="number"
                defaultValue={48}
              />
              <FieldSelect
                name="unit"
                label="Unit"
                placeholder="kg"
                items={[
                  ["kg", "Kg"],
                  ["item", "Item"],
                ]}
              />
              <FieldTextarea name="description" label="Deskripsi" />
              <Button className="w-full">Simpan layanan</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daftar layanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.map((row) => (
              <form
                key={row.id}
                action={updateService}
                className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_120px_100px_100px_auto]"
              >
                <input type="hidden" name="id" value={row.id} />
                <Input name="name" defaultValue={row.name} />
                <Input
                  name="price"
                  type="number"
                  defaultValue={Number(row.price)}
                />
                <Input
                  name="estimatedHours"
                  type="number"
                  defaultValue={row.estimatedHours}
                />
                <Select name="unit" defaultValue={row.unit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kg</SelectItem>
                    <SelectItem value="item">Item</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button variant="outline">Update</Button>
                  {currentUser.role === "admin" ? (
                    <Button
                      formAction={deleteService}
                      variant="destructive"
                      size="icon"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  ) : null}
                </div>
              </form>
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
