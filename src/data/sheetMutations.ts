import type { SheetCell } from "../types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function columnLetterToIndex(letter: string): number {
  const upper = letter.toUpperCase();
  if (!/^[A-Z]+$/.test(upper)) {
    return -1;
  }
  let index = 0;
  for (const char of upper) {
    index = index * 26 + (LETTERS.indexOf(char) + 1);
  }
  return index - 1;
}

export function columnIndexToLetter(index: number): string {
  if (index < 0) {
    return "A";
  }
  let result = "";
  let n = index;
  while (n >= 0) {
    result = LETTERS[n % 26] + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
}

export function parseCellAddress(cellId: string): { column: string; row: number } | null {
  const match = cellId.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return null;
  }
  return { column: match[1], row: Number(match[2]) };
}

export function sortedColumnLetters(cells: SheetCell[]): string[] {
  const maxIndex = cells.reduce((max, cell) => Math.max(max, columnLetterToIndex(cell.column)), -1);
  const count = Math.max(10, maxIndex + 1);
  return Array.from({ length: count }, (_, index) => columnIndexToLetter(index));
}

function maxRowFromCells(cells: SheetCell[]): number {
  return cells.reduce((max, cell) => Math.max(max, cell.row), 1);
}

export function insertRowAfter(cells: SheetCell[], anchorRow: number): SheetCell[] {
  const safeAnchor = Math.max(1, anchorRow);
  const bumped = cells.map((cell) => {
    if (cell.row <= safeAnchor) {
      return cell;
    }
    const nextRow = cell.row + 1;
    return {
      ...cell,
      row: nextRow,
      id: `${cell.column}${nextRow}`,
    };
  });

  const newRow = safeAnchor + 1;
  const columns = sortedColumnLetters(bumped);
  const newCells: SheetCell[] = columns.map((column, columnIndex) => ({
    id: `${column}${newRow}`,
    column,
    row: newRow,
    value: "",
    variant: undefined,
  }));

  return [...bumped, ...newCells];
}

export function insertColumnAfter(cells: SheetCell[], anchorColumn: string): SheetCell[] {
  const anchorIdx = Math.max(0, columnLetterToIndex(anchorColumn.toUpperCase()));
  const insertIdx = anchorIdx + 1;
  const maxRow = maxRowFromCells(cells);

  const bumped = cells.map((cell) => {
    const colIdx = columnLetterToIndex(cell.column);
    if (colIdx < insertIdx) {
      return cell;
    }
    const nextIdx = colIdx + 1;
    const nextLetter = columnIndexToLetter(nextIdx);
    return {
      ...cell,
      column: nextLetter,
      id: `${nextLetter}${cell.row}`,
    };
  });

  const letter = columnIndexToLetter(insertIdx);
  const newCells: SheetCell[] = [];
  for (let row = 1; row <= maxRow; row += 1) {
    newCells.push({
      id: `${letter}${row}`,
      column: letter,
      row,
      value: "",
      variant: undefined,
    });
  }

  return [...bumped, ...newCells];
}
