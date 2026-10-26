import zlib from "zlib";

/**
 * CRC32 calculation for creating valid ZIP archives (.docx and .xlsx)
 */
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Builds an in-memory ZIP archive (used for genuine .docx and .xlsx OpenXML files).
 */
export function createZipArchive(
  entries: { name: string; content: Buffer | string }[]
): Buffer {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, "utf8");
    const rawData =
      typeof entry.content === "string"
        ? Buffer.from(entry.content, "utf8")
        : entry.content;
    const compressed = zlib.deflateRawSync(rawData, { level: 9 });
    const crc = crc32(rawData);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0x21, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0x21, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += 30 + nameBuf.length + compressed.length;
  }

  const centralBuffer = Buffer.concat(centralParts);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBuffer.length, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralBuffer, eocd]);
}

/**
 * Reads a file from inside a ZIP archive Buffer (e.g. word/document.xml from a .docx file).
 */
export function extractFileFromZip(
  zipBuffer: Buffer,
  targetPath: string
): Buffer | null {
  const cd = findEntryInCentralDirectory(zipBuffer, targetPath);
  if (cd) {
    const localPos = cd.localHeaderOffset;
    if (
      localPos + 30 <= zipBuffer.length &&
      zipBuffer.readUInt32LE(localPos) === 0x04034b50
    ) {
      const fileNameLen = zipBuffer.readUInt16LE(localPos + 26);
      const extraLen = zipBuffer.readUInt16LE(localPos + 28);
      const dataStart = localPos + 30 + fileNameLen + extraLen;
      const slice = zipBuffer.subarray(
        dataStart,
        dataStart + cd.compressedSize
      );
      if (cd.method === 0) return slice;
      if (cd.method === 8) {
        try {
          return zlib.inflateRawSync(slice);
        } catch {
          // continue to sequential fallback
        }
      }
    }
  }

  let pos = 0;
  while (pos + 30 <= zipBuffer.length) {
    const sig = zipBuffer.readUInt32LE(pos);
    if (sig !== 0x04034b50) break;

    const method = zipBuffer.readUInt16LE(pos + 8);
    const compressedSize = zipBuffer.readUInt32LE(pos + 18);
    const fileNameLen = zipBuffer.readUInt16LE(pos + 26);
    const extraLen = zipBuffer.readUInt16LE(pos + 28);
    const fileName = zipBuffer
      .subarray(pos + 30, pos + 30 + fileNameLen)
      .toString("utf8");
    const dataStart = pos + 30 + fileNameLen + extraLen;

    const actualCompSize =
      compressedSize > 0
        ? compressedSize
        : zipBuffer.length - dataStart;
    const slice = zipBuffer.subarray(dataStart, dataStart + actualCompSize);

    if (fileName === targetPath) {
      if (method === 0) return slice;
      if (method === 8) {
        try {
          return zlib.inflateRawSync(slice);
        } catch {
          return null;
        }
      }
    }
    pos = dataStart + actualCompSize;
  }

  return null;
}

function findEntryInCentralDirectory(
  zipBuffer: Buffer,
  targetPath: string
): {
  method: number;
  compressedSize: number;
  uncompressedSize: number;
  localHeaderOffset: number;
} | null {
  for (let i = zipBuffer.length - 22; i >= Math.max(0, zipBuffer.length - 65557); i--) {
    if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
      const cdOffset = zipBuffer.readUInt32LE(i + 16);
      let pos = cdOffset;
      while (pos + 46 <= zipBuffer.length) {
        if (zipBuffer.readUInt32LE(pos) !== 0x02014b50) break;
        const method = zipBuffer.readUInt16LE(pos + 10);
        const compressedSize = zipBuffer.readUInt32LE(pos + 20);
        const uncompressedSize = zipBuffer.readUInt32LE(pos + 24);
        const nameLen = zipBuffer.readUInt16LE(pos + 28);
        const extraLen = zipBuffer.readUInt16LE(pos + 30);
        const commentLen = zipBuffer.readUInt16LE(pos + 32);
        const localHeaderOffset = zipBuffer.readUInt32LE(pos + 42);
        const name = zipBuffer
          .subarray(pos + 46, pos + 46 + nameLen)
          .toString("utf8");
        if (name === targetPath) {
          return {
            method,
            compressedSize,
            uncompressedSize,
            localHeaderOffset,
          };
        }
        pos += 46 + nameLen + extraLen + commentLen;
      }
      break;
    }
  }
  return null;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

/**
 * Builds a genuine OpenXML .docx file supporting Headings, Bullet Lists, Tables, and Paragraphs.
 */
