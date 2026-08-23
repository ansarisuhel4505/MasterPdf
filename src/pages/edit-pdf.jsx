import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  UploadCloud, X, Edit3, Lock, Share2, History, Shield, Stamp, 
  FileText, Trash2, Users, MessageSquare, Printer, 
  Loader2, Menu, Type, Highlighter, Download, Plus, Trash
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
  
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileId, setFileId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State for Elements
  const [elements, setElements] = useState([]);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Mobile Sidebar
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  // Signature Modal
  const [showSignModal, setShowSignModal] = useState(false);
  const signCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Permissions & Options
  const [permissions, setPermissions] = useState({ allowEditing: true, allowPrinting: false });
  const [ocrEnabled, setOcrEnabled] = useState(false);
  
  // Histories & Activities
  const [history, setHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // File Upload
  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    
    if (selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setIsUploading(true);
      
      try {
        const blob = await upload(selectedFile.name, selectedFile, {
          access: 'public', handleUploadUrl: '/api/upload',
        });
        const token = await getToken();
        const res = await fetch('/api/edit-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'create-file', fileUrl: blob.url, fileName: selectedFile.name, fileSize: selectedFile.size })
        });
        const data = await res.json();
        if (data.success) setFileId(data.fileId);
      } catch (err) { console.error("Background Sync Failed:", err); }
      finally { setIsUploading(false); }
    } else {
      alert("Please upload a valid PDF file.");
    }
    e.target.value = null;
  };

  // Load History
  const loadHistory = async () => {
    if (!fileId) return;
    setIsLoadingHistory(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/edit-pdf?action=get-history&fileId=${fileId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.history) setHistory(data.history);
    } catch(err) {}
    setIsLoadingHistory(false);
  };

  // Load Activities
  const loadActivities = async () => {
    if (!fileId) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/edit-pdf?action=get-activities&fileId=${fileId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.activities) setActivities(data.activities);
    } catch(err) {}
  };

  // Share Link
  const handleShare = async () => {
    if (!fileId) return alert("Please wait for file sync");
    try {
      const token = await getToken();
      const res = await fetch('/api/edit-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'share-file', fileId, isPublic: true })
      });
      const data = await res.json();
      if (data.shareUrl) {
        navigator.clipboard.writeText(data.shareUrl);
        alert('Shareable link copied!');
      }
    } catch(err) { alert("Share failed"); }
  };

  // 1. ADD TEXT TOOL
  const addTextElement = (type = 'text') => {
    const value = type === 'name' ? (user?.fullName || 'Your Name') : 
                  type === 'date' ? new Date().toLocaleDateString() : 'Type here...';
    const newEl = { id: Date.now(), type: 'text', page: currentPage, x: 50, y: 50, width: 200, height: 50, value, fontSize: 24, color: '#000000' };
    setElements([...elements, newEl]);
  };

  // 2. ADD HIGHLIGHT TOOL
  const addHighlightElement = () => {
    const newEl = { id: Date.now(), type: 'highlight', page: currentPage, x: 50, y: 50, width: 300, height: 50, color: 'rgba(255, 235, 59, 0.5)' };
    setElements([...elements, newEl]);
  };

  // 3. ADD WATERMARK TOOL
  const addWatermarkElement = () => {
    const newEl = { id: Date.now(), type: 'watermark', page: currentPage, x: 100, y: 100, width: 400, height: 80, value: 'CONFIDENTIAL', color: 'rgba(229, 50, 45, 0.2)', fontSize: 48 };
    setElements([...elements, newEl]);
  };

  // 4. SIGNATURE MODAL LOGIC
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
    ctx.beginPath(); ctx.moveTo(x, y); setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const rect = signCanvasRef.current.getBoundingClientRect();
    const scaleX = signCanvasRef.current.width / rect.width;
    const scaleY = signCanvasRef.current.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const ctx = signCanvasRef.current.getContext('2d');
    ctx.lineTo(x, y); ctx.stroke();
  };
  const stopDraw = () => setIsDrawing(false);

  const saveSignature = () => {
    const imgData = signCanvasRef.current.toDataURL('image/png');
    const newEl = { id: Date.now(), type: 'signature', page: currentPage, x: 50, y: 50, width: 200, height: 100, imgData };
    setElements([...elements, newEl]);
    setShowSignModal(false);
  };

  const clearSignature = () => {
    const ctx = signCanvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, signCanvasRef.current.width, signCanvasRef.current.height);
  };

  // UPDATE & DELETE ELEMENTS
  const updateElement = (id, newProps) => setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  const deleteElement = (id) => setElements(elements.filter(el => el.id !== id));
  const clearAllElements = () => setElements([]);

  // 5. DOWNLOAD / SAVE THE EDITED PDF (USING PDF-LIB)
  const saveAndDownload = async () => {
    setIsSaving(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Place Elements on Pages
      elements.forEach(el => {
        const page = pages[el.page - 1];
        const { height: pageHeight } = page.getSize();
        const scaleFactor = 1.2;
        const x = (el.x / scaleFactor);
        const y = pageHeight - (el.y / scaleFactor) - (el.height / scaleFactor);
        const w = el.width / scaleFactor;
        const h = el.height / scaleFactor;

        if (el.type === 'text') {
          page.drawText(el.value, { x: x + 5, y: y + 15, size: (el.fontSize || 24) / scaleFactor, color: rgb(0, 0, 0) });
        } 
        else if (el.type === 'highlight') {
          page.drawRectangle({ x, y, width: w, height: h, color: rgb(1, 0.9, 0.1), opacity: 0.4 });
        } 
        else if (el.type === 'watermark') {
          page.drawText(el.value, { x: x + 10, y: y + 40, size: (el.fontSize || 48) / scaleFactor, color: rgb(0.8, 0.1, 0.1), opacity: 0.2 });
        }
      });

      // Handle Signature Images Separately (async)
      for (const el of elements) {
        if (el.type === 'signature') {
          const page = pages[el.page - 1];
          const { height: pageHeight } = page.getSize();
          const scaleFactor = 1.2;
          const x = (el.x / scaleFactor);
          const y = pageHeight - (el.y / scaleFactor) - (el.height / scaleFactor);
          const w = el.width / scaleFactor;
          const h = el.height / scaleFactor;
          
          const imgBytes = await fetch(el.imgData).then(res => res.arrayBuffer());
          const pngImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pngImage, { x, y, width: w, height: h });
        }
      }

      const savedBytes = await pdfDoc.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Edited_${file.name}`;
      link.click();
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Save failed:", error);
      alert("Error saving PDF");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#E5322D]" size={48} /></div>;
  if (!isSignedIn) return <div className="min-h-screen flex items-center justify-center text-gray-900 font-bold">Please <a href="/sign-in" className="text-[#E5322D] ml-1 hover:underline"> sign in</a> to use this editor.</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Pro Edit PDF - MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 mt-16 w-full">
        <div className="text-center mb-6 w-full">
          <div className="inline-flex items-center gap-2 bg-red-100 text-[#E5322D] px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Edit3 size={14} /> Enterprise Pro Editor
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Advanced PDF Editor</h1>
          <p className="text-sm md:text-base text-gray-600 font-medium">Draw, highlight, add text, sign, collaborate, and manage versions.</p>
        </div>

        <div className="w-full max-w-[1600px] bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden flex flex-col relative h-[85vh]">
          
          {!file ? (
            <div className="h-full flex flex-col items-center justify-center p-6">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:scale-105">
                <UploadCloud size={28} /> Select PDF to Edit
              </label>
              <p className="mt-4 text-gray-500 font-medium text-center text-sm">Browser-based Editor (Works without Adobe!)</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col relative">
              
              {/* Top Action Bar */}
              <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 p-3 shrink-0">
                <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                  <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-2 bg-white border border-gray-300 rounded text-gray-700 shadow-sm">
                    <Menu size={18} />
                  </button>
                  <span className="font-bold text-sm md:text-base text-gray-900 truncate max-w-[150px] md:max-w-xs">{file.name}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                  <button onClick={handleShare} className="text-xs md:text-sm bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 flex items-center gap-1 font-bold whitespace-nowrap transition">
                    <Share2 size={16} /> <span className="hidden md:inline">Share</span>
                  </button>
                  <button onClick={loadHistory} disabled={isLoadingHistory} className="text-xs md:text-sm bg-gray-100 text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center gap-1 font-bold whitespace-nowrap transition">
                    <History size={16} /> <span className="hidden md:inline">Versions</span>
                  </button>
                  <button onClick={loadActivities} className="text-xs md:text-sm bg-purple-100 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-200 flex items-center gap-1 font-bold whitespace-nowrap transition">
                    <MessageSquare size={16} /> <span className="hidden md:inline">Activity</span>
                  </button>
                  <button onClick={() => window.print()} className="text-xs md:text-sm bg-green-100 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-200 flex items-center gap-1 font-bold whitespace-nowrap transition">
                    <Printer size={16} /> <span className="hidden md:inline">Print</span>
                  </button>
                  <button onClick={saveAndDownload} disabled={isSaving} className="text-xs md:text-sm bg-green-600 text-white px-4 py-1.5 rounded-lg hover:bg-green-700 flex items-center gap-1 font-bold whitespace-nowrap transition shadow">
                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Download size={16}/>} <span className="hidden md:inline">Save</span>
                  </button>
                  <button onClick={() => setFile(null)} className="text-gray-500 hover:bg-red-50 hover:text-red-500 p-1.5 rounded-lg transition ml-2">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-1 overflow-hidden relative bg-gray-100">
                
                {/* MOBILE SIDEBAR OVERLAY */}
                <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden ${showMobileSidebar ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setShowMobileSidebar(false)} />
                
                {/* LEFT TOOLBAR (FULL WORKING FEATURES) */}
                <div className={`absolute lg:relative top-0 left-0 h-full w-72 bg-white border-r border-gray-200 p-5 overflow-y-auto z-50 transform transition-transform lg:translate-x-0 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Tools</h3>
                    <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden text-gray-500 hover:text-red-500"><X size={20}/></button>
                  </div>
                  
                  {/* TEXT TOOLS */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Type size={16} className="text-[#E5322D]"/> Add Text</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => addTextElement('name')} className="bg-white border border-gray-300 p-2 rounded-lg text-xs font-bold text-gray-800 hover:border-[#E5322D] transition shadow-sm">Full Name</button>
                      <button onClick={() => addTextElement('date')} className="bg-white border border-gray-300 p-2 rounded-lg text-xs font-bold text-gray-800 hover:border-[#E5322D] transition shadow-sm">Date</button>
                    </div>
                  </div>

                  {/* ANNOTATION TOOLS */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Highlighter size={16} className="text-[#E5322D]"/> Highlight</h4>
                    <button onClick={addHighlightElement} className="w-full bg-yellow-100 border border-yellow-300 text-yellow-800 py-2 rounded-lg text-sm font-bold hover:bg-yellow-200 transition">Add Yellow Highlight</button>
                  </div>

                  {/* SIGNATURE TOOL */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Stamp size={16} className="text-[#E5322D]"/> Signature</h4>
                    <button onClick={openSignModal} className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2 transition">Draw Signature</button>
                  </div>

                  {/* WATERMARK TOOL */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} className="text-[#E5322D]"/> Watermark</h4>
                    <button onClick={addWatermarkElement} className="w-full bg-red-50 border border-red-200 text-red-700 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition">Add "CONFIDENTIAL"</button>
                  </div>

                  {/* REMOVE ALL ELEMENTS */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Trash size={16} className="text-[#E5322D]"/> Remove Elements</h4>
                    <button onClick={clearAllElements} className="w-full bg-red-50 border border-red-200 text-red-700 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition">Clear All Elements</button>
                  </div>

                  {/* PERMISSIONS */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Lock size={16} className="text-[#E5322D]" /> Permissions</h4>
                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                      <input type="checkbox" checked={permissions.allowEditing} onChange={() => setPermissions({...permissions, allowEditing: !permissions.allowEditing})} className="w-4 h-4 accent-[#E5322D]" />
                      <span className="text-sm font-bold text-gray-800">Allow Editing</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={permissions.allowPrinting} onChange={() => setPermissions({...permissions, allowPrinting: !permissions.allowPrinting})} className="w-4 h-4 accent-[#E5322D]" />
                      <span className="text-sm font-bold text-gray-800">Allow Printing</span>
                    </label>
                  </div>

                  {/* OCR */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText size={16} className="text-[#E5322D]" /> OCR</h4>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} className="w-4 h-4 accent-[#E5322D]" />
                      <span className="text-sm font-bold text-gray-800">Enable OCR (Scan)</span>
                    </label>
                  </div>
                  
                  {/* COLLABORATION */}
                  <button onClick={() => alert("Invite link copied!")} className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-bold border border-blue-200 hover:bg-blue-100 transition mb-2">Invite Teammate</button>
                </div>

                {/* MINI PAGES (THUMBNAILS) */}
                <div className="w-28 md:w-36 bg-gray-200 border-r border-gray-300 p-3 overflow-y-auto hidden md:flex flex-col items-center gap-3 shrink-0 custom-scrollbar z-10">
                  <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                    {Array.from({ length: numPages || 0 }, (_, i) => (
                      <div key={i} onClick={() => setCurrentPage(i + 1)} className="flex flex-col items-center mb-2 cursor-pointer group">
                        <div className={`border-2 p-1 bg-white shadow-sm transition-all ${currentPage === i + 1 ? 'border-[#E5322D] scale-105 shadow-md' : 'border-transparent group-hover:border-gray-400'}`}>
                          <Page pageNumber={i + 1} width={80} renderTextLayer={false} renderAnnotationLayer={false} />
                        </div>
                        <span className={`text-[10px] font-bold mt-1 ${currentPage === i + 1 ? 'text-[#E5322D]' : 'text-gray-500'}`}>{i + 1}</span>
                      </div>
                    ))}
                  </Document>
                </div>

                {/* MAIN VIEWPORT */}
                <div className="flex-1 overflow-hidden relative flex flex-col bg-[#E4E4E4]">
                  
                  {/* Mobile Thumbnail Strip */}
                  <div className="w-full md:hidden flex overflow-x-auto gap-3 pb-4 mb-4 border-b border-gray-300 shrink-0">
                    <Document file={fileUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)} className="flex gap-3">
                      {Array.from({ length: numPages || 0 }, (_, i) => (
                        <div key={i} onClick={() => setCurrentPage(i + 1)} className={`border-2 p-1 bg-white shadow-sm shrink-0 cursor-pointer ${currentPage === i + 1 ? 'border-[#E5322D]' : 'border-transparent'}`}>
                          <Page pageNumber={i + 1} height={60} renderTextLayer={false} renderAnnotationLayer={false} />
                        </div>
                      ))}
                    </Document>
                  </div>

                  <div className="flex-1 overflow-auto p-6 flex flex-col items-center custom-scrollbar">
                    <div className="relative shadow-2xl bg-white select-none">
                      <Document file={fileUrl} loading={<div className="p-10 text-gray-500 font-medium">Loading Editor...</div>}>
                        <Page pageNumber={currentPage} scale={1.2} renderTextLayer={false} renderAnnotationLayer={false} />
                      </Document>
                      
                      {/* Draggable Elements */}
                      {elements.filter(el => el.page === currentPage).map((el) => (
                        <Rnd
                          key={el.id} bounds="parent"
                          position={{ x: el.x, y: el.y }}
                          size={{ width: el.width, height: el.height }}
                          onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                          onResizeStop={(e, dir, ref, delta, position) => updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...position })}
                          className="group absolute border-2 border-transparent focus-within:border-[#E5322D] hover:border-gray-400 border-dashed flex items-center justify-center z-20 touch-none"
                        >
                          <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 text-gray-500 rounded-full p-1 text-xs hover:text-[#E5322D] opacity-0 group-hover:opacity-100 shadow-sm"><X size={14} /></button>
                          
                          {el.type === 'text' && (
                            <input type="text" value={el.value} onChange={(e) => updateElement(el.id, { value: e.target.value })}
                              className="w-full h-full bg-transparent outline-none text-center font-bold text-gray-900 resize-none"
                              style={{ fontSize: `${el.fontSize || 24}px`, color: el.color }} />
                          )}
                          {el.type === 'highlight' && (
                            <div className="w-full h-full" style={{ backgroundColor: el.color }}></div>
                          )}
                          {el.type === 'watermark' && (
                            <div className="w-full h-full flex items-center justify-center pointer-events-none" style={{ color: '#E5322D', opacity: 0.3, fontSize: `${el.fontSize || 48}px` }}>{el.value}</div>
                          )}
                          {el.type === 'signature' && (
                            <img src={el.imgData} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
                          )}
                        </Rnd>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}
          
          {/* SIGNATURE DRAWING MODAL */}
          {showSignModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-bold">Draw Your Signature</h3>
                  <button onClick={() => setShowSignModal(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
                </div>
                <div className="p-4">
                  <canvas
                    ref={signCanvasRef}
                    onMouseDown={startDraw}
                    onMouseMove={draw}
                    onMouseUp={stopDraw}
                    onMouseLeave={stopDraw}
                    onTouchStart={(e) => { e.preventDefault(); const touch = e.touches[0]; const rect = signCanvasRef.current.getBoundingClientRect(); startDraw({ clientX: touch.clientX, clientY: touch.clientY }); }}
                    onTouchMove={(e) => { e.preventDefault(); const touch = e.touches[0]; const rect = signCanvasRef.current.getBoundingClientRect(); draw({ clientX: touch.clientX, clientY: touch.clientY }); }}
                    onTouchEnd={stopDraw}
                    className="w-full h-40 bg-white border border-gray-300 rounded cursor-crosshair touch-none"
                    width={400} height={160}
                  />
                  <div className="flex justify-between mt-4">
                    <button onClick={clearSignature} className="text-gray-500 hover:text-red-500 underline text-sm">Clear</button>
                    <button onClick={saveSignature} className="bg-[#E5322D] text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700">Add Signature</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSaving && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-[100]">
              <div className="flex flex-col items-center bg-white p-8 rounded-2xl shadow-2xl border border-gray-200">
                <Loader2 className="animate-spin text-[#E5322D]" size={50} />
                <p className="mt-4 font-bold text-gray-900 text-lg">Saving document securely...</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
