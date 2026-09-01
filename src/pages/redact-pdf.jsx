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

// 🔥 FIX 1: Safe Worker URL (Matches your pdf-to-word file to prevent version crash)
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '3.11.174'}/build/pdf.worker.min.mjs`;
}

const ACCEPTED_FORMATS = '.pdf';
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB

export default function RedactPdf() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(''); // Local preview URL
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [boxes, setBoxes] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [drawMode, setDrawMode] = useState(true);
  
  const [pdfDocProxy, setPdfDocProxy] = useState(null);

  const [options, setOptions] = useState({
    fillColor: '#000000',
    overlayText: '',
    overlayOpacity: 100,
    sanitizeMetadata: true,
    removeComments: true,
    flattenForms: true,
    smartFilename: true
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

  // 🔥 FIX 2: Instant Local Preview (Prevents "Failed to load PDF file")
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !validateFile(selectedFile)) return;
    
    setFile(selectedFile);
    setBoxes([]);
    setCurrentPage(1);
    setSearchText('');
    setPdfDocProxy(null);
    
    // Create instant local URL for viewer, avoid network CORS errors
    setFileUrl(URL.createObjectURL(selectedFile));
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile || !validateFile(droppedFile)) return;
    
    setFile(droppedFile);
    setBoxes([]);
    setCurrentPage(1);
    setSearchText('');
    setPdfDocProxy(null);
    
    setFileUrl(URL.createObjectURL(droppedFile));
  };

  const clearAll = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl('');
    setBoxes([]);
    setCurrentPage(1);
    setPdfDocProxy(null);
  };

  const onDocumentLoadSuccess = (pdfDoc) => {
    setNumPages(pdfDoc.numPages);
    setPdfDocProxy(pdfDoc);
  };

  // --- MANUAL MOUSE DRAWING (100% REAL) ---
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

  // --- 🔥 REAL TEXT FINDER & MARKER (Extracts exact PDF coordinates) ---
  const performSearchAndMark = async (searchTerms) => {
    if (!pdfDocProxy || searchTerms.length === 0) return;
    setIsProcessing(true);
    
    try {
      const newBoxes = [];
      const terms = searchTerms.map(t => t.toLowerCase().trim()).filter(t => t.length > 1);

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocProxy.getPage(i);
        const textContent = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1 });

        textContent.items.forEach(item => {
          const str = item.str.toLowerCase();
          const isMatch = terms.some(term => str.includes(term));
          
          if (isMatch && item.str.trim() !== "") {
            const tx = item.transform[4];
            const ty = item.transform[5];
            const fontHeight = item.transform[3] || item.height || 10;
            const width = item.width;

            // Map native PDF coordinates to frontend percentage
            const xPct = (tx / viewport.width) * 100;
            const yPct = ((viewport.height - ty - fontHeight) / viewport.height) * 100;
            const wPct = (width / viewport.width) * 100;
            const hPct = (fontHeight / viewport.height) * 100;

            newBoxes.push({
              pageIndex: i - 1,
              x: Math.max(0, xPct), 
              y: Math.max(0, yPct - 1), 
              width: wPct + 1, 
              height: hPct + 2,
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
        showToast(`Marked ${newBoxes.length} elements instantly!`);
      } else {
        showToast("No matches found in the document.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Search Engine Error", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSearch = () => {
    if (!searchText.trim()) return showToast("Enter a word to search", "error");
    performSearchAndMark([searchText]);
  };

  // --- 🔥 AI SMART DETECTION (REAL Groq API CALL) ---
  const runAiDetection = async () => {
    if (!pdfDocProxy) return showToast("Upload a PDF first", "error");
    setIsProcessing(true);
    showToast("AI is analyzing document...");

    try {
      let fullText = "";
      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocProxy.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map(item => item.str).join(" ") + "\n";
      }
      fullText = fullText.substring(0, 10000); 

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-redact-detect', text: fullText })
      });
      
      const data = await response.json();

      if (response.ok && data.entities && data.entities.length > 0) {
        await performSearchAndMark(data.entities); // Auto mark all AI found entities
      } else {
        showToast("AI couldn't find any sensitive data.", "success");
      }
    } catch (err) {
      console.error(err);
      showToast("AI Detection failed.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- 🔥 APPLY REDACTION ---
  const processRedaction = async () => {
    if (!file) return showToast('No file found', 'error');
    if (boxes.length === 0) return showToast('No redaction boxes to apply.', 'error');
    if (!window.confirm("Are you sure? This will permanently black out the selected areas.")) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      const progressInterval = setInterval(() => {
        setProgress(prev => prev >= 85 ? prev : prev + 15);
      }, 300);

      // Upload file to Vercel Blob ONLY when processing starts
      const uploadedBlob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
      const finalFileUrl = uploadedBlob.url;

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
          fileUrl: finalFileUrl,
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
        showToast("Redaction Applied Successfully!", 'success');
        setProgress(100);
      } else {
        throw new Error(data.error || 'Redaction failed');
      }
      clearInterval(progressInterval);
    } catch (error) {
      console.error(error);
      showToast("Something went wrong", 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head><title>Redact PDF | MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Redact PDF</h1>
          <p className="opacity-80">Find and hide sensitive text automatically or manually.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* SIDEBAR */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Settings size={18} /> Options</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Fill Color</label>
                <input type="color" value={options.fillColor} onChange={(e) => setOptions({ ...options, fillColor: e.target.value })} className="w-full h-10 border rounded cursor-pointer" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Overlay Text (Optional)</label>
                <input type="text" value={options.overlayText} onChange={(e) => setOptions({ ...options, overlayText: e.target.value })} placeholder="e.g. HIDDEN" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              {/* Smart AI Detection Button */}
              <button onClick={runAiDetection} disabled={isProcessing || !fileUrl} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 disabled:opacity-50 transition shadow-md">
                <Sparkles size={18} /> AI Smart Redact
              </button>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-center gap-2 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg mt-4">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />} Advanced Specs
              </button>

              {showAdvanced && (
                <div className="space-y-3 mt-2 text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={options.sanitizeMetadata} onChange={(e) => setOptions({ ...options, sanitizeMetadata: e.target.checked })} /> Remove Metadata</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={options.flattenForms} onChange={(e) => setOptions({ ...options, flattenForms: e.target.checked })} /> Flatten PDF</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={options.smartFilename} onChange={(e) => setOptions({ ...options, smartFilename: e.target.checked })} /> Smart Rename</label>
                </div>
              )}
            </div>
          </div>

          {/* MAIN AREA */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[600px] flex flex-col items-center ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {!file ? (
                <div className="flex-1 w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
                  <input type="file" accept={ACCEPTED_FORMATS} onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                  <UploadCloud size={48} className="text-blue-500 mb-3" />
                  <p className="text-lg font-semibold">Upload PDF Document</p>
                  <button onClick={() => fileInputRef.current.click()} className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold mt-4 hover:bg-red-700 transition shadow-lg">Browse File</button>
                </div>
              ) : (
                <div className="flex-1 w-full flex flex-col">
                  {/* ToolBar */}
                  <div className="flex flex-wrap justify-between items-center mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg gap-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDrawMode(!drawMode)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${drawMode ? 'bg-blue-500 text-white shadow' : 'bg-gray-200 dark:bg-gray-600'}`}>
                        {drawMode ? "Draw Mode" : "Select Mode"}
                      </button>
                      <button onClick={() => setBoxes([])} className="px-3 py-1.5 rounded-lg text-xs bg-red-100 text-red-600 hover:bg-red-200 font-bold transition">Clear Boxes</button>
                      <button onClick={clearAll} className="px-3 py-1.5 rounded-lg text-xs bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 font-bold transition flex items-center gap-1"><X size={14}/> Reset File</button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 font-bold rounded-lg disabled:opacity-30">{'<'}</button>
                      <span className="font-bold text-sm">Pg {currentPage} / {numPages}</span>
                      <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage === numPages} className="px-3 py-1 bg-gray-200 dark:bg-gray-600 font-bold rounded-lg disabled:opacity-30">{'>'}</button>
                    </div>
                  </div>

                  {/* Real-time Find & Mark Box */}
                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
                      <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()} placeholder="Type word and hit Mark All..." className="w-full pl-10 p-2.5 font-medium border rounded-lg bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <button onClick={handleManualSearch} disabled={isProcessing} className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-bold shadow-md transition disabled:opacity-50">
                      Mark All
                    </button>
                  </div>

                  {/* PDF Render Box */}
                  <div className="relative flex-1 overflow-auto bg-gray-100 dark:bg-gray-900 p-4 rounded-xl flex justify-center border border-gray-200 dark:border-gray-800 shadow-inner min-h-[400px]">
                    <div 
                      ref={pdfContainerRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className={`relative shadow-xl inline-block select-none ${drawMode ? 'cursor-crosshair' : 'cursor-default'}`}
                      style={{ width: 'max-content', height: 'max-content' }}
                    >
                      <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={700} />
                      </Document>

                      {/* Display Coordinates Boxes */}
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
                            boxShadow: '0 0 4px rgba(255,0,0,0.5)',
                            cursor: box.isDrawing ? 'crosshair' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          onClick={(e) => { e.stopPropagation(); if (!box.isDrawing && !drawMode) removeBox(idx); }}
                        >
                          {box.text && <span className="text-white text-[10px] font-bold overflow-hidden">{box.text}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={processRedaction} disabled={isProcessing || boxes.length === 0} className="mt-6 py-4 bg-[#E5322D] hover:bg-red-700 text-white font-bold text-lg rounded-xl flex justify-center items-center gap-2 disabled:bg-gray-400 transition shadow-lg">
                    {isProcessing ? <><Loader2 className="animate-spin" size={24} /> Processing {progress}%</> : <><Shield size={24} /> Apply Permanent Redaction</>}
                  </button>
                </div>
              )}
            </div>

            {/* History Footer */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2">
                    <History size={18} /> History
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
        <div className={`fixed bottom-4 right-4 p-4 rounded-xl shadow-2xl font-bold text-white z-50 ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
