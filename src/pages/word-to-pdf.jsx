import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  UploadCloud, FileText, X, ArrowRight, Settings, Trash2, Download,
  Cloud, Mail, Share2, History, Sun, Moon, Lock, Combine, Split, 
  ChevronDown, ChevronUp, Plus, Palette, Type, SlidersHorizontal, Eye,
  ChevronLeft, ChevronRight, PenTool, Image as ImageIcon, Square, Circle, Highlighter, ZoomIn, ZoomOut, Save
} from 'lucide-react';
import { upload } from '@vercel/blob/client';

// PDF Editor Imports
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const TOOL_TITLE = "Word to PDF Converter";
const TOOL_DESC = "Make DOC and DOCX files easy to read by converting them to PDF and Edit them instantly.";
const ACTION_NAME = "word-to-pdf";
const ACCEPT_FORMAT = ".doc,.docx";

const translations = {
  en: {
    select: "Select File", drag: "Drag & drop your files here", or: "or", browse: "Browse Files",
    convert: "Convert Now", processing: "Processing...", cancel: "Cancel", options: "Conversion Options",
    pageSize: "Page Size", orientation: "Orientation", margins: "Margins", customMargins: "Custom Margins (mm)",
    scaling: "Scaling", quality: "Quality", dpi: "Image DPI", compression: "Compression", colorMode: "Color Mode",
    password: "Password Protection", passwordConfirm: "Confirm Password", permissions: "Permissions",
    allowPrint: "Allow Printing", allowCopy: "Allow Copying", allowModify: "Allow Modifying",
    watermark: "Watermark Text", watermarkColor: "Watermark Color", watermarkFontSize: "Watermark Font Size",
    watermarkOpacity: "Watermark Opacity (%)", watermarkRotation: "Rotation (°)", watermarkPosition: "Position",
    merge: "Merge all files", split: "Split pages (range)", compress: "Compress to target size",
    compressSize: "Target Size", compressUnit: "Unit", share: "Share Link", email: "Email Result",
    history: "History", clearHistory: "Clear History", darkMode: "Dark Mode", language: "Language",
    success: "Conversion successful! Opening Editor...", error: "Something went wrong.",
    invalidType: "Invalid file type. Only .doc and .docx allowed.", advanced: "Advanced Options",
    basic: "Basic Options", addMore: "Add More Files", selectedCount: "Selected"
  },
  hi: {
    select: "फ़ाइल चुनें", drag: "अपनी फ़ाइलें यहाँ खींचें और छोड़ें", or: "या", browse: "फ़ाइलें ब्राउज़ करें",
    convert: "अभी कन्वर्ट करें", processing: "प्रोसेस हो रहा है...", cancel: "रद्द करें", options: "कन्वर्शन विकल्प",
    pageSize: "पेज साइज़", orientation: "ओरिएंटेशन", margins: "मार्जिन", customMargins: "कस्टम मार्जिन (mm)",
    scaling: "स्केलिंग", quality: "गुणवत्ता", dpi: "इमेज DPI", compression: "संपीड़न", colorMode: "रंग मोड",
    password: "पासवर्ड सुरक्षा", passwordConfirm: "पासवर्ड की पुष्टि करें", permissions: "अनुमतियाँ",
    allowPrint: "प्रिंटिंग की अनुमति दें", allowCopy: "कॉपी करने की अनुमति दें", allowModify: "संशोधन की अनुमति दें",
    watermark: "वॉटरमार्क टेक्स्ट", watermarkColor: "वॉटरमार्क रंग", watermarkFontSize: "वॉटरमार्क फ़ॉन्ट साइज़",
    watermarkOpacity: "वॉटरमार्क अपारदर्शिता (%)", watermarkRotation: "रोटेशन (°)", watermarkPosition: "स्थिति",
    merge: "सभी फ़ाइलें मर्ज करें", split: "पेज विभाजित करें (रेंज)", compress: "टारगेट साइज़ में कंप्रेस करें",
    compressSize: "टारगेट साइज़", compressUnit: "इकाई", share: "लिंक साझा करें", email: "ईमेल पर भेजें",
    history: "इतिहास", clearHistory: "इतिहास साफ़ करें", darkMode: "डार्क मोड", language: "भाषा",
    success: "कन्वर्शन सफल! एडिटर खुल रहा है...", error: "कुछ गड़बड़ हुई।",
    invalidType: "अमान्य फ़ाइल प्रकार। केवल .doc और .docx की अनुमति है।", advanced: "उन्नत विकल्प",
    basic: "मूल विकल्प", addMore: "और फ़ाइलें जोड़ें", selectedCount: "चयनित"
  }
};

