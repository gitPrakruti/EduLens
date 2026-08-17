import { Link, Outlet, createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Database,
  Filter,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  NotebookPen,
  Plus,
  SlidersHorizontal,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthenticatedLayout,
});

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/import", label: "New Analysis", icon: Plus },
  { to: "/datasets", label: "My Datasets", icon: Database },
  { to: "/filter", label: "Filter Students", icon: SlidersHorizontal },
  { to: "/saved-filters", label: "Saved Filters", icon: Filter },
  { to: "/history", label: "History", icon: History },
  { to: "/notepad", label: "Notepad", icon: NotebookPen },
] as const;

function AuthenticatedLayout() {
  const { user, status, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    if (status === "anonymous") void navigate({ to: "/login", replace: true });
  }, [status, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (status !== "authenticated" || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading your workspace...</p>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    void navigate({ to: "/login", replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="border-b border-sidebar-border px-5 py-5">
        <Brand />
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Main">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          to="/profile"
          className="flex items-center gap-3 rounded-md px-3 py-2 transition-colors hover:bg-sidebar-accent/60"
        >
          <span className="flex size-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <UserIcon className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-medium">{user.name}</span>
            <span className="block text-xs capitalize text-muted-foreground">{user.role}</span>
          </span>
        </Link>
        <Button variant="ghost" className="mt-1 w-full justify-start gap-3" onClick={handleLogout}>
          <LogOut className="size-4" aria-hidden />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:px-8">
          <div className="flex items-center gap-2">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                {sidebar}
              </SheetContent>
            </Sheet>
            <span className="font-serif text-base font-bold md:hidden">SmartFilter</span>
          </div>
          <ThemeToggle />
        </header>

        <main className="flex-1 px-4 py-8 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
