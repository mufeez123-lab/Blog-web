import { describe, it, expect } from "vitest";
import {
  buildDocxBuffer,
  buildMultiPagePdfBuffer,
  buildXlsxBuffer,
  compressPdfBuffer,
  extractFileFromZip,
  extractStructuredTextFromPdf,
  extractTextFromWordBuffer,
  mergeOrSplitPdfBuffers,
  parsePageRange,
} from "../src/lib/pdf-engine";

describe("PDF & Document Services Engine", () => {
  it("generates FlateDecode-compressed multi-page PDFs and extracts text accurately", () => {
    const paragraphs = [
      "Quarterly Cloud Infrastructure Report",
      "Enterprise AI inference spending rose by 42% in Q3 across US hyperscalers.",
      "Revenue    Operating Margin    Net Income",
      "$14.2B    28.4%    $4.0B",
    ];
    const pdfBuf = buildMultiPagePdfBuffer("Q3 Report", paragraphs, true);
    expect(pdfBuf.subarray(0, 8).toString("latin1")).toContain("%PDF-1.4");

    const extracted = extractStructuredTextFromPdf(pdfBuf);
    expect(extracted.pageCount).toBe(1);
    const joined = extracted.lines.join(" ");
    expect(joined).toContain("Quarterly Cloud Infrastructure Report");
    expect(joined).toContain("Enterprise AI inference spending rose by 42%");
  });

  it("creates valid OpenXML .docx files and extracts paragraphs back from .docx", () => {
    const originalParas = [
      "First paragraph of the Word document.",
      "Second paragraph with special characters: <>&\"'",
      "Third paragraph for PDF conversion verification.",
    ];
    const docxBuf = buildDocxBuffer("Sample Word Doc", originalParas);

    // Verify PK ZIP signature
    expect(docxBuf[0]).toBe(0x50);
    expect(docxBuf[1]).toBe(0x4b);

    const extracted = extractTextFromWordBuffer(docxBuf);
    expect(extracted).toContain("Sample Word Doc");
    expect(extracted).toContain("First paragraph of the Word document.");
    expect(extracted).toContain(
      "Second paragraph with special characters: <>&\"'"
    );
    expect(extracted).toContain(
      "Third paragraph for PDF conversion verification."
    );
  });

  it("merges multiple PDFs and splits specific page ranges accurately", () => {
    const pdf1 = buildMultiPagePdfBuffer(
      "Doc One",
      ["Content from first PDF document."],
      true
    );
    const pdf2 = buildMultiPagePdfBuffer(
      "Doc Two",
      ["Content from second PDF document."],
      true
    );

    const merged = mergeOrSplitPdfBuffers([
      { name: "one.pdf", buffer: pdf1 },
      { name: "two.pdf", buffer: pdf2 },
    ]);
    expect(merged.totalPages).toBe(2);

    const mergedExtracted = extractStructuredTextFromPdf(merged.buffer);
    expect(mergedExtracted.pageCount).toBe(2);
    expect(mergedExtracted.lines.join(" ")).toContain(
      "Content from first PDF document."
    );
    expect(mergedExtracted.lines.join(" ")).toContain(
      "Content from second PDF document."
    );

    // Split only page 2 from merged PDF
    const selected = parsePageRange("2", merged.totalPages);
    expect(selected).toEqual([2]);

    const split = mergeOrSplitPdfBuffers(
      [{ name: "merged.pdf", buffer: merged.buffer }],
      [selected]
    );
    expect(split.totalPages).toBe(1);
    const splitExtracted = extractStructuredTextFromPdf(split.buffer);
    expect(splitExtracted.pageCount).toBe(1);
    expect(splitExtracted.lines.join(" ")).toContain(
      "Content from second PDF document."
    );
  });

  it("compresses uncompressed PDF streams with FlateDecode", () => {
    const repeatedLines = Array.from(
      { length: 30 },
      (_, i) =>
        `Line ${i + 1}: This is an uncompressed PDF line with repetitive text for compression testing.`
    );
    const uncompressedPdf = buildMultiPagePdfBuffer(
      "Uncompressed Doc",
      repeatedLines,
      false
    );
    const compressedPdf = compressPdfBuffer(uncompressedPdf, "high");

    expect(compressedPdf.length).toBeLessThan(uncompressedPdf.length);
    const extracted = extractStructuredTextFromPdf(compressedPdf);
    expect(extracted.lines.join(" ")).toContain("Line 1:");
  });

  it("builds valid OpenXML .xlsx workbooks from extracted PDF table rows", () => {
    const rows = [
      ["Row #", "Metric", "Q3 Value"],
      ["1", "Cloud ARR", "$1250000"],
      ["2", "Gross Margin", "74.5%"],
    ];
    const xlsxBuf = buildXlsxBuffer("Financials", rows);
    expect(xlsxBuf[0]).toBe(0x50);
    expect(xlsxBuf[1]).toBe(0x4b);

    const sheetXml = extractFileFromZip(
      xlsxBuf,
      "xl/worksheets/sheet1.xml"
    )?.toString("utf8");
    expect(sheetXml).toBeTruthy();
    expect(sheetXml).toContain("Cloud ARR");
    expect(sheetXml).toContain("1250000");
  });
});
