import { useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { columnIndexToLetter, columnLetterToIndex, sortedColumnLetters } from "../data/sheetMutations";
import type { SheetCell } from "../types";

type SelectionRange = {
  anchorId: string;
  focusId: string;
};

type SelectionBounds = {
  minCol: number;
  maxCol: number;
  minRow: number;
  maxRow: number;
};

export type SpreadsheetFocusRequest = {
  cellId: string;
  nonce: number;
  /** Row vs column emphasis after agent insert (default: row). */
  highlight?: "row" | "column";
};

type SpreadsheetGridProps = {
  cells: SheetCell[];
  onCellValueChange: (cellId: string, value: string) => void;
  focusRequest?: SpreadsheetFocusRequest | null;
  onFocusRequestComplete?: () => void;
};

export function SpreadsheetGrid({
  cells,
  onCellValueChange,
  focusRequest,
  onFocusRequestComplete,
}: SpreadsheetGridProps) {
  const [selectionRange, setSelectionRange] = useState<SelectionRange>({ anchorId: "A1", focusId: "A1" });
  const [formulaDraft, setFormulaDraft] = useState("");
  const [formulaError, setFormulaError] = useState<string | null>(null);
  const [flashRow, setFlashRow] = useState<number | null>(null);
  const [flashColumn, setFlashColumn] = useState<string | null>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const cellsRef = useRef(cells);
  cellsRef.current = cells;
  const dragAnchorIdRef = useRef<string | null>(null);
  const selectedCellId = selectionRange.focusId;
  const selectedCell = cells.find((cell) => cell.id === selectedCellId) ?? cells[0];
  const selectionBounds = useMemo(() => getSelectionBounds(selectionRange), [selectionRange]);
  const isRangeSelection = selectionRange.anchorId !== selectionRange.focusId;

  useEffect(() => {
    const endDrag = () => {
      dragAnchorIdRef.current = null;
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  const handleCellPointerDown = (cellId: string) => {
    dragAnchorIdRef.current = cellId;
    setSelectionRange({ anchorId: cellId, focusId: cellId });
  };

  const handleCellPointerEnter = (cellId: string) => {
    const anchor = dragAnchorIdRef.current;
    if (!anchor || anchor === cellId) {
      return;
    }
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    window.getSelection()?.removeAllRanges();
    setSelectionRange({ anchorId: anchor, focusId: cellId });
  };

  const activeColumns = useMemo(() => sortedColumnLetters(cells), [cells]);

  const cellsByRow = useMemo(() => {
    const rowCount = Math.max(20, ...cells.map((cell) => cell.row));

    return Array.from({ length: rowCount }, (_, rowIndex) => {
      const row = rowIndex + 1;
      const rowCells = cells.filter((cell) => cell.row === row);
      return activeColumns.map((column) => {
        const cell = rowCells.find((current) => current.column === column);
        if (cell) {
          return cell;
        }
        return {
          id: `${column}${row}`,
          column,
          row,
          value: "",
        } satisfies SheetCell;
      });
    });
  }, [cells, activeColumns]);

  useEffect(() => {
    if (!focusRequest) {
      return;
    }

    const match = cellsRef.current.find((cell) => cell.id === focusRequest.cellId);
    if (!match) {
      onFocusRequestComplete?.();
      return;
    }

    setSelectionRange({ anchorId: focusRequest.cellId, focusId: focusRequest.cellId });
    const emphasizeColumn = focusRequest.highlight === "column";
    setFlashRow(emphasizeColumn ? null : match.row);
    setFlashColumn(emphasizeColumn ? match.column : null);

    const scrollTimer = window.setTimeout(() => {
      document
        .querySelector<HTMLElement>(`[data-cell-id="${focusRequest.cellId}"]`)
        ?.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    }, 50);

    const clearFlashTimer = window.setTimeout(() => {
      setFlashRow(null);
      setFlashColumn(null);
      onFocusRequestComplete?.();
    }, 2100);

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearFlashTimer);
    };
  }, [focusRequest, onFocusRequestComplete]);

  useEffect(() => {
    setFormulaDraft(selectedCell?.value ?? "");
    setFormulaError(null);
  }, [selectedCell?.id, selectedCell?.value]);

  const handleFormulaButtonClick = () => {
    setFormulaDraft((current) => (current.trim().startsWith("=") ? current : "="));
    setFormulaError(null);
    requestAnimationFrame(() => formulaInputRef.current?.focus());
  };

  const handleFormulaTemplateClick = (templateName: FormulaTemplateName) => {
    if (!selectedCell) {
      return;
    }

    const rangeText = isRangeSelection
      ? selectionBoundsToAddress(selectionBounds)
      : getDefaultFormulaRange(selectedCell);
    setFormulaDraft(`=${templateName}(${rangeText})`);
    setFormulaError(null);
    requestAnimationFrame(() => formulaInputRef.current?.focus());
  };

  const applyFormulaDraft = () => {
    if (!selectedCell) {
      return;
    }

    const trimmedDraft = formulaDraft.trim();
    if (!trimmedDraft.startsWith("=")) {
      onCellValueChange(selectedCell.id, formulaDraft);
      setFormulaError(null);
      return;
    }

    const result = evaluateFormula(trimmedDraft, cells);
    if (result.ok) {
      onCellValueChange(selectedCell.id, result.value);
      setFormulaError(null);
    } else {
      setFormulaError(result.message);
    }
  };

  const handleFormulaKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyFormulaDraft();
    }

    if (event.key === "Escape") {
      setFormulaDraft(selectedCell?.value ?? "");
      setFormulaError(null);
      formulaInputRef.current?.blur();
    }
  };

  return (
    <div className="spreadsheet-shell">
      <div className="formula-bar" aria-label="Formula bar">
        <span className="name-box">
          {isRangeSelection ? selectionBoundsToAddress(selectionBounds) : (selectedCell?.id ?? "A1")}
        </span>
        <button
          className="formula-label"
          onClick={handleFormulaButtonClick}
          title="Insert a formula for the selected cell"
          type="button"
        >
          fx
        </button>
        <input
          aria-label={`Formula bar for ${selectedCell?.id ?? "selected cell"}`}
          className={`formula-value ${formulaError ? "error" : ""}`}
          onBlur={applyFormulaDraft}
          onChange={(event) => {
            setFormulaDraft(event.target.value);
            setFormulaError(null);
          }}
          onKeyDown={handleFormulaKeyDown}
          placeholder="Click fx to enter a formula, e.g. =SUM(E2:E6)"
          ref={formulaInputRef}
          value={formulaDraft}
        />
        {formulaError && <span className="formula-error">{formulaError}</span>}
        <div className="formula-templates" aria-label="Formula templates">
          {formulaTemplates.map((template) => (
            <button
              key={template}
              onClick={() => handleFormulaTemplateClick(template)}
              title={`Insert ${template} formula`}
              type="button"
            >
              {template}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-scroll-region">
        <div
          className="spreadsheet-grid"
          role="grid"
          aria-label="Mock finance spreadsheet"
          style={{ gridTemplateColumns: `54px repeat(${activeColumns.length}, minmax(92px, 1fr))` }}
        >
          <div className="corner-cell" />
          {activeColumns.map((column) => (
            <div
              className={`column-header ${selectedCell?.column === column ? "selected-header" : ""} ${
                flashColumn === column ? "sheet-region-flash" : ""
              }`}
              role="columnheader"
              key={column}
            >
              {column}
            </div>
          ))}

          {cellsByRow.map((rowCells, rowIndex) => {
            const row = rowIndex + 1;
            const isSelectedRow = selectedCell?.row === row;

            return (
              <div className="grid-row" role="row" key={row}>
                <div
                  className={`row-header ${isSelectedRow ? "selected-header" : ""} ${
                    flashRow === row ? "sheet-region-flash" : ""
                  }`}
                  role="rowheader"
                >
                  {row}
                </div>
                {rowCells.map((cell) => {
                  const inRange =
                    isRangeSelection && isCellInSelectionBounds(cell, selectionBounds);
                  return (
                    <div
                      className={`sheet-cell ${cell.variant ?? ""} ${
                        selectedCellId === cell.id ? "selected-cell" : ""
                      } ${inRange ? "range-selected" : ""} ${
                        flashRow === row || flashColumn === cell.column ? "sheet-region-flash" : ""
                      }`}
                      data-cell-id={cell.id}
                      role="gridcell"
                      key={cell.id}
                      aria-selected={selectedCellId === cell.id}
                      onPointerDown={() => handleCellPointerDown(cell.id)}
                      onPointerEnter={() => handleCellPointerEnter(cell.id)}
                    >
                      <input
                        aria-label={`${cell.id} value`}
                        onChange={(event) => onCellValueChange(cell.id, event.target.value)}
                        onFocus={() =>
                          setSelectionRange({ anchorId: cell.id, focusId: cell.id })
                        }
                        value={cell.value}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const formulaTemplates = ["SUM", "AVERAGE", "MIN", "MAX", "COUNT"] as const;

type FormulaTemplateName = (typeof formulaTemplates)[number];

type FormulaResult =
  | {
      ok: true;
      value: string;
    }
  | {
      ok: false;
      message: string;
    };

function evaluateFormula(formula: string, cells: SheetCell[]): FormulaResult {
  const expression = formula.slice(1).trim();

  if (!expression) {
    return { ok: false, message: "Enter a formula" };
  }

  const withFunctions = expression.replace(
    /\b(SUM|AVERAGE|AVG|MIN|MAX|COUNT)\(([^()]+)\)/gi,
    (_match, functionName: string, rawArgument: string) => {
      const values = getArgumentValues(rawArgument, cells);
      if (values.length === 0) {
        return "0";
      }

      const upperFunctionName = functionName.toUpperCase();
      if (upperFunctionName === "SUM") {
        return String(values.reduce((sum, value) => sum + value, 0));
      }

      if (upperFunctionName === "AVERAGE" || upperFunctionName === "AVG") {
        return String(values.reduce((sum, value) => sum + value, 0) / values.length);
      }

      if (upperFunctionName === "MIN") {
        return String(Math.min(...values));
      }

      if (upperFunctionName === "MAX") {
        return String(Math.max(...values));
      }

      return String(values.length);
    },
  );

  const withCellValues = withFunctions.replace(/\b([A-Z]+(?:[1-9]\d*))\b/gi, (_match, cellId: string) =>
    String(getNumericCellValue(cellId.toUpperCase(), cells)),
  );

  if (!/^[\d+\-*/().\s]+$/.test(withCellValues)) {
    return { ok: false, message: "Unsupported formula" };
  }

  try {
    const value = Function(`"use strict"; return (${withCellValues});`)();

    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, message: "Invalid result" };
    }

    return { ok: true, value: formatFormulaResult(value) };
  } catch {
    return { ok: false, message: "Check formula" };
  }
}

function getArgumentValues(rawArgument: string, cells: SheetCell[]) {
  return rawArgument
    .split(",")
    .flatMap((argument) => {
      const trimmedArgument = argument.trim();
      const rangeMatch = trimmedArgument.match(/^([A-Z]+(?:[1-9]\d*)):([A-Z]+(?:[1-9]\d*))$/i);

      if (rangeMatch) {
        return getRangeValues(rangeMatch[1].toUpperCase(), rangeMatch[2].toUpperCase(), cells);
      }

      if (/^[A-Z]+(?:[1-9]\d*)$/i.test(trimmedArgument)) {
        return [getNumericCellValue(trimmedArgument.toUpperCase(), cells)];
      }

      return [parseCellNumber(trimmedArgument)];
    })
    .filter((value) => Number.isFinite(value));
}

function getDefaultFormulaRange(selectedCell: SheetCell) {
  const startRow = Math.max(2, selectedCell.row - 2);
  const endRow = Math.max(startRow, selectedCell.row - 1);

  return `${selectedCell.column}${startRow}:${selectedCell.column}${endRow}`;
}

function getSelectionBounds(range: SelectionRange): SelectionBounds {
  const anchor = parseCellId(range.anchorId);
  const focus = parseCellId(range.focusId);
  return {
    minCol: Math.min(anchor.columnIndex, focus.columnIndex),
    maxCol: Math.max(anchor.columnIndex, focus.columnIndex),
    minRow: Math.min(anchor.row, focus.row),
    maxRow: Math.max(anchor.row, focus.row),
  };
}

function isCellInSelectionBounds(cell: SheetCell, bounds: SelectionBounds): boolean {
  const colIdx = columnLetterToIndex(cell.column);
  return (
    colIdx >= bounds.minCol &&
    colIdx <= bounds.maxCol &&
    cell.row >= bounds.minRow &&
    cell.row <= bounds.maxRow
  );
}

function selectionBoundsToAddress(bounds: SelectionBounds): string {
  const topLeft = `${columnIndexToLetter(bounds.minCol)}${bounds.minRow}`;
  const bottomRight = `${columnIndexToLetter(bounds.maxCol)}${bounds.maxRow}`;
  return `${topLeft}:${bottomRight}`;
}

function getRangeValues(startCellId: string, endCellId: string, cells: SheetCell[]) {
  const start = parseCellId(startCellId);
  const end = parseCellId(endCellId);
  const minColumn = Math.min(start.columnIndex, end.columnIndex);
  const maxColumn = Math.max(start.columnIndex, end.columnIndex);
  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  return cells
    .filter((cell) => {
      const parsedCell = parseCellId(cell.id);
      return (
        parsedCell.columnIndex >= minColumn &&
        parsedCell.columnIndex <= maxColumn &&
        parsedCell.row >= minRow &&
        parsedCell.row <= maxRow
      );
    })
    .map((cell) => parseCellNumber(cell.value))
    .filter((value) => Number.isFinite(value));
}

function getNumericCellValue(cellId: string, cells: SheetCell[]) {
  const cell = cells.find((currentCell) => currentCell.id === cellId);
  return parseCellNumber(cell?.value ?? "");
}

function parseCellId(cellId: string) {
  const match = cellId.toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) {
    return {
      columnIndex: 0,
      row: 1,
    };
  }

  return {
    columnIndex: columnLetterToIndex(match[1]),
    row: Number(match[2]),
  };
}

function parseCellNumber(value: string) {
  const multiplier = value.trim().endsWith("B") ? 1000 : 1;
  const normalizedValue = value
    .replace(/[$,%xMB]/gi, "")
    .replace(/,/g, "")
    .trim();

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue * multiplier : 0;
}

function formatFormulaResult(value: number) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)));
}
