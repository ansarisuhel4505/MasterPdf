import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import {
  UploadCloud, FileText, X, ArrowRight, Settings, Trash2,
  Plus, ChevronDown, ChevronUp, History, Sun, Moon, Lock, Palette,
  Combine, Split, Cloud, Mail, Share2, Download, SlidersHorizontal, Type
} from 'lucide-react';

const TOOL_TITLE = "Excel to PDF Converter";
const TOOL_DESC = "Convert your Excel spreadsheets (XLS, XLSX) to PDF with advanced options.";
const ACTION_NAME = "excel-to-pdf";
const ACCEPT_FORMAT = ".xls,.xlsx";
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// i18n dictionary (English + Hindi)
const translations = {
  en: {
    drag: "Drag & drop Excel files here",
    or: "or",
    browse: "Browse Files",
    convert: "Convert to PDF",
    processing: "Processing...",
    cancel: "Cancel",
    clearAll: "Clear All",
    options: "Conversion Options",
    advanced: "Advanced Options",
    basic: "Basic Options",
    pageSize: "Page Size",
    orientation: "Orientation",
    margins: "Margins",
    customMargins: "Custom Margins (mm)",
    scaling: "Scaling",
    fitToWidth: "Fit to Width",
    fitToOnePage: "Fit to 1 Page",
    gridlines: "Show Gridlines",
    repeatHeader: "Repeat Header Rows",
    sheetSelection: "Sheet Selection (e.g., Sheet1,Sheet2 or All)",
    quality: "Quality / DPI",
    password: "Password Protection",
    passwordConfirm: "Confirm Password",
    watermark: "Watermark Text",
    watermarkColor: "Watermark Color",
    watermarkFontSize: "Watermark Font Size",
    watermarkOpacity: "Watermark Opacity",
    watermarkRotation: "Rotation",
    watermarkPosition: "Position",
    merge: "Merge all files into one PDF",
    splitSheets: "Split each sheet into separate PDF",
    compress: "Compress to target size",
    compressSize: "Target Size",
    compressUnit: "Unit",
    share: "Share Link",
    email: "Email Result",
    history: "History",
    clearHistory: "Clear History",
    success: "Conversion successful!",
    error: "Something went wrong. Please try again.",
    invalidType: "Invalid file type. Only .xls and .xlsx allowed.",
    tooLarge: "File too large. Max size is 50 MB.",
    selectedCount: "Selected",
    addMore: "Add More Files"
  },
  hi: {
    drag: "Excel फ़ाइलें यहाँ खींचें और छोड़ें",
    or: "या",
    browse: "फ़ाइलें ब्राउज़ करें",
    convert: "PDF में कन्वर्ट करें",
    processing: "प्रोसेस हो रहा है...",
    cancel: "रद्द करें",
    clearAll: "सभी हटाएँ",
    options: "कन्वर्शन विकल्प",
    advanced: "उन्नत विकल्प",
    basic: "मूल विकल्प",
    pageSize: "पेज साइज़",
    orientation: "ओरिएंटेशन",
    margins: "मार्जिन",
    customMargins: "कस्टम मार्जिन (mm)",
    scaling: "स्केलिंग",
    fitToWidth: "चौड़ाई में फिट करें",
    fitToOnePage: "एक पेज में फिट करें",
    gridlines: "ग्रिडलाइन दिखाएँ",
    repeatHeader: "हेडर पंक्तियाँ दोहराएँ",
    sheetSelection: "शीट चयन (जैसे Sheet1,Sheet2 या All)",
    quality: "गुणवत्ता / DPI",
    password: "पासवर्ड सुरक्षा",
    passwordConfirm: "पासवर्ड की पुष्टि करें",
    watermark: "वॉटरमार्क टेक्स्ट",
    watermarkColor: "वॉटरमार्क रंग",
    watermarkFontSize: "वॉटरमार्क फ़ॉन्ट साइज़",
    watermarkOpacity: "वॉटरमार्क अपारदर्शिता",
    watermarkRotation: "रोटेशन",
    watermarkPosition: "स्थिति",
    merge: "सभी फ़ाइलों को एक PDF में मर्ज करें",
    splitSheets: "प्रत्येक शीट को अलग PDF में विभाजित करें",
    compress: "टारगेट साइज़ में कंप्रेस करें",
    compressSize: "टारगेट साइज़",
    compressUnit: "इकाई",
    share: "लिंक साझा करें",
    email: "ईमेल पर भेजें",
    history: "इतिहास",
    clearHistory: "इतिहास साफ़ करें",
    success: "कन्वर्शन सफल!",
    error: "कुछ गड़बड़ हुई।",
    invalidType: "अमान्य फ़ाइल प्रकार। केवल .xls और .xlsx की अनुमति है।",
    tooLarge: "फ़ाइल बहुत बड़ी है। अधिकतम 50 MB है।",
    selectedCount: "चयनित",
    addMore: "और फ़ाइलें जोड़ें"
  }
};

