import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  ArrowRight, Settings, Link as LinkIcon, FileCode, Trash2,
  Plus, Sun, Moon, History, Download, Lock, Type, Image as ImageIcon,
  ChevronDown, ChevronUp, SlidersHorizontal
} from 'lucide-react';

const TOOL_TITLE = "HTML to PDF Converter";
const TOOL_DESC = "Convert any webpage or raw HTML to a high-quality PDF document instantly.";

const translations = {
  en: {
    urlTab: "URL",
    htmlTab: "Raw HTML",
    urlPlaceholder: "https://example.com",
    htmlPlaceholder: "Paste your HTML code here...",
    convert: "Convert to PDF",
    processing: "Converting...",
    options: "Conversion Options",
    advanced: "Advanced Options",
    basic: "Basic Options",
    pageSize: "Page Size",
    orientation: "Orientation",
    margins: "Margins",
    customMargins: "Custom Margins (mm)",
    scale: "Scale",
    background: "Print Background",
    headerFooter: "Header/Footer",
    headerTemplate: "Header Template",
    footerTemplate: "Footer Template",
    waitForSelector: "Wait For Selector",
    waitForTimeout: "Wait Timeout (ms)",
    watermark: "Watermark Text",
    password: "Password",
    confirmPassword: "Confirm Password",
    history: "History",
    clearHistory: "Clear History",
    success: "Conversion successful!",
    error: "Something went wrong.",
    selectPageSize: "Select page size",
    selectOrientation: "Select orientation",
    selectMargins: "Select margins",
    selectScale: "Select scale"
  },
  hi: {
    urlTab: "URL",
    htmlTab: "Raw HTML",
    urlPlaceholder: "https://example.com",
    htmlPlaceholder: "अपना HTML कोड यहाँ पेस्ट करें...",
    convert: "PDF में बदलें",
    processing: "बदल रहा है...",
    options: "कन्वर्शन विकल्प",
    advanced: "उन्नत विकल्प",
    basic: "मूल विकल्प",
    pageSize: "पेज साइज़",
    orientation: "ओरिएंटेशन",
    margins: "मार्जिन",
    customMargins: "कस्टम मार्जिन (mm)",
    scale: "स्केल",
    background: "बैकग्राउंड प्रिंट करें",
    headerFooter: "हेडर/फुटर",
    headerTemplate: "हेडर टेम्पलेट",
    footerTemplate: "फुटर टेम्पलेट",
    waitForSelector: "सेलेक्टर का इंतज़ार करें",
    waitForTimeout: "इंतज़ार समय (ms)",
    watermark: "वॉटरमार्क टेक्स्ट",
    password: "पासवर्ड",
    confirmPassword: "पासवर्ड की पुष्टि करें",
    history: "इतिहास",
    clearHistory: "इतिहास साफ़ करें",
    success: "कन्वर्शन सफल!",
    error: "कुछ गड़बड़ हुई।",
    selectPageSize: "पेज साइज़ चुनें",
    selectOrientation: "ओरिएंटेशन चुनें",
    selectMargins: "मार्जिन चुनें",
    selectScale: "स्केल चुनें"
  }
};

