import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import {
  UploadCloud, X, ArrowRight, Settings, Trash2, Plus,
  Sun, Moon, History, Download, Copy, CheckCircle2, 
  FileCode, Image as ImageIcon, Table, Code, List,
  Type, Eye, Layout, SlidersHorizontal, Loader2,
  ChevronDown, ChevronUp, Layers, FileText, Sparkles
} from 'lucide-react';

const ACCEPTED_FORMATS = '.pdf';

const translations = {
  en: {
    title: 'PDF to Markdown Converter',
    desc: 'Convert PDFs into clean, structured Markdown with AI-powered accuracy.',
    upload: 'Drag & drop PDFs here or',
    browse: 'Browse Files',
    addMore: 'Add More PDFs',
    clearAll: 'Clear All',
    options: 'Conversion Options',
    basic: 'Basic',
    advanced: 'Advanced',
    pageRange: 'Page Range (e.g., 1-5)',
    includeHeadings: 'Include Headings (H1-H6)',
    includeLists: 'Include Lists',
    includeTables: 'Include Tables (GFM)',
    includeCodeBlocks: 'Include Code Blocks',
    includeImages: 'Extract & Embed Images',
    includeBlockquotes: 'Include Blockquotes',
    removeNoise: 'Remove Page Numbers/Headers/Footers',
    ocrEnabled: 'Enable OCR (Scanned PDFs)',
    llmEnabled: 'AI-Powered Conversion (Groq)',
    imageQuality: 'Image Quality (DPI)',
    exportMd: 'Download .md',
    exportHtml: 'Download .html',
    exportDocx: 'Export Word (.docx)',
    copyMarkdown: 'Copy Markdown',
    livePreview: 'Live Preview',
    conversionHistory: 'History',
    clearHistory: 'Clear History',
    success: 'Conversion successful!',
    error: 'Something went wrong.',
    noFiles: 'Please add at least one PDF.',
    invalidType: 'Invalid file type. Only PDF allowed.',
    tooLarge: 'File too large. Max 100 MB.'
  },
  hi: {
    title: 'PDF से Markdown कन्वर्टर',
    desc: 'AI-संचालित सटीकता के साथ PDF को साफ, संरचित Markdown में बदलें।',
    upload: 'PDF यहाँ खींचें या',
    browse: 'फ़ाइलें चुनें',
    addMore: 'और PDF जोड़ें',
    clearAll: 'सभी हटाएँ',
    options: 'कन्वर्शन विकल्प',
    basic: 'मूल',
    advanced: 'उन्नत',
    pageRange: 'पेज रेंज (जैसे 1-5)',
    includeHeadings: 'शीर्षक शामिल करें (H1-H6)',
    includeLists: 'सूचियाँ शामिल करें',
    includeTables: 'तालिकाएँ शामिल करें (GFM)',
    includeCodeBlocks: 'कोड ब्लॉक शामिल करें',
    includeImages: 'छवियाँ निकालें और एम्बेड करें',
    includeBlockquotes: 'ब्लॉककोट शामिल करें',
    removeNoise: 'पेज नंबर/हेडर/फुटर हटाएँ',
    ocrEnabled: 'OCR सक्षम करें (स्कैन की गई PDF)',
    llmEnabled: 'AI-संचालित रूपांतरण (Groq)',
    imageQuality: 'छवि गुणवत्ता (DPI)',
    exportMd: '.md डाउनलोड करें',
    exportHtml: '.html डाउनलोड करें',
    exportDocx: 'Word निर्यात (.docx)',
    copyMarkdown: 'Markdown कॉपी करें',
    livePreview: 'लाइव प्रीव्यू',
    conversionHistory: 'इतिहास',
    clearHistory: 'इतिहास साफ़ करें',
    success: 'कन्वर्शन सफल!',
    error: 'कुछ गड़बड़ हुई।',
    noFiles: 'कृपया कम से कम एक PDF जोड़ें।',
    invalidType: 'अमान्य फ़ाइल प्रकार। केवल PDF की अनुमति है।',
    tooLarge: 'फ़ाइल बहुत बड़ी है। अधिकतम 100 MB।'
  }
};

