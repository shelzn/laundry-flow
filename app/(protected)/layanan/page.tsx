import { count, desc, like, or } from "drizzle-orm";
import { Trash2 } from "lucide-react";

import {
  Pagination,
  SearchForm,
} from "@/app/(protected)/_components/list-controls";
import { ConfirmSubmitButton } from "@/app/(protected)/_components/confirm-submit-button";
import { createService, deleteService, updateService } from "@/app/actions";
import {
  FieldInput,
  FieldSelect,
  FieldTextarea,
} from "@/app/(protected)/_components/form-fields";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { services } from "@/lib/db/schema";
import {
  getListParams,
  getTotalPages,
  type PageSearchParams,
} from "@/lib/pagination";

export default async function LayananPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const currentUser = await requireUser();
  const { query, page, pageSize, offset } = getListParams(await searchParams);
  const serviceWhere = query
    ? or(
        like(services.name, `%${query}%`),
        like(services.description, `%${query}%`),
      )
    : undefined;
  const [rowCount] = await db
    .select({ total: count(services.id) })
    .from(services)
    .where(serviceWhere);
  const rows = await db
    .select()
    .from(services)
    .where(serviceWhere)
    .orderBy(desc(services.createdAt))
    .limit(pageSize)
    .offset(offset);
  const totalPages = getTotalPages(rowCount?.total ?? 0, pageSize);

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
              <FieldInput
                name="price"
                label="Harga"
                type="number"
                min={1}
                required
              />
              <FieldInput
                name="estimatedHours"
                label="Estimasi jam"
                type="number"
                min={1}
                defaultValue={48}
                required
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
              <ConfirmSubmitButton
                className="w-full"
                message="Simpan layanan baru?"
              >
                Simpan layanan
              </ConfirmSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Daftar layanan</CardTitle>
              <SearchForm
                action="/layanan"
                query={query}
                placeholder="Cari layanan..."
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {rows.length ? (
              rows.map((row) => (
                <form
                  key={row.id}
                  action={updateService}
                  className="grid gap-3 rounded-md border p-3 md:grid-cols-[1fr_120px_100px_100px_auto]"
                >
                  <input type="hidden" name="id" value={row.id} />
                  <Input name="name" defaultValue={row.name} required />
                  <Input
                    name="price"
                    type="number"
                    min={1}
                    defaultValue={Number(row.price)}
                    required
                  />
                  <Input
                    name="estimatedHours"
                    type="number"
                    min={1}
                    defaultValue={row.estimatedHours}
                    required
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
                    <ConfirmSubmitButton
                      variant="outline"
                      message="Update layanan ini?"
                    >
                      Update
                    </ConfirmSubmitButton>
                    {currentUser.role === "admin" ? (
                      <ConfirmSubmitButton
                        formAction={deleteService}
                        variant="destructive"
                        size="icon"
                        message="Hapus layanan ini?"
                      >
                        <Trash2 className="size-4" />
                      </ConfirmSubmitButton>
                    ) : null}
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-md border p-4 text-sm text-muted-foreground">
                Data layanan tidak ditemukan.
              </p>
            )}
            <Pagination
              pathname="/layanan"
              query={query}
              page={page}
              totalPages={totalPages}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
