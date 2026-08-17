import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, degrees } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import JSZip from 'jszip';
import { 
  UploadCloud, FileText, X, RotateCw, RotateCcw, Settings, 
  ArrowRight, Layers, FileOutput
} from 'lucide-react';

// 🛑 Dynamic Import (Next.js SSR ब्लॉक करने के लिए)
const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false });

export default function RotatePdf() {
  const [files, setFiles] = useState([]); // अब फाइलों का एक Array होगा
  const [fileUrls, setFileUrls] = useState([]); // preview के लिए URLs
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [pages, setPages] = useState([]); 
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customDegrees, setCustomDegrees] = useState('');
  const [rangeInput, setRangeInput] = useState('');
  const [renderError, setRenderError] = useState(false);

  // 🛑 वर्कर को सबसे सुरक्षित URL से लोड करें (Vercel पर 100% काम करता है)
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js';
  }, []);

  // कई फाइल्स अपलोड करने का हैंडलर
  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    // सिर्फ PDF चेक करें
    const validPdfs = selectedFiles.filter(f => f.type === 'application/pdf');
    if (validPdfs.length === 0) {
      alert("Please upload at least one valid PDF file.");
      return;
    }

    setFiles(validPdfs);
    setFileUrls(validPdfs.map(f => URL.createObjectURL(f)));
    setCurrentFileIndex(0);
    setIsLoading(true);
    setRenderError(false);

    try {
      // पहली फाइल लोड करें (थंबनेल के लिए)
      const arrayBuffer = await validPdfs[0].arrayBuffer();
      const loadedPdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(loadedPdf);
      
      const totalPages = loadedPdf.getPageCount();
      const initialPages = Array.from({ length: totalPages }, (_, i) => ({
        index: i,
        rotation: 0,
        selected: false,
      }));
      setPages(initialPages);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Corrupted or invalid first PDF file.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    setFiles([]);
    setFileUrls([]);
    setPages([]);
    setPdfDoc(null);
    setCustomDegrees('');
    setRangeInput('');
    setRenderError(false);
  };

  // --- SELECTION LOGIC ---
  const handlePageClick = (index, event) => {
    const newPages = [...pages];
    if (event.ctrlKey || event.metaKey) {
      newPages[index].selected = !newPages[index].selected;
      setPages(newPages);
    } else if (event.shiftKey) {
      const lastSelected = newPages.findIndex(p => p.selected);
      if (lastSelected !== -1) {
        const start = Math.min(lastSelected, index);
        const end = Math.max(lastSelected, index);
        for (let i = start; i <= end; i++) newPages[i].selected = true;
        setPages(newPages);
      } else {
        setPages(newPages.map(p => ({ ...p, selected: false })));
        newPages[index].selected = true;
        setPages(newPages);
      }
    } else {
      setPages(newPages.map(p => ({ ...p, selected: false })));
      newPages[index].selected = true;
      setPages(newPages);
    }
  };

  // --- APPLY ROTATION TO STATE ---
  const applyRotationToPages = (deg, target = 'selected') => {
    const newPages = [...pages];
    let pagesToRotate = [];

    if (target === 'all') {
      pagesToRotate = newPages.map((_, i) => i);
    } else if (target === 'odd') {
      pagesToRotate = newPages.map((_, i) => i % 2 === 0 ? i : -1).filter(i => i !== -1);
    } else if (target === 'even') {
      pagesToRotate = newPages.map((_, i) => i % 2 !== 0 ? i : -1).filter(i => i !== -1);
    } else if (target === 'range' && rangeInput.trim()) {
      const parts = rangeInput.split(',').map(s => s.trim());
      for (const part of parts) {
        if (part.includes('-')) {
          const [s, e] = part.split('-').map(Number);
          for (let i = s - 1; i < e; i++) pagesToRotate.push(i);
        } else {
          pagesToRotate.push(Number(part) - 1);
        }
      }
    } else {
      newPages.forEach((p, i) => { if (p.selected) pagesToRotate.push(i); });
    }

    if (pagesToRotate.length === 0) {
      alert("No pages selected for rotation.");
      return;
    }

    pagesToRotate.forEach((i) => {
      if (i >= 0 && i < newPages.length) {
        newPages[i].rotation = (newPages[i].rotation + deg) % 360;
      }
    });
    setPages(newPages);
  };

  // --- MAIN PROCESS: मल्टीपल फाइल्स को प्रोसेस करें और ZIP करें ---
  const processPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();

      // सारी अपलोड की गई फाइल्स पर लूप चलाएं
      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        const arrayBuffer = await file.arrayBuffer();
        const currentPdfDoc = await PDFDocument.load(arrayBuffer);

        // रोटेशन अप्लाई करें
        for (let i = 0; i < currentPdfDoc.getPageCount(); i++) {
          const page = currentPdfDoc.getPage(i);
          // अगर सिर्फ 1 फाइल है तो यूज़र द्वारा चुना गया रोटेशन लगेगा
          // अगर मल्टीपल फाइल्स हैं, तो सब पर यही रोटेशन लगेगा
          if (pages[i]) { 
             page.setRotation(degrees(pages[i].rotation));
          }
        }

        const pdfBytes = await currentPdfDoc.save();
        const fileName = `Rotated_${file.name}`;
        zip.file(fileName, pdfBytes);
      }

      // अगर सिर्फ 1 फाइल थी, तो सीधे डाउनलोड करें
      if (files.length === 1) {
        const singleBlob = await zip.file(Object.keys(zip.files)[0]).async('blob');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(singleBlob);
        link.download = Object.keys(zip.files)[0];
        link.click();
      } else {
        // अगर 1 से ज्यादा फाइलें हैं, तो ZIP डाउनलोड कराएं
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `MasterPdf_Rotated_Batch.zip`;
        link.click();
      }
      
    } catch (error) {
      console.error("Error rotating PDF:", error);
      alert("Failed to process one or more files.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Rotate PDF files online - MasterPdf</title></Head>
      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Rotate PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Select specific pages using Shift/Ctrl. <strong className="text-[#E5322D]">Supports Batch Upload!</strong> Upload multiple PDFs and download all as a ZIP.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {files.length === 0 ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center p-10 bg-gray-50/50 transition-colors">
              {/* 🔥 अब इसमें `multiple` ऐड कर दिया गया है */}
              <input type="file" id="file-upload" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-4 border-dashed border-red-200/50 hover:border-red-100">
                <UploadCloud size={28} /> Select PDFs (Multiple allowed)
              </label>
              <p className="mt-4 text-gray-400 text-sm">Hold Shift/Ctrl to select multiple PDFs</p>
            </div>
          ) : isLoading ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center bg-gray-50">
              <Settings size={48} className="animate-spin text-[#E5322D] mb-4" />
              <p className="text-gray-600 font-medium">Analyzing and loading pages...</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full relative p-6 gap-8">
              
              {/* LEFT SIDE: Thumbnail Grid */}
              <div className="w-full md:w-1/2 min-h-[400px] bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[600px] relative">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition z-20"><X size={20} /></button>
                <div className="mb-4 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">
                    {files.length} File{files.length > 1 ? 's' : ''} Loaded
                  </span>
                </div>

                {renderError ? (
                  <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-sm">
                      <p className="text-sm text-gray-700 mb-4">Preview failed to load. Click below to retry.</p>
                      <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-[#E5322D] text-white py-2 px-6 rounded-lg hover:bg-red-700 transition font-bold"><Settings size={18} className="animate-spin"/> Reload & Fix</button>
                    </div>
                  </div>
                ) : (
                  // 🔥 अब सिर्फ पहली फाइल का प्रीव्यू दिखेगा (UI साफ रखने के लिए)
                  <Document 
                    file={fileUrls[0]} 
                    loading={<div className="text-center py-10 text-gray-500">Loading previews...</div>}
                    onLoadError={() => setRenderError(true)}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {pages.map((pageData, index) => (
                        <div 
                          key={index} 
                          onClick={(e) => handlePageClick(index, e)}
                          className={`relative flex flex-col items-center rounded-lg p-2 transition-all cursor-pointer border-2 ${
                            pageData.selected ? 'border-[#E5322D] bg-red-50 ring-2 ring-red-100' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="shadow-sm rounded bg-white overflow-hidden flex items-center justify-center w-full h-auto min-h-[120px] border border-gray-100">
                            <Page 
                              pageNumber={index + 1} 
                              width={120} 
                              renderTextLayer={false} 
                              renderAnnotationLayer={false}
                              scale={pageData.rotation === 90 || pageData.rotation === 270 ? 0.7 : 1} 
                              rotate={pageData.rotation} // लाइव रोटेशन
                            />
                          </div>
                          <div className="mt-1 text-center text-xs font-bold text-gray-700 bg-black/10 px-2 py-0.5 rounded-full w-fit">
                            {index + 1} {pageData.rotation !== 0 && <span className="text-[#E5322D]">({pageData.rotation}°)</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Document>
                )}
              </div>

              {/* RIGHT SIDE: Pro Controls (No blur text) */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <RotateCw size={20} className="text-[#E5322D]" /> Rotation Controls
                  </h3>

                  {/* Standard 90/180 Buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => applyRotationToPages(-90, 'all')} className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition"><RotateCcw size={20}/> 90° L</button>
                    <button onClick={() => applyRotationToPages(90, 'all')} className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition"><RotateCw size={20}/> 90° R</button>
                    <button onClick={() => applyRotationToPages(180, 'all')} className="flex items-center justify-center gap-2 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition"><RotateCw size={20} className="rotate-180"/> 180°</button>
                  </div>

                  {/* Apply To Selectors */}
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3">
                    <p className="font-bold text-gray-800 text-sm">Apply Rotation To:</p>
                    <div className="flex flex-wrap gap-2 text-sm font-medium">
                      <button onClick={() => applyRotationToPages(90, 'all')} className="px-3 py-1.5 bg-white border hover:bg-red-50 hover:border-[#E5322D] rounded-md transition text-gray-800">All Pages</button>
                      <button onClick={() => applyRotationToPages(90, 'selected')} className="px-3 py-1.5 bg-white border hover:bg-red-50 hover:border-[#E5322D] rounded-md transition text-gray-800">Selected</button>
                      <button onClick={() => applyRotationToPages(90, 'odd')} className="px-3 py-1.5 bg-white border hover:bg-red-50 hover:border-[#E5322D] rounded-md transition text-gray-800">Odd</button>
                      <button onClick={() => applyRotationToPages(90, 'even')} className="px-3 py-1.5 bg-white border hover:bg-red-50 hover:border-[#E5322D] rounded-md transition text-gray-800">Even</button>
                    </div>

                    <div className="flex items-end gap-2 pt-2 border-t border-gray-200">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Range (e.g. 1-5, 7)</label>
                        <input 
                          type="text" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)}
                          placeholder="1-5, 7, 9-12" 
                          className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                        />
                      </div>
                      <button onClick={() => applyRotationToPages(90, 'range')} className="px-4 py-2 bg-[#E5322D] text-white font-bold rounded-md hover:bg-red-700 transition">Go</button>
                    </div>
                  </div>

                  {/* Custom Degrees */}
                  <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Angle (0-360)</label>
                        <input 
                          type="number" min="0" max="360" value={customDegrees} onChange={(e) => setCustomDegrees(e.target.value)}
                          placeholder="e.g. 45"
                          className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const deg = parseInt(customDegrees);
                          if (isNaN(deg) || deg < 0 || deg > 360) return alert("Enter a valid angle (0 to 360)");
                          applyRotationToPages(deg, 'selected');
                        }}
                        className="px-4 py-2 bg-gray-800 text-white font-bold rounded-md hover:bg-gray-900 transition"
                      >Apply</button>
                    </div>
                    <p className="text-xs text-gray-500">Tip: Hold Shift or Ctrl to select multiple pages, then apply the angle.</p>
                  </div>
                </div>

                {/* Download Action Button */}
                <div className="mt-8 pt-4 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={processPdf}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <><Settings className="animate-spin" size={24} /> Processing {files.length} Files...</>
                    ) : (
                      <>{files.length > 1 ? `Download All (ZIP)` : 'Download Rotated PDF'} <ArrowRight size={24} /></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
