import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import {
  UploadCloud, FileText, X, Languages, Settings, Copy, CheckCircle2,
  ArrowRight, Download, Trash2, Plus, Sun, Moon, History, MessageCircle,
  Send, Volume2, Loader2, SlidersHorizontal, ChevronDown, ChevronUp,
  Target, Hash, StickyNote, BarChart3, ThumbsUp, ThumbsDown, Minus
} from 'lucide-react';

const ACCEPTED_FORMATS = '.pdf';

const translations = {
  en: {
    title: 'AI PDF Translator',
    subtitle: 'Translate documents into multiple languages with advanced AI.',
    upload: 'Drag & drop PDF here or',
    browse: 'Browse Files',
    targetLang: 'Target Language',
    sourceLang: 'Source Language',
    autoDetect: 'Auto-detect',
    pageRange: 'Page Range (e.g., 1-5)',
    ocr: 'Enable OCR (Scanned PDFs)',
    tone: 'Translation Tone',
    formal: 'Formal',
    casual: 'Casual',
    technical: 'Technical',
    simple: 'Simple',
    glossary: 'Glossary (optional)',
    translate: 'Translate Document',
    processing: 'Translating...',
    copy: 'Copy Text',
    copied: 'Copied!',
    downloadTxt: 'Download .txt',
    downloadMd: 'Download .md',
    exportDocx: 'Export Word',
    exportPdf: 'Export PDF',
    sideBySide: 'Side-by-Side View',
    chat: 'Ask Follow-up',
    history: 'History',
    clearHistory: 'Clear History',
    darkMode: 'Dark Mode',
    confidence: 'Confidence Score',
    sentiment: 'Sentiment Analysis'
  },
  hi: {
    title: 'AI PDF अनुवादक',
    subtitle: 'उन्नत AI के साथ दस्तावेज़ों को कई भाषाओं में अनुवाद करें।',
    upload: 'PDF यहाँ खींचें या',
    browse: 'फ़ाइलें चुनें',
    targetLang: 'लक्षित भाषा',
    sourceLang: 'स्रोत भाषा',
    autoDetect: 'स्वतः पता लगाएं',
    pageRange: 'पेज रेंज (जैसे 1-5)',
    ocr: 'OCR सक्षम करें (स्कैन की गई PDF)',
    tone: 'अनुवाद का स्वर',
    formal: 'औपचारिक',
    casual: 'अनौपचारिक',
    technical: 'तकनीकी',
    simple: 'सरल',
    glossary: 'शब्दावली (वैकल्पिक)',
    translate: 'दस्तावेज़ का अनुवाद करें',
    processing: 'अनुवाद हो रहा है...',
    copy: 'टेक्स्ट कॉपी करें',
    copied: 'कॉपी हो गया!',
    downloadTxt: '.txt डाउनलोड करें',
    downloadMd: '.md डाउनलोड करें',
    exportDocx: 'Word निर्यात',
    exportPdf: 'PDF निर्यात',
    sideBySide: 'साथ-साथ दृश्य',
    chat: 'प्रश्न पूछें',
    history: 'इतिहास',
    clearHistory: 'इतिहास साफ़ करें',
    darkMode: 'डार्क मोड',
    confidence: 'विश्वास स्कोर',
    sentiment: 'भावना विश्लेषण'
  }
};