export default function WordToPdf() {
  // --- 1. Original Word to PDF States ---
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    pageSize: 'A4', orientation: 'portrait', margins: 'normal',
    customMargins: { top: 20, bottom: 20, left: 20, right: 20 },
    scaling: '100', quality: 'high', dpi: '300', compression: 'medium', colorMode: 'rgb',
    password: '', passwordConfirm: '', permissions: { print: true, copy: true, modify: true },
    watermark: '', watermarkColor: '#000000', watermarkFontSize: '24', watermarkOpacity: 50,
    watermarkRotation: 45, watermarkPosition: 'center', merge: false, splitRange: '',
    splitByBookmark: false, compress: false, compressSize: '500', compressUnit: 'KB'
  });
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // --- 2. Post-Conversion Editor States ---
  const [previewMode, setPreviewMode] = useState(false);
  const [convertedPdfUrl, setConvertedPdfUrl] = useState(null); 
  const [originalPdfBuffer, setOriginalPdfBuffer] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.0);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  const [elements, setElements] = useState([]);
  const [toolColor, setToolColor] = useState('#E5322D');
  const [textSize, setTextSize] = useState(16);
  const [isExporting, setIsExporting] = useState(false);
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);

  const t = translations[lang];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- File Upload Handlers ---
  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['doc', 'docx'].includes(ext)) {
      showToast(t.invalidType, 'error');
      return false;
    }
    return true;
  };

  const addFiles = (newFiles) => {
    const valid = [];
    for (const f of newFiles) {
      if (validateFile(f)) valid.push(f);
    }
    if (valid.length) {
      setFiles(prev => [...prev, ...valid]);
      setShareLink('');
      setPreviewMode(false);
      setConvertedPdfUrl(null);
      setOriginalPdfBuffer(null);
      setElements([]);
    }
  };

  const handleFileChange = (e) => { addFiles(Array.from(e.target.files)); e.target.value = ''; };
  const handleDrop = (e) => { e.preventDefault(); dragCounter.current = 0; addFiles(Array.from(e.dataTransfer.files)); };
  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));
  const clearAll = () => { setFiles([]); setShareLink(''); setPreviewMode(false); setConvertedPdfUrl(null); setElements([]); };

  const moveFile = (fromIndex, toIndex) => {
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
  };

  // --- API CONVERSION ---
  const processFiles = async () => {
    if (!files.length) return;
    if (options.password && options.password !== options.passwordConfirm) {
      showToast("Passwords do not match!", 'error');
      return;
    }
    setIsConverting(true);
    setProgress(0);
    setShareLink('');
    setPreviewMode(false);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => (prev >= 90 ? prev : prev + 5));
      }, 300);

      const uploadedUrls = [];
      for (const file of files) {
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
        uploadedUrls.push(blob.url);
      }

      const body = { action: ACTION_NAME, fileUrls: uploadedUrls, options, merge: options.merge };
      const response = await fetch('/api/master-convert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await response.json();

      if (response.ok && (data.downloadUrl || data.downloadUrls)) {
        let finalUrl = data.downloadUrl || (data.downloadUrls && data.downloadUrls[0]);
        
        // Fix for Blank Screen: Fetch the PDF from URL, create a local Blob URL
        try {
          const pdfResponse = await fetch(finalUrl);
          const arrayBuffer = await pdfResponse.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const localUrl = URL.createObjectURL(blob);
          
          setOriginalPdfBuffer(arrayBuffer); // Save for pdf-lib export later
          setConvertedPdfUrl(localUrl); // Use local URL for react-pdf
          setShareLink(finalUrl); // Keep real URL for sharing
          setPreviewMode(true);
          
          const newEntry = { time: new Date().toLocaleString(), files: files.map(f => f.name), url: finalUrl };
          setHistory(prev => [newEntry, ...prev].slice(0, 10));
          showToast(t.success, 'success');
        } catch (fetchErr) {
          console.error("Failed to load PDF preview securely:", fetchErr);
          showToast("Conversion successful but preview blocked. You can download.", "info");
          setShareLink(finalUrl);
        }
      } else {
        throw new Error(data.error || 'Conversion failed');
      }
      clearInterval(progressInterval);
      setProgress(100);
    } catch (error) {
      console.error(error);
      showToast(t.error, 'error');
    } finally {
      setIsConverting(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const cancelConversion = () => { setIsConverting(false); setProgress(0); showToast('Conversion cancelled', 'info'); };

  // --- EDITOR / PREVIEW FUNCTIONS ---
  const onDocumentLoadSuccess = ({ numPages }) => { setNumPages(numPages); setCurrentPage(1); };

  const addEditorElement = (type) => {
    const newElement = {
      id: Date.now(), type, page: currentPage, 
      x: 50, y: 100, 
      width: type === 'text' ? 200 : 150, 
      height: type === 'text' ? 40 : 100, 
      value: type === 'text' ? 'Type text here...' : '', 
      color: toolColor, size: textSize
    };
    if (type === 'highlight') newElement.color = '#FDE047'; 
    if (type === 'redact') newElement.color = '#000000'; 
    setElements([...elements, newElement]);
  };

  const handleEditorImageUpload = (e) => {
    const imgFile = e.target.files[0];
    if (imgFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newElement = { id: Date.now(), type: 'image', page: currentPage, x: 50, y: 100, width: 150, height: 150, imgData: ev.target.result };
        setElements([...elements, newElement]);
      };
      reader.readAsDataURL(imgFile);
    }
    e.target.value = '';
  };

  // Drawing Logic
  const startDrawing = (e) => { const { offsetX, offsetY } = e.nativeEvent; const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(offsetX, offsetY); setIsDrawing(true); };
  const draw = (e) => { if (!isDrawing) return; const { offsetX, offsetY } = e.nativeEvent; const ctx = canvasRef.current.getContext('2d'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = toolColor; ctx.lineTo(offsetX, offsetY); ctx.stroke(); };
  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => { if(!canvasRef.current) return; const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); };
  const saveDraw = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const newElement = { id: Date.now(), type: 'draw', page: currentPage, x: 50, y: 100, width: 200, height: 100, imgData: dataUrl };
      setElements([...elements, newElement]);
      setShowDrawModal(false);
    }
  };

  const updateElement = (id, newProps) => setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  const deleteElement = (id) => setElements(elements.filter(el => el.id !== id));

  const exportEditedPdf = async () => {
    if (!originalPdfBuffer) return;
    setIsExporting(true);
    try {
      let pdfDoc = await PDFDocument.load(originalPdfBuffer, { ignoreEncryption: true });
      
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? rgb(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255) : rgb(0,0,0);
      };

      for (const el of elements) {
        if (el.page > pdfDoc.getPageCount()) continue;
        const page = pdfDoc.getPages()[el.page - 1];
        const { height: pdfHeight } = page.getSize();
        
        const scaleX = pdfDimensions.width ? page.getSize().width / (pdfDimensions.width / zoom) : 1;
        const scaleY = pdfDimensions.height ? pdfHeight / (pdfDimensions.height / zoom) : 1;
        
        const actualX = el.x * scaleX;
        const actualW = el.width * scaleX;
        const actualH = el.height * scaleY;
        const actualY = pdfHeight - (el.y * scaleY) - actualH;

        if (el.type === 'text') {
          page.drawText(el.value, { x: actualX + 5, y: actualY + (actualH/2) - (el.size * scaleX)/2, size: el.size * scaleX, font: helveticaFont, color: hexToRgb(el.color) });
        } 
        else if (el.type === 'image' || el.type === 'draw') {
          const imgBytes = await fetch(el.imgData).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pdfImage, { x: actualX, y: actualY, width: actualW, height: actualH });
        }
        else if (el.type === 'highlight') {
          page.drawRectangle({ x: actualX, y: actualY, width: actualW, height: actualH, color: rgb(1, 0.9, 0.2), opacity: 0.5 });
        }
        else if (el.type === 'redact') {
          page.drawRectangle({ x: actualX, y: actualY, width: actualW, height: actualH, color: rgb(0, 0, 0), opacity: 1 });
        }
        else if (el.type === 'rect') {
          page.drawRectangle({ x: actualX, y: actualY, width: actualW, height: actualH, borderColor: hexToRgb(el.color), borderWidth: 2, opacity: 0 });
        }
        else if (el.type === 'circle') {
          page.drawEllipse({ x: actualX + actualW/2, y: actualY + actualH/2, xScale: actualW/2, yScale: actualH/2, borderColor: hexToRgb(el.color), borderWidth: 2, opacity: 0 });
        }
      }

      pdfDoc.setAuthor('MasterPdf User');
      pdfDoc.setCreator('MasterPdf Engine');
      const finalPdfBytes = await pdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Edited.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      showToast("Exported Successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Export failed.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  // --- HISTORY & MISC HANDLERS ---
  useEffect(() => { const saved = localStorage.getItem('masterpdf_history'); if (saved) setHistory(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem('masterpdf_history', JSON.stringify(history)); }, [history]);
  const clearHistory = () => { setHistory([]); localStorage.removeItem('masterpdf_history'); };
  const downloadFromHistory = (url) => { window.open(url, '_blank'); };
  const handleCloud = (p) => showToast(`${p} integration coming soon!`, 'info');
  const handleEmail = () => { const email = prompt('Enter your email address:'); if (email) showToast(`Result will be sent to ${email}`, 'info'); };
  const handleShare = async () => { if (shareLink) { try { await navigator.clipboard.writeText(shareLink); showToast('Link copied!', 'success'); } catch { showToast('Copy failed', 'error'); } }};

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>Convert Word to PDF | MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col pt-[72px] h-[calc(100vh-72px)] w-full relative">
        
        {/* VIEW 1: UPLOAD AND OPTIONS (Shows until conversion is done) */}
        {!previewMode && (
          <div className="flex flex-col p-4 sm:p-6 w-full max-w-[1600px] mx-auto overflow-y-auto custom-scrollbar h-full">
            <div className="text-center mb-6 shrink-0">
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{TOOL_TITLE}</h1>
              <p className="text-base sm:text-lg opacity-80">{TOOL_DESC}</p>
            </div>

            <div className="flex justify-end mb-4 gap-2 shrink-0">
              <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow">
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 rounded-lg border bg-white dark:bg-gray-800 outline-none">
                <option value="en">English</option><option value="hi">हिन्दी</option>
              </select>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 flex-grow min-h-0">
              
              {/* LEFT SIDEBAR: Full Options */}
              <div className={`lg:w-80 w-full p-4 rounded-2xl border shadow-sm flex flex-col overflow-y-auto custom-scrollbar ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 shrink-0"><SlidersHorizontal size={18} /> {t.options}</h3>
                
                <div className="space-y-4 shrink-0">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.pageSize}</label>
                    <select value={options.pageSize} onChange={e => setOptions({ ...options, pageSize: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none">
                      <option value="A4">A4</option><option value="A3">A3</option><option value="A5">A5</option><option value="Letter">Letter</option><option value="Legal">Legal</option><option value="Tabloid">Tabloid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.orientation}</label>
                    <select value={options.orientation} onChange={e => setOptions({ ...options, orientation: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none">
                      <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.margins}</label>
                    <select value={options.margins} onChange={e => setOptions({ ...options, margins: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none">
                      <option value="normal">Normal</option><option value="narrow">Narrow</option><option value="wide">Wide</option><option value="custom">Custom</option>
                    </select>
                  </div>
                  {options.margins === 'custom' && (
                    <div className="grid grid-cols-2 gap-2">
                      <input type="number" placeholder="Top" value={options.customMargins.top} onChange={e => setOptions({ ...options, customMargins: { ...options.customMargins, top: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900 outline-none" />
                      <input type="number" placeholder="Bottom" value={options.customMargins.bottom} onChange={e => setOptions({ ...options, customMargins: { ...options.customMargins, bottom: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900 outline-none" />
                      <input type="number" placeholder="Left" value={options.customMargins.left} onChange={e => setOptions({ ...options, customMargins: { ...options.customMargins, left: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900 outline-none" />
                      <input type="number" placeholder="Right" value={options.customMargins.right} onChange={e => setOptions({ ...options, customMargins: { ...options.customMargins, right: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900 outline-none" />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.scaling}</label>
                    <select value={options.scaling} onChange={e => setOptions({ ...options, scaling: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none">
                      <option value="100">100%</option><option value="110">110%</option><option value="90">90%</option><option value="75">75%</option><option value="50">50%</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.quality}</label>
                    <select value={options.quality} onChange={e => setOptions({ ...options, quality: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none">
                      <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold shrink-0">
                  {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />} {showAdvanced ? t.basic : t.advanced}
                </button>

                {showAdvanced && (
                  <div className="mt-4 space-y-4 shrink-0">
                    <div><label className="block text-sm font-medium mb-1">{t.dpi}</label><select value={options.dpi} onChange={e => setOptions({ ...options, dpi: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none"><option value="72">72 DPI</option><option value="150">150 DPI</option><option value="300">300 DPI</option><option value="600">600 DPI</option></select></div>
                    <div><label className="block text-sm font-medium mb-1">{t.compression}</label><select value={options.compression} onChange={e => setOptions({ ...options, compression: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none"><option value="low">Low (Best quality)</option><option value="medium">Medium</option><option value="high">High (Smallest size)</option></select></div>
                    <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><Lock size={14} /> {t.password}</label><input type="password" value={options.password} onChange={e => setOptions({ ...options, password: e.target.value })} placeholder="Enter password" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none" /></div>
                    <div><label className="block text-sm font-medium mb-1">{t.passwordConfirm}</label><input type="password" value={options.passwordConfirm} onChange={e => setOptions({ ...options, passwordConfirm: e.target.value })} placeholder="Confirm password" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none" /></div>
                    
                    {/* Permissions */}
                    <div>
                      <label className="block text-sm font-medium mb-2">{t.permissions}</label>
                      <div className="space-y-2">
                        <label className="flex items-center gap-2"><input type="checkbox" checked={options.permissions.print} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, print: e.target.checked } })} /> {t.allowPrint}</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={options.permissions.copy} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, copy: e.target.checked } })} /> {t.allowCopy}</label>
                        <label className="flex items-center gap-2"><input type="checkbox" checked={options.permissions.modify} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, modify: e.target.checked } })} /> {t.allowModify}</label>
                      </div>
                    </div>

                    {/* Watermark */}
                    <div><label className="block text-sm font-medium mb-1">{t.watermark}</label><input type="text" value={options.watermark} onChange={e => setOptions({ ...options, watermark: e.target.value })} placeholder="Your watermark" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><Palette size={14} /> {t.watermarkColor}</label><input type="color" value={options.watermarkColor} onChange={e => setOptions({ ...options, watermarkColor: e.target.value })} className="w-full p-1 border rounded-lg bg-white dark:bg-gray-900 h-10" /></div>
                      <div><label className="block text-sm font-medium mb-1 flex items-center gap-1"><Type size={14} /> {t.watermarkFontSize}</label><input type="number" min="1" max="100" value={options.watermarkFontSize} onChange={e => setOptions({ ...options, watermarkFontSize: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none" /></div>
                      <div><label className="block text-sm font-medium mb-1">{t.watermarkOpacity}</label><input type="number" min="0" max="100" value={options.watermarkOpacity} onChange={e => setOptions({ ...options, watermarkOpacity: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none" /></div>
                      <div><label className="block text-sm font-medium mb-1">{t.watermarkRotation}</label><input type="number" value={options.watermarkRotation} onChange={e => setOptions({ ...options, watermarkRotation: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none" /></div>
                    </div>
                    <div><label className="block text-sm font-medium mb-1">{t.watermarkPosition}</label><select value={options.watermarkPosition} onChange={e => setOptions({ ...options, watermarkPosition: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900 outline-none"><option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option><option value="diagonal">Diagonal</option></select></div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={options.compress} onChange={e => setOptions({ ...options, compress: e.target.checked })} /> {t.compress}</label>
                      {options.compress && (
                        <div className="flex gap-2 mt-2">
                          <input type="number" min="1" placeholder={t.compressSize} value={options.compressSize} onChange={e => setOptions({ ...options, compressSize: e.target.value })} className="p-2 border rounded bg-white dark:bg-gray-900 flex-1 outline-none" />
                          <select value={options.compressUnit} onChange={e => setOptions({ ...options, compressUnit: e.target.value })} className="p-2 border rounded bg-white dark:bg-gray-900 outline-none"><option value="KB">KB</option><option value="MB">MB</option></select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="mt-6 space-y-3 pb-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
                  <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={options.merge} onChange={e => setOptions({ ...options, merge: e.target.checked })} /> <Combine size={16} /> {t.merge}</label>
                  <div className="flex items-center gap-2"><Split size={16} /><input type="text" placeholder={t.split} value={options.splitRange} onChange={e => setOptions({ ...options, splitRange: e.target.value })} className="p-2 border rounded bg-white dark:bg-gray-900 text-sm w-full outline-none" /></div>
                </div>
              </div>

              {/* CENTER: Upload Box & File List */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className={`rounded-2xl shadow-sm border p-6 flex flex-col h-full overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  
                  {files.length === 0 ? (
                    <div onDragEnter={handleDragEnter} onDragOver={e => e.preventDefault()} onDragLeave={handleDragLeave} onDrop={handleDrop} className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-4 transition min-h-[300px] ${darkMode ? 'border-gray-600 hover:border-blue-400 bg-gray-900' : 'border-gray-300 hover:border-blue-500 bg-gray-50'}`}>
                      <input type="file" id="file-upload" accept={ACCEPT_FORMAT} onChange={handleFileChange} multiple className="hidden" ref={fileInputRef} />
                      <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <UploadCloud size={60} className="text-blue-500 mb-2" />
                        <span className="text-xl font-bold">{t.drag}</span>
                        <span className="text-sm opacity-60 mt-1 mb-4">{t.or}</span>
                        <span className="bg-[#E5322D] text-white px-8 py-2 rounded-lg font-bold shadow hover:bg-red-700">Browse Word Files</span>
                      </label>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col h-full">
                      <div className="flex justify-between items-center mb-4 shrink-0">
                        <h3 className="font-bold text-lg">{files.length} {t.selectedCount}</h3>
                        <div className="flex gap-2">
                          <button onClick={() => fileInputRef.current.click()} className="text-sm bg-blue-100 text-blue-600 px-3 py-1 rounded font-bold hover:bg-blue-200 flex items-center gap-1"><Plus size={14}/> Add More</button>
                          <button onClick={clearAll} className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded font-bold hover:bg-red-200 flex items-center gap-1"><Trash2 size={14}/> Clear All</button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 overflow-y-auto flex-grow custom-scrollbar pr-2 mb-4">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shrink-0">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="flex flex-col gap-1 shrink-0">
                                <button onClick={() => moveFile(idx, idx - 1)} disabled={idx === 0} className="text-gray-400 hover:text-blue-500 disabled:opacity-30"><ChevronUp size={14}/></button>
                                <button onClick={() => moveFile(idx, idx + 1)} disabled={idx === files.length - 1} className="text-gray-400 hover:text-blue-500 disabled:opacity-30"><ChevronDown size={14}/></button>
                              </div>
                              <FileText size={24} className="text-blue-600 shrink-0"/>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{file.name}</p>
                                <p className="text-xs text-gray-500">{(file.size/1024/1024).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <button onClick={() => removeFile(idx)} className="text-gray-400 hover:text-red-500 p-2 shrink-0"><X size={18}/></button>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
                        {!isConverting ? (
                          <button onClick={processFiles} className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700">
                            {t.convert} <ArrowRight size={24} />
                          </button>
                        ) : (
                          <>
                            <button onClick={cancelConversion} className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-gray-300 hover:bg-gray-400 text-gray-800">{t.cancel}</button>
                            <div className="flex-1 flex flex-col items-center justify-center">
                              <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div></div>
                              <span className="text-sm mt-1 font-bold">{progress}%</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* History Section (Visible only when not in preview) */}
                {history.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold flex items-center gap-2"><History size={18} /> {t.history}</h4>
                      <button onClick={clearHistory} className="text-red-500 text-sm hover:underline">{t.clearHistory}</button>
                    </div>
                    <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {history.map((item, idx) => (
                        <li key={idx} className={`flex justify-between items-center text-sm p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <div className="flex flex-col min-w-0 pr-4">
                            <span className="font-bold truncate">{item.files.join(', ')}</span>
                            <span className="opacity-50 text-[10px]">{item.time}</span>
                          </div>
                          <button onClick={() => downloadFromHistory(item.url)} className="text-blue-500 hover:underline flex items-center gap-1 font-bold shrink-0">
                            <Download size={14} /> Download
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: FULL PDF EDITOR (Shows after conversion) */}
        {previewMode && convertedPdfUrl && (
          <div className="flex-grow flex flex-col bg-white overflow-hidden animate-in fade-in h-full z-50">
            
            {/* Top Toolbar (Exact Editor UI) */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 w-full shadow-sm overflow-x-auto custom-scrollbar">
               <div className="flex items-center gap-2 min-w-max">
                 <button onClick={() => addEditorElement('text')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition"><Type size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Text</span></button>
                 <div className="relative">
                   <input type="file" id="img-upload-tool" accept="image/*" onChange={handleEditorImageUpload} className="hidden" />
                   <button onClick={() => document.getElementById('img-upload-tool').click()} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition"><ImageIcon size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Image</span></button>
                 </div>
                 <button onClick={() => setShowDrawModal(true)} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition"><PenTool size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Draw</span></button>
                 <div className="w-px h-6 bg-gray-300 mx-1"></div>
                 <button onClick={() => addEditorElement('highlight')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition"><Highlighter size={18} className="text-yellow-500"/> <span className="text-xs font-bold hidden xl:block">Highlight</span></button>
                 <button onClick={() => addEditorElement('redact')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition"><Square size={18} className="text-black fill-black"/> <span className="text-xs font-bold hidden xl:block">Redact</span></button>
                 <div className="w-px h-6 bg-gray-300 mx-1"></div>
                 <button onClick={() => addEditorElement('rect')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition"><Square size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden xl:block">Shape</span></button>
                 <button onClick={() => addEditorElement('circle')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition"><Circle size={18} className="text-[#E5322D]"/></button>
               </div>

               <div className="flex items-center gap-3 shrink-0 ml-4">
                 {/* Post-conversion actions directly in editor toolbar */}
                 <div className="hidden lg:flex items-center gap-2 mr-2">
                   <button onClick={handleShare} className="text-gray-600 hover:text-blue-600 p-1"><Share2 size={16}/></button>
                   <button onClick={handleEmail} className="text-gray-600 hover:text-green-600 p-1"><Mail size={16}/></button>
                   <button onClick={() => handleCloud('Google Drive')} className="text-gray-600 hover:text-yellow-600 p-1"><Cloud size={16}/></button>
                 </div>

                 <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded p-1">
                   <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-1 hover:bg-white rounded text-gray-600"><ZoomOut size={14}/></button>
                   <span className="text-[10px] font-bold text-gray-700 w-8 text-center">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 hover:bg-white rounded text-gray-600"><ZoomIn size={14}/></button>
                 </div>
                 
                 <button onClick={exportEditedPdf} disabled={isExporting} className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-lg shadow transition flex items-center gap-2 text-sm">
                   {isExporting ? <Settings className="animate-spin" size={14}/> : <Save size={14}/>} <span className="hidden sm:block">Export PDF</span>
                 </button>
                 <button onClick={() => { setPreviewMode(false); setConvertedPdfUrl(null); clearAll(); }} className="text-gray-400 hover:text-red-500 ml-2" title="Close Editor"><X size={20}/></button>
               </div>
            </div>

            <div className="flex-grow flex flex-row overflow-hidden bg-[#E4E4E4] relative">
              
              {/* Left Mini Pages */}
              <div className="w-40 lg:w-48 bg-gray-100 border-r border-gray-300 p-4 flex flex-col items-center gap-4 overflow-y-auto shrink-0 z-10 custom-scrollbar shadow-[2px_0_5px_rgba(0,0,0,0.05)] hidden lg:flex">
                 <Document file={convertedPdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="text-xs text-gray-500 font-bold">Loading...</div>}>
                   {Array.from({ length: numPages || 0 }, (_, i) => (
                     <div key={i} onClick={() => setCurrentPage(i + 1)} className="flex flex-col items-center mb-4 cursor-pointer group">
                       <div className={`border-2 p-1 bg-white shadow-sm transition-all ${currentPage === i + 1 ? 'border-[#E5322D] scale-105 shadow-md' : 'border-transparent group-hover:border-gray-300'}`}>
                         <Page pageNumber={i + 1} width={100} renderTextLayer={false} renderAnnotationLayer={false} />
                       </div>
                       <span className={`text-xs font-bold mt-2 ${currentPage === i + 1 ? 'text-[#E5322D]' : 'text-gray-500'}`}>{i + 1}</span>
                     </div>
                   ))}
                 </Document>
              </div>

              {/* Center Bada Page Viewer */}
              <div className="flex-grow flex flex-col relative min-w-0">
                 {/* Floating Page Nav */}
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-full flex items-center gap-4 shadow-lg z-30">
                   <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="hover:text-[#E5322D]"><ChevronLeft size={20}/></button>
                   <span className="text-xs font-bold w-20 text-center">Page {currentPage}/{numPages}</span>
                   <button onClick={() => setCurrentPage(p => Math.min(numPages || 1, p + 1))} className="hover:text-[#E5322D]"><ChevronRight size={20}/></button>
                 </div>

                 <div className="flex-grow overflow-y-auto p-4 lg:p-8 flex flex-col items-center custom-scrollbar pb-24">
                   <div className="relative shadow-2xl bg-white select-none">
                     <Document file={convertedPdfUrl} loading={<div className="p-10 font-bold text-gray-500">Rendering Document...</div>}>
                       <Page 
                         pageNumber={currentPage} 
                         scale={zoom} 
                         renderTextLayer={false} 
                         renderAnnotationLayer={false} 
                         onLoadSuccess={(pageInfo) => {
                            setPdfDimensions(prev => {
                              if(prev.width !== pageInfo.width || prev.height !== pageInfo.height) { return { width: pageInfo.width, height: pageInfo.height }; }
                              return prev;
                            });
                         }} 
                       />
                     </Document>

                     {/* RND Elements Mapping for Edits */}
                     {elements.filter(el => el.page === currentPage).map((el) => (
                       <Rnd
                         key={el.id} bounds="parent" position={{ x: el.x, y: el.y }} size={{ width: el.width, height: el.height }}
                         onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                         onResizeStop={(e, dir, ref, delta, position) => { updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...position }); }}
                         className={`group absolute z-20 touch-none ${
                           el.type === 'highlight' ? 'bg-yellow-300/50' :
                           el.type === 'redact' ? 'bg-black' :
                           el.type === 'rect' ? 'border-2' :
                           el.type === 'circle' ? 'border-2 rounded-full' :
                           'border-2 border-transparent hover:border-gray-400 focus-within:border-[#E5322D] border-dashed bg-white/10'
                         }`}
                         style={{ borderColor: (el.type === 'rect' || el.type === 'circle') ? el.color : undefined }}
                       >
                         <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 text-gray-500 rounded-full p-1 text-xs hover:text-[#E5322D] opacity-0 group-hover:opacity-100 shadow-sm z-30"><X size={14} /></button>
                         {el.type === 'image' || el.type === 'draw' ? ( <img src={el.imgData} alt="Element" className="w-full h-full object-fill pointer-events-none" /> ) : el.type === 'text' ? ( <textarea value={el.value} onChange={(e) => updateElement(el.id, { value: e.target.value })} className="w-full h-full bg-transparent outline-none font-bold resize-none" style={{ fontSize: `${el.size * (zoom/1.5)}px`, color: el.color }} /> ) : null}
                       </Rnd>
                     ))}
                   </div>
                 </div>
              </div>

              {/* Right Sidebar: Properties */}
              <div className="w-full lg:w-[280px] bg-white flex flex-col h-full shrink-0 shadow-[-5px_0_15px_rgba(0,0,0,0.05)] z-20 hidden lg:flex">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-bold text-gray-800">Properties</h3>
                </div>
                <div className="p-4 overflow-y-auto flex-grow custom-scrollbar">
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Palette size={16} className="text-[#E5322D]"/> Tool Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {['#E5322D', '#000000', '#1F2937', '#1E3A8A', '#065F46', '#D97706'].map(c => (
                        <button key={c} onClick={() => setToolColor(c)} style={{backgroundColor: c}} className={`w-8 h-8 rounded-full transition-transform ${toolColor === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400 shadow-md' : 'hover:scale-105 shadow-sm'}`} />
                      ))}
                    </div>
                  </div>
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Type size={16} className="text-[#E5322D]"/> Text Size</h4>
                    <input type="range" min="10" max="72" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full accent-[#E5322D]" />
                    <div className="text-right text-xs font-bold text-gray-500 mt-1">{textSize}px</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* DRAW MODAL */}
      {showDrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-800">Freehand Draw</h3>
              <button onClick={() => setShowDrawModal(false)} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className="w-full h-48 bg-white border border-gray-300 rounded-lg cursor-crosshair shadow-inner touch-none" width={400} height={200} />
              <div className="flex justify-between w-full mt-3">
                <button onClick={clearCanvas} className="text-sm font-bold text-gray-500 hover:text-[#E5322D]">Clear</button>
                <button onClick={saveDraw} className="bg-[#E5322D] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">Add to PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
      {toast && <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white font-bold z-[100] ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>{toast.message}</div>}
    </div>
  );
}
