import type { HistoryEntry, SavedFilter } from "@/types/filter";

/**
 * Saved filters and analysis history live in browser storage, mirroring the
 * /api/filters and /api/history contracts in the FastAPI reference backend.
 */
const FILTERS_KEY = "smartfilter-saved-filters";
const HISTORY_KEY = "smartfilter-history";
const HISTORY_LIMIT = 50;

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, items: T[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const savedFilterService = {
  list: (): SavedFilter[] =>
    read<SavedFilter>(FILTERS_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at)),

  save(filter: SavedFilter): SavedFilter {
    const items = read<SavedFilter>(FILTERS_KEY).filter((item) => item.id !== filter.id);
    items.push(filter);
    write(FILTERS_KEY, items);
    return filter;
  },

  remove(id: string) {
    write(
      FILTERS_KEY,
      read<SavedFilter>(FILTERS_KEY).filter((item) => item.id !== id),
    );
  },
};

export const historyService = {
  list: (): HistoryEntry[] =>
    read<HistoryEntry>(HISTORY_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at)),

  add(entry: HistoryEntry): HistoryEntry {
    const items = [entry, ...read<HistoryEntry>(HISTORY_KEY)].slice(0, HISTORY_LIMIT);
    write(HISTORY_KEY, items);
    return entry;
  },

  remove(id: string) {
    write(
      HISTORY_KEY,
      read<HistoryEntry>(HISTORY_KEY).filter((item) => item.id !== id),
    );
  },

  clear() {
    write(HISTORY_KEY, []);
  },
};
