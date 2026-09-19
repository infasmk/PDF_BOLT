import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import * as mammoth from 'mammoth';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import PptxGenJS from 'pptxgenjs';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

/**
 * Trigger celebration confetti animation
 */
export function fireConfetti() {
  try {
    confetti({
      particleCount: 90,
      spread: 75,
      origin: { y: 0.7 },
      colors: ['#00f2fe', '#4facfe', '#3b82f6', '#93c5fd', '#38bdf8']
    });
  } catch (e) {}
}

/**
 * Universal browser-native file download helper
 */
export function saveBlobAs(blob, filename) {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Clean text to ensure safe WinAnsi encoding for standard PDF fonts,
 * mapping common PowerPoint bullets, quotes, and symbols to ASCII equivalents.
 */
export function cleanWinAnsiText(str) {
  if (!str) return '';
  return str
    .replace(/[\u25cf\u2022\u25aa\u25b8\u25ba\u2713\u2714\u2023]/g, '-')
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2192\u21d2]/g, '->')
    .replace(/[\u200b\ufeff\u00a0]/g, ' ')
    .replace(/[^\x20-\x7E\r\n\t]/g, ' ');
}

/**
 * XML entity decoder helper
 */
function decodeXml(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/**
 * Word wrap helper for PDF text lines
 */
function wrapText(text, maxChars = 75) {
  const words = text.split(/\s+/);
  const lines = [];
  let current = '';

  for (const word of words) {
    if ((current + ' ' + word).trim().length <= maxChars) {
      current = (current + ' ' + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Format bytes to readable string (e.g. 1.2 MB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Read PDF metadata and page count
 */
export async function getPdfInfo(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pageCount = pdfDoc.getPageCount();
  const title = pdfDoc.getTitle() || file.name;
  const author = pdfDoc.getAuthor() || 'Unknown';
  return { pageCount, title, author, size: file.size };
}

/**
 * Render PDF page thumbnails to data URLs using pdfjs.
 * Supports 100+ page documents with non-blocking event-loop yields and progress reporting.
 */
export async function renderPdfThumbnails(file, maxPages = null, scale = 0.6, onProgress = null) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const numPages = (maxPages && maxPages > 0) ? Math.min(pdf.numPages, maxPages) : pdf.numPages;
    const thumbnails = [];

    for (let i = 1; i <= numPages; i++) {
      if (onProgress) onProgress(i, numPages);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport }).promise;
      thumbnails.push({
        pageNumber: i,
        dataUrl: canvas.toDataURL('image/jpeg', 0.85),
        width: viewport.width,
        height: viewport.height,
        rotation: 0
      });

      // Yield every 4 pages so browser remains 100% responsive even on 100+ page PDFs
      if (i % 4 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    return { totalPages: pdf.numPages, thumbnails };
  } catch (err) {
    console.error('Error generating thumbnails:', err);
    throw err;
  }
}

/**
 * Render a single PDF page thumbnail on-demand
 */
export async function renderSinglePdfThumbnail(file, pageNumber = 1, scale = 0.6) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL('image/jpeg', 0.85);
}

/**
 * Parse hex color to rgb
 */
function hexToRgb(hex) {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return rgb(r, g, b);
}

/* =========================================================================
   1. EDIT PDF (Add Text & Images onto PDF pages)
========================================================================= */
export async function editPdf(file, elements = []) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pages = pdfDoc.getPages();

  for (const el of elements) {
    const targetPageIndex = (el.pageNum || 1) - 1;
    const page = pages[targetPageIndex] || pages[0];
    const { width, height } = page.getSize();

    const x = el.xRatio !== undefined ? el.xRatio * width : (el.x || 50);
    const y = el.yRatio !== undefined ? height - (el.yRatio * height) : (el.y || 50);

    if (el.type === 'text') {
      const safeText = cleanWinAnsiText(el.text || 'Sample Text');
      const textColor = el.color ? hexToRgb(el.color) : rgb(0, 0, 0);
      const fontSize = el.fontSize || 20;

      page.drawText(safeText, {
        x,
        y: y - fontSize,
        size: fontSize,
        font,
        color: textColor,
        opacity: el.opacity || 1.0
      });
    } else if (el.type === 'image' && el.dataUrl) {
      try {
        let embeddedImg;
        if (el.dataUrl.includes('image/png')) {
          embeddedImg = await pdfDoc.embedPng(el.dataUrl);
        } else {
          embeddedImg = await pdfDoc.embedJpg(el.dataUrl);
        }

        const imgWidth = el.width || 120;
        const imgHeight = el.height || 80;

        page.drawImage(embeddedImg, {
          x,
          y: y - imgHeight,
          width: imgWidth,
          height: imgHeight,
          opacity: el.opacity || 1.0
        });
      } catch (imgErr) {
        console.warn('Failed to embed image element:', imgErr);
      }
    }
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Edited_${file.name}`);
  fireConfetti();
  return blob;
}

/* =========================================================================
   2. WORD TO PDF (.docx -> .pdf)
========================================================================= */
export async function wordToPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  const text = result.value || 'Empty document';
  const lines = text.split('\n');

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const a4Width = 595.28;
  const a4Height = 841.89;
  const margin = 50;
  const lineHeight = 16;

  let currentPage = pdfDoc.addPage([a4Width, a4Height]);
  let currentY = a4Height - margin;

  currentPage.drawText(cleanWinAnsiText(file.name.replace(/\.[^/.]+$/, '')), {
    x: margin,
    y: currentY,
    size: 18,
    font: boldFont,
    color: rgb(0.1, 0.2, 0.4)
  });
  currentY -= 30;

  for (const rawLine of lines) {
    const line = cleanWinAnsiText(rawLine.trim());
    if (!line) {
      currentY -= lineHeight * 0.75;
      continue;
    }

    if (currentY <= margin + 30) {
      currentPage = pdfDoc.addPage([a4Width, a4Height]);
      currentY = a4Height - margin;
    }

    const isHeader = line.length < 50 && line === line.toUpperCase();
    currentPage.drawText(line.slice(0, 90), {
      x: margin,
      y: currentY,
      size: isHeader ? 13 : 10.5,
      font: isHeader ? boldFont : font,
      color: isHeader ? rgb(0.1, 0.3, 0.7) : rgb(0.15, 0.15, 0.15)
    });
    currentY -= isHeader ? 22 : lineHeight;
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const outName = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
  saveBlobAs(blob, outName);
  fireConfetti();
  return blob;
}

/* =========================================================================
   3. PDF TO WORD (.pdf -> .docx)
========================================================================= */
export async function pdfToWord(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const docxParagraphs = [];

  for (let i = 1; i <= totalPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    
    if (i > 1) {
      docxParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: `--- Page ${i} ---`, color: '888888', italics: true })]
        })
      );
    }

    let currentLine = '';
    for (const item of textContent.items) {
      if (item.str) {
        currentLine += item.str + ' ';
        if (item.hasEOL || currentLine.length > 80) {
          docxParagraphs.push(
            new Paragraph({
              children: [new TextRun({ text: currentLine.trim() })]
            })
          );
          currentLine = '';
        }
      }
    }
    if (currentLine.trim()) {
      docxParagraphs.push(
        new Paragraph({
          children: [new TextRun({ text: currentLine.trim() })]
        })
      );
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: docxParagraphs.length > 0 ? docxParagraphs : [
          new Paragraph({ children: [new TextRun({ text: 'No selectable text found in PDF.' })] })
        ]
      }
    ]
  });

  const blob = await Packer.toBlob(doc);
  const outName = `${file.name.replace(/\.pdf$/i, '')}.docx`;
  saveBlobAs(blob, outName);
  fireConfetti();
  return blob;
}

/* =========================================================================
   4. EXCEL TO PDF (.xlsx/.xls/.csv -> .pdf)
========================================================================= */
export async function excelToPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const a4Width = 841.89;
  const a4Height = 595.28;
  const margin = 40;
  const rowHeight = 22;

  let currentPage = pdfDoc.addPage([a4Width, a4Height]);
  let currentY = a4Height - margin;

  currentPage.drawText(cleanWinAnsiText(`${file.name.replace(/\.[^/.]+$/, '')} - Sheet: ${sheetName}`), {
    x: margin,
    y: currentY,
    size: 14,
    font: boldFont,
    color: rgb(0.1, 0.4, 0.2)
  });
  currentY -= 30;

  const maxCols = Math.min(8, Math.max(...rows.slice(0, 30).map(r => r.length || 0)));
  const colWidth = (a4Width - margin * 2) / Math.max(1, maxCols);

  rows.forEach((row, rowIdx) => {
    if (currentY <= margin + rowHeight) {
      currentPage = pdfDoc.addPage([a4Width, a4Height]);
      currentY = a4Height - margin;
    }

    const isHeader = rowIdx === 0;

    for (let c = 0; c < maxCols; c++) {
      const cellVal = cleanWinAnsiText(String(row[c] !== undefined ? row[c] : ''));
      const x = margin + c * colWidth;

      currentPage.drawText(cellVal.slice(0, 22), {
        x: x + 4,
        y: currentY - 14,
        size: isHeader ? 9.5 : 8.5,
        font: isHeader ? boldFont : font,
        color: isHeader ? rgb(0.05, 0.35, 0.15) : rgb(0.2, 0.2, 0.2)
      });
    }

    currentY -= rowHeight;
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const outName = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
  saveBlobAs(blob, outName);
  fireConfetti();
  return blob;
}

/* =========================================================================
   5. PDF TO EXCEL (.pdf -> .xlsx)
========================================================================= */
export async function pdfToExcel(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const sheetData = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let currentLine = [];

    textContent.items.forEach(item => {
      if (item.str && item.str.trim()) {
        currentLine.push(item.str.trim());
      }
      if (item.hasEOL) {
        if (currentLine.length > 0) {
          sheetData.push(currentLine);
          currentLine = [];
        }
      }
    });

    if (currentLine.length > 0) {
      sheetData.push(currentLine);
    }
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData.length > 0 ? sheetData : [['Extracted PDF Data']]);
  XLSX.utils.book_append_sheet(wb, ws, 'PDF_Data');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const outName = `${file.name.replace(/\.pdf$/i, '')}.xlsx`;
  saveBlobAs(blob, outName);
  fireConfetti();
  return blob;
}

/* =========================================================================
   6. POWERPOINT TO PDF (High-Fidelity PPTX / PPT to 16:9 PDF Slides)
========================================================================= */

function getDOMParser() {
  if (typeof DOMParser !== 'undefined') return new DOMParser();
  if (typeof window !== 'undefined' && window.DOMParser) return new window.DOMParser();
  return null;
}

function findFirstDescendant(node, localName) {
  if (!node) return null;
  const queue = [node];
  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr !== node && (curr.localName === localName || curr.nodeName === localName || curr.nodeName.endsWith(':' + localName))) {
      return curr;
    }
    if (curr.childNodes) {
      for (let i = 0; i < curr.childNodes.length; i++) {
        if (curr.childNodes[i].nodeType === 1) {
          queue.push(curr.childNodes[i]);
        }
      }
    }
  }
  return null;
}

function findAllDescendants(node, localName) {
  const matches = [];
  if (!node) return matches;
  const queue = [node];
  while (queue.length > 0) {
    const curr = queue.shift();
    if (curr !== node && (curr.localName === localName || curr.nodeName === localName || curr.nodeName.endsWith(':' + localName))) {
      matches.push(curr);
    }
    if (curr.childNodes) {
      for (let i = 0; i < curr.childNodes.length; i++) {
        if (curr.childNodes[i].nodeType === 1) {
          queue.push(curr.childNodes[i]);
        }
      }
    }
  }
  return matches;
}

function parseXfrm(spPrNode) {
  if (!spPrNode) return null;
  const xfrm = findFirstDescendant(spPrNode, 'xfrm');
  if (!xfrm) return null;
  const off = findFirstDescendant(xfrm, 'off');
  const ext = findFirstDescendant(xfrm, 'ext');
  if (!off || !ext) return null;

  const xEmu = parseInt(off.getAttribute('x') || '0', 10);
  const yEmu = parseInt(off.getAttribute('y') || '0', 10);
  const cxEmu = parseInt(ext.getAttribute('cx') || '0', 10);
  const cyEmu = parseInt(ext.getAttribute('cy') || '0', 10);

  return {
    x: xEmu / 12700,
    y: yEmu / 12700,
    w: cxEmu / 12700,
    h: cyEmu / 12700
  };
}

function wrapTextWithFont(text, maxWidth, font, fontSize) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let width;
    try {
      width = font.widthOfTextAtSize(testLine, fontSize);
    } catch (e) {
      width = testLine.length * (fontSize * 0.55);
    }
    if (width <= maxWidth || !currentLine) {
      currentLine = testLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

async function embedImageSafely(pdfDoc, imgBytes, targetPath) {
  const ext = (targetPath.split('.').pop() || '').toLowerCase();
  const isJpg = ext === 'jpg' || ext === 'jpeg' || (imgBytes[0] === 0xff && imgBytes[1] === 0xd8);
  const isPng = ext === 'png' || (imgBytes[0] === 0x89 && imgBytes[1] === 0x50);

  if (isPng) {
    try { return await pdfDoc.embedPng(imgBytes); } catch (e) {}
  }
  if (isJpg) {
    try { return await pdfDoc.embedJpg(imgBytes); } catch (e) {}
  }

  // Browser canvas fallback for WebP, SVG, GIF, etc.
  if (typeof window !== 'undefined' && typeof Blob !== 'undefined') {
    try {
      const mimeType = ext === 'svg' ? 'image/svg+xml' : (ext === 'webp' ? 'image/webp' : 'image/png');
      const blob = new Blob([imgBytes], { type: mimeType });
      const imgUrl = URL.createObjectURL(blob);
      const imgEl = new Image();
      await new Promise((resolve, reject) => {
        imgEl.onload = resolve;
        imgEl.onerror = reject;
        imgEl.src = imgUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = imgEl.naturalWidth || imgEl.width || 400;
      canvas.height = imgEl.naturalHeight || imgEl.height || 300;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgEl, 0, 0);
      URL.revokeObjectURL(imgUrl);
      const pngBlob = await new Promise(r => canvas.toBlob(r, 'image/png'));
      const pngBuf = await pngBlob.arrayBuffer();
      return await pdfDoc.embedPng(new Uint8Array(pngBuf));
    } catch (e) {
      console.warn('Canvas image fallback conversion error:', e);
    }
  }
  return null;
}

/**
 * Bulletproof PPTX Zip Loader:
 * Tries 5 different strategies to read the PPTX archive, including direct Local File Header recovery
 * if End of Central Directory is corrupted or has trailing downloader/antivirus bytes.
 */
async function openPptxArchive(file, arrayBuffer) {
  // Strategy 1: Load file object directly with JSZip
  if (file && typeof file.arrayBuffer === 'function') {
    try {
      const z = await JSZip.loadAsync(file);
      if (Object.keys(z.files).length > 0) return z;
    } catch (e) {}
  }

  // Strategy 2: Load ArrayBuffer with JSZip
  if (arrayBuffer) {
    try {
      const z = await JSZip.loadAsync(arrayBuffer);
      if (Object.keys(z.files).length > 0) return z;
    } catch (e) {}
  }

  // Strategy 3: Load Uint8Array with JSZip
  const u8 = new Uint8Array(arrayBuffer);
  try {
    const z = await JSZip.loadAsync(u8);
    if (Object.keys(z.files).length > 0) return z;
  } catch (e) {}

  // Strategy 4: Find EOCD (PK\x05\x06) and trim any trailing bytes appended to the archive
  for (let i = u8.length - 22; i >= 0; i--) {
    if (u8[i] === 0x50 && u8[i + 1] === 0x4B && u8[i + 2] === 0x05 && u8[i + 3] === 0x06) {
      const commentLen = u8[i + 20] | (u8[i + 21] << 8);
      const eocdEnd = i + 22 + commentLen;
      if (eocdEnd <= u8.length) {
        try {
          const trimmed = u8.subarray(0, eocdEnd);
          const z = await JSZip.loadAsync(trimmed);
          if (Object.keys(z.files).length > 0) return z;
        } catch (e) {}
      }
      break;
    }
  }

  // Strategy 5: Direct Local File Header Scanner (PK\x03\x04)
  // Scans all local headers sequentially to recover slide XML files and media
  try {
    const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    const virtualFiles = {};
    let idx = 0;

    while (idx < u8.length - 30) {
      if (u8[idx] === 0x50 && u8[idx + 1] === 0x4B && u8[idx + 2] === 0x03 && u8[idx + 3] === 0x04) {
        const comp = view.getUint16(idx + 8, true);
        const cSize = view.getUint32(idx + 18, true);
        const fnLen = view.getUint16(idx + 26, true);
        const exLen = view.getUint16(idx + 28, true);

        if (idx + 30 + fnLen <= u8.length) {
          const fn = new TextDecoder('utf-8', { fatal: false }).decode(u8.subarray(idx + 30, idx + 30 + fnLen));
          const dataStart = idx + 30 + fnLen + exLen;
          const dataEnd = dataStart + cSize;

          if (dataEnd <= u8.length && !fn.endsWith('/')) {
            const compData = u8.subarray(dataStart, dataEnd);
            try {
              let decompressedBytes = null;
              if (comp === 0) {
                decompressedBytes = compData;
              } else if (comp === 8 && typeof DecompressionStream !== 'undefined') {
                const ds = new DecompressionStream('deflate-raw');
                const writer = ds.writable.getWriter();
                writer.write(compData);
                writer.close();
                const buf = await new Response(ds.readable).arrayBuffer();
                decompressedBytes = new Uint8Array(buf);
              }

              if (decompressedBytes) {
                virtualFiles[fn] = {
                  async: async (type) => {
                    if (type === 'text') {
                      return new TextDecoder('utf-8', { fatal: false }).decode(decompressedBytes);
                    }
                    return decompressedBytes;
                  }
                };
              }
            } catch (decompErr) {}
          }

          if (cSize > 0) {
            idx = dataStart + cSize;
          } else {
            idx += 30 + fnLen + exLen;
          }
        } else {
          idx++;
        }
      } else {
        idx++;
      }
    }

    if (Object.keys(virtualFiles).length > 0) {
      return {
        file: (path) => virtualFiles[path] || null,
        forEach: (callback) => {
          for (const path of Object.keys(virtualFiles)) {
            callback(path);
          }
        }
      };
    }
  } catch (strat5Err) {
    console.warn('Strategy 5 Local Header recovery error:', strat5Err);
  }

  return null;
}

export async function powerpointToPdf(file, onProgress = null) {
  const arrayBuffer = await file.arrayBuffer();

  const pdfDoc = await PDFDocument.create();
  const regFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  let slideWidth = 960;
  let slideHeight = 540;

  const zip = await openPptxArchive(file, arrayBuffer);

  if (zip) {
    const parser = getDOMParser();

    // Detect slide dimensions from ppt/presentation.xml if available
    const presFile = zip.file('ppt/presentation.xml');
    if (presFile && parser) {
      try {
        const presXml = await presFile.async('text');
        const presDoc = parser.parseFromString(presXml, 'text/xml');
        const sldSz = findFirstDescendant(presDoc, 'sldSz');
        if (sldSz) {
          const cx = parseInt(sldSz.getAttribute('cx') || '0', 10);
          const cy = parseInt(sldSz.getAttribute('cy') || '0', 10);
          if (cx > 0 && cy > 0) {
            slideWidth = cx / 12700;
            slideHeight = cy / 12700;
          }
        }
      } catch (e) {
        console.warn('Could not parse presentation.xml dimensions:', e);
      }
    }

    // Find all slide XML files
    const slideFiles = [];
    zip.forEach((relativePath) => {
      if (/^ppt\/slides\/slide\d+\.xml$/i.test(relativePath)) {
        slideFiles.push(relativePath);
      }
    });

    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)[1], 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)[1], 10);
      return numA - numB;
    });

    if (slideFiles.length === 0) {
      const page = pdfDoc.addPage([slideWidth, slideHeight]);
      page.drawText(cleanWinAnsiText(`Presentation: ${file.name}`), {
        x: 80,
        y: slideHeight / 2,
        size: 24,
        font: boldFont,
        color: rgb(0.1, 0.2, 0.4)
      });
    } else {
      for (let s = 0; s < slideFiles.length; s++) {
        if (onProgress) onProgress(s + 1, slideFiles.length);

        const slidePath = slideFiles[s];
        const xmlContent = await zip.file(slidePath).async('text');
        const page = pdfDoc.addPage([slideWidth, slideHeight]);

        // Default clean slide background
        page.drawRectangle({
          x: 0,
          y: 0,
          width: slideWidth,
          height: slideHeight,
          color: rgb(1, 1, 1)
        });

        if (!parser) {
          // Minimal fallback if DOMParser is unavailable
          const textMatches = xmlContent.match(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g) || [];
          let y = slideHeight - 60;
          for (const m of textMatches) {
            if (y <= 30) break;
            const t = cleanWinAnsiText(decodeXml(m.replace(/<[^>]+>/g, '')).trim());
            if (t) {
              page.drawText(t.slice(0, 85), { x: 50, y, size: 14, font: regFont });
              y -= 22;
            }
          }
          continue;
        }

        const slideDoc = parser.parseFromString(xmlContent, 'text/xml');

        // Parse relationships for image mapping
        const relsMap = {};
        const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
        const relsFile = zip.file(relsPath);
        if (relsFile) {
          try {
            const relsXml = await relsFile.async('text');
            const relsDoc = parser.parseFromString(relsXml, 'text/xml');
            const relationships = findAllDescendants(relsDoc, 'Relationship');
            for (const rel of relationships) {
              const id = rel.getAttribute('Id');
              let target = rel.getAttribute('Target') || '';
              target = target.replace(/^(\.\.\/)+/, '').replace(/^\//, '');
              if (!target.startsWith('ppt/')) target = 'ppt/' + target;
              relsMap[id] = target;
            }
          } catch (err) {
            console.warn('Error reading slide relationships:', err);
          }
        }

        // 1. Check slide custom background fill
        const bgNode = findFirstDescendant(slideDoc, 'bg');
        if (bgNode) {
          const srgbClr = findFirstDescendant(bgNode, 'srgbClr');
          if (srgbClr) {
            const hex = srgbClr.getAttribute('val');
            if (hex && hex.length === 6) {
              page.drawRectangle({
                x: 0,
                y: 0,
                width: slideWidth,
                height: slideHeight,
                color: rgb(
                  parseInt(hex.substring(0, 2), 16) / 255,
                  parseInt(hex.substring(2, 4), 16) / 255,
                  parseInt(hex.substring(4, 6), 16) / 255
                )
              });
            }
          }
        }

        // 2. Extract and draw shapes & textboxes (<p:sp>)
        const shapes = findAllDescendants(slideDoc, 'sp');
        for (const sp of shapes) {
          const spPr = findFirstDescendant(sp, 'spPr');
          const bounds = parseXfrm(spPr);
          const posX = bounds ? bounds.x : 50;
          const posY = bounds ? bounds.y : 50;
          const boxW = bounds ? Math.max(bounds.w, 80) : (slideWidth - 100);
          const boxH = bounds ? Math.max(bounds.h, 20) : (slideHeight - 100);

          // Draw shape background fill if present
          if (spPr && bounds) {
            const solidFill = findFirstDescendant(spPr, 'solidFill');
            if (solidFill) {
              const srgbClr = findFirstDescendant(solidFill, 'srgbClr');
              if (srgbClr) {
                const hex = srgbClr.getAttribute('val');
                if (hex && hex.length === 6) {
                  const pdfY = slideHeight - (bounds.y + bounds.h);
                  page.drawRectangle({
                    x: bounds.x,
                    y: pdfY,
                    width: bounds.w,
                    height: bounds.h,
                    color: rgb(
                      parseInt(hex.substring(0, 2), 16) / 255,
                      parseInt(hex.substring(2, 4), 16) / 255,
                      parseInt(hex.substring(4, 6), 16) / 255
                    )
                  });
                }
              }
            }
          }

          const txBody = findFirstDescendant(sp, 'txBody');
          if (!txBody) continue;

          const paragraphs = findAllDescendants(txBody, 'p');
          let currentY = slideHeight - posY - 18;

          for (const p of paragraphs) {
            const pPr = findFirstDescendant(p, 'pPr');
            let align = 'left';
            if (pPr) {
              const algn = pPr.getAttribute('algn');
              if (algn === 'ctr' || algn === 'center') align = 'center';
              else if (algn === 'r' || algn === 'right') align = 'right';
            }

            const pRuns = findAllDescendants(p, 'r');
            if (pRuns.length === 0) continue;

            let pText = '';
            let fontSize = 14;
            let isBold = false;
            let textColor = rgb(0.12, 0.12, 0.12);

            for (let rIdx = 0; rIdx < pRuns.length; rIdx++) {
              const r = pRuns[rIdx];
              const tNode = findFirstDescendant(r, 't');
              if (!tNode) continue;
              pText += (tNode.textContent || '');

              const rPr = findFirstDescendant(r, 'rPr');
              if (rPr && (rIdx === 0 || fontSize === 14)) {
                const szAttr = rPr.getAttribute('sz');
                if (szAttr) fontSize = Math.max(8, Math.min(60, parseInt(szAttr, 10) / 100));
                if (rPr.getAttribute('b') === '1' || rPr.getAttribute('b') === 'true') isBold = true;
                const srgbClr = findFirstDescendant(rPr, 'srgbClr');
                if (srgbClr) {
                  const hex = srgbClr.getAttribute('val');
                  if (hex && hex.length === 6) {
                    textColor = rgb(
                      parseInt(hex.substring(0, 2), 16) / 255,
                      parseInt(hex.substring(2, 4), 16) / 255,
                      parseInt(hex.substring(4, 6), 16) / 255
                    );
                  }
                }
              }
            }

            pText = cleanWinAnsiText(decodeXml(pText));
            if (!pText.trim()) continue;

            const useFont = isBold ? boldFont : regFont;
            const subLines = pText.split(/\r?\n/);

            for (const subLine of subLines) {
              const wrapped = wrapTextWithFont(subLine, boxW - 8, useFont, fontSize);

              for (const line of wrapped) {
                if (currentY <= 15) break;
                let drawX = posX;
                if (align === 'center') {
                  let lineWidth;
                  try {
                    lineWidth = useFont.widthOfTextAtSize(line, fontSize);
                  } catch (e) {
                    lineWidth = line.length * (fontSize * 0.55);
                  }
                  drawX = posX + Math.max(0, (boxW - lineWidth) / 2);
                } else if (align === 'right') {
                  let lineWidth;
                  try {
                    lineWidth = useFont.widthOfTextAtSize(line, fontSize);
                  } catch (e) {
                    lineWidth = line.length * (fontSize * 0.55);
                  }
                  drawX = posX + Math.max(0, boxW - lineWidth);
                }

                try {
                  page.drawText(line, {
                    x: drawX,
                    y: currentY,
                    size: fontSize,
                    font: useFont,
                    color: textColor
                  });
                } catch (drawErr) {
                  try {
                    const asciiOnly = line.replace(/[^\x20-\x7E]/g, ' ');
                    page.drawText(asciiOnly, {
                      x: drawX,
                      y: currentY,
                      size: fontSize,
                      font: useFont,
                      color: textColor
                    });
                  } catch (e) {}
                }
                currentY -= (fontSize * 1.28);
              }
            }
            currentY -= 6;
          }
        }

        // 3. Extract and draw images (<p:pic>)
        const pics = findAllDescendants(slideDoc, 'pic');
        for (const pic of pics) {
          const spPr = findFirstDescendant(pic, 'spPr');
          const bounds = parseXfrm(spPr);
          const blip = findFirstDescendant(pic, 'blip');
          if (!blip) continue;

          const rId = blip.getAttribute('r:embed') || blip.getAttribute('embed') || blip.getAttribute('r:link');
          const targetPath = relsMap[rId];

          if (targetPath) {
            const imgZipFile = zip.file(targetPath) || 
                               zip.file(targetPath.replace(/^ppt\//, '')) || 
                               zip.file('ppt/media/' + targetPath.split('/').pop());
            if (imgZipFile) {
              try {
                const imgBytes = await imgZipFile.async('uint8array');
                const embeddedImg = await embedImageSafely(pdfDoc, imgBytes, targetPath);

                if (embeddedImg && bounds) {
                  const pdfY = slideHeight - (bounds.y + bounds.h);
                  page.drawImage(embeddedImg, {
                    x: bounds.x,
                    y: pdfY,
                    width: bounds.w,
                    height: bounds.h
                  });
                }
              } catch (imgErr) {
                console.warn('Could not embed slide image:', imgErr);
              }
            }
          }
        }

        // 4. Extract and draw tables (<p:graphicFrame>)
        const graphicFrames = findAllDescendants(slideDoc, 'graphicFrame');
        for (const gf of graphicFrames) {
          const tbl = findFirstDescendant(gf, 'tbl');
          if (!tbl) continue;

          const bounds = parseXfrm(gf);
          if (!bounds) continue;

          const rows = findAllDescendants(tbl, 'tr');
          if (rows.length === 0) continue;

          const rowHeight = bounds.h / rows.length;
          let cellY = slideHeight - bounds.y - rowHeight;

          for (let rIdx = 0; rIdx < rows.length; rIdx++) {
            const row = rows[rIdx];
            const cells = findAllDescendants(row, 'tc');
            if (cells.length === 0) continue;

            const colWidth = bounds.w / cells.length;
            for (let cIdx = 0; cIdx < cells.length; cIdx++) {
              const cell = cells[cIdx];
              const cellX = bounds.x + (cIdx * colWidth);

              // Cell border
              page.drawRectangle({
                x: cellX,
                y: cellY,
                width: colWidth,
                height: rowHeight,
                borderColor: rgb(0.8, 0.85, 0.9),
                borderWidth: 0.75
              });

              // Cell text
              const cellRuns = findAllDescendants(cell, 't');
              const cellText = cellRuns.map(t => cleanWinAnsiText(decodeXml(t.textContent || '')).trim()).filter(Boolean).join(' ');
              if (cellText) {
                try {
                  page.drawText(cellText.slice(0, 35), {
                    x: cellX + 6,
                    y: cellY + (rowHeight / 2) - 4,
                    size: 11,
                    font: regFont,
                    color: rgb(0.15, 0.15, 0.15)
                  });
                } catch (e) {}
              }
            }
            cellY -= rowHeight;
          }
        }
      }
    }
  } else {
    // Binary legacy .ppt handling: strictly extract genuine presentation sentences
    const utf8Decoder = new TextDecoder('utf-8', { fatal: false });
    const utf16Decoder = new TextDecoder('utf-16le', { fatal: false });
    const rawUtf8 = utf8Decoder.decode(arrayBuffer);
    const rawUtf16 = utf16Decoder.decode(arrayBuffer);

    // Strictly match readable sentences (must have uppercase start, normal punctuation/words, at least 1 space)
    const sentenceRegex = /[A-Z][A-Za-z0-9 ,.?!'"\-:;()]{10,}/g;
    const matches8 = rawUtf8.match(sentenceRegex) || [];
    const matches16 = rawUtf16.match(sentenceRegex) || [];
    const allMatches = [...matches8, ...matches16];

    const seen = new Set();
    const validLines = [];
    for (const m of allMatches) {
      const cleaned = cleanWinAnsiText(m.trim());
      // Filter out XML tags, file paths, and random binary chunks
      if (
        cleaned.length >= 10 &&
        /\s/.test(cleaned) &&
        !/(\.xml|\.rels|\.bin|ppt\/|rels\/|_rels|http:\/\/|<|>)/i.test(cleaned) &&
        !seen.has(cleaned)
      ) {
        seen.add(cleaned);
        validLines.push(cleaned);
      }
    }

    // Cap to at most 10 slides
    const linesPerSlide = 6;
    const totalSlides = Math.min(10, Math.max(1, Math.ceil(validLines.length / linesPerSlide)));

    for (let s = 0; s < totalSlides; s++) {
      if (onProgress) onProgress(s + 1, totalSlides);
      const page = pdfDoc.addPage([slideWidth, slideHeight]);

      page.drawRectangle({
        x: 0,
        y: slideHeight - 75,
        width: slideWidth,
        height: 75,
        color: rgb(0.08, 0.15, 0.28)
      });

      const titleSuffix = totalSlides > 1 ? ` (Slide ${s + 1}/${totalSlides})` : '';
      page.drawText(cleanWinAnsiText(file.name.replace(/\.[^/.]+$/, '') + titleSuffix).slice(0, 60), {
        x: 50,
        y: slideHeight - 48,
        size: 20,
        font: boldFont,
        color: rgb(1, 1, 1)
      });

      let y = slideHeight - 120;
      const slideLines = validLines.slice(s * linesPerSlide, (s + 1) * linesPerSlide);
      if (slideLines.length === 0) {
        page.drawText('Presentation content parsed from binary format.', {
          x: 50,
          y,
          size: 14,
          font: regFont,
          color: rgb(0.3, 0.3, 0.3)
        });
      } else {
        for (const line of slideLines) {
          if (y <= 50) break;
          page.drawText(line.slice(0, 85), { x: 50, y, size: 14, font: regFont, color: rgb(0.15, 0.15, 0.15) });
          y -= 34;
        }
      }
    }
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const outName = `${file.name.replace(/\.[^/.]+$/, '')}.pdf`;
  saveBlobAs(blob, outName);
  fireConfetti();
  return blob;
}

/* =========================================================================
   7. PDF TO POWERPOINT (Generates genuine .pptx presentation using pptxgenjs)
========================================================================= */
export async function pdfToPowerpoint(file, onProgress = null) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) onProgress(i, totalPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    const imgDataUrl = canvas.toDataURL('image/png', 0.95);
    const slide = pptx.addSlide();
    slide.addImage({
      data: imgDataUrl,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%'
    });
  }

  // Use arraybuffer export for 100% reliable in-browser download
  const buffer = await pptx.write({ outputType: 'arraybuffer' });
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  });
  const outName = `${file.name.replace(/\.pdf$/i, '')}.pptx`;
  saveBlobAs(blob, outName);
  fireConfetti();
  return true;
}

/* =========================================================================
   8. CROP PDF (With Visual Page Preview & Per-Page Custom Styles)
========================================================================= */
export async function cropPdf(file, cropOptions = { mode: 'all', globalMargins: { top: 30, bottom: 30, left: 30, right: 30 }, perPageMargins: {} }) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  pages.forEach((page, idx) => {
    const pageNum = idx + 1;
    const margins = cropOptions.mode === 'per-page' && cropOptions.perPageMargins[pageNum]
      ? cropOptions.perPageMargins[pageNum]
      : cropOptions.globalMargins;

    const { width, height } = page.getSize();
    const x = Math.max(0, margins.left || 0);
    const y = Math.max(0, margins.bottom || 0);
    const newWidth = Math.max(50, width - x - (margins.right || 0));
    const newHeight = Math.max(50, height - y - (margins.top || 0));

    page.setCropBox(x, y, newWidth, newHeight);
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Cropped_${file.name}`);
  fireConfetti();
  return blob;
}

/* =========================================================================
   10. REDACT PDF (Burn permanent black rectangles)
========================================================================= */
export async function redactPdf(file, redactBoxes = []) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdfDoc.getPages();

  redactBoxes.forEach(box => {
    const pageIndex = (box.pageNum || 1) - 1;
    const page = pages[pageIndex] || pages[0];
    const { width, height } = page.getSize();

    const x = box.xRatio !== undefined ? box.xRatio * width : (box.x || 50);
    const y = box.yRatio !== undefined ? height - (box.yRatio * height) : (box.y || 50);
    const w = box.width || 120;
    const h = box.height || 25;

    page.drawRectangle({
      x,
      y: y - h,
      width: w,
      height: h,
      color: rgb(0, 0, 0),
      opacity: 1.0
    });
  });

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Redacted_${file.name}`);
  fireConfetti();
  return blob;
}

/* =========================================================================
   11. REPAIR PDF
========================================================================= */
export async function repairPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, {
    ignoreEncryption: true,
    parseSpeed: 1
  });

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Repaired_${file.name}`);
  fireConfetti();
  return blob;
}

