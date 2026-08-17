import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, degrees } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import JSZip from 'jszip';
import { 
  UploadCloud, X, RotateCw, RotateCcw, Settings, 
  ArrowRight
} from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 🔥 100% WORKING WORKER FOR VERSION 9 🔥
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function RotatePdf() {
  const [files, setFiles] = useState([]); 
  const [fileUrls, setFileUrls] = useState([]); 
  const [pages, setPages] = useState([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rangeInput, setRangeInput] = useState('');
  const [renderError, setRenderError] = useState(false);

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (!selectedFiles.length) return;

    const validPdfs = selectedFiles.filter(f => f.type === 'application/pdf');
    if (validPdfs.length === 0) {
      alert("Please upload at least one valid PDF file.");
      return;
    }

    setFiles(validPdfs);
    setFileUrls(validPdfs.map(f => URL.createObjectURL(f)));
    setIsLoading(true);
    setRenderError(false);

    try {
      let allPages = [];
      // 🔥 FIX: Loop through ALL uploaded files to get their pages for preview
      for (let fIdx = 0; fIdx < validPdfs.length; fIdx++) {
        const arrayBuffer = await validPdfs[fIdx].arrayBuffer();
        const loadedPdf = await PDFDocument.load(arrayBuffer);
        const totalPages = loadedPdf.getPageCount();
        
        for (let pIdx = 0; pIdx < totalPages; pIdx++) {
          allPages.push({
            id: `f${fIdx}-p${pIdx}`,
            fileIndex: fIdx,
            pageIndex: pIdx,
            rotation: 0,
            selected: false,
          });
        }
      }
      setPages(allPages);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Corrupted or invalid PDF file detected.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    setFiles([]);
    setFileUrls([]);
    setPages([]);
    setRangeInput('');
    setRenderError(false);
  };

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
        if (newPages[i].rotation < 0) newPages[i].rotation += 360; 
      }
    });
    setPages(newPages);
  };

  const processPdf = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const file = files[fileIndex];
        const arrayBuffer = await file.arrayBuffer();
        const currentPdfDoc = await PDFDocument.load(arrayBuffer);
        
        // 🔥 FIX: Apply rotations specifically to the correct file's pages
        const filePages = pages.filter(p => p.fileIndex === fileIndex);

        for (let i = 0; i < currentPdfDoc.getPageCount(); i++) {
          const page = currentPdfDoc.getPage(i);
          const pageData = filePages.find(p => p.pageIndex === i);
          if (pageData) { 
             page.setRotation(degrees(pageData.rotation));
          }
        }

        const pdfBytes = await currentPdfDoc.save();
        const fileName = `Rotated_${file.name}`;
        zip.file(fileName, pdfBytes);
      }

      if (files.length === 1) {
        const singleBlob = await zip.file(Object.keys(zip.files)[0]).async('blob');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(singleBlob);
        link.download = Object.keys(zip.files)[0];
        link.click();
      } else {
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

        <div className="w-full max-w-7xl bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {files.length === 0 ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center p-10 bg-gray-50/50 transition-colors">
              <input type="file" id="file-upload" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-4 border-dashed border-red-200/50 hover:border-red-100">
                <UploadCloud size={28} /> Select PDFs (Multiple allowed)
              </label>
              <p className="mt-4 text-gray-400 text-sm">Hold Shift/Ctrl to select multiple PDFs</p>
            </div>
          ) : isLoading ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center bg-gray-50">
              <Settings size={48} className="animate-spin text-[#E5322D] mb-4" />
              <p className="text-gray-600 font-medium">Analyzing and loading pages from {files.length} files...</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full relative p-6 gap-8">
              
              {/* LEFT SIDE: Thumbnail Grid for MULTIPLE FILES */}
              <div className="w-full md:w-3/5 bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[700px] relative custom-scrollbar">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition z-20"><X size={20} /></button>
                <div className="mb-6 flex justify-between items-center border-b pb-3">
                  <span className="text-lg font-bold text-gray-800">
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
                  <div className="flex flex-col gap-8">
                    {/* 🔥 Map over all files and display their own grids 🔥 */}
                    {files.map((fileObj, fIndex) => (
                      <div key={fIndex} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                        <h4 className="font-bold text-gray-700 mb-4 truncate pr-10 text-sm">{fileObj.name}</h4>
                        
                        <Document 
                          file={fileUrls[fIndex]} 
                          loading={<div className="text-center py-5 text-gray-400 text-sm">Loading previews...</div>}
                          onLoadError={() => setRenderError(true)}
                        >
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {pages.map((pageData, globalIndex) => {
                              // Only show pages that belong to the current file in the loop
                              if (pageData.fileIndex !== fIndex) return null;
                              
                              return (
                                <div 
                                  key={pageData.id} 
                                  onClick={(e) => handlePageClick(globalIndex, e)}
                                  className={`relative flex flex-col items-center rounded-lg p-2 transition-all cursor-pointer border-2 ${
                                    pageData.selected ? 'border-[#E5322D] bg-red-50 ring-2 ring-red-100' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="shadow-sm rounded bg-white overflow-hidden flex items-center justify-center w-full h-auto min-h-[120px] border border-gray-100">
                                    <Page 
                                      pageNumber={pageData.pageIndex + 1} 
                                      width={110} 
                                      renderTextLayer={false} 
                                      renderAnnotationLayer={false}
                                      scale={pageData.rotation === 90 || pageData.rotation === 270 ? 0.7 : 1} 
                                      rotate={pageData.rotation} 
                                    />
                                  </div>
                                  <div className="mt-2 text-center text-xs font-bold text-gray-700 bg-black/10 px-3 py-1 rounded-full w-fit flex gap-1 items-center">
                                    Page {globalIndex + 1} 
                                    {pageData.rotation !== 0 && <span className="text-[#E5322D]">({pageData.rotation}°)</span>}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Document>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT SIDE: Controls */}
              <div className="w-full md:w-2/5 flex flex-col justify-between">
                <div className="space-y-5">
                  <h3 className="text-xl font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <RotateCw size={20} className="text-[#E5322D]" /> Rotation Controls
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => applyRotationToPages(-90, 'all')} className="flex flex-col items-center justify-center gap-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition"><RotateCcw size={22}/> 90° Left</button>
                    <button onClick={() => applyRotationToPages(90, 'all')} className="flex flex-col items-center justify-center gap-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition"><RotateCw size={22}/> 90° Right</button>
                    <button onClick={() => applyRotationToPages(180, 'all')} className="flex flex-col items-center justify-center gap-1 py-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl transition"><RotateCw size={22} className="rotate-180"/> 180°</button>
                  </div>

                  <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl space-y-4">
                    <p className="font-bold text-gray-800 text-sm">Apply Rotation To:</p>
                    <div className="flex flex-wrap gap-2 text-sm font-medium">
                      <button onClick={() => applyRotationToPages(90, 'all')} className="px-4 py-2 bg-white border shadow-sm hover:bg-red-50 hover:border-[#E5322D] hover:text-[#E5322D] rounded-lg transition text-gray-800">All Pages</button>
                      <button onClick={() => applyRotationToPages(90, 'selected')} className="px-4 py-2 bg-white border shadow-sm hover:bg-red-50 hover:border-[#E5322D] hover:text-[#E5322D] rounded-lg transition text-gray-800">Selected</button>
                      <button onClick={() => applyRotationToPages(90, 'odd')} className="px-4 py-2 bg-white border shadow-sm hover:bg-red-50 hover:border-[#E5322D] hover:text-[#E5322D] rounded-lg transition text-gray-800">Odd Pages</button>
                      <button onClick={() => applyRotationToPages(90, 'even')} className="px-4 py-2 bg-white border shadow-sm hover:bg-red-50 hover:border-[#E5322D] hover:text-[#E5322D] rounded-lg transition text-gray-800">Even Pages</button>
                    </div>

                    <div className="flex items-end gap-2 pt-3 border-t border-gray-200 mt-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Custom Page Range</label>
                        <input 
                          type="text" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)}
                          placeholder="e.g. 1-5, 7, 9-12" 
                          className="w-full bg-white border border-gray-300 text-gray-800 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                        />
                      </div>
                      <button onClick={() => applyRotationToPages(90, 'range')} className="px-6 py-3 bg-[#E5322D] text-white font-bold rounded-lg hover:bg-red-700 transition shadow-sm">Rotate 90°</button>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={processPdf}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-lg bg-[#E5322D] hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
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
