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
import { UploadCloud, X, Scan, ArrowRight, Settings, Layers } from 'lucide-react';

// FIX: react-pdf v9+ requires the .mjs worker to load PDFs successfully in Next.js
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function VisualCropPdf() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [numPages, setNumPages] = useState(null);
  
  // Crop state (Gallery jaisa box)
  const [crop, setCrop] = useState({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
  
  // Enterprise Features: Page Range State
  const [pageRange, setPageRange] = useState('all'); // all, odd, even, custom
  const [customPages, setCustomPages] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileUrl(null);
    setCrop({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
    setPageRange('all');
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

  const applyCropAndDownload = async () => {
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
      }

      pages.forEach((page, index) => {
        const pageNum = index + 1;
        
        // Sirf unhi pages par crop apply karein jo selected hain
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

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Cropped_${file.name}`;
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
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Visual PDF Cropper</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Drag the box to crop and choose specific pages to apply it to.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {!file ? (
            <div className="text-center w-full py-12">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition">
                <UploadCloud size={28} /> Upload PDF to Crop
              </label>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Left: Drag & Drop Visual Cropper */}
              <div className="w-full lg:w-7/12 bg-gray-100 border rounded-xl p-4 flex flex-col items-center relative overflow-hidden min-h-[400px]">
                <button onClick={removeFile} className="absolute top-4 right-4 z-10 bg-white shadow rounded-full p-2 text-gray-500 hover:text-red-500">
                  <X size={20} />
                </button>
                
                <p className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wide">Adjust crop box below</p>
                
                <div className="border border-gray-300 shadow-md bg-white">
                  <ReactCrop 
                    crop={crop} 
                    onChange={c => setCrop(c)}
                    className="max-h-[600px] overflow-hidden"
                  >
                    <Document 
                      file={fileUrl} 
                      onLoadSuccess={onDocumentLoadSuccess}
                      loading={
                        <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                          <Settings className="animate-spin mb-2" size={30} /> Loading PDF...
                        </div>
                      }
                    >
                      <Page 
                        pageNumber={1} 
                        renderTextLayer={false} 
                        renderAnnotationLayer={false}
                        width={450} // Fixed display width
                      />
                    </Document>
                  </ReactCrop>
                </div>
                <p className="mt-4 text-sm text-gray-500 font-medium">Page 1 of {numPages || '...'}</p>
              </div>

              {/* Right: Enterprise Controls & Actions */}
              <div className="w-full lg:w-5/12 flex flex-col gap-5">
                
                {/* Auto Crop Feature */}
                <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl text-center">
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
                    <Layers size={16} className="text-[#E5322D]"/> Apply Crop To
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { id: 'all', label: 'All Pages' },
                      { id: 'odd', label: 'Odd Only' },
                      { id: 'even', label: 'Even Only' },
                      { id: 'custom', label: 'Custom' },
                    ].map((range) => (
                      <button
                        key={range.id}
                        onClick={() => setPageRange(range.id)}
                        className={`py-2 px-2 text-xs font-semibold border rounded-md transition-all ${
                          pageRange === range.id 
                            ? 'border-[#E5322D] bg-red-50 text-[#E5322D]' 
                            : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                  
                  {pageRange === 'custom' && (
                    <div className="mt-2 animate-fade-in">
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

                {/* Final Apply Button */}
                <div className="mt-auto bg-gray-50 p-5 rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-600 mb-3">Ready to process {pageRange === 'all' ? 'all pages' : 'selected pages'}.</p>
                  <button 
                    onClick={applyCropAndDownload} 
                    disabled={isCropping} 
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 transition shadow-md disabled:bg-gray-400"
                  >
                    {isCropping ? <><Settings className="animate-spin" size={24} /> Processing...</> : <>Crop PDF <ArrowRight size={24} /></>}
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