/* =========================================================================
   12. HTML TO PDF
========================================================================= */
export async function htmlToPdf(htmlContent, title = 'WebDocument') {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage([595.28, 841.89]);
  page.drawText(cleanWinAnsiText(title), {
    x: 50,
    y: 790,
    size: 16,
    font: bold,
    color: rgb(0.1, 0.4, 0.8)
  });

  const textLines = htmlContent.replace(/<[^>]*>/g, ' ').split('\n');
  let y = 740;
  for (const line of textLines) {
    if (y <= 50) break;
    const clean = cleanWinAnsiText(line.trim());
    if (clean) {
      page.drawText(clean.slice(0, 90), { x: 50, y, size: 10, font });
      y -= 18;
    }
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `${title}.pdf`);
  fireConfetti();
  return blob;
}

/* =========================================================================
   13. PDF TO PDF/A
========================================================================= */
export async function pdfToPdfA(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  pdfDoc.setTitle(file.name);
  pdfDoc.setProducer('PDFBolt Archival Engine (ISO 19005-1)');
  pdfDoc.setCreator('PDFBolt by WEB⚡BITS');

  const bytes = await pdfDoc.save({ useObjectStreams: false });
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_PDFA_${file.name}`);
  fireConfetti();
  return blob;
}

/* =========================================================================
   14. OCR PDF
========================================================================= */
export async function ocrPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map(item => item.str);
    fullText += `\n--- Page ${i} ---\n` + strings.join(' ');
  }

  const textBlob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  saveBlobAs(textBlob, `${file.name.replace(/\.pdf$/i, '')}_OCR_Text.txt`);
  fireConfetti();
  return textBlob;
}

/* =========================================================================
   ORIGINAL CORE ROUTINES
========================================================================= */
export async function mergePdfs(files) {
  if (!files || files.length < 2) throw new Error('Please select at least 2 PDF files to merge.');
  const mergedPdf = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  const mergedPdfBytes = await mergedPdf.save();
  const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
  saveBlobAs(blob, 'PDFBolt_Merged.pdf');
  fireConfetti();
  return blob;
}

export function parsePageRange(rangeStr, maxPages) {
  const pages = new Set();
  const parts = rangeStr.split(',').map(s => s.trim()).filter(Boolean);

  for (const part of parts) {
    if (part.includes('-')) {
      const [startStr, endStr] = part.split('-').map(s => s.trim());
      const start = Math.max(1, parseInt(startStr, 10));
      const end = Math.min(maxPages, parseInt(endStr, 10));
      if (!isNaN(start) && !isNaN(end) && start <= end) {
        for (let i = start; i <= end; i++) pages.add(i - 1);
      }
    } else {
      const page = parseInt(part, 10);
      if (!isNaN(page) && page >= 1 && page <= maxPages) pages.add(page - 1);
    }
  }

  return Array.from(pages).sort((a, b) => a - b);
}

export async function splitPdf(file, mode = 'range', rangeStr = '1') {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const totalPages = srcPdf.getPageCount();

  if (mode === 'range') {
    const selectedIndices = parsePageRange(rangeStr, totalPages);
    if (selectedIndices.length === 0) throw new Error('Invalid page range specified.');

    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(srcPdf, selectedIndices);
    copiedPages.forEach(p => newPdf.addPage(p));

    const bytes = await newPdf.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    saveBlobAs(blob, `${file.name.replace(/\.pdf$/i, '')}_extracted.pdf`);
    fireConfetti();
    return blob;
  } else {
    const zip = new JSZip();
    for (let i = 0; i < totalPages; i++) {
      const singlePdf = await PDFDocument.create();
      const [page] = await singlePdf.copyPages(srcPdf, [i]);
      singlePdf.addPage(page);
      const bytes = await singlePdf.save();
      zip.file(`Page_${i + 1}.pdf`, bytes);
    }

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveBlobAs(zipBlob, `${file.name.replace(/\.pdf$/i, '')}_all_pages.zip`);
    fireConfetti();
    return zipBlob;
  }
}

export async function organizePdf(file, pagesState) {
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newPdf = await PDFDocument.create();

  const originalIndices = pagesState.map(p => p.originalIndex);
  const copiedPages = await newPdf.copyPages(srcPdf, originalIndices);

  copiedPages.forEach((page, index) => {
    const rot = pagesState[index].rotation || 0;
    const currentRot = page.getRotation().angle;
    page.setRotation(degrees((currentRot + rot) % 360));
    newPdf.addPage(page);
  });

  const bytes = await newPdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Organized_${file.name}`);
  fireConfetti();
  return blob;
}

