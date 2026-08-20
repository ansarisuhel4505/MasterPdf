import React, { useState } from 'react';
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
  const [isDetecting, setIsDetecting] = useState(false);
  
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Default crop size 80% with 10% margins
  const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
  
  const [pageRange, setPageRange] = useState('all'); 
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

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

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

  // Improved Smart Scan
  const performAutoCrop = async () => {
    if (!fileUrl) return;
    setIsDetecting(true);
    
    try {
      const loadingTask = pdfjs.getDocument(fileUrl);
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(currentPage);
      
      const viewport = page.getViewport({ scale: 1.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({ canvasContext: context, viewport: viewport }).promise;

      const imgData = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          const r = imgData[i], g = imgData[i+1], b = imgData[i+2], a = imgData[i+3];
          
          // Better threshold for scanned and gray-ish backgrounds
          if (a > 30 && (r < 245 || g < 245 || b < 245)) {
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }

      const padX = canvas.width * 0.02, padY = canvas.height * 0.02;
      minX = Math.max(0, minX - padX);
      minY = Math.max(0, minY - padY);
      maxX = Math.min(canvas.width, maxX + padX);
      maxY = Math.min(canvas.height, maxY + padY);

      if (maxX > minX && maxY > minY) {
        setCrop({
          unit: '%',
          x: (minX / canvas.width) * 100,
          y: (minY / canvas.height) * 100,
          width: ((maxX - minX) / canvas.width) * 100,
          height: ((maxY - minY) / canvas.height) * 100
        });
      } else {
        alert("Couldn't detect clear margins. Please crop manually.");
      }
    } catch (err) {
      console.error(err);
      alert("Scan failed.");
    }
    
    setIsDetecting(false);
  };

  // CORE LOGIC FIX: Download & Coordinate Mapping
  const applyCropAndDownload = async (downloadMode) => {
    if (!file) return;
    setIsCropping(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPdfPages = pdfDoc.getPageCount();

      // Step 1: Filter Pages
      let pagesToCrop = [];
      if (pageRange === 'all') {
        pagesToCrop = Array.from({length: totalPdfPages}, (_, i) => i + 1);
      } else if (pageRange === 'odd') {
        pagesToCrop = Array.from({length: totalPdfPages}, (_, i) => i + 1).filter(p => p % 2 !== 0);
      } else if (pageRange === 'even') {
        pagesToCrop = Array.from({length: totalPdfPages}, (_, i) => i + 1).filter(p => p % 2 === 0);
      } else if (pageRange === 'custom') {
        pagesToCrop = parseCustomPages(customPages, totalPdfPages);
      } else if (pageRange === 'current') {
        pagesToCrop = [currentPage];
      }

      if (pagesToCrop.length === 0) {
        alert("No valid pages selected.");
        setIsCropping(false);
        return;
      }

      // Step 2: Extract or Keep Full PDF
      let outPdf;
      let targetIndices = []; 

      if (downloadMode === 'only_cropped') {
        // Sirf cropped pages ka naya PDF banega (Issue 1 & 2 fix)
        outPdf = await PDFDocument.create();
        const zeroBasedIndices = pagesToCrop.map(p => p - 1);
        const copiedPages = await outPdf.copyPages(pdfDoc, zeroBasedIndices);
        copiedPages.forEach((p) => outPdf.addPage(p));
        // Naye pdf mein ab wahi pages hain jo crop hone the
        targetIndices = Array.from({length: copiedPages.length}, (_, i) => i);
      } else {
        // Full PDF mein sirf un pages ko replace karega jo select hue the (Issue 3 fix)
        outPdf = pdfDoc;
        targetIndices = pagesToCrop.map(p => p - 1);
      }

      // Step 3: Apply the strict Crop dimensions
      const pages = outPdf.getPages();

      targetIndices.forEach((pageIndex) => {
        const page = pages[pageIndex];
        
        // Exact Box Matching (solves replacement issue)
        const currentBox = page.getCropBox() || page.getMediaBox();
        const pWidth = currentBox.width;
        const pHeight = currentBox.height;

        const cWidth = (crop.width / 100) * pWidth;
        const cHeight = (crop.height / 100) * pHeight;
        const cX = (crop.x / 100) * pWidth;
        const cY = (crop.y / 100) * pHeight;

        const newX = currentBox.x + cX;
        const newY = currentBox.y + (pHeight - cY - cHeight); // Invert Y for PDF

        if (cWidth > 10 && cHeight > 10) {
          page.setCropBox(newX, newY, cWidth, cHeight);
          page.setMediaBox(newX, newY, cWidth, cHeight);
          page.setTrimBox(newX, newY, cWidth, cHeight);
          page.setBleedBox(newX, newY, cWidth, cHeight);
        }
      });

      // Step 4: Download
      const finalPdfBytes = await outPdf.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const suffix = downloadMode === 'only_cropped' ? '_Extracted' : '_Cropped';
      link.download = `MasterPdf${suffix}_${file.name}`;
      link.click();

    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Failed to process PDF.");
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
              
              {/* Left: Preview Panel */}
              <div className="w-full lg:w-7/12 flex flex-col items-center justify-start bg-gray-100 border border-gray-300 rounded-xl p-6 relative">
                <button onClick={removeFile} className="absolute top-4 right-4 z-10 bg-white shadow rounded-full p-2 text-gray-500 hover:text-red-500">
                  <X size={20} />
                </button>
                
                <p className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">Adjust crop box below</p>
                
                <div className="border-2 border-gray-300 shadow-md bg-white">
                  {(pageRange === 'all' || pageRange === 'current' || 
                   (pageRange === 'odd' && currentPage % 2 !== 0) || 
                   (pageRange === 'even' && currentPage % 2 === 0)) ? (
                    <ReactCrop crop={crop} onChange={c => setCrop(c)} className="max-h-[500px] overflow-hidden">
                      <Document 
                        file={fileUrl} 
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="p-10 text-gray-500"><Settings className="animate-spin mb-2" size={30} /></div>}
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

                <div className="mt-6 flex items-center justify-between w-full max-w-[400px]">
                  <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)} className="flex items-center gap-1 px-4 py-2 bg-white border rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50">
                    <ChevronLeft size={16}/> Prev Page
                  </button>
                  <span className="text-sm font-bold text-gray-700">Page {currentPage} of {numPages}</span>
                  <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(prev => prev + 1)} className="flex items-center gap-1 px-4 py-2 bg-white border rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50">
                    Next Page <ChevronRight size={16}/>
                  </button>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="w-full lg:w-5/12 flex flex-col justify-between overflow-y-auto">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 border-b pb-2">Crop Settings</h3>
                  
                  {/* Smart Scan */}
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl text-center mb-6">
                    <Scan size={30} className="text-blue-500 mx-auto mb-2" />
                    <h3 className="font-bold text-gray-900 mb-1">Smart Auto-Crop</h3>
                    <button 
                      onClick={performAutoCrop}
                      disabled={isDetecting}
                      className="w-full py-2 bg-white border border-blue-300 text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition text-sm flex justify-center items-center gap-2"
                    >
                      {isDetecting ? <><Settings className="animate-spin" size={16} /> Scanning Pixels...</> : "Scan & Detect Margins"}
                    </button>
                  </div>

                  {/* Range Settings */}
                  <div className="bg-gray-50 border border-gray-200 p-5 rounded-xl">
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3 border-b pb-2">
                      <Layers size={16} className="text-[#E5322D]"/> Apply Crop To:
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {[{ id: 'all', label: 'All Pages' }, { id: 'odd', label: 'Odd Only' }, { id: 'even', label: 'Even Only' }, { id: 'custom', label: 'Custom Range' }].map((range) => (
                        <button
                          key={range.id}
                          onClick={() => setPageRange(range.id)}
                          className={`py-2 px-2 text-xs font-bold border rounded-md transition-all ${pageRange === range.id ? 'border-[#E5322D] bg-red-50 text-[#E5322D]' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}
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
                      <div className="mt-3">
                        <input type="text" value={customPages} onChange={(e) => setCustomPages(e.target.value)} placeholder="e.g. 1-5, 8, 11-13" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[#E5322D]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Final Exports */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"><Download size={16} className="text-[#E5322D]" /> Finish & Export</h4>
                  
                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={() => applyCropAndDownload('full_document')} 
                      disabled={isCropping} 
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm bg-[#E5322D] hover:bg-red-700 transition shadow-md disabled:bg-gray-400"
                    >
                      {isCropping ? <><Settings className="animate-spin" size={18} /> Processing...</> : "Download FULL PDF (Real Replacement)"}
                    </button>
                    
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
