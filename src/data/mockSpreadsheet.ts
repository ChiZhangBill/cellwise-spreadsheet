import type { SheetCell } from "../types";

const columns = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

const mockRows: string[][] = [
  ["Company", "Sector", "Revenue", "YoY Growth", "EBITDA", "EBITDA Margin", "EV", "EV/EBITDA", "Rule of 40", "Signal"],
  ["CareCloud", "Healthcare IT", "$128M", "18.4%", "$24M", "18.8%", "$312M", "13.0x", "37.2%", "Watch margin"],
  ["MedLedger", "Healthcare IT", "$214M", "24.1%", "$51M", "23.8%", "$842M", "16.5x", "47.9%", "Attractive"],
  ["FinSight", "Fintech", "$306M", "15.2%", "$68M", "22.2%", "$1.18B", "17.4x", "37.4%", "Fair value"],
  ["ClaimPilot", "Healthcare IT", "$96M", "31.7%", "$14M", "14.6%", "$266M", "19.0x", "46.3%", "High growth"],
  ["RetailMetric", "Commerce", "$185M", "8.9%", "$37M", "20.0%", "$407M", "11.0x", "28.9%", "Low growth"],
  ["LabBridge", "Healthcare IT", "$151M", "12.6%", "$33M", "21.9%", "$429M", "13.0x", "34.5%", "Stable"],
  ["DataHarbor", "Analytics", "$244M", "27.5%", "$42M", "17.2%", "$861M", "20.5x", "44.7%", "Multiple risk"],
  ["PharmaDesk", "Healthcare IT", "$178M", "19.8%", "$46M", "25.8%", "$690M", "15.0x", "45.6%", "Strong margin"],
  ["InsureCore", "Insurance", "$221M", "11.4%", "$39M", "17.6%", "$526M", "13.5x", "29.0%", "Review"],
];

function inferCellVariant(value: string, row: number, columnIndex: number): SheetCell["variant"] {
  const isHeader = row === 1 || columnIndex === 0;
  const isCurrency = value.startsWith("$") || value.startsWith("+$") || value.startsWith("-$");
  const isMultiple = value.endsWith("x");
  const isPercent = value.endsWith("%");
  const isSector = columnIndex === 1 && row > 1;
  const isWarning = value.includes("risk") || value.includes("Watch") || value === "Review";

  return isHeader
    ? "header"
    : isWarning
      ? "warning"
      : isCurrency
        ? "currency"
        : isMultiple
          ? "multiple"
          : isPercent
            ? "percent"
            : isSector
              ? "sector"
              : undefined;
}

export function createSheetFromRows(rows: string[][]): SheetCell[] {
  // Calculate the number of rows needed: data rows + 10 extra rows for user input
  const dataRows = rows.length;
  const extraRows = 10;
  const totalRows = dataRows + extraRows;

  return Array.from({ length: totalRows }).flatMap((_, rowIndex) => {
    const row = rowIndex + 1;

    return columns.map((column, columnIndex) => {
      const value = rows[rowIndex]?.[columnIndex] ?? "";

      return {
        id: `${column}${row}`,
        column,
        row,
        value,
        variant: inferCellVariant(value, row, columnIndex),
      };
    });
  });
}

export function createMockSheet(): SheetCell[] {
  return createSheetFromRows(mockRows);
}

export const sheetColumns = columns;
