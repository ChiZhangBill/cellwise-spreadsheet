import { createSheetFromRows } from "../data/mockSpreadsheet";
import type { SheetCell } from "../types";

export type SpreadsheetImportResult = {
  cells: SheetCell[];
  fileName: string;
  rowCount: number;
};

const supportedExtensions = [".csv", ".xlsx", ".xls"];

export async function importSpreadsheetFile(file: File): Promise<SpreadsheetImportResult> {
  const fileName = file.name;
  const extension = getFileExtension(fileName);

  if (!supportedExtensions.includes(extension)) {
    throw new Error("Please upload a .csv, .xlsx, or .xls spreadsheet file.");
  }

  const rows = extension === ".csv" ? await readCsvRows(file) : await readWorkbookRows(file);
  // Keep first 10 columns, but allow all rows
  const trimmedRows = rows.map((row) => row.slice(0, 10));

  if (trimmedRows.length === 0 || trimmedRows.every((row) => row.every((value) => !value))) {
    throw new Error("The selected spreadsheet did not contain readable values.");
  }

  return {
    cells: createSheetFromRows(trimmedRows),
    fileName,
    rowCount: trimmedRows.length,
  };
}

function getFileExtension(fileName: string) {
  const lastDotIndex = fileName.lastIndexOf(".");
  return lastDotIndex >= 0 ? fileName.slice(lastDotIndex).toLowerCase() : "";
}

async function readWorkbookRows(file: File): Promise<string[][]> {
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Array<string | number | boolean | null>>(worksheet, {
    blankrows: false,
    defval: "",
    header: 1,
  });

  return rows.map((row) => row.map((value) => String(value ?? "")));
}

async function readCsvRows(file: File): Promise<string[][]> {
  return parseCsv(await file.text());
}

function parseCsv(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let isInsideQuote = false;

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];
    const nextCharacter = csvText[index + 1];

    if (character === '"' && isInsideQuote && nextCharacter === '"') {
      currentCell += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      isInsideQuote = !isInsideQuote;
      continue;
    }

    if (character === "," && !isInsideQuote) {
      currentRow.push(currentCell.trim());
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !isInsideQuote) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentCell.trim());
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  currentRow.push(currentCell.trim());
  rows.push(currentRow);

  return rows.filter((row) => row.some((cell) => cell.length > 0));
}
