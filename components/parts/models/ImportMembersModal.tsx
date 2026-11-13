"use client";

import { importMembers, type NewMemberInput } from "@/lib/data/members-admin";
import { toastError, toastSuccess } from "@/lib/toast";
import React, { useState, ChangeEvent, useMemo } from "react";
import { MdClose, MdUpload, MdCloudUpload, MdError } from "react-icons/md";
import ExcelJS from "exceljs";

interface ImportUsersModalProps {
  closeModal: () => void;
}

const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  return rows;
};

const HEADER_ALIASES: Record<string, string[]> = {
  firstName: ["First Name", "firstName"],
  middleName: ["Middle Name", "middleName"],
  lastName: ["Last Name", "lastName"],
  email: ["Email Address", "Email", "email"],
  phoneNumber: ["Phone Number", "phoneNumber"],
  whatsAppNumber: ["WhatsApp Number", "whatsAppNumber"],
  linkedin: ["LinkedIn Profile", "linkedin"],
  instagram: ["Instagram Profile", "instagram"],
  facebook: ["Facebook Profile", "facebook"],
  twitter: ["X (Twitter) Account", "twitter"],
  bio: ["Biography", "bio"],
  countryName: ["Country of Residence", "countryName"],
  stateName: ["State/Province (If not in Rwanda)", "stateName"],
  districtName: ["District of Residence", "districtName"],
  sectorName: ["Sector of Residence", "sectorName"],
  nearlestLandmark: ["Nearest Landmark", "nearlestLandmark"],
  cohortName: ["Cohort", "cohortName"],
  trackName: ["Track", "trackName"],
  genderName: ["Gender", "genderName"],
  avatarUrl: ["Profile Picture Link", "avatarUrl"],
};

function mapImportRow(row: Record<string, string>): NewMemberInput {
  const pick = (aliases: string[]) => {
    for (const alias of aliases) {
      const value = row[alias];
      if (typeof value === "string" && value.trim() !== "") return value.trim();
    }
    return undefined;
  };

  const result: Record<string, string | undefined> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    result[field] = pick(aliases);
  }

  return result as unknown as NewMemberInput;
}

