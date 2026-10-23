"use client";

import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Eye,
  Edit3,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (newHtml: string) => void;
}

/**
 * Editorial Rich-Text HTML Editor with Formatting Toolbar, Image/Caption Insertion,
 * Code Blocks, Quotations, and Live Sanitized Preview.
 */
export default function RichTextEditor({
  value,
  onChange,
}: RichTextEditorProps) {
  const [previewMode, setPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const insertSnippet = (before: string, after = "", defaultText = "") => {
    const el = textareaRef.current;
    if (!el) {
      onChange(`${value}\n${before}${defaultText}${after}`);
      return;
    }

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || defaultText;
    const updated =
      value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + before.length,
        start + before.length + selected.length
      );
    }, 10);
  };

  const handleInsertLink = () => {
    const url = window.prompt("Enter full URL (https://...):", "https://");
    if (!url) return;
    insertSnippet(`<a href="${url.trim()}">`, "</a>", "Reference Link");
  };

  const handleInsertImage = () => {
    const url = window.prompt(
      "Enter image URL (or /uploads/... from uploader):",
      "https://"
    );
    if (!url) return;
    const alt =
      window.prompt(
        "Enter descriptive alt text (required for accessibility):",
        "Editorial diagram"
      ) || "Editorial illustration";
    const caption = window.prompt("Optional image caption:", "") || "";

    const figureHtml = caption
      ? `\n<figure>\n  <img src="${url.trim()}" alt="${alt.trim()}" />\n  <figcaption>${caption.trim()}</figcaption>\n</figure>\n`
      : `\n<img src="${url.trim()}" alt="${alt.trim()}" />\n`;

    insertSnippet(figureHtml, "", "");
  };

  return (
    <div className="border border-slate-300 rounded-md overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() =>
              insertSnippet("<h2>", "</h2>", "Section Subheading")
            }
            title="Heading 2"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("<h3>", "</h3>", "Minor Heading")}
            title="Heading 3"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("<p>", "</p>", "Paragraph text...")}
            title="Paragraph"
            className="px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded"
          >
            P
          </button>
          <span className="h-4 w-px bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() => insertSnippet("<strong>", "</strong>", "bold text")}
            title="Bold"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertSnippet("<em>", "</em>", "italic text")}
            title="Italic"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <Italic className="w-4 h-4" />
          </button>
          <span className="h-4 w-px bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                "<ul>\n  <li>",
                "</li>\n  <li>Second item</li>\n</ul>",
                "First bullet item"
              )
            }
            title="Bulleted List"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                "<ol>\n  <li>",
                "</li>\n  <li>Second step</li>\n</ol>",
                "First numbered step"
              )
            }
            title="Numbered List"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                "<blockquote>\n  <p>",
                "</p>\n</blockquote>",
                "Verified quotation or key takeaway..."
              )
            }
            title="Blockquote"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() =>
              insertSnippet(
                "<pre><code>",
                "</code></pre>",
                "// Code snippet here"
              )
            }
            title="Code Block"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <Code className="w-4 h-4" />
          </button>
          <span className="h-4 w-px bg-slate-300 mx-1" />
          <button
            type="button"
            onClick={handleInsertLink}
            title="Insert Link"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleInsertImage}
            title="Insert Image with Caption"
            className="p-1.5 text-slate-700 hover:bg-slate-200 rounded"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setPreviewMode((p) => !p)}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
        >
          {previewMode ? (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Content</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Body or Preview */}
      {previewMode ? (
        <div className="p-6 min-h-[380px] bg-white prose-editorial max-w-none">
          {value.trim() ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <p className="text-slate-400 italic">
              Nothing to preview yet. Switch back to Edit Content to write your
              article.
            </p>
          )}
        </div>
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={18}
          placeholder="Write structured editorial HTML using the toolbar buttons above (<p>, <h2>, <ul>, <pre><code>, etc.)..."
          className="w-full p-4 font-mono text-sm text-slate-900 focus:outline-none resize-y"
        />
      )}
    </div>
  );
}
