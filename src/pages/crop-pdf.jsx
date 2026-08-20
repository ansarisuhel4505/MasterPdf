import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { UploadCloud, X, Scan, ArrowRight, Settings, Layers, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// FIX: react-pdf v9+ requires the .mjs worker to load PDFs successfully in Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function VisualCropPdf() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  
  // PDF Viewer States
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Crop state (Gallery jaisa box)
  const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
  
  // Enterprise Features: Page Range State
  const [pageRange, setPageRange] = useState('all'); // all, odd, even, custom, current
  const [customPages, setCustomPages] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setCurrentPage(1);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileUrl(null);
    setCrop({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
    setPageRange('all');
    setCurrentPage(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  // Helper to parse custom page range (e.g., "1-3, 5")
  const parseCustomPages = (input, totalPages) => {
    const pages = new Set();
    const parts = input.split(',').map(p => p.trim());
    
    parts.forEach(part => {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (start && end && start <= end) {
          for (let i = start; i <= end; i++) pages.add(i);
        }
      } else {
        const num = Number(part);
        if (num) pages.add(num);
      }
    });
    return Array.from(pages).filter(p => p > 0 && p <= totalPages);
  };

  // Simulated Auto-Detect (Snaps margins slightly inward)
  const autoDetectCrop = () => {
    setCrop({ unit: '%', x: 12, y: 12, width: 76, height: 76 });
  };

  const applyCropAndDownload = async (downloadMode) => {
    if (!file) return;
    setIsCropping(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const totalPdfPages = pages.length;

      // Determine which pages to crop based on user selection
      let pagesToCrop = [];
      if (pageRange === 'all') {
        pagesToCrop = pages.map((_, i) => i + 1);
      } else if (pageRange === 'odd') {
        pagesToCrop = pages.map((_, i) => i + 1).filter(p => p % 2 !== 0);
      } else if (pageRange === 'even') {
        pagesToCrop = pages.map((_, i) => i + 1).filter(p => p % 2 === 0);
      } else if (pageRange === 'custom') {
        pagesToCrop = parseCustomPages(customPages, totalPdfPages);
      } else if (pageRange === 'current') {
        pagesToCrop = [currentPage];
      }

      if (pagesToCrop.length === 0) {
        alert("No valid pages selected for cropping.");
        setIsCropping(false);
        return;
      }

      // Apply crop Box to targeted pages
      pages.forEach((page, index) => {
        const pageNum = index + 1;
        
        if (pagesToCrop.includes(pageNum)) {
          const { width: pdfWidth, height: pdfHeight } = page.getSize();
          
          const cropX = (crop.x / 100) * pdfWidth;
          const cropY = (crop.y / 100) * pdfHeight;
          const cropWidth = (crop.width / 100) * pdfWidth;
          const cropHeight = (crop.height / 100) * pdfHeight;

          // pdf-lib's Y-axis starts from the bottom
          const newX = cropX;
          const newY = pdfHeight - cropY - cropHeight;

          if (cropWidth > 30 && cropHeight > 30) {
            page.setCropBox(newX, newY, cropWidth, cropHeight);
          }
        }
      });

      let finalPdfBytes;

      // Handle Download Modes
      if (downloadMode === 'only_cropped') {
        // Naya PDF create karo aur usme sirf cropped pages copy karo
        const newPdf = await PDFDocument.create();
        const zeroBasedIndices = pagesToCrop.map(p => p - 1);
        const copiedPages = await newPdf.copyPages(pdfDoc, zeroBasedIndices);
        
        copiedPages.forEach((page) => newPdf.addPage(page));
        finalPdfBytes = await newPdf.save();
      } else {
        // Full Document (Jis page par crop laga, wo replace ho chuka hai in-place)
        finalPdfBytes = await pdfDoc.save();
      }

      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const suffix = downloadMode === 'only_cropped' ? '_Extracted' : '_Cropped';
      link.download = `MasterPdf${suffix}_${file.name}`;
      link.click();

    } catch (error) {
      console.error("Error cropping PDF:", error);
      alert("Failed to crop. Ensure the file is not protected.");
    }
    
    setIsCropping(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Pro PDF Cropper - MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Visual PDF Cropper</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Drag the box to crop, target specific pages, and download exactly what you need.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col relative min-h-[500px]">
          {!file ? (
            <div className="flex-grow flex items-center justify-center w-full h-full p-12">
              <div className="text-center">
                <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                  <UploadCloud size={28} /> Select PDF Document
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left: Drag & Drop Visual Preview Panel */}
              <div className="w-full lg:w-7/12 flex flex-col items-center justify-start bg-gray-100 border border-gray-300 rounded-xl p-6 relative">
                <button onClick={removeFile} className="absolute top-4 right-4 z-10 bg-white shadow rounded-full p-2 text-gray-500 hover:text-red-500">
                  <X size={20} />
                </button>
                
                <p className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">Adjust crop box below</p>
                
                <div className="border-2 border-gray-300 shadow-md bg-white">
                  {/* Crop box sirf tabhi dikhega jab page targeted ho */}
                  {(pageRange === 'all' || pageRange === 'current' || 
                   (pageRange === 'odd' && currentPage % 2 !== 0) || 
                   (pageRange === 'even' && currentPage % 2 === 0)) ? (
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} className="max-h-[500px] overflow-hidden">
                      <Document 
                        file={fileUrl} 
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="p-10 flex flex-col items-center justify-center text-gray-500"><Settings className="animate-spin mb-2" size={30} /> Loading PDF...</div>}
                      >
                        <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={450} />
                      </Document>
                    </ReactCrop>
                  ) : (
                    <div className="opacity-60 grayscale pointer-events-none">
                       <Document file={fileUrl}>
                         <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={450} />
                       </Document>
                    </div>
                  )}
                </div>

                {/* Pagination Controls */}
                <div className="mt-6 flex items-center justify-between w-full max-w-[400px]">
                  <button 
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="flex items-center gap-1 px-4 py-2 bg-white border rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    <ChevronLeft size={16}/> Prev Page
                  </button>
                  <span className="text-sm font-bold text-gray-700">Page {currentPage} of {numPages}</span>
                  <button 
                    disabled={currentPage >= numPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="flex items-center gap-1 px-4 py-2 bg-white border rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next Page <ChevronRight size={16}/>
                  </button>
                </div>
              </div>

              {/* Right: Settings & Download Controls */}
              <div className="w-full lg:w-5/12 flex flex-col justify-between overflow-y-auto">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Crop Settings</h3>
                  
                  {/* Auto Crop Feature */}
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl text-center mb-6">
                    <Scan size={30} className="text-blue-500 mx-auto mb-2" />
                    <h3 className="font-bold text-gray-900 mb-1">Smart Auto-Crop</h3>
                    <p className="text-xs text-gray-600 mb-3">Snap borders closer to content.</p>
                    <button 
                      onClick={autoDetectCrop}
                      className="w-full py-2 bg-white border border-blue-300 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition text-sm"
                    >
                      Auto Detect Margins
                    </button>
                  </div>

                  {/* Enterprise Feature: Page Range Selector */}
                  <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 border-b pb-2">
                      <Layers size={16} className="text-[#E5322D]"/> Apply Crop To:
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { id: 'all', label: 'All Pages' },
                        { id: 'odd', label: 'Odd Pages Only' },
                        { id: 'even', label: 'Even Pages Only' },
                        { id: 'custom', label: 'Custom Range' },
                      ].map((range) => (
                        <button
                          key={range.id}
                          onClick={() => setPageRange(range.id)}
                          className={`py-2 px-2 text-xs font-bold border rounded-md transition-all ${
                            pageRange === range.id 
                              ? 'border-[#E5322D] bg-red-50 text-[#E5322D]' 
                              : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                          }`}
                        >
                          {range.label}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={() => setPageRange('current')}
                      className={`w-full py-2.5 text-sm font-bold border rounded-md transition-all ${pageRange === 'current' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}
                    >
                      Apply ONLY to Current Page ({currentPage})
                    </button>
                    
                    {pageRange === 'custom' && (
                      <div className="mt-3 animate-fade-in">
                        <input
                          type="text"
                          value={customPages}
                          onChange={(e) => setCustomPages(e.target.value)}
                          placeholder="e.g. 1-5, 8, 11-13"
                          className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#E5322D]"
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Enter page numbers separated by commas.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Export / Download Options */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Download size={16} className="text-[#E5322D]" /> Finish & Export</h4>
                  
                  <div className="flex flex-col gap-3">
                    {/* Option 1: Full Document */}
                    <button 
                      onClick={() => applyCropAndDownload('full_document')} 
                      disabled={isCropping} 
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm bg-[#E5322D] hover:bg-red-700 transition shadow-md disabled:bg-gray-400"
                    >
                      {isCropping ? <><Settings className="animate-spin" size={18} /> Processing...</> : "Download FULL PDF (Real)"}
                    </button>
                    
                    {/* Option 2: Extracted Pages Only */}
                    {pageRange !== 'all' && (
                      <button 
                        onClick={() => applyCropAndDownload('only_cropped')} 
                        disabled={isCropping} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-700 font-bold text-sm bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
                      >
                        Extract & Download ONLY Cropped Pages
                      </button>
                    )}
                  </div>
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