const ImportUsersModal: React.FC<ImportUsersModalProps> = ({ closeModal }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);


  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (
        !selectedFile.name.endsWith(".xlsx") &&
        !selectedFile.name.endsWith(".csv")
      ) {
        setUploadError("Please upload a valid Excel (.xlsx) or CSV file.");
        setFile(null);
        setPreviewData([]);
        return;
      }
      setFile(selectedFile);
      setUploadError(null);
      handlePreview(selectedFile);
    }
  };

  const handlePreview = (file: File) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      const data = e.target?.result;
      if (!data) {
        setUploadError("Failed to read file data.");
        setPreviewData([]);
        return;
      }

      try {
        if (file.name.toLowerCase().endsWith(".csv")) {
          const text = new TextDecoder("utf-8").decode(data as ArrayBuffer);
          const rows = parseCSV(text);
          const headers: string[] = (rows[0] ?? []).map((h) =>
            String(h ?? "").trim()
          );
          if (headers[0]) headers[0] = headers[0].replace(/^\uFEFF/, "");

          if (headers.filter(Boolean).length === 0) {
            setUploadError("No valid headers found in file.");
            setPreviewData([]);
            return;
          }

          const parsedRows: Record<string, any>[] = [];

          rows.slice(1).forEach((row) => {
            const rowData: Record<string, any> = {};
            let hasValue = false;

            headers.forEach((header, index) => {
              if (!header) return;
              const value = String(row[index] ?? "").trim();
              if (value !== "") hasValue = true;
              rowData[header] = value;
            });

            if (hasValue) parsedRows.push(rowData);
          });

          if (parsedRows.length === 0) {
            setUploadError("No valid data rows found.");
            setPreviewData([]);
            return;
          }

          setPreviewData(parsedRows);
          setUploadError("");
          return;
        }

        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(data as ArrayBuffer);

        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          setUploadError("No worksheet found in file.");
          setPreviewData([]);
          return;
        }

        const headerRow = worksheet.getRow(1);
        const headers: string[] = [];

        for (let col = 1; col <= headerRow.cellCount; col++) {
          const cell = headerRow.getCell(col);
          headers.push(String(cell?.value ?? "").trim());
        }

        if (headers.filter(Boolean).length === 0) {
          setUploadError("No valid headers found in file.");
          setPreviewData([]);
          return;
        }

        const parsedRows: Record<string, any>[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;

          const rowData: Record<string, any> = {};
          let hasValue = false;

          for (let col = 1; col <= headers.length; col++) {
            const header = headers[col - 1];
            if (!header) continue;

            const cell = row.getCell(col);

            let value: any = "";

            if (cell.value instanceof Date) {
              value = cell.value.toISOString();
            } else if (typeof cell.value === "object" && cell.value !== null) {
              value =
                (cell.value as any).text ?? (cell.value as any).result ?? "";
            } else {
              value = cell.value ?? "";
            }

            value = String(value).trim();
            if (value !== "") hasValue = true;

            rowData[header] = value;
          }

          if (hasValue) {
            parsedRows.push(rowData);
          }
        });

        if (parsedRows.length === 0) {
          setUploadError("No valid data rows found.");
          setPreviewData([]);
          return;
        }

        /** 3️⃣ Save preview data */
        setPreviewData(parsedRows);
        setUploadError("");
      } catch (err) {
        console.error(err);
        setUploadError("Failed to parse Excel file.");
        setPreviewData([]);
      }
    };

    reader.onerror = () => {
      setUploadError("Failed to read the file.");
      setPreviewData([]);
    };

    reader.readAsArrayBuffer(file);
  };

  const handleConfirm = async () => {
    if (previewData.length === 0) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      if (previewData.length > 500) {
        toastError("Import is limited to 500 members per batch.");
        return;
      }
      const rows = previewData.map(mapImportRow);
      const result = await importMembers(rows);
      if (result.failed.length > 0) {
        toastError(`${result.created} imported, ${result.failed.length} failed. Check the console for details.`);
        console.error("Import failures", result.failed);
      } else {
        toastSuccess(`${result.created} members imported.`);
      }
      setFile(null);
      setPreviewData([]);
      closeModal();
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Import failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadError(null);
    }
  };

  const headers = useMemo(() => {
    if (previewData.length > 0) {
      return Object.keys(previewData[0]);
    }
    return [];
  }, [previewData]);

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      aria-modal="true"
      role="dialog"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <MdCloudUpload className="w-6 h-6 mr-2 text-primary" />
            Bulk Import Members
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
            <input
              id="file-upload"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".xlsx, .csv"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <MdUpload className="w-10 h-10 mx-auto text-primary" />
              <p className="mt-2 text-sm font-medium text-gray-900">
                {file
                  ? `File selected: ${file.name}`
                  : "Drag & drop or click to upload an Excel/CSV file"}
              </p>
              <p className="text-xs text-gray-500">
                Recommended format: Column headers (e.g., firstName, lastName,
                email, etc.)
              </p>
            </label>
          </div>

          {uploadError && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm flex items-center">
              <MdError className="w-5 h-5 mr-2" /> {uploadError}
            </div>
          )}

          {previewData.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">
                Preview ({previewData.length} users)
              </h4>
              <div className="max-h-64 overflow-y-auto border rounded-lg shadow-inner">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      {headers.map((header) => (
                        <th
                          key={header}
                          className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {previewData.slice(0, 10).map((user, rowIndex) => (
                      <tr key={rowIndex} className="hover:bg-gray-50">
                        {headers.map((header) => (
                          <td
                            key={header}
                            className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                          >
                            {user[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {previewData.length > 10 && (
                      <tr>
                        <td
                          colSpan={headers.length}
                          className="px-6 py-4 text-center text-sm text-gray-500 italic"
                        >
                          ... showing first 10 rows of {previewData.length}{" "}
                          total.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 flex justify-end space-x-3">
          <button
            onClick={closeModal}
            disabled={isUploading}
            className="px-6 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={previewData.length === 0 || isUploading}
            className={`px-6 py-2 font-medium text-white rounded-lg transition duration-150 flex items-center ${
              previewData.length === 0 || isUploading
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-primary hover:bg-primary shadow-md"
            }`}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  ...
                </svg>
                Importing...
              </>
            ) : (
              `Confirm Import (${previewData.length} Users)`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportUsersModal;
