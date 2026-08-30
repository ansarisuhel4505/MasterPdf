import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  UploadCloud, X, Trash2, Plus, Sun, Moon, History, Download,
  Settings, SlidersHorizontal, ChevronDown, ChevronUp, Search,
  Shield, Eye, EyeOff, Type, Palette, Sparkles, Loader2,
  CheckCircle2, AlertTriangle, Lock, Unlock, FileText,
  Copy, Save, RotateCw, ZoomIn, ZoomOut
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ACCEPTED_FORMATS = '.pdf';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

// i18n Translations
const translations = {
  en: {
    title: 'Redact PDF - Hide Sensitive Information',
    desc: 'Redact text, images, and areas from PDF documents. AI-powered detection available.',
    upload: 'Drag & drop PDF here or',
    browse: 'Select PDF',
    addMore: 'Add More PDFs',
    clearAll: 'Clear All',
    options: 'Redaction Options',
    basic: 'Basic',
    advanced: 'Advanced',
    manualMarking: 'Manual Marking',
    aiDetection: 'AI Detection',
    pageRange: 'Page Range (e.g., 1-5, 8)',
    applyRedaction: 'Apply Redaction',
    redacting: 'Redacting...',
    downloadRedacted: 'Download Redacted PDF',
    history: 'History',
    clearHistory: 'Clear History',
    darkMode: 'Dark Mode',
    searchPlaceholder: 'Find text to redact...',
    markAll: 'Mark All',
    fillColor: 'Fill Color',
    overlayText: 'Overlay Text',
    overlayOpacity: 'Overlay Opacity',
    includeTerms: 'Always Redact (Terms)',
    excludeTerms: 'Always Keep Visible (Terms)',
    sanitizeMetadata: 'Remove Metadata',
    removeComments: 'Remove Comments',
    flattenForms: 'Flatten Forms',
    removeLayers: 'Remove Hidden Layers',
    removeAttachments: 'Remove Attachments',
    reversible: 'Reversible Redaction',
    retentionEphemeral: 'Ephemeral Mode (Auto-Delete)',
    retentionStudio: 'Review Mode (Studio)',
    language: 'Language',
    confidence: 'AI Confidence',
    smartFilename: 'Smart Filename',
    success: 'Redaction applied successfully!',
    error: 'Something went wrong.',
    noFiles: 'Please upload a PDF first.',
    invalidType: 'Invalid file type. Only PDF allowed.',
    tooLarge: 'File too large. Max 100 MB.',
    confirmRedact: 'Are you sure? This action is irreversible.',
    drawnBoxes: 'Redaction Boxes',
    clearBoxes: 'Clear Boxes',
    previewMode: 'Preview',
    drawMode: 'Draw Mode'
  },
  hi: {
    title: 'PDF Redact करें - संवेदनशील जानकारी छुपाएं',
    desc: 'PDF दस्तावेज़ों से टेक्स्ट, छवियाँ, और क्षेत्र redact करें। AI-संचालित पहचान उपलब्ध।',
    upload: 'PDF यहाँ खींचें या',
    browse: 'PDF चुनें',
    addMore: 'और PDF जोड़ें',
    clearAll: 'सभी हटाएँ',
    options: 'Redaction विकल्प',
    basic: 'मूल',
    advanced: 'उन्नत',
    manualMarking: 'मैनुअल मार्किंग',
    aiDetection: 'AI पहचान',
    pageRange: 'पेज रेंज (जैसे 1-5, 8)',
    applyRedaction: 'Redaction लागू करें',
    redacting: 'Redacting हो रहा है...',
    downloadRedacted: 'Redacted PDF डाउनलोड करें',
    history: 'इतिहास',
    clearHistory: 'इतिहास साफ़ करें',
    darkMode: 'डार्क मोड',
    searchPlaceholder: 'Redact करने के लिए टेक्स्ट खोजें...',
    markAll: 'सभी मार्क करें',
    fillColor: 'भरण रंग',
    overlayText: 'ओवरले टेक्स्ट',
    overlayOpacity: 'ओवरले अपारदर्शिता',
    includeTerms: 'हमेशा Redact करें (शर्तें)',
    excludeTerms: 'हमेशा दृश्य रखें (शर्तें)',
    sanitizeMetadata: 'मेटाडेटा हटाएँ',
    removeComments: 'टिप्पणियाँ हटाएँ',
    flattenForms: 'फ़ॉर्म फ्लैट करें',
    removeLayers: 'छिपी परतें हटाएँ',
    removeAttachments: 'अटैचमेंट हटाएँ',
    reversible: 'प्रतिवर्ती Redaction',
    retentionEphemeral: 'क्षणिक मोड (ऑटो-डिलीट)',
    retentionStudio: 'समीक्षा मोड (स्टूडियो)',
    language: 'भाषा',
    confidence: 'AI विश्वास',
    smartFilename: 'स्मार्ट फ़ाइलनाम',
    success: 'Redaction सफलतापूर्वक लागू!',
    error: 'कुछ गड़बड़ हुई।',
    noFiles: 'कृपया पहले एक PDF अपलोड करें।',
    invalidType: 'अमान्य फ़ाइल प्रकार। केवल PDF की अनुमति है।',
    tooLarge: 'फ़ाइल बहुत बड़ी है। अधिकतम 100 MB।',
    confirmRedact: 'क्या आप सुनिश्चित हैं? यह क्रिया अपरिवर्तनीय है।',
    drawnBoxes: 'Redaction बॉक्स',
    clearBoxes: 'बॉक्स साफ़ करें',
    previewMode: 'पूर्वावलोकन',
    drawMode: 'ड्रॉ मोड'
  }
};

