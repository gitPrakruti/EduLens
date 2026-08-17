import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/services/api";
import { authService, type Role } from "@/services/authService";

export const Route = createFileRoute("/signup")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Create Account — SmartFilter" },
      {
        name: "description",
        content: "Create a SmartFilter account as a teacher or HOD to start filtering student data.",
      },
      { property: "og:title", content: "Create Account — SmartFilter" },
      { property: "og:description", content: "Sign up for SmartFilter as a teacher or HOD." },
    ],
  }),
  component: SignupPage,
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "teacher" as Role,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const validate = () => {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next['name'] = "Please enter your full name.";
    if (!EMAIL_PATTERN.test(form.email.trim())) next['email'] = "Please enter a valid email address.";
    if (form.password.length < 8) next['password'] = "Password must be at least 8 characters.";
    if (form.password !== form.confirmPassword) next['confirmPassword'] = "Passwords do not match.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const user = await authService.signup({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });
      setUser(user);
      toast.success("Account created successfully.");
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setErrors({
        form: err instanceof ApiError ? err.message : "Unable to create your account right now.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="For teachers and HODs of the department."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Login
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <Field id="name" label="Full Name" error={errors['name']}>
          <Input
            id="name"
            value={form.name}
            autoComplete="name"
            onChange={(e) => update("name", e.target.value)}
          />
        </Field>

        <Field id="email" label="Email" error={errors['email']}>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="you@college.edu"
          />
        </Field>

        <Field id="password" label="Password" error={errors['password']}>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </Field>

        <Field id="confirmPassword" label="Confirm Password" error={errors['confirmPassword']}>
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
          />
        </Field>

        <div className="space-y-2">
          <Label htmlFor="role">Role</Label>
          <Select value={form.role} onValueChange={(value) => update("role", value)}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Select your role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="hod">HOD</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {errors['form'] && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {errors['form']}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account..." : "Create Account"}
        </Button>
      </form>
    </AuthLayout>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