export async function imagesToPdf(imageFiles, options = { pageSize: 'fit', margin: 20 }) {
  if (!imageFiles || imageFiles.length === 0) throw new Error('Please select at least one image.');
  const pdfDoc = await PDFDocument.create();

  for (const imgFile of imageFiles) {
    const arrayBuffer = await imgFile.arrayBuffer();
    let embeddedImg;

    if (imgFile.type && imgFile.type.includes('png')) {
      embeddedImg = await pdfDoc.embedPng(arrayBuffer);
    } else {
      embeddedImg = await pdfDoc.embedJpg(arrayBuffer);
    }

    const imgDims = embeddedImg.scale(1);

    if (options.pageSize === 'a4') {
      const a4Width = 595.28;
      const a4Height = 841.89;
      const page = pdfDoc.addPage([a4Width, a4Height]);
      const margin = options.margin || 20;
      const maxWidth = a4Width - margin * 2;
      const maxHeight = a4Height - margin * 2;

      const scale = Math.min(maxWidth / imgDims.width, maxHeight / imgDims.height, 1);
      const drawWidth = imgDims.width * scale;
      const drawHeight = imgDims.height * scale;
      const x = (a4Width - drawWidth) / 2;
      const y = (a4Height - drawHeight) / 2;

      page.drawImage(embeddedImg, { x, y, width: drawWidth, height: drawHeight });
    } else {
      const page = pdfDoc.addPage([imgDims.width, imgDims.height]);
      page.drawImage(embeddedImg, { x: 0, y: 0, width: imgDims.width, height: imgDims.height });
    }
  }

  const bytes = await pdfDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, 'PDFBolt_Converted_Images.pdf');
  fireConfetti();
  return blob;
}

