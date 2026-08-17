import type { DataRow } from "@/types/dataset";

export type ParsedTable = { headers: string[]; rows: DataRow[] };

function normaliseHeaders(raw: unknown[]): string[] {
  const seen = new Map<string, number>();
  return raw.map((value, index) => {
    let name = String(value ?? "").trim();
    if (!name) name = `Column ${index + 1}`;
    const count = seen.get(name.toLowerCase()) ?? 0;
    seen.set(name.toLowerCase(), count + 1);
    return count === 0 ? name : `${name} (${count + 1})`;
  });
}

function detectDelimiter(line: string): string {
  if (line.includes("\t")) return "\t";
  const commas = (line.match(/,/g) ?? []).length;
  const semis = (line.match(/;/g) ?? []).length;
  if (semis > commas) return ";";
  if (commas > 0) return ",";
  return /\s{2,}/.test(line) ? "\u0000MULTISPACE" : "\t";
}

function splitLine(line: string, delimiter: string): string[] {
  if (delimiter === "\u0000MULTISPACE") return line.split(/\s{2,}/);
  if (delimiter !== ",") return line.split(delimiter);
  // Comma with basic quote support.
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(current);
      current = "";
    } else current += char;
  }
  cells.push(current);
  return cells;
}

/** Parses pasted spreadsheet text (tab, comma, semicolon or multi-space separated). */
export function parsePastedTable(text: string): ParsedTable {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter((line) => line.trim() !== "");
  if (lines.length < 2) {
    throw new Error("Paste at least a header row and one student row.");
  }

  const delimiter = detectDelimiter(lines[0]!);
  const headers = normaliseHeaders(splitLine(lines[0]!, delimiter).map((cell) => cell.trim()));

  const rows: DataRow[] = lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter);
    const row: DataRow = {};
    headers.forEach((header, index) => {
      const cell = (cells[index] ?? "").trim().replace(/^"|"$/g, "");
      row[header] = cell === "" ? null : cell;
    });
    return row;
  });

  return { headers, rows };
}

/** Converts a sheet matrix (array of arrays) into headers + rows. */
export function matrixToTable(matrix: unknown[][]): ParsedTable {
  const usable = matrix.filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""));
  if (usable.length < 2) {
    throw new Error("The sheet needs a header row and at least one student row.");
  }
  const headers = normaliseHeaders(usable[0]!);
  const rows: DataRow[] = usable.slice(1).map((cells) => {
    const row: DataRow = {};
    headers.forEach((header, index) => {
      const cell = cells[index];
      if (cell === undefined || cell === null || String(cell).trim() === "") row[header] = null;
      else if (typeof cell === "number" || typeof cell === "boolean") row[header] = cell;
      else row[header] = String(cell).trim();
    });
    return row;
  });
  return { headers, rows };
}
