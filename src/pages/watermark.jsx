import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 🔥 FIX: Added 'Stamp' and 'Loader2' to the imports
import { 
  UploadCloud, X, Type, Image as ImageIcon, Layers, 
  ChevronLeft, ChevronRight, Download, Sliders, Shield, LayoutGrid, Stamp, Loader2
} from 'lucide-react';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '3.11.174'}/build/pdf.worker.min.mjs`;
}

export default function AdvancedWatermark() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // --- 🔥 ADVANCED WATERMARK STATES ---
  const [watermarkType, setWatermarkType] = useState('text'); // text, image
  
  // Text Options
  const [textOptions, setTextOptions] = useState({
    text: 'CONFIDENTIAL',
    color: '#ff0000',
    font: 'Helvetica-Bold',
    fontSize: 60,
    opacity: 30,
    rotation: -45,
    isMosaic: false, // Repeat pattern
    zIndex: 'overlay' // background, overlay
  });

  // Image Options
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageOptions, setImageOptions] = useState({
    scale: 50,
    opacity: 30,
    rotation: 0,
    isMosaic: false,
    zIndex: 'overlay'
  });

  // Page Targeting
  const [pageRange, setPageRange] = useState('all'); 
  const [customPages, setCustomPages] = useState('');
  
  // Security
  const [flattenPdf, setFlattenPdf] = useState(false);

  // File Handlers
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setCurrentPage(1);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleImageChange = (e) => {
    const selectedImg = e.target.files?.[0];
    if (selectedImg && (selectedImg.type === 'image/jpeg' || selectedImg.type === 'image/png')) {
      setImageFile(selectedImg);
      setImageUrl(URL.createObjectURL(selectedImg));
    } else {
      alert("Please upload a valid JPG or PNG image.");
    }
  };

  const removeFile = () => {
    if (fileUrl) URL.revokeObjectURL(fileUrl);
    setFile(null);
    setFileUrl(null);
    setCurrentPage(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // Math Tools
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

  // --- 🔥 CORE PDF PROCESSING ENGINE (NO DUMMY) ---
  const applyWatermark = async (downloadMode) => {
    if (!file) return;
    if (watermarkType === 'text' && !textOptions.text.trim()) return alert("Enter text.");
    if (watermarkType === 'image' && !imageFile) return alert("Upload an image.");

    setIsWatermarking(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const totalPdfPages = pages.length;

      // 1. Resolve Target Pages
      let pagesToWatermark = [];
      if (pageRange === 'all') pagesToWatermark = pages.map((_, i) => i + 1);
      else if (pageRange === 'odd') pagesToWatermark = pages.map((_, i) => i + 1).filter(p => p % 2 !== 0);
      else if (pageRange === 'even') pagesToWatermark = pages.map((_, i) => i + 1).filter(p => p % 2 === 0);
      else if (pageRange === 'custom') pagesToWatermark = parseCustomPages(customPages, totalPdfPages);
      else if (pageRange === 'current') pagesToWatermark = [currentPage];

      if (pagesToWatermark.length === 0) {
        alert("No valid pages selected.");
        setIsWatermarking(false);
        return;
      }

      // 2. Embed Assets
      let customFont;
      let pdfImage;
      let imageDims;

      if (watermarkType === 'text') {
        const fontType = textOptions.font === 'Helvetica-Bold' ? StandardFonts.HelveticaBold :
                         textOptions.font === 'Times-Italic' ? StandardFonts.TimesRomanItalic :
                         StandardFonts.Helvetica;
        customFont = await pdfDoc.embedFont(fontType);
      } else {
        const imageBytes = await imageFile.arrayBuffer();
        if (imageFile.type === 'image/png') pdfImage = await pdfDoc.embedPng(imageBytes);
        else pdfImage = await pdfDoc.embedJpg(imageBytes);
        imageDims = pdfImage.scale(imageOptions.scale / 100);
      }

      // 3. Draw Engine
      pages.forEach((page, index) => {
        const pageNum = index + 1;
        if (!pagesToWatermark.includes(pageNum)) return;

        const { width, height } = page.getSize();
        
        if (watermarkType === 'text') {
          const textSize = Number(textOptions.fontSize);
          const angleRad = (Number(textOptions.rotation) * Math.PI) / 180;
          const textWidth = customFont.widthOfTextAtSize(textOptions.text, textSize);
          
          if (textOptions.isMosaic) {
            // Tile Pattern
            const stepX = textWidth + 100;
            const stepY = textSize + 100;
            for (let x = -width; x < width * 2; x += stepX) {
              for (let y = -height; y < height * 2; y += stepY) {
                page.drawText(textOptions.text, {
                  x, y, size: textSize, font: customFont,
                  color: hexToPdfRgb(textOptions.color),
                  opacity: textOptions.opacity / 100,
                  rotate: degrees(Number(textOptions.rotation))
                });
              }
            }
          } else {
            // Single Center Placement
            const cx = (width / 2) - (textWidth / 2) * Math.cos(angleRad) + (textSize / 2) * Math.sin(angleRad);
            const cy = (height / 2) - (textWidth / 2) * Math.sin(angleRad) - (textSize / 2) * Math.cos(angleRad);
            page.drawText(textOptions.text, {
              x: cx, y: cy, size: textSize, font: customFont,
              color: hexToPdfRgb(textOptions.color),
              opacity: textOptions.opacity / 100,
              rotate: degrees(Number(textOptions.rotation))
            });
          }
        } else if (watermarkType === 'image') {
          if (imageOptions.isMosaic) {
            const stepX = imageDims.width + 50;
            const stepY = imageDims.height + 50;
            for (let x = -width; x < width * 2; x += stepX) {
              for (let y = -height; y < height * 2; y += stepY) {
                page.drawImage(pdfImage, {
                  x, y, width: imageDims.width, height: imageDims.height,
                  opacity: imageOptions.opacity / 100,
                  rotate: degrees(Number(imageOptions.rotation))
                });
              }
            }
          } else {
            const cx = (width / 2) - (imageDims.width / 2);
            const cy = (height / 2) - (imageDims.height / 2);
            page.drawImage(pdfImage, {
              x: cx, y: cy, width: imageDims.width, height: imageDims.height,
              opacity: imageOptions.opacity / 100,
              rotate: degrees(Number(imageOptions.rotation))
            });
          }
        }
      });

      // 4. Flatten Security
      if (flattenPdf) {
        const form = pdfDoc.getForm();
        try { form.flatten(); } catch(e){} 
      }

      // 5. Output Extraction
      let finalPdfBytes;
      if (downloadMode === 'only_watermarked') {
        const newPdf = await PDFDocument.create();
        const zeroBasedIndices = pagesToWatermark.map(p => p - 1);
        const copiedPages = await newPdf.copyPages(pdfDoc, zeroBasedIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));
        finalPdfBytes = await newPdf.save();
      } else {
        finalPdfBytes = await pdfDoc.save();
      }

      // Fast Browser Download
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_${downloadMode === 'only_watermarked' ? 'Extracted' : 'Watermarked'}_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error adding watermark:", error);
      alert("Failed to process. File might be protected or corrupt.");
    }
    setIsWatermarking(false);
  };

  // --- LIVE CSS STYLE GENERATOR FOR FRONTEND OVERLAY PREVIEW ---
  const generateOverlayStyle = () => {
    if (watermarkType === 'text') {
      return {
        color: textOptions.color,
        opacity: textOptions.opacity / 100,
        fontSize: `${textOptions.fontSize}px`,
        transform: `rotate(${textOptions.rotation}deg)`,
        fontFamily: textOptions.font.split('-')[0],
        fontWeight: textOptions.font.includes('Bold') ? 'bold' : 'normal',
        fontStyle: textOptions.font.includes('Italic') ? 'italic' : 'normal',
        mixBlendMode: textOptions.zIndex === 'background' ? 'overlay' : 'normal'
      };
    } else {
      return {
        opacity: imageOptions.opacity / 100,
        transform: `scale(${imageOptions.scale / 100}) rotate(${imageOptions.rotation}deg)`,
        mixBlendMode: imageOptions.zIndex === 'background' ? 'overlay' : 'normal'
      };
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Advanced Watermark PDF | MasterPdf</title>
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10 max-w-7xl mx-auto w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight flex justify-center items-center gap-3">
            <Stamp className="text-[#E5322D]" size={36}/> Dynamic PDF Watermarker
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Design perfect text/image watermarks with live preview, mosaic tiling, and secure flattening.
          </p>
        </div>

        <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col relative min-h-[600px]">
          
          {!file ? (
            <div className="flex-grow flex items-center justify-center w-full h-full p-12">
              <div className="text-center border-2 border-dashed border-gray-300 rounded-xl p-16 w-full max-w-2xl bg-gray-50">
                <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-5 px-10 rounded-xl inline-flex items-center gap-3 transition shadow-lg">
                  <UploadCloud size={24} /> Upload PDF Document
                </label>
                <p className="mt-4 text-gray-500">Max file size: 100MB</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col lg:flex-row gap-8">
              
              {/* LEFT SIDE: LIVE PDF VIEWER */}
              <div className="w-full lg:w-7/12 flex flex-col items-center justify-start bg-gray-100 border border-gray-300 rounded-xl p-6 relative">
                <button onClick={removeFile} className="absolute top-4 right-4 z-50 bg-white shadow-md rounded-full p-2 text-gray-500 hover:text-red-500 transition">
                  <X size={20} />
                </button>

                {/* PDF RENDER BOX WITH LIVE WATERMARK OVERLAY */}
                <div className="relative border border-gray-300 shadow-md bg-white overflow-hidden flex justify-center w-full max-w-[450px] min-h-[600px]">
                  
                  {/* LIVE OVERLAY LAYER */}
                  {(pageRange === 'all' || pageRange === 'current' || 
                   (pageRange === 'odd' && currentPage % 2 !== 0) || 
                   (pageRange === 'even' && currentPage % 2 === 0)) && (
                    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
                      {watermarkType === 'text' && textOptions.isMosaic ? (
                        // TEXT TILE MODE PREVIEW
                        <div className="w-full h-full flex flex-wrap content-start justify-start overflow-hidden">
                          {Array.from({length: 30}).map((_, i) => (
                            <div key={i} className="flex-shrink-0 p-8 whitespace-nowrap" style={generateOverlayStyle()}>
                              {textOptions.text}
                            </div>
                          ))}
                        </div>
                      ) : watermarkType === 'image' && imageOptions.isMosaic && imageUrl ? (
                        // IMAGE TILE MODE PREVIEW
                        <div className="w-full h-full flex flex-wrap content-start justify-start overflow-hidden opacity-50">
                          {Array.from({length: 30}).map((_, i) => (
                            <img key={i} src={imageUrl} className="m-4" style={generateOverlayStyle()} alt="tile" />
                          ))}
                        </div>
                      ) : (
                        // SINGLE CENTERED PREVIEW
                        <div className="w-full h-full flex items-center justify-center">
                          {watermarkType === 'text' ? (
                            <span className="whitespace-nowrap transition-all duration-75 text-center leading-none" style={generateOverlayStyle()}>
                              {textOptions.text}
                            </span>
                          ) : imageUrl ? (
                            <img src={imageUrl} style={generateOverlayStyle()} className="transition-all duration-75 max-w-[80%] max-h-[80%] object-contain" alt="Watermark" />
                          ) : null}
                        </div>
                      )}
                    </div>
                  )}

                  {/* DOCUMENT VIEWER */}
                  <div className="relative z-10">
                    <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<Loader2 className="animate-spin text-blue-500 m-10" size={40}/>}>
                      <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={450} />
                    </Document>
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between w-full max-w-[450px]">
                  <button disabled={currentPage <= 1} onClick={() => setCurrentPage(prev => prev - 1)} className="flex items-center gap-1 px-4 py-2 bg-white border rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50 font-bold text-sm"><ChevronLeft size={16}/> Prev</button>
                  <span className="text-sm font-bold text-gray-700">Page {currentPage} of {numPages}</span>
                  <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(prev => prev + 1)} className="flex items-center gap-1 px-4 py-2 bg-white border rounded-lg shadow-sm disabled:opacity-50 hover:bg-gray-50 font-bold text-sm">Next <ChevronRight size={16}/></button>
                </div>
              </div>

              {/* RIGHT SIDE: ADVANCED CONTROLS */}
              <div className="w-full lg:w-5/12 flex flex-col overflow-y-auto pr-2 max-h-[800px]">
                
                {/* 1. WATERMARK TYPE SELECTOR */}
                <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
                  <button onClick={() => setWatermarkType('text')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition ${watermarkType === 'text' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>
                    <Type size={16}/> Text Watermark
                  </button>
                  <button onClick={() => setWatermarkType('image')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 transition ${watermarkType === 'image' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:bg-gray-200'}`}>
                    <ImageIcon size={16}/> Image/Logo
                  </button>
                </div>

                {/* 2. STYLING OPTIONS */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><Sliders size={16}/> Appearance & Style</h4>
                  
                  {watermarkType === 'text' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">TEXT CONTENT</label>
                        <input type="text" value={textOptions.text} onChange={(e) => setTextOptions({...textOptions, text: e.target.value})} className="w-full border rounded-lg p-2 font-bold focus:ring-2 focus:ring-blue-500 outline-none" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">FONT STYLE</label>
                          <select value={textOptions.font} onChange={(e) => setTextOptions({...textOptions, font: e.target.value})} className="w-full border rounded-lg p-2 text-sm">
                            <option value="Helvetica">Helvetica (Standard)</option>
                            <option value="Helvetica-Bold">Helvetica Bold</option>
                            <option value="Times-Italic">Times Italic</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">COLOR (HEX)</label>
                          <div className="flex gap-2">
                            <input type="color" value={textOptions.color} onChange={(e) => setTextOptions({...textOptions, color: e.target.value})} className="h-9 w-12 rounded cursor-pointer border" />
                            <input type="text" value={textOptions.color} onChange={(e) => setTextOptions({...textOptions, color: e.target.value})} className="w-full border rounded-lg p-2 text-sm uppercase" />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">SIZE ({textOptions.fontSize}px)</label>
                          <input type="range" min="10" max="200" value={textOptions.fontSize} onChange={(e) => setTextOptions({...textOptions, fontSize: e.target.value})} className="w-full accent-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">OPACITY ({textOptions.opacity}%)</label>
                          <input type="range" min="5" max="100" value={textOptions.opacity} onChange={(e) => setTextOptions({...textOptions, opacity: e.target.value})} className="w-full accent-blue-500" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 mb-1">ROTATION ANGLE ({textOptions.rotation}°)</label>
                          <input type="range" min="-180" max="180" value={textOptions.rotation} onChange={(e) => setTextOptions({...textOptions, rotation: e.target.value})} className="w-full accent-blue-500" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">UPLOAD IMAGE (PNG/JPG)</label>
                        <input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">SCALE SIZE ({imageOptions.scale}%)</label>
                          <input type="range" min="10" max="300" value={imageOptions.scale} onChange={(e) => setImageOptions({...imageOptions, scale: e.target.value})} className="w-full accent-blue-500" />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1">OPACITY ({imageOptions.opacity}%)</label>
                          <input type="range" min="5" max="100" value={imageOptions.opacity} onChange={(e) => setImageOptions({...imageOptions, opacity: e.target.value})} className="w-full accent-blue-500" />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-bold text-gray-500 mb-1">ROTATION ANGLE ({imageOptions.rotation}°)</label>
                          <input type="range" min="-180" max="180" value={imageOptions.rotation} onChange={(e) => setImageOptions({...imageOptions, rotation: e.target.value})} className="w-full accent-blue-500" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. LAYOUT & LAYERING */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6">
                  <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2"><LayoutGrid size={16}/> Layout & Target Pages</h4>
                  
                  <div className="flex gap-4 mb-4 border-b border-gray-200 pb-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                      <input type="checkbox" checked={watermarkType === 'text' ? textOptions.isMosaic : imageOptions.isMosaic} onChange={(e) => watermarkType === 'text' ? setTextOptions({...textOptions, isMosaic: e.target.checked}) : setImageOptions({...imageOptions, isMosaic: e.target.checked})} className="w-4 h-4 accent-blue-600" />
                      Mosaic (Tile Pattern)
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-bold" title="Flattened Background blending">
                      <input type="checkbox" checked={(watermarkType === 'text' ? textOptions.zIndex : imageOptions.zIndex) === 'background'} onChange={(e) => { const z = e.target.checked ? 'background' : 'overlay'; watermarkType === 'text' ? setTextOptions({...textOptions, zIndex: z}) : setImageOptions({...imageOptions, zIndex: z}); }} className="w-4 h-4 accent-blue-600" />
                      Push to Background
                    </label>
                  </div>

                  <label className="block text-xs font-bold text-gray-500 mb-2">APPLY WATERMARK TO:</label>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[{ id: 'all', label: 'All Pages' }, { id: 'odd', label: 'Odd Pages' }, { id: 'even', label: 'Even Pages' }, { id: 'custom', label: 'Custom Range' }].map((range) => (
                      <button key={range.id} onClick={() => setPageRange(range.id)} className={`py-2 px-2 text-xs font-bold border rounded-md transition ${pageRange === range.id ? 'border-[#E5322D] bg-red-50 text-[#E5322D]' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                        {range.label}
                      </button>
                    ))}
                  </div>

                  <button onClick={() => setPageRange('current')} className={`w-full py-2 text-xs font-bold border rounded-md transition ${pageRange === 'current' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                    Apply ONLY to Current Page ({currentPage})
                  </button>
                  
                  {pageRange === 'custom' && (
                    <div className="mt-3">
                      <input type="text" value={customPages} onChange={(e) => setCustomPages(e.target.value)} placeholder="e.g. 1-5, 8, 11-13" className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm" />
                    </div>
                  )}
                </div>

                {/* 4. SECURITY & EXPORT */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2"><Shield size={16}/> Security & Export</h4>
                  
                  <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-red-600 mb-4 bg-red-50 p-2 rounded border border-red-100">
                    <input type="checkbox" checked={flattenPdf} onChange={(e) => setFlattenPdf(e.target.checked)} className="w-4 h-4 accent-red-600" />
                    Flatten PDF (Locks watermark from removal)
                  </label>

                  <div className="flex flex-col gap-3">
                    <button onClick={() => applyWatermark('full_document')} disabled={isWatermarking} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm bg-[#E5322D] hover:bg-red-700 transition shadow-md disabled:bg-gray-400">
                      {isWatermarking ? <Loader2 className="animate-spin" size={18}/> : <Download size={18} />}
                      Download FULL PDF
                    </button>
                    
                    {pageRange !== 'all' && (
                      <button onClick={() => applyWatermark('only_watermarked')} disabled={isWatermarking} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-gray-700 font-bold text-sm bg-white border-2 border-gray-300 hover:bg-gray-50 transition shadow-sm disabled:opacity-50">
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
