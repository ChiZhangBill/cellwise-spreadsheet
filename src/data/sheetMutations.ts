import type { SheetCell } from "../types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function columnLetterToIndex(letter: string): number {
  const upper = letter.toUpperCase();
  if (upper.length !== 1) {
    return LETTERS.indexOf(upper[0] ?? "A");
  }
  return LETTERS.indexOf(upper);
}

export function columnIndexToLetter(index: number): string {
  if (index < 0 || index >= LETTERS.length) {
    return "A";
  }
  return LETTERS[index] ?? "A";
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
  return Array.from({ length: count }, (_, index) => LETTERS[index] ?? "A");
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
