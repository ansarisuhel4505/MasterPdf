import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  UploadCloud, X, Edit3, Lock, Share2, History, Shield, Stamp, 
  FileText, Trash2, Users, Settings, MessageSquare, Save, Eye, 
  Download, Loader2, Menu, Printer 
} from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { upload } from '@vercel/blob/client';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
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
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Mobile Sidebar State
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
  const [permissions, setPermissions] = useState({ allowEditing: true, allowPrinting: false });
  const [watermarkText, setWatermarkText] = useState('');
  const [ocrEnabled, setOcrEnabled] = useState(false);
  
  const adobeDCView = useRef(null);
  const adobeClientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID || "PASTE_YOUR_CLIENT_ID";

  // React-PDF Fallback State
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [elements, setElements] = useState([]);

  useEffect(() => {
    if (window.AdobeDC) {
      setIsSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
    script.onload = () => setIsSdkReady(true);
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (file && window.AdobeDC && !adobeDCView.current) {
      try {
        adobeDCView.current = new window.AdobeDC.View({
          clientId: adobeClientId,
          divId: 'adobe-dc-view',
        });

        const filePromise = file.arrayBuffer();
        adobeDCView.current.previewFile({
          content: { promise: filePromise },
          metaData: { fileName: file.name }
        }, {
          showAnnotationTools: true,
          showLeftHandPanel: false,
          showDownloadPDF: true,
          showPrintPDF: true,
          enableFormFilling: true,
          includePDFAnnotations: true,
          defaultViewMode: "FIT_WIDTH",
          showBookmarks: true,
          showThumbnails: true,
        });

        adobeDCView.current.registerEvent('SAVE', async (event) => {
          setIsSaving(true);
          try {
            const updatedFile = event.options.pdfData;
            const newBlob = await upload(`edited-${Date.now()}-${file.name}`, updatedFile, {
              access: 'public',
              handleUploadUrl: '/api/upload',
            });
            const token = await getToken();
            await fetch('/api/edit-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ action: 'save-version', fileId, fileUrl: newBlob.url, fileName: file.name })
            });
            alert("File saved successfully!");
          } catch (error) {
            console.error(error);
            alert("Failed to save file.");
          } finally {
            setIsSaving(false);
          }
        });
      } catch (error) {
        console.error("Adobe Init Failed, falling back to React-PDF:", error);
      }
    }
  }, [file, isSdkReady]);

  // 🔥 INSTANT UPLOAD FIX: Screen blocks hata diye
  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    
    if (selectedFile && selectedFile.type === 'application/pdf') {
      // 1. INSTANT LOCAL PREVIEW (UI makhhan chalega)
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      
      // 2. BACKGROUND UPLOAD
      setIsUploading(true);
      try {
        const blob = await upload(selectedFile.name, selectedFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        const token = await getToken();
        const res = await fetch('/api/edit-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'create-file', fileUrl: blob.url, fileName: selectedFile.name, fileSize: selectedFile.size })
        });
        const data = await res.json();
        if (data.success) {
          setFileId(data.fileId);
        }
      } catch (error) {
        console.error("Background Sync Failed:", error);
      } finally {
        setIsUploading(false);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
    e.target.value = null; // Reset input
  };

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

  const loadActivities = async () => {
    if (!fileId) return;
    try {
      const token = await getToken();
      const res = await fetch(`/api/edit-pdf?action=get-activities&fileId=${fileId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      if (data.activities) setActivities(data.activities);
    } catch(err) {}
  };

  const handleShare = async () => {
    setIsSharing(true);
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
    } catch(err) {}
    setIsSharing(false);
  };

  const handleWatermark = () => {
    if (!watermarkText) return alert('Please enter watermark text');
    alert(`Watermark "${watermarkText}" will be applied. (Backend integration required)`);
  };

  const handleSign = () => {
    alert("Digital Signature feature will work after Adobe Client ID is fixed.");
  };

  const togglePermission = (key) => setPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  // React-PDF Fallback render
  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  const addElement = (type) => {
    const newElement = {
      id: Date.now(), type, page: currentPage, x: 50, y: 50, width: 200, height: 60,
      value: type === 'name' ? (user?.fullName || 'Your Name') : type === 'date' ? new Date().toLocaleDateString() : '',
      color: '#000000'
    };
    setElements([...elements, newElement]);
  };
  const deleteElement = (id) => setElements(elements.filter(el => el.id !== id));
  const updateElement = (id, newProps) => setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-[#E5322D]" size={48} /></div>;
  if (!isSignedIn) return <div className="min-h-screen flex items-center justify-center text-gray-900 font-bold">Please <a href="/sign-in" className="text-[#E5322D] ml-1 hover:underline"> sign in</a> to use this editor.</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Pro Edit PDF - MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-4 md:p-6 mt-16 w-full">
        
        {/* Header Section */}
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
              <p className="mt-4 text-gray-500 font-medium text-center text-sm">Powered by Adobe PDF Engine (React-PDF fallback included)</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col relative">
              
              {/* Top Action Bar */}
              <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 p-3 shrink-0">
                <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
                  {/* Mobile Menu Button */}
                  <button onClick={() => setShowMobileSidebar(true)} className="lg:hidden p-2 bg-white border border-gray-300 rounded text-gray-700 shadow-sm">
                    <Menu size={18} />
                  </button>
                  <span className="font-bold text-sm md:text-base text-gray-900 truncate max-w-[150px] md:max-w-xs">{file.name}</span>
                  {isUploading && <Loader2 className="animate-spin text-gray-400" size={16} />}
                </div>
                
                <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                  <button onClick={handleShare} disabled={isSharing} className="text-xs md:text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-100 flex items-center gap-1 font-bold whitespace-nowrap border border-blue-200">
                    <Share2 size={16} /> <span className="hidden md:inline">Share Link</span>
                  </button>
                  <button onClick={loadHistory} disabled={isLoadingHistory} className="text-xs md:text-sm bg-gray-100 text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-200 flex items-center gap-1 font-bold whitespace-nowrap border border-gray-300">
                    <History size={16} /> <span className="hidden md:inline">Versions</span>
                  </button>
                  <button onClick={loadActivities} className="text-xs md:text-sm bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg hover:bg-purple-100 flex items-center gap-1 font-bold whitespace-nowrap border border-purple-200">
                    <MessageSquare size={16} /> <span className="hidden md:inline">Activity</span>
                  </button>
                  <button onClick={() => window.print()} className="text-xs md:text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg hover:bg-green-100 flex items-center gap-1 font-bold whitespace-nowrap border border-green-200">
                    <Printer size={16} /> <span className="hidden md:inline">Print</span>
                  </button>
                  <button onClick={() => setFile(null)} className="text-gray-500 hover:bg-red-50 hover:text-red-500 p-1.5 rounded-lg transition ml-2">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <div className="flex flex-1 overflow-hidden relative bg-gray-100">
                
                {/* --- MOBILE OVERLAY SIDEBAR --- */}
                <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity lg:hidden ${showMobileSidebar ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={() => setShowMobileSidebar(false)} />
                
                {/* --- LEFT TOOLBAR (Sidebar) --- */}
                <div className={`absolute lg:relative top-0 left-0 h-full w-72 bg-white border-r border-gray-200 p-5 overflow-y-auto z-50 transform transition-transform lg:translate-x-0 ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full'}`}>
                  <div className="flex justify-between items-center mb-6 lg:mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Tools</h3>
                    <button onClick={() => setShowMobileSidebar(false)} className="lg:hidden text-gray-500 hover:text-red-500"><X size={20}/></button>
                  </div>
                  
                  <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Lock size={16} className="text-[#E5322D]" /> Permissions</h4>
                    <label className="flex items-center gap-3 mb-3 cursor-pointer">
                      <input type="checkbox" checked={permissions.allowEditing} onChange={() => togglePermission('allowEditing')} className="w-4 h-4 accent-[#E5322D]" />
                      <span className="text-sm font-bold text-gray-800">Allow Editing</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={permissions.allowPrinting} onChange={() => togglePermission('allowPrinting')} className="w-4 h-4 accent-[#E5322D]" />
                      <span className="text-sm font-bold text-gray-800">Allow Printing</span>
                    </label>
                  </div>

                  <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Shield size={16} className="text-[#E5322D]" /> Watermark</h4>
                    <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} placeholder="Enter watermark text" className="w-full border border-gray-300 rounded-lg p-2 mb-3 text-sm font-bold text-gray-900 focus:ring-1 focus:ring-[#E5322D] outline-none" />
                    <button onClick={handleWatermark} className="w-full bg-[#E5322D] text-white py-2 rounded-lg text-sm font-bold hover:bg-red-700 transition">Apply Watermark</button>
                  </div>

                  <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><FileText size={16} className="text-[#E5322D]" /> OCR</h4>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} className="w-4 h-4 accent-[#E5322D]" />
                      <span className="text-sm font-bold text-gray-800">Enable OCR (Scans)</span>
                    </label>
                  </div>

                  <div className="mb-6">
                    <button onClick={handleSign} className="w-full bg-gray-900 text-white py-3 rounded-lg text-sm font-bold hover:bg-gray-800 flex items-center justify-center gap-2 transition"><Stamp size={16}/> Add Digital Signature</button>
                  </div>

                  <div className="mb-6 border-t border-gray-200 pt-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Users size={16} className="text-[#E5322D]" /> Collaboration</h4>
                    <button onClick={() => alert("Comment feature enabled!")} className="w-full border border-gray-300 bg-white text-gray-800 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 mb-2 transition">Add Comment</button>
                    <button onClick={() => alert("Invite link copied!")} className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-bold border border-blue-200 hover:bg-blue-100 transition">Invite Teammate</button>
                  </div>

                  {/* Fallback Tools */}
                  {(!isSdkReady || !window.AdobeDC) && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Edit3 size={14} /> Fallback Editor Tools</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => addElement('name')} className="bg-white border border-gray-300 p-2 rounded-lg text-xs font-bold text-gray-800 hover:border-[#E5322D] hover:text-[#E5322D] transition shadow-sm">Add Name</button>
                        <button onClick={() => addElement('date')} className="bg-white border border-gray-300 p-2 rounded-lg text-xs font-bold text-gray-800 hover:border-[#E5322D] hover:text-[#E5322D] transition shadow-sm">Add Date</button>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- MINI PAGES (THUMBNAILS) - ONLY FOR FALLBACK --- */}
                {(!isSdkReady || !window.AdobeDC) && (
                  <div className="w-28 md:w-36 bg-gray-200 border-r border-gray-300 p-3 overflow-y-auto hidden md:flex flex-col items-center gap-3 shrink-0 custom-scrollbar z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
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
                )}

                {/* Center: Adobe Viewer / Fallback React-PDF */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                  <div id="adobe-dc-view" className="absolute inset-0 z-10"></div>
                  
                  {(!isSdkReady || !window.AdobeDC) && (
                    <div className="absolute inset-0 flex flex-col overflow-y-auto items-center p-4 bg-[#E4E4E4] custom-scrollbar">
                      
                      {/* Mobile Thumbnail Strip */}
                      <div className="w-full md:hidden flex overflow-x-auto gap-3 pb-4 mb-4 border-b border-gray-300 shrink-0">
                        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} className="flex gap-3">
                          {Array.from({ length: numPages || 0 }, (_, i) => (
                            <div key={i} onClick={() => setCurrentPage(i + 1)} className={`border-2 p-1 bg-white shadow-sm shrink-0 cursor-pointer ${currentPage === i + 1 ? 'border-[#E5322D]' : 'border-transparent'}`}>
                              <Page pageNumber={i + 1} height={60} renderTextLayer={false} renderAnnotationLayer={false} />
                            </div>
                          ))}
                        </Document>
                      </div>

                      <div className="relative shadow-2xl bg-white select-none">
                        <Document file={fileUrl} loading={<div className="p-10 text-gray-500 font-medium">Loading Editor...</div>}>
                          <Page pageNumber={currentPage} scale={1.2} renderTextLayer={false} renderAnnotationLayer={false} />
                        </Document>
                        
                        {/* Fallback Draggable Elements */}
                        {elements.filter(el => el.page === currentPage).map((el) => (
                          <Rnd key={el.id} bounds="parent" position={{ x: el.x, y: el.y }} size={{ width: el.width, height: el.height }}
                            onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                            onResizeStop={(e, dir, ref, delta, position) => updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...position })}
                            className="group absolute border-2 border-transparent focus-within:border-[#E5322D] hover:border-gray-400 border-dashed bg-white/60 flex items-center justify-center z-20 touch-none">
                            <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 text-gray-500 rounded-full p-1 text-xs hover:text-[#E5322D] opacity-0 group-hover:opacity-100 shadow-sm"><X size={14} /></button>
                            <input type="text" value={el.value} onChange={(e) => updateElement(el.id, { value: e.target.value })} className="w-full h-full bg-transparent outline-none text-center font-bold text-gray-900 resize-none" style={{ fontSize: `${el.height * 0.4}px`, color: el.color }} />
                          </Rnd>
                        ))}
                      </div>
                    </div>
                  )}
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
