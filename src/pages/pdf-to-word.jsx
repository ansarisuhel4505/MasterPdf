import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { upload } from '@vercel/blob/client';
import { 
  UploadCloud, FileText, X, ArrowRight, Settings, ScanText, 
  History, Loader2, Trash2, CheckCircle2, FolderOpen, Layers, Globe
} from 'lucide-react';

const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false });

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '3.11.174'}/build/pdf.worker.min.mjs`;
}

const PageThumbnail = ({ page, zoomLevel, removePage }) => {
  return (
    <div className="relative bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md p-2 transition-all">
      <div style={{ width: zoomLevel, height: zoomLevel * 1.3, overflow: 'hidden', position: 'relative' }} className="bg-gray-50 flex items-center justify-center rounded">
        {/* 🔥 FIX: Exact same as MergePdf - Direct page.file native object */}
        <Document 
          file={page.file} 
          loading={<Loader2 size={16} className="animate-spin text-gray-400" />}
          error={(error) => (
            <div className="flex flex-col items-center justify-center h-full text-[10px] text-red-500 font-bold p-1 text-center overflow-hidden">
              <span>Failed</span>
              <span className="font-normal text-gray-400 mt-1" title={error?.message}>{error?.message?.substring(0,35)}</span>
            </div>
          )}
        >
          <Page pageNumber={page.pageNumber} width={zoomLevel} renderTextLayer={false} renderAnnotationLayer={false} />
        </Document>
      </div>
      <div className="flex justify-between items-center mt-2 border-t pt-2">
        <span className="text-[10px] font-bold text-gray-500 truncate w-20" title={page.sourceFileName}>
          {page.sourceFileName}
        </span>
        <button onClick={() => removePage(page.id)} className="text-gray-400 hover:text-red-600 p-1 bg-red-50 rounded-md transition-colors" title="Remove Page">
          <Trash2 size={14} />
        </button>
      </div>
      <span className="absolute top-1 left-1 text-[10px] font-bold bg-gray-800 text-white px-1.5 py-0.5 rounded shadow pointer-events-none">
        {page.pageNumber}
      </span>
    </div>
  );
};

export default function PdfToWord() {
  const [pages, setPages] = useState([]);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(120);
  
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [highQuality, setHighQuality] = useState(true);
  const [preserveLayout, setPreserveLayout] = useState(true);
  
  const [recentFiles, setRecentFiles] = useState([]);
  const dragCounter = useRef(0);
  const progressInterval = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('masterpdf-recent-word');
    if (saved) setRecentFiles(JSON.parse(saved));
    return () => clearInterval(progressInterval.current);
  }, []);

  const extractPagesFromPDF = async (file, sourceId) => {
    let buffer;
    if (file.arrayBuffer) {
      buffer = await file.arrayBuffer();
    } else {
      buffer = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    const uint8Array = new Uint8Array(buffer);
    const pdf = await PDFDocument.load(uint8Array, { ignoreEncryption: true }); 
    const totalPages = pdf.getPageCount();
    
    const newPages = [];
    
    for (let i = 0; i < totalPages; i++) {
      newPages.push({
        id: `page-${sourceId}-${i}`,
        sourceId,
        sourceFileName: file.name,
        pageNumber: i + 1,
        file: file, // Native File object exactly like MergePdf
        rawBuffer: uint8Array 
      });
    }
    return newPages;
  };

  const handleFileChange = async (e) => {
    if (!e.target.files) return;
    const selectedFiles = Array.from(e.target.files);
    const validPdfs = selectedFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    
    if (validPdfs.length === 0) {
      alert("Please upload valid PDF files only.");
      return;
    }

    const newPages = [];
    for (const file of validPdfs) {
      const sourceId = `src-${Date.now()}-${Math.random()}`;
      try {
        const extracted = await extractPagesFromPDF(file, sourceId);
        newPages.push(...extracted);
      } catch (err) {
        alert(`Failed to read ${file.name}. File might be corrupted.`);
      }
    }
    setPages(prev => [...prev, ...newPages]);
    e.target.value = null;
  };

  const handleDragEnter = (e) => { e.preventDefault(); dragCounter.current++; setDragActive(true); };
  const handleDragLeave = (e) => { e.preventDefault(); dragCounter.current--; if (dragCounter.current === 0) setDragActive(false); };
  const handleDrop = async (e) => { 
    e.preventDefault(); setDragActive(false); 
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    
    if (droppedFiles.length > 0) {
      const newPages = [];
      for (const file of droppedFiles) {
        const sourceId = `src-${Date.now()}-${Math.random()}`;
        try {
          const extracted = await extractPagesFromPDF(file, sourceId);
          newPages.push(...extracted);
        } catch (err) {
          alert(`Failed to read ${file.name}.`);
        }
      }
      setPages(prev => [...prev, ...newPages]);
    }
  };

  const removePage = (pageId) => setPages(prev => prev.filter(p => p.id !== pageId));
  const clearAll = () => setPages([]);

  const startProgressSimulation = () => {
    setProgress(0);
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval.current); return prev; }
        return prev + Math.floor(Math.random() * 10);
      });
    }, 400);
  };

  const convertToWord = async () => {
    if (pages.length === 0) return;
    setIsConverting(true);
    startProgressSimulation();

    try {
      const newPdf = await PDFDocument.create();
      const loadedPdfs = {};

      for (const page of pages) {
        let sourcePdf = loadedPdfs[page.sourceId];
        if (!sourcePdf) {
          sourcePdf = await PDFDocument.load(page.rawBuffer, { ignoreEncryption: true });
          loadedPdfs[page.sourceId] = sourcePdf;
        }
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [page.pageNumber - 1]);
        newPdf.addPage(copiedPage);
      }

      const finalPdfBytes = await newPdf.save();
      const finalBlob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const mainFilename = pages[0].sourceFileName.replace('.pdf', '');

      const uploadedBlob = await upload(`to_word_${Date.now()}.pdf`, finalBlob, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      });

      if (!uploadedBlob || !uploadedBlob.url) {
        throw new Error("Failed to upload file to temporary storage. Please try again.");
      }

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'pdf-to-word', 
          fileUrl: uploadedBlob.url,
          options: {
            ocrEnabled: ocrEnabled,
            ocrLanguage: ocrLanguage,
            highQuality: highQuality,
            preserveLayout: preserveLayout
          }
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.downloadUrl) {
        clearInterval(progressInterval.current);
        setProgress(100);
        
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.setAttribute('download', `${mainFilename}_MasterPdf.docx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        const newRecent = [{ name: `${mainFilename}.docx`, time: new Date().toLocaleString() }, ...recentFiles].slice(0, 5);
        setRecentFiles(newRecent);
        localStorage.setItem('masterpdf-recent-word', JSON.stringify(newRecent));
      } else {
        alert(`Conversion Failed: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert(`Critical Error: ${error.message || "Failed to connect to conversion server."}`);
    } finally {
      clearInterval(progressInterval.current);
      setTimeout(() => { setProgress(0); setIsConverting(false); }, 1000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Convert PDF to Word Online Free | MasterPdf</title>
      </Head>

      <Navbar />
      
      <main className="flex-grow flex flex-col items-center p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-8 max-w-3xl">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 tracking-tight">PDF to Word Converter</h1>
          <p className="text-lg text-gray-600">
            Extract pages and convert them into highly accurate, editable Word documents. Layout formatting preserved perfectly.
          </p>
        </div>
        
        <div 
          className={`w-full max-w-6xl bg-white rounded-2xl shadow-sm border p-4 sm:p-8 min-h-[500px] flex flex-col items-center transition-all ${dragActive ? 'border-dashed border-4 border-blue-400 bg-blue-50' : 'border-gray-200'}`}
          onDragEnter={handleDragEnter}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {pages.length === 0 && !isConverting ? (
            <div className="flex flex-col items-center justify-center h-full w-full py-20">
              <input type="file" id="file-upload" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#2563EB] hover:bg-blue-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Select PDF files
              </label>
              <p className="text-gray-500 mt-4 font-medium">or Drag & Drop your PDFs here</p>
            </div>
          ) : !isConverting ? (
            <div className="w-full flex flex-col lg:flex-row gap-6">
              
              <div className="w-full lg:w-80 flex-shrink-0 bg-gray-50 border rounded-xl p-5 h-fit">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Settings size={20}/> Advanced Settings</h3>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-blue-300 transition">
                    <input type="checkbox" checked={preserveLayout} onChange={(e) => setPreserveLayout(e.target.checked)} className="mt-1 w-5 h-5 accent-blue-600" />
                    <div>
                      <span className="block font-bold text-gray-900 flex items-center gap-1"><FileText size={16}/> Preserve Layout</span>
                      <span className="text-xs text-gray-500">Keeps tables, columns, and margins exactly as in the PDF.</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-blue-300 transition">
                    <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} className="mt-1 w-5 h-5 accent-blue-600" />
                    <div>
                      <span className="block font-bold text-gray-900 flex items-center gap-1"><ScanText size={16}/> Smart OCR Engine</span>
                      <span className="text-xs text-gray-500">Extracts text from scanned images and photos.</span>
                    </div>
                  </label>

                  {/* 🔥 FIX: Reverted to ConvertAPI 3-letter codes */}
                  {ocrEnabled && (
                    <div className="pl-2 pr-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><Globe size={14}/> Document Language</label>
                      <select value={ocrLanguage} onChange={(e) => setOcrLanguage(e.target.value)} className="w-full p-2 border rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                        <option value="eng">English</option>
                        <option value="hin">Hindi</option>
                        <option value="spa">Spanish</option>
                        <option value="fra">French</option>
                        <option value="deu">German</option>
                      </select>
                    </div>
                  )}

                  <label className="flex items-start gap-3 p-3 bg-white border rounded-lg cursor-pointer hover:border-blue-300 transition">
                    <input type="checkbox" checked={highQuality} onChange={(e) => setHighQuality(e.target.checked)} className="mt-1 w-5 h-5 accent-blue-600" />
                    <div>
                      <span className="block font-bold text-gray-900 flex items-center gap-1"><CheckCircle2 size={16}/> High Quality Scan</span>
                      <span className="text-xs text-gray-500">300 DPI processing for maximum text clarity.</span>
                    </div>
                  </label>
                  
                  <button onClick={convertToWord} className="w-full mt-4 flex items-center justify-center gap-2 py-4 bg-[#2563EB] hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition transform hover:-translate-y-0.5">
                    <FolderOpen size={20}/> Convert to Word <ArrowRight size={20}/>
                  </button>
                </div>
              </div>

              <div className="flex-1">
                <div className="flex items-center justify-between mb-4 border-b pb-2">
                  <h3 className="font-bold text-lg flex items-center gap-2"><Layers size={20}/> Selected Pages ({pages.length})</h3>
                  <div className="flex items-center gap-3">
                    <input type="file" id="add-more" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
                    <label htmlFor="add-more" className="text-sm font-bold text-blue-600 hover:text-blue-800 cursor-pointer">
                      + Add More PDFs
                    </label>
                    <button onClick={clearAll} className="text-sm font-bold text-red-500 hover:text-red-700 flex items-center gap-1">
                      <Trash2 size={16}/> Clear All
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 max-h-[600px] overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-200">
                  {pages.map((page) => (
                    <PageThumbnail key={page.id} page={page} zoomLevel={zoomLevel} removePage={removePage} />
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center h-[400px]">
              <div className="relative w-24 h-24 mb-6">
                <svg className="animate-spin w-full h-full text-gray-200" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8"></circle>
                </svg>
                <svg className="animate-spin absolute top-0 left-0 w-full h-full text-[#2563EB]" viewBox="0 0 100 100" style={{ animationDuration: '1.5s' }}>
                  <circle cx="50" cy="50" r="45" fill="none" strokeWidth="8" strokeDasharray="283" strokeDashoffset={283 - (283 * progress) / 100} strokeLinecap="round"></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-gray-800">
                  {progress}%
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Converting Document</h3>
              <p className="text-gray-500 font-medium">Applying OCR and reconstructing layout...</p>
            </div>
          )}
        </div>

        {recentFiles.length > 0 && !isConverting && pages.length === 0 && (
          <div className="mt-12 w-full max-w-4xl bg-white p-6 rounded-xl border shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2 border-b pb-2">
              <History size={20} className="text-gray-500"/> Recent Word Conversions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentFiles.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-300 transition">
                  <FileText size={24} className="text-blue-600" />
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
