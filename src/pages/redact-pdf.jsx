# 1. FRONTEND CODE (pdf-redact.jsx)
// Replace your entire RedactPdf component with this.
// NO DUMMY FEATURES: Real text coordinate extraction & Real AI PII Detection included.

import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  UploadCloud, X, Trash2, Sun, Moon, History,
  Settings, ChevronDown, ChevronUp, Search,
  Shield, Loader2, Sparkles
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ACCEPTED_FORMATS = '.pdf';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export default function RedactPdf() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [boxes, setBoxes] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [drawMode, setDrawMode] = useState(true);
  
  const [options, setOptions] = useState({
    fillColor: '#000000',
    overlayText: '',
    overlayOpacity: 100,
    pageRange: '',
    sanitizeMetadata: true,
    removeComments: true,
    flattenForms: true,
    removeLayers: true,
    removeAttachments: true,
    reversible: false,
    smartFilename: false
  });

  const fileInputRef = useRef(null);
  const pdfContainerRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_redact_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_redact_history', JSON.stringify(history));
  }, [history]);

  const validateFile = (file) => {
    if (file.type !== 'application/pdf') {
      showToast("Invalid file type. Only PDF allowed.", 'error');
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      showToast("File too large. Max 100 MB.", 'error');
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
    setSearchText('');
    
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
    setSearchText('');
    
    const blob = await upload(droppedFile.name, droppedFile, { access: 'public', handleUploadUrl: '/api/upload' });
    setFileUrl(blob.url);
  };

  const clearAll = () => {
    setFile(null);
    setFileUrl('');
    setBoxes([]);
    setCurrentPage(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // --- MANUAL DRAWING ---
  const handleMouseDown = (e) => {
    if (!drawMode) return;
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const startX = ((e.clientX - rect.left) / rect.width) * 100;
    const startY = ((e.clientY - rect.top) / rect.height) * 100;
    
    setBoxes(prev => [...prev, {
      pageIndex: currentPage - 1,
      startX, startY, 
      x: startX, y: startY,
      width: 0, height: 0,
      isDrawing: true,
      color: options.fillColor,
      text: options.overlayText,
      opacity: options.overlayOpacity
    }]);
  };

  const handleMouseMove = (e) => {
    if (!drawMode || boxes.length === 0) return;
    const lastBox = boxes[boxes.length - 1];
    if (!lastBox.isDrawing) return;
    
    const rect = pdfContainerRef.current.getBoundingClientRect();
    const currentX = ((e.clientX - rect.left) / rect.width) * 100;
    const currentY = ((e.clientY - rect.top) / rect.height) * 100;
    
    setBoxes(prev => {
      const newBoxes = [...prev];
      const box = newBoxes[newBoxes.length - 1];
      
      box.x = Math.min(box.startX, currentX);
      box.y = Math.min(box.startY, currentY);
      box.width = Math.abs(currentX - box.startX);
      box.height = Math.abs(currentY - box.startY);
      
      return newBoxes;
    });
  };

  const handleMouseUp = () => {
    setBoxes(prev => prev.map(box => ({ ...box, isDrawing: false })));
  };

  const removeBox = (index) => {
    setBoxes(prev => prev.filter((_, i) => i !== index));
  };

  // --- TEXT EXTRACTION & BOX PLACEMENT (REAL LOGIC) ---
  const executeSearchAndMark = async (textToFind) => {
    if (!textToFind.trim() || !fileUrl) return 0;
    try {
      const loadingTask = pdfjs.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const newBoxes = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.0 });
        const textContent = await page.getTextContent();
        
        const pageWidth = viewport.width;
        const pageHeight = viewport.height;
        const searchLower = textToFind.toLowerCase();

        textContent.items.forEach(item => {
          if (item.str && item.str.toLowerCase().includes(searchLower)) {
            const tx = item.transform[4];
            const ty = item.transform[5];
            const fontHeight = Math.abs(item.transform[3]) || 10;
            const itemWidth = item.width || (item.str.length * fontHeight * 0.5);

            // PDF Y-axis is inverted (bottom-left to top-left)
            const xPercent = (tx / pageWidth) * 100;
            const yPercent = 100 - (((ty + fontHeight) / pageHeight) * 100); 
            const wPercent = (itemWidth / pageWidth) * 100;
            const hPercent = (fontHeight / pageHeight) * 100;

            newBoxes.push({
              pageIndex: pageNum - 1,
              x: Math.max(0, xPercent - 0.5), // Small padding
              y: Math.max(0, yPercent - 0.5),
              width: wPercent + 1,
              height: hPercent + 1,
              isDrawing: false,
              color: options.fillColor,
              text: options.overlayText,
              opacity: options.overlayOpacity
            });
          }
        });
      }
      
      if (newBoxes.length > 0) {
        setBoxes(prev => [...prev, ...newBoxes]);
      }
      return newBoxes.length;
    } catch (err) {
      console.error("Search Error:", err);
      return 0;
    }
  };

  const handleFind = async () => {
    setIsSearching(true);
    const count = await executeSearchAndMark(searchText);
    if (count > 0) {
      showToast(`Found and marked ${count} instances of "${searchText}"`);
    } else {
      showToast(`No matches found for "${searchText}"`, 'error');
    }
    setIsSearching(false);
  };

  // --- AI DETECTION INTEGRATION ---
  const runAIDetection = async () => {
    if (!fileUrl) return showToast("Upload PDF first", 'error');
    setIsSearching(true);
    showToast("AI is analyzing document for sensitive data...", "success");
    try {
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-detect-pii', fileUrl })
      });
      const data = await response.json();
      
      if (data.piiList && data.piiList.length > 0) {
         let totalFound = 0;
         for(const term of data.piiList) {
            const count = await executeSearchAndMark(term);
            totalFound += count;
         }
         if (totalFound > 0) {
           showToast(`AI found and marked ${totalFound} sensitive areas.`, 'success');
         } else {
           showToast(`AI detected terms, but couldn't map them to exact layout.`, 'error');
         }
      } else {
         showToast("AI found no sensitive information.", "success");
      }
    } catch(err) {
      showToast("AI Detection failed", "error");
    }
    setIsSearching(false);
  };

  const processRedaction = async () => {
    if (!fileUrl) return showToast('No files uploaded', 'error');
    if (boxes.length === 0) return showToast('Please draw at least one redaction box.', 'error');
    if (!window.confirm("Are you sure? This action is irreversible.")) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => prev >= 90 ? prev : prev + 10);
      }, 200);

      const scaledBoxes = boxes.map(box => ({
        pageIndex: box.pageIndex,
        x: (box.x / 100) * 700, 
        y: (box.y / 100) * 700,
        width: (box.width / 100) * 700,
        height: (box.height / 100) * 700,
        color: box.color,
        text: box.text,
        opacity: box.opacity
      }));

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'redact-pdf', 
          fileUrl,
          boxes: scaledBoxes,
          options
        })
      });

      const data = await response.json();

      if (response.ok && data.downloadUrl) {
        const resp = await fetch(data.downloadUrl);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = options.smartFilename ? `${file.name.split('.')[0]}_Redacted.pdf` : 'Redacted_Document.pdf';
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        const entry = { time: new Date().toLocaleString(), file: file.name };
        setHistory(prev => [entry, ...prev].slice(0, 10));
        showToast("Redaction applied successfully!", 'success');
        setProgress(100);
      } else {
        throw new Error(data.error || 'Redaction failed');
      }
      clearInterval(progressInterval);
    } catch (error) {
      console.error(error);
      showToast("Error processing redaction", 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>Redact PDF | MasterPdf</title>
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Redact PDF</h1>
          <p className="text-base sm:text-lg opacity-80">Permanently hide sensitive info manually or via AI.</p>
        </div>

        <div className="flex justify-end mb-4 gap-2 max-w-7xl mx-auto w-full">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* SIDEBAR OPTIONS */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Settings size={18} /> Redaction Options
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fill Color</label>
                <input type="color" value={options.fillColor} onChange={(e) => setOptions({ ...options, fillColor: e.target.value })} className="w-full h-10 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Overlay Text</label>
                <input type="text" value={options.overlayText} onChange={(e) => setOptions({ ...options, overlayText: e.target.value })} placeholder="REDACTED" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Opacity (%)</label>
                <input type="range" min="0" max="100" value={options.overlayOpacity} onChange={(e) => setOptions({ ...options, overlayOpacity: e.target.value })} className="w-full" />
              </div>
              
              <hr className="border-gray-200 dark:border-gray-700"/>
              
              <button 
                onClick={runAIDetection} 
                disabled={isSearching}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50"
              >
                {isSearching ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>} Auto Redact PII
              </button>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-center gap-2 py-2 mt-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />} Advanced
              </button>

              {showAdvanced && (
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options.sanitizeMetadata} onChange={(e) => setOptions({ ...options, sanitizeMetadata: e.target.checked })} /> Remove Metadata</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options.removeComments} onChange={(e) => setOptions({ ...options, removeComments: e.target.checked })} /> Remove Comments</label>
                  <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={options.flattenForms} onChange={(e) => setOptions({ ...options, flattenForms: e.target.checked })} /> Flatten Forms</label>
                </div>
              )}
            </div>
          </div>

          {/* MAIN PREVIEW AREA */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[600px] flex flex-col items-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {!file ? (
                <div 
                  onDragOver={(e) => e.preventDefault()} 
                  onDrop={handleDrop} 
                  className="flex-1 w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer"
                  onClick={() => fileInputRef.current.click()}
                >
                  <input type="file" accept={ACCEPTED_FORMATS} onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                  <UploadCloud size={48} className="text-blue-500 mb-3" />
                  <p className="text-lg font-semibold">Upload PDF Document</p>
                  <button className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold mt-4 hover:bg-red-700 transition">
                    Browse Files
                  </button>
                </div>
              ) : (
                <div className="flex-1 w-full flex flex-col">
                  {/* Toolbar */}
                  <div className="flex flex-wrap justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawMode(!drawMode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${drawMode ? 'bg-blue-500 text-white shadow' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        {drawMode ? "Draw Mode" : "Preview"}
                      </button>
                      <button onClick={() => setBoxes([])} className="px-3 py-1.5 rounded-lg text-xs bg-red-100 text-red-600 hover:bg-red-200 font-bold">
                        Clear Boxes
                      </button>
                      <button onClick={clearAll} className="px-3 py-1.5 rounded-lg text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 font-bold">
                        <X size={14} className="inline"/> Clear All
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-lg disabled:opacity-30">Prev</button>
                      <span className="font-bold text-sm">{currentPage} / {numPages}</span>
                      <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage === numPages} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 rounded-lg disabled:opacity-30">Next</button>
                    </div>
                  </div>

                  {/* Find & Auto Mark Bar */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                      <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Type a word to redact everywhere..." className="w-full pl-10 p-2 border rounded-lg bg-white dark:bg-gray-900" />
                    </div>
                    <button onClick={handleFind} disabled={isSearching} className="px-6 py-2 bg-gray-800 text-white rounded-lg font-bold text-sm disabled:opacity-50">
                      {isSearching ? 'Scanning...' : 'Find & Mark All'}
                    </button>
                  </div>

                  {/* PDF Viewer */}
                  <div className="relative flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4 rounded-lg flex justify-center border border-gray-200 dark:border-gray-800">
                    <div 
                      ref={pdfContainerRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className={`relative shadow-lg inline-block select-none ${drawMode ? 'cursor-crosshair' : 'cursor-default'}`}
                      style={{ width: 'max-content', height: 'max-content' }} 
                    >
                      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={700} />
                      </Document>

                      {/* Render Drawn Boxes */}
                      {boxes.filter(b => b.pageIndex === currentPage - 1).map((box, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'absolute',
                            left: `${box.x}%`,
                            top: `${box.y}%`,
                            width: `${box.width}%`,
                            height: `${box.height}%`,
                            backgroundColor: box.color,
                            opacity: box.opacity / 100,
                            border: '1.5px solid red',
                            cursor: box.isDrawing ? 'crosshair' : 'pointer'
                          }}
                          onClick={(e) => { e.stopPropagation(); if (!box.isDrawing && !drawMode) removeBox(idx); }}
                        >
                          {box.text && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold pointer-events-none text-center px-1 overflow-hidden truncate">
                              {box.text}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={processRedaction}
                    disabled={isProcessing || boxes.length === 0}
                    className="mt-6 py-4 bg-[#E5322D] text-white font-bold text-lg rounded-xl flex justify-center items-center gap-2 disabled:bg-gray-400 hover:bg-red-700 shadow-md"
                  >
                    {isProcessing ? <><Loader2 className="animate-spin" /> Applying Redaction {progress}%</> : <><Shield size={24} /> Apply Redaction permanently</>}
                  </button>
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <History size={18} /> Recent Files
                  </h4>
                  <button onClick={() => setHistory([])} className="text-red-500 text-sm hover:underline font-bold">
                    Clear History
                  </button>
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-white dark:bg-gray-800 border p-3 rounded-lg shadow-sm">
                      <span className="font-medium">{item.file}</span>
                      <span className="opacity-50 text-xs">{item.time}</span>
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
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white font-bold ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
