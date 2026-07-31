// backend/services/fileParser.ts
//
// Handles upload + text extraction for PDF, DOCX, and TXT medical report files.
// Uses multer for multipart upload handling, pdf-parse for PDFs, and mammoth for DOCX.

import express, { Request, Response, NextFunction, Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import path from "path";

const router: Router = express.Router();

// ---------- Config ----------

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
]);

// Store the file in memory only (never write raw uploads to disk).
// Fits the "secure file uploads / privacy-first design" goal from the README.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(new Error("UNSUPPORTED_FILE_TYPE"));
      return;
    }
    cb(null, true);
  },
});

// ---------- Types ----------

export interface ParsedReport {
  fileName: string;
  fileType: "pdf" | "docx" | "txt";
  text: string;
  pageCount?: number; // PDFs only
  warnings: string[];
}

// ---------- Extraction helpers ----------

async function extractFromPdf(buffer: Buffer): Promise<{ text: string; pageCount: number }> {
  const result = await pdfParse(buffer);
  return { text: result.text, pageCount: result.numpages };
}

async function extractFromDocx(buffer: Buffer): Promise<{ text: string; warnings: string[] }> {
  const result = await mammoth.extractRawText({ buffer });
  const warnings = result.messages
    .filter((m) => m.type === "warning")
    .map((m) => m.message);
  return { text: result.value, warnings };
}

function extractFromTxt(buffer: Buffer): string {
  return buffer.toString("utf-8");
}

function cleanText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Core parsing function — takes a buffer + original filename, returns
 * normalized plain text ready to hand off to the AI simplification step.
 */
export async function parseUploadedFile(
  buffer: Buffer,
  originalName: string
): Promise<ParsedReport> {
  const ext = path.extname(originalName).toLowerCase();
  const warnings: string[] = [];

  let rawText = "";
  let pageCount: number | undefined;
  let fileType: ParsedReport["fileType"];

  switch (ext) {
    case ".pdf": {
      fileType = "pdf";
      const { text, pageCount: pages } = await extractFromPdf(buffer);
      rawText = text;
      pageCount = pages;
      if (!rawText.trim()) {
        warnings.push(
          "No selectable text found. This PDF may be a scanned image — OCR support is planned but not yet available."
        );
      }
      break;
    }
    case ".docx": {
      fileType = "docx";
      const { text, warnings: docxWarnings } = await extractFromDocx(buffer);
      rawText = text;
      warnings.push(...docxWarnings);
      break;
    }
    case ".txt": {
      fileType = "txt";
      rawText = extractFromTxt(buffer);
      break;
    }
    default:
      throw new Error("UNSUPPORTED_FILE_TYPE");
  }

  const text = cleanText(rawText);

  if (text.length === 0) {
    warnings.push("The document appears to be empty after extraction.");
  }

  return {
    fileName: originalName,
    fileType,
    text,
    pageCount,
    warnings,
  };
}

// ---------- Route ----------

// POST /api/upload  (multipart/form-data, field name: "file")
router.post(
  "/api/upload",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file was provided." });
        return;
      }

      const parsed = await parseUploadedFile(req.file.buffer, req.file.originalname);

      if (parsed.text.length === 0) {
        res.status(422).json({
          error: "Could not extract any text from this file.",
          warnings: parsed.warnings,
        });
        return;
      }

      // Hand this off to the AI simplification step from here, e.g.:
      // const simplified = await simplifyReport(parsed.text);

      res.status(200).json({
        fileName: parsed.fileName,
        fileType: parsed.fileType,
        pageCount: parsed.pageCount,
        text: parsed.text,
        warnings: parsed.warnings,
      });
    } catch (err) {
      next(err);
    }
  }
);

// Multer / parsing error handler — keep this mounted after the route above.
router.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "File exceeds the 10 MB limit." });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.message}` });
    return;
  }
  if (err?.message === "UNSUPPORTED_FILE_TYPE") {
    res.status(415).json({ error: "Only PDF, DOCX, and TXT files are supported." });
    return;
  }
  console.error("File parsing error:", err);
  res.status(500).json({ error: "Something went wrong while processing the file." });
});

export default router;
