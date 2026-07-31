"use client";

// components/FileUpload.tsx
//
// Upload + parse UI for medical reports (PDF / DOCX / TXT).
// Calls POST /api/upload (see backend/services/fileParser.ts) and surfaces
// the extracted text back to the parent, ready for the AI simplification step.

import { useCallback, useRef, useState } from "react";

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const MAX_FILE_SIZE_MB = 10;

type UploadStatus = "idle" | "dragging" | "uploading" | "success" | "error";

export interface ParsedResult {
  fileName: string;
  fileType: "pdf" | "docx" | "txt";
  text: string;
  pageCount?: number;
  warnings: string[];
}

interface FileUploadProps {
  onParsed: (result: ParsedResult) => void;
  uploadUrl?: string; // defaults to "/api/upload"
}

export default function FileUpload({ onParsed, uploadUrl = "/api/upload" }: FileUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      return "Only PDF, DOCX, and TXT files are supported.";
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return `That file is over the ${MAX_FILE_SIZE_MB} MB limit.`;
    }
    return null;
  };

  const uploadFile = useCallback(
    async (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setStatus("error");
        setErrorMessage(validationError);
        return;
      }

      setStatus("uploading");
      setErrorMessage(null);
      setFileName(file.name);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Something went wrong while reading that file.");
        }

        setStatus("success");
        onParsed({
          fileName: data.fileName,
          fileType: data.fileType,
          text: data.text,
          pageCount: data.pageCount,
          warnings: data.warnings ?? [],
        });
      } catch (err) {
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong while reading that file."
        );
      }
    },
    [onParsed, uploadUrl]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus((prev) => (prev === "uploading" ? prev : "dragging"));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setStatus((prev) => (prev === "dragging" ? "idle" : prev));
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const reset = () => {
    setStatus("idle");
    setFileName(null);
    setErrorMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a medical report file"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={[
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          status === "dragging"
            ? "border-teal-500 bg-teal-50"
            : status === "error"
            ? "border-red-300 bg-red-50"
            : status === "success"
            ? "border-teal-400 bg-teal-50/50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleFileSelect}
          className="hidden"
        />

        {status === "uploading" && (
          <>
            <Spinner />
            <p className="text-sm font-medium text-slate-700">Reading {fileName}…</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckIcon />
            <p className="text-sm font-medium text-slate-700">{fileName} uploaded</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
              }}
              className="text-sm text-teal-700 underline underline-offset-2 hover:text-teal-800"
            >
              Upload a different file
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <ErrorIcon />
            <p className="text-sm font-medium text-red-700">{errorMessage}</p>
            <p className="text-xs text-slate-500">Click or drop a file to try again.</p>
          </>
        )}

        {(status === "idle" || status === "dragging") && (
          <>
            <UploadIcon />
            <p className="text-sm font-medium text-slate-700">
              Drop your medical report here, or click to browse
            </p>
            <p className="text-xs text-slate-500">PDF, DOCX, or TXT — up to {MAX_FILE_SIZE_MB} MB</p>
          </>
        )}
      </div>
    </div>
  );
}

// ---------- Small inline icons (no external icon dependency needed) ----------

function UploadIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-400">
      <path d="M12 16V4M12 4l-4 4M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-teal-500">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" className="animate-spin text-teal-500">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.2" />
      <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
