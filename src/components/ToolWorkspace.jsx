import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, UploadCloud, Trash2, ArrowUp, ArrowDown, RotateCw, 
  CheckCircle2, Download, AlertCircle, Loader2, FileText, 
  Infinity as InfinityIcon, Plus, Type, Image as ImageIcon,
  Crop, EyeOff, Wrench, FileCheck, Search, ShieldCheck,
  Columns2, Sparkles, ArrowRight, ArrowLeftRight, Check, Hash, Sliders, Eye,
  Percent, Gauge, Zap
} from 'lucide-react';
import { 
  mergePdfs, splitPdf, organizePdf, imagesToPdf, 
  pdfToImages, rotatePdf, watermarkPdf, addPageNumbers, 
  protectPdf, signPdf, compressPdf, renderPdfThumbnails, 
  editPdf, wordToPdf, pdfToWord, excelToPdf, pdfToExcel,
  powerpointToPdf, pdfToPowerpoint, cropPdf,
  redactPdf, repairPdf, htmlToPdf, pdfToPdfA, ocrPdf,
  formatBytes, getPdfInfo, comparePdfs, renderSinglePdfThumbnail
} from '../utils/pdfEngine';
import { PDF_TOOLS } from '../data/toolsData';
import { recordGlobalProcess } from '../utils/syncService';

