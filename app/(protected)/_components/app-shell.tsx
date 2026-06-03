import Link from "next/link"
import {
  CreditCard,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Shirt,
  Sparkles,
  UserCog,
} from "lucide-react"

import { logout } from "@/app/actions"
import { Button } from "@/components/ui/button"
import type { CurrentUser } from "@/lib/auth"

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Buat Laundry", href: "/laundry", icon: ReceiptText },
  { label: "Layanan", href: "/layanan", icon: Sparkles },
  { label: "Pembayaran", href: "/pembayaran", icon: CreditCard },
  { label: "User", href: "/users", icon: UserCog },
]

export function AppShell({
  children,
  currentUser,
}: {
  children: React.ReactNode
  currentUser: CurrentUser
}) {
  return (
    <main className="min-h-svh bg-muted/30">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-background lg:block">
        <div className="flex h-16 items-center gap-3 border-b px-6">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Shirt className="size-5" />
          </div>
          <div>
            <p className="leading-none font-semibold">LaundryFlow</p>
            <p className="text-xs text-muted-foreground">Outlet utama</p>
          </div>
        </div>
        <nav className="space-y-1 p-4 text-sm">
          {navItems.map((item) => (
            <Button
              key={item.href + item.label}
              asChild
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Link href={item.href}>
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </Button>
          ))}
        </nav>
      </aside>

      <section className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 md:px-6">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold md:text-xl">LaundryFlow</h1>
              <p className="truncate text-sm text-muted-foreground">
                Selamat datang, {currentUser.name}
              </p>
            </div>
            <form action={logout}>
              <Button variant="outline" className="gap-2">
                <LogOut className="size-4" />
                Keluar
              </Button>
            </form>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <Button
                key={item.href + item.label}
                asChild
                variant="ghost"
                size="sm"
                className="shrink-0 gap-2"
              >
                <Link href={item.href}>
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </header>
        <div className="space-y-6 p-4 md:p-6">{children}</div>
      </section>
    </main>
  )
}
