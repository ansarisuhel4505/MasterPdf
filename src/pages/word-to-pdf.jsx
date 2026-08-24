import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  UploadCloud, FileText, X, ArrowRight, Settings, Trash2, Download,
  Cloud, Mail, Share2, History, Sun, Moon, Globe, Lock, Image as ImageIcon,
  Combine, Split, Loader, ChevronDown, ChevronUp, GripVertical
} from 'lucide-react';
import { upload } from '@vercel/blob/client';

const TOOL_TITLE = "Word to PDF Converter";
const TOOL_DESC = "Make DOC and DOCX files easy to read by converting them to PDF.";
const ACTION_NAME = "word-to-pdf";
const ACCEPT_FORMAT = ".doc,.docx";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// i18n dictionary (extended with deep features)
const translations = {
  en: {
    select: "Select File",
    drag: "Drag & drop your files here",
    or: "or",
    browse: "Browse Files",
    convert: "Convert Now",
    processing: "Processing...",
    cancel: "Cancel",
    remove: "Remove",
    ready: "Ready to Process",
    options: "Conversion Options",
    pageSize: "Page Size",
    orientation: "Orientation",
    margins: "Margins",
    customMargins: "Custom Margins (mm)",
    scaling: "Scaling",
    quality: "Quality",
    dpi: "Image DPI",
    compression: "Compression",
    colorMode: "Color Mode",
    password: "Password Protection (optional)",
    passwordConfirm: "Confirm Password",
    permissions: "Permissions",
    allowPrint: "Allow Printing",
    allowCopy: "Allow Copying",
    allowModify: "Allow Modifying",
    watermark: "Watermark Text (optional)",
    watermarkOpacity: "Watermark Opacity (%)",
    watermarkRotation: "Rotation (°)",
    watermarkPosition: "Position",
    merge: "Merge all files into one PDF",
    mergeOrder: "Merge Order (drag to reorder)",
    split: "Split pages (range, e.g. 1-5,8)",
    splitByBookmark: "Split by Bookmark (if available)",
    share: "Share Link",
    email: "Email Result",
    history: "History",
    clearHistory: "Clear History",
    darkMode: "Dark Mode",
    language: "Language",
    fileInfo: "File Info",
    size: "Size",
    pages: "Pages (unknown)",
    success: "Conversion successful!",
    error: "Something went wrong. Please try again.",
    invalidType: "Invalid file type. Only .doc and .docx allowed.",
    tooLarge: "File too large. Max size is 50 MB.",
    advanced: "Advanced Options",
    basic: "Basic Options",
    reorder: "Reorder",
    delete: "Delete",
    addMore: "Add More Files"
  },
  hi: {
    select: "फ़ाइल चुनें",
    drag: "अपनी फ़ाइलें यहाँ खींचें और छोड़ें",
    or: "या",
    browse: "फ़ाइलें ब्राउज़ करें",
    convert: "अभी कन्वर्ट करें",
    processing: "प्रोसेस हो रहा है...",
    cancel: "रद्द करें",
    remove: "हटाएँ",
    ready: "प्रोसेस के लिए तैयार",
    options: "कन्वर्शन विकल्प",
    pageSize: "पेज साइज़",
    orientation: "ओरिएंटेशन",
    margins: "मार्जिन",
    customMargins: "कस्टम मार्जिन (mm)",
    scaling: "स्केलिंग",
    quality: "गुणवत्ता",
    dpi: "इमेज DPI",
    compression: "संपीड़न",
    colorMode: "रंग मोड",
    password: "पासवर्ड सुरक्षा (वैकल्पिक)",
    passwordConfirm: "पासवर्ड की पुष्टि करें",
    permissions: "अनुमतियाँ",
    allowPrint: "प्रिंटिंग की अनुमति दें",
    allowCopy: "कॉपी करने की अनुमति दें",
    allowModify: "संशोधन की अनुमति दें",
    watermark: "वॉटरमार्क टेक्स्ट (वैकल्पिक)",
    watermarkOpacity: "वॉटरमार्क अपारदर्शिता (%)",
    watermarkRotation: "रोटेशन (°)",
    watermarkPosition: "स्थिति",
    merge: "सभी फ़ाइलों को एक PDF में मर्ज करें",
    mergeOrder: "मर्ज क्रम (क्रम बदलने के लिए खींचें)",
    split: "पेज विभाजित करें (रेंज, जैसे 1-5,8)",
    splitByBookmark: "बुकमार्क से विभाजित करें (यदि उपलब्ध हो)",
    share: "लिंक साझा करें",
    email: "ईमेल पर भेजें",
    history: "इतिहास",
    clearHistory: "इतिहास साफ़ करें",
    darkMode: "डार्क मोड",
    language: "भाषा",
    fileInfo: "फ़ाइल जानकारी",
    size: "आकार",
    pages: "पेज (अज्ञात)",
    success: "कन्वर्शन सफल!",
    error: "कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।",
    invalidType: "अमान्य फ़ाइल प्रकार। केवल .doc और .docx की अनुमति है।",
    tooLarge: "फ़ाइल बहुत बड़ी है। अधिकतम आकार 50 MB है।",
    advanced: "उन्नत विकल्प",
    basic: "मूल विकल्प",
    reorder: "क्रम बदलें",
    delete: "हटाएँ",
    addMore: "और फ़ाइलें जोड़ें"
  }
};

