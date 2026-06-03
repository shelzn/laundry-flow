import Link from "next/link"

import { login } from "@/app/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) redirect("/")

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Masuk LaundryFlow</CardTitle>
          <CardDescription>
            Gunakan akun admin atau staff outlet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={login} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button className="w-full">Masuk</Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Belum ada akun?{" "}
            <Link
              className="font-medium text-foreground underline"
              href="/register"
            >
              Buat akun pertama
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
