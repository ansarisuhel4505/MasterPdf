import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, degrees, rgb } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import { upload } from '@vercel/blob/client';
import JSZip from 'jszip';
import { 
  UploadCloud, FileText, X, ArrowRight, Settings, 
  Image as ImageIcon, Layers, ArrowUp, ArrowDown, 
  Lock, Unlock, Download, FileOutput, RotateCw, Copy, Trash2,
  Plus, ChevronDown, ChevronUp, Sun, Moon, History, Undo, Redo,
  Type, Palette, ZoomIn, ZoomOut, FileCode, FileSpreadsheet,
  Presentation, File as FileIcon, Sparkles, AlertTriangle
} from 'lucide-react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
  useSortable, arrayMove, SortableContext, verticalListSortingStrategy
} from '@dnd-kit/core';
import {
  SortableContext as SortableContext2,
  verticalListSortingStrategy as verticalListSortingStrategy2
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

// Dynamic imports for react-pdf (SSR disable)
const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false });

// i18n translations
const translations = {
  en: {
    mergeTitle: "Merge PDF",
    mergeDesc: "Combine, reorder, insert images/blanks, add metadata and download as a single PDF or ZIP.",
    selectPdf: "Select PDF files",
    addPdf: "Add PDF",
    addImage: "Insert Image",
    addBlank: "Insert Blank",
    proSettings: "Pro Settings",
    hidePro: "Hide Pro",
    outputFormat: "Output Format",
    singlePdf: "Single PDF",
    downloadZip: "Download as ZIP",
    compressOutput: "Compress Output (Reduce size)",
    metadata: "Document Metadata",
    authorName: "Author Name",
    docTitle: "Document Title",
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
    watermarkColor: "Watermark Color",
    watermarkSize: "Watermark Size",
    password: "Password",
    confirmPassword: "Confirm Password",
    headerFooter: "Header/Footer",
    headerText: "Header Text",
    footerText: "Footer Text",
    pageSize: "Page Size",
    aiOptimize: "AI Smart Optimization",
    aiSummary: "AI Summary",
    aiFilename: "AI Suggested Filename",
    tableOfContents: "Auto Table of Contents",
    multiFormatImport: "Multi-Format Import",
    cloudIntegration: "Cloud Integration",
    history: "History",
    clearHistory: "Clear History",
    darkMode: "Dark Mode",
    undo: "Undo",
    redo: "Redo",
    smartFilename: "Smart Filename Generator",
    localProcessing: "Privacy-First (Local Processing)",
    pdfaCompliance: "PDF/A Compliance",
    batchProcessing: "Batch Processing (Large Files)",
    pageSizeOptions: "A4, A3, Letter, Legal, Tabloid",
    emailResult: "Email Result"
  },
  hi: {
    mergeTitle: "PDF मर्ज करें",
    mergeDesc: "कई फ़ाइलों को मिलाएं, पुनः क्रमबद्ध करें, छवियाँ/रिक्त पृष्ठ जोड़ें, और एक PDF या ZIP के रूप में डाउनलोड करें।",
    selectPdf: "PDF फ़ाइलें चुनें",
    addPdf: "PDF जोड़ें",
    addImage: "छवि जोड़ें",
    addBlank: "रिक्त जोड़ें",
    proSettings: "प्रो सेटिंग्स",
    hidePro: "प्रो छुपाएं",
    outputFormat: "आउटपुट फॉर्मेट",
    singlePdf: "एकल PDF",
    downloadZip: "ZIP डाउनलोड करें",
    compressOutput: "आउटपुट संपीड़ित करें (आकार घटाएं)",
    metadata: "दस्तावेज़ मेटाडेटा",
    authorName: "लेखक का नाम",
    docTitle: "दस्तावेज़ शीर्षक",
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
    watermarkColor: "वॉटरमार्क रंग",
    watermarkSize: "वॉटरमार्क आकार",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    headerFooter: "हेडर/फुटर",
    headerText: "हेडर टेक्स्ट",
    footerText: "फुटर टेक्स्ट",
    pageSize: "पृष्ठ आकार",
    aiOptimize: "AI स्मार्ट अनुकूलन",
    aiSummary: "AI सारांश",
    aiFilename: "AI सुझाया गया फ़ाइलनाम",
    tableOfContents: "स्वचालित विषय-सूची",
    multiFormatImport: "मल्टी-फॉर्मेट आयात",
    cloudIntegration: "क्लाउड एकीकरण",
    history: "इतिहास",
    clearHistory: "इतिहास साफ़ करें",
    darkMode: "डार्क मोड",
    undo: "पूर्ववत",
    redo: "फिर करें",
    smartFilename: "स्मार्ट फ़ाइलनाम जनरेटर",
    localProcessing: "गोपनीयता-प्रथम (स्थानीय प्रोसेसिंग)",
    pdfaCompliance: "PDF/A अनुपालन",
    batchProcessing: "बैच प्रोसेसिंग (बड़ी फ़ाइलें)",
    pageSizeOptions: "A4, A3, Letter, Legal, Tabloid",
    emailResult: "ईमेल परिणाम"
  }
};

