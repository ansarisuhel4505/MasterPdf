import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import {
  UploadCloud, FileText, X, ArrowRight, Settings, Trash2,
  Plus, ChevronDown, ChevronUp, History, Sun, Moon, Lock, Palette,
  Combine, Split, Cloud, Mail, Share2, Download, SlidersHorizontal, Type,
  ScanText, CheckCircle2, Loader2, FileCheck2, Shield, KeyRound, Layers
} from 'lucide-react';

const TOOL_TITLE = "PowerPoint to PDF Converter";
const TOOL_DESC = "Convert PPT/PPTX files into professional PDF with advanced options.";
const ACTION_NAME = "powerpoint-to-pdf";
const ACCEPT_FORMAT = ".ppt,.pptx";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// i18n Dictionary
const translations = {
  en: {
    drag: "Drag & drop PPT files here",
    or: "or",
    browse: "Browse Files",
    convert: "Convert to PDF",
    processing: "Processing...",
    cancel: "Cancel",
    clearAll: "Clear All",
    options: "Conversion Options",
    advanced: "Advanced Options",
    basic: "Basic Options",
    pageRange: "Slide Range (e.g., 1-5,8)",
    publishWhat: "Publish What",
    slides: "Slides",
    handouts: "Handouts",
    notes: "Notes Pages",
    outline: "Outline",
    slidesPerPage: "Slides per Page",
    frameSlides: "Frame Slides",
    includeHidden: "Include Hidden Slides",
    quality: "Quality",
    highQuality: "High (Print Ready)",
    minSize: "Minimum Size (Email)",
    dpi: "Image DPI",
    jpegCompression: "JPEG Compression",
    textCompression: "Text Compression",
    fontEmbedding: "Font Embedding",
    embedAll: "Embed All Characters",
    embedUsed: "Embed Used Characters",
    pdfa: "PDF/A Compliance",
    pdfa1b: "PDF/A-1b (Basic)",
    pdfa2b: "PDF/A-2b (Enhanced)",
    pdfa3b: "PDF/A-3b (Archival)",
    pdfua: "PDF/UA (Accessibility)",
    digitalSignature: "Digital Signature (Demo)",
    encryption: "Encryption (AES-256)",
    metadata: "Preserve Metadata",
    password: "Password Protection",
    passwordConfirm: "Confirm Password",
    permissions: "Permissions",
    allowPrint: "Allow Printing",
    allowHighPrint: "Allow High-Quality Printing",
    allowCopy: "Allow Copying",
    allowModify: "Allow Modifying",
    watermark: "Watermark Text",
    watermarkColor: "Watermark Color",
    watermarkFontSize: "Watermark Font Size",
    watermarkOpacity: "Watermark Opacity",
    watermarkRotation: "Rotation",
    watermarkPosition: "Position",
    merge: "Merge all PDFs into one",
    compress: "Compress to target size",
    compressSize: "Target Size",
    compressUnit: "Unit",
    share: "Share Link",
    email: "Email Result",
    history: "History",
    clearHistory: "Clear History",
    success: "Conversion successful!",
    error: "Something went wrong. Please try again.",
    invalidType: "Invalid file type. Only .ppt and .pptx allowed.",
    tooLarge: "File too large. Max size is 100 MB.",
    selectedCount: "Selected",
    addMore: "Add More Files"
  },
  hi: {
    drag: "PPT फ़ाइलें यहाँ खींचें और छोड़ें",
    or: "या",
    browse: "फ़ाइलें ब्राउज़ करें",
    convert: "PDF में कन्वर्ट करें",
    processing: "प्रोसेस हो रहा है...",
    cancel: "रद्द करें",
    clearAll: "सभी हटाएँ",
    options: "कन्वर्शन विकल्प",
    advanced: "उन्नत विकल्प",
    basic: "मूल विकल्प",
    pageRange: "स्लाइड रेंज (जैसे 1-5,8)",
    publishWhat: "क्या प्रकाशित करें",
    slides: "स्लाइड्स",
    handouts: "हैंडआउट्स",
    notes: "नोट्स पेज",
    outline: "आउटलाइन",
    slidesPerPage: "प्रति पेज स्लाइड्स",
    frameSlides: "स्लाइड फ्रेम करें",
    includeHidden: "छिपी स्लाइड्स शामिल करें",
    quality: "गुणवत्ता",
    highQuality: "उच्च (प्रिंट के लिए)",
    minSize: "न्यूनतम आकार (ईमेल)",
    dpi: "इमेज DPI",
    jpegCompression: "JPEG संपीड़न",
    textCompression: "टेक्स्ट संपीड़न",
    fontEmbedding: "फ़ॉन्ट एम्बेडिंग",
    embedAll: "सभी अक्षर एम्बेड करें",
    embedUsed: "उपयोग किए गए अक्षर एम्बेड करें",
    pdfa: "PDF/A अनुपालन",
    pdfa1b: "PDF/A-1b (मूल)",
    pdfa2b: "PDF/A-2b (उन्नत)",
    pdfa3b: "PDF/A-3b (संग्रह)",
    pdfua: "PDF/UA (सुलभता)",
    digitalSignature: "डिजिटल हस्ताक्षर (डेमो)",
    encryption: "एन्क्रिप्शन (AES-256)",
    metadata: "मेटाडेटा संरक्षित करें",
    password: "पासवर्ड सुरक्षा",
    passwordConfirm: "पासवर्ड की पुष्टि करें",
    permissions: "अनुमतियाँ",
    allowPrint: "प्रिंटिंग की अनुमति दें",
    allowHighPrint: "उच्च गुणवत्ता प्रिंटिंग की अनुमति दें",
    allowCopy: "कॉपी करने की अनुमति दें",
    allowModify: "संशोधन की अनुमति दें",
    watermark: "वॉटरमार्क टेक्स्ट",
    watermarkColor: "वॉटरमार्क रंग",
    watermarkFontSize: "वॉटरमार्क फ़ॉन्ट साइज़",
    watermarkOpacity: "वॉटरमार्क अपारदर्शिता",
    watermarkRotation: "रोटेशन",
    watermarkPosition: "स्थिति",
    merge: "सभी PDF को एक में मर्ज करें",
    compress: "टारगेट साइज़ में कंप्रेस करें",
    compressSize: "टारगेट साइज़",
    compressUnit: "इकाई",
    share: "लिंक साझा करें",
    email: "ईमेल पर भेजें",
    history: "इतिहास",
    clearHistory: "इतिहास साफ़ करें",
    success: "कन्वर्शन सफल!",
    error: "कुछ गड़बड़ हुई।",
    invalidType: "अमान्य फ़ाइल प्रकार। केवल .ppt और .pptx की अनुमति है।",
    tooLarge: "फ़ाइल बहुत बड़ी है। अधिकतम 100 MB है।",
    selectedCount: "चयनित",
    addMore: "और फ़ाइलें जोड़ें"
  }
};