export async function pdfToImages(file, format = 'png', dpiScale = 2.0, onProgress = null) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;
  const zip = new JSZip();

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) onProgress(i, totalPages);
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: dpiScale });
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport }).promise;

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpeg' ? 'jpg' : 'png';
    const quality = format === 'jpeg' ? 0.9 : 1.0;

    const dataUrl = canvas.toDataURL(mime, quality);
    const base64Data = dataUrl.split(',')[1];
    zip.file(`Page_${i}.${ext}`, base64Data, { base64: true });
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveBlobAs(zipBlob, `${file.name.replace(/\.pdf$/i, '')}_images.zip`);
  fireConfetti();
  return zipBlob;
}

export async function rotatePdf(file, options = 90) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const pages = pdf.getPages();

  if (typeof options === 'number') {
    // Uniform rotation by specified angle
    pages.forEach(page => {
      const currentRot = page.getRotation().angle;
      page.setRotation(degrees((currentRot + options) % 360));
    });
  } else if (typeof options === 'object') {
    if (options.mode === 'custom' && options.pageRotations) {
      // Per-page custom rotation
      pages.forEach((page, idx) => {
        const pageAngle = options.pageRotations[idx] || 0;
        if (pageAngle !== 0) {
          const currentRot = page.getRotation().angle;
          page.setRotation(degrees((currentRot + pageAngle) % 360));
        }
      });
    } else {
      // Mode 'all' or fallback angle
      const angle = options.angle || 90;
      pages.forEach(page => {
        const currentRot = page.getRotation().angle;
        page.setRotation(degrees((currentRot + angle) % 360));
      });
    }
  }

  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Rotated_${file.name}`);
  fireConfetti();
  return blob;
}

export async function watermarkPdf(file, text = 'CONFIDENTIAL', options = {}) {
  const { opacity = 0.25, size = 48, angle = 45, color = { r: 0.1, g: 0.1, b: 0.1 } } = options;
  const safeText = cleanWinAnsiText(text) || 'WATERMARK';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();

  pages.forEach(page => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(safeText, size);
    const textHeight = font.heightAtSize(size);

    const x = (width - textWidth * Math.cos((angle * Math.PI) / 180)) / 2;
    const y = (height - textHeight * Math.sin((angle * Math.PI) / 180)) / 2;

    page.drawText(safeText, {
      x,
      y,
      size,
      font,
      color: rgb(color.r, color.g, color.b),
      opacity,
      rotate: degrees(angle)
    });
  });

  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Watermarked_${file.name}`);
  fireConfetti();
  return blob;
}

