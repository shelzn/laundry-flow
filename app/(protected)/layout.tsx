import { AppShell } from "@/app/(protected)/_components/app-shell"
import { requireUser } from "@/lib/auth"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await requireUser()

  return <AppShell currentUser={currentUser}>{children}</AppShell>
}