export function buildDocxBuffer(title: string, paragraphs: string[]): Buffer {
  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;

  const wordRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:sz w:val="22"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:pPr><w:spacing w:before="280" w:after="120"/></w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="34"/>
      <w:color w:val="1E293B"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:pPr><w:spacing w:before="200" w:after="80"/></w:pPr>
    <w:rPr>
      <w:b/>
      <w:sz w:val="26"/>
      <w:color w:val="334155"/>
    </w:rPr>
  </w:style>
</w:styles>`;

  const bodyElements: string[] = [
    `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>${escapeXml(
      title
    )}</w:t></w:r></w:p>`,
  ];

  let pendingTableRows: string[][] = [];
  const flushTable = () => {
    if (pendingTableRows.length === 0) return;
    const rowsXml = pendingTableRows
      .map((cells, rIdx) => {
        const tcXml = cells
          .map(
            (c) => `<w:tc>
          <w:tcPr><w:tcW w:w="2800" w:type="dxa"/><w:tcBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:bottom w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:left w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
            <w:right w:val="single" w:sz="4" w:space="0" w:color="CBD5E1"/>
          </w:tcBorders></w:tcPr>
          <w:p><w:r>${rIdx === 0 ? "<w:rPr><w:b/></w:rPr>" : ""}<w:t xml:space="preserve">${escapeXml(
              c.trim()
            )}</w:t></w:r></w:p>
        </w:tc>`
          )
          .join("");
        return `<w:tr>${tcXml}</w:tr>`;
      })
      .join("");
    bodyElements.push(`<w:tbl><w:tblPr><w:tblW w:w="5000" w:type="pct"/></w:tblPr>${rowsXml}</w:tbl>`);
    pendingTableRows = [];
  };

  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) continue;

    // Check if tabular row (contains tabs or 3+ spaces separating columns)
    const tabCols = trimmed.includes("\t")
      ? trimmed.split("\t")
      : trimmed.split(/\s{3,}/);
    if (tabCols.length >= 2 && tabCols.every((c) => c.length < 80)) {
      pendingTableRows.push(tabCols);
      continue;
    }

    flushTable();

    if (/^#{1,2}\s+/.test(trimmed)) {
      const cleanHeading = trimmed.replace(/^#{1,2}\s+/, "");
      bodyElements.push(
        `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${escapeXml(
          cleanHeading
        )}</w:t></w:r></w:p>`
      );
    } else if (
      trimmed.length < 70 &&
      !trimmed.endsWith(".") &&
      /^[A-Z0-9][A-Za-z0-9\s:&,/()-]+$/.test(trimmed)
    ) {
      bodyElements.push(
        `<w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>${escapeXml(
          trimmed
        )}</w:t></w:r></w:p>`
      );
    } else {
      bodyElements.push(
        `<w:p><w:pPr><w:spacing w:after="120"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(
          trimmed
        )}</w:t></w:r></w:p>`
      );
    }
  }
  flushTable();

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyElements.join("\n    ")}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`;

  return createZipArchive([
    { name: "[Content_Types].xml", content: contentTypesXml },
    { name: "_rels/.rels", content: relsXml },
    { name: "word/_rels/document.xml.rels", content: wordRelsXml },
    { name: "word/styles.xml", content: stylesXml },
    { name: "word/document.xml", content: documentXml },
  ]);
}

/**
 * Extracts text paragraphs and tables from a .docx, .doc, .rtf, or .txt buffer.
 */
export function extractTextFromWordBuffer(buffer: Buffer): string[] {
  // 1. Check if buffer is a ZIP archive (.docx)
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    const docXmlBuf = extractFileFromZip(buffer, "word/document.xml");
    if (docXmlBuf) {
      const xml = docXmlBuf.toString("utf8");
      const paragraphs: string[] = [];
      const pMatches = xml.match(/<w:p[\s>][\s\S]*?<\/w:p>/g) || [];
      for (const pBlock of pMatches) {
        const isHeading = /<w:pStyle\s+w:val="Heading/i.test(pBlock);
        const withTabs = pBlock
          .replace(/<w:tab\s*\/>/g, "\t")
          .replace(/<w:br\s*\/>/g, "\n");
        const tMatches = withTabs.match(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g);
        if (tMatches) {
          const text = tMatches
            .map((t) => decodeXmlEntities(t.replace(/<\/?w:t[^>]*>/g, "")))
            .join("")
            .trim();
          if (text) {
            paragraphs.push(isHeading ? text : text);
          }
        }
      }
      if (paragraphs.length > 0) return paragraphs;
    }
  }

  // 2. HTML/XML-based .doc
  const rawUtf8 = buffer.toString("utf8");
  if (/<html|<body|<p>|xmlns:w=/i.test(rawUtf8)) {
    const text = decodeXmlEntities(
      rawUtf8
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n")
        .replace(/<\/td>/gi, "\t")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ")
    );
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.replace(/[ ]+/g, " ").trim())
      .filter(Boolean);
    if (lines.length > 0) return lines;
  }

  // 3. RTF
  if (rawUtf8.startsWith("{\\rtf")) {
    const cleaned = rawUtf8
      .replace(/\\par\b/g, "\n")
      .replace(/\\line\b/g, "\n")
      .replace(/\\tab\b/g, "\t")
      .replace(/\\'[0-9a-fA-F]{2}/g, " ")
      .replace(/\\[a-zA-Z]+-?\d*\s?/g, "")
      .replace(/[{}]/g, "");
    const lines = cleaned
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length > 0) return lines;
  }

  // 4. Plain text
  const lines = rawUtf8
    .split(/\r?\n/)
    .map((l) => l.replace(/[^\x20-\x7E\u00A0-\u024F\t]/g, "").trim())
    .filter((l) => l.length > 0);

  return lines.length > 0 ? lines : ["(Empty document)"];
}

