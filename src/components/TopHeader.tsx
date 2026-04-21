import { ChangeEvent, useRef, useState } from "react";
import { CellWiseLogo } from "./CellWiseLogo";

type TopHeaderProps = {
  confirmedActionCount: number;
  importStatus?: string;
  onClearSheet: () => void;
  onFileImport: (file: File) => void;
};

export function TopHeader({
  confirmedActionCount,
  importStatus,
  onClearSheet,
  onFileImport,
}: TopHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileImport(file);
    }
    event.target.value = "";
  };

  const handleClearSheet = () => {
    const shouldClear = window.confirm("Clear all spreadsheet cell contents? This cannot be undone.");
    if (shouldClear) {
      onClearSheet();
    }
  };

  return (
    <header className="top-header">
      <div className="title-cluster">
        <CellWiseLogo />
        <div>
          <h1>CellWise</h1>
        </div>
      </div>

      <div className="toolbar" aria-label="Spreadsheet toolbar">
        <input
          accept=".csv,.xlsx,.xls"
          className="file-input"
          onChange={handleFileChange}
          ref={fileInputRef}
          type="file"
        />
        <button onClick={() => fileInputRef.current?.click()} type="button">
          Insert
        </button>
        <button className="danger-toolbar-button" onClick={handleClearSheet} type="button">
          Clear
        </button>
        <span className="status-pill">{confirmedActionCount} confirmed actions</span>
        {importStatus && <span className="toolbar-note">{importStatus}</span>}
      </div>
    </header>
  );
}
