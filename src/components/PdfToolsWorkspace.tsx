"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Layers,
  Minimize2,
  Image as ImageIcon,
  Upload,
  Download,
  CheckCircle2,
  RefreshCw,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  RotateCw,
  Plus,
  Scissors,
  Check,
  ArrowRight,
  ArrowLeft,
  SortAsc,
} from "lucide-react";

export type PdfToolId = "merge-split" | "compress-pdf" | "images-to-pdf";

export const PDF_SERVICES: {
  id: PdfToolId;
  label: string;
  shortLabel: string;
  heroTitle: string;
  description: string;
  accentBg: string;
  accentText: string;
  accentBorder: string;
}[] = [
  {
    id: "merge-split",
    label: "Merge and split PDFs",
    shortLabel: "Merge & Split PDF",
    heroTitle: "Merge & Split PDF Files",
    description:
      "Combine PDFs in the order you want with the easiest PDF merger available, or separate one page or a whole set for easy conversion.",
    accentBg: "bg-[#e5322d]",
    accentText: "text-[#e5322d]",
    accentBorder: "border-[#e5322d]",
  },
  {
    id: "compress-pdf",
    label: "Compress PDF files",
    shortLabel: "Compress PDF",
    heroTitle: "Compress PDF file",
    description:
      "Reduce file size while optimizing for maximal PDF quality.",
    accentBg: "bg-emerald-600",
    accentText: "text-emerald-600",
    accentBorder: "border-emerald-600",
  },
  {
    id: "images-to-pdf",
    label: "Convert images to PDF",
    shortLabel: "JPG to PDF",
    heroTitle: "JPG to PDF",
    description:
      "Convert JPG, PNG, and WebP images to PDF in seconds. Easily adjust orientation and margins.",
    accentBg: "bg-amber-500",
    accentText: "text-amber-600",
    accentBorder: "border-amber-500",
  },
];

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.min(2, Math.floor(Math.log(bytes) / Math.log(k)));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Converts one or more uploaded Image files into a multi-page PDF document using HTML5 Canvas + JPEG PDF objects,
 * supporting iLovePDF orientation, page size (A4, US Letter, Fit), margins (None, Small, Big), and per-image rotation.
 */
