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
  // --- WORD TO PDF STATES ---
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

  // --- EDITOR PREVIEW STATES ---
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

  // --- FILE HANDLERS ---
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
  
  const clearAll = () => { 
    setFiles([]); setShareLink(''); setPreviewMode(false); 
    setConvertedPdfUrl(null); setOriginalPdfBuffer(null); setElements([]); 
  };

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

      // 🔥 FIX FOR ConvertAPI CRASH (Code: 4000)
      // ConvertAPI does not support "diagonal", so we map it to "center" and 45 degree rotation.
      const apiWatermarkPosition = options.watermarkPosition === 'diagonal' ? 'center' : options.watermarkPosition;
      const apiWatermarkRotation = options.watermarkPosition === 'diagonal' ? 45 : options.watermarkRotation;

      const apiOptions = {
        ...options,
        watermarkPosition: apiWatermarkPosition,
        watermarkRotation: apiWatermarkRotation
      };

      const body = { action: ACTION_NAME, fileUrls: uploadedUrls, options: apiOptions, merge: options.merge };
      
      const response = await fetch('/api/master-convert', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      const data = await response.json();

      if (response.ok && (data.downloadUrl || data.downloadUrls)) {
        let finalUrl = data.downloadUrl || (data.downloadUrls && data.downloadUrls[0]);
        
        // Blank Screen Fix: Fetch the PDF to a Blob Buffer so react-pdf can read it instantly
        try {
          const pdfResponse = await fetch(finalUrl);
          const arrayBuffer = await pdfResponse.arrayBuffer();
          const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
          const localUrl = URL.createObjectURL(blob);
          
          setOriginalPdfBuffer(arrayBuffer); 
          setConvertedPdfUrl(localUrl); 
          setShareLink(finalUrl); 
          setPreviewMode(true); 
          
          const newEntry = { time: new Date().toLocaleString(), files: files.map(f => f.name), url: finalUrl };
          setHistory(prev => [newEntry, ...prev].slice(0, 10));
          showToast(t.success, 'success');
        } catch (fetchErr) {
          console.error("PDF Preview blocked by browser security:", fetchErr);
          showToast("Conversion successful but preview blocked. You can download the file.", "info");
          setShareLink(finalUrl);
          window.open(finalUrl, '_blank');
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

  // --- EDITOR FUNCTIONS ---
  const onDocumentLoadSuccess = ({ numPages }) => { setNumPages(numPages); setCurrentPage(1); };

  const addEditorElement = (type) => {
    const newElement = {
      id: Date.now(), type, page: currentPage, x: 50, y: 100, 
      width: type === 'text' ? 200 : 150, height: type === 'text' ? 40 : 100, 
      value: type === 'text' ? 'Type text here...' : '', color: toolColor, size: textSize
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
        setElements([...elements, { id: Date.now(), type: 'image', page: currentPage, x: 50, y: 100, width: 150, height: 150, imgData: ev.target.result }]);
      };
      reader.readAsDataURL(imgFile);
    }
    e.target.value = '';
  };

  const startDrawing = (e) => { const { offsetX, offsetY } = e.nativeEvent; const ctx = canvasRef.current.getContext('2d'); ctx.beginPath(); ctx.moveTo(offsetX, offsetY); setIsDrawing(true); };
  const draw = (e) => { if (!isDrawing) return; const { offsetX, offsetY } = e.nativeEvent; const ctx = canvasRef.current.getContext('2d'); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = toolColor; ctx.lineTo(offsetX, offsetY); ctx.stroke(); };
  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => { if(!canvasRef.current) return; const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); };
  const saveDraw = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setElements([...elements, { id: Date.now(), type: 'draw', page: currentPage, x: 50, y: 100, width: 200, height: 100, imgData: dataUrl }]);
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

  // --- HISTORY & MISC ---
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

      {!previewMode ? (
        /* =========================================================
           VIEW 1: ORIGINAL UPLOAD LAYOUT (Exact Code - No CSS changes)
           ========================================================= */
        <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
          <div className="text-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">{TOOL_TITLE}</h1>
            <p className="text-base sm:text-lg opacity-80">{TOOL_DESC}</p>
          </div>

          <div className="flex justify-end mb-4 gap-2 w-full max-w-7xl mx-auto">
            <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow" title={t.darkMode}>
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 rounded-lg border bg-white dark:bg-gray-800">
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
            </select>
          </div>

          <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
            {/* SIDEBAR - Options */}
            <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <SlidersHorizontal size={18} /> {t.options}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.pageSize}</label>
                  <select value={options.pageSize} onChange={(e) => setOptions({ ...options, pageSize: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                    <option value="A4">A4</option><option value="A3">A3</option><option value="A5">A5</option>
                    <option value="Letter">Letter</option><option value="Legal">Legal</option><option value="Tabloid">Tabloid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.orientation}</label>
                  <select value={options.orientation} onChange={(e) => setOptions({ ...options, orientation: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                    <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.margins}</label>
                  <select value={options.margins} onChange={(e) => setOptions({ ...options, margins: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                    <option value="normal">Normal</option><option value="narrow">Narrow</option><option value="wide">Wide</option><option value="custom">Custom</option>
                  </select>
                </div>
                {options.margins === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input type="number" placeholder="Top" value={options.customMargins.top} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, top: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                    <input type="number" placeholder="Bottom" value={options.customMargins.bottom} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, bottom: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                    <input type="number" placeholder="Left" value={options.customMargins.left} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, left: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                    <input type="number" placeholder="Right" value={options.customMargins.right} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, right: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.scaling}</label>
                  <select value={options.scaling} onChange={(e) => setOptions({ ...options, scaling: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                    <option value="100">100%</option><option value="110">110%</option><option value="90">90%</option><option value="75">75%</option><option value="50">50%</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.quality}</label>
                  <select value={options.quality} onChange={(e) => setOptions({ ...options, quality: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                    <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                  </select>
                </div>
              </div>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAdvanced ? t.basic : t.advanced}
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.dpi}</label>
                    <select value={options.dpi} onChange={(e) => setOptions({ ...options, dpi: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <option value="72">72 DPI</option><option value="150">150 DPI</option><option value="300">300 DPI</option><option value="600">600 DPI</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.compression}</label>
                    <select value={options.compression} onChange={(e) => setOptions({ ...options, compression: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <option value="low">Low (Best quality)</option><option value="medium">Medium</option><option value="high">High (Smallest size)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.colorMode}</label>
                    <select value={options.colorMode} onChange={(e) => setOptions({ ...options, colorMode: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <option value="rgb">RGB</option><option value="cmyk">CMYK</option><option value="grayscale">Grayscale</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Lock size={14} /> {t.password}</label>
                    <input type="password" value={options.password} onChange={(e) => setOptions({ ...options, password: e.target.value })} placeholder="Enter password" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.passwordConfirm}</label>
                    <input type="password" value={options.passwordConfirm} onChange={(e) => setOptions({ ...options, passwordConfirm: e.target.value })} placeholder="Confirm password" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{t.permissions}</label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2"><input type="checkbox" checked={options.permissions.print} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, print: e.target.checked } })} /> {t.allowPrint}</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={options.permissions.copy} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, copy: e.target.checked } })} /> {t.allowCopy}</label>
                      <label className="flex items-center gap-2"><input type="checkbox" checked={options.permissions.modify} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, modify: e.target.checked } })} /> {t.allowModify}</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">{t.watermark}</label>
                    <input type="text" value={options.watermark} onChange={(e) => setOptions({ ...options, watermark: e.target.value })} placeholder="Your watermark" className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Palette size={14} /> {t.watermarkColor}</label>
                    <input type="color" value={options.watermarkColor} onChange={(e) => setOptions({ ...options, watermarkColor: e.target.value })} className="w-full p-1 border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Type size={14} /> {t.watermarkFontSize}</label>
                    <input type="number" min="1" max="100" value={options.watermarkFontSize} onChange={(e) => setOptions({ ...options, watermarkFontSize: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.watermarkOpacity}</label>
                    <input type="number" min="0" max="100" value={options.watermarkOpacity} onChange={(e) => setOptions({ ...options, watermarkOpacity: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.watermarkRotation}</label>
                    <input type="number" value={options.watermarkRotation} onChange={(e) => setOptions({ ...options, watermarkRotation: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.watermarkPosition}</label>
                    <select value={options.watermarkPosition} onChange={(e) => setOptions({ ...options, watermarkPosition: e.target.value })} className="w-full p-2 border rounded-lg bg-white dark:bg-gray-900">
                      <option value="center">Center</option><option value="top">Top</option><option value="bottom">Bottom</option><option value="left">Left</option><option value="right">Right</option><option value="diagonal">Diagonal</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={options.compress} onChange={(e) => setOptions({ ...options, compress: e.target.checked })} /> {t.compress}
                    </label>
                    {options.compress && (
                      <div className="flex gap-2 mt-2">
                        <input type="number" min="1" placeholder={t.compressSize} value={options.compressSize} onChange={(e) => setOptions({ ...options, compressSize: e.target.value })} className="p-2 border rounded bg-white dark:bg-gray-900 flex-1" />
                        <select value={options.compressUnit} onChange={(e) => setOptions({ ...options, compressUnit: e.target.value })} className="p-2 border rounded bg-white dark:bg-gray-900">
                          <option value="KB">KB</option><option value="MB">MB</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={options.merge} onChange={(e) => setOptions({ ...options, merge: e.target.checked })} />
                  <Combine size={16} /> {t.merge}
                </label>
                <div className="flex items-center gap-2">
                  <Split size={16} />
                  <input type="text" placeholder={t.split} value={options.splitRange} onChange={(e) => setOptions({ ...options, splitRange: e.target.value })} className="p-2 border rounded bg-white dark:bg-gray-900 text-sm w-full" />
                </div>
              </div>
            </div>

            {/* MAIN AREA - File list & Upload */}
            <div className="flex-1">
              <div className={`rounded-2xl shadow-sm border p-6 min-h-[450px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                
                {/* Drag & Drop Area */}
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition flex flex-col items-center justify-center gap-4 min-h-[300px] ${darkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-500'} ${files.length ? 'hidden' : ''}`}
                >
                  <input type="file" id="file-upload" accept={ACCEPT_FORMAT} onChange={handleFileChange} multiple className="hidden" ref={fileInputRef} />
                  <label htmlFor="file-upload" className="cursor-pointer inline-flex flex-col items-center gap-3 w-full h-full">
                    <UploadCloud size={48} className="text-blue-500" />
                    <span className="text-lg font-semibold">{t.drag}</span>
                    <span className="text-sm opacity-70">{t.or}</span>
                    <span className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-red-700 transition">
                      {t.browse}
                    </span>
                  </label>
                  <p className="text-xs mt-3 opacity-60">No size limit</p>
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600">
                        <Plus size={18} />
                        <span>{files.length} {t.selectedCount}</span>
                      </button>
                      <button onClick={clearAll} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                        <Trash2 size={16} /> Clear All
                      </button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {files.map((file, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex flex-col">
                              <button onClick={() => moveFile(index, index - 1)} disabled={index === 0} className="text-gray-500 disabled:opacity-30">
                                <ChevronUp size={16} />
                              </button>
                              <button onClick={() => moveFile(index, index + 1)} disabled={index === files.length - 1} className="text-gray-500 disabled:opacity-30">
                                <ChevronDown size={16} />
                              </button>
                            </div>
                            <FileText size={24} className="text-[#E5322D]" />
                            <div className="flex-1">
                              <p className="font-semibold text-sm truncate max-w-[200px]">{file.name}</p>
                              <p className="text-xs opacity-60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500">
                            <X size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Convert Button */}
                    <div className="mt-6 flex flex-col sm:flex-row gap-4">
                      {!isConverting ? (
                        <button onClick={processFiles} className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700">
                          {t.convert} <ArrowRight size={24} />
                        </button>
                      ) : (
                        <>
                          <button onClick={cancelConversion} className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-gray-300 hover:bg-gray-400 text-gray-800">
                            {t.cancel}
                          </button>
                          <div className="flex-1 flex flex-col items-center justify-center">
                            <div className="w-full bg-gray-200 rounded-full h-4">
                              <div className="bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                            </div>
                            <span className="text-sm mt-1 font-bold">{progress}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* History Section Below Upload */}
              {history.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-bold flex items-center gap-2">
                      <History size={18} /> {t.history}
                    </h4>
                    <button onClick={clearHistory} className="text-red-500 text-sm hover:underline">
                      {t.clearHistory}
                    </button>
                  </div>
                  <ul className="space-y-2 max-h-40 overflow-y-auto">
                    {history.map((item, idx) => (
                      <li key={idx} className={`flex justify-between items-center text-sm p-2 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <span>{item.files.join(', ')} <span className="opacity-50">({item.time})</span></span>
                        <button onClick={() => downloadFromHistory(item.url)} className="text-blue-500 hover:underline flex items-center gap-1 font-bold">
                          <Download size={14} /> Download
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </main>
      ) : (

        /* =========================================================
           VIEW 2: FULL PDF EDITOR (Shows exactly like Edit PDF Workspace)
           ========================================================= */
        <main className="flex-grow flex flex-col pt-[72px] h-[calc(100vh-72px)] w-full bg-[#F5F5F7]">
          <div className="w-full h-full flex flex-col bg-white shadow-lg overflow-hidden animate-in fade-in">
            
            {/* Top Toolbar */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 w-full shadow-sm overflow-x-auto custom-scrollbar z-20">
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
                 <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded p-1">
                   <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-1 hover:bg-white rounded text-gray-600"><ZoomOut size={14}/></button>
                   <span className="text-[10px] font-bold text-gray-700 w-8 text-center">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 hover:bg-white rounded text-gray-600"><ZoomIn size={14}/></button>
                 </div>
                 <button onClick={exportEditedPdf} disabled={isExporting} className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-lg shadow transition flex items-center gap-2 text-sm">
                   {isExporting ? <Settings className="animate-spin" size={14}/> : <Save size={14}/>} <span className="hidden sm:block">Export</span>
                 </button>
                 <button onClick={clearAll} className="text-gray-400 hover:text-red-500 ml-2" title="Close Preview"><X size={20}/></button>
               </div>
            </div>

            <div className="flex-grow flex flex-row overflow-hidden relative bg-[#E4E4E4]">
              
              {/* Left Mini Pages */}
              <div className="w-40 lg:w-48 bg-gray-100 border-r border-gray-300 p-4 flex flex-col items-center gap-4 overflow-y-auto shrink-0 z-10 custom-scrollbar shadow-[2px_0_5px_rgba(0,0,0,0.05)] hidden lg:flex">
                 <Document file={convertedPdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="font-bold text-gray-500 text-sm">Loading...</div>}>
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

              {/* Center Bada Page */}
              <div className="flex-grow flex flex-col relative min-w-0">
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
        </main>
      )}

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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white font-bold z-[100] transition-opacity ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-blue-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
