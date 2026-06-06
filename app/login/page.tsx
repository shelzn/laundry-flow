import { LoginForm } from "@/app/login/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) redirect("/");

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
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}