async function buildPdfFromImages(
  files: File[],
  rotations: number[],
  orientation: "portrait" | "landscape",
  pageSize: "a4" | "letter" | "fit",
  marginSize: "none" | "small" | "big"
): Promise<Blob> {
  const imagePages: {
    jpegBytes: Uint8Array;
    width: number;
    height: number;
  }[] = [];

  for (let idx = 0; idx < files.length; idx++) {
    const file = files[idx];
    const rot = (((rotations[idx] || 0) % 360) + 360) % 360;

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () =>
        reject(new Error(`Invalid or unsupported image: ${file.name}`));
      el.src = dataUrl;
    });

    const maxDim = 1800;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
    const scaledW = Math.max(1, Math.round(img.width * scale));
    const scaledH = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    if (rot === 90 || rot === 270) {
      canvas.width = scaledH;
      canvas.height = scaledW;
    } else {
      canvas.width = scaledW;
      canvas.height = scaledH;
    }

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rot * Math.PI) / 180);
      ctx.drawImage(img, -scaledW / 2, -scaledH / 2, scaledW, scaledH);
      ctx.restore();
    }

    const jpegDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = jpegDataUrl.split(",")[1] || "";
    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    imagePages.push({
      jpegBytes: bytes,
      width: canvas.width,
      height: canvas.height,
    });
  }

  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    byteLength += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    byteLength += b.length;
  };

  pushStr("%PDF-1.4\n");
  const offsets: number[] = [];

  offsets.push(byteLength);
  pushStr("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  const pageObjIds = imagePages.map((_, idx) => 3 + idx * 3);
  offsets.push(byteLength);
  pushStr(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] /Count ${imagePages.length} >>\nendobj\n`
  );

  const marginPts =
    marginSize === "none" ? 0 : marginSize === "small" ? 20 : 48;

  imagePages.forEach((page, idx) => {
    const pageId = 3 + idx * 3;
    const imgId = pageId + 1;
    const contentId = pageId + 2;

    let pageW = pageSize === "letter" ? 612 : 595;
    let pageH = pageSize === "letter" ? 792 : 842;

    if (orientation === "landscape") {
      const tmp = pageW;
      pageW = pageH;
      pageH = tmp;
    }

    let drawW = page.width;
    let drawH = page.height;
    let drawX = 0;
    let drawY = 0;

    if (pageSize === "fit") {
      pageW = Math.max(72, Math.min(1440, page.width + marginPts * 2));
      const fitRatio = (pageW - marginPts * 2) / page.width;
      drawW = Math.round(page.width * fitRatio);
      drawH = Math.round(page.height * fitRatio);
      pageH = drawH + marginPts * 2;
      drawX = marginPts;
      drawY = marginPts;
    } else {
      const availW = Math.max(36, pageW - marginPts * 2);
      const availH = Math.max(36, pageH - marginPts * 2);
      const ratio = Math.min(availW / page.width, availH / page.height);
      drawW = Math.round(page.width * ratio);
      drawH = Math.round(page.height * ratio);
      drawX = Math.round((pageW - drawW) / 2);
      drawY = Math.round((pageH - drawH) / 2);
    }

    offsets.push(byteLength);
    pushStr(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im${idx} ${imgId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    offsets.push(byteLength);
    pushStr(
      `${imgId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpegBytes.length} >>\nstream\n`
    );
    pushBytes(page.jpegBytes);
    pushStr("\nendstream\nendobj\n");

    const cmd = `q\n${drawW} 0 0 ${drawH} ${drawX} ${drawY} cm\n/Im${idx} Do\nQ\n`;
    offsets.push(byteLength);
    pushStr(
      `${contentId} 0 obj\n<< /Length ${cmd.length} >>\nstream\n${cmd}\nendstream\nendobj\n`
    );
  });

  const xrefStart = byteLength;
  pushStr(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  for (const off of offsets) {
    pushStr(`${String(off).padStart(10, "0")} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${
      offsets.length + 1
    } /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

interface FileMeta {
  pageCount: number;
  previewLines: string[];
  imagePreviewUrl?: string;
}

export default function PdfToolsWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paramToolRaw = searchParams.get("tool") as PdfToolId | null;
  const initialTool: PdfToolId =
    paramToolRaw && PDF_SERVICES.some((s) => s.id === paramToolRaw)
      ? paramToolRaw
      : "merge-split";

  const [activeTool, setActiveTool] = useState<PdfToolId>(initialTool);
  const [files, setFiles] = useState<File[]>([]);
  const [rotations, setRotations] = useState<number[]>([]);
  const [fileMetas, setFileMetas] = useState<Record<string, FileMeta>>({});

  // Merge & Split options matching iLovePDF
  const [mergeDirection, setMergeDirection] = useState<"merge" | "split">(
    "merge"
  );
  const [splitMode, setSplitMode] = useState<"ranges" | "extract">("ranges");
  const [ranges, setRanges] = useState<{ from: number; to: number }[]>([
    { from: 1, to: 1 },
  ]);
  const [selectedExtractPages, setSelectedExtractPages] = useState<number[]>([
    1,
  ]);

  // Compress options matching iLovePDF
  const [compressionLevel, setCompressionLevel] = useState<
    "extreme" | "recommended" | "less"
  >("recommended");

  // Images to PDF options matching iLovePDF
  const [imgOrientation, setImgOrientation] = useState<
    "portrait" | "landscape"
  >("portrait");
  const [imgPageSize, setImgPageSize] = useState<"a4" | "letter" | "fit">("a4");
  const [imgMargin, setImgMargin] = useState<"none" | "small" | "big">("small");

  // Execution & Completion state
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [resultBlobUrl, setResultBlobUrl] = useState<string | null>(null);
  const [resultFilename, setResultFilename] = useState("");
  const [resultSummary, setResultSummary] = useState("");
  const [savedPercent, setSavedPercent] = useState<number | null>(null);

  useEffect(() => {
    const paramTool = searchParams.get("tool") as PdfToolId | null;
    if (
      paramTool &&
      PDF_SERVICES.some((s) => s.id === paramTool) &&
      paramTool !== activeTool
    ) {
      setActiveTool(paramTool);
      resetWorkspace();
    }
  }, [searchParams, activeTool]);

  const resetWorkspace = () => {
    setFiles([]);
    setRotations([]);
    setErrorMessage(null);
    setResultBlob(null);
    setResultBlobUrl(null);
    setResultSummary("");
    setSavedPercent(null);
  };

  const handleSelectTool = (toolId: PdfToolId) => {
    setActiveTool(toolId);
    resetWorkspace();
    router.replace(`/tools?tool=${toolId}`, { scroll: false });
  };

  const inspectAddedFiles = async (newFiles: File[]) => {
    for (const f of newFiles) {
      const key = `${f.name}-${f.size}`;
      if (f.type.startsWith("image/")) {
        const url = URL.createObjectURL(f);
        setFileMetas((prev) => ({
          ...prev,
          [key]: { pageCount: 1, previewLines: [], imagePreviewUrl: url },
        }));
      } else if (f.name.toLowerCase().endsWith(".pdf")) {
        try {
          const fd = new FormData();
          fd.append("operation", "inspect-pdf");
          fd.append("files", f);
          const res = await fetch("/api/tools/process", {
            method: "POST",
            body: fd,
          });
          if (res.ok) {
            const data = await res.json();
            const count = Math.max(1, Number(data.pageCount) || 1);
            setFileMetas((prev) => ({
              ...prev,
              [key]: {
                pageCount: count,
                previewLines: Array.isArray(data.previewLines)
                  ? data.previewLines
                  : [],
              },
            }));
            setRanges([{ from: 1, to: count }]);
            setSelectedExtractPages(
              Array.from({ length: count }, (_, i) => i + 1)
            );
          }
        } catch {
          // ignore inspection error
        }
      }
    }
  };

  const addSelectedFiles = (selected: File[]) => {
    if (selected.length === 0) return;
    setErrorMessage(null);
    const allowMultiple =
      (activeTool === "merge-split" && mergeDirection === "merge") ||
      activeTool === "images-to-pdf";

    if (allowMultiple) {
      setFiles((prev) => [...prev, ...selected]);
      setRotations((prev) => [...prev, ...selected.map(() => 0)]);
    } else {
      setFiles([selected[0]]);
      setRotations([0]);
    }
    setResultBlob(null);
    setResultBlobUrl(null);
    setResultSummary("");
    inspectAddedFiles(selected);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    addSelectedFiles(selected);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files || []);
    addSelectedFiles(dropped);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setRotations((prev) => prev.filter((_, i) => i !== index));
    setResultBlobUrl(null);
    setErrorMessage(null);
  };

  const handleRotateFile = (index: number) => {
    setRotations((prev) =>
      prev.map((r, i) => (i === index ? (r + 90) % 360 : r))
    );
  };

  const handleMoveFile = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= files.length) return;
    setFiles((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
    setRotations((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  };

  const handleSortFilesAZ = () => {
    const combined = files.map((file, idx) => ({
      file,
      rot: rotations[idx] || 0,
    }));
    combined.sort((a, b) => a.file.name.localeCompare(b.file.name));
    setFiles(combined.map((c) => c.file));
    setRotations(combined.map((c) => c.rot));
  };

  const toggleExtractPage = (pageNum: number) => {
    setSelectedExtractPages((prev) =>
      prev.includes(pageNum)
        ? prev.length > 1
          ? prev.filter((p) => p !== pageNum)
          : prev
        : [...prev, pageNum].sort((a, b) => a - b)
    );
  };

  const triggerAutoDownload = (url: string, filename: string) => {
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      // Fallback to manual click on Download button
    }
  };

  const handleContinueWithResult = (
    nextTool: PdfToolId,
    splitSubMode?: "split"
  ) => {
    if (!resultBlob || !resultFilename.endsWith(".pdf")) return;
    const chainedFile = new File([resultBlob], resultFilename, {
      type: "application/pdf",
    });
    setActiveTool(nextTool);
    if (nextTool === "merge-split" && splitSubMode === "split") {
      setMergeDirection("split");
    }
    setFiles([chainedFile]);
    setRotations([0]);
    setResultBlob(null);
    setResultBlobUrl(null);
    setResultSummary("");
    setSavedPercent(null);
    inspectAddedFiles([chainedFile]);
    router.replace(`/tools?tool=${nextTool}`, { scroll: false });
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setErrorMessage(null);
    setResultBlob(null);
    setResultBlobUrl(null);
    setResultSummary("");
    setSavedPercent(null);

    try {
      const primaryFile = files[0];
      const baseName =
        primaryFile.name.replace(/\.[^/.]+$/, "").trim() || "document";

      if (activeTool === "images-to-pdf") {
        const pdfBlob = await buildPdfFromImages(
          files,
          rotations,
          imgOrientation,
          imgPageSize,
          imgMargin
        );
        const url = URL.createObjectURL(pdfBlob);
        const outName = `${baseName}_images.pdf`;
        setResultBlob(pdfBlob);
        setResultBlobUrl(url);
        setResultFilename(outName);
        setResultSummary(
          `The images have been converted to PDF! (${files.length} page${
            files.length === 1 ? "" : "s"
          }, ${formatBytes(pdfBlob.size)})`
        );
        triggerAutoDownload(url, outName);
        return;
      }

      const formData = new FormData();
      let operation = "";

      if (activeTool === "merge-split") {
        if (mergeDirection === "merge") {
          operation = "merge-pdf";
          formData.append("rotations", JSON.stringify(rotations));
        } else {
          operation = "split-pdf";
          const computedRangeStr =
            splitMode === "ranges"
              ? ranges.map((r) => `${r.from}-${r.to}`).join(", ")
              : selectedExtractPages.join(", ");
          formData.append("pageRange", computedRangeStr || "1");
        }
      } else if (activeTool === "compress-pdf") {
        operation = "compress-pdf";
        formData.append("compressionLevel", compressionLevel);
      }

      formData.append("operation", operation);
      for (const f of files) {
        formData.append("files", f);
      }

      const response = await fetch("/api/tools/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errText = "Failed to process the uploaded file.";
        try {
          const errJson = await response.json();
          if (errJson?.error) errText = errJson.error;
        } catch {
          // ignore
        }
        throw new Error(errText);
      }

      const blob = await response.blob();
      const filename =
        response.headers.get("X-Result-Filename") || `${baseName}_output.pdf`;
      const summary =
        response.headers.get("X-Result-Summary") ||
        `Your document is ready (${formatBytes(blob.size)}).`;
      const savedPctHeader = response.headers.get("X-Saved-Percent");
      if (savedPctHeader !== null) {
        setSavedPercent(Number(savedPctHeader));
      }

      const url = URL.createObjectURL(blob);
      setResultBlob(blob);
      setResultBlobUrl(url);
      setResultFilename(filename);
      setResultSummary(summary);
      triggerAutoDownload(url, filename);
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while processing the file."
      );
    } finally {
      setProcessing(false);
    }
  };

  const currentService =
    PDF_SERVICES.find((s) => s.id === activeTool) || PDF_SERVICES[0];

  const acceptAttribute =
    activeTool === "images-to-pdf"
      ? "image/jpeg,image/png,image/webp"
      : "application/pdf,.pdf";

  const allowMultipleFiles =
    (activeTool === "merge-split" && mergeDirection === "merge") ||
    activeTool === "images-to-pdf";

  const primaryFileMeta =
    files[0] && fileMetas[`${files[0].name}-${files[0].size}`];
  const totalSplitPages = primaryFileMeta?.pageCount || 1;

  const activeSplitPagesSet = new Set<number>();
  if (activeTool === "merge-split" && mergeDirection === "split") {
    if (splitMode === "extract") {
      selectedExtractPages.forEach((p) => activeSplitPagesSet.add(p));
    } else {
      ranges.forEach((r) => {
        for (
          let p = Math.max(1, r.from);
          p <= Math.min(totalSplitPages, r.to);
          p++
        ) {
          activeSplitPagesSet.add(p);
        }
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Top iLovePDF Tool Switcher Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PDF_SERVICES.map((service) => {
          const isActive = service.id === activeTool;
          return (
            <button
              key={service.id}
              type="button"
              onClick={() => handleSelectTool(service.id)}
              className={`p-4 rounded-xl border text-left transition-all flex items-center gap-3 ${
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-md"
                  : "bg-white text-slate-800 border-slate-200 hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${service.accentBg}`}
              >
                {service.id === "merge-split" && <Layers className="w-5 h-5" />}
                {service.id === "compress-pdf" && (
                  <Minimize2 className="w-5 h-5" />
                )}
                {service.id === "images-to-pdf" && (
                  <ImageIcon className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-sm truncate">
                  {service.shortLabel}
                </div>
                <div
                  className={`text-xs truncate ${
                    isActive ? "text-slate-300" : "text-slate-500"
                  }`}
                >
                  {service.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* STAGE 3: iLovePDF Completion & Auto-Download Screen */}
      {resultBlobUrl ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-14 text-center max-w-3xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-slate-900">
              {resultSummary}
            </h2>
            <p className="text-sm text-slate-500">
              Your file{" "}
              <span className="font-semibold text-slate-700">
                {resultFilename}
              </span>{" "}
              is ready. If the download didn&apos;t start automatically, click
              the button below.
            </p>
          </div>

          {savedPercent !== null && savedPercent > 0 && (
            <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                -{savedPercent}% SAVED
              </span>
              <span>Optimized with iLovePDF Stream Engine</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={resetWorkspace}
              className="px-4 py-3.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-semibold inline-flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Start Over</span>
            </button>

            <a
              href={resultBlobUrl}
              download={resultFilename}
              className="w-full sm:w-auto px-8 py-4 bg-[#e5322d] hover:bg-[#c92520] text-white text-base font-bold rounded-xl shadow-lg shadow-red-600/20 inline-flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              <Download className="w-5 h-5" />
              <span>Download {resultFilename}</span>
            </a>

            <button
              type="button"
              onClick={resetWorkspace}
              title="Delete file from workspace"
              className="p-3.5 rounded-xl border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* iLovePDF "Continue to..." Workflow Chaining */}
          {resultFilename.endsWith(".pdf") && (
            <div className="pt-6 border-t border-slate-100">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Continue with this PDF in...
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {activeTool !== "compress-pdf" && (
                  <button
                    type="button"
                    onClick={() => handleContinueWithResult("compress-pdf")}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-xs font-semibold text-slate-700 inline-flex items-center gap-2 transition-colors"
                  >
                    <Minimize2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Compress PDF</span>
                    <ArrowRight className="w-3 h-3 text-slate-400" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    handleContinueWithResult("merge-split", "split")
                  }
                  className="px-3.5 py-2 rounded-lg border border-slate-200 hover:border-red-500 hover:bg-red-50/50 text-xs font-semibold text-slate-700 inline-flex items-center gap-2 transition-colors"
                >
                  <Scissors className="w-3.5 h-3.5 text-[#e5322d]" />
                  <span>Split PDF</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : files.length === 0 ? (
        /* STAGE 1: iLovePDF Centered Hero Dropzone */
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="bg-slate-50 border-2 border-dashed border-slate-300 hover:border-[#e5322d] rounded-2xl p-8 sm:p-16 text-center transition-colors"
        >
          {activeTool === "merge-split" && (
            <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-white shadow-sm mb-6">
              <button
                type="button"
                onClick={() => setMergeDirection("merge")}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
                  mergeDirection === "merge"
                    ? "bg-[#e5322d] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Merge PDF
              </button>
              <button
                type="button"
                onClick={() => setMergeDirection("split")}
                className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-colors ${
                  mergeDirection === "split"
                    ? "bg-[#e5322d] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Split PDF
              </button>
            </div>
          )}

          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-slate-900">
            {activeTool === "merge-split"
              ? mergeDirection === "merge"
                ? "Merge PDF files"
                : "Split PDF file"
              : currentService.heroTitle}
          </h2>
          <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto mt-2 mb-8">
            {currentService.description}
          </p>

          <label className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-[#e5322d] hover:bg-[#c92520] text-white text-lg sm:text-xl font-bold rounded-2xl shadow-lg shadow-red-600/25 cursor-pointer transition-transform hover:scale-[1.02] active:scale-95">
            <Upload className="w-6 h-6" />
            <span>
              {activeTool === "images-to-pdf"
                ? "Select JPG / PNG images"
                : allowMultipleFiles
                ? "Select PDF files"
                : "Select PDF file"}
            </span>
            <input
              type="file"
              accept={acceptAttribute}
              multiple={allowMultipleFiles}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <p className="text-xs text-slate-500 mt-4">
            or drop {activeTool === "images-to-pdf" ? "images" : "PDFs"} here
          </p>
        </div>
      ) : (
        /* STAGE 2: iLovePDF Split-Screen Studio (Canvas on Left + Options Sidebar on Right) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas: Visual Page/File Thumbnails */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="lg:col-span-8 bg-slate-100/90 border border-slate-200 rounded-2xl p-5 sm:p-6 min-h-[420px] flex flex-col justify-between"
          >
            <div>
              {/* Top Action Toolbar inside Canvas */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-200/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {activeTool === "merge-split" && mergeDirection === "split"
                      ? `${files[0].name} (${totalSplitPages} page${
                          totalSplitPages === 1 ? "" : "s"
                        })`
                      : `${files.length} File${
                          files.length === 1 ? "" : "s"
                        } Selected`}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {allowMultipleFiles && (
                    <>
                      {files.length > 1 && (
                        <button
                          type="button"
                          onClick={handleSortFilesAZ}
                          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5"
                          title="Sort files A to Z"
                        >
                          <SortAsc className="w-3.5 h-3.5" />
                          <span>Sort A–Z</span>
                        </button>
                      )}
                      <label className="px-3.5 py-1.5 bg-[#e5322d] hover:bg-[#c92520] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add more files</span>
                        <input
                          type="file"
                          accept={acceptAttribute}
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={resetWorkspace}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:text-red-600 rounded-lg text-xs font-semibold text-slate-600"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Error Banner if any */}
              {errorMessage && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* SPLIT PDF MODE: Visual Grid of Individual Pages in the PDF */}
              {activeTool === "merge-split" && mergeDirection === "split" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from(
                    { length: Math.min(24, totalSplitPages) },
                    (_, i) => i + 1
                  ).map((pageNum) => {
                    const isSelected = activeSplitPagesSet.has(pageNum);
                    return (
                      <div
                        key={pageNum}
                        onClick={() => {
                          if (splitMode === "extract") {
                            toggleExtractPage(pageNum);
                          }
                        }}
                        className={`relative bg-white rounded-xl p-3 border-2 transition-all flex flex-col items-center justify-between aspect-[1/1.35] shadow-sm ${
                          splitMode === "extract" ? "cursor-pointer" : ""
                        } ${
                          isSelected
                            ? "border-emerald-500 ring-2 ring-emerald-500/20"
                            : "border-slate-200 opacity-60"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                        <div className="w-full flex-1 bg-slate-50 border border-slate-100 rounded p-2 flex flex-col justify-between overflow-hidden">
                          <div className="space-y-1.5">
                            <div className="h-1.5 w-2/3 bg-slate-300 rounded" />
                            <div className="h-1 w-full bg-slate-200 rounded" />
                            <div className="h-1 w-5/6 bg-slate-200 rounded" />
                            <div className="h-1 w-4/6 bg-slate-200 rounded" />
                          </div>
                          {pageNum === 1 &&
                            primaryFileMeta?.previewLines?.[0] && (
                              <p className="text-[9px] text-slate-400 line-clamp-3 leading-tight">
                                {primaryFileMeta.previewLines[0]}
                              </p>
                            )}
                          <div className="text-[10px] font-bold text-slate-400 text-center">
                            PDF
                          </div>
                        </div>
                        <span className="mt-2 text-xs font-bold text-slate-700">
                          Page {pageNum}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* STANDARD VISUAL THUMBNAIL CARDS (Merge, Images, Compress) */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {files.map((f, index) => {
                    const meta = fileMetas[`${f.name}-${f.size}`];
                    const rot = rotations[index] || 0;
                    return (
                      <div
                        key={`${f.name}-${index}`}
                        className="group relative bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-4 shadow-sm flex flex-col justify-between transition-all"
                      >
                        {/* Top action buttons (Rotate, Reorder, Delete) */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600">
                            #{index + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            {(activeTool === "images-to-pdf" ||
                              (activeTool === "merge-split" &&
                                mergeDirection === "merge")) && (
                              <button
                                type="button"
                                onClick={() => handleRotateFile(index)}
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                                title="Rotate 90°"
                              >
                                <RotateCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {files.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => handleMoveFile(index, -1)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30"
                                  title="Move earlier"
                                >
                                  <ArrowUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={index === files.length - 1}
                                  onClick={() => handleMoveFile(index, 1)}
                                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30"
                                  title="Move later"
                                >
                                  <ArrowDown className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveFile(index)}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
                              title="Remove file"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Visual A4 Document / Image Preview Box */}
                        <div className="my-2 h-40 bg-slate-50 border border-slate-200/80 rounded-lg flex flex-col items-center justify-center p-3 overflow-hidden relative">
                          {meta?.imagePreviewUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={meta.imagePreviewUrl}
                              alt={f.name}
                              style={{ transform: `rotate(${rot}deg)` }}
                              className="max-h-32 max-w-full object-contain transition-transform duration-200 rounded"
                            />
                          ) : (
                            <div
                              style={{ transform: `rotate(${rot}deg)` }}
                              className="w-24 h-32 bg-white border border-slate-300 shadow-sm rounded p-2.5 flex flex-col justify-between transition-transform duration-200"
                            >
                              <div className="space-y-1.5">
                                <div className="w-8 h-3 rounded bg-red-600 text-[8px] font-bold text-white flex items-center justify-center uppercase">
                                  {f.name.split(".").pop()?.slice(0, 4) ||
                                    "PDF"}
                                </div>
                                <div className="h-1 w-full bg-slate-200 rounded" />
                                <div className="h-1 w-5/6 bg-slate-200 rounded" />
                                <div className="h-1 w-4/6 bg-slate-200 rounded" />
                              </div>
                              {meta?.previewLines?.[0] && (
                                <p className="text-[7px] text-slate-400 line-clamp-2 leading-tight">
                                  {meta.previewLines[0]}
                                </p>
                              )}
                              <div className="text-[9px] font-semibold text-slate-400 text-right">
                                {meta?.pageCount
                                  ? `${meta.pageCount}p`
                                  : formatBytes(f.size)}
                              </div>
                            </div>
                          )}
                          {rot > 0 && (
                            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-900/75 text-white text-[10px] font-bold">
                              {rot}°
                            </span>
                          )}
                        </div>

                        {/* Filename & Size Footer */}
                        <div className="text-center mt-1">
                          <div
                            className="text-xs font-bold text-slate-800 truncate"
                            title={f.name}
                          >
                            {f.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {formatBytes(f.size)}
                            {meta?.pageCount
                              ? ` • ${meta.pageCount} page${
                                  meta.pageCount === 1 ? "" : "s"
                                }`
                              : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Settings Sidebar (iLovePDF Option Panel) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 sticky top-20">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-serif text-xl font-bold text-slate-900">
                {activeTool === "compress-pdf" && "Compression level"}
                {activeTool === "merge-split" &&
                  (mergeDirection === "merge" ? "Merge PDF" : "Split PDF")}
                {activeTool === "images-to-pdf" && "Image to PDF options"}
              </h3>
            </div>

            {/* COMPRESS PDF OPTIONS (iLovePDF's 3 Exact Cards) */}
            {activeTool === "compress-pdf" && (
              <div className="space-y-3">
                {[
                  {
                    id: "extreme" as const,
                    title: "EXTREME COMPRESSION",
                    desc: "Less quality, high compression",
                  },
                  {
                    id: "recommended" as const,
                    title: "RECOMMENDED COMPRESSION",
                    desc: "Good quality, good compression",
                  },
                  {
                    id: "less" as const,
                    title: "LESS COMPRESSION",
                    desc: "High quality, less compression",
                  },
                ].map((opt) => {
                  const active = compressionLevel === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCompressionLevel(opt.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-start justify-between gap-3 ${
                        active
                          ? "border-emerald-600 bg-emerald-50/40"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div>
                        <div
                          className={`text-xs font-extrabold uppercase tracking-wider ${
                            active ? "text-emerald-700" : "text-slate-800"
                          }`}
                        >
                          {opt.title}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {opt.desc}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          active
                            ? "bg-emerald-600 text-white"
                            : "border border-slate-300"
                        }`}
                      >
                        {active && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* MERGE & SPLIT PDF OPTIONS */}
            {activeTool === "merge-split" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setMergeDirection("merge")}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                      mergeDirection === "merge"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    Merge PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setMergeDirection("split")}
                    className={`py-2 text-xs font-bold rounded-lg transition-colors ${
                      mergeDirection === "split"
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-600"
                    }`}
                  >
                    Split PDF
                  </button>
                </div>

                {mergeDirection === "merge" ? (
                  <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                    To change the order of your PDFs, use the arrow buttons on
                    each file card or click <strong>Sort A–Z</strong>.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSplitMode("ranges")}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          splitMode === "ranges"
                            ? "border-[#e5322d] bg-red-50/40 text-[#e5322d]"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        Split by range
                      </button>
                      <button
                        type="button"
                        onClick={() => setSplitMode("extract")}
                        className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                          splitMode === "extract"
                            ? "border-[#e5322d] bg-red-50/40 text-[#e5322d]"
                            : "border-slate-200 text-slate-600"
                        }`}
                      >
                        Extract pages
                      </button>
                    </div>

                    {splitMode === "ranges" ? (
                      <div className="space-y-3">
                        {ranges.map((r, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                          >
                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                              <span>Range {idx + 1}</span>
                              {ranges.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRanges((prev) =>
                                      prev.filter((_, i) => i !== idx)
                                    )
                                  }
                                  className="text-red-600 hover:underline"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] uppercase text-slate-500 font-bold">
                                  from page
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  max={totalSplitPages}
                                  value={r.from}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      1,
                                      Number(e.target.value) || 1
                                    );
                                    setRanges((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? { ...item, from: val }
                                          : item
                                      )
                                    );
                                  }}
                                  className="w-full mt-1 px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] uppercase text-slate-500 font-bold">
                                  to
                                </label>
                                <input
                                  type="number"
                                  min={r.from}
                                  max={totalSplitPages}
                                  value={r.to}
                                  onChange={(e) => {
                                    const val = Math.max(
                                      r.from,
                                      Number(e.target.value) || r.from
                                    );
                                    setRanges((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, to: val } : item
                                      )
                                    );
                                  }}
                                  className="w-full mt-1 px-2.5 py-1.5 text-sm border border-slate-300 rounded-lg"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setRanges((prev) => [
                              ...prev,
                              { from: 1, to: totalSplitPages },
                            ])
                          }
                          className="w-full py-2 rounded-xl border border-dashed border-[#e5322d] text-[#e5322d] text-xs font-bold hover:bg-red-50/40 inline-flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Range</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-xs text-slate-600">
                          Click on the page thumbnails on the left to select or
                          deselect pages to extract.
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedExtractPages(
                                Array.from(
                                  { length: totalSplitPages },
                                  (_, i) => i + 1
                                )
                              )
                            }
                            className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            Select All
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedExtractPages([1])}
                            className="flex-1 py-2 text-xs font-bold border border-slate-200 rounded-lg hover:bg-slate-50"
                          >
                            Reset to Page 1
                          </button>
                        </div>
                        <div className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                          Selected pages: {selectedExtractPages.join(", ")}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* IMAGES TO PDF OPTIONS (Orientation, Page Size, Margin) */}
            {activeTool === "images-to-pdf" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Page orientation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["portrait", "landscape"] as const).map((o) => (
                      <button
                        key={o}
                        type="button"
                        onClick={() => setImgOrientation(o)}
                        className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold capitalize transition-all ${
                          imgOrientation === o
                            ? "border-[#e5322d] bg-red-50/40 text-[#e5322d]"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        {o}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Page size
                  </label>
                  <select
                    value={imgPageSize}
                    onChange={(e) =>
                      setImgPageSize(
                        e.target.value as "a4" | "letter" | "fit"
                      )
                    }
                    className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white font-medium"
                  >
                    <option value="a4">A4 (297x210 mm)</option>
                    <option value="letter">US Letter (215x279.4 mm)</option>
                    <option value="fit">Fit (Same page size as image)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Margin
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "none", label: "No margin" },
                        { id: "small", label: "Small" },
                        { id: "big", label: "Big" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setImgMargin(m.id)}
                        className={`py-2 px-2 rounded-xl border-2 text-xs font-bold transition-all ${
                          imgMargin === m.id
                            ? "border-[#e5322d] bg-red-50/40 text-[#e5322d]"
                            : "border-slate-200 text-slate-700"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Big Bottom Action CTA Button (iLovePDF style) */}
            <button
              type="button"
              disabled={processing}
              onClick={handleProcessFiles}
              className="w-full py-4 px-6 bg-[#e5322d] hover:bg-[#c92520] disabled:opacity-60 text-white text-base font-extrabold rounded-xl shadow-lg shadow-red-600/20 flex items-center justify-center gap-3 transition-transform active:scale-95"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {activeTool === "compress-pdf" && "Compress PDF"}
                    {activeTool === "merge-split" &&
                      (mergeDirection === "merge" ? "Merge PDF" : "Split PDF")}
                    {activeTool === "images-to-pdf" && "Convert to PDF"}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
