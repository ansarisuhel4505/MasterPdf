import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import {
  UploadCloud, FileText, X, Sparkles, Settings, Copy, CheckCircle2,
  Download, Trash2, Plus, Sun, Moon, History, MessageCircle, Send,
  Type, List, FileCode, FileSpreadsheet, Presentation, File as FileIcon,
  Volume2, AlertTriangle, Loader2, SlidersHorizontal, ChevronDown, ChevronUp,
  Target, Hash, StickyNote, Languages, BarChart3, ThumbsUp, ThumbsDown, Minus
} from 'lucide-react';
import { jsPDF } from 'jspdf'; // Ensure jspdf is installed (if not, remove this export)
// Or use pdf-lib for PDF generation. Let's use pdf-lib since it's already installed.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import pptxgen from 'pptxgenjs';

const ACCEPTED_FORMATS = '.pdf';

// i18n translations
const translations = {
  en: {
    fileUpload: "Drag & drop PDF files here or",
    browse: "Browse Files",
    options: "Summarizer Options",
    basic: "Basic",
    advanced: "Advanced",
    length: "Summary Length",
    short: "Short (3-5 bullets)",
    medium: "Medium (1 paragraph)",
    long: "Long (2-3 paragraphs)",
    type: "Summary Type",
    bullet: "Bullet Points",
    paragraph: "Paragraph",
    executive: "Executive Summary",
    language: "Language",
    pageRange: "Page Range (e.g., 1-5)",
    includeMetrics: "Include Key Metrics",
    sectionSummary: "Section-wise Summary",
    highlight: "Highlight Important Sentences",
    keywords: "Extract Keywords",
    actionItems: "Action Items Detection",
    tone: "Tone",
    formal: "Formal",
    casual: "Casual",
    technical: "Technical",
    simple: "Simple",
    sentiment: "Sentiment Analysis",
    confidence: "Confidence Score",
    citation: "Citation Mapping",
    chat: "Ask Follow-up",
    generate: "Generate Summary",
    processing: "Analyzing...",
    copy: "Copy Text",
    copied: "Copied!",
    downloadTxt: "Download .txt",
    downloadMd: "Download .md",
    exportWord: "Export to Word",
    exportPdf: "Export to PDF",
    exportPpt: "Export to PPT",
    audio: "Listen (TTS)",
    stopAudio: "Stop",
    summaryOutput: "AI Summary Result",
    noSummary: "Click 'Generate Summary' to extract key insights.",
    error: "Something went wrong. Please try again.",
    invalidFile: "Please upload a valid PDF file.",
    history: "History",
    clearHistory: "Clear History",
    darkMode: "Dark Mode"
  },
  hi: {
    fileUpload: "PDF फ़ाइलें यहाँ खींचें या",
    browse: "फ़ाइलें चुनें",
    options: "समरीकरण विकल्प",
    basic: "मूल",
    advanced: "उन्नत",
    length: "समरी लंबाई",
    short: "छोटी (3-5 बुलेट्स)",
    medium: "मध्यम (1 पैराग्राफ)",
    long: "लंबी (2-3 पैराग्राफ)",
    type: "समरी प्रकार",
    bullet: "बुलेट पॉइंट्स",
    paragraph: "पैराग्राफ",
    executive: "कार्यकारी समरी",
    language: "भाषा",
    pageRange: "पेज रेंज (जैसे 1-5)",
    includeMetrics: "मुख्य मेट्रिक्स शामिल करें",
    sectionSummary: "सेक्शन-वार समरी",
    highlight: "महत्वपूर्ण वाक्य हाइलाइट करें",
    keywords: "कीवर्ड निकालें",
    actionItems: "कार्य आइटम पहचानें",
    tone: "स्वर",
    formal: "औपचारिक",
    casual: "अनौपचारिक",
    technical: "तकनीकी",
    simple: "सरल",
    sentiment: "भावना विश्लेषण",
    confidence: "विश्वास स्कोर",
    citation: "उद्धरण मैपिंग",
    chat: "प्रश्न पूछें",
    generate: "समरी बनाएं",
    processing: "विश्लेषण हो रहा है...",
    copy: "टेक्स्ट कॉपी करें",
    copied: "कॉपी हो गया!",
    downloadTxt: ".txt डाउनलोड करें",
    downloadMd: ".md डाउनलोड करें",
    exportWord: "Word में निर्यात करें",
    exportPdf: "PDF में निर्यात करें",
    exportPpt: "PPT में निर्यात करें",
    audio: "सुनें (TTS)",
    stopAudio: "रोकें",
    summaryOutput: "AI समरी परिणाम",
    noSummary: "समरी बनाने के लिए 'Generate Summary' पर क्लिक करें।",
    error: "कुछ गड़बड़ हुई। कृपया पुनः प्रयास करें।",
    invalidFile: "कृपया एक मान्य PDF फ़ाइल अपलोड करें।",
    history: "इतिहास",
    clearHistory: "इतिहास साफ़ करें",
    darkMode: "डार्क मोड"
  }
};