export default function HtmlToPdf() {
  const [mode, setMode] = useState('url');
  const [urlInput, setUrlInput] = useState('');
  const [htmlInput, setHtmlInput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [options, setOptions] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    margins: 'normal',
    customMargins: { top: 20, bottom: 20, left: 20, right: 20 },
    scale: '100',
    background: true,
    headerFooter: false,
    headerTemplate: '',
    footerTemplate: '',
    waitForSelector: '',
    waitForTimeout: '2000',
    watermark: '',
    password: '',
    confirmPassword: ''
  });

  const t = translations[lang];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_html_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_html_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    if (isConverting) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);
      return () => clearInterval(interval);
    }
  }, [isConverting]);

  const cleanUrl = (rawUrl) => {
    let clean = rawUrl.trim();
    const markdownMatch = clean.match(/\[.*?\]\((.*?)\)/);
    if (markdownMatch) clean = markdownMatch[1];
    
    // 🔥 FIX: http/https prefix add karo
    if (!/^https?:\/\//i.test(clean)) {
      clean = 'https://' + clean;
    }
    
    clean = clean.replace(/\s/g, '%20');
    return clean;
  };

  const handleConvert = async () => {
    if (mode === 'url' && !urlInput) {
      showToast(t.error, 'error');
      return;
    }
    if (mode === 'html' && !htmlInput) {
      showToast(t.error, 'error');
      return;
    }
    if (options.password && options.password !== options.confirmPassword) {
      showToast("Passwords do not match!", 'error');
      return;
    }

    setIsConverting(true);
    setProgress(0);

    try {
      const body = {
        action: 'html-to-pdf',
        fileUrl: mode === 'url' ? cleanUrl(urlInput) : '',
        htmlContent: mode === 'html' ? htmlInput : '',
        options: {
          pageSize: options.pageSize,
          orientation: options.orientation,
          margins: options.margins,
          customMargins: options.customMargins,
          scale: options.scale,
          background: options.background,
          headerFooter: options.headerFooter,
          headerTemplate: options.headerTemplate,
          footerTemplate: options.footerTemplate,
          waitForSelector: options.waitForSelector,
          waitForTimeout: options.waitForTimeout,
          watermark: options.watermark,
          password: options.password
        }
      };

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.downloadUrl) {
        const resp = await fetch(data.downloadUrl);
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `MasterPdf_Webpage.pdf`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        const newEntry = {
          time: new Date().toLocaleString(),
          source: mode === 'url' ? cleanUrl(urlInput) : 'Raw HTML',
          url: data.downloadUrl
        };
        setHistory(prev => [newEntry, ...prev].slice(0, 10));
        showToast(t.success, 'success');
      } else {
        throw new Error(data.error || 'Conversion failed');
      }
    } catch (error) {
      console.error(error);
      showToast(t.error, 'error');
    } finally {
      setIsConverting(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('masterpdf_html_history');
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

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>Convert HTML to PDF Online Free | MasterPdf</title>
        <meta name="description" content="Convert any webpage or HTML URL to a high-quality PDF document instantly. 100% Free tool by MasterPdf. Created by Suhel Ansari." />
        <meta name="keywords" content="html to pdf, webpage to pdf, url to pdf, free html to pdf converter, masterpdf, Suhel Ansari" />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{TOOL_TITLE}</h1>
          <p className="text-base sm:text-lg opacity-80">{TOOL_DESC}</p>
        </div>

        <div className="flex justify-end mb-4 gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 rounded-lg border bg-white dark:bg-gray-800">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* Sidebar */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><SlidersHorizontal size={18} /> {t.options}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageSize}</label>
                <select value={options.pageSize} onChange={(e) => setOptions({ ...options, pageSize: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                  <option value="A5">A5</option>
                  <option value="Letter">Letter</option>
                  <option value="Legal">Legal</option>
                  <option value="Tabloid">Tabloid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.orientation}</label>
                <select value={options.orientation} onChange={(e) => setOptions({ ...options, orientation: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.margins}</label>
                <select value={options.margins} onChange={(e) => setOptions({ ...options, margins: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="normal">Normal</option>
                  <option value="narrow">Narrow</option>
                  <option value="wide">Wide</option>
                  <option value="custom">Custom</option>
                </select>
              </div>

              {options.margins === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Top (mm)" value={options.customMargins.top} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, top: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                  <input type="number" placeholder="Bottom (mm)" value={options.customMargins.bottom} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, bottom: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                  <input type="number" placeholder="Left (mm)" value={options.customMargins.left} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, left: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                  <input type="number" placeholder="Right (mm)" value={options.customMargins.right} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, right: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">{t.scale}</label>
                <select value={options.scale} onChange={(e) => setOptions({ ...options, scale: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="100">100%</option>
                  <option value="80">80%</option>
                  <option value="50">50%</option>
                  <option value="120">120%</option>
                </select>
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.background} onChange={(e) => setOptions({ ...options, background: e.target.checked })} />
                {t.background}
              </label>
            </div>

            <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
              {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              {showAdvanced ? t.basic : t.advanced}
            </button>

            {showAdvanced && (
              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={options.headerFooter} onChange={(e) => setOptions({ ...options, headerFooter: e.target.checked })} />
                  {t.headerFooter}
                </label>

                {options.headerFooter && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.headerTemplate}</label>
                      <input type="text" value={options.headerTemplate} onChange={(e) => setOptions({ ...options, headerTemplate: e.target.value })} placeholder="<div>Header</div>" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">{t.footerTemplate}</label>
                      <input type="text" value={options.footerTemplate} onChange={(e) => setOptions({ ...options, footerTemplate: e.target.value })} placeholder="<div>Page {{pageNumber}} of {{totalPages}}</div>" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium mb-1">{t.waitForSelector}</label>
                  <input type="text" value={options.waitForSelector} onChange={(e) => setOptions({ ...options, waitForSelector: e.target.value })} placeholder="#content" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t.waitForTimeout}</label>
                  <input type="number" value={options.waitForTimeout} onChange={(e) => setOptions({ ...options, waitForTimeout: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Type size={14} /> {t.watermark}
                  </label>
                  <input type="text" value={options.watermark} onChange={(e) => setOptions({ ...options, watermark: e.target.value })} placeholder="Your watermark" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                    <Lock size={14} /> {t.password}
                  </label>
                  <input type="password" value={options.password} onChange={(e) => setOptions({ ...options, password: e.target.value })} placeholder="Enter password" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.confirmPassword}</label>
                  <input type="password" value={options.confirmPassword} onChange={(e) => setOptions({ ...options, confirmPassword: e.target.value })} placeholder="Confirm password" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
              </div>
            )}
          </div>

          {/* Main Area */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[450px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex gap-2 mb-6">
                <button onClick={() => setMode('url')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${mode === 'url' ? 'bg-[#E5322D] text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <LinkIcon size={18} /> {t.urlTab}
                </button>
                <button onClick={() => setMode('html')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold ${mode === 'html' ? 'bg-[#E5322D] text-white' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  <FileCode size={18} /> {t.htmlTab}
                </button>
              </div>

              {mode === 'url' ? (
                <div className="flex items-center bg-gray-50 dark:bg-gray-900 border border-gray-300 rounded-lg px-4 py-3">
                  <LinkIcon className="text-gray-400 mr-3" size={24} />
                  <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder={t.urlPlaceholder} className="w-full bg-transparent outline-none text-lg text-gray-700 dark:text-white" />
                </div>
              ) : (
                <textarea value={htmlInput} onChange={(e) => setHtmlInput(e.target.value)} placeholder={t.htmlPlaceholder} className="w-full h-64 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-white font-mono text-sm" />
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                {!isConverting ? (
                  <button onClick={handleConvert} className="flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700">
                    {t.convert} <ArrowRight size={24} />
                  </button>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-blue-500 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-sm mt-1">{t.processing} {progress}%</span>
                  </div>
                )}
              </div>
            </div>

            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <History size={18} /> {t.history}
                  </h4>
                  <button onClick={clearHistory} className="text-red-500 text-sm hover:underline">{t.clearHistory}</button>
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span>{item.source} <span className="opacity-50">({item.time})</span></span>
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

      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
