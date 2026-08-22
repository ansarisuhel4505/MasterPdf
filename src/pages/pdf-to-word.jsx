import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ArrowRight, Settings, ScanText, History, Loader2, Trash2, CheckCircle2, FolderOpen } from 'lucide-react'; // ✅ FolderOpen Imported
import { upload } from '@vercel/blob/client';

export default function PdfToWord() {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [highQuality, setHighQuality] = useState(true);
  const [preserveLayout, setPreserveLayout] = useState(true);
  const [recentFiles, setRecentFiles] = useState([]);
  const dragCounter = useRef(0);
  const progressInterval = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('masterpdf-recent');
    if (saved) setRecentFiles(JSON.parse(saved));
    return () => clearInterval(progressInterval.current);
  }, []);

  const handleFileChange = (e) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const pdfFiles = selectedFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (pdfFiles.length > 0) setFiles(prev => [...prev, ...pdfFiles]);
    else alert("Please upload valid PDF files only.");
  };

  const removeFile = (index) => setFiles(prev => prev.filter((_, i) => i !== index));
  const clearAll = () => setFiles([]);

  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragActive(false); };
  const handleDrop = (e) => { e.preventDefault(); setDragActive(false); 
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (droppedFiles.length > 0) setFiles(prev => [...prev, ...droppedFiles]);
  };

  const startProgressSimulation = () => {
    setProgress(0);
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) { clearInterval(progressInterval.current); return prev; }
        return prev + 5;
      });
    }, 200);
  };

  const convertToWord = async () => {
    if (files.length === 0) return;
    setIsConverting(true);
    startProgressSimulation();

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });

        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'pdf-to-word', 
            fileUrl: blob.url,
            ocrEnabled,
            highQuality,
            preserveLayout
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.setAttribute('download', `MasterPdf_Converted_${file.name.split('.')[0]}.docx`);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          const newRecent = [{ name: file.name, time: new Date().toLocaleString() }, ...recentFiles].slice(0, 5);
          setRecentFiles(newRecent);
          localStorage.setItem('masterpdf-recent', JSON.stringify(newRecent));
        } else {
          alert(`Conversion Failed for ${file.name}: ${data.error}`);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Server connection failed. Check /api/upload and /api/master-convert routes.");
    } finally {
      clearInterval(progressInterval.current);
      setProgress(100);
      setTimeout(() => { setProgress(0); setIsConverting(false); }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Convert PDF to Word Online Free | MasterPdf</title>
      </Head>

      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">PDF to Word Converter</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert multiple PDFs into editable Word files instantly. Supports huge files.
          </p>
        </div>
        
        <div 
          className={`w-full max-w-5xl bg-white rounded-2xl shadow-sm border p-8 min-h-[500px] flex flex-col items-center justify-center relative transition-all ${dragActive ? 'border-dashed border-4 border-[#E5322D] bg-red-50' : 'border-gray-200'}`}
          onDragEnter={handleDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!isConverting && files.length === 0 && (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Select PDF files
              </label>
              <p className="text-gray-500 mt-4 font-medium">or Drag & Drop your PDFs here</p>
              <p className="text-gray-400 text-sm mt-2">*No file size limits (100MB max via Blob)</p>
            </div>
          )}

          {!isConverting && files.length > 0 && (
            <div className="w-full h-full flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">{files.length} PDF File(s) Selected</h3>
                <button onClick={clearAll} className="text-red-500 hover:text-red-700 font-bold text-sm flex items-center gap-1">
                  <Trash2 size={16}/> Clear All
                </button>
              </div>

              {/* Advanced Settings */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} className="w-5 h-5 accent-[#E5322D]" />
                  <ScanText size={18} className="text-gray-900"/> <b>Enable OCR</b>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={highQuality} onChange={(e) => setHighQuality(e.target.checked)} className="w-5 h-5 accent-[#E5322D]" />
                  <CheckCircle2 size={18} className="text-gray-900"/><b> High Quality (Blur Fix)</b>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={preserveLayout} onChange={(e) => setPreserveLayout(e.target.checked)} className="w-5 h-5 accent-[#E5322D]" />
                  <FileText size={18} className="text-gray-900"/><b> Preserve Layout</b>
                </label>
              </div>

              {/* File List */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText size={24} className="text-[#E5322D] shrink-0"/>
                      <span className="text-sm font-bold text-gray-800 truncate max-w-[300px]">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <button onClick={() => removeFile(index)} className="text-gray-400 hover:text-red-500 p-1">
                      <X size={18}/>
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                 <button onClick={convertToWord} disabled={isConverting} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400">
                   <FolderOpen size={24}/> Convert All to Word <ArrowRight size={24}/>
                 </button>
              </div>
            </div>
          )}

          {isConverting && (
            <div className="w-full max-w-lg text-center">
              <Loader2 className="animate-spin text-[#E5322D] mx-auto mb-4" size={48}/>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Converting...</h3>
              <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
                <div className="bg-[#E5322D] h-4 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-sm text-gray-500 font-bold">Progress: {progress}%</p>
            </div>
          )}

          {recentFiles.length > 0 && !isConverting && files.length === 0 && (
            <div className="mt-8 w-full max-w-lg border-t pt-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <History size={16} className="text-gray-500"/> Recent Conversions
              </h3>
              <div className="space-y-2">
                {recentFiles.map((item, i) => (
                  <div key={i} className="text-xs text-gray-900 border-l-2 border-gray-300 pl-3">
                    <span className="font-bold text-gray-800">{item.name}</span> at {item.time}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
