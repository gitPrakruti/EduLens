import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/services/api";
import { authService } from "@/services/authService";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Login — SmartFilter" },
      { name: "description", content: "Log in to SmartFilter to filter and manage student data." },
      { property: "og:title", content: "Login — SmartFilter" },
      { property: "og:description", content: "Log in to your SmartFilter account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const user = await authService.login({ email: email.trim().toLowerCase(), password });
      setUser(user);
      toast.success(`Welcome back, ${user.name}.`);
      void navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to log in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Log in"
      subtitle="Access your datasets, filters and analysis history."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Create Account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@college.edu"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </Button>
      </form>
    </AuthLayout>
  );
}
