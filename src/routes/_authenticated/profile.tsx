import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Mail, ShieldCheck, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { datasetService } from "@/services/datasetService";
import { historyService, savedFilterService } from "@/services/filterService";

export const Route = createFileRoute("/_authenticated/profile")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Profile — SmartFilter" },
      { name: "description", content: "Your SmartFilter account details, role and workspace activity." },
      { property: "og:title", content: "Profile — SmartFilter" },
      { property: "og:description", content: "Review your account details and workspace activity." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ datasets: 0, filters: 0, runs: 0 });

  useEffect(() => {
    setCounts({
      datasets: datasetService.list().length,
      filters: savedFilterService.list().length,
      runs: historyService.list().length,
    });
  }, []);

  if (!user) return null;

  const details = [
    { label: "Full name", value: user.name, icon: UserIcon },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Role", value: user.role === "hod" ? "Head of Department" : "Teacher", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold md:text-3xl">Profile</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your account details and workspace activity.</p>
      </div>

      <section className="surface-card p-6">
        <div className="flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-full bg-secondary text-lg font-bold text-secondary-foreground">
            {user.name.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          {details.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-md border border-border p-4">
              <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                <Icon className="size-3.5" aria-hidden />
                {label}
              </dt>
              <dd className="mt-2 break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 text-xs text-muted-foreground">
          Member since {new Date(user.created_at).toLocaleDateString()}
        </p>
      </section>

      <section className="surface-card p-6">
        <h2 className="text-lg font-bold">Workspace activity</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Datasets", value: counts.datasets },
            { label: "Saved filters", value: counts.filters },
            { label: "Analyses run", value: counts.runs },
          ].map((item) => (
            <div key={item.label} className="rounded-md border border-border p-4">
              <p className="text-sm text-muted-foreground">{item.label}</p>
              <p className="mt-2 text-2xl font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <Button
        variant="outline"
        onClick={() => {
          logout();
          void navigate({ to: "/login", replace: true });
        }}
      >
        <LogOut className="size-4" aria-hidden />
        Log out
      </Button>
    </div>
  );
}
