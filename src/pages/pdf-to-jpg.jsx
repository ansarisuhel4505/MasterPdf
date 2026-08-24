import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  UploadCloud, FileText, X, ArrowRight, Settings, Trash2,
  Plus, ChevronDown, ChevronUp, History, Sun, Moon, Lock, Palette,
  Cloud, Mail, Share2, Download, SlidersHorizontal, Image as ImageIcon,
  CheckSquare, Square, Layers, Type, RotateCw, FlipHorizontal2
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const TOOL_TITLE = "PDF to JPG/PNG Converter";
const TOOL_DESC = "Convert PDF pages to high-quality JPG, PNG or JPEG images with advanced options.";
const ACTION_NAME = "pdf-to-image";
const ACCEPT_FORMAT = ".pdf";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// i18n Dictionary
const translations = {
  en: {
    drag: "Drag & drop PDF files here",
    or: "or",
    browse: "Browse Files",
    convert: "Convert to Images",
    processing: "Processing...",
    cancel: "Cancel",
    clearAll: "Clear All",
    options: "Conversion Options",
    advanced: "Advanced Options",
    basic: "Basic Options",
    outputFormat: "Output Format",
    resolution: "Resolution (DPI)",
    quality: "Quality (JPEG only)",
    colorspace: "Color Space",
    pageRange: "Select Pages",
    allPages: "All Pages",
    selectedPages: "Selected Pages",
    flipHorizontal: "Flip Horizontal",
    flipVertical: "Flip Vertical",
    rotate: "Rotate (90° increments)",
    brightness: "Brightness",
    contrast: "Contrast",
    gamma: "Gamma",
    trimWhite: "Trim White Margins",
    password: "Password (for protected PDFs)",
    merge: "Download as ZIP",
    share: "Share Link",
    email: "Email Result",
    history: "History",
    clearHistory: "Clear History",
    success: "Conversion successful!",
    error: "Something went wrong. Please try again.",
    invalidType: "Invalid file type. Only PDF allowed.",
    tooLarge: "File too large. Max size is 100 MB.",
    selectedCount: "Selected",
    addMore: "Add More Files",
    allSelected: "All Selected"
  },
  hi: {
    drag: "PDF फ़ाइलें यहाँ खींचें और छोड़ें",
    or: "या",
    browse: "फ़ाइलें ब्राउज़ करें",
    convert: "इमेज में कन्वर्ट करें",
    processing: "प्रोसेस हो रहा है...",
    cancel: "रद्द करें",
    clearAll: "सभी हटाएँ",
    options: "कन्वर्शन विकल्प",
    advanced: "उन्नत विकल्प",
    basic: "मूल विकल्प",
    outputFormat: "आउटपुट फॉर्मेट",
    resolution: "रिज़ॉल्यूशन (DPI)",
    quality: "गुणवत्ता (JPEG के लिए)",
    colorspace: "रंग स्पेस",
    pageRange: "पेज चुनें",
    allPages: "सभी पेज",
    selectedPages: "चुने हुए पेज",
    flipHorizontal: "क्षैतिज फ्लिप करें",
    flipVertical: "लंबवत फ्लिप करें",
    rotate: "घुमाएँ (90° increments)",
    brightness: "चमक",
    contrast: "कंट्रास्ट",
    gamma: "गामा",
    trimWhite: "सफेद मार्जिन हटाएँ",
    password: "पासवर्ड (सुरक्षित PDF के लिए)",
    merge: "ZIP में डाउनलोड करें",
    share: "लिंक साझा करें",
    email: "ईमेल पर भेजें",
    history: "इतिहास",
    clearHistory: "इतिहास साफ़ करें",
    success: "कन्वर्शन सफल!",
    error: "कुछ गड़बड़ हुई।",
    invalidType: "अमान्य फ़ाइल प्रकार। केवल PDF की अनुमति है।",
    tooLarge: "फ़ाइल बहुत बड़ी है। अधिकतम 100 MB है।",
    selectedCount: "चयनित",
    addMore: "और फ़ाइलें जोड़ें",
    allSelected: "सभी चयनित"
  }
};

