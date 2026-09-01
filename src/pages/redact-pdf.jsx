import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import {
  UploadCloud, X, Trash2, Sun, Moon, History, Download,
  Settings, SlidersHorizontal, ChevronDown, ChevronUp,
  Type, Palette, Loader2, CheckCircle2, AlertTriangle
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const translations = {
  en: {
    title: 'Redact PDF - Hide Sensitive Information',
    upload: 'Drag & drop PDF here or',
    browse: 'Select PDF',
    addMore: 'Add More PDFs',
    clearAll: 'Clear All',
    options: 'Redaction Options',
    fillColor: 'Fill Color',
    overlayText: 'Overlay Text',
    overlayOpacity: 'Overlay Opacity',
    pageRange: 'Page Range (e.g., 1-5, 8)',
    removeMetadata: 'Remove Metadata (Author, Title, etc.)',
    applyRedaction: 'Apply Redaction',
    redacting: 'Redacting...',
    downloadRedacted: 'Download Redacted PDF',
    history: 'History',
    clearHistory: 'Clear History',
    darkMode: 'Dark Mode',
    confirmRedact: 'Are you sure? This action is irreversible.',
    drawnBoxes: 'Redaction Boxes',
    clearBoxes: 'Clear Boxes',
    drawMode: 'Draw Mode',
    previewMode: 'Preview Mode',
    success: 'Redaction applied successfully!',
    error: 'Something went wrong.',
    noFiles: 'Please upload a PDF first.',
    invalidType: 'Invalid file type. Only PDF allowed.',
    tooLarge: 'File too large. Max 100 MB.',
    page: 'Page'
  },
  hi: {
    title: 'PDF Redact करें - संवेदनशील जानकारी छुपाएं',
    upload: 'PDF यहाँ खींचें या',
    browse: 'PDF चुनें',
    addMore: 'और PDF जोड़ें',
    clearAll: 'सभी हटाएँ',
    options: 'Redaction विकल्प',
    fillColor: 'भरण रंग',
    overlayText: 'ओवरले टेक्स्ट',
    overlayOpacity: 'ओवरले अपारदर्शिता',
    pageRange: 'पेज रेंज (जैसे 1-5, 8)',
    removeMetadata: 'मेटाडेटा हटाएँ (Author, Title, आदि)',
    applyRedaction: 'Redaction लागू करें',
    redacting: 'Redacting हो रहा है...',
    downloadRedacted: 'Redacted PDF डाउनलोड करें',
    history: 'इतिहास',
    clearHistory: 'इतिहास साफ़ करें',
    darkMode: 'डार्क मोड',
    confirmRedact: 'क्या आप सुनिश्चित हैं? यह क्रिया अपरिवर्तनीय है।',
    drawnBoxes: 'Redaction बॉक्स',
    clearBoxes: 'बॉक्स साफ़ करें',
    drawMode: 'ड्रॉ मोड',
    previewMode: 'पूर्वावलोकन मोड',
    success: 'Redaction सफलतापूर्वक लागू!',
    error: 'कुछ गड़बड़ हुई।',
    noFiles: 'कृपया पहले एक PDF अपलोड करें।',
    invalidType: 'अमान्य फ़ाइल प्रकार। केवल PDF की अनुमति है।',
    tooLarge: 'फ़ाइल बहुत बड़ी है। अधिकतम 100 MB।',
    page: 'पेज'
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
  const [drawMode, setDrawMode] = useState(true);
  
  const [options, setOptions] = useState({
    fillColor: '#000000',
    overlayText: 'REDACTED',
    overlayOpacity: 100,
    pageRange: '',
    removeMetadata: true
  });

  const t = translations[lang];
  const fileInputRef = useRef(null);
  const pdfContainerRef = useRef(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // History
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_redact_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_redact_history', JSON.stringify(history));
  }, [history]);

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

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !validateFile(selectedFile)) return;
    setFile(selectedFile);
    setBoxes([]);
    setCurrentPage(1);
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
    const blob = await upload(droppedFile.name, droppedFile, { access: 'public', handleUploadUrl: '/api/upload' });
    setFileUrl(blob.url);
  };

  const clearAll = () => {
    setFile(null);
    setFileUrl('');
    setBoxes([]);
    setCurrentPage(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // Drawing boxes
  const handleMouseDown = (e) => {
    if (!drawMode) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
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

  const removeBox = (index) => setBoxes(prev => prev.filter((_, i) => i !== index));
  const clearBoxes = () => setBoxes([]);

  // Apply redaction
  const processRedaction = async () => {
    if (!fileUrl) return showToast(t.noFiles, 'error');
    if (boxes.length === 0) return showToast('Please draw at least one redaction box.', 'error');
    if (!window.confirm(t.confirmRedact)) return;
    setIsProcessing(true);
    setProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) { clearInterval(progressInterval); return prev; }
          return prev + 5;
        });
      }, 200);

      const scaledBoxes = boxes.map(box => {
        const scale = 700 / 100; // Convert percentage to backend's 700px width
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
            pageRange: options.pageRange,
            removeMetadata: options.removeMetadata
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.downloadUrl) {
        const resp = await fetch(data.downloadUrl);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${file.name.split('.')[0]}_Redacted.pdf`;
        link.click();
        URL.revokeObjectURL(url);
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

  // Render boxes on PDF
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

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>{t.title} | MasterPdf</title>
        <meta name="description" content="Redact sensitive information from PDF documents easily." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t.title}</h1>
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
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={18} /> {t.options}</h3>

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
                <input type="text" value={options.pageRange} onChange={(e) => setOptions({ ...options, pageRange: e.target.value })} placeholder="e.g., 1-5, 8" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.removeMetadata} onChange={(e) => setOptions({ ...options, removeMetadata: e.target.checked })} />
                {t.removeMetadata}
              </label>

              <button onClick={() => setDrawMode(!drawMode)} className="w-full p-2 bg-blue-500 text-white rounded-lg font-bold">
                {drawMode ? t.previewMode : t.drawMode}
              </button>
              <button onClick={clearBoxes} className="w-full p-2 bg-red-500 text-white rounded-lg font-bold">
                {t.clearBoxes}
              </button>
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
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                  <UploadCloud size={48} className="text-blue-500 mb-3" />
                  <p className="text-lg font-semibold">{t.upload}</p>
                  <button onClick={() => fileInputRef.current.click()} className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold mt-4">
                    {t.browse}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="flex flex-wrap justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 disabled:opacity-30">Prev</button>
                      <span className="text-sm font-bold">{currentPage} / {numPages}</span>
                      <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage === numPages} className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-600 disabled:opacity-30">Next</button>
                    </div>
                    <span className="text-xs text-gray-500">{boxes.length} {t.drawnBoxes}</span>
                  </div>

                  <div
                    ref={pdfContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    className="relative flex-1 overflow-auto max-h-[600px] bg-gray-100 dark:bg-gray-900 p-4 rounded-lg"
                  >
                    <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                      <Page pageNumber={currentPage} width={700} renderTextLayer={false} renderAnnotationLayer={false} />
                    </Document>
                    {renderBoxes()}
                  </div>

                  <button
                    onClick={processRedaction}
                    disabled={isProcessing || boxes.length === 0}
                    className="mt-4 py-3 bg-[#E5322D] text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:bg-gray-400"
                  >
                    {isProcessing ? (
                      <><Loader2 className="animate-spin" size={24} /> {t.redacting} {progress}%</>
                    ) : (
                      <><AlertTriangle size={24} /> {t.applyRedaction}</>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2"><History size={18} /> {t.history}</h4>
                  <button onClick={() => setHistory([])} className="text-red-500 text-sm hover:underline">{t.clearHistory}</button>
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