export default function ExcelToPdf() {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [options, setOptions] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    margins: 'normal',
    customMargins: { top: 20, bottom: 20, left: 20, right: 20 },
    scaling: '100',
    fitToWidth: false,
    fitToOnePage: false,
    gridlines: true,
    repeatHeader: false,
    sheetSelection: '',
    quality: 'high',
    password: '',
    passwordConfirm: '',
    watermark: '',
    watermarkColor: '#000000',
    watermarkFontSize: '24',
    watermarkOpacity: 50,
    watermarkRotation: 45,
    watermarkPosition: 'center',
    merge: false,
    splitSheets: false,
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
    if (!['xls', 'xlsx'].includes(ext)) {
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
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload'
        });
        uploadedUrls.push(blob.url);
      }

      const body = {
        action: ACTION_NAME,
        fileUrls: uploadedUrls,
        options: {
          pageSize: options.pageSize,
          orientation: options.orientation,
          margins: options.margins,
          customMargins: options.customMargins,
          scaling: options.scaling,
          fitToWidth: options.fitToWidth,
          fitToOnePage: options.fitToOnePage,
          gridlines: options.gridlines,
          repeatHeader: options.repeatHeader,
          sheetSelection: options.sheetSelection,
          quality: options.quality,
          password: options.password,
          watermark: options.watermark,
          watermarkColor: options.watermarkColor,
          watermarkFontSize: options.watermarkFontSize,
          watermarkOpacity: options.watermarkOpacity,
          watermarkRotation: options.watermarkRotation,
          watermarkPosition: options.watermarkPosition,
          merge: options.merge,
          splitSheets: options.splitSheets,
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
          setShareLink(data.downloadUrls[0]);
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

  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_history_excel');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_history_excel', JSON.stringify(history));
  }, [history]);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('masterpdf_history_excel');
  };

  const downloadFromHistory = (url) => {
    window.open(url, '_blank');
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
        <title>Convert Excel to PDF Online Free | MasterPdf</title>
        <meta name="description" content="Fastest and most secure way to convert Excel (XLS, XLSX) to PDF online. 100% Free. Try MasterPdf created by Suhel Ansari." />
        <meta name="keywords" content="excel to pdf, convert xls to pdf, xlsx to pdf, free excel to pdf converter, masterpdf, Suhel Ansari" />
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
              {/* Page Size */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageSize}</label>
                <select
                  value={options.pageSize}
                  onChange={(e) => setOptions({ ...options, pageSize: e.target.value })}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
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
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
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
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                >
                  <option value="normal">Normal</option>
                  <option value="narrow">Narrow</option>
                  <option value="wide">Wide</option>
                  <option value="custom">Custom</option>
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
              {/* Scaling */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.scaling}</label>
                <select
                  value={options.scaling}
                  onChange={(e) => setOptions({ ...options, scaling: e.target.value })}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                >
                  <option value="100">100%</option>
                  <option value="90">90%</option>
                  <option value="75">75%</option>
                  <option value="50">50%</option>
                  <option value="fit">Fit to Width</option>
                  <option value="1page">Fit to 1 Page</option>
                </select>
              </div>
              {/* Fit to Width / 1 Page checkboxes (if not already in scaling) */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.fitToWidth}
                  onChange={(e) => setOptions({ ...options, fitToWidth: e.target.checked })}
                />
                {t.fitToWidth}
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.fitToOnePage}
                  onChange={(e) => setOptions({ ...options, fitToOnePage: e.target.checked })}
                />
                {t.fitToOnePage}
              </label>
              {/* Gridlines */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.gridlines}
                  onChange={(e) => setOptions({ ...options, gridlines: e.target.checked })}
                />
                {t.gridlines}
              </label>
              {/* Repeat Header */}
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={options.repeatHeader}
                  onChange={(e) => setOptions({ ...options, repeatHeader: e.target.checked })}
                />
                {t.repeatHeader}
              </label>
              {/* Sheet Selection */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.sheetSelection}</label>
                <input
                  type="text"
                  value={options.sheetSelection}
                  onChange={(e) => setOptions({ ...options, sheetSelection: e.target.value })}
                  placeholder="All or Sheet1,Sheet2"
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                />
              </div>
              {/* Quality / DPI */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.quality}</label>
                <select
                  value={options.quality}
                  onChange={(e) => setOptions({ ...options, quality: e.target.value })}
                  className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                >
                  <option value="high">High (300 DPI)</option>
                  <option value="medium">Medium (150 DPI)</option>
                  <option value="low">Low (72 DPI)</option>
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
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.passwordConfirm}</label>
                  <input
                    type="password"
                    value={options.passwordConfirm}
                    onChange={(e) => setOptions({ ...options, passwordConfirm: e.target.value })}
                    placeholder="Confirm password"
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  />
                </div>
                {/* Watermark */}
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermark}</label>
                  <input
                    type="text"
                    value={options.watermark}
                    onChange={(e) => setOptions({ ...options, watermark: e.target.value })}
                    placeholder="Your watermark"
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Palette size={14} /> {t.watermarkColor}
                  </label>
                  <input
                    type="color"
                    value={options.watermarkColor}
                    onChange={(e) => setOptions({ ...options, watermarkColor: e.target.value })}
                    className="w-full p-1 border rounded bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermarkFontSize}</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={options.watermarkFontSize}
                    onChange={(e) => setOptions({ ...options, watermarkFontSize: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermarkOpacity}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={options.watermarkOpacity}
                    onChange={(e) => setOptions({ ...options, watermarkOpacity: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermarkRotation}</label>
                  <input
                    type="number"
                    value={options.watermarkRotation}
                    onChange={(e) => setOptions({ ...options, watermarkRotation: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.watermarkPosition}</label>
                  <select
                    value={options.watermarkPosition}
                    onChange={(e) => setOptions({ ...options, watermarkPosition: e.target.value })}
                    className="w-full p-2 border rounded bg-white dark:bg-gray-900"
                  >
                    <option value="center">Center</option>
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="diagonal">Diagonal</option>
                  </select>
                </div>
                {/* Compress */}
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={options.compress}
                      onChange={(e) => setOptions({ ...options, compress: e.target.checked })}
                    />
                    {t.compress}
                  </label>
                  {options.compress && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        min="1"
                        placeholder={t.compressSize}
                        value={options.compressSize}
                        onChange={(e) => setOptions({ ...options, compressSize: e.target.value })}
                        className="p-2 border rounded bg-white dark:bg-gray-900 flex-1"
                      />
                      <select
                        value={options.compressUnit}
                        onChange={(e) => setOptions({ ...options, compressUnit: e.target.value })}
                        className="p-2 border rounded bg-white dark:bg-gray-900"
                      >
                        <option value="KB">KB</option>
                        <option value="MB">MB</option>
                      </select>
                    </div>
                  )}
                </div>
                {/* Merge */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.merge}
                    onChange={(e) => setOptions({ ...options, merge: e.target.checked })}
                  />
                  <Combine size={16} /> {t.merge}
                </label>
                {/* Split Sheets */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={options.splitSheets}
                    onChange={(e) => setOptions({ ...options, splitSheets: e.target.checked })}
                  />
                  <Split size={16} /> {t.splitSheets}
                </label>
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
                  <span className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-red-700 transition">
                    {t.browse}
                  </span>
                </label>
                <p className="text-xs mt-3 opacity-60">Max 50 MB per file</p>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600"
                    >
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

                  {/* Share / Email / Cloud */}
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
            </div>

            {/* History */}
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
