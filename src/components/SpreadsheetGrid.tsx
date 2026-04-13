import { useMemo, useState } from "react";
import { sheetColumns } from "../data/mockSpreadsheet";
import type { SheetCell } from "../types";

type SpreadsheetGridProps = {
  cells: SheetCell[];
  onCellValueChange: (cellId: string, value: string) => void;
};

export function SpreadsheetGrid({ cells, onCellValueChange }: SpreadsheetGridProps) {
  const [selectedCellId, setSelectedCellId] = useState("A1");
  const selectedCell = cells.find((cell) => cell.id === selectedCellId) ?? cells[0];

  const cellsByRow = useMemo(
    () =>
      Array.from({ length: 20 }, (_, rowIndex) => {
        const row = rowIndex + 1;
        return cells.filter((cell) => cell.row === row);
      }),
    [cells],
  );

  return (
    <div className="spreadsheet-shell">
      <div className="formula-bar" aria-label="Formula bar">
        <span className="name-box">{selectedCell?.id ?? "A1"}</span>
        <span className="formula-label">fx</span>
        <span className="formula-value">{selectedCell?.value || "Select a cell to edit"}</span>
      </div>

      <div className="grid-scroll-region">
        <div className="spreadsheet-grid" role="grid" aria-label="Mock finance spreadsheet">
          <div className="corner-cell" />
          {sheetColumns.map((column) => (
            <div
              className={`column-header ${selectedCell?.column === column ? "selected-header" : ""}`}
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
                <div className={`row-header ${isSelectedRow ? "selected-header" : ""}`} role="rowheader">
                  {row}
                </div>
                {rowCells.map((cell) => (
                  <div
                    className={`sheet-cell ${cell.variant ?? ""} ${
                      selectedCellId === cell.id ? "selected-cell" : ""
                    }`}
                    role="gridcell"
                    key={cell.id}
                    aria-selected={selectedCellId === cell.id}
                  >
                    <input
                      aria-label={`${cell.id} value`}
                      onChange={(event) => onCellValueChange(cell.id, event.target.value)}
                      onFocus={() => setSelectedCellId(cell.id)}
                      onPointerDown={() => setSelectedCellId(cell.id)}
                      value={cell.value}
                    />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