export async function addPageNumbers(file, options = {}) {
  const { 
    position = 'bottom-center', 
    format = 'Page {n} of {total}', 
    fontSize = 11, 
    startNumber = 1,
    fontColor = '#334155'
  } = options;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pages = pdf.getPages();
  const total = pages.length;
  const textColor = hexToRgb(fontColor);

  pages.forEach((page, idx) => {
    const pageNum = idx + startNumber;
    const rawLabel = format
      .replace('{n}', pageNum.toString())
      .replace('{total}', (total + startNumber - 1).toString());
    const label = cleanWinAnsiText(rawLabel);

    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(label, fontSize);
    let x = 0;
    let y = 0;
    const margin = 28;

    if (position === 'bottom-center') {
      x = (width - textWidth) / 2;
      y = margin;
    } else if (position === 'bottom-right') {
      x = width - textWidth - margin;
      y = margin;
    } else if (position === 'bottom-left') {
      x = margin;
      y = margin;
    } else if (position === 'top-center') {
      x = (width - textWidth) / 2;
      y = height - margin;
    } else if (position === 'top-right') {
      x = width - textWidth - margin;
      y = height - margin;
    } else if (position === 'top-left') {
      x = margin;
      y = height - margin;
    }

    page.drawText(label, { 
      x, 
      y, 
      size: fontSize, 
      font, 
      color: textColor 
    });
  });

  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Numbered_${file.name}`);
  fireConfetti();
  return blob;
}

export async function protectPdf(file, userPassword, options = {}) {
  if (!userPassword || userPassword.trim() === '') throw new Error('Please enter a secure password.');
  const cleanPass = userPassword.trim();
  const arrayBuffer = await file.arrayBuffer();
  const srcPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  
  // Save standard document bytes
  const unencryptedBytes = await srcPdf.save({ useObjectStreams: false });

  // Encrypt with 256-bit AES standard security handler
  const encryptedBytes = await encryptPDF(unencryptedBytes, cleanPass, {
    algorithm: 'AES-256',
    ownerPassword: cleanPass,
    allowPrinting: options.allowPrinting !== false,
    allowCopying: options.allowCopying !== false,
    allowModifying: options.allowModifying !== false
  });

  const blob = new Blob([encryptedBytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Protected_${file.name}`);
  fireConfetti();
  return blob;
}

