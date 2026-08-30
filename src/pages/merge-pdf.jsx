import React, { useState, useRef, useEffect } from 'react';
import { CSS } from '@dnd-kit/utilities'; 
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
// 🔥 FIX: Added StandardFonts for deep features like bold TOC and Page numbers
import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { upload } from '@vercel/blob/client';
import JSZip from 'jszip';
import { 
  UploadCloud, FileText, X, ArrowRight, Settings, 
  Image as ImageIcon, Layers, RotateCw, Copy, Trash2,
  ChevronDown, ChevronUp, Sun, Moon, History, Undo, Redo, 
  Palette, ZoomIn, ZoomOut, File as FileIcon, Sparkles
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy
} from '@dnd-kit/sortable';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '3.11.174'}/build/pdf.worker.min.mjs`;
}

const translations = {
  en: {
    mergeTitle: "Merge PDF",
    mergeDesc: "Combine, reorder, insert images/blanks, add metadata and download as a single PDF or ZIP.",
    selectPdf: "Select PDF files",
    addPdf: "Add PDF",
    addImage: "Insert Image",
    addBlank: "Insert Blank",
    proSettings: "Pro Settings",
    outputFormat: "Output Format",
    downloadZip: "Download as ZIP",
    compressOutput: "Compress Output (Reduce size)",
    pageRange: "Page Range (e.g., 1-5, 8)",
    pageThumbnails: "Page Thumbnails",
    dragPages: "Drag & Drop pages to reorder",
    rotate: "Rotate",
    duplicate: "Duplicate",
    delete: "Delete",
    zoomIn: "Zoom In",
    zoomOut: "Zoom Out",
    pageBackground: "Page Background",
    watermark: "Watermark Text",
    password: "Password",
    confirmPassword: "Confirm Password",
    headerText: "Header Text",
    footerText: "Footer Text",
    pageSize: "Page Size",
    aiOptimize: "AI Smart Optimization",
    aiSummary: "AI Summary",
    aiFilename: "AI Suggested Filename",
    tableOfContents: "Auto Table of Contents",
    pdfaCompliance: "PDF/A Compliance",
    history: "History",
    clearHistory: "Clear History"
  },
  hi: {
    mergeTitle: "PDF मर्ज करें",
    mergeDesc: "कई फ़ाइलों को मिलाएं, पुनः क्रमबद्ध करें, छवियाँ/रिक्त पृष्ठ जोड़ें, और एक PDF या ZIP के रूप में डाउनलोड करें।",
    selectPdf: "PDF फ़ाइलें चुनें",
    addPdf: "PDF जोड़ें",
    addImage: "छवि जोड़ें",
    addBlank: "रिक्त जोड़ें",
    proSettings: "प्रो सेटिंग्स",
    outputFormat: "आउटपुट फॉर्मेट",
    downloadZip: "ZIP डाउनलोड करें",
    compressOutput: "आउटपुट संपीड़ित करें (आकार घटाएं)",
    pageRange: "पृष्ठ रेंज (जैसे 1-5, 8)",
    pageThumbnails: "पृष्ठ थंबनेल",
    dragPages: "पुनः क्रमबद्ध करने के लिए पृष्ठ खींचें और छोड़ें",
    rotate: "घुमाएँ",
    duplicate: "डुप्लिकेट करें",
    delete: "हटाएँ",
    zoomIn: "ज़ूम इन",
    zoomOut: "ज़ूम आउट",
    pageBackground: "पृष्ठ पृष्ठभूमि",
    watermark: "वॉटरमार्क टेक्स्ट",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    headerText: "हेडर टेक्स्ट",
    footerText: "फुटर टेक्स्ट",
    pageSize: "पृष्ठ आकार",
    aiOptimize: "AI स्मार्ट अनुकूलन",
    aiSummary: "AI सारांश",
    aiFilename: "AI सुझाया गया फ़ाइलनाम",
    tableOfContents: "स्वचालित विषय-सूची",
    pdfaCompliance: "PDF/A अनुपालन",
    history: "इतिहास",
    clearHistory: "इतिहास साफ़ करें"
  }
};

// SortablePage component separated safely to prevent render loops
const SortablePage = ({ page, zoomLevel, rotatePageById, duplicatePage, removePage, setPageBg, t }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
  
  const style = {
    transform: CSS.Transform.toString(transform), 
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none', 
    zIndex: isDragging ? 50 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`relative bg-white border rounded-lg shadow-sm hover:shadow-md p-2 ${isDragging ? 'ring-2 ring-red-300' : ''}`}>
      
      <div style={{ width: zoomLevel, height: zoomLevel * 1.3, overflow: 'hidden', position: 'relative' }}>
        <Document 
          file={page.file} 
          loading={<div className="flex items-center justify-center h-full text-xs text-gray-400">Loading...</div>}
          error={(error) => (
            <div className="flex flex-col items-center justify-center h-full text-[10px] text-red-500 font-bold p-1 text-center overflow-hidden">
              <span>Failed</span>
              <span className="font-normal text-gray-400 mt-1" title={error?.message}>{error?.message?.substring(0,35)}</span>
            </div>
          )}
        >
          {/* 🔥 FIX 1: Added rotate={page.rotation} to reflect rotation instantly in UI */}
          <Page pageNumber={page.pageNumber} width={zoomLevel} rotate={page.rotation || 0} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
        
        {/* 🔥 FIX 2: Used mixBlendMode so color looks like a natural tint, and pointerEvents none so it doesn't block clicks */}
        {page.backgroundColor !== '#ffffff' && (
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: page.backgroundColor, mixBlendMode: 'multiply', pointerEvents: 'none' }} />
        )}
      </div>
      
      {/* 🔥 Added relative z-10 so buttons stay above the dragging layer */}
      <div className="flex justify-between items-center mt-2 border-t pt-2 relative z-10">
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => rotatePageById(page.id)} className="text-gray-500 hover:text-blue-600 p-1" title={t.rotate}><RotateCw size={14} /></button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => duplicatePage(page.id)} className="text-gray-500 hover:text-green-600 p-1" title={t.duplicate}><Copy size={14} /></button>
        <button onPointerDown={(e) => e.stopPropagation()} onClick={() => removePage(page.id)} className="text-gray-500 hover:text-red-600 p-1" title={t.delete}><Trash2 size={14} /></button>
        
        {/* 🔥 FIX 3: Fixed Color Picker Click Blocker. Now clicking anywhere on the icon opens the palette perfectly */}
        <div onPointerDown={(e) => e.stopPropagation()} className="relative flex items-center justify-center w-6 h-6 overflow-hidden rounded hover:bg-gray-100 cursor-pointer" title={t.pageBackground}>
          <input type="color" value={page.backgroundColor || '#ffffff'} onChange={(e) => setPageBg(page.id, e.target.value)} className="absolute inset-0 w-[200%] h-[200%] -top-1/2 -left-1/2 cursor-pointer opacity-0 z-20" />
          <Palette size={14} className="text-gray-500 pointer-events-none relative z-10" />
        </div>
      </div>
      <span className="absolute top-1 left-1 text-[10px] bg-gray-100 px-1 rounded shadow pointer-events-none">{page.pageNumber}</span>
    </div>
  );
};

export default function MergePdf() {
  const [items, setItems] = useState([]); 
  const [pages, setPages] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [compressAfter, setCompressAfter] = useState(false);
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [pageRange, setPageRange] = useState('');
  const [watermark, setWatermark] = useState('');
  const [watermarkColor, setWatermarkColor] = useState('#ff0000');
  const [watermarkSize, setWatermarkSize] = useState(48); // Increased default watermark size
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [pageSizeOption, setPageSizeOption] = useState('A4');
  const [aiSummary, setAiSummary] = useState('');
  const [aiFilename, setAiFilename] = useState('');
  const [aiEnabled, setAiEnabled] = useState(false);
  const [tocEnabled, setTocEnabled] = useState(false);
  const [pdfaCompliance, setPdfaCompliance] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(150);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [toast, setToast] = useState(null);

  const t = translations[lang];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_merge_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_merge_history', JSON.stringify(history));
  }, [history]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const extractPagesFromPDF = async (file, sourceId) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true }); // Prevent load errors
    const totalPages = pdf.getPageCount();
    const newPages = [];
    
    for (let i = 0; i < totalPages; i++) {
      newPages.push({
        id: `page-${sourceId}-${i}`,
        sourceId,
        sourceFileName: file.name,
        pageNumber: i + 1,
        rotation: 0,
        backgroundColor: '#ffffff',
        file: file 
      });
    }
    return newPages;
  };

  const handlePDFUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validPdfs = selectedFiles.filter(f => f.type === 'application/pdf');
    if (validPdfs.length === 0) return showToast(t.selectPdf, 'error');

    const newItems = [];
    const newPages = [];
    for (const file of validPdfs) {
      const sourceId = `src-${Date.now()}-${Math.random()}`;
      try {
        const extractedPages = await extractPagesFromPDF(file, sourceId);
        newItems.push({
          id: sourceId,
          name: file.name,
          type: 'pdf',
          file: file, 
          pages: extractedPages.length,
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          modified: new Date(file.lastModified).toLocaleDateString()
        });
        newPages.push(...extractedPages);
      } catch (err) {
        showToast(`Failed to parse ${file.name}. It might be corrupted.`, 'error');
      }
    }
    setItems(prev => [...prev, ...newItems]);
    setPages(prev => [...prev, ...newPages]);
    e.target.value = null;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return showToast('Please upload JPG or PNG image', 'error');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const tempPdf = await PDFDocument.create();
      let image;
      if (file.type === 'image/png') image = await tempPdf.embedPng(arrayBuffer);
      else image = await tempPdf.embedJpg(arrayBuffer);
      const page = tempPdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      const pdfBytes = await tempPdf.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      const sourceId = `img-${Date.now()}`;
      setItems(prev => [...prev, {
        id: sourceId,
        name: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
        type: 'image',
        file: pdfBlob, 
        pages: 1,
        size: (pdfBlob.size / (1024 * 1024)).toFixed(2) + ' MB',
        modified: new Date().toLocaleDateString()
      }]);
      setPages(prev => [...prev, {
        id: `page-${sourceId}-0`,
        sourceId,
        sourceFileName: file.name,
        pageNumber: 1,
        rotation: 0,
        backgroundColor: '#ffffff',
        file: pdfBlob
      }]);
    } catch (error) {
      showToast('Failed to process image', 'error');
    }
    e.target.value = null;
  };

  const handleInsertBlank = async () => {
    const tempPdf = await PDFDocument.create();
    tempPdf.addPage([595.28, 841.89]);
    const pdfBytes = await tempPdf.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
    const sourceId = `blank-${Date.now()}`;

    setItems(prev => [...prev, {
      id: sourceId,
      name: 'Blank A4 Page.pdf',
      type: 'blank',
      file: pdfBlob,
      pages: 1,
      size: (pdfBlob.size / (1024 * 1024)).toFixed(2) + ' MB',
      modified: new Date().toLocaleDateString()
    }]);
    setPages(prev => [...prev, {
      id: `page-${sourceId}-0`,
      sourceId,
      sourceFileName: 'Blank A4 Page.pdf',
      pageNumber: 1,
      rotation: 0,
      backgroundColor: '#ffffff',
      file: pdfBlob
    }]);
  };

  const handleMultiFormatUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const validExts = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'];
    if (!validExts.includes(ext)) return showToast('Unsupported format', 'error');
    
    try {
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'any-to-pdf', fileUrl: blob.url, format: ext })
      });
      const data = await response.json();
      if (response.ok && data.downloadUrl) {
        const pdfBlob = await (await fetch(data.downloadUrl)).blob();
        const sourceId = `mf-${Date.now()}`;
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        
        const newPages = [];
        for (let i = 0; i < totalPages; i++) {
          newPages.push({
            id: `page-${sourceId}-${i}`,
            sourceId,
            sourceFileName: file.name,
            pageNumber: i + 1,
            rotation: 0,
            backgroundColor: '#ffffff',
            file: pdfBlob
          });
        }
        setItems(prev => [...prev, { id: sourceId, name: file.name + '.pdf', type: 'multi', file: pdfBlob, pages: totalPages, size: (pdfBlob.size / (1024 * 1024)).toFixed(2) + ' MB', modified: new Date().toLocaleDateString() }]);
        setPages(prev => [...prev, ...newPages]);
      } else {
        showToast(data.error || 'Conversion failed', 'error');
      }
    } catch (err) {
      showToast('Failed to process multi-format file', 'error');
    }
    e.target.value = null;
  };

  const removeItem = (index) => {
    const itemToRemove = items[index];
    setItems(items.filter((_, i) => i !== index));
    setPages(pages.filter(p => p.sourceId !== itemToRemove.id));
  };

  const removePage = (pageId) => setPages(prev => prev.filter(p => p.id !== pageId));

  const duplicatePage = (pageId) => {
    const pageToCopy = pages.find(p => p.id === pageId);
    if (!pageToCopy) return;
    const newPage = { ...pageToCopy, id: `copy-${Date.now()}-${Math.random()}` };
    setPages(prev => {
      const index = prev.findIndex(p => p.id === pageId);
      const newArr = [...prev];
      newArr.splice(index + 1, 0, newPage);
      return newArr;
    });
  };

  const rotatePageById = (pageId) => setPages(prev => prev.map(p => p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  const setPageBg = (pageId, color) => setPages(prev => prev.map(p => p.id === pageId ? { ...p, backgroundColor: color } : p));

  const saveState = () => {
    setUndoStack(prev => [...prev, { items, pages }]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { items, pages }]);
    setItems(last.items); setPages(last.pages);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { items, pages }]);
    setItems(last.items); setPages(last.pages);
    setRedoStack(prev => prev.slice(0, -1));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      saveState();
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      setPages(prev => arrayMove(prev, oldIndex, newIndex));
    }
  };

  // 🔥 FULLY REWRITTEN MERGE ENGINE (Memory Safe & Deep Features)
  const processMerge = async () => {
    if (pages.length < 1) return showToast('Please add at least one file', 'error');
    if (password && password !== confirmPassword) return showToast('Passwords do not match!', 'error');
    setIsProcessing(true);

    try {
      saveState();
      const mergedPdf = await PDFDocument.create();

      // Setup standard fonts for global text additions
      const helveticaFont = await mergedPdf.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);

      // Parse Allowed Pages Map
      let allowedIndices = [];
      if (pageRange.trim()) {
        const parts = pageRange.split(',');
        parts.forEach(part => {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number);
            for (let i = start; i <= end; i++) allowedIndices.push(i);
          } else {
            allowedIndices.push(Number(part.trim()));
          }
        });
      }

      const pagesToMerge = allowedIndices.length > 0 
        ? pages.filter((_, idx) => allowedIndices.includes(idx + 1)) 
        : pages;

      if (pagesToMerge.length === 0) {
        setIsProcessing(false);
        return showToast('No pages match your selected range!', 'error');
      }

      const sizeMap = {
        A4: [595.28, 841.89], A3: [841.89, 1190.55], Letter: [612, 792], Legal: [612, 1008], Tabloid: [792, 1224]
      };
      const targetSize = sizeMap[pageSizeOption] || sizeMap.A4;

      // Deep Feature: Professional Table of Contents
      if (tocEnabled) {
        const tocPage = mergedPdf.addPage(targetSize);
        tocPage.drawText('Table of Contents', { x: 50, y: targetSize[1] - 80, size: 28, color: rgb(0, 0, 0), font: helveticaBold });
        let yPos = targetSize[1] - 140;
        
        pagesToMerge.forEach((p, idx) => {
          if (yPos < 50) return; // Simple overflow protection
          const text = `${idx + 1}. ${p.sourceFileName} (Original Pg: ${p.pageNumber})`;
          tocPage.drawText(text, { x: 50, y: yPos, size: 12, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });
          // Dotted line effect
          tocPage.drawText('. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . .', { x: 50, y: yPos - 10, size: 8, color: rgb(0.7, 0.7, 0.7) });
          yPos -= 30;
        });
      }

      // 🔥 FIX: Memory Crash Prevention. We will load each file only ONCE.
      const loadedPdfsCache = {};

      for (let i = 0; i < pagesToMerge.length; i++) {
        const page = pagesToMerge[i];
        
        // Load PDF from cache if it exists, otherwise load it and store it
        let sourcePdf;
        if (loadedPdfsCache[page.sourceId]) {
          sourcePdf = loadedPdfsCache[page.sourceId];
        } else {
          const arrayBuffer = await page.file.arrayBuffer();
          sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true }); // Prevent encryption crashes
          loadedPdfsCache[page.sourceId] = sourcePdf;
        }

        const pageIndex = page.pageNumber - 1;
        const [embeddedPage] = await mergedPdf.embedPdf(sourcePdf, [pageIndex]);
        const newPage = mergedPdf.addPage(targetSize);

        // Apply Page Background Tool
        if (page.backgroundColor && page.backgroundColor !== '#ffffff') {
          newPage.drawRectangle({
            x: 0, y: 0, width: targetSize[0], height: targetSize[1],
            color: rgb(
              parseInt(page.backgroundColor.slice(1,3), 16) / 255,
              parseInt(page.backgroundColor.slice(3,5), 16) / 255,
              parseInt(page.backgroundColor.slice(5,7), 16) / 255
            ),
            opacity: 1
          });
        }

        // Deep Feature: Auto-Scale keeping Aspect Ratio
        const embDims = embeddedPage.scale(1);
        const scaleX = targetSize[0] / embDims.width;
        const scaleY = targetSize[1] / embDims.height;
        const scale = Math.min(scaleX, scaleY); 

        const scaledWidth = embDims.width * scale;
        const scaledHeight = embDims.height * scale;
        const xCenter = (targetSize[0] - scaledWidth) / 2;
        const yCenter = (targetSize[1] - scaledHeight) / 2;

        if (page.rotation) {
          newPage.setRotation(degrees(page.rotation));
        }

        newPage.drawPage(embeddedPage, { x: xCenter, y: yCenter, width: scaledWidth, height: scaledHeight });
      }

      // Deep Feature: Global Page Numbers, Headers and Footers
      const mPages = mergedPdf.getPages();
      mPages.forEach((p, index) => {
        const { width, height } = p.getSize();
        if (headerText) p.drawText(headerText, { x: 50, y: height - 30, size: 11, font: helveticaFont, color: rgb(0.4, 0.4, 0.4) });
        if (footerText) p.drawText(footerText, { x: 50, y: 30, size: 11, font: helveticaFont, color: rgb(0.4, 0.4, 0.4) });
        
        // Auto Page Numbering on the right
        p.drawText(`Page ${index + 1} of ${mPages.length}`, { x: width - 90, y: 30, size: 10, font: helveticaBold, color: rgb(0.5, 0.5, 0.5) });
      });

      if (title) mergedPdf.setTitle(title);
      if (author) mergedPdf.setAuthor(author);

      let finalBytes = await mergedPdf.save();

      // Deep Feature: Professional Watermark
      if (watermark) {
        const wmDoc = await PDFDocument.load(finalBytes);
        const wmPages = wmDoc.getPages();
        const wmFont = await wmDoc.embedFont(StandardFonts.HelveticaBold);
        
        wmPages.forEach((p) => {
          const { width, height } = p.getSize();
          // Adjust watermark starting X based on string length to roughly center it
          const startX = (width / 2) - (watermark.length * (watermarkSize * 0.3)); 
          p.drawText(watermark, {
            x: startX,
            y: height / 2 - 50,
            size: Number(watermarkSize),
            font: wmFont,
            color: rgb(
              parseInt(watermarkColor.slice(1,3), 16) / 255,
              parseInt(watermarkColor.slice(3,5), 16) / 255,
              parseInt(watermarkColor.slice(5,7), 16) / 255
            ),
            opacity: 0.35,
            rotate: degrees(45)
          });
        });
        finalBytes = await wmDoc.save();
      }

      // Encryption (Password Protection)
      if (password) {
        const passDoc = await PDFDocument.load(finalBytes);
        passDoc.encrypt({ userPassword: password, ownerPassword: password, permissions: { printing: 'highResolution', copying: true, modifying: false } });
        finalBytes = await passDoc.save();
      }

      // External AI API Calls (Compress & PDF/A) with Fail-Safe Try/Catch
      if (pdfaCompliance || compressAfter) {
        try {
          const blobToUpload = new Blob([finalBytes], { type: 'application/pdf' });
          const blob = await upload(`temp_merge_${Date.now()}.pdf`, blobToUpload, { access: 'public', handleUploadUrl: '/api/upload' });
          
          if (pdfaCompliance) {
            const response = await fetch('/api/master-convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pdf-to-pdfa', fileUrl: blob.url, options: { level: 'pdfa1b' } }) });
            const data = await response.json();
            if (response.ok && data.downloadUrl) finalBytes = await (await fetch(data.downloadUrl)).arrayBuffer();
          }
          if (compressAfter) {
            const response = await fetch('/api/master-convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'compress-pdf', fileUrl: blob.url, quality: 70 }) });
            const data = await response.json();
            if (response.ok && data.downloadUrl) finalBytes = await (await fetch(data.downloadUrl)).arrayBuffer();
          }
        } catch (apiError) {
          console.warn("External API tools failed. Skipping compression but keeping merged document.", apiError);
          showToast('Note: Server busy, skipping PDF/A or Compression, but Merge is successful.', 'success');
        }
      }

      // Safe Download Generation
      if (outputFormat === 'zip') {
        const zip = new JSZip();
        zip.file(aiFilename || 'MasterPdf_Merged.pdf', finalBytes);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'MasterPdf_Merged.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = aiFilename || 'MasterPdf_Merged.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      // Finish up
      setIsProcessing(false);
      const entry = { time: new Date().toLocaleString(), files: items.map(i => i.name), type: outputFormat.toUpperCase() };
      setHistory(prev => [entry, ...prev].slice(0, 10));
      showToast('Document generated and downloaded successfully!', 'success');

    } catch (error) {
      console.error("Critical Merging Error:", error);
      showToast(`Failed: ${error.message || 'System error during merge process'}`, 'error');
      setIsProcessing(false);
    }
  };

  const runAIOptimization = async () => {
    if (!aiEnabled) return;
    setAiSummary('Analyzing...');
    setAiFilename('Generating...');
    try {
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-summarizer', fileUrls: pages[0] ? [await (async () => { const blob = await upload('temp.pdf', new Blob([await new Blob([await new Response(pages[0].file).arrayBuffer()]).arrayBuffer()]), { access: 'public', handleUploadUrl: '/api/upload' }); return blob.url; })()] : [], options: { length: 'medium', type: 'bullet' } })
      });
      const data = await response.json();
      if (data.textResult) {
        setAiSummary(data.textResult);
        const firstWords = data.textResult.split(' ').slice(0, 3).join('_');
        setAiFilename(`Merged_${firstWords || 'Document'}.pdf`);
      }
    } catch (err) {
      setAiSummary('AI analysis failed.');
      setAiFilename('Merged_Document.pdf');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>{t.mergeTitle} Online Free | MasterPdf</title>
        <meta name="description" content="Combine multiple PDF files into one document instantly. Add blank pages, images, and reorder pages. Free, secure, and fast PDF merger tool by MasterPdf." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t.mergeTitle}</h1>
          <p className="text-base sm:text-lg opacity-80">{t.mergeDesc}</p>
        </div>

        {/* Toolbar */}
        <div className="flex justify-end mb-4 gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 rounded-lg border bg-white dark:bg-gray-800">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
          <button onClick={undo} disabled={undoStack.length === 0} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow disabled:opacity-30" title={t.undo}>
            <Undo size={18} />
          </button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow disabled:opacity-30" title={t.redo}>
            <Redo size={18} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* Sidebar Options */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={18} /> {t.proSettings}</h3>

            <div className="space-y-4">
              {/* File Info Display */}
              {items.map((item, idx) => (
                <div key={item.id} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg text-xs">
                  <p className="font-bold truncate">{item.name}</p>
                  <p className="opacity-70">{item.pages} pages | {item.size} | {item.modified}</p>
                </div>
              ))}

              {/* Page Range Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageRange}</label>
                <input type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="e.g., 1-5, 8" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              {/* Zoom Controls */}
              <div>
                <label className="block text-sm font-medium mb-1">Zoom</label>
                <div className="flex gap-2">
                  <button onClick={() => setZoomLevel(prev => Math.max(80, prev - 20))} className="p-2 bg-gray-200 rounded"><ZoomOut size={16} /></button>
                  <span className="text-sm self-center">{zoomLevel}px</span>
                  <button onClick={() => setZoomLevel(prev => Math.min(300, prev + 20))} className="p-2 bg-gray-200 rounded"><ZoomIn size={16} /></button>
                </div>
              </div>

              {/* Page Size Adjust */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageSize}</label>
                <select value={pageSizeOption} onChange={(e) => setPageSizeOption(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                  <option value="Tabloid">Tabloid</option>
                </select>
              </div>

              {/* Header/Footer */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.headerText}</label>
                <input type="text" value={headerText} onChange={(e) => setHeaderText(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                <label className="block text-sm font-medium mb-1 mt-2">{t.footerText}</label>
                <input type="text" value={footerText} onChange={(e) => setFooterText(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              {/* Watermark */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.watermark}</label>
                <input type="text" value={watermark} onChange={(e) => setWatermark(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                <div className="flex gap-2 mt-2">
                  <input type="color" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} className="w-10 h-10 border rounded" />
                  <input type="number" value={watermarkSize} onChange={(e) => setWatermarkSize(e.target.value)} className="w-20 p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.password}</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                <label className="block text-sm font-medium mb-1 mt-2">{t.confirmPassword}</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              {/* AI Optimization */}
              <button onClick={() => { setAiEnabled(!aiEnabled); if (!aiEnabled) runAIOptimization(); }} className="w-full p-2 bg-indigo-500 text-white rounded-lg font-bold flex items-center justify-center gap-2">
                <Sparkles size={16} /> {t.aiOptimize}
              </button>
              {aiEnabled && (
                <div className="text-xs bg-indigo-50 p-2 rounded">
                  <p className="font-bold">{t.aiFilename}</p>
                  <p className="break-all">{aiFilename}</p>
                  <p className="font-bold mt-2">{t.aiSummary}</p>
                  <p className="line-clamp-3">{aiSummary}</p>
                </div>
              )}

              {/* TOC */}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={tocEnabled} onChange={(e) => setTocEnabled(e.target.checked)} />
                {t.tableOfContents}
              </label>

              {/* PDF/A Compliance */}
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={pdfaCompliance} onChange={(e) => setPdfaCompliance(e.target.checked)} />
                {t.pdfaCompliance}
              </label>

              {/* Advanced toggle */}
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAdvanced ? 'Hide' : 'More Options'}
              </button>

              {showAdvanced && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={compressAfter} onChange={() => setCompressAfter(!compressAfter)} />
                    {t.compressOutput}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={outputFormat === 'zip'} onChange={() => setOutputFormat(outputFormat === 'zip' ? 'pdf' : 'zip')} />
                    {t.downloadZip}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={pdfaCompliance} onChange={() => setPdfaCompliance(!pdfaCompliance)} />
                    PDF/A Compliance
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[500px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* Upload Section */}
              {items.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <input type="file" id="file-upload" multiple accept=".pdf" onChange={handlePDFUpload} className="hidden" />
                  <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-4 border-dashed border-red-200/50 hover:border-red-100">
                    <UploadCloud size={28} /> {t.selectPdf}
                  </label>
                  <p className="mt-4 text-gray-400 text-sm">{t.addPdf} / {t.addImage} / {t.addBlank}</p>
                </div>
              ) : (
                <div className="w-full">
                  {/* File List (Original Items) */}
                  <div className="border rounded-lg bg-gray-50 dark:bg-gray-700 p-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-bold">{items.length} File(s)</h4>
                      <div className="flex gap-2">
                        <button onClick={undo} className="p-1 bg-gray-200 rounded"><Undo size={14} /></button>
                        <button onClick={redo} className="p-1 bg-gray-200 rounded"><Redo size={14} /></button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {items.map((item, index) => (
                        <div key={item.id} className="flex items-center justify-between bg-white border p-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileText size={18} className="text-[#E5322D]" />
                            <span className="text-sm font-bold truncate max-w-[200px]">{item.name}</span>
                            <span className="text-xs text-gray-500">{item.pages} pages</span>
                          </div>
                          <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Page Thumbnails Grid with DnD */}
                  <div className="mb-4">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <Layers size={18} /> {t.pageThumbnails} <span className="text-xs font-normal">({t.dragPages})</span>
                    </h4>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                     <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                        <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg max-h-96 overflow-y-auto">
                          {pages.map(page => (
                            <SortablePage 
                              key={page.id} 
                              page={page} 
                              zoomLevel={zoomLevel}
                              rotatePageById={rotatePageById}
                              duplicatePage={duplicatePage}
                              removePage={removePage}
                              setPageBg={setPageBg}
                              t={t}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="file" multiple accept=".pdf" onChange={handlePDFUpload} className="hidden" />
                      <UploadCloud size={16} /> {t.addPdf}
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="file" accept=".jpg,.jpeg,.png" onChange={handleImageUpload} className="hidden" />
                      <ImageIcon size={16} /> {t.addImage}
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input type="file" accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt" onChange={handleMultiFormatUpload} className="hidden" />
                      <FileIcon size={16} /> Multi-Format
                    </label>
                    <button onClick={handleInsertBlank} className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50">
                      <Layers size={16} /> {t.addBlank}
                    </button>
                  </div>

                  {/* Merge Button */}
                  <button onClick={processMerge} disabled={isProcessing} className="w-full flex items-center justify-center gap-2 px-12 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 disabled:bg-gray-400">
                    {isProcessing ? <><Settings className="animate-spin" size={24} /> Merging...</> : <>Merge & Download <ArrowRight size={24} /></>}
                  </button>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2"><History size={18} /> {t.history}</h4>
                  <button onClick={() => setHistory([])} className="text-red-500 text-sm hover:underline">{t.clearHistory}</button>
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span>{item.files.join(', ')} <span className="opacity-50">({item.type}, {item.time})</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