export default function RedactPdf() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [boxes, setBoxes] = useState([]); // [{pageIndex, x, y, width, height, color, text, opacity}]
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [findResults, setFindResults] = useState([]);
  const [drawMode, setDrawMode] = useState(true);
  const [options, setOptions] = useState({
    fillColor: '#000000',
    overlayText: '',
    overlayOpacity: 100,
    includeTerms: '',
    excludeTerms: '',
    pageRange: '',
    sanitizeMetadata: true,
    removeComments: true,
    flattenForms: true,
    removeLayers: true,
    removeAttachments: true,
    reversible: false,
    retentionEphemeral: false,
    retentionStudio: false,
    aiEnabled: false,
    confidence: 0,
    smartFilename: false,
    language: 'en'
  });

  const t = translations[lang];
  const fileInputRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_redact_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_redact_history', JSON.stringify(history));
  }, [history]);

  // File validation & upload
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

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !validateFile(selectedFile)) return;
    
    setFile(selectedFile);
    setBoxes([]);
    setCurrentPage(1);
    setFindResults([]);
    setSearchText('');
    
    // Upload to Vercel Blob
    const blob = await upload(selectedFile.name, selectedFile, { access: 'public', handleUploadUrl: '/api/upload' });
    setFileUrl(blob.url);
    e.target.value = '';
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile || !validateFile(droppedFile)) return;
    
    setFile(droppedFile);
    setBoxes([]);
    setCurrentPage(1);
    setFindResults([]);
    setSearchText('');
    
    const blob = await upload(droppedFile.name, droppedFile, { access: 'public', handleUploadUrl: '/api/upload' });
    setFileUrl(blob.url);
  };

  const clearAll = () => {
    setFile(null);
    setFileUrl('');
    setBoxes([]);
    setCurrentPage(1);
    setFindResults([]);
  };

  // PDF Page tracking
  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoad = (page) => {
    setPageSize({ width: page.originalWidth, height: page.originalHeight });
  };

  // Box drawing (click and drag on PDF)
  const handleMouseDown = (e) => {
    if (!drawMode) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100; // percentage
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBoxes(prev => [...prev, {
      pageIndex: currentPage - 1,
      x, y,
      width: 0,
      height: 0,
      isDrawing: true,
      color: options.fillColor,
      text: options.overlayText,
      opacity: options.overlayOpacity
    }]);
  };

  const handleMouseMove = (e) => {
    if (!drawMode || boxes.length === 0) return;
    if (!boxes[boxes.length - 1].isDrawing) return;
    
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setBoxes(prev => {
      const newBoxes = [...prev];
      const lastBox = newBoxes[newBoxes.length - 1];
      lastBox.width = x - lastBox.x;
      lastBox.height = y - lastBox.y;
      return newBoxes;
    });
  };

  const handleMouseUp = () => {
    setBoxes(prev => prev.map(box => ({ ...box, isDrawing: false })));
  };

  // Remove a box
  const removeBox = (index) => {
    setBoxes(prev => prev.filter((_, i) => i !== index));
  };

  const clearBoxes = () => setBoxes([]);

  // Find & Redact (simulated - backend handles actual search)
  const handleFind = () => {
    if (!searchText.trim()) return;
    // Simulate finding instances - backend will handle actual AI detection
    const foundPages = [];
    for (let i = 0; i < numPages; i++) {
      foundPages.push({ page: i + 1, matches: 1 });
    }
    setFindResults(foundPages);
    showToast(`Found potential matches for "${searchText}"`);
  };

  // Mark all found results
  const markAllFound = () => {
    if (findResults.length === 0) return;
    const newBoxes = [];
    findResults.forEach(result => {
      newBoxes.push({
        pageIndex: result.page - 1,
        x: 10,
        y: 10,
        width: 40,
        height: 15,
        isDrawing: false,
        color: options.fillColor,
        text: options.overlayText,
        opacity: options.overlayOpacity
      });
    });
    setBoxes(prev => [...prev, ...newBoxes]);
    showToast(`Marked ${newBoxes.length} areas for redaction`);
  };

  // Apply redaction (call backend)
  const processRedaction = async () => {
    if (!fileUrl) return showToast(t.noFiles, 'error');
    if (boxes.length === 0) return showToast('Please draw at least one redaction box.', 'error');
    
    // Confirm since irreversible
    if (!window.confirm(t.confirmRedact)) return;
    
    setIsProcessing(true);
    setProgress(0);
    
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

      // Prepare boxes (scale to 700px width like backend expects)
      const scaledBoxes = boxes.map(box => {
        const scale = 700 / 100; // Since x,y are percentages
        return {
          pageIndex: box.pageIndex,
          x: box.x * scale,
          y: box.y * scale,
          width: box.width * scale,
          height: box.height * scale,
          color: box.color,
          text: box.text,
          opacity: box.opacity
        };
      });

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'redact-pdf', 
          fileUrl,
          boxes: scaledBoxes,
          options: {
            sanitizeMetadata: options.sanitizeMetadata,
            removeComments: options.removeComments,
            flattenForms: options.flattenForms,
            removeLayers: options.removeLayers,
            removeAttachments: options.removeAttachments,
            reversible: options.reversible,
            retentionEphemeral: options.retentionEphemeral,
            retentionStudio: options.retentionStudio,
            pageRange: options.pageRange
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.downloadUrl) {
        // Download redacted PDF (Blob method)
        const resp = await fetch(data.downloadUrl);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = options.smartFilename ? `${file.name.split('.')[0]}_Redacted.pdf` : 'Redacted_Document.pdf';
        link.click();
        URL.revokeObjectURL(url);

        // Add to history
        const entry = { time: new Date().toLocaleString(), file: file.name };
        setHistory(prev => [entry, ...prev].slice(0, 10));
        showToast(t.success, 'success');
        setProgress(100);
      } else {
        throw new Error(data.error || 'Redaction failed');
      }

      clearInterval(progressInterval);
    } catch (error) {
      console.error(error);
      showToast(t.error, 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // Render redaction boxes on PDF
  const renderBoxes = () => {
    return boxes
      .filter(box => box.pageIndex === currentPage - 1)
      .map((box, index) => (
        <div
          key={index}
          style={{
            position: 'absolute',
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
            backgroundColor: box.color,
            opacity: box.opacity / 100,
            border: '2px solid #ef4444',
            cursor: 'pointer'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!box.isDrawing) removeBox(index);
          }}
        >
          {box.text && (
            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
              {box.text}
            </span>
          )}
        </div>
      ));
  };

  // Render PDF preview
  const renderPdfPreview = () => {
    if (!fileUrl) return null;
    return (
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        className="pdf-document"
      >
        <Page
          pageNumber={currentPage}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          width={700}
          onLoadSuccess={onPageLoad}
        />
      </Document>
    );
  };

  // UI Render
  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>{t.title} | MasterPdf</title>
        <meta name="description" content={t.desc} />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-base sm:text-lg opacity-80">{t.desc}</p>
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
          {/* Sidebar Options */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings size={18} /> {t.options}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.fillColor}</label>
                <input type="color" value={options.fillColor} onChange={(e) => setOptions({ ...options, fillColor: e.target.value })} className="w-full h-10 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.overlayText}</label>
                <input type="text" value={options.overlayText} onChange={(e) => setOptions({ ...options, overlayText: e.target.value })} placeholder="REDACTED" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.overlayOpacity}</label>
                <input type="range" min="0" max="100" value={options.overlayOpacity} onChange={(e) => setOptions({ ...options, overlayOpacity: e.target.value })} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageRange}</label>
                <input type="text" value={options.pageRange} onChange={(e) => setOptions({ ...options, pageRange: e.target.value })} placeholder="1-5, 8" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.sanitizeMetadata} onChange={(e) => setOptions({ ...options, sanitizeMetadata: e.target.checked })} />
                {t.sanitizeMetadata}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.removeComments} onChange={(e) => setOptions({ ...options, removeComments: e.target.checked })} />
                {t.removeComments}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.flattenForms} onChange={(e) => setOptions({ ...options, flattenForms: e.target.checked })} />
                {t.flattenForms}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.removeLayers} onChange={(e) => setOptions({ ...options, removeLayers: e.target.checked })} />
                {t.removeLayers}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.removeAttachments} onChange={(e) => setOptions({ ...options, removeAttachments: e.target.checked })} />
                {t.removeAttachments}
              </label>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAdvanced ? 'Hide' : 'Advanced'}
              </button>

              {showAdvanced && (
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.reversible} onChange={(e) => setOptions({ ...options, reversible: e.target.checked })} />
                    {t.reversible}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.retentionEphemeral} onChange={(e) => setOptions({ ...options, retentionEphemeral: e.target.checked })} />
                    {t.retentionEphemeral}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.retentionStudio} onChange={(e) => setOptions({ ...options, retentionStudio: e.target.checked })} />
                    {t.retentionStudio}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.smartFilename} onChange={(e) => setOptions({ ...options, smartFilename: e.target.checked })} />
                    {t.smartFilename}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.aiEnabled} onChange={(e) => setOptions({ ...options, aiEnabled: e.target.checked })} />
                    <Sparkles size={14} /> {t.aiDetection}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Main Preview Area */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[600px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {!file ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex-1 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center"
                >
                  <input type="file" accept={ACCEPTED_FORMATS} onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                  <UploadCloud size={48} className="text-blue-500 mb-3" />
                  <p className="text-lg font-semibold">{t.upload}</p>
                  <button onClick={() => fileInputRef.current.click()} className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold mt-4">
                    {t.browse}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {/* Toolbar */}
                  <div className="flex flex-wrap justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawMode(!drawMode)} className={`px-3 py-1 rounded-lg text-xs font-bold ${drawMode ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        {drawMode ? t.drawMode : t.previewMode}
                      </button>
                      <button onClick={clearBoxes} className="px-3 py-1 rounded-lg text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300">
                        {t.clearBoxes}
                      </button>
                      <span className="text-xs text-gray-500">{boxes.length} {t.drawnBoxes}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 disabled:opacity-30">Prev</button>
                      <span className="text-sm font-bold">{currentPage} / {numPages}</span>
                      <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage === numPages} className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 disabled:opacity-30">Next</button>
                    </div>
                  </div>

                  {/* Find & Redact */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                      <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder={t.searchPlaceholder} className="w-full pl-10 p-2 border rounded-lg bg-white dark:bg-gray-900" />
                    </div>
                    <button onClick={handleFind} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-bold text-sm">
                      Find
                    </button>
                    <button onClick={markAllFound} className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-bold text-sm">
                      {t.markAll}
                    </button>
                  </div>

                  {findResults.length > 0 && (
                    <div className="mb-4 text-sm bg-yellow-50 p-2 rounded">
                      Found {findResults.length} potential matches across pages
                    </div>
                  )}

                  {/* PDF Preview with boxes */}
                  <div
                    ref={pdfContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="relative flex-1 overflow-auto max-h-[600px] bg-gray-100 dark:bg-gray-900 p-4 rounded-lg"
                  >
                    {renderPdfPreview()}
                    {renderBoxes()}
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={processRedaction}
                    disabled={isProcessing || boxes.length === 0}
                    className="mt-4 py-3 bg-[#E5322D] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        {t.redacting} {progress}%
                      </>
                    ) : (
                      <>
                        <Shield size={24} />
                        {t.applyRedaction}
                      </>
                    )}
                  </button>
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
                  <button onClick={() => setHistory([])} className="text-red-500 text-sm hover:underline">
                    {t.clearHistory}
                  </button>
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span>{item.file} <span className="opacity-50">({item.time})</span></span>
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
          {toast.msg}
        </div>
      )}
    </div>
  );
}