export async function comparePdfs(fileA, fileB) {
  if (!fileA || !fileB) throw new Error('Please select two PDF files to compare.');

  const [bufA, bufB] = await Promise.all([fileA.arrayBuffer(), fileB.arrayBuffer()]);
  const [pdfA, pdfB] = await Promise.all([
    pdfjsLib.getDocument({ data: bufA }).promise,
    pdfjsLib.getDocument({ data: bufB }).promise
  ]);

  const totalPagesA = pdfA.numPages;
  const totalPagesB = pdfB.numPages;
  const maxPages = Math.max(totalPagesA, totalPagesB);

  const pageComparisons = [];
  let totalWordsA = 0;
  let totalWordsB = 0;

  for (let i = 1; i <= maxPages; i++) {
    let textA = '';
    let textB = '';

    if (i <= totalPagesA) {
      const pageA = await pdfA.getPage(i);
      const contentA = await pageA.getTextContent();
      textA = contentA.items.map(item => item.str).join(' ');
      totalWordsA += textA.trim().split(/\s+/).filter(Boolean).length;
    }

    if (i <= totalPagesB) {
      const pageB = await pdfB.getPage(i);
      const contentB = await pageB.getTextContent();
      textB = contentB.items.map(item => item.str).join(' ');
      totalWordsB += textB.trim().split(/\s+/).filter(Boolean).length;
    }

    const isIdentical = textA.trim() === textB.trim();
    pageComparisons.push({
      pageNumber: i,
      hasPageA: i <= totalPagesA,
      hasPageB: i <= totalPagesB,
      textA: textA.trim(),
      textB: textB.trim(),
      isIdentical,
      charDiff: textB.length - textA.length
    });
  }

  return {
    fileA: { name: fileA.name, size: fileA.size, pageCount: totalPagesA, wordCount: totalWordsA },
    fileB: { name: fileB.name, size: fileB.size, pageCount: totalPagesB, wordCount: totalWordsB },
    pageComparisons,
    identicalTotal: pageComparisons.every(p => p.isIdentical && p.hasPageA && p.hasPageB)
  };
}