export default function AiSummarizer() {
  const [files, setFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [summaryMeta, setSummaryMeta] = useState({});
  const [options, setOptions] = useState({
    length: 'medium',
    type: 'bullet',
    language: 'en',
    pageRange: '',
    includeMetrics: false,
    sectionSummary: false,
    highlight: false,
    keywords: false,
    actionItems: false,
    tone: 'formal',
    sentiment: false,
    confidence: false,
    citation: false,
    noiseReduction: false
  });

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const t = translations[lang];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // History load/save
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_ai_summary_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_ai_summary_history', JSON.stringify(history));
  }, [history]);

  // File validation
  const validateFile = (file) => {
    if (file.type !== 'application/pdf') {
      showToast(t.invalidFile, 'error');
      return false;
    }
    return true;
  };

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(f => validateFile(f));
    if (valid.length) {
      setFiles(prev => [...prev, ...valid]);
      setSummary('');
      setChatResponse('');
      setSummaryMeta({});
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
    setSummary('');
    setChatResponse('');
  };

  const clearAll = () => {
    setFiles([]);
    setSummary('');
    setChatResponse('');
    setSummaryMeta({});
  };

  // Simulate progress
  const startProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  };

  // Main summarize function
  const generateSummary = async () => {
    if (files.length === 0) {
      showToast(t.error, 'error');
      return;
    }
    setIsProcessing(true);
    setSummary('');
    setChatResponse('');
    const clearProgress = startProgress();

    try {
      // Upload all files
      const uploadedUrls = [];
      for (const file of files) {
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
        uploadedUrls.push(blob.url);
      }
      setFileUrls(uploadedUrls);

      // Prepare request body with options
      const body = {
        action: 'ai-summarizer',
        fileUrls: uploadedUrls,
        options: {
          length: options.length,
          type: options.type,
          language: options.language,
          pageRange: options.pageRange,
          includeMetrics: options.includeMetrics,
          sectionSummary: options.sectionSummary,
          highlight: options.highlight,
          keywords: options.keywords,
          actionItems: options.actionItems,
          tone: options.tone,
          sentiment: options.sentiment,
          confidence: options.confidence,
          citation: options.citation,
          noiseReduction: options.noiseReduction
        }
      };

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.textResult) {
        setSummary(data.textResult);
        setSummaryMeta(data.meta || {});
        // Add to history
        const newEntry = {
          time: new Date().toLocaleString(),
          files: files.map(f => f.name),
          url: data.downloadUrl
        };
        setHistory(prev => [newEntry, ...prev].slice(0, 10));
        showToast('Summary generated!');
      } else {
        throw new Error(data.error || 'Summarization failed');
      }
    } catch (error) {
      console.error(error);
      showToast(t.error, 'error');
      // Fallback for testing (remove when backend ready)
      setSummary("Simulated summary: This is a placeholder. Please integrate AI backend to see real results.");
    } finally {
      clearProgress();
      setIsProcessing(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // Chat with document
  const handleChat = async () => {
    if (!chatMessage.trim() || fileUrls.length === 0) return;
    setIsChatLoading(true);
    try {
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-doc-chat',
          fileUrls: fileUrls,
          question: chatMessage,
          options: { language: options.language }
        })
      });
      const data = await response.json();
      if (response.ok && data.textResult) {
        setChatResponse(data.textResult);
      } else {
        setChatResponse("AI could not answer. Try another question.");
      }
    } catch (error) {
      setChatResponse("Error connecting to AI.");
    }
    setIsChatLoading(false);
    setChatMessage('');
  };

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as .txt / .md
  const downloadText = (format) => {
    const mime = format === 'md' ? 'text/markdown' : 'text/plain';
    const ext = format === 'md' ? 'md' : 'txt';
    const blob = new Blob([summary], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `summary.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to Word (.docx)
  const exportToWord = async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'AI Summary', heading: HeadingLevel.HEADING_1 }),
          ...summary.split('\n').map(line => new Paragraph({ text: line }))
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'summary.docx';
    link.click();
    URL.revokeObjectURL(url);
  };

 // Export to PDF using pdf-lib
  const exportToPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    // 🔥 FIX: 'const' ki jagah 'let' lagaya hai yahan
    let page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const lines = summary.split('\n');
    let y = 750;
    for (const line of lines) {
      if (y < 50) {
        page = pdfDoc.addPage([600, 800]);
        y = 750;
      }
      page.drawText(line, { x: 50, y, size: 12, font, color: rgb(0, 0, 0) });
      y -= 20;
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'summary.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to PowerPoint using pptxgenjs
  const exportToPpt = async () => {
    const pptx = new pptxgen();
    pptx.defineLayout({ name: 'A4', width: 10, height: 7.5 });
    pptx.layout = 'A4';
    const slide = pptx.addSlide();
    slide.addText('AI Summary', { x: 1, y: 0.5, w: 8, h: 1, fontSize: 24, bold: true });
    slide.addText(summary, { x: 1, y: 1.5, w: 8, h: 5, fontSize: 12 });
    await pptx.writeFile({ fileName: 'summary.pptx' });
  };

  // Text-to-Speech
  const speak = () => {
    if (!summary) return;
    if (isAudioPlaying) {
      window.speechSynthesis.cancel();
      setIsAudioPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(summary);
    utterance.lang = options.language || 'en';
    utterance.onend = () => setIsAudioPlaying(false);
    window.speechSynthesis.speak(utterance);
    setIsAudioPlaying(true);
  };

  // Render summary with formatting (simple)
  const renderSummary = () => {
    if (!summary) return <div className="text-gray-400">{t.noSummary}</div>;
    // If summary type is bullet, show as list
    if (options.type === 'bullet') {
      return (
        <ul className="list-disc pl-5 space-y-2">
          {summary.split('\n').map((line, idx) => (
            <li key={idx}>{line}</li>
          ))}
        </ul>
      );
    }
    return <div className="whitespace-pre-wrap">{summary}</div>;
  };

  // UI
  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>AI PDF Summarizer Online Free | MasterPdf</title>
        <meta name="description" content="Summarize PDF documents, articles, and essays instantly using AI. Get key insights and bullet points for free." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Sparkles size={14} /> AI Powered
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">AI PDF Summarizer</h1>
          <p className="text-base sm:text-lg opacity-80">Summarize PDFs with advanced AI options</p>
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
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* Sidebar - Options */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><SlidersHorizontal size={18} /> {t.options}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.length}</label>
                <select value={options.length} onChange={(e) => setOptions({ ...options, length: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="short">{t.short}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="long">{t.long}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.type}</label>
                <select value={options.type} onChange={(e) => setOptions({ ...options, type: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="bullet">{t.bullet}</option>
                  <option value="paragraph">{t.paragraph}</option>
                  <option value="executive">{t.executive}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.language}</label>
                <select value={options.language} onChange={(e) => setOptions({ ...options, language: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.pageRange}</label>
                <input type="text" value={options.pageRange} onChange={(e) => setOptions({ ...options, pageRange: e.target.value })} placeholder="e.g., 1-5" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAdvanced ? 'Basic' : 'Advanced'}
              </button>

              {showAdvanced && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.includeMetrics} onChange={(e) => setOptions({ ...options, includeMetrics: e.target.checked })} />
                    <Target size={16} /> {t.includeMetrics}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.sectionSummary} onChange={(e) => setOptions({ ...options, sectionSummary: e.target.checked })} />
                    <StickyNote size={16} /> {t.sectionSummary}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.highlight} onChange={(e) => setOptions({ ...options, highlight: e.target.checked })} />
                    <Type size={16} /> {t.highlight}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.keywords} onChange={(e) => setOptions({ ...options, keywords: e.target.checked })} />
                    <Hash size={16} /> {t.keywords}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.actionItems} onChange={(e) => setOptions({ ...options, actionItems: e.target.checked })} />
                    <List size={16} /> {t.actionItems}
                  </label>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.tone}</label>
                    <select value={options.tone} onChange={(e) => setOptions({ ...options, tone: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                      <option value="formal">{t.formal}</option>
                      <option value="casual">{t.casual}</option>
                      <option value="technical">{t.technical}</option>
                      <option value="simple">{t.simple}</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.sentiment} onChange={(e) => setOptions({ ...options, sentiment: e.target.checked })} />
                    <BarChart3 size={16} /> {t.sentiment}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.confidence} onChange={(e) => setOptions({ ...options, confidence: e.target.checked })} />
                    <FileCode size={16} /> {t.confidence}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.citation} onChange={(e) => setOptions({ ...options, citation: e.target.checked })} />
                    <FileIcon size={16} /> {t.citation}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.noiseReduction} onChange={(e) => setOptions({ ...options, noiseReduction: e.target.checked })} />
                    <AlertTriangle size={16} /> Noise Reduction
                  </label>
                </div>
              )}
            </div>
          </div>

         {/* Main Area */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[500px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              
              {/* 🔥 FIX: Input ko condition se bahar nikala aur ID add ki taaki label kaam kare */}
              <input id="ai-file-upload" type="file" accept={ACCEPTED_FORMATS} onChange={handleFileChange} multiple className="hidden" ref={fileInputRef} />

              {/* File upload */}
              {files.length === 0 ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition ${darkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-500'}`}
                >
                  {/* 🔥 FIX: label ka htmlFor theek kiya */}
                  <label htmlFor="ai-file-upload" className="cursor-pointer w-full h-full block">
                    <UploadCloud size={48} className="text-blue-500 mx-auto mb-3" />
                    <span className="text-lg font-semibold block">{t.upload}</span>
                    <span className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-red-700 transition inline-block mt-4">
                      {t.browse}
                    </span>
                  </label>
                  <p className="text-xs mt-3 opacity-60">Max 50 MB per PDF</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600">
                      <Plus size={18} /> {files.length} Selected
                    </button>
                    <button onClick={clearAll} className="text-red-500 hover:text-red-700 flex items-center gap-1">
                      <Trash2 size={16} /> Clear All
                    </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {files.map((file, index) => (
                      <div key={index} className={`flex items-center justify-between p-3 rounded-lg border ${darkMode ? 'border-gray-600' : 'border-gray-200'} bg-gray-50 dark:bg-gray-700`}>
                        <div className="flex items-center gap-3">
                          <FileText size={24} className="text-[#E5322D]" />
                          <span className="font-semibold text-sm">{file.name}</span>
                          <span className="text-xs opacity-50">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                        <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500"><X size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Generate Button */}
              {files.length > 0 && (
                <div className="mt-4">
                  <button onClick={generateSummary} disabled={isProcessing} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400">
                    {isProcessing ? <><Settings className="animate-spin" size={24} /> {t.processing} {progress}%</> : <>Generate Summary <Sparkles size={24} /></>}
                  </button>
                  {isProcessing && (
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  )}
                </div>
              )}

              {/* Output Area */}
              {summary && (
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold">{t.summaryOutput}</h3>
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-indigo-600">
                        {copied ? <><CheckCircle2 size={16} className="text-green-500"/> {t.copied}</> : <><Copy size={16}/> {t.copy}</>}
                      </button>
                      <button onClick={() => downloadText('txt')} className="text-gray-600 hover:text-indigo-600"><Download size={16} /></button>
                      <button onClick={() => downloadText('md')} className="text-gray-600 hover:text-indigo-600"><FileIcon size={16} /></button>
                      <button onClick={exportToWord} className="text-gray-600 hover:text-indigo-600"><FileText size={16} /></button>
                      <button onClick={exportToPdf} className="text-gray-600 hover:text-indigo-600"><FileIcon size={16} /></button>
                      <button onClick={exportToPpt} className="text-gray-600 hover:text-indigo-600"><Presentation size={16} /></button>
                      <button onClick={speak} className="text-gray-600 hover:text-indigo-600">
                        {isAudioPlaying ? <Volume2 size={16} /> : <Volume2 size={16} />}
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 border rounded-xl p-6 overflow-y-auto max-h-96">
                    {renderSummary()}
                    {summaryMeta.sentiment && (
                      <div className="mt-4 flex items-center gap-2 text-sm">
                        <span className="font-semibold">Sentiment:</span>
                        {summaryMeta.sentiment === 'positive' ? <ThumbsUp size={16} className="text-green-500" /> : summaryMeta.sentiment === 'negative' ? <ThumbsDown size={16} className="text-red-500" /> : <Minus size={16} className="text-gray-500" />}
                        <span>{summaryMeta.sentiment}</span>
                      </div>
                    )}
                    {summaryMeta.confidence && (
                      <div className="mt-2 text-sm">
                        <span className="font-semibold">Confidence:</span> {summaryMeta.confidence}%
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Chat with Document */}
              {summary && fileUrls.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2"><MessageCircle size={18} /> {t.chat}</h4>
                  <div className="flex gap-2">
                    <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Ask about this document..." className="flex-1 p-2 border rounded bg-white dark:bg-gray-900" />
                    <button onClick={handleChat} disabled={isChatLoading} className="bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600">
                      {isChatLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  {chatResponse && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">
                      {chatResponse}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-bold flex items-center gap-2"><History size={18} /> {t.history}</h4>
              <button onClick={() => setHistory([])} className="text-red-500 text-sm hover:underline">{t.clearHistory}</button>
            </div>
            <ul className="space-y-2">
              {history.map((item, idx) => (
                <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  <span>{item.files.join(', ')} <span className="opacity-50">({item.time})</span></span>
                  {item.url && <a href={item.url} target="_blank" className="text-blue-500">Download</a>}
                </li>
              ))}
            </ul>
          </div>
        )}
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