export default function TranslatePdf() {
  const [files, setFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translation, setTranslation] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [copied, setCopied] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showSideBySide, setShowSideBySide] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatResponse, setChatResponse] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [meta, setMeta] = useState({});

  const [options, setOptions] = useState({
    targetLanguage: 'Hindi',
    sourceLanguage: 'auto',
    pageRange: '',
    ocrEnabled: false,
    tone: 'formal',
    glossary: '',
    confidence: false,
    sentiment: false
  });

  const languages = [
    'Hindi', 'English', 'Spanish', 'French', 'German', 'Chinese',
    'Arabic', 'Japanese', 'Russian', 'Portuguese', 'Bengali', 'Marathi',
    'Telugu', 'Tamil', 'Urdu'
  ];

  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);
  const t = translations[lang];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_translate_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_translate_history', JSON.stringify(history));
  }, [history]);

  const validateFile = (file) => file.type === 'application/pdf';

  const addFiles = (newFiles) => {
    const valid = newFiles.filter(f => validateFile(f));
    if (valid.length) {
      setFiles(prev => [...prev, ...valid]);
      setTranslation('');
      setOriginalText('');
      setChatResponse('');
      setMeta({});
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

  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setTranslation('');
  };

  const clearAll = () => {
    setFiles([]);
    setTranslation('');
    setChatResponse('');
    setOriginalText('');
  };

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

  const handleTranslate = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setTranslation('');
    setChatResponse('');
    const clearProgress = startProgress();

    try {
      // Upload files
      const urls = [];
      for (const file of files) {
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
        urls.push(blob.url);
      }
      setFileUrls(urls);

      // Call backend translate
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'translate-pdf',
          fileUrls: urls,
          options: {
            targetLanguage: options.targetLanguage,
            sourceLanguage: options.sourceLanguage,
            pageRange: options.pageRange,
            ocrEnabled: options.ocrEnabled,
            tone: options.tone,
            glossary: options.glossary,
            confidence: options.confidence,
            sentiment: options.sentiment
          }
        })
      });
      const data = await response.json();
      if (response.ok && data.textResult) {
        setTranslation(data.textResult);
        setMeta(data.meta || {});
        // Update history
        const newEntry = {
          time: new Date().toLocaleString(),
          files: files.map(f => f.name),
          language: options.targetLanguage
        };
        setHistory(prev => [newEntry, ...prev].slice(0, 10));
      } else {
        throw new Error(data.error || 'Translation failed');
      }
    } catch (error) {
      console.error(error);
      showToast(t.error || 'Something went wrong', 'error');
    } finally {
      clearProgress();
      setIsProcessing(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadText = (format) => {
    const mime = format === 'md' ? 'text/markdown' : 'text/plain';
    const ext = format === 'md' ? 'md' : 'txt';
    const blob = new Blob([translation], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translated.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportDocx = async () => {
    const { Document, Packer, Paragraph, HeadingLevel } = await import('docx');
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'Translated Document', heading: HeadingLevel.HEADING_1 }),
          ...translation.split('\n').map(line => new Paragraph({ text: line }))
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'translated.docx';
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportPdf = async () => {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const lines = translation.split('\n');
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
    link.download = 'translated.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  const speak = () => {
    if (!translation) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(translation);
    utterance.lang = options.targetLanguage === 'Hindi' ? 'hi-IN' : 'en-US';
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

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
          options: { language: options.targetLanguage }
        })
      });
      const data = await response.json();
      if (response.ok && data.textResult) {
        setChatResponse(data.textResult);
      } else {
        setChatResponse('AI could not answer.');
      }
    } catch (error) {
      setChatResponse('Error connecting to AI.');
    }
    setIsChatLoading(false);
    setChatMessage('');
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>{t.title} - MasterPdf</title>
        <meta name="description" content="Translate PDF documents into multiple languages using AI." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Languages size={14} /> AI Translation
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-base sm:text-lg opacity-80">{t.subtitle}</p>
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
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><SlidersHorizontal size={18} /> Options</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.targetLang}</label>
                <select value={options.targetLanguage} onChange={(e) => setOptions({ ...options, targetLanguage: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.sourceLang}</label>
                <select value={options.sourceLanguage} onChange={(e) => setOptions({ ...options, sourceLanguage: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="auto">{t.autoDetect}</option>
                  {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.pageRange}</label>
                <input type="text" value={options.pageRange} onChange={(e) => setOptions({ ...options, pageRange: e.target.value })} placeholder="e.g., 1-5" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.ocrEnabled} onChange={(e) => setOptions({ ...options, ocrEnabled: e.target.checked })} />
                {t.ocr}
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

              <div>
                <label className="block text-sm font-medium mb-1">{t.glossary}</label>
                <input type="text" value={options.glossary} onChange={(e) => setOptions({ ...options, glossary: e.target.value })} placeholder="e.g., Invoice=Chalan" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAdvanced ? 'Basic' : 'Advanced'}
              </button>

              {showAdvanced && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.confidence} onChange={(e) => setOptions({ ...options, confidence: e.target.checked })} />
                    <BarChart3 size={16} /> {t.confidence}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.sentiment} onChange={(e) => setOptions({ ...options, sentiment: e.target.checked })} />
                    <Target size={16} /> {t.sentiment}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[500px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* File upload */}
              {files.length === 0 ? (
                <div
                  onDragEnter={handleDragEnter}
                  onDragOver={(e) => e.preventDefault()}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-10 text-center transition ${darkMode ? 'border-gray-600 hover:border-blue-400' : 'border-gray-300 hover:border-blue-500'}`}
                >
                  <input type="file" accept={ACCEPTED_FORMATS} onChange={handleFileChange} multiple className="hidden" ref={fileInputRef} />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <UploadCloud size={48} className="text-blue-500 mx-auto mb-3" />
                    <span className="text-lg font-semibold">{t.upload}</span>
                    <span className="text-sm opacity-70 block mt-1">{t.browse}</span>
                    <span className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold shadow hover:bg-red-700 transition inline-block mt-3">
                      {t.browse}
                    </span>
                  </label>
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
                        </div>
                        <button onClick={() => removeFile(index)} className="text-gray-500 hover:text-red-500"><X size={18} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Translate button */}
              {files.length > 0 && (
                <button onClick={handleTranslate} disabled={isProcessing} className="mt-6 w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 disabled:bg-gray-400">
                  {isProcessing ? <><Settings className="animate-spin" size={24} /> {t.processing} {progress}%</> : <>{t.translate} <ArrowRight size={24} /></>}
                </button>
              )}

              {/* Output Area */}
              {translation && (
                <div className="mt-6 flex-1">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xl font-bold">Output Result</h3>
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-[#E5322D]">
                        {copied ? <><CheckCircle2 size={16} className="text-green-500"/> {t.copied}</> : <><Copy size={16}/> {t.copy}</>}
                      </button>
                      <button onClick={() => downloadText('txt')} className="text-gray-600 hover:text-[#E5322D]"><Download size={16} /></button>
                      <button onClick={() => downloadText('md')} className="text-gray-600 hover:text-[#E5322D]"><FileText size={16} /></button>
                      <button onClick={exportDocx} className="text-gray-600 hover:text-[#E5322D]"><FileText size={16} /></button>
                      <button onClick={exportPdf} className="text-gray-600 hover:text-[#E5322D]"><FileText size={16} /></button>
                      <button onClick={speak} className="text-gray-600 hover:text-[#E5322D]">
                        {isSpeaking ? <Volume2 size={16} /> : <Volume2 size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Side-by-side toggle */}
                  <button onClick={() => setShowSideBySide(!showSideBySide)} className="mb-2 text-sm font-semibold text-blue-600">
                    {t.sideBySide} {showSideBySide ? '▲' : '▼'}
                  </button>

                  {showSideBySide ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 dark:bg-gray-900 border rounded-xl p-4 overflow-y-auto max-h-80">
                        <h4 className="font-bold mb-2">Original (Extracted)</h4>
                        <p className="text-sm whitespace-pre-wrap">{originalText}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900 border rounded-xl p-4 overflow-y-auto max-h-80">
                        <h4 className="font-bold mb-2">Translated</h4>
                        <p className="text-sm whitespace-pre-wrap">{translation}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-gray-900 border rounded-xl p-6 overflow-y-auto max-h-96">
                      <p className="text-gray-800 dark:text-white text-[15px] leading-relaxed whitespace-pre-wrap">{translation}</p>
                      {meta.sentiment && (
                        <div className="mt-4 flex items-center gap-2 text-sm">
                          <span className="font-semibold">Sentiment:</span>
                          {meta.sentiment === 'positive' ? <ThumbsUp size={16} className="text-green-500" /> : meta.sentiment === 'negative' ? <ThumbsDown size={16} className="text-red-500" /> : <Minus size={16} className="text-gray-500" />}
                          <span>{meta.sentiment}</span>
                        </div>
                      )}
                      {meta.confidence && (
                        <div className="mt-2 text-sm">
                          <span className="font-semibold">Confidence:</span> {meta.confidence}%
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Chat with document */}
              {translation && fileUrls.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-bold mb-3 flex items-center gap-2"><MessageCircle size={18} /> {t.chat}</h4>
                  <div className="flex gap-2">
                    <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} placeholder="Ask about this document..." className="flex-1 p-2 border rounded bg-white dark:bg-gray-900" />
                    <button onClick={handleChat} disabled={isChatLoading} className="bg-blue-500 text-white px-4 rounded-lg hover:bg-blue-600">
                      {isChatLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </div>
                  {chatResponse && <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg text-sm">{chatResponse}</div>}
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
                  <span>{item.files.join(', ')} <span className="opacity-50">({item.language}, {item.time})</span></span>
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
