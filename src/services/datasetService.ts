import type { Dataset } from "@/types/dataset";

/**
 * Datasets are kept in browser storage so the workspace works without the
 * FastAPI server running. The shape matches the /api/datasets contract in
 * backend/app/routers/datasets.py, so swapping to apiRequest is a one-liner.
 */
const KEY = "smartfilter-datasets";
const ACTIVE_KEY = "smartfilter-active-dataset";

function readAll(): Dataset[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Dataset[]) : [];
  } catch {
    return [];
  }
}

function writeAll(datasets: Dataset[]) {
  window.localStorage.setItem(KEY, JSON.stringify(datasets));
}

export const datasetService = {
  list: (): Dataset[] => readAll().sort((a, b) => b.created_at.localeCompare(a.created_at)),

  get: (id: string): Dataset | null => readAll().find((dataset) => dataset.id === id) ?? null,

  save(dataset: Dataset): Dataset {
    const datasets = readAll().filter((existing) => existing.id !== dataset.id);
    datasets.push(dataset);
    writeAll(datasets);
    return dataset;
  },

  remove(id: string) {
    writeAll(readAll().filter((dataset) => dataset.id !== id));
    if (datasetService.getActiveId() === id) window.localStorage.removeItem(ACTIVE_KEY);
  },

  setActiveId(id: string) {
    window.localStorage.setItem(ACTIVE_KEY, id);
  },

  getActiveId(): string | null {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(ACTIVE_KEY);
  },
};

export function createDatasetId(): string {
  return `ds_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