export default function MergePdf() {
  const [items, setItems] = useState([]); // Original files list
  const [pages, setPages] = useState([]); // All pages extracted (for thumbnails & reorder)
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [outputFormat, setOutputFormat] = useState('pdf');
  const [compressAfter, setCompressAfter] = useState(false);
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');
  const [pageRange, setPageRange] = useState('');
  const [rotatePage, setRotatePage] = useState({}); // pageId -> rotation degree
  const [pageBackground, setPageBackground] = useState({}); // pageId -> color
  const [watermark, setWatermark] = useState('');
  const [watermarkColor, setWatermarkColor] = useState('#ff0000');
  const [watermarkSize, setWatermarkSize] = useState(24);
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
  const [dragMode, setDragMode] = useState('page'); // 'page' or 'file'
  const [zoomLevel, setZoomLevel] = useState(150);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [draggedId, setDraggedId] = useState(null);
  const [toast, setToast] = useState(null);

  const t = translations[lang];
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js';
  }, []);

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_merge_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_merge_history', JSON.stringify(history));
  }, [history]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ========== File Upload & Extraction ==========
  const extractPagesFromPDF = async (file, sourceId) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(arrayBuffer);
    const totalPages = pdf.getPageCount();
    const newPages = [];
    for (let i = 0; i < totalPages; i++) {
      const pageId = `page-${sourceId}-${i}`;
      const objectUrl = URL.createObjectURL(file);
      newPages.push({
        id: pageId,
        sourceId,
        sourceFileName: file.name,
        pageNumber: i + 1,
        thumbnailUrl: objectUrl,
        rotation: 0,
        backgroundColor: '#ffffff',
        file: file // reference for merging
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
      const totalPages = await extractPagesFromPDF(file, sourceId);
      newItems.push({
        id: sourceId,
        name: file.name,
        type: 'pdf',
        file: file,
        previewUrl: URL.createObjectURL(file),
        pages: totalPages.length,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        modified: new Date(file.lastModified).toLocaleDateString()
      });
      newPages.push(...totalPages);
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
      const pageId = `page-${sourceId}-0`;
      setItems(prev => [...prev, {
        id: sourceId,
        name: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
        type: 'image',
        file: pdfBlob,
        previewUrl: URL.createObjectURL(pdfBlob),
        pages: 1,
        size: (pdfBlob.size / (1024 * 1024)).toFixed(2) + ' MB',
        modified: new Date().toLocaleDateString()
      }]);
      setPages(prev => [...prev, {
        id: pageId,
        sourceId,
        sourceFileName: file.name,
        pageNumber: 1,
        thumbnailUrl: URL.createObjectURL(pdfBlob),
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
    const pageId = `page-${sourceId}-0`;

    setItems(prev => [...prev, {
      id: sourceId,
      name: 'Blank A4 Page.pdf',
      type: 'blank',
      file: pdfBlob,
      previewUrl: URL.createObjectURL(pdfBlob),
      pages: 1,
      size: (pdfBlob.size / (1024 * 1024)).toFixed(2) + ' MB',
      modified: new Date().toLocaleDateString()
    }]);
    setPages(prev => [...prev, {
      id: pageId,
      sourceId,
      sourceFileName: 'Blank A4 Page.pdf',
      pageNumber: 1,
      thumbnailUrl: URL.createObjectURL(pdfBlob),
      rotation: 0,
      backgroundColor: '#ffffff',
      file: pdfBlob
    }]);
  };

  // Multi-format import (Word/Excel/PPT) - uses backend convertapi to PDF
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
        // Reuse image upload logic (treat as PDF)
        const sourceId = `mf-${Date.now()}`;
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const totalPages = pdf.getPageCount();
        const newPages = [];
        for (let i = 0; i < totalPages; i++) {
          const pageId = `page-${sourceId}-${i}`;
          newPages.push({
            id: pageId,
            sourceId,
            sourceFileName: file.name,
            pageNumber: i + 1,
            thumbnailUrl: URL.createObjectURL(pdfBlob),
            rotation: 0,
            backgroundColor: '#ffffff',
            file: pdfBlob
          });
        }
        setItems(prev => [...prev, { id: sourceId, name: file.name + '.pdf', type: 'multi', file: pdfBlob, previewUrl: URL.createObjectURL(pdfBlob), pages: totalPages, size: (pdfBlob.size / (1024 * 1024)).toFixed(2) + ' MB', modified: new Date().toLocaleDateString() }]);
        setPages(prev => [...prev, ...newPages]);
      } else {
        showToast(data.error || 'Conversion failed', 'error');
      }
    } catch (err) {
      showToast('Failed to process multi-format file', 'error');
    }
    e.target.value = null;
  };

  // ========== Page Operations ==========
  const removeItem = (index) => {
    const itemToRemove = items[index];
    const removedPages = pages.filter(p => p.sourceId === itemToRemove.id);
    setItems(items.filter((_, i) => i !== index));
    setPages(pages.filter(p => p.sourceId !== itemToRemove.id));
    removedPages.forEach(p => URL.revokeObjectURL(p.thumbnailUrl));
  };

  const removePage = (pageId) => {
    setPages(prev => prev.filter(p => p.id !== pageId));
  };

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

  const rotatePageById = (pageId) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const setPageBg = (pageId, color) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, backgroundColor: color } : p));
  };

  // ========== Undo/Redo ==========
  const saveState = () => {
    setUndoStack(prev => [...prev, { items, pages }]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, { items, pages }]);
    setItems(last.items);
    setPages(last.pages);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, { items, pages }]);
    setItems(last.items);
    setPages(last.pages);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // ========== DnD ==========
  const handleDragStart = (event) => {
    setDraggedId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      saveState();
      const oldIndex = pages.findIndex(p => p.id === active.id);
      const newIndex = pages.findIndex(p => p.id === over.id);
      setPages(prev => arrayMove(prev, oldIndex, newIndex));
    }
    setDraggedId(null);
  };

  // ========== Merge Process ==========
  const processMerge = async () => {
    if (pages.length < 1) return showToast('Please add at least one file', 'error');
    if (password && password !== confirmPassword) return showToast('Passwords do not match!', 'error');
    setIsProcessing(true);

    try {
      saveState();
      const mergedPdf = await PDFDocument.create();

      // Add Table of Contents if enabled
      if (tocEnabled) {
        const tocPage = mergedPdf.addPage([595.28, 841.89]);
        tocPage.drawText('Table of Contents', { x: 50, y: 750, size: 24, color: rgb(0, 0, 0) });
        let y = 700;
        pages.forEach((p, idx) => {
          tocPage.drawText(`${idx + 1}. ${p.sourceFileName} (Page ${p.pageNumber})`, { x: 50, y, size: 12 });
          y -= 20;
        });
      }

      // Merge pages
      for (const page of pages) {
        const arrayBuffer = await page.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const pageIndex = page.pageNumber - 1;
        const [copiedPage] = await mergedPdf.copyPages(pdf, [pageIndex]);
        
        // Apply rotation
        if (page.rotation) {
          copiedPage.setRotation(degrees(page.rotation));
        }
        // Apply background color
        if (page.backgroundColor && page.backgroundColor !== '#ffffff') {
          const { width, height } = copiedPage.getSize();
          copiedPage.drawRectangle({
            x: 0, y: 0, width, height,
            color: rgb(
              parseInt(page.backgroundColor.slice(1,3), 16) / 255,
              parseInt(page.backgroundColor.slice(3,5), 16) / 255,
              parseInt(page.backgroundColor.slice(5,7), 16) / 255
            ),
            opacity: 0.5
          });
        }
        mergedPdf.addPage(copiedPage);
      }

      // Add header/footer to all pages
      if (headerText || footerText) {
        const pages = mergedPdf.getPages();
        pages.forEach((p) => {
          const { width, height } = p.getSize();
          if (headerText) {
            p.drawText(headerText, { x: 50, y: height - 30, size: 12, color: rgb(0.5, 0.5, 0.5) });
          }
          if (footerText) {
            p.drawText(footerText, { x: 50, y: 30, size: 12, color: rgb(0.5, 0.5, 0.5) });
          }
        });
      }

      // Set metadata
      if (title) mergedPdf.setTitle(title);
      if (author) mergedPdf.setAuthor(author);

      let finalBytes = await mergedPdf.save();

      // Watermark - add via pdf-lib
      if (watermark) {
        const wmDoc = await PDFDocument.load(finalBytes);
        const wmPages = wmDoc.getPages();
        wmPages.forEach((p) => {
          const { width, height } = p.getSize();
          p.drawText(watermark, {
            x: width / 2 - watermarkSize * 2,
            y: height / 2,
            size: watermarkSize,
            color: rgb(
              parseInt(watermarkColor.slice(1,3), 16) / 255,
              parseInt(watermarkColor.slice(3,5), 16) / 255,
              parseInt(watermarkColor.slice(5,7), 16) / 255
            ),
            opacity: 0.3,
            rotate: degrees(45)
          });
        });
        finalBytes = await wmDoc.save();
      }

      // Password protection (if requested)
      if (password) {
        const passDoc = await PDFDocument.load(finalBytes);
        passDoc.encrypt({ userPassword: password, ownerPassword: password, permissions: { printing: 'highResolution', copying: true, modifying: false } });
        finalBytes = await passDoc.save();
      }

      // PDF/A compliance (backend call)
      if (pdfaCompliance) {
        const blobToUpload = new Blob([finalBytes], { type: 'application/pdf' });
        const blob = await upload('temp.pdf', blobToUpload, { access: 'public', handleUploadUrl: '/api/upload' });
        const response = await fetch('/api/master-convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pdf-to-pdfa', fileUrl: blob.url, options: { level: 'pdfa1b' } }) });
        const data = await response.json();
        if (response.ok && data.downloadUrl) {
          const pdfBlob = await (await fetch(data.downloadUrl)).blob();
          finalBytes = await pdfBlob.arrayBuffer();
        } else {
          showToast('PDF/A conversion failed', 'error');
        }
      }

      // Compress after merge
      if (compressAfter) {
        const blobToUpload = new Blob([finalBytes], { type: 'application/pdf' });
        const blob = await upload('merged_temp.pdf', blobToUpload, { access: 'public', handleUploadUrl: '/api/upload' });
        const response = await fetch('/api/master-convert', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'compress-pdf', fileUrl: blob.url, quality: 70 }) });
        const data = await response.json();
        if (response.ok && data.downloadUrl) {
          const pdfBlob = await (await fetch(data.downloadUrl)).blob();
          finalBytes = await pdfBlob.arrayBuffer();
        } else {
          showToast('Compression failed', 'error');
        }
      }

      // Output as ZIP
      if (outputFormat === 'zip') {
        const zip = new JSZip();
        zip.file('Merged_Document.pdf', finalBytes);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'MasterPdf_Merged.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsProcessing(false);
        // Update history
        const entry = { time: new Date().toLocaleString(), files: items.map(i => i.name), type: outputFormat };
        setHistory(prev => [entry, ...prev].slice(0, 10));
        return;
      }

      // Save merged file
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = aiFilename ? aiFilename : 'MasterPdf_Merged.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update history
      const entry = { time: new Date().toLocaleString(), files: items.map(i => i.name), type: 'PDF' };
      setHistory(prev => [entry, ...prev].slice(0, 10));

    } catch (error) {
      console.error("Error merging PDFs:", error);
      showToast('Failed to merge PDFs. The file might be corrupted.', 'error');
    }
    setIsProcessing(false);
  };

  // AI Smart Optimization
  const runAIOptimization = async () => {
    if (!aiEnabled) return;
    setAiSummary('Analyzing...');
    setAiFilename('Generating...');
    try {
      // Upload merged file to backend and get AI summary
      // (simplified - assumes mergedPdf is available)
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-summarizer', fileUrls: pages[0] ? [await (async () => { const blob = await upload('temp.pdf', new Blob([await new Blob([await new Response(pages[0].file).arrayBuffer()]).arrayBuffer()]), { access: 'public', handleUploadUrl: '/api/upload' }); return blob.url; })()] : [], options: { length: 'medium', type: 'bullet' } })
      });
      const data = await response.json();
      if (data.textResult) {
        setAiSummary(data.textResult);
        // Generate filename from first few words
        const firstWords = data.textResult.split(' ').slice(0, 3).join('_');
        setAiFilename(`Merged_${firstWords || 'Document'}.pdf`);
      }
    } catch (err) {
      setAiSummary('AI analysis failed.');
      setAiFilename('Merged_Document.pdf');
    }
  };

  // ========== UI Components ==========
  // Sortable page item for DnD
  const SortablePage = ({ page }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });
    const style = {
      transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
      transition,
      opacity: isDragging ? 0.5 : 1
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`relative bg-white border rounded-lg shadow-sm hover:shadow-md p-2 m-2 ${isDragging ? 'ring-2 ring-red-300' : ''}`}>
        <div style={{ width: zoomLevel, height: zoomLevel * 1.3, overflow: 'hidden', position: 'relative' }}>
          <Document file={page.thumbnailUrl}>
            <Page pageNumber={1} width={zoomLevel} />
          </Document>
          {page.backgroundColor !== '#ffffff' && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: page.backgroundColor, opacity: 0.3 }} />
          )}
        </div>
        <div className="flex justify-between items-center mt-2">
          <button onClick={() => rotatePageById(page.id)} className="text-gray-500 hover:text-blue-600 p-1" title={t.rotate}>
            <RotateCw size={14} />
          </button>
          <button onClick={() => duplicatePage(page.id)} className="text-gray-500 hover:text-green-600 p-1" title={t.duplicate}>
            <Copy size={14} />
          </button>
          <button onClick={() => removePage(page.id)} className="text-gray-500 hover:text-red-600 p-1" title={t.delete}>
            <Trash2 size={14} />
          </button>
          <label className="text-gray-500 hover:text-purple-600 p-1 cursor-pointer" title={t.pageBackground}>
            <input type="color" value={page.backgroundColor} onChange={(e) => setPageBg(page.id, e.target.value)} className="sr-only" />
            <Palette size={14} />
          </label>
        </div>
        <span className="absolute top-1 left-1 text-[10px] bg-gray-100 px-1 rounded">{page.pageNumber}</span>
      </div>
    );
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
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                      <SortableContext items={pages.map(p => p.id)} strategy={verticalListSortingStrategy}>
                        <div className="flex flex-wrap gap-2 bg-gray-50 dark:bg-gray-700 p-3 rounded-lg max-h-96 overflow-y-auto">
                          {pages.map(page => (
                            <SortablePage key={page.id} page={page} />
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