export default function PdfToJpg() {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    outputFormat: 'jpg',
    resolution: '300',
    quality: '90',
    colorspace: 'rgb',
    pageSelection: 'all',
    selectedPages: [], // per file: array of page numbers (1-indexed)
    flipHorizontal: false,
    flipVertical: false,
    rotate: 0,
    brightness: 100,
    contrast: 100,
    gamma: 1.0,
    trimWhite: false,
    password: '',
    mergeZip: false,
    shareLink: ''
  });
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const t = translations[lang];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validateFile = (file) => {
    if (file.type !== 'application/pdf') {
      showToast(t.invalidType, 'error');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast(t.tooLarge, 'error');
      return false;
    }
    return true;
  };

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(f => validateFile(f));
    if (valid.length) {
      setFiles(prev => [...prev, ...valid]);
      setShareLink('');
    }
  };

  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    addFiles(Array.from(e.dataTransfer.files));
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current--;
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setShareLink('');
  };

  const moveFile = (fromIndex, toIndex) => {
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
  };

  // Page selection per file
  const updateFilePageSelection = (fileIndex, pageNum) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const file = newFiles[fileIndex];
      if (!file.selectedPages) file.selectedPages = [];
      if (file.selectedPages.includes(pageNum)) {
        file.selectedPages = file.selectedPages.filter(p => p !== pageNum);
      } else {
        file.selectedPages.push(pageNum);
      }
      newFiles[fileIndex] = file;
      return newFiles;
    });
  };

  const toggleAllPages = (fileIndex, totalPages) => {
    setFiles(prev => {
      const newFiles = [...prev];
      const file = newFiles[fileIndex];
      if (file.selectedPages && file.selectedPages.length === totalPages) {
        file.selectedPages = [];
      } else {
        file.selectedPages = Array.from({ length: totalPages }, (_, i) => i + 1);
      }
      newFiles[fileIndex] = file;
      return newFiles;
    });
  };

  const processFiles = async () => {
    if (!files.length) return;
    setIsConverting(true);
    setProgress(0);
    setShareLink('');

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 300);

      const uploadedUrls = [];
      const pageIndices = [];
      for (const file of files) {
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
        uploadedUrls.push(blob.url);
        // if pageSelection is 'all', send empty array (meaning all pages)
        // else send selected pages (0-based for API mapping)
        const selected = options.pageSelection === 'all' ? [] : (file.selectedPages || []).map(p => p - 1);
        pageIndices.push(selected);
      }

      // 🔥 FIX: Clean payload for backend (no extra watermark stuff)
      const cleanOptions = {
        outputFormat: options.outputFormat,
        resolution: options.resolution,
        quality: options.quality,
        colorspace: options.colorspace,
        flipHorizontal: options.flipHorizontal,
        flipVertical: options.flipVertical,
        rotate: options.rotate,
        brightness: options.brightness,
        contrast: options.contrast,
        gamma: options.gamma,
        trimWhite: options.trimWhite,
        mergeZip: options.mergeZip
      };

      // Only send password if it's not empty string
      if(options.password.trim() !== '') {
        cleanOptions.password = options.password;
      }

      const body = {
        action: ACTION_NAME,
        fileUrls: uploadedUrls,
        pageIndices: pageIndices, 
        options: cleanOptions
      };

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.downloadUrls) {
        // Download each image or ZIP
        if (data.downloadUrls.length === 1 && data.downloadUrls[0].endsWith('.zip')) {
          const resp = await fetch(data.downloadUrls[0]);
          const blob = await resp.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `MasterPdf_Images.zip`);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } else {
          for (let i = 0; i < data.downloadUrls.length; i++) {
            const resp = await fetch(data.downloadUrls[i]);
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MasterPdf_Page_${i + 1}.${options.outputFormat}`);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }
        }
        setShareLink(data.downloadUrls[0]);
        showToast(t.success, 'success');

        const newEntry = {
          time: new Date().toLocaleString(),
          files: files.map(f => f.name),
          url: data.downloadUrls[0]
        };
        setHistory(prev => [newEntry, ...prev].slice(0, 10));

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

  const cancelConversion = () => {
    setIsConverting(false);
    setProgress(0);
    showToast('Conversion cancelled', 'info');
  };

  // History
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_history_image');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_history_image', JSON.stringify(history));
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('masterpdf_history_image');
  };

  const downloadFromHistory = (url) => {
    const fetchAndDownload = async () => {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', `MasterPdf_Download.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    };
    fetchAndDownload();
  };

  const handleCloud = (provider) => showToast(`${provider} integration coming soon!`, 'info');
  const handleEmail = () => { const email = prompt('Enter your email address:'); if (email) showToast(`Result will be sent to ${email} (demo)`, 'info'); };
  const handleShare = async () => {
    if (shareLink) {
      try { await navigator.clipboard.writeText(shareLink); showToast('Link copied!', 'success'); }
      catch { showToast('Copy failed', 'error'); }
    } else showToast('No converted file yet.', 'info');
  };

  // PDF Thumbnails component
  const PdfThumbnails = ({ file, fileIndex, totalPages }) => {
    const [numPages, setNumPages] = useState(null);
    const [fileUrl, setFileUrl] = useState(null);

    useEffect(() => {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return () => URL.revokeObjectURL(url);
    }, [file]);

    function onDocumentLoadSuccess({ numPages }) {
      setNumPages(numPages);
    }

    const selectedPages = file.selectedPages || [];

    const isSelected = (pageNum) => {
      if (options.pageSelection === 'all') return true;
      return selectedPages.includes(pageNum);
    };

    const handleTogglePage = (pageNum) => {
      if (options.pageSelection === 'all') return; // if all pages selected, no need to toggle
      updateFilePageSelection(fileIndex, pageNum);
    };

    const handleToggleAll = () => {
      if (options.pageSelection === 'all') return;
      toggleAllPages(fileIndex, numPages);
    };

    return (
      <div className="w-full">
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} className="w-full">
          {numPages && Array.from(new Array(numPages), (el, index) => {
            const pageNum = index + 1;
            const selected = isSelected(pageNum);
            return (
              <div key={index} className={`mb-3 p-2 border rounded-lg ${selected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
                <Page
                  pageNumber={pageNum}
                  width={120}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  className="border rounded shadow-sm"
                />
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-semibold">Page {pageNum}</span>
                  {options.pageSelection !== 'all' ? (
                    <button onClick={() => handleTogglePage(pageNum)} className="text-blue-500">
                      {selected ? <CheckSquare size={16} /> : <Square size={16} />}
                    </button>
                  ) : (
                    <span className="text-xs text-blue-500">Selected</span>
                  )}
                </div>
              </div>
            );
          })}
        </Document>
        {options.pageSelection !== 'all' && numPages && (
          <button onClick={handleToggleAll} className="text-sm text-blue-500 underline mt-2 font-bold">
            {selectedPages.length === numPages ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>Convert PDF to JPG/PNG Online Free | MasterPdf</title>
        <meta name="description" content="Extract pages from PDF to high-quality JPG/PNG images online instantly. 100% Free. Created by Suhel Ansari." />
        <meta name="keywords" content="pdf to jpg, pdf to png, pdf to image, convert pdf to jpg, masterpdf, Suhel Ansari" />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{TOOL_TITLE}</h1>
          <p className="text-base sm:text-lg opacity-80">{TOOL_DESC}</p>
        </div>

        {/* Toolbar */}
        <div className="flex justify-end mb-4 gap-2 w-full max-w-7xl mx-auto">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow" title={t.darkMode}>
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 rounded-lg border bg-white dark:bg-gray-800 outline-none">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* SIDEBAR – Options */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm h-[70vh] overflow-y-auto custom-scrollbar flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 shrink-0"><SlidersHorizontal size={18} /> {t.options}</h3>

            <div className="space-y-4 shrink-0">
              <div>
                <label className="block text-sm font-medium mb-1">{t.outputFormat}</label>
                <select value={options.outputFormat} onChange={(e) => setOptions({ ...options, outputFormat: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900 outline-none">
                  <option value="jpg">JPG</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.resolution}</label>
                <select value={options.resolution} onChange={(e) => setOptions({ ...options, resolution: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900 outline-none">
                  <option value="72">72 DPI</option><option value="150">150 DPI</option><option value="300">300 DPI</option><option value="600">600 DPI</option><option value="1200">1200 DPI</option>
                </select>
              </div>
              {options.outputFormat !== 'png' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t.quality} (%)</label>
                  <input type="number" min="1" max="100" value={options.quality} onChange={(e) => setOptions({ ...options, quality: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900 outline-none" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{t.colorspace}</label>
                <select value={options.colorspace} onChange={(e) => setOptions({ ...options, colorspace: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900 outline-none">
                  <option value="rgb">RGB</option><option value="cmyk">CMYK</option><option value="gray">Grayscale</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageRange}</label>
                <select value={options.pageSelection} onChange={(e) => setOptions({ ...options, pageSelection: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900 outline-none">
                  <option value="all">{t.allPages}</option>
                  <option value="selected">{t.selectedPages}</option>
                </select>
              </div>
            </div>

            {/* Advanced Toggle */}
            <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-bold shrink-0">
              {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              {showAdvanced ? t.basic : t.advanced}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4 shrink-0">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={options.flipHorizontal} onChange={(e) => setOptions({ ...options, flipHorizontal: e.target.checked })} />
                  <FlipHorizontal2 size={16} /> {t.flipHorizontal}
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={options.flipVertical} onChange={(e) => setOptions({ ...options, flipVertical: e.target.checked })} />
                  <RotateCw size={16} /> {t.flipVertical}
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.rotate}</label>
                  <select value={options.rotate} onChange={(e) => setOptions({ ...options, rotate: Number(e.target.value) })} className="w-full p-2 border rounded bg-white dark:bg-gray-900 outline-none">
                    <option value={0}>0°</option><option value={90}>90°</option><option value={180}>180°</option><option value={270}>270°</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.brightness} (%)</label>
                  <input type="range" min="50" max="150" value={options.brightness} onChange={(e) => setOptions({ ...options, brightness: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.contrast} (%)</label>
                  <input type="range" min="50" max="150" value={options.contrast} onChange={(e) => setOptions({ ...options, contrast: Number(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.gamma}</label>
                  <input type="number" step="0.1" min="0.1" max="3.0" value={options.gamma} onChange={(e) => setOptions({ ...options, gamma: Number(e.target.value) })} className="w-full p-2 border rounded bg-white dark:bg-gray-900 outline-none" />
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={options.trimWhite} onChange={(e) => setOptions({ ...options, trimWhite: e.target.checked })} />
                  {t.trimWhite}
                </label>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1"><Lock size={14}/> {t.password}</label>
                  <input type="password" value={options.password} onChange={(e) => setOptions({ ...options, password: e.target.value })} placeholder="Password" className="w-full p-2 border rounded bg-white dark:bg-gray-900 outline-none" />
                </div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" checked={options.mergeZip} onChange={(e) => setOptions({ ...options, mergeZip: e.target.checked })} />
                  {t.merge}
                </label>
              </div>
            )}
          </div>

          {/* MAIN AREA */}
          <div className="flex-1 flex flex-col h-[70vh]">
            <div className={`rounded-2xl shadow-sm border p-6 flex flex-col h-full overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              
              {files.length === 0 ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl flex-1 flex flex-col items-center justify-center gap-4 transition min-h-[300px] ${darkMode ? 'border-gray-600 hover:border-blue-400 bg-gray-900' : 'border-gray-300 hover:border-blue-500 bg-gray-50'}`}
                >
                  <input type="file" id="file-upload" accept={ACCEPT_FORMAT} onChange={handleFileChange} multiple className="hidden" ref={fileInputRef} />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                    <UploadCloud size={60} className="text-blue-500 mb-2" />
                    <span className="text-xl font-bold">{t.drag}</span>
                    <span className="text-sm opacity-60 mt-1 mb-4">{t.or}</span>
                    <span className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-red-700 transition">
                      {t.browse}
                    </span>
                  </label>
                  <p className="text-xs mt-3 opacity-60">Max 100 MB per file</p>
                </div>
              ) : (
                <div className="w-full flex flex-col h-full">
                  <div className="flex justify-between items-center mb-4 shrink-0">
                    <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 font-bold">
                      <Plus size={18} />
                      <span>{files.length} {t.selectedCount}</span>
                    </button>
                    <button onClick={clearAll} className="text-red-500 hover:text-red-700 flex items-center gap-1 font-bold text-sm">
                      <Trash2 size={16} /> {t.clearAll}
                    </button>
                  </div>

                  {/* Files + Thumbnails */}
                  <div className="space-y-3 overflow-y-auto flex-grow custom-scrollbar pr-2 mb-4">
                    {files.map((file, index) => (
                      <div key={index} className={`flex items-start justify-between p-3 rounded-lg border shrink-0 ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="flex items-start gap-3 flex-1 overflow-hidden">
                          <div className="flex flex-col gap-1 shrink-0 pt-1">
                            <button onClick={() => moveFile(index, index - 1)} disabled={index === 0} className="text-gray-400 hover:text-blue-500 disabled:opacity-30">
                              <ChevronUp size={16} />
                            </button>
                            <button onClick={() => moveFile(index, index + 1)} disabled={index === files.length - 1} className="text-gray-400 hover:text-blue-500 disabled:opacity-30">
                              <ChevronDown size={16} />
                            </button>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText size={20} className="text-[#E5322D] shrink-0" />
                              <p className="font-bold text-sm truncate">{file.name}</p>
                              <p className="text-xs opacity-60 shrink-0">({(file.size / 1024 / 1024).toFixed(2)} MB)</p>
                            </div>
                            {/* Thumbnails Component */}
                            <div className="mt-2 bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600 h-48 overflow-y-auto custom-scrollbar">
                              <PdfThumbnails file={file} fileIndex={index} totalPages={0} />
                            </div>
                          </div>
                        </div>
                        <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-red-500 ml-2 p-1 shrink-0">
                          <X size={20} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Convert Button */}
                  <div className="flex flex-col sm:flex-row gap-4 shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700">
                    {!isConverting ? (
                      <button onClick={processFiles} className="flex-1 flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700">
                        {t.convert} <ArrowRight size={24} />
                      </button>
                    ) : (
                      <>
                        <button onClick={cancelConversion} className="flex-1 flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold text-lg bg-gray-300 hover:bg-gray-400 text-gray-800">
                          {t.cancel}
                        </button>
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="w-full bg-gray-200 rounded-full h-3">
                            <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-sm mt-1 font-bold">{progress}%</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Share / Email / Cloud */}
                  {shareLink && !isConverting && (
                    <div className="mt-4 flex flex-wrap gap-2 shrink-0">
                      <button onClick={handleShare} className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 font-bold rounded hover:bg-blue-200 text-xs"><Share2 size={14} /> Share</button>
                      <button onClick={handleEmail} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 font-bold rounded hover:bg-green-200 text-xs"><Mail size={14} /> Email</button>
                      <button onClick={() => handleCloud('Google Drive')} className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 font-bold rounded hover:bg-yellow-200 text-xs"><Cloud size={14} /> Drive</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2 text-sm"><History size={16} /> {t.history}</h4>
                  <button onClick={clearHistory} className="text-red-500 text-xs font-bold hover:underline">{t.clearHistory}</button>
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                  {history.map((item, idx) => (
                    <li key={idx} className="flex flex-col text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="font-bold truncate" title={item.files.join(', ')}>{item.files.join(', ')}</span>
                      <div className="flex justify-between items-center mt-2">
                        <span className="opacity-50 text-[10px]">{item.time}</span>
                        <button onClick={() => downloadFromHistory(item.url)} className="text-blue-500 font-bold hover:underline flex items-center gap-1"><Download size={12} /> Download</button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-xl text-white font-bold z-[100] ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-blue-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