export default function PowerpointToPdf() {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    pageRange: '',
    publishWhat: 'slides',
    slidesPerPage: '1',
    frameSlides: false,
    includeHidden: false,
    quality: 'high',
    dpi: '300',
    jpegCompression: '80',
    textCompression: 'flate',
    fontEmbedding: 'embedAll',
    pdfa: 'none',
    pdfua: false,
    digitalSignature: false,
    encryption: false,
    metadata: true,
    password: '',
    passwordConfirm: '',
    permissions: { print: true, highPrint: true, copy: true, modify: false },
    watermark: '',
    watermarkColor: '#000000',
    watermarkFontSize: '24',
    watermarkOpacity: 50,
    watermarkRotation: 45,
    watermarkPosition: 'center',
    merge: false,
    compress: false,
    compressSize: '500',
    compressUnit: 'KB'
  });
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [shareLink, setShareLink] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  const t = translations[lang];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['ppt', 'pptx'].includes(ext)) {
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
    const valid = [];
    for (const f of newFiles) {
      if (validateFile(f)) valid.push(f);
    }
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

  const processFiles = async () => {
    if (!files.length) return;
    if (options.password && options.password !== options.passwordConfirm) {
      showToast("Passwords do not match!", 'error');
      return;
    }
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

      // Upload each file
      const uploadedUrls = [];
      for (const file of files) {
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
        uploadedUrls.push(blob.url);
      }

      const body = {
        action: ACTION_NAME,
        fileUrls: uploadedUrls,
        options: {
          pageRange: parsePageRange(options.pageRange),
          publishWhat: options.publishWhat,
          slidesPerPage: options.slidesPerPage,
          frameSlides: options.frameSlides,
          includeHidden: options.includeHidden,
          quality: options.quality,
          dpi: options.dpi,
          jpegCompression: options.jpegCompression,
          textCompression: options.textCompression,
          fontEmbedding: options.fontEmbedding,
          pdfa: options.pdfa,
          pdfua: options.pdfua,
          digitalSignature: options.digitalSignature,
          encryption: options.encryption,
          metadata: options.metadata,
          password: options.password,
          permissions: options.permissions,
          watermark: options.watermark,
          watermarkColor: options.watermarkColor,
          watermarkFontSize: options.watermarkFontSize,
          watermarkOpacity: options.watermarkOpacity,
          watermarkRotation: options.watermarkRotation,
          watermarkPosition: options.watermarkPosition,
          merge: options.merge,
          compress: options.compress,
          compressSize: options.compressSize,
          compressUnit: options.compressUnit
        }
      };

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && (data.downloadUrl || data.downloadUrls)) {
        // BLOB DOWNLOAD FIX
        if (data.downloadUrls && data.downloadUrls.length > 0) {
          for (let i = 0; i < data.downloadUrls.length; i++) {
            const resp = await fetch(data.downloadUrls[i]);
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MasterPdf_Converted_${i + 1}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }
          setShareLink(data.downloadUrls[0]);
        } else if (data.downloadUrl) {
          const resp = await fetch(data.downloadUrl);
          const blob = await resp.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', `MasterPdf_Converted.pdf`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          setShareLink(data.downloadUrl);
        }

        const newEntry = { time: new Date().toLocaleString(), files: files.map(f => f.name), url: data.downloadUrl || (data.downloadUrls && data.downloadUrls[0]) };
        setHistory(prev => [newEntry, ...prev].slice(0, 10));
        showToast(t.success, 'success');
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

  const parsePageRange = (range) => {
    if (!range) return [];
    const pages = [];
    range.split(',').forEach(part => {
      part = part.trim();
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        for (let i = start; i <= end; i++) pages.push(i);
      } else if (part) {
        pages.push(Number(part));
      }
    });
    return pages;
  };

  // History
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_history_ppt2pdf');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_history_ppt2pdf', JSON.stringify(history));
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('masterpdf_history_ppt2pdf');
  };

  const downloadFromHistory = (url) => {
    const fetchAndDownload = async () => {
      const resp = await fetch(url);
      const blob = await resp.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.setAttribute('download', `MasterPdf_Download.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(objectUrl);
    };
    fetchAndDownload();
  };

  const handleCloud = (provider) => {
    showToast(`${provider} integration coming soon!`, 'info');
  };

  const handleEmail = () => {
    const email = prompt('Enter your email address:');
    if (email) {
      showToast(`Result will be sent to ${email} (demo)`, 'info');
    }
  };

  const handleShare = async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink);
        showToast('Link copied!', 'success');
      } catch {
        showToast('Copy failed', 'error');
      }
    } else {
      showToast('No converted file yet.', 'info');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>Convert PowerPoint to PDF Online Free | MasterPdf</title>
        <meta name="description" content="Convert PPT and PPTX files to PDF easily and securely online for free. Created by Suhel Ansari." />
        <meta name="keywords" content="powerpoint to pdf, ppt to pdf, pptx to pdf, convert powerpoint to pdf, masterpdf, Suhel Ansari" />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{TOOL_TITLE}</h1>
          <p className="text-base sm:text-lg opacity-80">{TOOL_DESC}</p>
        </div>

        {/* Toolbar */}
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow"
            title={t.darkMode}
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="p-2 rounded-lg border bg-white dark:bg-gray-800"
          >
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* SIDEBAR – Options */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <SlidersHorizontal size={18} /> {t.options}
            </h3>

            {/* Basic Options */}
            <div className="space-y-4">
              {/* Slide Range */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageRange}</label>
                <input
                  type="text"
                  value={options.pageRange}
                  onChange={(e) => setOptions({ ...options, pageRange: e.target.value })}
                  placeholder="e.g., 1-5,8"
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                />
              </div>
              {/* Publish What */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.publishWhat}</label>
                <select
                  value={options.publishWhat}
                  onChange={(e) => setOptions({ ...options, publishWhat: e.target.value })}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                >
                  <option value="slides">{t.slides}</option>
                  <option value="handouts">{t.handouts}</option>
                  <option value="notes">{t.notes}</option>
                  <option value="outline">{t.outline}</option>
                </select>
              </div>
              {/* Slides per Page (only if handouts) */}
              {options.publishWhat === 'handouts' && (
                <div>
                  <label className="block text-sm font-medium mb-1">{t.slidesPerPage}</label>
                  <select
                    value={options.slidesPerPage}
                    onChange={(e) => setOptions({ ...options, slidesPerPage: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="6">6</option>
                    <option value="9">9</option>
                  </select>
                </div>
              )}
              {/* Frame Slides */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.frameSlides}
                  onChange={(e) => setOptions({ ...options, frameSlides: e.target.checked })}
                />
                {t.frameSlides}
              </label>
              {/* Hidden Slides */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.includeHidden}
                  onChange={(e) => setOptions({ ...options, includeHidden: e.target.checked })}
                />
                {t.includeHidden}
              </label>
              {/* Quality */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.quality}</label>
                <select
                  value={options.quality}
                  onChange={(e) => setOptions({ ...options, quality: e.target.value })}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                >
                  <option value="high">{t.highQuality}</option>
                  <option value="min">{t.minSize}</option>
                </select>
              </div>
              {/* DPI */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.dpi}</label>
                <select
                  value={options.dpi}
                  onChange={(e) => setOptions({ ...options, dpi: e.target.value })}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                >
                  <option value="72">72 DPI</option>
                  <option value="150">150 DPI</option>
                  <option value="300">300 DPI</option>
                  <option value="600">600 DPI</option>
                </select>
              </div>
            </div>

            {/* Advanced Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              {showAdvanced ? t.basic : t.advanced}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                {/* JPEG Compression */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.jpegCompression} (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.jpegCompression}
                    onChange={(e) => setOptions({ ...options, jpegCompression: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  />
                </div>
                {/* Text Compression */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.textCompression}</label>
                  <select
                    value={options.textCompression}
                    onChange={(e) => setOptions({ ...options, textCompression: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  >
                    <option value="flate">Flate</option>
                    <option value="ascii">ASCII</option>
                    <option value="none">None</option>
                  </select>
                </div>
                {/* Font Embedding */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.fontEmbedding}</label>
                  <select
                    value={options.fontEmbedding}
                    onChange={(e) => setOptions({ ...options, fontEmbedding: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  >
                    <option value="embedAll">{t.embedAll}</option>
                    <option value="embedUsed">{t.embedUsed}</option>
                  </select>
                </div>
                {/* PDF/A Compliance */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.pdfa}</label>
                  <select
                    value={options.pdfa}
                    onChange={(e) => setOptions({ ...options, pdfa: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  >
                    <option value="none">None</option>
                    <option value="pdfa1b">{t.pdfa1b}</option>
                    <option value="pdfa2b">{t.pdfa2b}</option>
                    <option value="pdfa3b">{t.pdfa3b}</option>
                  </select>
                </div>
                {/* PDF/UA Accessibility */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.pdfua}
                    onChange={(e) => setOptions({ ...options, pdfua: e.target.checked })}
                  />
                  <FileCheck2 size={16} /> {t.pdfua}
                </label>
                {/* Digital Signature */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.digitalSignature}
                    onChange={(e) => setOptions({ ...options, digitalSignature: e.target.checked })}
                  />
                  <Shield size={16} /> {t.digitalSignature}
                </label>
                {/* Encryption */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.encryption}
                    onChange={(e) => setOptions({ ...options, encryption: e.target.checked })}
                  />
                  <KeyRound size={16} /> {t.encryption}
                </label>
                {/* Preserve Metadata */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.metadata}
                    onChange={(e) => setOptions({ ...options, metadata: e.target.checked })}
                  />
                  <Layers size={16} /> {t.metadata}
                </label>
                {/* Password */}
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Lock size={14} /> {t.password}
                  </label>
                  <input type="password" value={options.password} onChange={(e) => setOptions({ ...options, password: e.target.value })} placeholder="Enter password" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.passwordConfirm}</label>
                  <input type="password" value={options.passwordConfirm} onChange={(e) => setOptions({ ...options, passwordConfirm: e.target.value })} placeholder="Confirm password" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
                {/* Permissions */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.permissions.print} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, print: e.target.checked } })} />
                    {t.allowPrint}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.permissions.highPrint} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, highPrint: e.target.checked } })} />
                    {t.allowHighPrint}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.permissions.copy} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, copy: e.target.checked } })} />
                    {t.allowCopy}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.permissions.modify} onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, modify: e.target.checked } })} />
                    {t.allowModify}
                  </label>
                </div>
                {/* Watermark */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermark}</label>
                  <input type="text" value={options.watermark} onChange={(e) => setOptions({ ...options, watermark: e.target.value })} placeholder="Your watermark" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Palette size={14} /> {t.watermarkColor}
                  </label>
                  <input type="color" value={options.watermarkColor} onChange={(e) => setOptions({ ...options, watermarkColor: e.target.value })} className="w-full p-1 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermarkFontSize}</label>
                  <input type="number" min="1" max="100" value={options.watermarkFontSize} onChange={(e) => setOptions({ ...options, watermarkFontSize: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermarkOpacity}</label>
                  <input type="number" min="0" max="100" value={options.watermarkOpacity} onChange={(e) => setOptions({ ...options, watermarkOpacity: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermarkRotation}</label>
                  <input type="number" value={options.watermarkRotation} onChange={(e) => setOptions({ ...options, watermarkRotation: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermarkPosition}</label>
                  <select value={options.watermarkPosition} onChange={(e) => setOptions({ ...options, watermarkPosition: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                </div>
                {/* Merge */}
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={options.merge} onChange={(e) => setOptions({ ...options, merge: e.target.checked })} />
                  <Combine size={16} /> {t.merge}
                </label>
                {/* Compress */}
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.compress} onChange={(e) => setOptions({ ...options, compress: e.target.checked })} />
                    {t.compress}
                  </label>
                  {options.compress && (
                    <div className="flex gap-2 mt-2">
                      <input type="number" min="1" placeholder={t.compressSize} value={options.compressSize} onChange={(e) => setOptions({ ...options, compressSize: e.target.value })} className="p-2 border rounded bg-white dark:bg-gray-900 flex-1" />
                      <select value={options.compressUnit} onChange={(e) => setOptions({ ...options, compressUnit: e.target.value })} className="p-2 border rounded bg-white dark:bg-gray-900">
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* MAIN AREA */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[450px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* Drag & Drop */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={(e) => e.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-10 text-center transition ${darkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-500'} ${files.length ? 'hidden' : ''}`}
              >
                <input type="file" id="file-upload" accept={ACCEPT_FORMAT} onChange={handleFileChange} multiple className="hidden" ref={fileInputRef} />
                <label htmlFor="file-upload" className="cursor-pointer inline-flex flex-col items-center gap-3">
                  <UploadCloud size={48} className="text-blue-500" />
                  <span className="text-lg font-semibold">{t.drag}</span>
                  <span className="text-sm opacity-70">{t.or}</span>
                  <span className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-red-700 transition">{t.browse}</span>
                </label>
                <p className="text-xs mt-3 opacity-60">Max 100 MB per file</p>
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
                      <Trash2 size={16} /> {t.clearAll}
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className={`flex items-start justify-between p-3 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} bg-gray-50 dark:bg-gray-700`}>
                        <div className="flex items-center gap-3 flex-1">
                          <button onClick={() => moveFile(index, index - 1)} disabled={index === 0} className="text-gray-500 disabled:opacity-30">
                            <ChevronUp size={16} />
                          </button>
                          <button onClick={() => moveFile(index, index + 1)} disabled={index === files.length - 1} className="text-gray-500 disabled:opacity-30">
                            <ChevronDown size={16} />
                          </button>
                          <FileText size={24} className="text-[#E5322D]" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm truncate max-w-[200px]">{file.name}</p>
                            <p className="text-xs opacity-60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500 ml-2">
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
                        <button onClick={cancelConversion} className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-gray-300 hover:bg-gray-400 text-gray-800">{t.cancel}</button>
                        <div className="flex-1 flex flex-col items-center justify-center">
                          <div className="w-full bg-gray-200 rounded-full h-4">
                            <div className="bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                          </div>
                          <span className="text-sm mt-1">{progress}%</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Share / Email / Cloud */}
                  {shareLink && !isConverting && (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"><Share2 size={18} /> {t.share}</button>
                      <button onClick={handleEmail} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"><Mail size={18} /> {t.email}</button>
                      <button onClick={() => handleCloud('Google Drive')} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"><Cloud size={18} /> Google Drive</button>
                      <button onClick={() => handleCloud('Dropbox')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"><Cloud size={18} /> Dropbox</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2"><History size={18} /> {t.history}</h4>
                  <button onClick={clearHistory} className="text-red-500 text-sm hover:underline">{t.clearHistory}</button>
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span>{item.files.join(', ')} <span className="opacity-50">({item.time})</span></span>
                      <button onClick={() => downloadFromHistory(item.url)} className="text-blue-500 hover:underline flex items-center gap-1"><Download size={14} /> Download</button>
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
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-blue-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