export default function WordToPdf() {
  // ========== STATE ==========
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    margins: 'normal',
    customMargins: { top: 20, bottom: 20, left: 20, right: 20 },
    scaling: '100',
    quality: 'high',
    dpi: '300',
    compression: 'medium',
    colorMode: 'rgb',
    password: '',
    passwordConfirm: '',
    permissions: { print: true, copy: true, modify: true },
    watermark: '',
    watermarkOpacity: 50,
    watermarkRotation: 45,
    watermarkPosition: 'center',
    merge: false,
    splitRange: '',
    splitByBookmark: false
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

  // ========== FILE HANDLING ==========
  const validateFile = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['doc', 'docx'].includes(ext)) {
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
    if (dragCounter.current === 0) {
      // reset style if needed
    }
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setShareLink('');
  };

  // ========== REORDER FILES (Merge order) ==========
  const moveFile = (fromIndex, toIndex) => {
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    setFiles(updated);
  };

  // ========== CONVERSION ==========
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
      // Simulate progress
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
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload'
        });
        uploadedUrls.push(blob.url);
      }

      // Prepare request body with all options
      const body = {
        action: ACTION_NAME,
        fileUrls: uploadedUrls,
        options: {
          pageSize: options.pageSize,
          orientation: options.orientation,
          margins: options.margins,
          customMargins: options.customMargins,
          scaling: options.scaling,
          quality: options.quality,
          dpi: options.dpi,
          compression: options.compression,
          colorMode: options.colorMode,
          password: options.password,
          permissions: options.permissions,
          watermark: options.watermark,
          watermarkOpacity: options.watermarkOpacity,
          watermarkRotation: options.watermarkRotation,
          watermarkPosition: options.watermarkPosition,
          splitRange: options.splitRange,
          splitByBookmark: options.splitByBookmark
        },
        merge: options.merge
      };

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && (data.downloadUrl || data.downloadUrls)) {
        // If multiple URLs returned, download all
        if (data.downloadUrls && data.downloadUrls.length > 0) {
          data.downloadUrls.forEach((url, idx) => {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `MasterPdf_Converted_${idx + 1}.pdf`);
            link.target = '_blank';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          });
          setShareLink(data.downloadUrls[0]); // show first link for sharing
        } else if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.setAttribute('download', `MasterPdf_Converted.pdf`);
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setShareLink(data.downloadUrl);
        }

        // Add to history
        const newEntry = {
          time: new Date().toLocaleString(),
          files: files.map(f => f.name),
          url: data.downloadUrl || (data.downloadUrls && data.downloadUrls[0])
        };
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

  // ========== HISTORY ==========
  const loadHistory = () => {
    const saved = localStorage.getItem('masterpdf_history');
    if (saved) setHistory(JSON.parse(saved));
  };

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_history', JSON.stringify(history));
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('masterpdf_history');
  };

  const downloadFromHistory = (url) => {
    window.open(url, '_blank');
  };

  // ========== CLOUD / EMAIL / SHARE ==========
  const handleCloud = (provider) => {
    showToast(`${provider} integration coming soon!`, 'info');
  };

  const handleEmail = () => {
    const email = prompt('Enter your email address:');
    if (email) {
      // You can call an API endpoint here
      showToast(`Result will be sent to ${email} (demo)`, 'info');
    }
  };

  const handleShare = async () => {
    if (shareLink) {
      try {
        await navigator.clipboard.writeText(shareLink);
        showToast('Link copied to clipboard!', 'success');
      } catch {
        showToast('Copy failed. Select and copy manually.', 'error');
      }
    } else {
      showToast('No converted file yet. Convert first.', 'info');
    }
  };

  // ========== RENDER ==========
  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>Convert Word to PDF Online Free | MasterPdf</title>
        <meta name="description" content="Convert Word documents (Docx/Doc) to PDF format easily and securely. 100% Free online tool by MasterPdf. Created by Suhel Ansari." />
        <meta name="keywords" content="word to pdf, convert docx to pdf, doc to pdf, free word to pdf converter, masterpdf, Suhel Ansari" />
        <meta property="og:title" content="Convert Word to PDF Online Free | MasterPdf" />
        <meta property="og:description" content="Convert Word documents (Docx/Doc) to PDF format easily and securely." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6 mt-16 mb-10">
        {/* Toolbar */}
        <div className="w-full max-w-5xl flex justify-between items-center mb-4">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow"
            title="Toggle Dark Mode"
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

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">{TOOL_TITLE}</h1>
          <p className="text-base sm:text-lg opacity-80 max-w-2xl mx-auto">{TOOL_DESC}</p>
        </div>

        <div className={`w-full max-w-5xl rounded-2xl shadow-sm border p-4 sm:p-8 min-h-[450px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition ${darkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-500'} ${files.length ? 'hidden' : ''}`}
          >
            <input type="file" id="file-upload" accept={ACCEPT_FORMAT} onChange={handleFileChange} multiple className="hidden" ref={fileInputRef} />
            <label htmlFor="file-upload" className="cursor-pointer inline-flex flex-col items-center gap-3">
              <UploadCloud size={48} className="text-blue-500" />
              <span className="text-lg font-semibold">{t.drag}</span>
              <span className="text-sm opacity-70">{t.or}</span>
              <span className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-red-700 transition">
                {t.browse}
              </span>
            </label>
            <p className="text-xs mt-3 opacity-60">Max size: 50 MB per file</p>
          </div>

          {/* File List & Options */}
          {files.length > 0 && (
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">{files.length} file(s) selected</h3>
                <button onClick={clearAll} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                  <Trash2 size={16} /> {t.clearAll || 'Clear All'}
                </button>
              </div>

              {/* Reorderable File List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} bg-gray-50 dark:bg-gray-700`}>
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
                    <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500">
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add More Files Button */}
              <button
                onClick={() => fileInputRef.current.click()}
                className="mt-3 text-blue-500 hover:text-blue-700 text-sm font-semibold"
              >
                + {t.addMore}
              </button>

              {/* Conversion Options */}
              <div className="mt-6 border-t pt-4">
                <h4 className="font-bold mb-3 flex items-center gap-2">
                  <Settings size={18} /> {t.options}
                </h4>

                {/* Basic Options (always visible) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Page Size */}
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.pageSize}</label>
                    <select
                      value={options.pageSize}
                      onChange={(e) => setOptions({ ...options, pageSize: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="A4">A4</option>
                      <option value="A3">A3</option>
                      <option value="A5">A5</option>
                      <option value="Letter">Letter</option>
                      <option value="Legal">Legal</option>
                      <option value="Tabloid">Tabloid</option>
                    </select>
                  </div>
                  {/* Orientation */}
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.orientation}</label>
                    <select
                      value={options.orientation}
                      onChange={(e) => setOptions({ ...options, orientation: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="portrait">Portrait</option>
                      <option value="landscape">Landscape</option>
                    </select>
                  </div>
                  {/* Margins */}
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.margins}</label>
                    <select
                      value={options.margins}
                      onChange={(e) => setOptions({ ...options, margins: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="normal">Normal</option>
                      <option value="narrow">Narrow</option>
                      <option value="wide">Wide</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  {/* Custom Margins (shown if custom selected) */}
                  {options.margins === 'custom' && (
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input
                          type="number"
                          placeholder="Top (mm)"
                          value={options.customMargins.top}
                          onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, top: e.target.value } })}
                          className="p-2 border rounded bg-white dark:bg-gray-800"
                        />
                        <input
                          type="number"
                          placeholder="Bottom (mm)"
                          value={options.customMargins.bottom}
                          onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, bottom: e.target.value } })}
                          className="p-2 border rounded bg-white dark:bg-gray-800"
                        />
                        <input
                          type="number"
                          placeholder="Left (mm)"
                          value={options.customMargins.left}
                          onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, left: e.target.value } })}
                          className="p-2 border rounded bg-white dark:bg-gray-800"
                        />
                        <input
                          type="number"
                          placeholder="Right (mm)"
                          value={options.customMargins.right}
                          onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, right: e.target.value } })}
                          className="p-2 border rounded bg-white dark:bg-gray-800"
                        />
                      </div>
                    </div>
                  )}
                  {/* Scaling */}
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.scaling}</label>
                    <select
                      value={options.scaling}
                      onChange={(e) => setOptions({ ...options, scaling: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="100">Fit to Page (100%)</option>
                      <option value="110">110%</option>
                      <option value="90">90%</option>
                      <option value="75">75%</option>
                      <option value="50">50%</option>
                    </select>
                  </div>
                  {/* Quality */}
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.quality}</label>
                    <select
                      value={options.quality}
                      onChange={(e) => setOptions({ ...options, quality: e.target.value })}
                      className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                {/* Advanced Options Toggle */}
                <div className="mt-4 flex items-center">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-blue-500 hover:text-blue-700 font-semibold"
                  >
                    {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    {showAdvanced ? t.basic : t.advanced}
                  </button>
                </div>

                {showAdvanced && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {/* DPI */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.dpi}</label>
                      <select
                        value={options.dpi}
                        onChange={(e) => setOptions({ ...options, dpi: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      >
                        <option value="72">72 DPI</option>
                        <option value="150">150 DPI</option>
                        <option value="300">300 DPI</option>
                        <option value="600">600 DPI</option>
                      </select>
                    </div>
                    {/* Compression */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.compression}</label>
                      <select
                        value={options.compression}
                        onChange={(e) => setOptions({ ...options, compression: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      >
                        <option value="low">Low (Best quality)</option>
                        <option value="medium">Medium</option>
                        <option value="high">High (Smallest size)</option>
                      </select>
                    </div>
                    {/* Color Mode */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.colorMode}</label>
                      <select
                        value={options.colorMode}
                        onChange={(e) => setOptions({ ...options, colorMode: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      >
                        <option value="rgb">RGB</option>
                        <option value="cmyk">CMYK</option>
                        <option value="grayscale">Grayscale</option>
                      </select>
                    </div>
                    {/* Password */}
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <Lock size={14} /> {t.password}
                      </label>
                      <input
                        type="password"
                        value={options.password}
                        onChange={(e) => setOptions({ ...options, password: e.target.value })}
                        placeholder="Enter password"
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                    {/* Password Confirm */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.passwordConfirm}</label>
                      <input
                        type="password"
                        value={options.passwordConfirm}
                        onChange={(e) => setOptions({ ...options, passwordConfirm: e.target.value })}
                        placeholder="Confirm password"
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                    {/* Permissions checkboxes */}
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                      <label className="block text-sm font-medium mb-2">{t.permissions}</label>
                      <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={options.permissions.print}
                            onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, print: e.target.checked } })}
                          />
                          {t.allowPrint}
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={options.permissions.copy}
                            onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, copy: e.target.checked } })}
                          />
                          {t.allowCopy}
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={options.permissions.modify}
                            onChange={(e) => setOptions({ ...options, permissions: { ...options.permissions, modify: e.target.checked } })}
                          />
                          {t.allowModify}
                        </label>
                      </div>
                    </div>
                    {/* Watermark */}
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                        <ImageIcon size={14} /> {t.watermark}
                      </label>
                      <input
                        type="text"
                        value={options.watermark}
                        onChange={(e) => setOptions({ ...options, watermark: e.target.value })}
                        placeholder="Your watermark"
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                    {/* Watermark Opacity */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.watermarkOpacity}</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={options.watermarkOpacity}
                        onChange={(e) => setOptions({ ...options, watermarkOpacity: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                    {/* Watermark Rotation */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.watermarkRotation}</label>
                      <input
                        type="number"
                        value={options.watermarkRotation}
                        onChange={(e) => setOptions({ ...options, watermarkRotation: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      />
                    </div>
                    {/* Watermark Position */}
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.watermarkPosition}</label>
                      <select
                        value={options.watermarkPosition}
                        onChange={(e) => setOptions({ ...options, watermarkPosition: e.target.value })}
                        className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800"
                      >
                        <option value="center">Center</option>
                        <option value="top">Top</option>
                        <option value="bottom">Bottom</option>
                        <option value="left">Left</option>
                        <option value="right">Right</option>
                        <option value="diagonal">Diagonal</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Merge / Split */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.merge}
                      onChange={(e) => setOptions({ ...options, merge: e.target.checked })}
                    />
                    <Combine size={16} /> {t.merge}
                  </label>
                  <label className="flex items-center gap-2">
                    <Split size={16} />
                    <input
                      type="text"
                      placeholder={t.split}
                      value={options.splitRange}
                      onChange={(e) => setOptions({ ...options, splitRange: e.target.value })}
                      className="p-1 border rounded bg-white dark:bg-gray-800 text-sm"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.splitByBookmark}
                      onChange={(e) => setOptions({ ...options, splitByBookmark: e.target.checked })}
                    />
                    <Combine size={16} /> {t.splitByBookmark}
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                {!isConverting ? (
                  <button
                    onClick={processFiles}
                    className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700"
                  >
                    {t.convert} <ArrowRight size={24} />
                  </button>
                ) : (
                  <>
                    <button
                      onClick={cancelConversion}
                      className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-bold text-lg bg-gray-300 hover:bg-gray-400 text-gray-800"
                    >
                      {t.cancel}
                    </button>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                      </div>
                      <span className="text-sm mt-1">{progress}%</span>
                    </div>
                  </>
                )}
              </div>

              {/* Share / Email / Cloud buttons after conversion */}
              {shareLink && !isConverting && (
                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    <Share2 size={18} /> {t.share}
                  </button>
                  <button onClick={handleEmail} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                    <Mail size={18} /> {t.email}
                  </button>
                  <button onClick={() => handleCloud('Google Drive')} className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">
                    <Cloud size={18} /> Google Drive
                  </button>
                  <button onClick={() => handleCloud('Dropbox')} className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600">
                    <Cloud size={18} /> Dropbox
                  </button>
                </div>
              )}
            </div>
          )}

          {/* History Section */}
          {history.length > 0 && (
            <div className="mt-8 border-t pt-4">
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
                  <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                    <span>{item.files.join(', ')} <span className="opacity-50">({item.time})</span></span>
                    <button onClick={() => downloadFromHistory(item.url)} className="text-blue-500 hover:underline flex items-center gap-1">
                      <Download size={14} /> Download
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>

      <Footer />

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-blue-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