export default function ToolWorkspace({ toolId, initialFiles, onClose }) {
  const tool = PDF_TOOLS.find(t => t.id === toolId) || PDF_TOOLS[0];

  const [files, setFiles] = useState(initialFiles || []);
  const [docInfo, setDocInfo] = useState(null);
  const [thumbnails, setThumbnails] = useState([]);
  const [pagesState, setPagesState] = useState([]);

  // COMPRESS PDF tool states
  const [compressionPercent, setCompressionPercent] = useState(60);
  const [compressResult, setCompressResult] = useState(null);
  
  // ROTATE PDF tool states
  const [rotateMode, setRotateMode] = useState('all'); // 'all' | 'custom'
  const [rotateAngle, setRotateAngle] = useState(90); // 90 | 180 | 270
  const [customRotations, setCustomRotations] = useState({}); // { [pageIdx]: degrees }

  // PAGE NUMBERS tool states
  const [pageNumberPos, setPageNumberPos] = useState('bottom-center');
  const [pageNumberFormat, setPageNumberFormat] = useState('Page {n} of {total}');
  const [pageNumberSize, setPageNumberSize] = useState(11);
  const [pageNumberColor, setPageNumberColor] = useState('#334155');
  const [pageNumberStart, setPageNumberStart] = useState(1);

  // COMPARE PDF tool states
  const [compareResult, setCompareResult] = useState(null);
  const [compareCurrentPage, setCompareCurrentPage] = useState(1);
  const [compareThumbA, setCompareThumbA] = useState(null);
  const [compareThumbB, setCompareThumbB] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  // Split tool states
  const [splitMode, setSplitMode] = useState('range');
  const [splitRange, setSplitRange] = useState('1');
  
  // Watermark tool states
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [watermarkAngle, setWatermarkAngle] = useState(45);
  const [watermarkSize, setWatermarkSize] = useState(44);
  
  // Password Protect tool states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Image to PDF states
  const [imagePageSize, setImagePageSize] = useState('a4');
  const [imageFormat, setImageFormat] = useState('png');

  // EDIT PDF tool states
  const [editPage, setEditPage] = useState(1);
  const [editElements, setEditElements] = useState([]);
  const [activeElementId, setActiveElementId] = useState(null);

  // CROP PDF tool states (Visual preview, page select, multi-page crop)
  const [cropPage, setCropPage] = useState(1);
  const [cropMode, setCropMode] = useState('all'); // 'all' or 'per-page'
  const [globalCrop, setGlobalCrop] = useState({ top: 30, bottom: 30, left: 30, right: 30 });
  const [perPageCrops, setPerPageCrops] = useState({}); // { [pageNumber]: { top, bottom, left, right } }

  // REDACT PDF tool states
  const [redactBoxes, setRedactBoxes] = useState([]);

  // HTML to PDF state
  const [rawHtmlText, setRawHtmlText] = useState('<h1>Important Document</h1>\n<p>Converted using PDFBolt by WEB⚡BITS.</p>');

  // Signature canvas states
  const sigCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sigColor, setSigColor] = useState('#000000');
  const [selectedSignPage, setSelectedSignPage] = useState(1);

  // Processing & progress states
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef(null);
  const editImageInputRef = useRef(null);

  // Load document info and thumbnails when file changes
  useEffect(() => {
    if (files.length > 0 && files[0].name && files[0].name.toLowerCase().endsWith('.pdf')) {
      getPdfInfo(files[0])
        .then(info => {
          setDocInfo(info);
          if (splitRange === '1' && info.pageCount > 1) {
            setSplitRange(`1-${Math.min(info.pageCount, 3)}`);
          }

          // Immediately create page state entries for ALL pages so even 100+ page PDFs show full document
          const initialPages = Array.from({ length: info.pageCount }, (_, idx) => ({
            originalIndex: idx,
            rotation: 0,
            dataUrl: null,
            pageNum: idx + 1
          }));
          setPagesState(initialPages);

          if (['organize', 'sign', 'edit', 'redact', 'crop', 'rotate', 'page-numbers'].includes(toolId)) {
            setProgressText(`Rendering document pages (1 of ${info.pageCount})...`);
            setIsProcessing(true);
            renderPdfThumbnails(files[0], null, 0.6, (cur, total) => {
              setProgressText(`Rendering document pages (${cur} of ${total})...`);
            })
              .then(({ totalPages, thumbnails }) => {
                setThumbnails(thumbnails);
                setPagesState(prev => {
                  return prev.map(p => {
                    const matchedThumb = thumbnails.find(t => t.pageNumber === p.pageNum);
                    return matchedThumb ? { ...p, dataUrl: matchedThumb.dataUrl } : p;
                  });
                });
                setIsProcessing(false);
                setProgressText('');
              })
              .catch(err => {
                console.error(err);
                setIsProcessing(false);
                setProgressText('');
              });
          }
        })
        .catch(err => console.warn('Could not read PDF metadata:', err));
    }

    // COMPARE PDF: auto-trigger when 2 files are available
    if (toolId === 'compare' && files.length >= 2) {
      setIsComparing(true);
      setProgressText('Analyzing document differences & text layers...');
      comparePdfs(files[0], files[1])
        .then(async (res) => {
          setCompareResult(res);
          setCompareCurrentPage(1);
          const [tA, tB] = await Promise.all([
            renderSinglePdfThumbnail(files[0], 1, 0.7),
            renderSinglePdfThumbnail(files[1], 1, 0.7)
          ]);
          setCompareThumbA(tA);
          setCompareThumbB(tB);
          setIsComparing(false);
          setProgressText('');
        })
        .catch(err => {
          console.error('Comparison error:', err);
          setErrorMsg('Failed to compare documents: ' + err.message);
          setIsComparing(false);
          setProgressText('');
        });
    }
  }, [files, toolId]);

  // Handle file addition
  const handleAddFiles = (newFiles) => {
    if (tool.multiple) {
      setFiles(prev => [...prev, ...Array.from(newFiles)]);
    } else {
      setFiles([newFiles[0]]);
    }
    setErrorMsg('');
    setIsSuccess(false);
  };

  const handleRemoveFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveFile = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setFiles(updated);
  };

  // EDIT PDF Handlers
  const handleAddTextElement = () => {
    const newEl = {
      id: Date.now(),
      type: 'text',
      text: 'Sample Text',
      fontSize: 24,
      color: '#1e40af',
      opacity: 1.0,
      xRatio: 0.15,
      yRatio: 0.2 + (editElements.length * 0.08),
      pageNum: editPage
    };
    setEditElements(prev => [...prev, newEl]);
    setActiveElementId(newEl.id);
  };

  const handleAddImageElement = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const dataUrl = loadEvent.target.result;
      const newEl = {
        id: Date.now(),
        type: 'image',
        dataUrl,
        width: 140,
        height: 90,
        opacity: 1.0,
        xRatio: 0.35,
        yRatio: 0.35,
        pageNum: editPage
      };
      setEditElements(prev => [...prev, newEl]);
      setActiveElementId(newEl.id);
    };
    reader.readAsDataURL(file);
  };

  const updateElementProp = (id, prop, val) => {
    setEditElements(prev => prev.map(el => el.id === id ? { ...el, [prop]: val } : el));
  };

  const deleteElement = (id) => {
    setEditElements(prev => prev.filter(el => el.id !== id));
    if (activeElementId === id) setActiveElementId(null);
  };

  // CROP PDF Margins for active page
  const currentCropMargins = cropMode === 'all' 
    ? globalCrop 
    : (perPageCrops[cropPage] || globalCrop);

  const updateCropMargin = (side, value) => {
    if (cropMode === 'all') {
      setGlobalCrop(prev => ({ ...prev, [side]: value }));
    } else {
      setPerPageCrops(prev => ({
        ...prev,
        [cropPage]: { ...(prev[cropPage] || globalCrop), [side]: value }
      }));
    }
  };

  // REDACT PDF Handlers
  const handleAddRedactBox = () => {
    const newBox = {
      id: Date.now(),
      xRatio: 0.2,
      yRatio: 0.2 + (redactBoxes.length * 0.08),
      width: 180,
      height: 28,
      pageNum: editPage
    };
    setRedactBoxes(prev => [...prev, newBox]);
  };

  const deleteRedactBox = (id) => {
    setRedactBoxes(prev => prev.filter(b => b.id !== id));
  };

  // Organize functions
  const handleRotatePage = (index) => {
    setPagesState(prev => {
      const updated = [...prev];
      const current = updated[index].rotation || 0;
      updated[index] = { ...updated[index], rotation: (current + 90) % 360 };
      return updated;
    });
  };

  const handleMovePage = (fromIndex, direction) => {
    const toIndex = fromIndex + direction;
    if (toIndex < 0 || toIndex >= pagesState.length) return;
    setPagesState(prev => {
      const updated = [...prev];
      const item = updated.splice(fromIndex, 1)[0];
      updated.splice(toIndex, 0, item);
      return updated;
    });
  };

  const handleMovePageToPosition = (fromIndex, targetPageNum1Based) => {
    const targetPos = parseInt(targetPageNum1Based, 10);
    if (isNaN(targetPos) || targetPos < 1 || targetPos > pagesState.length) return;
    const toIndex = targetPos - 1;
    if (fromIndex === toIndex) return;
    setPagesState(prev => {
      const updated = [...prev];
      const item = updated.splice(fromIndex, 1)[0];
      updated.splice(toIndex, 0, item);
      return updated;
    });
  };

  const handleDeletePage = (index) => {
    if (pagesState.length <= 1) {
      setErrorMsg('You must keep at least one page in the document.');
      return;
    }
    setPagesState(prev => prev.filter((_, i) => i !== index));
  };

  // Rotate custom page handler
  const handleRotateCustomPage = (idx, degChange = 90) => {
    setCustomRotations(prev => {
      const current = prev[idx] || 0;
      const next = (current + degChange) % 360;
      return { ...prev, [idx]: next };
    });
  };

  // Compare PDF page navigation
  const handleComparePageChange = async (targetPage) => {
    if (!files[0] || !files[1] || !compareResult) return;
    const maxP = Math.max(compareResult.fileA.pageCount, compareResult.fileB.pageCount);
    const p = Math.max(1, Math.min(maxP, targetPage));
    setCompareCurrentPage(p);
    try {
      const promises = [];
      if (p <= compareResult.fileA.pageCount) {
        promises.push(renderSinglePdfThumbnail(files[0], p, 0.7));
      } else {
        promises.push(Promise.resolve(null));
      }
      if (p <= compareResult.fileB.pageCount) {
        promises.push(renderSinglePdfThumbnail(files[1], p, 0.7));
      } else {
        promises.push(Promise.resolve(null));
      }
      const [tA, tB] = await Promise.all(promises);
      setCompareThumbA(tA);
      setCompareThumbB(tB);
    } catch (e) {
      console.error(e);
    }
  };

  // Signature canvas
  const startDrawing = (e) => {
    if (e.touches && e.cancelable) e.preventDefault();
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.strokeStyle = sigColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches && e.cancelable) e.preventDefault();
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const clearSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Main processing router
  const handleProcess = async () => {
    setErrorMsg('');
    setIsProcessing(true);
    setIsSuccess(false);

    try {
      if (toolId === 'merge') {
        if (files.length < 2) throw new Error('Please select at least 2 PDF files to merge.');
        setProgressText('Merging documents in browser...');
        await mergePdfs(files);
      } else if (toolId === 'split') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Splitting document...');
        await splitPdf(files[0], splitMode, splitRange);
      } else if (toolId === 'organize') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Saving rearranged document...');
        await organizePdf(files[0], pagesState);
      } else if (toolId === 'edit') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        if (editElements.length === 0) throw new Error('Please add at least one text box or image before saving.');
        setProgressText('Burning edits into PDF...');
        await editPdf(files[0], editElements);
      } else if (toolId === 'crop') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Cropping pages with custom styles...');
        await cropPdf(files[0], {
          mode: cropMode,
          globalMargins: globalCrop,
          perPageMargins: perPageCrops
        });
      } else if (toolId === 'word-to-pdf') {
        if (!files[0]) throw new Error('Please upload a Word document (.doc or .docx).');
        setProgressText('Converting Word document to PDF...');
        await wordToPdf(files[0]);
      } else if (toolId === 'pdf-to-word') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Extracting layout and generating Word document (.docx)...');
        await pdfToWord(files[0]);
      } else if (toolId === 'excel-to-pdf') {
        if (!files[0]) throw new Error('Please upload an Excel spreadsheet (.xlsx, .xls, .csv).');
        setProgressText('Converting Excel spreadsheet to PDF...');
        await excelToPdf(files[0]);
      } else if (toolId === 'pdf-to-excel') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Extracting tabular data and generating Excel spreadsheet...');
        await pdfToExcel(files[0]);
      } else if (toolId === 'powerpoint-to-pdf') {
        if (!files[0]) throw new Error('Please upload a PowerPoint presentation (.pptx).');
        setProgressText('Parsing presentation slides and converting to 16:9 PDF...');
        await powerpointToPdf(files[0], (cur, total) => {
          setProgressText(`Converting slide ${cur} of ${total}...`);
        });
      } else if (toolId === 'pdf-to-powerpoint') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        await pdfToPowerpoint(files[0], (cur, total) => {
          setProgressText(`Generating PowerPoint slide ${cur} of ${total}...`);
        });
      } else if (toolId === 'images-to-pdf') {
        if (files.length === 0) throw new Error('Please select at least 1 image.');
        setProgressText('Converting images to PDF...');
        await imagesToPdf(files, { pageSize: imagePageSize });
      } else if (toolId === 'pdf-to-images') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        await pdfToImages(files[0], imageFormat, 2.0, (cur, total) => {
          setProgressText(`Rendering page ${cur} of ${total}...`);
        });
      } else if (toolId === 'rotate') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        if (rotateMode === 'all') {
          setProgressText(`Rotating all pages by ${rotateAngle}°...`);
          await rotatePdf(files[0], { mode: 'all', angle: rotateAngle });
        } else {
          setProgressText('Applying custom per-page rotations...');
          await rotatePdf(files[0], { mode: 'custom', pageRotations: customRotations });
        }
      } else if (toolId === 'watermark') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        if (!watermarkText.trim()) throw new Error('Watermark text cannot be empty.');
        setProgressText('Applying watermark stamps...');
        await watermarkPdf(files[0], watermarkText, {
          opacity: watermarkOpacity,
          angle: watermarkAngle,
          size: watermarkSize
        });
      } else if (toolId === 'page-numbers') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Inserting page numbers...');
        await addPageNumbers(files[0], {
          position: pageNumberPos,
          format: pageNumberFormat,
          fontSize: pageNumberSize,
          fontColor: pageNumberColor,
          startNumber: pageNumberStart
        });
      } else if (toolId === 'protect') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        if (!password || password.length < 3) throw new Error('Password must be at least 3 characters.');
        if (password !== confirmPassword) throw new Error('Passwords do not match.');
        setProgressText('Encrypting PDF with 256-bit AES password...');
        await protectPdf(files[0], password);
      } else if (toolId === 'compare') {
        if (files.length < 2) throw new Error('Please upload 2 PDF files to compare.');
        setProgressText('Generating side-by-side comparison report...');
        const report = `PDFBolt Side-by-Side Comparison Report
======================================================
Generated with PDFBolt (WEB⚡BITS Engine • infas.mk)

Document A: ${compareResult?.fileA?.name || files[0].name}
- Page Count: ${compareResult?.fileA?.pageCount || 'N/A'}
- Total Words: ~${compareResult?.fileA?.wordCount || 0}

Document B: ${compareResult?.fileB?.name || files[1].name}
- Page Count: ${compareResult?.fileB?.pageCount || 'N/A'}
- Total Words: ~${compareResult?.fileB?.wordCount || 0}

Status: ${compareResult?.identicalTotal ? '100% Identical Document Content' : 'Differences Detected between documents'}

Page-by-Page Comparison Details:
------------------------------------------------------
${(compareResult?.pageComparisons || []).map(p => `
[Page ${p.pageNumber}] ${p.isIdentical ? '✓ Identical' : '⚠ Differences found'}
Document A length: ${p.textA.length} chars | Document B length: ${p.textB.length} chars
Char delta: ${p.charDiff > 0 ? '+' : ''}${p.charDiff}
Doc A Snippet: ${p.textA.slice(0, 160)}...
Doc B Snippet: ${p.textB.slice(0, 160)}...
`).join('\n')}`;

        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        saveBlobAs(blob, `PDFBolt_Comparison_${files[0].name.replace(/\.pdf$/i, '')}_vs_${files[1].name.replace(/\.pdf$/i, '')}.txt`);
        fireConfetti();
      } else if (toolId === 'redact') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        if (redactBoxes.length === 0) throw new Error('Please add at least one blackout redaction box.');
        setProgressText('Permanently burning redaction blackout boxes...');
        await redactPdf(files[0], redactBoxes);
      } else if (toolId === 'repair') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Repairing cross-reference tables and streams...');
        await repairPdf(files[0]);
      } else if (toolId === 'html-to-pdf') {
        if (!rawHtmlText.trim()) throw new Error('Please provide HTML content.');
        setProgressText('Rendering HTML to vector PDF...');
        await htmlToPdf(rawHtmlText);
      } else if (toolId === 'pdf-to-pdfa') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Standardizing to ISO PDF/A format...');
        await pdfToPdfA(files[0]);
      } else if (toolId === 'ocr') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText('Extracting searchable text layer...');
        await ocrPdf(files[0]);
      } else if (toolId === 'sign') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        const canvas = sigCanvasRef.current;
        if (!canvas) throw new Error('Please draw your signature first.');
        const sigDataUrl = canvas.toDataURL('image/png');
        setProgressText('Embedding signature...');
        await signPdf(files[0], sigDataUrl, selectedSignPage - 1);
      } else if (toolId === 'compress') {
        if (!files[0]) throw new Error('Please upload a PDF file.');
        setProgressText(`Analyzing document and preparing ${compressionPercent}% compression...`);
        const result = await compressPdf(files[0], compressionPercent, (cur, total) => {
          setProgressText(`Compressing page ${cur} of ${total} (${Math.round((cur / total) * 100)}%)...`);
        });
        setCompressResult(result);
      }

      setIsSuccess(true);

      // Track analytics globally across all devices
      recordGlobalProcess(toolId);
    } catch (err) {
      console.error('Processing error:', err);
      setErrorMsg(err.message || 'An unexpected error occurred while processing.');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  const activeElement = editElements.find(el => el.id === activeElementId);
  const currentThumb = thumbnails.find(t => t.pageNumber === (toolId === 'crop' ? cropPage : editPage)) || thumbnails[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[96vh] flex flex-col">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50/90 flex-shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  {tool.title}
                </h2>
                <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                  <InfinityIcon className="w-3 h-3" />
                  <span>No Limit</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                {tool.description}
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% In-Browser</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1">

          {/* HTML TO PDF Exception */}
          {toolId === 'html-to-pdf' ? (
            <div className="space-y-4">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600">Enter HTML Markup</label>
              <textarea
                rows={8}
                value={rawHtmlText}
                onChange={(e) => setRawHtmlText(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 font-mono text-xs focus:ring-2 focus:ring-sky-500/30 focus:outline-none"
              />
            </div>
          ) : files.length === 0 ? (
            /* Upload State */
            <div
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-3xl p-12 text-center bg-slate-50/50 hover:bg-sky-50/30 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple={tool.multiple}
                accept={tool.accept}
                onChange={(e) => handleAddFiles(e.target.files)}
                className="hidden"
              />
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/25 mb-4">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Select {tool.multiple ? 'files' : 'a file'} for {tool.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Click to browse or drag and drop your document here
              </p>
              <div className="mt-3 inline-flex items-center space-x-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                <InfinityIcon className="w-3.5 h-3.5" />
                <span>Unlimited file size supported — no 10MB/50MB upload caps</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">

              {/* Uploaded File List Header */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-800">
                  {tool.multiple ? `Selected Files (${files.length})` : 'Selected Document'}
                </span>
                
                {tool.multiple ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-bold text-sky-600 hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={tool.accept}
                      onChange={(e) => handleAddFiles(e.target.files)}
                      className="hidden"
                    />
                    <span>+ Add more files</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { setFiles([]); setEditElements([]); setRedactBoxes([]); }}
                    className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1 rounded-lg transition-colors cursor-pointer"
                  >
                    Change File
                  </button>
                )}
              </div>

              {/* Multi-file view */}
              {tool.multiple ? (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {files.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {idx + 1}
                        </span>
                        <div className="truncate">
                          <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                          <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 flex-shrink-0">
                        <button
                          onClick={() => handleMoveFile(idx, -1)}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleMoveFile(idx, 1)}
                          disabled={idx === files.length - 1}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Single-file summary */
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-3 rounded-xl bg-sky-100 text-sky-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-bold text-slate-900 truncate">{files[0].name}</div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <span>{formatBytes(files[0].size)}</span>
                        {docInfo && (
                          <>
                            <span>•</span>
                            <span>{docInfo.pageCount} Pages</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                    Ready
                  </span>
                </div>
              )}

              {/* =========================================================================
                  CROP PDF WORKSPACE (With Visual Page Preview & Multi-Page Selection)
              ========================================================================= */}
              {toolId === 'crop' && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  
                  {/* Top Crop Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Crop Mode:</span>
                      <div className="inline-flex rounded-xl bg-white p-1 border border-slate-300">
                        <button
                          onClick={() => setCropMode('all')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            cropMode === 'all' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All Pages (Uniform)
                        </button>
                        <button
                          onClick={() => setCropMode('per-page')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            cropMode === 'per-page' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Custom Per-Page
                        </button>
                      </div>
                    </div>

                    {/* Page Selector */}
                    {docInfo && docInfo.pageCount > 1 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-600">Select Page:</span>
                        <select
                          value={cropPage}
                          onChange={(e) => setCropPage(parseInt(e.target.value, 10))}
                          className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                        >
                          {Array.from({ length: docInfo.pageCount }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Page {i + 1} {cropMode === 'per-page' && perPageCrops[i + 1] ? '✓ (Custom)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {/* Visual Page Preview with Active Crop Overlay */}
                  <div className="relative border border-slate-300 rounded-2xl bg-white p-4 flex justify-center overflow-hidden min-h-[320px]">
                    {currentThumb && currentThumb.dataUrl ? (
                      <div className="relative shadow-xl border border-slate-300 inline-block overflow-hidden">
                        <img src={currentThumb.dataUrl} alt={`Page ${cropPage}`} className="max-h-[380px] w-auto object-contain block" />
                        
                        {/* Top Darkened Mask */}
                        <div
                          style={{ height: `${Math.min(45, (currentCropMargins.top / 300) * 100)}%` }}
                          className="absolute top-0 left-0 right-0 bg-slate-900/60 backdrop-blur-[1px] border-b-2 border-dashed border-pink-500 flex items-center justify-center text-[10px] font-bold text-white tracking-widest uppercase pointer-events-none"
                        >
                          Cropped Top ({currentCropMargins.top}px)
                        </div>

                        {/* Bottom Darkened Mask */}
                        <div
                          style={{ height: `${Math.min(45, (currentCropMargins.bottom / 300) * 100)}%` }}
                          className="absolute bottom-0 left-0 right-0 bg-slate-900/60 backdrop-blur-[1px] border-t-2 border-dashed border-pink-500 flex items-center justify-center text-[10px] font-bold text-white tracking-widest uppercase pointer-events-none"
                        >
                          Cropped Bottom ({currentCropMargins.bottom}px)
                        </div>

                        {/* Left Darkened Mask */}
                        <div
                          style={{ width: `${Math.min(45, (currentCropMargins.left / 300) * 100)}%` }}
                          className="absolute top-0 bottom-0 left-0 bg-slate-900/60 backdrop-blur-[1px] border-r-2 border-dashed border-pink-500 flex items-center justify-center text-[10px] font-bold text-white tracking-widest uppercase pointer-events-none"
                        >
                          Left
                        </div>

                        {/* Right Darkened Mask */}
                        <div
                          style={{ width: `${Math.min(45, (currentCropMargins.right / 300) * 100)}%` }}
                          className="absolute top-0 bottom-0 right-0 bg-slate-900/60 backdrop-blur-[1px] border-l-2 border-dashed border-pink-500 flex items-center justify-center text-[10px] font-bold text-white tracking-widest uppercase pointer-events-none"
                        >
                          Right
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                        <FileText className="w-12 h-12 mb-2" />
                        <span className="text-xs">Generating crop preview...</span>
                      </div>
                    )}
                  </div>

                  {/* Margin Trimming Sliders */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200">
                    <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-700">
                      <span>{cropMode === 'all' ? 'Uniform Crop Margins (All Pages)' : `Custom Crop Margins for Page ${cropPage}`}</span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            updateCropMargin('top', 0);
                            updateCropMargin('bottom', 0);
                            updateCropMargin('left', 0);
                            updateCropMargin('right', 0);
                          }}
                          className="text-slate-500 hover:text-slate-800 text-[11px] underline cursor-pointer"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => {
                            updateCropMargin('top', 40);
                            updateCropMargin('bottom', 40);
                            updateCropMargin('left', 40);
                            updateCropMargin('right', 40);
                          }}
                          className="text-pink-600 hover:underline text-[11px] font-bold cursor-pointer"
                        >
                          Trim 40px Margins
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-semibold">
                      <div>
                        <span>Top: {currentCropMargins.top}px</span>
                        <input
                          type="range"
                          min="0"
                          max="180"
                          value={currentCropMargins.top}
                          onChange={(e) => updateCropMargin('top', parseInt(e.target.value, 10))}
                          className="w-full accent-pink-500 mt-1"
                        />
                      </div>
                      <div>
                        <span>Bottom: {currentCropMargins.bottom}px</span>
                        <input
                          type="range"
                          min="0"
                          max="180"
                          value={currentCropMargins.bottom}
                          onChange={(e) => updateCropMargin('bottom', parseInt(e.target.value, 10))}
                          className="w-full accent-pink-500 mt-1"
                        />
                      </div>
                      <div>
                        <span>Left: {currentCropMargins.left}px</span>
                        <input
                          type="range"
                          min="0"
                          max="180"
                          value={currentCropMargins.left}
                          onChange={(e) => updateCropMargin('left', parseInt(e.target.value, 10))}
                          className="w-full accent-pink-500 mt-1"
                        />
                      </div>
                      <div>
                        <span>Right: {currentCropMargins.right}px</span>
                        <input
                          type="range"
                          min="0"
                          max="180"
                          value={currentCropMargins.right}
                          onChange={(e) => updateCropMargin('right', parseInt(e.target.value, 10))}
                          className="w-full accent-pink-500 mt-1"
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* EDIT PDF WORKSPACE */}
              {toolId === 'edit' && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Page to Edit:</span>
                      {docInfo && docInfo.pageCount > 1 && (
                        <select
                          value={editPage}
                          onChange={(e) => setEditPage(parseInt(e.target.value, 10))}
                          className="px-3 py-1 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                        >
                          {Array.from({ length: docInfo.pageCount }, (_, i) => (
                            <option key={i + 1} value={i + 1}>Page {i + 1}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleAddTextElement}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-sky-700 hover:bg-sky-50 shadow-sm cursor-pointer"
                      >
                        <Type className="w-3.5 h-3.5" />
                        <span>+ Add Text</span>
                      </button>

                      <button
                        onClick={() => editImageInputRef.current?.click()}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-purple-700 hover:bg-purple-50 shadow-sm cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>+ Add Image</span>
                      </button>
                      <input
                        ref={editImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAddImageElement}
                        className="hidden"
                      />
                    </div>
                  </div>

                  {/* Visual Canvas Area with Overlays */}
                  <div className="relative border border-slate-300 rounded-2xl bg-white p-4 flex justify-center overflow-hidden min-h-[320px]">
                    {currentThumb && currentThumb.dataUrl ? (
                      <div className="relative shadow-lg border border-slate-200 inline-block">
                        <img src={currentThumb.dataUrl} alt={`Page ${editPage}`} className="max-h-[400px] w-auto object-contain block" />
                        
                        {editElements.filter(el => el.pageNum === editPage).map((el) => (
                          <div
                            key={el.id}
                            onClick={() => setActiveElementId(el.id)}
                            style={{
                              position: 'absolute',
                              left: `${el.xRatio * 100}%`,
                              top: `${el.yRatio * 100}%`,
                              cursor: 'move',
                              opacity: el.opacity || 1
                            }}
                            className={`p-1.5 rounded border transition-all ${
                              activeElementId === el.id ? 'border-sky-500 bg-sky-100/40 ring-2 ring-sky-400' : 'border-dashed border-slate-400'
                            }`}
                          >
                            {el.type === 'text' ? (
                              <span style={{ fontSize: `${el.fontSize * 0.65}px`, color: el.color, fontWeight: 'bold' }}>
                                {el.text}
                              </span>
                            ) : (
                              <img src={el.dataUrl} alt="Stamp" style={{ width: `${el.width * 0.65}px`, height: `${el.height * 0.65}px` }} className="object-contain" />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-12 text-slate-400">
                        <FileText className="w-12 h-12 mb-2" />
                        <span className="text-xs">Generating page visual preview...</span>
                      </div>
                    )}
                  </div>

                  {/* Active Element Properties Editor */}
                  {activeElement && (
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Editing {activeElement.type === 'text' ? 'Text Element' : 'Image Element'}</span>
                        <button
                          onClick={() => deleteElement(activeElement.id)}
                          className="text-rose-500 hover:underline flex items-center space-x-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>

                      {activeElement.type === 'text' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="font-semibold text-slate-600">Content:</label>
                            <input
                              type="text"
                              value={activeElement.text}
                              onChange={(e) => updateElementProp(activeElement.id, 'text', e.target.value)}
                              className="mt-1 w-full px-3 py-1.5 rounded-lg border border-slate-300 font-bold"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-600">Font Size ({activeElement.fontSize}px):</label>
                            <input
                              type="range"
                              min="12"
                              max="60"
                              value={activeElement.fontSize}
                              onChange={(e) => updateElementProp(activeElement.id, 'fontSize', parseInt(e.target.value, 10))}
                              className="w-full accent-sky-500 mt-2"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-600">Color:</label>
                            <input
                              type="color"
                              value={activeElement.color}
                              onChange={(e) => updateElementProp(activeElement.id, 'color', e.target.value)}
                              className="mt-1 w-full h-8 rounded-lg cursor-pointer border border-slate-300"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <label className="font-semibold text-slate-600">Width ({activeElement.width}px):</label>
                            <input
                              type="range"
                              min="40"
                              max="300"
                              value={activeElement.width}
                              onChange={(e) => updateElementProp(activeElement.id, 'width', parseInt(e.target.value, 10))}
                              className="w-full accent-purple-500 mt-2"
                            />
                          </div>
                          <div>
                            <label className="font-semibold text-slate-600">Height ({activeElement.height}px):</label>
                            <input
                              type="range"
                              min="30"
                              max="300"
                              value={activeElement.height}
                              onChange={(e) => updateElementProp(activeElement.id, 'height', parseInt(e.target.value, 10))}
                              className="w-full accent-purple-500 mt-2"
                            />
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="font-semibold text-slate-600">Horizontal Position (X)</span>
                          <input
                            type="range"
                            min="0"
                            max="0.8"
                            step="0.01"
                            value={activeElement.xRatio}
                            onChange={(e) => updateElementProp(activeElement.id, 'xRatio', parseFloat(e.target.value))}
                            className="w-full accent-sky-500 mt-1"
                          />
                        </div>
                        <div>
                          <span className="font-semibold text-slate-600">Vertical Position (Y)</span>
                          <input
                            type="range"
                            min="0"
                            max="0.85"
                            step="0.01"
                            value={activeElement.yRatio}
                            onChange={(e) => updateElementProp(activeElement.id, 'yRatio', parseFloat(e.target.value))}
                            className="w-full accent-sky-500 mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* REDACT PDF WORKSPACE */}
              {toolId === 'redact' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Redaction Blackout Masks</span>
                    <button
                      onClick={handleAddRedactBox}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold cursor-pointer"
                    >
                      + Add Blackout Box
                    </button>
                  </div>

                  {redactBoxes.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No redaction boxes placed yet. Click "+ Add Blackout Box" to mask sensitive text.</p>
                  ) : (
                    <div className="space-y-2">
                      {redactBoxes.map((box, idx) => (
                        <div key={box.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs">
                          <span className="font-bold text-slate-800">Blackout Mask #{idx + 1}</span>
                          <button onClick={() => deleteRedactBox(box.id)} className="text-rose-500 hover:underline cursor-pointer">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* COMPRESS PDF WORKSPACE */}
              {toolId === 'compress' && (
                <div className="p-5 sm:p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                  
                  {/* Header: Document Info & Current Size */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Document Compression</span>
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="text-sm font-black text-slate-900 truncate max-w-[240px] sm:max-w-xs">{files[0]?.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          {docInfo?.pageCount || 1} {(docInfo?.pageCount || 1) === 1 ? 'page' : 'pages'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-right shadow-xs">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Original Size</span>
                        <span className="text-sm font-black text-slate-800">{formatBytes(files[0]?.size || 0)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Main Scroll Bar / Slider Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Percent className="w-4 h-4 text-emerald-600" />
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          Compression Level: <span className="text-sm font-black text-emerald-600">{compressionPercent}%</span>
                        </label>
                      </div>

                      {/* Dynamic Quality Indicator Badge */}
                      <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                        compressionPercent <= 35
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : compressionPercent <= 70
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {compressionPercent <= 35
                          ? '🟢 Light (Best Quality)'
                          : compressionPercent <= 70
                          ? '🔵 Balanced (Recommended)'
                          : '🟣 Extreme (Smallest Size)'}
                      </span>
                    </div>

                    {/* The Interactive Scroll Bar (Range Slider) */}
                    <div className="relative pt-1 pb-2">
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="5"
                        value={compressionPercent}
                        onChange={(e) => setCompressionPercent(parseInt(e.target.value, 10))}
                        className="w-full h-3 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      
                      {/* Range Tick Labels */}
                      <div className="flex justify-between text-[11px] font-bold text-slate-400 mt-2">
                        <span className={compressionPercent <= 30 ? 'text-emerald-700' : ''}>10% (Low)</span>
                        <span className={compressionPercent >= 45 && compressionPercent <= 65 ? 'text-sky-700 font-extrabold' : ''}>50% (Recommended)</span>
                        <span className={compressionPercent >= 75 ? 'text-purple-700' : ''}>90% (Maximum)</span>
                      </div>
                    </div>

                    {/* Quick Presets Buttons */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-bold text-slate-500 mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => setCompressionPercent(30)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                          compressionPercent === 30
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        Low (30%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompressionPercent(60)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                          compressionPercent === 60
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        ⭐ Balanced (60%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setCompressionPercent(85)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer active:scale-95 ${
                          compressionPercent === 85
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        Extreme (85%)
                      </button>
                    </div>

                    {/* Real-time Estimated Output Size Box */}
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <div className="flex items-center space-x-2 text-slate-600 font-medium">
                        <Gauge className="w-4 h-4 text-sky-600 flex-shrink-0" />
                        <span>Estimated Output Size:</span>
                        <strong className="text-slate-900 font-bold">
                          ~{formatBytes(Math.max(1024, (files[0]?.size || 0) * (1 - (compressionPercent * 0.85) / 100)))}
                        </strong>
                      </div>
                      <span className="text-emerald-700 font-bold">
                        Save ~{formatBytes(Math.max(0, (files[0]?.size || 0) * ((compressionPercent * 0.85) / 100)))}
                      </span>
                    </div>

                    {/* Actual Compression Results Banner (if previously processed in this session) */}
                    {compressResult && (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>
                            <strong>Successfully compressed!</strong> {formatBytes(compressResult.originalSize)} → <strong>{formatBytes(compressResult.compressedSize)}</strong>
                          </span>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white font-extrabold text-[11px] self-start sm:self-auto">
                          -{compressResult.percentReduced}% Smaller
                        </span>
                      </div>
                    )}

                  </div>
                </div>
              )}

              {/* SPLIT OPTIONS */}
              {toolId === 'split' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Split Settings</span>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSplitMode('range')}
                      className={`p-3 rounded-xl text-xs font-bold border text-left transition-all ${
                        splitMode === 'range' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="text-sm font-bold">Custom Page Range</div>
                      <div className="text-[11px] font-normal opacity-80">e.g. 1-3, 5, 8-10</div>
                    </button>
                    <button
                      onClick={() => setSplitMode('all')}
                      className={`p-3 rounded-xl text-xs font-bold border text-left transition-all ${
                        splitMode === 'all' ? 'border-sky-500 bg-sky-50 text-sky-700' : 'border-slate-200 text-slate-600'
                      }`}
                    >
                      <div className="text-sm font-bold">Extract All Pages</div>
                      <div className="text-[11px] font-normal opacity-80">Download every page in ZIP</div>
                    </button>
                  </div>

                  {splitMode === 'range' && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700">Pages to extract:</label>
                      <input
                        type="text"
                        value={splitRange}
                        onChange={(e) => setSplitRange(e.target.value)}
                        placeholder="e.g. 1-5 or 1, 3, 7"
                        className="w-full px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-sm font-mono"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  ROTATE PDF WORKSPACE (Degrees selector, All pages vs Custom pages)
              ========================================================================= */}
              {toolId === 'rotate' && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                    {/* Mode Selector */}
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Rotation Mode:</span>
                      <div className="inline-flex rounded-xl bg-white p-1 border border-slate-300">
                        <button
                          type="button"
                          onClick={() => setRotateMode('all')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            rotateMode === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          All Pages (Uniform)
                        </button>
                        <button
                          type="button"
                          onClick={() => setRotateMode('custom')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                            rotateMode === 'custom' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          Custom Per-Page
                        </button>
                      </div>
                    </div>

                    {/* Degree Selector for All-Pages Mode */}
                    {rotateMode === 'all' && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-600">Rotate Angle:</span>
                        <div className="inline-flex rounded-xl bg-white p-1 border border-slate-300">
                          {[90, 180, 270].map(deg => (
                            <button
                              key={deg}
                              type="button"
                              onClick={() => setRotateAngle(deg)}
                              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                rotateAngle === deg ? 'bg-indigo-100 text-indigo-700 font-black' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {deg}°
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Mode 1: Uniform rotation visual preview */}
                  {rotateMode === 'all' ? (
                    <div className="p-6 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center min-h-[240px]">
                      <div
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 transition-transform duration-300 inline-block shadow-sm"
                        style={{ transform: `rotate(${rotateAngle}deg)` }}
                      >
                        {thumbnails[0]?.dataUrl ? (
                          <img src={thumbnails[0].dataUrl} alt="Preview" className="max-h-52 object-contain" />
                        ) : (
                          <div className="w-36 h-48 flex flex-col items-center justify-center text-slate-400">
                            <FileText className="w-10 h-10 mb-2" />
                            <span className="text-xs font-medium">Page Preview</span>
                          </div>
                        )}
                      </div>
                      <span className="mt-4 text-xs font-bold text-slate-700">
                        All {pagesState.length || docInfo?.pageCount || 1} pages will rotate by {rotateAngle}° clockwise
                      </span>
                    </div>
                  ) : (
                    /* Mode 2: Custom Per-Page Thumbnails Grid */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Click rotate or degree button on each page:</span>
                        <button
                          type="button"
                          onClick={() => setCustomRotations({})}
                          className="text-indigo-600 hover:underline cursor-pointer text-xs font-bold"
                        >
                          Reset All Rotations
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-80 overflow-y-auto p-2 bg-white rounded-xl border border-slate-200">
                        {pagesState.map((page, idx) => {
                          const rot = customRotations[idx] || 0;
                          return (
                            <div key={`rot-${idx}`} className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center shadow-xs">
                              <div
                                className="w-full h-32 flex items-center justify-center overflow-hidden bg-white rounded-lg transition-transform duration-200"
                                style={{ transform: `rotate(${rot}deg)` }}
                              >
                                {page.dataUrl ? (
                                  <img src={page.dataUrl} alt={`P.${page.pageNum}`} className="max-h-full max-w-full object-contain" />
                                ) : (
                                  <FileText className="w-8 h-8 text-slate-400" />
                                )}
                              </div>
                              <div className="mt-2 w-full flex items-center justify-between text-xs">
                                <span className="font-bold text-slate-700">P. {page.pageNum}</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rot > 0 ? 'bg-indigo-100 text-indigo-700' : 'text-slate-400'}`}>
                                  {rot}°
                                </span>
                              </div>
                              <div className="mt-1 flex items-center space-x-1">
                                {[90, 180, 270].map(d => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => handleRotateCustomPage(idx, d === rot ? -d : d - rot)}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                                      rot === d ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50'
                                    }`}
                                  >
                                    {d}°
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handleRotateCustomPage(idx, 90)}
                                  className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                  title="+90°"
                                >
                                  <RotateCw className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* =========================================================================
                  PAGE NUMBERS WORKSPACE (With Live Visual Preview & Position Grid)
              ========================================================================= */}
              {toolId === 'page-numbers' && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    
                    {/* Settings Form (Left 7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* Placement 2x3 Grid */}
                      <div>
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                          Page Number Placement:
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'top-left', label: 'Top Left' },
                            { id: 'top-center', label: 'Top Center' },
                            { id: 'top-right', label: 'Top Right' },
                            { id: 'bottom-left', label: 'Bottom Left' },
                            { id: 'bottom-center', label: 'Bottom Center' },
                            { id: 'bottom-right', label: 'Bottom Right' }
                          ].map((pos) => (
                            <button
                              key={pos.id}
                              type="button"
                              onClick={() => setPageNumberPos(pos.id)}
                              className={`p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                pageNumberPos === pos.id
                                  ? 'border-violet-600 bg-violet-50 text-violet-700 shadow-xs'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                              }`}
                            >
                              {pos.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Numbering Format & Start Number */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Numbering Format:</label>
                          <select
                            value={pageNumberFormat}
                            onChange={(e) => setPageNumberFormat(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                          >
                            <option value="Page {n} of {total}">Page &#123;n&#125; of &#123;total&#125; (e.g. Page 1 of 5)</option>
                            <option value="{n} / {total}">&#123;n&#125; / &#123;total&#125; (e.g. 1 / 5)</option>
                            <option value="Page {n}">Page &#123;n&#125; (e.g. Page 1)</option>
                            <option value="- {n} -">- &#123;n&#125; - (e.g. - 1 -)</option>
                            <option value="{n}">&#123;n&#125; (Just number, e.g. 1)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Start Number:</label>
                          <input
                            type="number"
                            min="1"
                            value={pageNumberStart}
                            onChange={(e) => setPageNumberStart(Math.max(1, parseInt(e.target.value, 10) || 1))}
                            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Font Size & Color */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                            <span>Font Size</span>
                            <span>{pageNumberSize}px</span>
                          </div>
                          <input
                            type="range"
                            min="8"
                            max="24"
                            value={pageNumberSize}
                            onChange={(e) => setPageNumberSize(parseInt(e.target.value, 10))}
                            className="w-full accent-violet-600"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-bold text-slate-700 block mb-1">Text Color:</label>
                          <div className="flex items-center space-x-2">
                            {['#334155', '#000000', '#2563eb', '#7c3aed', '#dc2626'].map((col) => (
                              <button
                                key={col}
                                type="button"
                                onClick={() => setPageNumberColor(col)}
                                style={{ backgroundColor: col }}
                                className={`w-7 h-7 rounded-lg border-2 cursor-pointer transition-transform ${
                                  pageNumberColor === col ? 'border-slate-800 scale-110 shadow-sm' : 'border-transparent hover:scale-105'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Live Visual Preview Card (Right 5 cols) */}
                    <div className="lg:col-span-5 flex flex-col items-center">
                      <span className="text-xs font-bold text-slate-600 mb-2 flex items-center space-x-1 self-start">
                        <Eye className="w-3.5 h-3.5 text-violet-600" />
                        <span>Live Visual Preview</span>
                      </span>

                      <div className="relative w-full max-w-[240px] aspect-[1/1.414] bg-white rounded-xl shadow-md border border-slate-300 overflow-hidden flex flex-col justify-between p-3 select-none">
                        {thumbnails[0]?.dataUrl ? (
                          <img src={thumbnails[0].dataUrl} alt="Page 1 preview" className="absolute inset-0 w-full h-full object-contain opacity-70 pointer-events-none" />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none">
                            <FileText className="w-12 h-12" />
                          </div>
                        )}

                        {/* Number preview element placed at chosen position */}
                        <div
                          className={`absolute z-10 font-bold px-2 py-0.5 rounded shadow-xs bg-white/85 border border-slate-300/60 ${
                            pageNumberPos === 'top-left' ? 'top-3 left-3' :
                            pageNumberPos === 'top-center' ? 'top-3 left-1/2 -translate-x-1/2' :
                            pageNumberPos === 'top-right' ? 'top-3 right-3' :
                            pageNumberPos === 'bottom-left' ? 'bottom-3 left-3' :
                            pageNumberPos === 'bottom-center' ? 'bottom-3 left-1/2 -translate-x-1/2' :
                            'bottom-3 right-3'
                          }`}
                          style={{ fontSize: `${Math.max(9, pageNumberSize * 0.8)}px`, color: pageNumberColor }}
                        >
                          {pageNumberFormat
                            .replace('{n}', pageNumberStart.toString())
                            .replace('{total}', ((docInfo?.pageCount || 1) + pageNumberStart - 1).toString())}
                        </div>
                      </div>

                      <span className="text-[11px] text-slate-500 mt-2 text-center">
                        Applied seamlessly across all {docInfo?.pageCount || 1} pages
                      </span>
                    </div>

                  </div>
                </div>
              )}

              {/* =========================================================================
                  COMPARE PDF WORKSPACE (Side-by-Side Split Viewer & Diff Highlights)
              ========================================================================= */}
              {toolId === 'compare' && (
                <div className="space-y-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
                  
                  {/* File status bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div className="flex items-center space-x-2">
                      <Columns2 className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-black text-slate-900">Side-by-Side Document Comparison</span>
                    </div>

                    {files.length < 2 ? (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        Upload 2nd PDF to compare side-by-side
                      </span>
                    ) : (
                      <div className="flex items-center space-x-2">
                        {compareResult && (
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            compareResult.identicalTotal ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {compareResult.identicalTotal ? '✓ 100% Identical' : '⚠ Differences Detected'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Side-by-Side Viewer */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Left Pane: Document A */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-blue-600">DOCUMENT A (Base)</span>
                        <span className="font-bold text-slate-700 truncate max-w-[180px]">{files[0]?.name || 'Not uploaded'}</span>
                      </div>
                      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 relative">
                        {compareThumbA ? (
                          <img src={compareThumbA} alt="Document A Page" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400">
                            <FileText className="w-10 h-10 mb-1" />
                            <span className="text-xs">Document A</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{compareResult?.fileA?.pageCount || 1} Pages total</span>
                        <span>~{compareResult?.fileA?.wordCount || 0} Words</span>
                      </div>
                    </div>

                    {/* Right Pane: Document B */}
                    <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                        <span className="font-extrabold text-indigo-600">DOCUMENT B (Compared)</span>
                        <span className="font-bold text-slate-700 truncate max-w-[180px]">{files[1]?.name || 'Upload 2nd PDF'}</span>
                      </div>
                      <div className="h-64 flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden border border-slate-200 relative">
                        {compareThumbB ? (
                          <img src={compareThumbB} alt="Document B Page" className="max-h-full max-w-full object-contain" />
                        ) : (
                          <div className="flex flex-col items-center text-slate-400">
                            <FileText className="w-10 h-10 mb-1" />
                            <span className="text-xs">{files[1] ? 'Loading page...' : 'Click + Add Files to select 2nd PDF'}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex justify-between">
                        <span>{compareResult?.fileB?.pageCount || 0} Pages total</span>
                        <span>~{compareResult?.fileB?.wordCount || 0} Words</span>
                      </div>
                    </div>
                  </div>

                  {/* Synchronized Page Navigation Controls */}
                  {compareResult && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 text-xs">
                      <button
                        type="button"
                        onClick={() => handleComparePageChange(compareCurrentPage - 1)}
                        disabled={compareCurrentPage <= 1}
                        className="px-3 py-1 rounded-lg border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        ← Previous Page
                      </button>
                      <span className="font-bold text-slate-800">
                        Page {compareCurrentPage} of {Math.max(compareResult.fileA.pageCount, compareResult.fileB.pageCount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleComparePageChange(compareCurrentPage + 1)}
                        disabled={compareCurrentPage >= Math.max(compareResult.fileA.pageCount, compareResult.fileB.pageCount)}
                        className="px-3 py-1 rounded-lg border border-slate-200 font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                      >
                        Next Page →
                      </button>
                    </div>
                  )}

                  {/* Text difference summary on current page */}
                  {compareResult?.pageComparisons?.[compareCurrentPage - 1] && (
                    <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-2">
                      <span className="font-bold text-slate-800">Page {compareCurrentPage} Content Analysis:</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 max-h-24 overflow-y-auto font-mono text-slate-600">
                          <span className="font-bold block text-blue-600 mb-1">Doc A Snippet:</span>
                          {compareResult.pageComparisons[compareCurrentPage - 1].textA || '(Empty page)'}
                        </div>
                        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 max-h-24 overflow-y-auto font-mono text-slate-600">
                          <span className="font-bold block text-indigo-600 mb-1">Doc B Snippet:</span>
                          {compareResult.pageComparisons[compareCurrentPage - 1].textB || '(Empty page)'}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* =========================================================================
                  ORGANIZE / REORDER PAGES WORKSPACE (Move to position, swap, rotate 360°)
              ========================================================================= */}
              {toolId === 'organize' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span className="font-bold text-slate-800">Page Organizer ({pagesState.length} pages)</span>
                    <span>Reorder positions or rotate continuously without limit</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    {pagesState.map((page, index) => (
                      <div
                        key={`page-${page.originalIndex}-${index}`}
                        className="relative group p-3 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col items-center hover:border-sky-300 transition-all"
                      >
                        {/* Page preview thumbnail with rotation */}
                        <div
                          className="w-full h-36 flex items-center justify-center overflow-hidden bg-slate-100 rounded-xl transition-transform duration-200 shadow-inner"
                          style={{ transform: `rotate(${page.rotation || 0}deg)` }}
                        >
                          {page.dataUrl ? (
                            <img src={page.dataUrl} alt={`Page ${page.pageNum}`} className="max-h-full max-w-full object-contain" />
                          ) : (
                            <FileText className="w-10 h-10 text-slate-400" />
                          )}
                        </div>

                        {/* Page Info & Current Angle Badge */}
                        <div className="mt-2.5 w-full flex items-center justify-between text-xs">
                          <span className="font-black text-slate-800">Page {index + 1}</span>
                          <span className="text-[10px] text-slate-400">Orig #{page.pageNum}</span>
                          {(page.rotation || 0) > 0 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700">
                              {page.rotation}°
                            </span>
                          )}
                        </div>

                        {/* Reorder and Action Toolbar */}
                        <div className="mt-2 w-full pt-2 border-t border-slate-100 flex items-center justify-between">
                          
                          {/* Reorder: Move Left / Move Right */}
                          <div className="flex items-center space-x-0.5">
                            <button
                              type="button"
                              onClick={() => handleMovePage(index, -1)}
                              disabled={index === 0}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-25 cursor-pointer"
                              title="Move Left (Earlier)"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMovePage(index, 1)}
                              disabled={index === pagesState.length - 1}
                              className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-25 cursor-pointer"
                              title="Move Right (Later)"
                            >
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Move to specific page position dropdown */}
                          <div className="flex items-center space-x-1">
                            <span className="text-[10px] text-slate-400 font-bold">To:</span>
                            <select
                              value={index + 1}
                              onChange={(e) => handleMovePageToPosition(index, parseInt(e.target.value, 10))}
                              className="text-[11px] font-bold px-1 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer"
                            >
                              {pagesState.map((_, pIdx) => (
                                <option key={pIdx + 1} value={pIdx + 1}>
                                  #{pIdx + 1}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Rotate (Unlimited 360°) and Delete */}
                          <div className="flex items-center space-x-0.5">
                            <button
                              type="button"
                              onClick={() => handleRotatePage(index)}
                              className="p-1 rounded hover:bg-sky-50 text-slate-500 hover:text-sky-600 cursor-pointer transition-colors"
                              title="Rotate 90° clockwise"
                            >
                              <RotateCw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeletePage(index)}
                              className="p-1 rounded hover:bg-rose-50 text-rose-500 cursor-pointer transition-colors"
                              title="Delete Page"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* WATERMARK OPTIONS */}
              {toolId === 'watermark' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Watermark Configuration</span>
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="e.g. CONFIDENTIAL or COPYRIGHT"
                      className="mt-1 w-full px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Opacity</span>
                        <span>{Math.round(watermarkOpacity * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={watermarkOpacity}
                        onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Angle</span>
                        <span>{watermarkAngle}°</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="90"
                        step="5"
                        value={watermarkAngle}
                        onChange={(e) => setWatermarkAngle(parseInt(e.target.value, 10))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span>Font Size</span>
                        <span>{watermarkSize}px</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="72"
                        step="2"
                        value={watermarkSize}
                        onChange={(e) => setWatermarkSize(parseInt(e.target.value, 10))}
                        className="w-full accent-sky-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* PROTECT OPTIONS */}
              {toolId === 'protect' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Security Password</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Choose Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password..."
                        className="mt-1 w-full px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password..."
                        className="mt-1 w-full px-4 py-2 rounded-xl bg-white border border-slate-300 text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* SIGN PAD */}
              {toolId === 'sign' && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Draw Your Signature</span>
                    <button onClick={clearSignature} className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer">
                      Clear Pad
                    </button>
                  </div>
                  <div className="border-2 border-dashed border-slate-300 rounded-xl bg-white overflow-hidden flex justify-center">
                    <canvas
                      ref={sigCanvasRef}
                      width={450}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={() => setIsDrawing(false)}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={() => setIsDrawing(false)}
                      className="cursor-crosshair touch-none"
                    />
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {errorMsg && (
                <div className="flex items-center space-x-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Alert */}
              {isSuccess && (
                <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Success! Your document is ready and downloaded.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-slate-500 flex items-center space-x-1.5">
                  <InfinityIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>100% In-Browser • Zero Limits</span>
                </div>

                <div className="flex items-center space-x-3 w-full sm:w-auto">
                  <button
                    onClick={onClose}
                    className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Close
                  </button>

                  <button
                    onClick={handleProcess}
                    disabled={isProcessing}
                    className="flex-1 sm:flex-none px-7 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-bold text-sm hover:opacity-95 shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{progressText || 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{tool.title} & Download</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
