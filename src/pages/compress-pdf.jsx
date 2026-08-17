import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, degrees } from 'pdf-lib';
import { upload } from '@vercel/blob/client';
import { 
  UploadCloud, FileText, Image as ImageIcon, X, Settings, 
  Sliders, ImagePlus, PaintBucket, Lock, Unlock, 
  Palette, Crop, Layers, ArrowRight, Download
} from 'lucide-react';

export default function CompressPdf() {
  // File & State
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(''); // 'pdf', 'image'
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Image Preview
  const [previewUrl, setPreviewUrl] = useState(null);

  // ✅ ADVANCED SETTINGS (Pro Level Features)
  const [quality, setQuality] = useState(80); // 0-100
  const [dpi, setDpi] = useState(150); // 72, 150, 300
  const [width, setWidth] = useState(''); // Custom Width
  const [height, setHeight] = useState(''); // Custom Height
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [colorMode, setColorMode] = useState('color'); // 'color' or 'grayscale'
  const [bgColor, setBgColor] = useState('#ffffff'); // Background Color (for padding if resized)
  const [outputFormat, setOutputFormat] = useState('pdf'); // 'pdf', 'jpg', 'png'
  const [pageRange, setPageRange] = useState(''); // '1,3,5' or '1-10'
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [fitToPage, setFitToPage] = useState(false); // A4 के हिसाब से फिट करेगा

  // Image Ref for Canvas processing
  const canvasRef = useRef(null);

  // File Change Handler
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    // Auto-detect file type
    if (selectedFile.type === 'application/pdf') {
      setFileType('pdf');
      setOutputFormat('pdf');
      setWidth('');
      setHeight('');
    } else if (selectedFile.type.startsWith('image/')) {
      setFileType('image');
    } else {
      alert("Please upload a valid PDF or Image (JPG/PNG) file.");
      setFile(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileType('');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setIsProcessing(false);
  };

  // 🔥 MAIN PROCESS LOGIC (Pro Level)
  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      // ==========================================
      // 1. IMAGE TO IMAGE / IMAGE TO PDF CONVERSION (100% Client-Side)
      // ==========================================
      if (fileType === 'image') {
        const img = new Image();
        img.src = previewUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate DPI based resolution
        // (1 inch = 96 pixels. We'll treat 96px as 1 inch scale)
        const pixelScale = 1; // Client side we keep it native for quality
        let targetWidth = width ? parseInt(width) : img.naturalWidth;
        let targetHeight = height ? parseInt(height) : img.naturalHeight;

        // A4 Page Size logic (Points 595x842 at 72 DPI -> 792x1122 at 96 DPI)
        if (fitToPage) {
          const A4Width = 792; // pixels
          const A4Height = 1122; 
          const scaleX = A4Width / img.naturalWidth;
          const scaleY = A4Height / img.naturalHeight;
          const scale = Math.min(scaleX, scaleY); // Fit within A4
          targetWidth = Math.floor(img.naturalWidth * scale);
          targetHeight = Math.floor(img.naturalHeight * scale);
        } else if (lockAspectRatio && (width || height)) {
          if (width && !height) {
            targetHeight = Math.floor((img.naturalHeight / img.naturalWidth) * parseInt(width));
          } else if (height && !width) {
            targetWidth = Math.floor((img.naturalWidth / img.naturalHeight) * parseInt(height));
          }
        }

        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // 🟢 1. DRAW BACKGROUND COLOR (If padding exists)
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // 🟢 2. DRAW IMAGE (Center alignment)
        const offsetX = (targetWidth - targetWidth) / 2;
        const offsetY = (targetHeight - targetHeight) / 2;
        ctx.drawImage(img, offsetX, offsetY, targetWidth, targetHeight);

        // 🟢 3. APPLY GRAYSCALE FILTER (If selected)
        if (colorMode === 'grayscale') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
            data[i] = brightness;
            data[i + 1] = brightness;
            data[i + 2] = brightness;
          }
          ctx.putImageData(imageData, 0, 0);
        }

        let finalBlob;

        // 🟢 4. EXPORT AS JPG OR PNG
        if (outputFormat === 'jpg' || outputFormat === 'png') {
          const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : 'image/png';
          finalBlob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality / 100));
        } 
        // 🟢 5. EXPORT AS PDF (Using pdf-lib)
        else {
          const pdfDoc = await PDFDocument.create();
          let pdfPage;
          
          if (fitToPage) {
            pdfPage = pdfDoc.addPage([595.28, 841.89]); // A4 Standard
          } else {
            // Create page exactly the size of target (Convert px to points roughly)
            const ptWidth = (targetWidth / 96) * 72;
            const ptHeight = (targetHeight / 96) * 72;
            pdfPage = pdfDoc.addPage([ptWidth, ptHeight]);
          }

          const imageBytes = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.98));
          const jpgImage = await pdfDoc.embedJpg(await imageBytes.arrayBuffer());
          
          const { width: pageWidth, height: pageHeight } = pdfPage.getSize();
          
          // Scale image to fit page properly
          const scaleX = pageWidth / jpgImage.width;
          const scaleY = pageHeight / jpgImage.height;
          const scale = Math.min(scaleX, scaleY) * 0.95; // Leave a slight margin

          pdfPage.drawImage(jpgImage, {
            x: pageWidth / 2 - (jpgImage.width * scale) / 2,
            y: pageHeight / 2 - (jpgImage.height * scale) / 2,
            width: jpgImage.width * scale,
            height: jpgImage.height * scale,
          });

          finalBlob = new Blob([await pdfDoc.save()], { type: 'application/pdf' });
        }

        // Download Logic for Image/PDF
        const link = document.createElement('a');
        link.href = URL.createObjectURL(finalBlob);
        const ext = outputFormat === 'pdf' ? '.pdf' : outputFormat === 'jpg' ? '.jpg' : '.png';
        link.download = `Processed_${file.name.split('.')[0]}${ext}`;
        link.click();

      } 
      
      // ==========================================
      // 2. PDF COMPRESSION (Uses Backend API)
      // ==========================================
      else if (fileType === 'pdf') {
        // Upload to Vercel Blob first
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });

        // Send to Backend
        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'compress-pdf', 
            fileUrl: blob.url,
            // These options will be added to your backend master-convert when you upgrade the backend
            quality, 
            dpi, 
            removeMetadata,
            pageRange 
          }),
        });

        const data = await response.json();
        if (response.ok && data.downloadUrl) {
          window.location.href = data.downloadUrl; // Direct download
        } else {
          alert("Compression Failed: " + (data.error || "Unknown error"));
        }
      }

    } catch (error) {
      console.error("Process Error:", error);
      alert("Processing failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Compress & Resize PDF/Images - MasterPdf</title></Head>
      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Compress & Resize PDF / Photo</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Reduce PDF size or Resize Images with custom DPI, Grayscale mode, Background colors, and output formats (JPG, PNG, PDF).
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {!file ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center p-10 bg-gray-50/50 transition-colors">
              <input type="file" id="file-upload" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-4 border-dashed border-red-200/50 hover:border-red-100">
                <UploadCloud size={28} /> Select PDF / Photo
              </label>
              <p className="mt-4 text-gray-400 text-sm">Supports .pdf, .jpg, .png</p>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-full relative p-6 gap-8">
              
              {/* LEFT SIDE: File Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-6 min-h-[400px] relative">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition z-20"><X size={20} /></button>
                
                <div className="w-full flex flex-col items-center justify-center h-full gap-4">
                  {fileType === 'pdf' ? (
                    <FileText size={80} className="text-[#E5322D] mb-2" />
                  ) : (
                    previewUrl && <img src={previewUrl} alt="Preview" className="max-h-[250px] max-w-full object-contain rounded shadow-sm border border-gray-200 bg-white" />
                  )}
                  <p className="text-sm font-bold text-gray-800 text-center break-words w-full px-4">{file.name}</p>
                  <p className="text-xs text-gray-500 bg-white px-3 py-1 border rounded-full">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB 
                    <span className="ml-2 font-semibold text-[#E5322D] uppercase">{file.type}</span>
                  </p>
                  {fileType === 'image' && (
                    <p className="text-xs text-gray-400">Click the "Pro Settings" below to resize & convert!</p>
                  )}
                </div>
              </div>

              {/* RIGHT SIDE: Advanced Settings & Actions */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                    <Sliders size={20} className="text-[#E5322D]" /> Compression & Optimization
                  </h3>

                  <div className="space-y-4">
                    {/* Basic Controls */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Quality (%) : <span className="text-[#E5322D]">{quality}%</span>
                      </label>
                      <input 
                        type="range" min="10" max="100" value={quality}
                        onChange={(e) => setQuality(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E5322D]"
                      />
                    </div>

                    {/* Advanced Settings Toggle */}
                    <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full bg-gray-50 border hover:bg-gray-100 text-gray-700 text-sm font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Settings size={16} /> {showAdvanced ? 'Hide' : 'Show'} Advanced Pro Settings
                    </button>

                    {/* Pro Settings Panel */}
                    {showAdvanced && (
                      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3 transition-all duration-300">
                        <div className="grid grid-cols-2 gap-3">
                          {/* DPI Option */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">DPI / Resolution</label>
                            <select value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))} className="w-full bg-white border rounded-md p-2 text-sm">
                              <option value={72}>72 DPI (Web)</option>
                              <option value={150}>150 DPI (Standard)</option>
                              <option value={300}>300 DPI (Print)</option>
                            </select>
                          </div>
                          {/* Color Mode */}
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">Color Mode</label>
                            <select value={colorMode} onChange={(e) => setColorMode(e.target.value)} className="w-full bg-white border rounded-md p-2 text-sm">
                              <option value="color">Full Color</option>
                              <option value="grayscale">Grayscale (B&W)</option>
                            </select>
                          </div>
                        </div>

                        {/* IMAGE / PHOTO SPECIFIC SETTINGS */}
                        {fileType === 'image' && (
                          <div className="pt-3 border-t border-gray-200 space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="block text-xs font-semibold text-gray-600">Target Width (px)</label>
                              <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Auto" className="w-20 bg-white border rounded-md p-1.5 text-sm" />
                              <label className="block text-xs font-semibold text-gray-600">Height (px)</label>
                              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Auto" className="w-20 bg-white border rounded-md p-1.5 text-sm" />
                            </div>

                            <div className="flex flex-wrap items-center gap-3 text-xs">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={lockAspectRatio} onChange={(e) => setLockAspectRatio(e.target.checked)} />
                                <Lock size={14} className={lockAspectRatio ? "text-[#E5322D]" : "text-gray-400"} /> Lock Ratio
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={fitToPage} onChange={(e) => setFitToPage(e.target.checked)} />
                                <Layers size={14} className={fitToPage ? "text-[#E5322D]" : "text-gray-400"} /> Fit to A4
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <PaintBucket size={14} className="text-gray-500" />
                                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-6 h-6 border-0 p-0 rounded cursor-pointer" />
                                <span className="ml-1">BG Color</span>
                              </label>
                            </div>

                            <div>
                              <label className="block text-xs font-semibold text-gray-600 mb-1">Output Format</label>
                              <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="w-full bg-white border rounded-md p-2 text-sm">
                                <option value="pdf">PDF (Compressed)</option>
                                <option value="jpg">JPG Image</option>
                                <option value="png">PNG Image</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* PDF SPECIFIC SETTINGS */}
                        {fileType === 'pdf' && (
                          <div className="pt-3 border-t border-gray-200 space-y-3">
                             <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer">
                                <input type="checkbox" checked={removeMetadata} onChange={() => setRemoveMetadata(!removeMetadata)} />
                                Remove Metadata (Author/Date)
                             </label>
                             <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Page Range (Optional)</label>
                                <input type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="e.g. 1-10 or 2,5,7" className="w-full bg-white border rounded-md p-2 text-sm" />
                             </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="mt-6 flex justify-end">
                  <button 
                    onClick={processFile} 
                    disabled={isProcessing} 
                    className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <><Settings className="animate-spin" size={24} /> Processing & Optimizing...</>
                    ) : (
                      <>{fileType === 'image' ? 'Resize & Export' : 'Compress PDF'} <Download size={24} /></>
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
