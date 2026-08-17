import { createFileRoute } from "@tanstack/react-router";
import { Download, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { notesService } from "@/services/notesService";

export const Route = createFileRoute("/_authenticated/notepad")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Notepad — SmartFilter" },
      { name: "description", content: "Keep quick notes about students, shortlists and follow-up actions." },
      { property: "og:title", content: "Notepad — SmartFilter" },
      { property: "og:description", content: "Private teacher notes that save automatically as you type." },
    ],
  }),
  component: NotepadPage,
});

function NotepadPage() {
  const [content, setContent] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const note = notesService.get();
    setContent(note.content);
    setSavedAt(note.content ? note.updated_at : null);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const note = notesService.save(content);
      setSavedAt(note.updated_at);
      setDirty(false);
    }, 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [content, dirty]);

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "smartfilter-notes.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    notesService.clear();
    setContent("");
    setSavedAt(null);
    setDirty(false);
    toast.success("Notes cleared.");
  };

  const words = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold md:text-3xl">Notepad</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Jot down shortlists, follow-ups or reminders. Everything saves automatically.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownload} disabled={!content.trim()}>
            <Download className="size-4" aria-hidden />
            Download
          </Button>
          <Button variant="ghost" onClick={handleClear} disabled={!content}>
            <Trash2 className="size-4" aria-hidden />
            Clear
          </Button>
        </div>
      </div>

      <div className="surface-card p-4">
        <Textarea
          value={content}
          onChange={(event) => {
            setContent(event.target.value);
            setDirty(true);
          }}
          placeholder="Students to contact, notes from the last review meeting, anything you like..."
          className="min-h-[420px] resize-y border-0 bg-transparent text-sm leading-relaxed shadow-none focus-visible:ring-0"
          aria-label="Your notes"
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span>
            {words} {words === 1 ? "word" : "words"} · {content.length} characters
          </span>
          <span>
            {dirty
              ? "Saving..."
              : savedAt
                ? `Saved ${new Date(savedAt).toLocaleString()}`
                : "Nothing saved yet"}
          </span>
        </div>
      </div>
    </div>
  );
}
