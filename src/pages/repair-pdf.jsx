import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'framer-motion'; 
import { 
  UploadCloud, Download, FileText, Settings, CheckCircle, 
  AlertTriangle, Loader2, Lock, Eye, Shield, Trash2, Cpu, Wrench
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '3.11.174'}/build/pdf.worker.min.mjs`;
}

export default function RepairPDF() {
  const [files, setFiles] = useState([]); // Multi-file array
  const [activeFileId, setActiveFileId] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Enterprise Options
  const [options, setOptions] = useState({
    recoveryLevel: 'auto', // auto, quick, balanced, deep
    aiCleanup: false,
    compress: false,
    watermark: { enabled: false, text: 'CONFIDENTIAL' },
    encrypt: { enabled: false, password: '' },
    includeReport: true
  });

  const [globalLoading, setGlobalLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- MULTI-FILE UPLOAD & INSTANT PREVIEW ---
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(f => f.type === 'application/pdf');
    if (selectedFiles.length === 0) return showToast("Please select valid PDF files.", "error");

    const newFiles = selectedFiles.map(file => {
      const id = `file-${Date.now()}-${Math.random()}`;
      return {
        id,
        file,
        name: file.name,
        localUrl: URL.createObjectURL(file), // Instant load
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        status: 'pending', // pending, processing, success, error
        progress: 0,
        resultUrl: null,
        report: null
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    if (!activeFileId) setActiveFileId(newFiles[0].id);
    e.target.value = '';
  };

  const removeFile = (id) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activeFileId === id) setActiveFileId(filtered.length > 0 ? filtered[0].id : null);
      return filtered;
    });
  };

  const activeFile = files.find(f => f.id === activeFileId);

  // --- MASTER REPAIR ENGINE (Multi-File Processing) ---
  const handleRepairAll = async () => {
    const pendingFiles = files.filter(f => f.status !== 'success');
    if (pendingFiles.length === 0) return showToast("No files to repair.", "error");

    setGlobalLoading(true);

    for (const fileObj of pendingFiles) {
      // Update status to processing
      setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'processing', progress: 10 } : f));

      try {
        // 1. Upload to Vercel Blob
        const uploadedBlob = await upload(`repair_${Date.now()}_${fileObj.name}`, fileObj.file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, progress: 40 } : f));

        // 2. API Call to master-convert
        const payload = {
          action: 'repair-pdf',
          fileUrl: uploadedBlob.url,
          options: {
            recoveryLevel: options.recoveryLevel,
            aiCleanup: options.aiCleanup,
            applyTransform: {
              compress: options.compress,
              watermark: options.watermark.enabled ? options.watermark : null,
              encrypt: options.encrypt.enabled ? { password: options.encrypt.password } : null
            },
            includeReport: options.includeReport
          }
        };

        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.downloadUrl) {
          setFiles(prev => prev.map(f => f.id === fileObj.id ? { 
            ...f, 
            status: 'success', 
            progress: 100, 
            resultUrl: data.downloadUrl,
            report: data.report 
          } : f));
        } else {
          throw new Error(data.error || "Repair failed");
        }
      } catch (err) {
        console.error(err);
        setFiles(prev => prev.map(f => f.id === fileObj.id ? { ...f, status: 'error', progress: 0 } : f));
        showToast(`Failed to repair ${fileObj.name}`, "error");
      }
    }
    
    setGlobalLoading(false);
    showToast("Processing complete!");
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Advanced PDF Repair | MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Wrench className="text-blue-600" size={36} /> PDF Repair Suite
          </h1>
          <p className="opacity-80">Deep structural recovery, metadata AI cleanup, and live post-transformations.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          {/* LEFT: SETTINGS & FILE LIST */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            
            {/* File Uploader & List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <button 
                onClick={() => fileInputRef.current.click()} 
                className="w-full border-2 border-dashed border-blue-300 bg-blue-50 text-blue-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 transition"
              >
                <UploadCloud size={20}/> Select PDF Files
              </button>
              <input type="file" multiple accept=".pdf" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

              {files.length > 0 && (
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto pr-1">
                  {files.map(f => (
                    <div 
                      key={f.id} 
                      onClick={() => setActiveFileId(f.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition flex items-center justify-between ${activeFileId === f.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText size={16} className={f.status === 'success' ? 'text-green-500' : 'text-gray-500'} />
                        <span className="text-sm font-bold truncate max-w-[120px]">{f.name}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {f.status === 'processing' && <Loader2 size={14} className="animate-spin text-blue-500" />}
                        {f.status === 'success' && <CheckCircle size={14} className="text-green-500" />}
                        {f.status === 'error' && <AlertTriangle size={14} className="text-red-500" />}
                        <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="text-gray-400 hover:text-red-500"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Enterprise Repair Options */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={18}/> Recovery Settings</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="font-semibold block mb-1">Tiered Recovery Protocol</label>
                  <select value={options.recoveryLevel} onChange={(e) => setOptions({...options, recoveryLevel: e.target.value})} className="w-full p-2 border rounded-lg bg-gray-50">
                    <option value="auto">Auto (Smart Detect)</option>
                    <option value="quick">Tier 1 (XREF & Header Fix)</option>
                    <option value="balanced">Tier 2 (Structural Rebuild)</option>
                    <option value="deep">Tier 3 (Raw Text Scavenge)</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer font-semibold">
                  <input type="checkbox" checked={options.aiCleanup} onChange={(e) => setOptions({...options, aiCleanup: e.target.checked})} className="w-4 h-4" />
                  <Cpu size={16} className="text-purple-500"/> AI Metadata Cleanup
                </label>

                <hr className="my-2" />
                <h4 className="font-bold text-gray-700 flex items-center gap-2"><Sliders size={16}/> Post-Repair Modifications</h4>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={options.compress} onChange={(e) => setOptions({...options, compress: e.target.checked})} className="w-4 h-4" />
                  Compress Output Size
                </label>

                <div className="p-3 bg-gray-50 border rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold mb-2">
                    <input type="checkbox" checked={options.watermark.enabled} onChange={(e) => setOptions({...options, watermark: {...options.watermark, enabled: e.target.checked}})} className="w-4 h-4" />
                    Apply Watermark
                  </label>
                  {options.watermark.enabled && (
                    <input type="text" value={options.watermark.text} onChange={(e) => setOptions({...options, watermark: {...options.watermark, text: e.target.value}})} className="w-full p-2 border rounded" placeholder="Watermark Text" />
                  )}
                </div>

                <div className="p-3 bg-gray-50 border rounded-lg">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold mb-2">
                    <input type="checkbox" checked={options.encrypt.enabled} onChange={(e) => setOptions({...options, encrypt: {...options.encrypt, enabled: e.target.checked}})} className="w-4 h-4" />
                    Password Protect
                  </label>
                  {options.encrypt.enabled && (
                    <input type="password" value={options.encrypt.password} onChange={(e) => setOptions({...options, encrypt: {...options.encrypt, password: e.target.value}})} className="w-full p-2 border rounded" placeholder="Secure Password" />
                  )}
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-2">
                  <input type="checkbox" checked={options.includeReport} onChange={(e) => setOptions({...options, includeReport: e.target.checked})} className="w-4 h-4" />
                  Generate Recovery Report
                </label>
              </div>

              <button 
                onClick={handleRepairAll} 
                disabled={globalLoading || files.length === 0}
                className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:bg-gray-400 transition"
              >
                {globalLoading ? <><Loader2 size={18} className="animate-spin"/> Processing...</> : <><Shield size={18}/> Start Repair Engine</>}
              </button>
            </div>
          </div>

          {/* RIGHT: LIVE VIEWER & RESULTS */}
          <div className="w-full lg:w-2/3 flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[600px] flex flex-col items-center justify-center relative overflow-hidden">
              
              {!activeFile ? (
                <div className="text-gray-400 flex flex-col items-center">
                  <Eye size={48} className="mb-2 opacity-50" />
                  <p>Select a file to preview</p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col">
                  {/* Viewer Toolbar */}
                  <div className="flex justify-between items-center bg-gray-100 p-2 rounded-lg mb-4">
                    <span className="font-bold text-sm truncate px-2">{activeFile.name}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="px-2 py-1 bg-white border rounded text-xs">Prev</button>
                      <span className="text-xs font-bold self-center">{currentPage} / {numPages}</span>
                      <button onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage === numPages} className="px-2 py-1 bg-white border rounded text-xs">Next</button>
                    </div>
                  </div>

                  {/* LIVE PDF RENDERER */}
                  <div className="flex-1 bg-gray-200 rounded-xl overflow-auto flex justify-center items-center p-4 relative border shadow-inner">
                    
                    {/* LIVE WATERMARK OVERLAY */}
                    {options.watermark.enabled && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 overflow-hidden">
                        <span className="text-red-500 font-bold text-6xl opacity-30 -rotate-45 select-none text-center leading-none">
                          {options.watermark.text}
                        </span>
                      </div>
                    )}

                    {/* LIVE ENCRYPTION OVERLAY */}
                    {options.encrypt.enabled && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center pointer-events-none z-30 rounded-xl">
                        <Lock size={64} className="text-white opacity-80 mb-2" />
                        <span className="text-white font-bold tracking-widest opacity-80">ENCRYPTION ENABLED</span>
                      </div>
                    )}

                    {/* PDF Viewer */}
                    <div className="shadow-2xl relative z-10 pointer-events-none">
                      <Document file={activeFile.localUrl} onLoadSuccess={({numPages}) => setNumPages(numPages)}>
                        <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={450} />
                      </Document>
                    </div>
                  </div>

                  {/* RESULTS PANEL (Shows after success) */}
                  <AnimatePresence>
                    {activeFile.status === 'success' && (
                      <motion.div initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-green-800 flex items-center gap-2"><CheckCircle size={16}/> Repair Successful</h4>
                            {activeFile.report && (
                              <div className="text-xs text-green-700 mt-2 grid grid-cols-2 gap-x-6 gap-y-1">
                                <p>Tier: <span className="font-bold">{activeFile.report.recoveryTier}</span></p>
                                <p>Health: <span className="font-bold">{activeFile.report.recoveryScore}%</span></p>
                                <p>Original: {(activeFile.report.originalSize / 1024).toFixed(1)} KB</p>
                                <p>Final: {(activeFile.report.finalSize / 1024).toFixed(1)} KB</p>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            <a href={activeFile.resultUrl} download className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2">
                              <Download size={14}/> Download PDF
                            </a>
                            {activeFile.report && options.includeReport && (
                              <button onClick={() => {
                                const blob = new Blob([JSON.stringify(activeFile.report, null, 2)], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url; a.download = `${activeFile.name}_Report.json`; a.click();
                              }} className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-bold rounded-lg flex items-center justify-center gap-2">
                                <FileText size={14}/> Save Log
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                </div>
              )}

            </div>
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
