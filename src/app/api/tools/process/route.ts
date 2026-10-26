import { NextRequest, NextResponse } from "next/server";
import {
  buildDocxBuffer,
  buildMultiPagePdfBuffer,
  buildXlsxBuffer,
  compressPdfBuffer,
  extractStructuredTextFromPdf,
  extractTextFromWordBuffer,
  mergeOrSplitPdfBuffers,
  parsePageRange,
} from "@/lib/pdf-engine";

export const runtime = "nodejs";

if (process.env.NODE_ENV !== "production") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

/**
 * Gemini Multimodal OCR & Document Structure extractor for scanned PDFs or OCR mode.
 */
async function extractPdfViaGeminiFallback(
  pdfBuffer: Buffer,
  mode: "text" | "table"
): Promise<string[] | null> {
  const apiKey =
    process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_STUDIO_API_KEY;
  if (!apiKey || pdfBuffer.length > 10 * 1024 * 1024) return null;

  const prompt =
    mode === "table"
      ? "Extract all tables, financial rows, and structured data from this PDF. Return one row per line, separating columns with a tab character (\\t). Do not include markdown code fences."
      : "Extract all text, headings (prefix headings with '## '), paragraphs, and tables (separate table columns with tabs \\t) from this PDF in exact reading order. Return one paragraph or row per line without markdown code fences.";

  const models = [
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash",
  ];

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType: "application/pdf",
                      data: pdfBuffer.toString("base64"),
                    },
                  },
                  { text: prompt },
                ],
              },
            ],
          }),
        }
      );
      if (!res.ok) continue;
      const data = await res.json();
      const text: string =
        data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (text.trim()) {
        return text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter(Boolean);
      }
    } catch {
      // Ignore network/API fallback errors and rely on local engine
    }
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const operation = String(formData.get("operation") || "");
    const uploadedFiles = formData.getAll("files") as File[];

    if (!uploadedFiles || uploadedFiles.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one file to process." },
        { status: 400 }
      );
    }

    const primaryFile = uploadedFiles[0];
    const baseName =
      primaryFile.name.replace(/\.[^/.]+$/, "").trim() || "document";
    const primaryBuffer = Buffer.from(await primaryFile.arrayBuffer());

    // Quick inspection endpoint for iLovePDF-style page thumbnails & page counts
    if (operation === "inspect-pdf") {
      const { pageCount, lines } = extractStructuredTextFromPdf(primaryBuffer);
      return NextResponse.json({
        pageCount,
        previewLines: lines.slice(0, 12),
      });
    }

    if (operation === "pdf-to-word") {
      const ocrMode = String(formData.get("ocrMode") || "no-ocr");
      let { lines, pageCount } = extractStructuredTextFromPdf(primaryBuffer);

      if (ocrMode === "ocr" || lines.length <= 1) {
        const aiLines = await extractPdfViaGeminiFallback(
          primaryBuffer,
          "text"
        );
        if (aiLines && aiLines.length > 0) {
          lines = aiLines;
        }
      }

      if (lines.length === 0) {
        lines = [
          `Document "${primaryFile.name}" (${pageCount} page(s)) was processed.`,
        ];
      }

      const docxBuffer = buildDocxBuffer(baseName, lines);
      const filename = `${baseName}.docx`;

      return new NextResponse(new Uint8Array(docxBuffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
          "X-Result-Filename": filename,
          "X-Result-Summary": `Your PDF (${pageCount} page${
            pageCount === 1 ? "" : "s"
          }) has been converted to an editable WORD (.docx) document with ${
            lines.length
          } structured block(s).`,
        },
      });
    }

    if (operation === "word-to-pdf") {
      const paragraphs = extractTextFromWordBuffer(primaryBuffer);
      const pdfBuffer = buildMultiPagePdfBuffer(baseName, paragraphs, true);
      const filename = `${baseName}.pdf`;
      const estPages = Math.max(1, Math.ceil(paragraphs.length / 44));

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
          "X-Result-Filename": filename,
          "X-Result-Summary": `Your WORD document has been converted into a ${estPages}-page PDF file.`,
        },
      });
    }

    if (operation === "merge-pdf") {
      let rotations: number[] = [];
      try {
        rotations = JSON.parse(String(formData.get("rotations") || "[]"));
      } catch {
        rotations = [];
      }

      const docs: { name: string; buffer: Buffer; rotation?: number }[] = [];
      for (let i = 0; i < uploadedFiles.length; i++) {
        const f = uploadedFiles[i];
        docs.push({
          name: f.name,
          buffer: Buffer.from(await f.arrayBuffer()),
          rotation: Number(rotations[i]) || 0,
        });
      }

      const { buffer: mergedBuffer, totalPages } =
        mergeOrSplitPdfBuffers(docs);
      const filename =
        uploadedFiles.length > 1
          ? `${baseName}_merged.pdf`
          : `${baseName}_output.pdf`;

      return new NextResponse(new Uint8Array(mergedBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
          "X-Result-Filename": filename,
          "X-Result-Summary": `PDFs have been merged! Combined ${uploadedFiles.length} file(s) into a ${totalPages}-page PDF.`,
        },
      });
    }

    if (operation === "split-pdf") {
      const pageRangeStr = String(formData.get("pageRange") || "1");
      const { pageCount } = extractStructuredTextFromPdf(primaryBuffer);
      const selectedPages = parsePageRange(
        pageRangeStr,
        Math.max(1, pageCount)
      );

      const { buffer: splitBuffer, totalPages } = mergeOrSplitPdfBuffers(
        [{ name: primaryFile.name, buffer: primaryBuffer }],
        [selectedPages]
      );

      const cleanRangeLabel =
        selectedPages.length > 4
          ? `${selectedPages[0]}-${selectedPages[selectedPages.length - 1]}`
          : selectedPages.join("-");
      const filename = `${baseName}_split_${cleanRangeLabel}.pdf`;

      return new NextResponse(new Uint8Array(splitBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
          "X-Result-Filename": filename,
          "X-Result-Summary": `PDF has been split! Extracted ${totalPages} page(s) (pages ${selectedPages.join(
            ", "
          )}) from "${primaryFile.name}".`,
        },
      });
    }

    if (operation === "compress-pdf") {
      const rawLevel = String(
        formData.get("compressionLevel") || "recommended"
      );
      const level =
        rawLevel === "extreme" || rawLevel === "less"
          ? rawLevel
          : "recommended";

      const compressedBuffer = compressPdfBuffer(primaryBuffer, level);
      const filename = `${baseName}_compressed.pdf`;
      const origBytes = primaryBuffer.length;
      const newBytes = compressedBuffer.length;
      const savedPct =
        origBytes > newBytes
          ? Math.max(1, Math.round(((origBytes - newBytes) / origBytes) * 100))
          : 0;

      return new NextResponse(new Uint8Array(compressedBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
          "X-Result-Filename": filename,
          "X-Original-Size": String(origBytes),
          "X-Compressed-Size": String(newBytes),
          "X-Saved-Percent": String(savedPct),
          "X-Result-Summary":
            savedPct > 0
              ? `Your PDF is now ${savedPct}% smaller! (${(
                  origBytes / 1024
                ).toFixed(1)} KB → ${(newBytes / 1024).toFixed(1)} KB)`
              : `Your PDF streams have been optimized (${(
                  newBytes / 1024
                ).toFixed(1)} KB).`,
        },
      });
    }

    if (operation === "pdf-to-excel") {
      const format = String(formData.get("excelFormat") || "xlsx");
      const ocrMode = String(formData.get("ocrMode") || "no-ocr");
      let { rows } = extractStructuredTextFromPdf(primaryBuffer);

      if (ocrMode === "ocr" || rows.length <= 1) {
        const aiLines = await extractPdfViaGeminiFallback(
          primaryBuffer,
          "table"
        );
        if (aiLines && aiLines.length > 0) {
          rows = aiLines.map((l) => l.split(/\t|\s{2,}/));
        }
      }

      if (rows.length === 0) {
        rows = [
          ["Row #", "Extracted Content"],
          ["1", baseName],
        ];
      } else {
        const maxCols = Math.max(
          2,
          ...rows.map((r) => Math.min(12, r.length))
        );
        const headerRow = [
          "Row #",
          ...Array.from({ length: maxCols }, (_, i) => `Column ${i + 1}`),
        ];
        rows = [
          headerRow,
          ...rows.map((r, idx) => [String(idx + 1), ...r.slice(0, maxCols)]),
        ];
      }

      if (format === "csv") {
        const csvContent = rows
          .map((r) =>
            r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
          )
          .join("\r\n");
        const csvBuffer = Buffer.from("\uFEFF" + csvContent, "utf8");
        const filename = `${baseName}.csv`;
        return new NextResponse(new Uint8Array(csvBuffer), {
          status: 200,
          headers: {
            "Content-Type": "text/csv;charset=utf-8",
            "Content-Disposition": `attachment; filename="${encodeURIComponent(
              filename
            )}"`,
            "X-Result-Filename": filename,
            "X-Result-Summary": `Your PDF has been converted to an Excel CSV file (${
              rows.length - 1
            } rows extracted).`,
          },
        });
      }

      const xlsxBuffer = buildXlsxBuffer(baseName, rows);
      const filename = `${baseName}.xlsx`;

      return new NextResponse(new Uint8Array(xlsxBuffer), {
        status: 200,
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(
            filename
          )}"`,
          "X-Result-Filename": filename,
          "X-Result-Summary": `Your PDF has been converted to an editable EXCEL (.xlsx) workbook (${
            rows.length - 1
          } rows extracted).`,
        },
      });
    }

    return NextResponse.json(
      { error: `Unsupported operation: ${operation}` },
      { status: 400 }
    );
  } catch (err) {
    console.error("PDF Tool processing error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to process the uploaded document.",
      },
      { status: 500 }
    );
  }
}
