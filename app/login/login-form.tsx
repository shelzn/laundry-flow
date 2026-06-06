"use client";

import { useActionState } from "react";
import { AlertCircle } from "lucide-react";

import { loginWithState } from "@/app/actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginWithState, {
    error: "",
  });

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertTitle>Login gagal</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      <Button className="w-full" disabled={pending}>
        {pending ? "Memeriksa..." : "Masuk"}
      </Button>
    </form>
  );
}
