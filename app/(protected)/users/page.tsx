import { desc } from "drizzle-orm"
import { Trash2 } from "lucide-react"

import { createUser, deleteUser, updateUserRole } from "@/app/actions"
import {
  FieldInput,
  FieldSelect,
} from "@/app/(protected)/_components/form-fields"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { requireUser } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"

export default async function UsersPage() {
  const currentUser = await requireUser()
  const rows = await db.select().from(users).orderBy(desc(users.createdAt))

  if (currentUser.role !== "admin") {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-muted-foreground">
          Manajemen user hanya tersedia untuk admin.
        </CardContent>
      </Card>
    )
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
            <CardTitle>Daftar user</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rows.map((row) => (
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
            ))}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
