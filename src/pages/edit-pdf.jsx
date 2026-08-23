import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  UploadCloud, X, Edit3, Lock, Share2, History, Shield, Stamp, 
  FileText, Trash2, Users, MessageSquare, Printer, 
  Loader2, Menu, Type, Highlighter, Download, Plus, Minus,
  RotateCw, Moon, Sun, Search, Shapes, KeyRound, Unlock,
  Bot, Languages, FileOutput, Split
} from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { upload } from '@vercel/blob/client';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import { PDFDocument, rgb } from 'pdf-lib';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function EditPdf() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Core State
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileId, setFileId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Viewer State
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Tools State
  const [activeTool, setActiveTool] = useState('select');
  const [selectedShape, setSelectedShape] = useState('rectangle');
  const [stampText, setStampText] = useState('APPROVED');
  const [pagesToDelete, setPagesToDelete] = useState([]);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Elements State
  const [elements, setElements] = useState([]);
  const [showSignModal, setShowSignModal] = useState(false);
  const signCanvasRef = useRef(null);
  const containerRef = useRef(null);

  // Modal & Passwords
  const [aiResult, setAiResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [password, setPassword] = useState('');

  const [permissions, setPermissions] = useState({ allowEditing: true, allowPrinting: false });
  const [ocrEnabled, setOcrEnabled] = useState(false);

  // File Upload (Instant + Background)
  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      try {
        const blob = await upload(selectedFile.name, selectedFile, {
          access: 'public', handleUploadUrl: '/api/upload',
        });
        const token = await getToken();
        const res = await fetch('/api/edit-pdf', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'create-file', fileUrl: blob.url, fileName: selectedFile.name, fileSize: selectedFile.size })
        });
        const data = await res.json();
        if (data.success) setFileId(data.fileId);
      } catch (err) { console.error("Background Sync Failed:", err); }
    } else alert("Please upload a valid PDF file.");
    e.target.value = null;
  };

  // LOCAL TOOLS (Text, Highlight, etc.)
  const addElement = (type) => {
    let newEl = { id: Date.now(), type, page: currentPage, x: 50, y: 50, width: 200, height: 50, value: '', fontSize: 24, color: '#000000' };
    if (type === 'text') newEl.value = "Type here...";
    if (type === 'highlight') newEl.color = 'rgba(255, 235, 59, 0.5)';
    if (type === 'stamp') newEl.value = stampText;
    if (type === 'shape') { newEl.shape = selectedShape; newEl.height = 100; }
    if (type === 'redact') newEl.color = 'rgb(0, 0, 0)';
    setElements([...elements, newEl]);
  };

  // Canvas Drawing for Signature
  const openSignModal = () => {
    setShowSignModal(true);
    setTimeout(() => {
      if (signCanvasRef.current) {
        const ctx = signCanvasRef.current.getContext('2d');
        ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#000';
      }
    }, 100);
  };
  const startDraw = (e) => {
    const rect = signCanvasRef.current.getBoundingClientRect();
    const scaleX = signCanvasRef.current.width / rect.width;
    const scaleY = signCanvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = signCanvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(x, y); 
    // Webkit / Mozilla support check for mouse coords
    const realX = e.clientX || (e.touches && e.touches[0].clientX);
    const realY = e.clientY || (e.touches && e.touches[0].clientY);
    const posX = (realX - rect.left) * scaleX;
    const posY = (realY - rect.top) * scaleY;
    ctx.lineTo(posX, posY); ctx.stroke();
  };
  const draw = (e) => {
    if (!e.buttons && !e.touches) return;
    const rect = signCanvasRef.current.getBoundingClientRect();
    const scaleX = signCanvasRef.current.width / rect.width;
    const scaleY = signCanvasRef.current.height / rect.height;
    const realX = e.clientX || (e.touches && e.touches[0].clientX);
    const realY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = (realX - rect.left) * scaleX;
    const y = (realY - rect.top) * scaleY;
    const ctx = signCanvasRef.current.getContext('2d');
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDraw = () => {};
  const saveSignature = () => {
    const imgData = signCanvasRef.current.toDataURL('image/png');
    const newEl = { id: Date.now(), type: 'signature', page: currentPage, x: 50, y: 50, width: 200, height: 100, imgData };
    setElements([...elements, newEl]);
    setShowSignModal(false);
  };

  // VIEW TOOLS
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const rotatePage = () => setRotation(prev => (prev + 90) % 360);
  const handleSearch = (e) => {
    if (e.key === 'Enter' && containerRef.current) {
      window.find(searchTerm, false, false, true, false, false, false);
    }
  };

  // UPDATE & DELETE LOCAL ELEMENTS
  const updateElement = (id, newProps) => setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  const deleteElement = (id) => setElements(elements.filter(el => el.id !== id));

  // BACKEND API CALLS (Security, Page Management, AI)
  const callBackend = async (action, params = {}) => {
    try {
      const token = await getToken();
      const res = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action, fileUrl, ...params })
      });
      const data = await res.json();
      
      if (data.success || data.textResult) {
        // AI Result Modal
        if (action === 'ai-summarizer' || action === 'translate-pdf') {
          setAiResult(data.textResult);
          setShowAiModal(true);
        } 
        // Split PDF Downloads
        else if (action === 'split-pdf' && data.downloadUrls) {
          data.downloadUrls.forEach(url => {
            const link = document.createElement('a');
            link.href = url;
            link.download = `page-${Math.random()}.pdf`;
            link.click();
          });
          alert("All pages downloaded!");
        }
        // Page Operations
        else if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = `processed-${Date.now()}.pdf`;
          link.click();
          alert("Operation successful!");
        }
      } else {
        alert(data.error || "Action failed!");
      }
    } catch (e) { alert("Server error: " + e.message); }
  };

  // BACKEND ACTIONS
  const deleteCurrentPage = () => {
    if (pagesToDelete.includes(currentPage)) {
      setPagesToDelete(pagesToDelete.filter(p => p !== currentPage));
    } else {
      setPagesToDelete([...pagesToDelete, currentPage]);
    }
  };

  const extractPages = () => {
    const input = prompt("Enter pages to extract (e.g., 1-3,5):");
    if (!input) return;
    const indices = input.split(',').flatMap(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
      }
      return [Number(part) - 1];
    });
    callBackend('extract-pages', { pageIndices: indices });
  };

  const splitPdf = () => {
    callBackend('split-pdf');
  };

  const handleProtect = () => {
    if (!password) return alert("Enter a password first");
    callBackend('protect-pdf', { password });
  };

  const handleUnlock = () => {
    if (!password) return alert("Enter password to unlock");
    callBackend('unlock-pdf', { password });
  };

  // SAVE & DOWNLOAD LOCAL EDITS
  const saveAndDownload = async () => {
    setIsSaving(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Delete Pages (Local)
      if (pagesToDelete.length > 0) {
        pagesToDelete.sort((a, b) => b - a).forEach(page => {
          if (page >= 1 && page <= pdfDoc.getPageCount()) {
            pdfDoc.removePage(page - 1);
          }
        });
      }

      const pages = pdfDoc.getPages();
      for (const el of elements) {
        if (el.page > pages.length) continue;
        const page = pages[el.page - 1];
        const { height: pH } = page.getSize();
        const sf = 1.2;
        const x = el.x / sf;
        const y = pH - (el.y / sf) - (el.height / sf);
        const w = el.width / sf;
        const h = el.height / sf;

        if (el.type === 'text' || el.type === 'stamp') {
          page.drawText(el.value, { x: x + 5, y: y + 15, size: (el.fontSize || 24) / sf, color: rgb(0, 0, 0) });
        } else if (el.type === 'highlight') {
          page.drawRectangle({ x, y, width: w, height: h, color: rgb(1, 0.9, 0.1), opacity: 0.4 });
        } else if (el.type === 'redact') {
          page.drawRectangle({ x, y, width: w, height: h, color: rgb(0, 0, 0) });
        } else if (el.type === 'shape') {
          if (el.shape === 'circle') page.drawEllipse({ x: x + w/2, y: y + h/2, xScale: w/2, yScale: h/2, borderColor: rgb(0,0,0), borderWidth: 2 });
          else page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0,0,0), borderWidth: 2 });
        } else if (el.type === 'signature') {
          const imgBytes = await fetch(el.imgData).then(res => res.arrayBuffer());
          const pngImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pngImage, { x, y, width: w, height: h });
        }
      }

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Edited_${file.name}`;
      link.click();
    } catch (error) {
      alert("Error saving PDF: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#E5322D]" size={48} /></div>;
  if (!isSignedIn) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-900">Please <a href="/sign-in" className="text-[#E5322D] ml-1 hover:underline"> sign in</a> to use this editor.</div>;

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7]'} transition-colors`}>
      <Head><title>Pro Edit PDF - MasterPdf</title></Head>
      <Navbar />
      
      {/* STEP 1: UPLOAD SCREEN */}
      {!file ? (
        <main className="flex-grow flex items-center justify-center p-6">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg border border-gray-200 p-8 md:p-16 text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Advanced PDF Editor</h1>
            <p className="text-lg text-gray-600 mb-10 font-medium">Draw, highlight, add text, sign, manage pages, and more.</p>
            
            <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
            <label htmlFor="file-upload" className="cursor-pointer inline-flex items-center gap-3 bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              <UploadCloud size={28} /> Select PDF to Edit
            </label>
            <p className="mt-4 text-gray-500 font-medium">Full featured browser-based editor</p>
          </div>
        </main>
      ) : (
        // STEP 2: FULL EDITOR UI
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* Mobile Sidebar Overlay */}
          <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden ${showMobileSidebar ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setShowMobileSidebar(false)} />
          
          {/* SIDEBAR (TOOLS) */}
          <div className={`w-72 bg-white border-r border-gray-200 p-4 overflow-y-auto absolute lg:relative h-full z-50 transform transition-transform ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">Tools</h3>
              <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden text-gray-500 hover:text-red-500"><X size={20}/></button>
            </div>
            
            {/* Local Annotation Tools */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              <button onClick={() => setActiveTool('select')} className={`p-2 border rounded text-sm font-bold text-gray-900 ${activeTool === 'select' ? 'border-[#E5322D] bg-red-50' : 'border-gray-300'}`}>Select</button>
              <button onClick={() => { setActiveTool('text'); addElement('text'); }} className="p-2 border rounded text-sm font-bold text-gray-900 flex items-center justify-center gap-1 border-gray-300"><Type size={14}/> Text</button>
              <button onClick={() => setActiveTool('highlight')} className={`p-2 border rounded text-sm font-bold text-gray-900 ${activeTool === 'highlight' ? 'border-[#E5322D] bg-red-50' : 'border-gray-300'}`}>Highlight</button>
              <button onClick={openSignModal} className="p-2 border rounded text-sm font-bold text-gray-900 border-gray-300">Sign</button>
              <button onClick={() => setActiveTool('shape')} className={`p-2 border rounded text-sm font-bold text-gray-900 ${activeTool === 'shape' ? 'border-[#E5322D] bg-red-50' : 'border-gray-300'}`}><Shapes size={14}/> Shape</button>
              <button onClick={() => setActiveTool('redact')} className={`p-2 border rounded text-sm font-bold text-gray-900 ${activeTool === 'redact' ? 'border-[#E5322D] bg-red-50' : 'border-gray-300'}`}>Redact</button>
            </div>

            {/* Page Management */}
            <div className="mb-6 border-t pt-4">
              <h4 className="font-bold text-gray-900 mb-2">Page Management</h4>
              <button onClick={deleteCurrentPage} className={`w-full p-2 rounded mb-2 text-sm font-bold ${pagesToDelete.includes(currentPage) ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600'}`}>
                {pagesToDelete.includes(currentPage) ? "Unmark Delete" : "Delete Current Page"}
              </button>
              <button onClick={extractPages} className="w-full bg-blue-50 text-blue-700 p-2 rounded mb-2 text-sm font-bold flex items-center justify-center gap-2"><FileOutput size={16}/> Extract Pages</button>
              <button onClick={splitPdf} className="w-full bg-purple-50 text-purple-700 p-2 rounded text-sm font-bold flex items-center justify-center gap-2"><Split size={16}/> Split PDF</button>
            </div>

            {/* Security & AI */}
            <div className="mb-6 border-t pt-4">
              <h4 className="font-bold text-gray-900 mb-2">Security & AI</h4>
              <div className="flex gap-2 mb-2">
                <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 p-2 border rounded text-sm text-gray-900" />
                <button onClick={handleProtect} className="bg-gray-800 text-white p-2 rounded" title="Encrypt"><KeyRound size={16}/></button>
                <button onClick={handleUnlock} className="bg-gray-200 p-2 rounded" title="Decrypt"><Unlock size={16}/></button>
              </div>
              <button onClick={() => callBackend('ai-summarizer')} className="w-full bg-purple-100 text-purple-700 p-2 rounded mb-2 text-sm font-bold flex items-center justify-center gap-2"><Bot size={16}/> AI Summarize</button>
              <button onClick={() => callBackend('translate-pdf', { targetLanguage: 'Hindi' })} className="w-full bg-blue-100 text-blue-700 p-2 rounded text-sm font-bold flex items-center justify-center gap-2"><Languages size={16}/> Translate (Hindi)</button>
            </div>
          </div>

          {/* MAIN VIEWER */}
          <div className="flex-1 flex flex-col h-screen overflow-hidden">
            {/* Top Action Bar */}
            <div className="flex items-center justify-between p-3 border-b shadow-sm bg-white z-20">
              <div className="flex items-center gap-2">
                <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-2 border rounded text-gray-700"><Menu size={18} /></button>
                <span className="font-bold text-gray-900 truncate max-w-[120px] md:max-w-[300px]">{file.name}</span>
              </div>
              <div className="flex items-center gap-1 overflow-x-auto">
                <button onClick={zoomOut} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"><Minus size={18}/></button>
                <span className="text-sm font-bold text-gray-900 w-12 text-center">{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700"><Plus size={18}/></button>
                <button onClick={rotatePage} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700" title="Rotate"><RotateCw size={18}/></button>
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded bg-gray-100 hover:bg-gray-200 text-gray-700">
                  {darkMode ? <Sun size={18}/> : <Moon size={18}/>}
                </button>
                <div className="relative ml-2 hidden md:block">
                  <Search size={16} className="absolute left-2 top-2.5 text-gray-500" />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearch} placeholder="Search text" className="pl-8 pr-2 py-2 border rounded-lg w-48 text-gray-900" />
                </div>
                <button onClick={saveAndDownload} disabled={isSaving} className="ml-2 bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-1 whitespace-nowrap">
                  {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>} <span className="hidden md:inline">Save</span>
                </button>
                <button onClick={() => setFile(null)} className="p-2 rounded bg-gray-100 hover:bg-red-100 text-gray-700 hover:text-red-600 ml-1"><X size={20} /></button>
              </div>
            </div>

            {/* Viewer Area */}
            <div ref={containerRef} className={`flex-1 overflow-auto p-6 ${darkMode ? 'bg-gray-800' : 'bg-[#E4E4E4]'}`}>
              <div className="relative shadow-2xl mx-auto" style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}>
                <Document file={fileUrl} loading={<div className="p-10 text-gray-900">Loading...</div>}>
                  <Page pageNumber={currentPage} scale={1.2} renderTextLayer={true} renderAnnotationLayer={false} />
                </Document>
                
                {/* Elements Layer */}
                {elements.filter(el => el.page === currentPage).map((el) => (
                  <Rnd key={el.id} bounds="parent" position={{ x: el.x, y: el.y }} size={{ width: el.width, height: el.height }}
                    onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                    onResizeStop={(e, dir, ref, delta, pos) => updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...pos })}
                    className="group absolute border-2 border-transparent hover:border-gray-400 border-dashed flex items-center justify-center z-20 touch-none">
                    <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 text-xs opacity-0 group-hover:opacity-100"><X size={14}/></button>
                    
                    {el.type === 'text' && <input value={el.value} onChange={(e) => updateElement(el.id, { value: e.target.value })} className="w-full h-full bg-transparent outline-none text-center font-bold text-gray-900" style={{ fontSize: `${el.fontSize}px` }} />}
                    {el.type === 'highlight' && <div className="w-full h-full" style={{ backgroundColor: el.color }}></div>}
                    {el.type === 'redact' && <div className="w-full h-full bg-black"></div>}
                    {el.type === 'shape' && el.shape === 'rectangle' && <div className="w-full h-full border-2 border-black"></div>}
                    {el.type === 'shape' && el.shape === 'circle' && <div className="w-full h-full border-2 border-black rounded-full"></div>}
                    {el.type === 'stamp' && <div className="w-full h-full flex items-center justify-center border-4 border-double border-red-600 text-red-600 font-black text-xl">{el.value}</div>}
                    {el.type === 'signature' && <img src={el.imgData} className="w-full h-full object-contain" />}
                  </Rnd>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Signature Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
            <div className="flex justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">Draw Your Signature</h3>
              <button onClick={() => setShowSignModal(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="p-4">
              <canvas ref={signCanvasRef} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw} className="w-full h-40 border rounded cursor-crosshair" width={400} height={160} />
              <div className="flex justify-between mt-4">
                <button onClick={() => signCanvasRef.current.getContext('2d').clearRect(0, 0, 400, 160)} className="text-red-500 underline">Clear</button>
                <button onClick={saveSignature} className="bg-[#E5322D] text-white px-6 py-2 rounded-lg font-bold">Add Signature</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Result Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between p-4 border-b">
              <h3 className="font-bold text-gray-900">AI Result</h3>
              <button onClick={() => setShowAiModal(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
            </div>
            <div className="p-4 overflow-y-auto whitespace-pre-wrap text-gray-900">{aiResult || "Processing..."}</div>
          </div>
        </div>
      )}
    </div>
  );
}
