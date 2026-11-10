"use client";

import { useActionState } from "react";
import { CircleAlertIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/reui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action}>
      {/* Trang định mở trước khi bị chuyển sang đăng nhập (rà soát A2 lỗi 4); server kiểm tra lại */}
      <input type="hidden" name="next" value={next} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" name="email" type="email" required autoFocus autoComplete="username" defaultValue={state.email} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">Mật khẩu</FieldLabel>
          <Input id="password" name="password" type="password" required autoComplete="current-password" />
        </Field>
        {state.error && (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Đang kiểm tra…" : "Đăng nhập"}
        </Button>
      </FieldGroup>
    </form>
  );
}
