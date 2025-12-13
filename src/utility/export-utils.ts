// src/utility/export-utils.ts
import { toast } from 'react-toastify';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

/**
 * Parses an HTML table and exports it to an Excel .xlsx file using exceljs.
 * @param tableId The ID of the HTML table element to export.
 * @param fileName The desired name for the output file (without extension).
 * @param sheetName The name for the sheet inside the Excel file.
 */
export const exportTableToExcel = async (
  tableId: string,
  fileName: string,
  sheetName: string = 'Sheet1'
): Promise<void> => {
  const table = document.getElementById(tableId) as HTMLTableElement;

  if (!table) {
    toast.error(`Export failed: Table with ID "${tableId}" not found.`);
    return;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add header rows from <thead>
    const headerRows = Array.from(table.tHead?.rows || []);
    headerRows.forEach(headerRow => {
      const row = worksheet.addRow(Array.from(headerRow.cells).map(cell => cell.innerText));
      row.font = { bold: true };
    });

    // Add body rows from <tbody>
    const bodyRows = Array.from(table.tBodies[0]?.rows || []);
    bodyRows.forEach(bodyRow => {
        worksheet.addRow(Array.from(bodyRow.cells).map(cell => {
            const text = cell.innerText;
            // Attempt to convert to number if it looks like one
            if (text && !isNaN(Number(text))) {
                return Number(text);
            }
            return text;
        }));
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell!({ includeEmpty: true }, cell => {
            const columnLength = cell.value ? cell.value.toString().length : 10;
            if (columnLength > maxLength) {
                maxLength = columnLength;
            }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
    });

    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Create a blob and trigger a download
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `${fileName}.xlsx`);

    toast.success('Exported to Excel successfully!');

  } catch (error) {
    console.error("Excel export error:", error);
    toast.error('An unexpected error occurred during Excel export.');
  }
};