export default function PdfToMarkdown() {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [markdown, setMarkdown] = useState('');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [options, setOptions] = useState({
    pageRange: '',
    includeHeadings: true,
    includeLists: true,
    includeTables: true,
    includeCodeBlocks: true,
    includeImages: true,
    includeBlockquotes: true,
    removeNoise: true,
    ocrEnabled: false,
    llmEnabled: true,
    imageQuality: 150
  });

  const fileInputRef = useRef(null);
  const t = translations[lang];

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // History
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_md_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_md_history', JSON.stringify(history));
  }, [history]);

  // File handling
  const validateFile = (file) => {
    if (file.type !== 'application/pdf') {
      showToast(t.invalidType, 'error');
      return false;
    }
    if (file.size > 100 * 1024 * 1024) {
      showToast(t.tooLarge, 'error');
      return false;
    }
    return true;
  };

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(validateFile);
    if (valid.length) {
      setFiles(prev => [...prev, ...valid]);
      setMarkdown('');
    }
  };

  const handleFileChange = (e) => {
    addFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(Array.from(e.dataTransfer.files));
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setFiles([]);
    setMarkdown('');
  };

  // Conversion
  const processFiles = async () => {
    if (files.length === 0) return showToast(t.noFiles, 'error');
    setIsProcessing(true);
    setProgress(0);
    setMarkdown('');

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);

      const uploadedUrls = [];
      for (const file of files) {
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
        uploadedUrls.push(blob.url);
      }

      const body = {
        action: 'pdf-to-markdown',
        fileUrls: uploadedUrls,
        options: {
          pageRange: options.pageRange,
          includeHeadings: options.includeHeadings,
          includeLists: options.includeLists,
          includeTables: options.includeTables,
          includeCodeBlocks: options.includeCodeBlocks,
          includeImages: options.includeImages,
          includeBlockquotes: options.includeBlockquotes,
          removeNoise: options.removeNoise,
          ocrEnabled: options.ocrEnabled,
          llmEnabled: options.llmEnabled,
          imageQuality: options.imageQuality
        }
      };

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.markdown) {
        setMarkdown(data.markdown);

        const newEntry = {
          time: new Date().toLocaleString(),
          files: files.map(f => f.name)
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
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // Copy markdown
  const copyMarkdown = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download .md
  const downloadMarkdown = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download .html
  const downloadHtml = async () => {
    if (!markdown) return;
    const { marked } = await import('marked');
    const html = marked.parse(markdown);
    const fullHtml = `<!DOCTYPE html><html><head><title>Converted Markdown</title></head><body>${html}</body></html>`;
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export .docx
  const exportDocx = async () => {
    if (!markdown) return;
    const { Document, Packer, Paragraph, HeadingLevel } = await import('docx');
    const lines = markdown.split('\n');
    const doc = new Document({
      sections: [{
        children: lines.map(line => {
          if (line.startsWith('### ')) return new Paragraph({ text: line.slice(4), heading: HeadingLevel.HEADING_3 });
          if (line.startsWith('## ')) return new Paragraph({ text: line.slice(3), heading: HeadingLevel.HEADING_2 });
          if (line.startsWith('# ')) return new Paragraph({ text: line.slice(2), heading: HeadingLevel.HEADING_1 });
          return new Paragraph({ text: line });
        })
      }]
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'converted.docx';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Live preview render
  const renderPreview = () => {
    if (!markdown) return null;
    // Simple markdown renderer (avoid heavy lib, just basic)
    const lines = markdown.split('\n');
    return lines.map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-bold">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-bold">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-bold">{line.slice(2)}</h1>;
      if (line.startsWith('- ')) return <li key={i} className="ml-4">{line.slice(2)}</li>;
      if (line.trim() === '') return <div key={i} className="h-2"></div>;
      return <p key={i}>{line}</p>;
    });
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>{t.title} | MasterPdf</title>
        <meta name="description" content="Convert PDF to Markdown online with AI. Preserve headings, tables, lists, images, and more." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-base sm:text-lg opacity-80">{t.desc}</p>
        </div>

        <div className="flex justify-end mb-4 gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
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
              {/* Basic options */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageRange}</label>
                <input type="text" value={options.pageRange} onChange={(e) => setOptions({ ...options, pageRange: e.target.value })} placeholder="1-5, 8" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.includeHeadings} onChange={(e) => setOptions({ ...options, includeHeadings: e.target.checked })} />
                <Type size={14} /> {t.includeHeadings}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.includeLists} onChange={(e) => setOptions({ ...options, includeLists: e.target.checked })} />
                <List size={14} /> {t.includeLists}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.includeTables} onChange={(e) => setOptions({ ...options, includeTables: e.target.checked })} />
                <Table size={14} /> {t.includeTables}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.includeCodeBlocks} onChange={(e) => setOptions({ ...options, includeCodeBlocks: e.target.checked })} />
                <Code size={14} /> {t.includeCodeBlocks}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.includeImages} onChange={(e) => setOptions({ ...options, includeImages: e.target.checked })} />
                <ImageIcon size={14} /> {t.includeImages}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.includeBlockquotes} onChange={(e) => setOptions({ ...options, includeBlockquotes: e.target.checked })} />
                <Layers size={14} /> {t.includeBlockquotes}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.removeNoise} onChange={(e) => setOptions({ ...options, removeNoise: e.target.checked })} />
                <FileText size={14} /> {t.removeNoise}
              </label>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAdvanced ? 'Hide' : 'Advanced'}
              </button>

              {showAdvanced && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.ocrEnabled} onChange={(e) => setOptions({ ...options, ocrEnabled: e.target.checked })} />
                    <Sparkles size={14} /> {t.ocrEnabled}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.llmEnabled} onChange={(e) => setOptions({ ...options, llmEnabled: e.target.checked })} />
                    <Sparkles size={14} /> {t.llmEnabled}
                  </label>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.imageQuality}</label>
                    <select value={options.imageQuality} onChange={(e) => setOptions({ ...options, imageQuality: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                      <option value="72">72 DPI</option>
                      <option value="150">150 DPI</option>
                      <option value="300">300 DPI</option>
                      <option value="600">600 DPI</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[500px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* Upload area */}
              {files.length === 0 ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex-1 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center"
                >
                  <input type="file" accept={ACCEPTED_FORMATS} multiple onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                  <UploadCloud size={48} className="text-blue-500 mb-3" />
                  <p className="text-lg font-semibold">{t.upload}</p>
                  <button onClick={() => fileInputRef.current.click()} className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold mt-4">{t.browse}</button>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg">
                      <Plus size={18} /> {t.addMore}
                    </button>
                    <button onClick={clearAll} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                      <Trash2 size={16} /> {t.clearAll}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50 dark:bg-gray-700">
                        <div className="flex items-center gap-2">
                          <FileText size={20} className="text-[#E5322D]" />
                          <span className="font-semibold text-sm">{file.name}</span>
                        </div>
                        <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500"><X size={18} /></button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={processFiles}
                    disabled={isProcessing}
                    className="mt-6 w-full py-4 bg-[#E5322D] text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" size={24} /> {progress}%</> : <>Convert to Markdown <ArrowRight size={24} /></>}
                  </button>
                </div>
              )}
            </div>

            {/* Output */}
            {markdown && (
              <div className="mt-6 rounded-2xl border shadow-sm overflow-hidden bg-white dark:bg-gray-800">
                <div className="flex flex-wrap justify-between items-center p-3 border-b bg-gray-50 dark:bg-gray-700">
                  <h3 className="font-bold flex items-center gap-2"><FileCode size={18} /> Output</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setShowPreview(!showPreview)} className="px-2 py-1 text-xs bg-gray-200 rounded flex items-center gap-1">
                      <Eye size={14} /> {t.livePreview}
                    </button>
                    <button onClick={copyMarkdown} className="px-2 py-1 text-xs bg-blue-500 text-white rounded flex items-center gap-1">
                      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />} {t.copyMarkdown}
                    </button>
                    <button onClick={downloadMarkdown} className="px-2 py-1 text-xs bg-green-500 text-white rounded flex items-center gap-1">
                      <Download size={14} /> {t.exportMd}
                    </button>
                    <button onClick={downloadHtml} className="px-2 py-1 text-xs bg-yellow-500 text-white rounded flex items-center gap-1">
                      <Download size={14} /> {t.exportHtml}
                    </button>
                    <button onClick={exportDocx} className="px-2 py-1 text-xs bg-indigo-500 text-white rounded flex items-center gap-1">
                      <Download size={14} /> {t.exportDocx}
                    </button>
                  </div>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  {showPreview ? (
                    <div className="prose prose-sm max-w-none">{renderPreview()}</div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm font-mono">{markdown}</pre>
                  )}
                </div>
              </div>
            )}

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-bold flex items-center gap-2"><History size={18} /> {t.conversionHistory}</h4>
                <button onClick={() => setHistory([])} className="text-red-500 text-sm underline ml-2">{t.clearHistory}</button>
                <ul className="space-y-2 mt-2">
                  {history.map((item, idx) => (
                    <li key={idx} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">{item.files.join(', ')} <span className="opacity-50">({item.time})</span></li>
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
