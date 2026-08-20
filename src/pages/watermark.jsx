import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { UploadCloud, X, Type, Settings, Stamp, Layers, ChevronLeft, ChevronRight, Download } from 'lucide-react';

// FIX for Next.js: react-pdf worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function AdvancedWatermark() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isWatermarking, setIsWatermarking] = useState(false);
  
  // PDF Viewer States
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Watermark Settings
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState('#E5322D');
  
  // Page Targeting Settings
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
    setCurrentPage(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  const hexToPdfRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

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

  // Main Watermarking & Download Logic
  const applyWatermark = async (downloadMode) => {
    if (!file) return;
    if (!watermarkText.trim()) {
      alert("Please enter some text for the watermark.");
      return;
    }

    setIsWatermarking(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const customFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();
      const totalPdfPages = pages.length;

      // Determine which pages to watermark
      let pagesToWatermark = [];
      if (pageRange === 'all') {
        pagesToWatermark = pages.map((_, i) => i + 1);
      } else if (pageRange === 'odd') {
        pagesToWatermark = pages.map((_, i) => i + 1).filter(p => p % 2 !== 0);
      } else if (pageRange === 'even') {
        pagesToWatermark = pages.map((_, i) => i + 1).filter(p => p % 2 === 0);
      } else if (pageRange === 'custom') {
        pagesToWatermark = parseCustomPages(customPages, totalPdfPages);
      } else if (pageRange === 'current') {
        pagesToWatermark = [currentPage]; // Sirf display wala page
      }

      if (pagesToWatermark.length === 0) {
        alert("No valid pages selected for watermarking.");
        setIsWatermarking(false);
        return;
      }

      // Apply watermark to selected pages
      pages.forEach((page, index) => {
        const pageNum = index + 1;
        
        if (pagesToWatermark.includes(pageNum)) {
          const { width, height } = page.getSize();
          
          // Dynamic Sizing Logic
          const diagonal = Math.sqrt(width * width + height * height);
          const maxTextWidth = diagonal * 0.75; 
          const baseSize = 100;
          const textWidthAtBase = customFont.widthOfTextAtSize(watermarkText, baseSize);
          const scale = maxTextWidth / textWidthAtBase;
          const textSize = Math.min(baseSize * scale, 80); 

          const textWidth = customFont.widthOfTextAtSize(watermarkText, textSize);
          const textHeight = textSize; 
          const angle = 45;
          const angleRad = (angle * Math.PI) / 180;

          const x = (width / 2) - (textWidth / 2) * Math.cos(angleRad) + (textHeight / 2) * Math.sin(angleRad);
          const y = (height / 2) - (textWidth / 2) * Math.sin(angleRad) - (textHeight / 2) * Math.cos(angleRad);
          
          page.drawText(watermarkText, {
            x: x, y: y, size: textSize, font: customFont,
            color: hexToPdfRgb(watermarkColor), 
            opacity: 0.3, rotate: degrees(angle), 
          });
        }
      });

      let finalPdfBytes;

      // Handle Download Modes
      if (downloadMode === 'only_watermarked') {
        // Extract only the watermarked pages into a NEW pdf
        const newPdf = await PDFDocument.create();
        // pdf-lib uses 0-based indexing for copyPages
        const zeroBasedIndices = pagesToWatermark.map(p => p - 1);
        const copiedPages = await newPdf.copyPages(pdfDoc, zeroBasedIndices);
        
        copiedPages.forEach((page) => newPdf.addPage(page));
        finalPdfBytes = await newPdf.save();
      } else {
        // Save the full document (some pages have watermark, others don't)
        finalPdfBytes = await pdfDoc.save();
      }

      // Trigger Download
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const suffix = downloadMode === 'only_watermarked' ? '_Extracted' : '_Watermarked';
      link.download = `MasterPdf${suffix}_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error adding watermark:", error);
      alert("Failed to process. File might be protected.");
    }
    setIsWatermarking(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Visual PDF Watermarker - MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Visual PDF Watermarker</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Preview, target specific pages, and download exactly what you need.
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
            <div className="w-full h-full flex flex-col lg:flex-row gap-8">
              
              {/* Left: Visual PDF Preview Panel */}
              <div className="w-full lg:w-7/12 flex flex-col items-center justify-start bg-gray-100 border border-gray-300 rounded-xl p-6 relative">
                <button onClick={removeFile} className="absolute top-4 right-4 z-10 bg-white shadow rounded-full p-2 text-gray-500 hover:text-red-500">
                  <X size={20} />
                </button>

                {/* PDF Viewer with Overlay */}
                <div className="relative border border-gray-300 shadow-md bg-white overflow-hidden flex justify-center w-full max-w-[450px]">
                  
                  {/* Live Watermark Overlay (Only shows if page is targeted) */}
                  {(pageRange === 'all' || 
                    pageRange === 'current' || 
                   (pageRange === 'odd' && currentPage % 2 !== 0) || 
                   (pageRange === 'even' && currentPage % 2 === 0)) && (
                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
                      <span 
                        className="transform -rotate-45 font-bold opacity-30 tracking-widest whitespace-nowrap"
                        style={{ color: watermarkColor, fontSize: 'clamp(2rem, 10vw, 5rem)' }}
                      >
                        {watermarkText}
                      </span>
                    </div>
                  )}

                  <Document 
                    file={fileUrl} 
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div className="p-10 flex flex-col items-center justify-center text-gray-500"><Settings className="animate-spin mb-2" size={30} /> Loading PDF...</div>}
                  >
                    <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={400} />
                  </Document>
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
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Watermark Settings</h3>
                  
                  {/* Text & Color (Previous Features) */}
                  <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="mb-4">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Watermark Text</label>
                      <div className="relative">
                        <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full border border-gray-300 rounded-md py-2.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-[#E5322D]" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Color Preset</label>
                      <div className="flex gap-2">
                        {['#E5322D', '#000000', '#2563EB', '#16A34A', '#9333EA'].map((color) => (
                          <button key={color} onClick={() => setWatermarkColor(color)} className={`w-8 h-8 rounded-full border-2 ${watermarkColor === color ? 'border-gray-800 scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Page Target Settings (New Features) */}
                  <div className="mb-6">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                      <Layers size={16} className="text-[#E5322D]"/> Apply Watermark To:
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[
                        { id: 'all', label: 'All Pages' },
                        { id: 'odd', label: 'Odd Pages Only' },
                        { id: 'even', label: 'Even Pages Only' },
                        { id: 'custom', label: 'Custom Range' },
                      ].map((range) => (
                        <button key={range.id} onClick={() => setPageRange(range.id)} className={`py-2 px-2 text-xs font-bold border rounded-md transition-all ${pageRange === range.id ? 'border-[#E5322D] bg-red-50 text-[#E5322D]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
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
                      <div className="mt-3">
                        <input type="text" value={customPages} onChange={(e) => setCustomPages(e.target.value)} placeholder="e.g. 1-5, 8, 11-13" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#E5322D]" />
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
                      onClick={() => applyWatermark('full_document')} 
                      disabled={isWatermarking} 
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm bg-[#E5322D] hover:bg-red-700 transition shadow-md disabled:bg-gray-400"
                    >
                      Download FULL PDF (With Watermarks)
                    </button>
                    
                    {/* Option 2: Extracted Pages Only */}
                    {pageRange !== 'all' && (
                      <button 
                        onClick={() => applyWatermark('only_watermarked')} 
                        disabled={isWatermarking} 
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-700 font-bold text-sm bg-white border-2 border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
                      >
                        Extract & Download ONLY Watermarked Pages
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
