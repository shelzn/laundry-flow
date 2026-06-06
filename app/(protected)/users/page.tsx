import { count, desc, like, or } from "drizzle-orm";
import { Trash2 } from "lucide-react";

import {
  Pagination,
  SearchForm,
} from "@/app/(protected)/_components/list-controls";
import { createUser, deleteUser, updateUserRole } from "@/app/actions";
import {
  FieldInput,
  FieldSelect,
} from "@/app/(protected)/_components/form-fields";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  getListParams,
  getTotalPages,
  type PageSearchParams,
} from "@/lib/pagination";

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}) {
  const currentUser = await requireUser();
  const { query, page, pageSize, offset } = getListParams(await searchParams);
  const userWhere = query
    ? or(like(users.name, `%${query}%`), like(users.email, `%${query}%`))
    : undefined;
  const [rowCount] = await db
    .select({ total: count(users.id) })
    .from(users)
    .where(userWhere);
  const rows = await db
    .select()
    .from(users)
    .where(userWhere)
    .orderBy(desc(users.createdAt))
    .limit(pageSize)
    .offset(offset);
  const totalPages = getTotalPages(rowCount?.total ?? 0, pageSize);

  if (currentUser.role !== "admin") {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Manajemen user hanya tersedia untuk admin.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div>
        <h2 className="text-xl font-semibold">User</h2>
        <p className="text-sm text-muted-foreground">
          Kelola akun admin dan staff outlet.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>User baru</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createUser} className="space-y-4">
              <FieldInput name="name" label="Nama" required />
              <FieldInput name="email" label="Email" type="email" required />
              <FieldInput
                name="password"
                label="Password"
                type="password"
                minLength={8}
                required
              />
              <FieldSelect
                name="role"
                label="Role"
                placeholder="Staff"
                items={[
                  ["staff", "Staff"],
                  ["admin", "Admin"],
                ]}
              />
              <Button className="w-full">Simpan user</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <CardTitle>Daftar user</CardTitle>
              <SearchForm
                action="/users"
                query={query}
                placeholder="Cari nama atau email..."
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.length ? (
              rows.map((row) => (
                <form
                  key={row.id}
                  action={updateUserRole}
                  className="grid items-center gap-3 rounded-md border p-3 md:grid-cols-[1fr_1fr_120px_auto]"
                >
                  <input type="hidden" name="id" value={row.id} />
                  <div>
                    <p className="font-medium">{row.name}</p>
                    <p className="text-sm text-muted-foreground">{row.email}</p>
                  </div>
                  <Badge variant={row.role === "admin" ? "default" : "outline"}>
                    {row.role}
                  </Badge>
                  <Select name="role" defaultValue={row.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button variant="outline">Update</Button>
                    {row.id !== currentUser.id ? (
                      <Button
                        formAction={deleteUser}
                        variant="destructive"
                        size="icon"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </form>
              ))
            ) : (
              <p className="rounded-md border p-4 text-sm text-muted-foreground">
                Data user tidak ditemukan.
              </p>
            )}
            <Pagination
              pathname="/users"
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