/**
 * Builds a genuine OpenXML .xlsx Excel Workbook ZIP archive from rows of cells.
 */
export function buildXlsxBuffer(sheetName: string, rows: string[][]): Buffer {
  const safeSheet = escapeXml(
    sheetName.replace(/[\[\]*?:\/\\]/g, " ").slice(0, 31) || "Sheet1"
  );

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`;

  const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const wbRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${safeSheet}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`;

  const colLetter = (colIdx: number): string => {
    let s = "";
    let n = colIdx + 1;
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };

  const sheetRowsXml = rows
    .map((cells, rIdx) => {
      const rowNum = rIdx + 1;
      const styleAttr = rIdx === 0 ? ' s="1"' : "";
      const cellsXml = cells
        .map((cell, cIdx) => {
          const ref = `${colLetter(cIdx)}${rowNum}`;
          const trimmed = String(cell ?? "").trim();
          const numVal = Number(trimmed.replace(/^[$,]+/, "").replace(/,/g, ""));
          if (
            trimmed !== "" &&
            !Number.isNaN(numVal) &&
            /^-?\$?\d[\d,.]*$/.test(trimmed) &&
            rIdx > 0
          ) {
            return `<c r="${ref}"${styleAttr}><v>${numVal}</v></c>`;
          }
          return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${escapeXml(
            trimmed
          )}</t></is></c>`;
        })
        .join("");
      return `<row r="${rowNum}">${cellsXml}</row>`;
    })
    .join("\n    ");

  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    ${sheetRowsXml}
  </sheetData>
</worksheet>`;

  return createZipArchive([
    { name: "[Content_Types].xml", content: contentTypesXml },
    { name: "_rels/.rels", content: relsXml },
    { name: "xl/_rels/workbook.xml.rels", content: wbRelsXml },
    { name: "xl/workbook.xml", content: workbookXml },
    { name: "xl/styles.xml", content: stylesXml },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml },
  ]);
}

/**
 * Unpacks both classic PDF objects (`N 0 obj`) AND PDF 1.5+ compressed Object Streams (`/Type /ObjStm`).
 */
function parseAllPdfObjects(buffer: Buffer): {
  objects: Map<number, Buffer>;
  pageObjIds: number[];
  decompressedStreams: string[];
} {
  const raw = buffer.toString("latin1");
  const objects = new Map<number, Buffer>();
  const decompressedStreams: string[] = [];

  const objRegex = /(\d+)\s+0\s+obj\b/g;
  let match: RegExpExecArray | null;

  while ((match = objRegex.exec(raw)) !== null) {
    const id = parseInt(match[1], 10);
    const bodyStart = match.index + match[0].length;
    const endObjIdx = raw.indexOf("endobj", bodyStart);
    if (endObjIdx === -1) continue;
    const bodyBuf = buffer.subarray(bodyStart, endObjIdx);
    objects.set(id, bodyBuf);

    // Check if object has a stream
    const bodyRaw = bodyBuf.toString("latin1");
    const streamMatch = bodyRaw.match(/^[\s\S]*?<<([\s\S]*?)>>\s*stream\r?\n/);
    if (streamMatch) {
      const dict = streamMatch[1];
      const streamStart = streamMatch[0].length;
      const endStreamIdx = bodyRaw.lastIndexOf("endstream");
      if (endStreamIdx > streamStart) {
        let streamEnd = endStreamIdx;
        if (bodyRaw[streamEnd - 1] === "\n") streamEnd--;
        if (bodyRaw[streamEnd - 1] === "\r") streamEnd--;
        const slice = bodyBuf.subarray(streamStart, streamEnd);
        const isFlate = /\/FlateDecode\b|\/Fl\b/.test(dict);
        const isImage = /\/Subtype\s*\/Image\b/.test(dict);

        let streamDecoded: Buffer | null = null;
        if (isFlate) {
          try {
            streamDecoded = zlib.inflateSync(slice);
          } catch {
            try {
              streamDecoded = zlib.inflateRawSync(slice);
            } catch {
              streamDecoded = null;
            }
          }
        } else if (!isImage) {
          streamDecoded = slice;
        }

        if (streamDecoded) {
          const decodedStr = streamDecoded.toString("latin1");
          // Check if this stream is a PDF 1.5+ Object Stream (/Type /ObjStm)
          if (/\/Type\s*\/ObjStm\b/.test(dict)) {
            const nMatch = dict.match(/\/N\s+(\d+)/);
            const firstMatch = dict.match(/\/First\s+(\d+)/);
            if (nMatch && firstMatch) {
              const count = parseInt(nMatch[1], 10);
              const firstOffset = parseInt(firstMatch[1], 10);
              const headerPart = decodedStr.slice(0, firstOffset).trim();
              const tokens = headerPart.split(/\s+/);
              const pairs: { objId: number; relOffset: number }[] = [];
              for (let i = 0; i + 1 < tokens.length && pairs.length < count; i += 2) {
                pairs.push({
                  objId: parseInt(tokens[i], 10),
                  relOffset: parseInt(tokens[i + 1], 10),
                });
              }
              for (let i = 0; i < pairs.length; i++) {
                const startOff = firstOffset + pairs[i].relOffset;
                const endOff =
                  i + 1 < pairs.length
                    ? firstOffset + pairs[i + 1].relOffset
                    : streamDecoded.length;
                if (startOff < endOff && endOff <= streamDecoded.length) {
                  objects.set(
                    pairs[i].objId,
                    streamDecoded.subarray(startOff, endOff)
                  );
                }
              }
            }
          } else if (!isImage && !/\/Type\s*\/XRef\b/.test(dict)) {
            decompressedStreams.push(decodedStr);
          }
        }
      }
    }
  }

  // Find all /Type /Page (not /Pages) objects
  const pageObjIds: number[] = [];
  for (const [id, bodyBuf] of objects.entries()) {
    const head = bodyBuf
      .subarray(0, Math.min(bodyBuf.length, 800))
      .toString("latin1");
    if (/\/Type\s*\/Page\b(?!s)/.test(head)) {
      pageObjIds.push(id);
    }
  }

  return { objects, pageObjIds, decompressedStreams };
}

/**
 * Decompresses all PDF streams (including FlateDecode and ObjStm) and extracts structured text lines and tabular rows.
 */
export function extractStructuredTextFromPdf(buffer: Buffer): {
  lines: string[];
  rows: string[][];
  pageCount: number;
} {
  const { pageObjIds, decompressedStreams } = parseAllPdfObjects(buffer);
  const rawLatin1 = buffer.toString("latin1");
  const countMatch = rawLatin1.match(/\/Count\s+(\d+)/g);
  let fallbackCount = 1;
  if (countMatch) {
    for (const cm of countMatch) {
      const n = parseInt(cm.replace(/\/Count\s+/, ""), 10);
      if (n > fallbackCount && n < 5000) fallbackCount = n;
    }
  }
  const pageCount = Math.max(
    1,
    pageObjIds.length > 0 ? pageObjIds.length : fallbackCount
  );

  // Parse any ToUnicode CMap tables in the decompressed streams
  const unicodeMap = new Map<number, string>();
  for (const s of decompressedStreams) {
    if (s.includes("beginbfchar") || s.includes("beginbfrange")) {
      const bfCharBlocks = s.match(/beginbfchar([\s\S]*?)endbfchar/g) || [];
      for (const block of bfCharBlocks) {
        const pairRegex = /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
        let pm: RegExpExecArray | null;
        while ((pm = pairRegex.exec(block)) !== null) {
          const srcCode = parseInt(pm[1], 16);
          const dstHex = pm[2];
          let str = "";
          for (let i = 0; i < dstHex.length; i += 4) {
            str += String.fromCharCode(parseInt(dstHex.slice(i, i + 4), 16));
          }
          unicodeMap.set(srcCode, str);
        }
      }
      const bfRangeBlocks = s.match(/beginbfrange([\s\S]*?)endbfrange/g) || [];
      for (const block of bfRangeBlocks) {
        const rangeRegex =
          /<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g;
        let rm: RegExpExecArray | null;
        while ((rm = rangeRegex.exec(block)) !== null) {
          const start = parseInt(rm[1], 16);
          const end = parseInt(rm[2], 16);
          let target = parseInt(rm[3], 16);
          for (let code = start; code <= end && code - start < 512; code++) {
            unicodeMap.set(code, String.fromCharCode(target++));
          }
        }
      }
    }
  }

  const decodePdfLiteral = (lit: string): string => {
    let out = "";
    for (let i = 0; i < lit.length; i++) {
      if (lit[i] === "\\") {
        const next = lit[i + 1];
        if (next === "n") {
          out += "\n";
          i++;
        } else if (next === "r") {
          out += "\r";
          i++;
        } else if (next === "t") {
          out += "\t";
          i++;
        } else if (next === "(" || next === ")" || next === "\\") {
          out += next;
          i++;
        } else if (/[0-7]/.test(next || "")) {
          const oct = lit.slice(i + 1, i + 4).match(/^[0-7]{1,3}/)?.[0] || "";
          out += String.fromCharCode(parseInt(oct, 8));
          i += oct.length;
        }
      } else {
        const code = lit.charCodeAt(i);
        if (unicodeMap.size > 0 && unicodeMap.has(code)) {
          out += unicodeMap.get(code)!;
        } else {
          out += lit[i];
        }
      }
    }
    return out;
  };

  const decodeHexToken = (hex: string): string => {
    const clean = hex.replace(/\s+/g, "");
    let out = "";
    const step =
      clean.length % 4 === 0 &&
      unicodeMap.size > 0 &&
      Array.from(unicodeMap.keys()).some((k) => k > 255)
        ? 4
        : 2;
    for (let i = 0; i < clean.length; i += step) {
      const code = parseInt(clean.slice(i, i + step), 16);
      if (Number.isNaN(code)) continue;
      if (unicodeMap.has(code)) {
        out += unicodeMap.get(code)!;
      } else if (code >= 32 && code <= 126) {
        out += String.fromCharCode(code);
      }
    }
    return out;
  };

  const lines: string[] = [];
  const rows: string[][] = [];

  const allSources =
    decompressedStreams.length > 0 ? decompressedStreams : [rawLatin1];

  for (const stream of allSources) {
    if (stream.includes("beginbfchar") || stream.includes("beginbfrange")) {
      continue;
    }

    const btBlocks = stream.match(/BT[\s\S]*?ET/g) || [];
    for (const block of btBlocks) {
      let currentLineCells: string[] = [];
      let currentCell = "";

      const flushLine = () => {
        if (currentCell.trim()) {
          currentLineCells.push(currentCell.trim());
          currentCell = "";
        }
        if (currentLineCells.length > 0) {
          const cells =
            currentLineCells.length > 1
              ? [...currentLineCells]
              : currentLineCells[0].split(/\s{2,}|\t/);
          const lineStr = cells.join("    ").trim();
          if (lineStr && !/^Page \d+ of \d+$/i.test(lineStr)) {
            lines.push(lineStr);
            rows.push(cells);
          }
          currentLineCells = [];
        }
      };

      const tokenLines = block.split(/\r?\n/);
      for (const tl of tokenLines) {
        const trimmed = tl.trim();
        if (!trimmed) continue;

        if (
          /\bT\*\b/.test(trimmed) ||
          /-\d+(\.\d+)?\s+Td\b/.test(trimmed) ||
          /-\d+(\.\d+)?\s+TD\b/.test(trimmed) ||
          /\bTm\b/.test(trimmed)
        ) {
          flushLine();
        }

        if (trimmed.includes("[") && /\]\s*TJ\b/.test(trimmed)) {
          const itemRegex =
            /\((?:\\.|[^\\()])*\)|<([0-9A-Fa-f\s]+)>|(-?\d+(?:\.\d+)?)/g;
          let im: RegExpExecArray | null;
          while ((im = itemRegex.exec(trimmed)) !== null) {
            const tok = im[0];
            if (tok.startsWith("(")) {
              currentCell += decodePdfLiteral(tok.slice(1, -1));
            } else if (tok.startsWith("<")) {
              currentCell += decodeHexToken(tok.slice(1, -1));
            } else {
              const kern = parseFloat(tok);
              if (kern < -600) {
                if (currentCell.trim()) {
                  currentLineCells.push(currentCell.trim());
                  currentCell = "";
                }
              } else if (kern < -100) {
                currentCell += " ";
              }
            }
          }
        } else {
          const litMatches = trimmed.match(/\((?:\\.|[^\\()])*\)/g);
          if (litMatches) {
            for (const lm of litMatches) {
              currentCell += decodePdfLiteral(lm.slice(1, -1));
            }
          }
          const hexMatches = trimmed.match(/<([0-9A-Fa-f]{2,})>\s*Tj\b/g);
          if (hexMatches) {
            for (const hm of hexMatches) {
              const inner = hm.match(/<([0-9A-Fa-f]+)>/)?.[1] || "";
              currentCell += decodeHexToken(inner);
            }
          }
        }
      }
      flushLine();
    }
  }

  if (lines.length === 0) {
    for (const s of allSources) {
      const matches = s.match(/\(([^()\\]{3,200})\)/g) || [];
      for (const m of matches) {
        const cleaned = decodePdfLiteral(m.slice(1, -1))
          .replace(/[^\x20-\x7E\u00A0-\u024F]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        if (
          cleaned.length > 2 &&
          !/^(Identity|Adobe|WinAnsiEncoding|MacRomanEncoding|FlateDecode|DeviceRGB|Type1|TrueType|Creator|Producer|Parent|MediaBox)/i.test(
            cleaned
          )
        ) {
          lines.push(cleaned);
          rows.push(cleaned.split(/\s{2,}|\t/));
        }
      }
    }
  }

  return { lines, rows, pageCount };
}

/**
 * Generates a multi-page, standards-compliant PDF 1.4 document with FlateDecode streams
 * from a document title and an arbitrary number of text lines/paragraphs.
 */
export function buildMultiPagePdfBuffer(
  title: string,
  paragraphs: string[],
  compress = true
): Buffer {
  const safePdfText = (str: string) =>
    str
      .replace(/[^\x20-\x7E]/g, " ")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  const wrappedLines: { text: string; isHeading?: boolean }[] = [];
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      wrappedLines.push({ text: "" });
      continue;
    }
    const isHeading =
      trimmed.startsWith("--- ") ||
      /^#{1,3}\s+/.test(trimmed) ||
      (trimmed.length < 70 &&
        /^[A-Z0-9][A-Za-z0-9\s:&,-]+$/.test(trimmed) &&
        !trimmed.endsWith("."));
    const cleanPara = trimmed.replace(/^#{1,3}\s+/, "");
    const words = cleanPara.split(/\s+/);
    let current = "";
    const maxChars = isHeading ? 72 : 86;
    for (const w of words) {
      if ((current + " " + w).trim().length > maxChars) {
        if (current.trim()) {
          wrappedLines.push({ text: current.trim(), isHeading });
        }
        current = w;
      } else {
        current = current ? `${current} ${w}` : w;
      }
    }
    if (current.trim()) {
      wrappedLines.push({ text: current.trim(), isHeading });
    }
  }

  if (wrappedLines.length === 0) {
    wrappedLines.push({ text: title });
  }

  const LINES_PER_PAGE = 44;
  const pages: { text: string; isHeading?: boolean }[][] = [];
  for (let i = 0; i < wrappedLines.length; i += LINES_PER_PAGE) {
    pages.push(wrappedLines.slice(i, i + LINES_PER_PAGE));
  }

  const chunks: Buffer[] = [];
  let offset = 0;
  const offsets: number[] = [];

  const pushBuf = (b: Buffer | string) => {
    const buf = typeof b === "string" ? Buffer.from(b, "latin1") : b;
    chunks.push(buf);
    offset += buf.length;
  };

  pushBuf("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

  // Obj 1: Catalog
  offsets.push(offset);
  pushBuf("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

  // Obj 2: Pages
  const pageKids = pages.map((_, idx) => `${5 + idx * 2} 0 R`).join(" ");
  offsets.push(offset);
  pushBuf(
    `2 0 obj\n<< /Type /Pages /Kids [${pageKids}] /Count ${pages.length} >>\nendobj\n`
  );

  // Obj 3: Helvetica
  offsets.push(offset);
  pushBuf(
    "3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n"
  );

  // Obj 4: Helvetica-Bold
  offsets.push(offset);
  pushBuf(
    "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\nendobj\n"
  );

  pages.forEach((pageLines, pageIdx) => {
    const pageObjId = 5 + pageIdx * 2;
    const contentObjId = 6 + pageIdx * 2;

    offsets.push(offset);
    pushBuf(
      `${pageObjId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjId} 0 R >>\nendobj\n`
    );

    const ops: string[] = ["BT"];
    let y = 740;

    if (pageIdx === 0) {
      ops.push("/F2 15 Tf");
      ops.push(`50 ${y} Td`);
      ops.push(`(${safePdfText(title.slice(0, 75))}) Tj`);
      ops.push("0 -24 Td");
      y -= 24;
    } else {
      ops.push(`50 ${y} Td`);
    }

    for (const item of pageLines) {
      if (!item.text) {
        ops.push("0 -10 Td");
        continue;
      }
      if (item.isHeading) {
        ops.push("/F2 11 Tf");
        ops.push(`(${safePdfText(item.text)}) Tj`);
        ops.push("0 -16 Td");
      } else {
        ops.push("/F1 10.5 Tf");
        ops.push(`(${safePdfText(item.text)}) Tj`);
        ops.push("0 -15 Td");
      }
    }

    ops.push("ET");
    ops.push("BT");
    ops.push("/F1 9 Tf");
    ops.push(`270 30 Td (Page ${pageIdx + 1} of ${pages.length}) Tj`);
    ops.push("ET");

    const rawStream = Buffer.from(ops.join("\n"), "latin1");
    const streamData = compress
      ? zlib.deflateSync(rawStream, { level: 9 })
      : rawStream;
    const filterEntry = compress ? " /Filter /FlateDecode" : "";

    offsets.push(offset);
    pushBuf(
      `${contentObjId} 0 obj\n<< /Length ${streamData.length}${filterEntry} >>\nstream\n`
    );
    pushBuf(streamData);
    pushBuf("\nendstream\nendobj\n");
  });

  const xrefStart = offset;
  pushBuf(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
  for (const off of offsets) {
    pushBuf(`${String(off).padStart(10, "0")} 00000 n \n`);
  }
  pushBuf(
    `trailer\n<< /Size ${
      offsets.length + 1
    } /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
  );

  return Buffer.concat(chunks);
}

/**
 * Parses a page range string like "1-3, 5" against totalPages and returns 1-based page numbers.
 */
export function parsePageRange(rangeStr: string, totalPages: number): number[] {
  const pages = new Set<number>();
  const parts = rangeStr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = Math.max(1, parseInt(rangeMatch[1], 10));
      const end = Math.min(totalPages, parseInt(rangeMatch[2], 10));
      for (let p = start; p <= end; p++) pages.add(p);
    } else if (/^\d+$/.test(part)) {
      const p = parseInt(part, 10);
      if (p >= 1 && p <= totalPages) pages.add(p);
    }
  }

  if (pages.size === 0) {
    pages.add(1);
  }
  return Array.from(pages).sort((a, b) => a - b);
}

function rewriteReferences(
  body: Buffer,
  idOffset: number,
  newPagesRootId: number,
  rotationDeg = 0
): Buffer {
  const raw = body.toString("latin1");
  const streamIdx = raw.indexOf("stream");
  const hasStream =
    streamIdx !== -1 &&
    raw.indexOf("<<") !== -1 &&
    raw.indexOf(">>") < streamIdx;

  const rewriteDictStr = (str: string) => {
    let updated = str.replace(/(\d+)\s+0\s+R\b/g, (_, numStr) => {
      return `${parseInt(numStr, 10) + idOffset} 0 R`;
    });
    if (/\/Type\s*\/Page\b(?!s)/.test(updated)) {
      if (/\/Parent\s+\d+\s+0\s+R\b/.test(updated)) {
        updated = updated.replace(
          /\/Parent\s+\d+\s+0\s+R\b/,
          `/Parent ${newPagesRootId} 0 R`
        );
      } else {
        updated = updated.replace(
          /\/Type\s*\/Page\b/,
          `/Type /Page /Parent ${newPagesRootId} 0 R`
        );
      }
      if (rotationDeg !== 0) {
        if (/\/Rotate\s+\d+/.test(updated)) {
          updated = updated.replace(
            /\/Rotate\s+(\d+)/,
            (_, cur) => `/Rotate ${(parseInt(cur, 10) + rotationDeg) % 360}`
          );
        } else {
          updated = updated.replace(
            /\/Type\s*\/Page\b/,
            `/Type /Page /Rotate ${rotationDeg}`
          );
        }
      }
    }
    return updated;
  };

  if (!hasStream) {
    return Buffer.from(rewriteDictStr(raw), "latin1");
  }

  const dictPart = raw.slice(0, streamIdx);
  const newDictBuf = Buffer.from(rewriteDictStr(dictPart), "latin1");
  const streamPartBuf = body.subarray(streamIdx);
  return Buffer.concat([newDictBuf, streamPartBuf]);
}

/**
 * Merges multiple PDF buffers preserving original pages, images, and fonts (including PDF 1.5+ ObjStm objects),
 * or splits specific pages from a PDF buffer.
 */
export function mergeOrSplitPdfBuffers(
  pdfBuffers: { name: string; buffer: Buffer; rotation?: number }[],
  selectedPagesPerDoc?: number[][]
): { buffer: Buffer; totalPages: number } {
  const parsedDocs = pdfBuffers.map((d) => ({
    name: d.name,
    buffer: d.buffer,
    rotation: d.rotation || 0,
    ...parseAllPdfObjects(d.buffer),
  }));

  const allHavePageObjects = parsedDocs.every((d) => d.pageObjIds.length > 0);

  if (allHavePageObjects) {
    let nextIdOffset = 2;
    const outputObjects: { id: number; body: Buffer }[] = [];
    const finalPageIds: number[] = [];

    parsedDocs.forEach((doc, docIdx) => {
      let maxIdInDoc = 0;
      for (const id of doc.objects.keys()) {
        if (id > maxIdInDoc) maxIdInDoc = id;
      }

      const wantedPageNumbers =
        selectedPagesPerDoc && selectedPagesPerDoc[docIdx]
          ? selectedPagesPerDoc[docIdx]
          : doc.pageObjIds.map((_, i) => i + 1);

      const wantedPageObjSet = new Set(
        wantedPageNumbers
          .map((pNum) => doc.pageObjIds[pNum - 1])
          .filter((id): id is number => typeof id === "number")
      );

      for (const [oldId, body] of doc.objects.entries()) {
        const head = body
          .subarray(0, Math.min(body.length, 600))
          .toString("latin1");
        if (/\/Type\s*\/(Catalog|Pages|ObjStm|XRef)\b/.test(head)) continue;
        if (
          /\/Type\s*\/Page\b(?!s)/.test(head) &&
          !wantedPageObjSet.has(oldId)
        ) {
          continue;
        }

        const newId = oldId + nextIdOffset;
        const rewritten = rewriteReferences(
          body,
          nextIdOffset,
          2,
          doc.rotation
        );
        outputObjects.push({ id: newId, body: rewritten });

        if (wantedPageObjSet.has(oldId)) {
          finalPageIds.push(newId);
        }
      }

      nextIdOffset += maxIdInDoc + 1;
    });

    if (finalPageIds.length > 0) {
      const chunks: Buffer[] = [];
      let byteOffset = 0;
      const xrefMap = new Map<number, number>();
      let maxObjId = 2;

      const push = (b: Buffer | string) => {
        const buf = typeof b === "string" ? Buffer.from(b, "latin1") : b;
        chunks.push(buf);
        byteOffset += buf.length;
      };

      push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

      xrefMap.set(1, byteOffset);
      push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

      xrefMap.set(2, byteOffset);
      push(
        `2 0 obj\n<< /Type /Pages /Kids [${finalPageIds
          .map((id) => `${id} 0 R`)
          .join(" ")}] /Count ${finalPageIds.length} >>\nendobj\n`
      );

      for (const obj of outputObjects) {
        if (obj.id > maxObjId) maxObjId = obj.id;
        xrefMap.set(obj.id, byteOffset);
        push(`${obj.id} 0 obj\n`);
        push(obj.body);
        push("\nendobj\n");
      }

      const xrefStart = byteOffset;
      push(`xref\n0 ${maxObjId + 1}\n0000000000 65535 f \n`);
      for (let id = 1; id <= maxObjId; id++) {
        const off = xrefMap.get(id);
        if (off !== undefined) {
          push(`${String(off).padStart(10, "0")} 00000 n \n`);
        } else {
          push("0000000000 65535 f \n");
        }
      }
      push(
        `trailer\n<< /Size ${
          maxObjId + 1
        } /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
      );

      return {
        buffer: Buffer.concat(chunks),
        totalPages: finalPageIds.length,
      };
    }
  }

  const combinedLines: string[] = [];
  for (const doc of pdfBuffers) {
    const extracted = extractStructuredTextFromPdf(doc.buffer);
    if (pdfBuffers.length > 1) {
      combinedLines.push(`--- ${doc.name} ---`);
    }
    combinedLines.push(...extracted.lines);
  }
  const rebuilt = buildMultiPagePdfBuffer(
    pdfBuffers.length > 1 ? "Merged Document" : pdfBuffers[0].name,
    combinedLines,
    true
  );
  return {
    buffer: rebuilt,
    totalPages: Math.max(1, Math.ceil(combinedLines.length / 44)),
  };
}

/**
 * Compresses a PDF buffer using iLovePDF's 3 compression levels:
 * - "less" (high quality, metadata & xref optimization)
 * - "recommended" (level-9 FlateDecode on all streams + metadata removal)
 * - "extreme" (maximum stream re-compression + compact structure)
 */
export function compressPdfBuffer(
  buffer: Buffer,
  level: "less" | "recommended" | "extreme" | "standard" | "high" = "recommended"
): Buffer {
  const { objects, pageObjIds } = parseAllPdfObjects(buffer);

  if (objects.size > 0 && pageObjIds.length > 0) {
    const chunks: Buffer[] = [];
    let byteOffset = 0;
    const xrefMap = new Map<number, number>();
    let maxObjId = 0;

    const push = (b: Buffer | string) => {
      const buf = typeof b === "string" ? Buffer.from(b, "latin1") : b;
      chunks.push(buf);
      byteOffset += buf.length;
    };

    push("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");

    const zlibLevel = level === "less" ? 6 : 9;

    for (const [id, body] of objects.entries()) {
      const raw = body.toString("latin1");
      if (/\/Type\s*\/(Metadata|PieceInfo|Thumb|ObjStm|XRef)\b/.test(raw)) {
        continue;
      }

      if (id > maxObjId) maxObjId = id;
      xrefMap.set(id, byteOffset);

      const streamMatch = raw.match(/^([\s\S]*?<<[\s\S]*?>>)\s*stream\r?\n/);
      if (streamMatch) {
        const dictStr = streamMatch[1];
        const streamStart = streamMatch[0].length;
        const endIdx = raw.lastIndexOf("endstream");
        if (
          endIdx > streamStart &&
          !/\/Subtype\s*\/Image\b/.test(dictStr) &&
          !/\/Filter\b/.test(dictStr)
        ) {
          let streamEnd = endIdx;
          if (raw[streamEnd - 1] === "\n") streamEnd--;
          if (raw[streamEnd - 1] === "\r") streamEnd--;
          const rawSlice = body.subarray(streamStart, streamEnd);
          const compressed = zlib.deflateSync(rawSlice, { level: zlibLevel });
          if (compressed.length < rawSlice.length) {
            const newDict = dictStr
              .replace(/\/Length\s+\d+/, `/Length ${compressed.length}`)
              .replace(/>>\s*$/, ` /Filter /FlateDecode >>`);
            push(`${id} 0 obj\n${newDict}\nstream\n`);
            push(compressed);
            push("\nendstream\nendobj\n");
            continue;
          }
        }
      }

      push(`${id} 0 obj\n`);
      push(body);
      push("\nendobj\n");
    }

    const xrefStart = byteOffset;
    push(`xref\n0 ${maxObjId + 1}\n0000000000 65535 f \n`);
    for (let id = 1; id <= maxObjId; id++) {
      const off = xrefMap.get(id);
      if (off !== undefined) {
        push(`${String(off).padStart(10, "0")} 00000 n \n`);
      } else {
        push("0000000000 65535 f \n");
      }
    }

    const rawFull = buffer.toString("latin1");
    const rootMatch = rawFull.match(/\/Root\s+(\d+)\s+0\s+R/);
    const rootId = rootMatch ? parseInt(rootMatch[1], 10) : 1;

    push(
      `trailer\n<< /Size ${
        maxObjId + 1
      } /Root ${rootId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
    );

    const optimized = Buffer.concat(chunks);
    if (optimized.length < buffer.length) {
      return optimized;
    }
  }

  if (level === "extreme" || level === "high") {
    const { lines } = extractStructuredTextFromPdf(buffer);
    if (lines.length > 0) {
      const compact = buildMultiPagePdfBuffer(
        "Compressed Document",
        lines,
        true
      );
      if (compact.length < buffer.length) {
        return compact;
      }
    }
  }

  return buffer;
}
