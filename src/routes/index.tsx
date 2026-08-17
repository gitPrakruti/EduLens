import { Link, createFileRoute } from "@tanstack/react-router";
import { Filter, Table2, Save } from "lucide-react";

import { Brand } from "@/components/Brand";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartFilter — Dynamic Student Data Filtering System" },
      {
        name: "description",
        content:
          "Import student data, create flexible filtering rules, and instantly identify the students you need.",
      },
      { property: "og:title", content: "SmartFilter — Dynamic Student Data Filtering System" },
      {
        property: "og:description",
        content:
          "Departmental student-data filtering for college teachers and HODs. Works with any Excel dataset.",
      },
    ],
  }),
  component: Landing,
});

const highlights = [
  {
    icon: Table2,
    title: "Any spreadsheet",
    body: "Paste from Excel or upload a file. SmartFilter reads your columns automatically — nothing is fixed in advance.",
  },
  {
    icon: Filter,
    title: "Plain-language filters",
    body: "Choose a column, a condition and a value. Combine rules with AND or OR. No formulas, no technical knowledge.",
  },
  {
    icon: Save,
    title: "Saved for later",
    body: "Keep your datasets, reuse frequent filters, revisit past analyses and jot down notes in one place.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Brand />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild>
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link to="/signup">Create Account</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Department of AI &amp; Data Science
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">SmartFilter</h1>
            <p className="mt-3 font-serif text-lg text-muted-foreground md:text-xl">
              Dynamic Student Data Filtering System
            </p>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground">
              Import student data, create flexible filtering rules, and instantly identify the
              students you need.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/signup">Create Account</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-8 px-6 py-16 md:grid-cols-3">
            {highlights.map(({ icon: Icon, title, body }) => (
              <article key={title}>
                <Icon className="size-5 text-primary" aria-hidden />
                <h2 className="mt-4 text-lg font-bold">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-8">
        <p className="mx-auto max-w-6xl px-6 text-sm text-muted-foreground">
          SmartFilter · Department of AI &amp; Data Science
        </p>
      </footer>
    </div>
  );
}