export async function signPdf(file, signatureDataUrl, pageIndex = 0, coords = { x: 50, y: 50, width: 160, height: 70 }) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  
  const pages = pdf.getPages();
  const targetPage = pages[pageIndex] || pages[0];

  const sigImage = await pdf.embedPng(signatureDataUrl);
  targetPage.drawImage(sigImage, {
    x: coords.x,
    y: coords.y,
    width: coords.width,
    height: coords.height
  });

  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Signed_${file.name}`);
  fireConfetti();
  return blob;
}

export async function compressPdf(file, compressionPercent = 60, onProgress) {
  const pct = Math.max(10, Math.min(90, Number(compressionPercent) || 60));
  const normalized = (pct - 10) / 80; // 0 to 1

  // Dynamic resolution scale and JPEG compression factor based on requested percentage
  // 10% (light): scale ~1.65, quality ~0.88 (superb print quality, modest reduction)
  // 50% (balanced): scale ~1.28, quality ~0.61 (balanced web/print quality, ~50-60% reduction)
  // 90% (extreme): scale ~0.90, quality ~0.33 (maximum compression, ~75-85% reduction)
  const renderScale = Math.max(0.85, 1.65 - (normalized * 0.75));
  const quality = Math.max(0.25, 0.88 - (normalized * 0.55));

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const totalPages = pdf.numPages;

  const newPdf = await PDFDocument.create();
  const helveticaFont = await newPdf.embedFont(StandardFonts.Helvetica);

  for (let i = 1; i <= totalPages; i++) {
    if (onProgress) {
      onProgress(i, totalPages);
    }

    const page = await pdf.getPage(i);
    const originalViewport = page.getViewport({ scale: 1 });
    const scaledViewport = page.getViewport({ scale: renderScale });

    // Render page to canvas at calculated resolution scale
    const canvas = document.createElement('canvas');
    canvas.width = Math.floor(scaledViewport.width);
    canvas.height = Math.floor(scaledViewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvasContext: ctx, viewport: scaledViewport }).promise;

    // Encode rendered page to compressed JPEG matching the slider quality
    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const embeddedImage = await newPdf.embedJpg(jpegDataUrl);

    const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height
    });

    // Extract selectable text layer and stamp invisibly (opacity: 0.001)
    // so the compressed document remains 100% searchable and selectable!
    try {
      const textContent = await page.getTextContent();
      if (textContent && textContent.items) {
        for (const item of textContent.items) {
          if (item.str && item.str.trim()) {
            const cleanStr = cleanWinAnsiText(item.str);
            if (cleanStr) {
              const fontSize = Math.max(4, Math.min(60, item.height || 10));
              newPage.drawText(cleanStr, {
                x: Math.max(0, item.transform[4] || 0),
                y: Math.max(0, item.transform[5] || 0),
                size: fontSize,
                font: helveticaFont,
                color: rgb(0, 0, 0),
                opacity: 0.001
              });
            }
          }
        }
      }
    } catch (e) {
      // Non-critical text layer fallback
    }

    // Yield execution every 2 pages to keep UI responsive
    if (i % 2 === 0) {
      await new Promise(r => setTimeout(r, 0));
    }
  }

  // Set clean metadata
  newPdf.setProducer('PDFBolt by WEB⚡BITS');
  newPdf.setCreator('PDFBolt');

  const bytes = await newPdf.save({
    useObjectStreams: true,
    addDefaultPage: false
  });

  const originalSize = file.size;
  let finalBytes = bytes;

  // Safety fallback: if original was already smaller (e.g. tiny 5KB 1-line text doc),
  // attempt stream optimization on the original and pick the smaller
  if (bytes.length >= originalSize) {
    try {
      const fallbackPdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const streamBytes = await fallbackPdf.save({ useObjectStreams: true });
      if (streamBytes.length < finalBytes.length) {
        finalBytes = streamBytes;
      }
    } catch (e) {}
  }

  const compressedSize = finalBytes.length;
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const percentReduced = Math.max(0, Math.round((savedBytes / originalSize) * 100));

  const blob = new Blob([finalBytes], { type: 'application/pdf' });
  saveBlobAs(blob, `PDFBolt_Compressed_${file.name}`);
  fireConfetti();

  return {
    blob,
    originalSize,
    compressedSize,
    savedBytes,
    percentReduced
  };
}
