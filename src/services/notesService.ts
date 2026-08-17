/**
 * Teacher notepad. Stored in browser storage, mirroring the /api/notes
 * contract in the FastAPI reference backend.
 */
const NOTES_KEY = "smartfilter-notes";

export type Note = {
  content: string;
  updated_at: string;
};

export const notesService = {
  get(): Note {
    if (typeof window === "undefined") return { content: "", updated_at: new Date().toISOString() };
    try {
      const raw = window.localStorage.getItem(NOTES_KEY);
      if (!raw) return { content: "", updated_at: new Date().toISOString() };
      return JSON.parse(raw) as Note;
    } catch {
      return { content: "", updated_at: new Date().toISOString() };
    }
  },

  save(content: string): Note {
    const note: Note = { content, updated_at: new Date().toISOString() };
    window.localStorage.setItem(NOTES_KEY, JSON.stringify(note));
    return note;
  },

  clear() {
    window.localStorage.removeItem(NOTES_KEY);
  },
};
