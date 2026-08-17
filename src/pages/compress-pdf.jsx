import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import { 
  UploadCloud, FileText, X, Settings, 
  Sliders, PaintBucket, Lock, Unlock, Layers, Download, AlertTriangle
} from 'lucide-react';

export default function CompressPdf() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState(''); 
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sizeWarning, setSizeWarning] = useState(false);

  // Common Settings
  const [quality, setQuality] = useState(60);
  const [colorMode, setColorMode] = useState('color');
  const [bgColor, setBgColor] = useState('#ffffff');

  // Image Specific Settings
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [lockAspectRatio, setLockAspectRatio] = useState(true);
  const [fitToPage, setFitToPage] = useState(false);
  const [outputFormat, setOutputFormat] = useState('pdf');

  // PDF Specific Settings (Sent to Backend)
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [pageRange, setPageRange] = useState('');
  const [pdfBgColor, setPdfBgColor] = useState('#ffffff');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setShowAdvanced(false);

    if (selectedFile.type === 'application/pdf') {
      setFileType('pdf');
      setOutputFormat('pdf');
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
    setSizeWarning(false);
  };

  const handleQualityChange = (val) => {
    setQuality(val);
    if (val < 30) setSizeWarning(true);
    else setSizeWarning(false);
  };

  const processFile = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      // 1. PDF
      if (fileType === 'pdf') {
        const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'compress-pdf', 
            fileUrl: blob.url,
            quality, removeMetadata, pageRange, colorMode, pdfBgColor
          }),
        });
        const data = await response.json();
        if (response.ok && data.downloadUrl) window.location.href = data.downloadUrl;
        else alert("Compression Failed: " + (data.error || "Unknown error"));
      } 
      
      // 2. Image (Photo)
      else if (fileType === 'image') {
        const img = new Image();
        img.src = previewUrl;
        await new Promise((resolve) => { img.onload = resolve; });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let targetWidth = width ? parseInt(width) : img.naturalWidth;
        let targetHeight = height ? parseInt(height) : img.naturalHeight;

        if (fitToPage) {
          const A4Width = 792;
          const A4Height = 1122;
          const scaleX = A4Width / img.naturalWidth;
          const scaleY = A4Height / img.naturalHeight;
          const scale = Math.min(scaleX, scaleY);
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

        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        if (colorMode === 'grayscale') {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            const brightness = 0.34 * data[i] + 0.5 * data[i + 1] + 0.16 * data[i + 2];
            data[i] = brightness; data[i + 1] = brightness; data[i + 2] = brightness;
          }
          ctx.putImageData(imageData, 0, 0);
        }

        let finalBlob;
        let fileExtension = outputFormat;

        if (outputFormat === 'jpg' || outputFormat === 'png') {
          const mimeType = outputFormat === 'jpg' ? 'image/jpeg' : 'image/png';
          finalBlob = await new Promise(resolve => canvas.toBlob(resolve, mimeType, quality / 100));
        } else {
           alert("Image to PDF conversion is handled securely via backend. Resizing as JPG.");
           finalBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality / 100));
           fileExtension = 'jpg';
        }

        const link = document.createElement('a');
        link.href = URL.createObjectURL(finalBlob);
        link.download = `Resized_${file.name.split('.')[0]}.${fileExtension === 'pdf' ? 'pdf' : fileExtension}`;
        link.click();
      }

    } catch (error) {
      console.error("Process Error:", error);
      alert("Processing failed. Please check console logs.");
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
            Reduce PDF size drastically or Resize Photos by adding background color.
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
              
              {/* Left Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-6 min-h-[400px] relative">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition z-20"><X size={20} /></button>
                <div className="w-full flex flex-col items-center justify-center h-full gap-4">
                  {fileType === 'pdf' ? (
                    <FileText size={80} className="text-[#E5322D] mb-2" />
                  ) : (
                    previewUrl && <img src={previewUrl} alt="Preview" className="max-h-[250px] max-w-full object-contain rounded shadow-sm border border-gray-200 bg-white" />
                  )}
                  <p className="text-sm font-bold text-gray-800 text-center break-words w-full px-4">{file.name}</p>
                  <p className="text-xs text-gray-600 bg-white px-3 py-1 border rounded-full">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB 
                    <span className="ml-2 font-semibold text-[#E5322D] uppercase">{file.type}</span>
                  </p>
                </div>
              </div>

              {/* Right Settings (High Contrast Fix) */}
              <div className="w-full md:w-1/2 flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                    <Sliders size={20} className="text-[#E5322D]" /> Compression & Optimization
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between">
                        <label className="block text-sm font-semibold text-gray-800 mb-2">Quality (%)</label>
                        <span className="text-sm font-bold text-[#E5322D]">{quality}%</span>
                      </div>
                      <input 
                        type="range" min="10" max="100" value={quality}
                        onChange={(e) => handleQualityChange(parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#E5322D]"
                      />
                      {sizeWarning && (
                         <div className="mt-2 flex items-center gap-2 text-xs text-orange-600 font-semibold bg-orange-50 p-1.5 rounded-md">
                           <AlertTriangle size={14} /> Warning: Quality &lt; 30% results in ~100-200 KB size, but images/text will become blurry/pixelated.
                         </div>
                      )}
                    </div>

                    <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full bg-gray-50 border border-gray-300 hover:bg-gray-100 text-gray-800 font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <Settings size={16} /> {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
                    </button>

                    {showAdvanced && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 transition-all duration-300">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-1">Color Mode</label>
                            <select value={colorMode} onChange={(e) => setColorMode(e.target.value)} className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#E5322D]">
                              <option value="color">Full Color</option>
                              <option value="grayscale">Grayscale (B&W)</option>
                            </select>
                          </div>
                        </div>

                        {/* IMAGE SETTINGS (High Contrast Enabled) */}
                        {fileType === 'image' && (
                          <div className="pt-3 border-t border-gray-200 space-y-3">
                            <div className="flex items-center gap-3">
                              <label className="block text-sm font-semibold text-gray-800">Width (px)</label>
                              <input type="number" value={width} onChange={(e) => setWidth(e.target.value)} placeholder="Auto" className="w-20 bg-white border border-gray-300 text-gray-800 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-[#E5322D]" />
                              <label className="block text-sm font-semibold text-gray-800">Height (px)</label>
                              <input type="number" value={height} onChange={(e) => setHeight(e.target.value)} placeholder="Auto" className="w-20 bg-white border border-gray-300 text-gray-800 rounded-md p-1.5 text-sm focus:ring-2 focus:ring-[#E5322D]" />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-gray-800">
                              <label className="flex items-center gap-2 cursor-pointer hover:text-[#E5322D]">
                                <input type="checkbox" checked={lockAspectRatio} onChange={(e) => setLockAspectRatio(e.target.checked)} className="accent-[#E5322D] w-4 h-4" />
                                <Lock size={16} className={lockAspectRatio ? "text-[#E5322D]" : "text-gray-600"} /> Lock Ratio
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer hover:text-[#E5322D]">
                                <input type="checkbox" checked={fitToPage} onChange={(e) => setFitToPage(e.target.checked)} className="accent-[#E5322D] w-4 h-4" />
                                <Layers size={16} className={fitToPage ? "text-[#E5322D]" : "text-gray-600"} /> Fit to A4
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer hover:text-[#E5322D]">
                                <PaintBucket size={16} className="text-gray-600" />
                                <span>BG Color</span>
                                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-6 h-6 border border-gray-300 p-0 rounded cursor-pointer bg-white" />
                              </label>
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-gray-800 mb-1">Output Format</label>
                              <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#E5322D]">
                                <option value="pdf">PDF (Compressed via Backend)</option>
                                <option value="jpg">JPG Image</option>
                                <option value="png">PNG Image</option>
                              </select>
                            </div>
                          </div>
                        )}

                        {/* PDF SETTINGS (High Contrast Enabled) */}
                        {fileType === 'pdf' && (
                          <div className="pt-3 border-t border-gray-200 space-y-3">
                             <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                                <input type="checkbox" checked={removeMetadata} onChange={() => setRemoveMetadata(!removeMetadata)} className="accent-[#E5322D] w-4 h-4" />
                                Remove Metadata (Author/Date)
                             </label>
                             <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1">Page Range (Optional)</label>
                                <input type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} placeholder="e.g. 1-10 or 2,5,7" className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#E5322D]" />
                             </div>

                             <label className="flex items-center gap-2 text-sm font-medium text-gray-800 cursor-pointer">
                                <PaintBucket size={16} className="text-gray-600" />
                                <span>PDF Background Color</span>
                                <input type="color" value={pdfBgColor} onChange={(e) => setPdfBgColor(e.target.value)} className="w-6 h-6 border border-gray-300 p-0 rounded cursor-pointer bg-white ml-1" />
                             </label>
                             <p className="text-xs text-gray-500 mt-1">Note: If background is dark, black text might hide unless "Grayscale" is enabled.</p>
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
                      <><Settings className="animate-spin" size={24} /> Processing...</>
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
