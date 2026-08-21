import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  UploadCloud, Image as ImageIcon, X, Settings, Layers, 
  RotateCw, Contrast, Scan, FileOutput, RefreshCw, Lock,
  Camera, Download, PaintBucket, FileText, ArrowUp, ArrowDown
} from 'lucide-react';

let Tesseract = null;

const loadPdfMake = async () => {
  if (window.pdfMake && window.pdfMake.vfs) return window.pdfMake;
  await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/pdfmake.min.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
  await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.2.10/vfs_fonts.js';
    script.onload = resolve;
    document.head.appendChild(script);
  });
  return window.pdfMake;
};

export default function ScanToPdf() {
  const [items, setItems] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('images'); 
  
  const [draggedIndex, setDraggedIndex] = useState(null);

  const [rotationAngle, setRotationAngle] = useState(0);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [binarize, setBinarize] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

  const [ocrText, setOcrText] = useState('');
  const [ocrLang, setOcrLang] = useState('eng');
  const [ocrSuccess, setOcrSuccess] = useState(false);

  const [outputFormat, setOutputFormat] = useState('pdf');
  const [colorMode, setColorMode] = useState('color');
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkColor, setWatermarkColor] = useState('#000000');
  
  const [password, setPassword] = useState('');

  const handleCameraCapture = (e) => {
    const file = e.target.files[0];
    if (file) addImageToItems(file);
    e.target.value = null;
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => addImageToItems(file));
    e.target.value = null;
  };

  const addImageToItems = (file) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload valid Image files (JPG, PNG).");
      return;
    }
    const url = URL.createObjectURL(file);
    setItems(prev => [...prev, {
      id: `img-${Date.now()}-${Math.random()}`,
      file, url,
      rotation: 0, 
      cropX: null, cropY: null, cropW: null, cropH: null
    }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const onDragStart = (e, index) => setDraggedIndex(index);
  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    const newItems = [...items];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setItems(newItems);
  };
  const onDrop = () => setDraggedIndex(null);

  const performAutoCrop = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        const threshold = 230;
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            if (data[i] < threshold || data[i+1] < threshold || data[i+2] < threshold) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        const margin = 10;
        resolve({
          x: Math.max(0, minX - margin),
          y: Math.max(0, minY - margin),
          w: Math.min(canvas.width - minX, maxX - minX + 2 * margin),
          h: Math.min(canvas.height - minY, maxY - minY + 2 * margin)
        });
      };
    });
  };

  const processImageToCanvas = async (item, cropData = null) => {
    const img = new Image();
    img.src = item.url;
    await new Promise((resolve) => { img.onload = resolve; });

    let width = img.naturalWidth;
    let height = img.naturalHeight;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(img, 0, 0);

    if (cropData || (item.cropX !== null)) {
      const c = cropData || { x: item.cropX, y: item.cropY, w: item.cropW, h: item.cropH };
      const croppedCanvas = document.createElement('canvas');
      croppedCanvas.width = c.w;
      croppedCanvas.height = c.h;
      const ctxCrop = croppedCanvas.getContext('2d');
      ctxCrop.drawImage(canvas, c.x, c.y, c.w, c.h, 0, 0, c.w, c.h);
      canvas.width = c.w; canvas.height = c.h;
      ctx.drawImage(croppedCanvas, 0, 0);
    }

    if (item.rotation !== 0 || rotationAngle !== 0) {
      const angle = (item.rotation + rotationAngle) * Math.PI / 180;
      const newCanvas = document.createElement('canvas');
      newCanvas.width = canvas.width;
      newCanvas.height = canvas.height;
      const newCtx = newCanvas.getContext('2d');
      newCtx.translate(canvas.width/2, canvas.height/2);
      newCtx.rotate(angle);
      newCtx.drawImage(canvas, -canvas.width/2, -canvas.height/2);
      canvas.width = newCanvas.width; canvas.height = newCanvas.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(newCanvas, 0, 0);
    }

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i]; let g = data[i+1]; let b = data[i+2];
      r = factor * (r - 128) + 128 + (brightness - 100);
      g = factor * (g - 128) + 128 + (brightness - 100);
      b = factor * (b - 128) + 128 + (brightness - 100);
      if (colorMode === 'grayscale' || binarize) {
        const gray = 0.34 * r + 0.5 * g + 0.16 * b;
        r = gray; g = gray; b = gray;
      }
      if (binarize) {
        const val = r > 128 ? 255 : 0;
        r = val; g = val; b = val;
      }
      data[i] = Math.min(255, Math.max(0, r));
      data[i+1] = Math.min(255, Math.max(0, g));
      data[i+2] = Math.min(255, Math.max(0, b));
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };

  const triggerOcr = async () => {
    if (items.length === 0) return alert("Upload images first.");
    setIsOcrProcessing(true);
    setOcrSuccess(false);
    setOcrText('');
    try {
      const TesseractModule = await import('tesseract.js');
      Tesseract = TesseractModule.default;

      let fullText = '';
      for (let i = 0; i < items.length; i++) {
        const canvas = await processImageToCanvas(items[i]);
        const imgDataUrl = canvas.toDataURL('image/png');
        const { data: { text } } = await Tesseract.recognize(imgDataUrl, ocrLang, { logger: (m) => console.log(m) });
        fullText += `--- Page ${i+1} ---\n${text}\n\n`;
      }
      setOcrText(fullText);
      setOcrSuccess(true);
    } catch (err) {
      console.error("OCR Error:", err);
      setOcrText("OCR failed. Please check console.");
    } finally {
      setIsOcrProcessing(false);
    }
  };

  const processScan = async () => {
    if (items.length === 0) return alert("Please upload at least one image.");
    setIsProcessing(true);
    
    try {
      if (password) {
        const pdfMake = await loadPdfMake();
        
        if (outputFormat === 'zip') {
          const passZip = new JSZip();
          for (let i = 0; i < items.length; i++) {
            const canvas = await processImageToCanvas(items[i]);
            const pageWidth = 595.28; const pageHeight = 841.89; 
            
            const scale = Math.min((pageWidth - 40) / canvas.width, (pageHeight - 40) / canvas.height);
            const w = canvas.width * scale; const h = canvas.height * scale;
            const x = (pageWidth - w) / 2; const y = (pageHeight - h) / 2;

            const docDef = {
              pageSize: 'A4', pageMargins: [0, 0, 0, 0],
              userPassword: password, ownerPassword: password,
              content: [ { image: canvas.toDataURL('image/jpeg', 0.95), width: w, height: h, absolutePosition: { x, y } } ]
            };

            if (backgroundColor !== '#ffffff') {
               docDef.background = [{ type: 'rect', x: 0, y: 0, w: pageWidth, h: pageHeight, color: backgroundColor }];
            }
            if (watermarkText.trim()) {
               docDef.watermark = { text: watermarkText, color: watermarkColor, opacity: 0.4, bold: true };
            }

            const blob = await new Promise(resolve => pdfMake.createPdf(docDef).getBlob(resolve));
            passZip.file(`Protected_Scan_${i+1}.pdf`, blob);
          }
          const zipBlob = await passZip.generateAsync({ type: 'blob' });
          const link = document.createElement('a'); 
          link.href = URL.createObjectURL(zipBlob);
          link.download = 'MasterPdf_Protected_Scans.zip'; 
          link.target = '_blank';
          link.click();

        } else {
          const content = [];
          for (let i = 0; i < items.length; i++) {
            const canvas = await processImageToCanvas(items[i]);
            const pageWidth = 595.28; const pageHeight = 841.89;
            
            const scale = Math.min((pageWidth - 40) / canvas.width, (pageHeight - 40) / canvas.height);
            const w = canvas.width * scale; const h = canvas.height * scale;
            
            const pageGroup = [];
            if (backgroundColor !== '#ffffff') {
              pageGroup.push({ canvas: [{ type: 'rect', x: 0, y: 0, w: pageWidth, h: pageHeight, color: backgroundColor }], absolutePosition: { x: 0, y: 0 } });
            }
            
            pageGroup.push({
              image: canvas.toDataURL('image/jpeg', 0.95), width: w, height: h,
              absolutePosition: { x: (pageWidth - w) / 2, y: (pageHeight - h) / 2 }
            });

            if (ocrText && ocrSuccess) {
              pageGroup.push({ text: "OCR", color: 'white', fontSize: 1, absolutePosition: { x: 0, y: 0 } });
            }

            content.push({ stack: pageGroup, pageBreak: i === 0 ? undefined : 'before' });
          }

          const docDef = {
            pageSize: 'A4', pageMargins: [0, 0, 0, 0],
            userPassword: password, ownerPassword: password,
            content: content
          };
          if (watermarkText.trim()) docDef.watermark = { text: watermarkText, color: watermarkColor, opacity: 0.4, bold: true };
          
          pdfMake.createPdf(docDef).download('MasterPdf_Protected_Scan.pdf');
        }
        
        setIsProcessing(false);
        return;
      }

      const zip = new JSZip();
      let singlePdfDoc = null;
      if (outputFormat === 'pdf') singlePdfDoc = await PDFDocument.create();

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const canvas = await processImageToCanvas(item);
        
        const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', 0.95));
        const arrayBuffer = await blob.arrayBuffer();

        let currentPdfDoc = singlePdfDoc;
        if (outputFormat === 'zip') currentPdfDoc = await PDFDocument.create();

        const jpgImage = await currentPdfDoc.embedJpg(arrayBuffer);
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const page = currentPdfDoc.addPage([pageWidth, pageHeight]);

        if (backgroundColor !== '#ffffff') {
          const { r, g, b } = hexToRgb(backgroundColor);
          page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: rgb(r, g, b) });
        }
        
        const scale = Math.min((pageWidth - 40) / jpgImage.width, (pageHeight - 40) / jpgImage.height);
        const w = jpgImage.width * scale;
        const h = jpgImage.height * scale;
        
        page.drawImage(jpgImage, { 
          x: (pageWidth - w) / 2, 
          y: (pageHeight - h) / 2, 
          width: w, height: h 
        });
        
        if (watermarkText.trim()) {
          const font = await currentPdfDoc.embedFont(StandardFonts.Helvetica);
          const { r, g, b } = hexToRgb(watermarkColor);
          page.drawText(watermarkText, { x: 50, y: 50, size: 30, font, color: rgb(r, g, b), opacity: 0.4 });
        }

        if (outputFormat === 'zip') {
          const pdfBytes = await currentPdfDoc.save();
          zip.file(`Scan_Page_${i+1}.pdf`, pdfBytes);
        }
      }

      if (outputFormat === 'zip') {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a'); 
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'MasterPdf_Scanned_Documents.zip'; 
        link.target = '_blank';
        link.click();
      } else {
        const finalBytes = await singlePdfDoc.save();
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const link = document.createElement('a'); 
        link.href = URL.createObjectURL(blob);
        link.download = 'MasterPdf_Scanned.pdf'; 
        link.target = '_blank';
        link.click();
      }
    } catch (error) {
      console.error("Scan Error:", error); 
      alert("Failed to generate PDF. Error: " + error.message);
    }
    
    setIsProcessing(false);
  };

  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? { r: parseInt(result[1],16)/255, g: parseInt(result[2],16)/255, b: parseInt(result[3],16)/255 } : { r:0, g:0, b:0 };
  };

  const handleAutoCrop = async (index) => {
    const cropData = await performAutoCrop(items[index].file);
    const newItems = [...items];
    newItems[index].cropX = cropData.x;
    newItems[index].cropY = cropData.y;
    newItems[index].cropW = cropData.w;
    newItems[index].cropH = cropData.h;
    setItems(newItems);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      
      {/* 🔥 EXACT SEO HEAD POSITION 🔥 */}
      <Head>
        <title>Scan Images to PDF & OCR Online Free | MasterPdf</title>
        <meta name="description" content="Scan JPG/PNG images to PDF, apply filters, and extract text using OCR. Free online scanner tool by MasterPdf. Created by Suhel Ansari." />
        <meta name="keywords" content="scan to pdf, image to pdf, ocr online, extract text from image, masterpdf, Suhel Ansari" />
        <meta property="og:title" content="Scan Images to PDF & OCR Online Free | MasterPdf" />
        <meta property="og:description" content="Scan JPG/PNG images to PDF, apply filters, and extract text using OCR. Free online scanner tool." />
      </Head>

      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Scan to PDF & OCR</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Upload images, crop, adjust deskew/contrast, run OCR for searchable text, and export.</p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
          {items.length === 0 ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center p-10 bg-gray-50/50 gap-4">
              <div className="flex gap-4">
                <div className="relative">
                  <input type="file" id="file-upload" multiple accept=".jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                  <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl border-4 border-dashed border-red-200/50 hover:border-red-100">
                    <UploadCloud size={28} /> Select Images
                  </label>
                </div>
                <div className="relative">
                  <input type="file" id="camera-upload" accept="image/*" capture="environment" onChange={handleCameraCapture} className="hidden" />
                  <label htmlFor="camera-upload" className="cursor-pointer bg-gray-700 hover:bg-gray-800 text-white text-xl font-bold py-6 px-8 rounded-xl inline-flex items-center gap-3 transition shadow-lg border-4 border-dashed border-gray-400 hover:border-gray-300">
                    <Camera size={28} /> Camera
                  </label>
                </div>
              </div>
              <p className="text-gray-400 text-sm">JPG, PNG supported. Use Camera for mobile scanning.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 overflow-x-auto sticky top-[72px] z-20 shadow-sm">
                {['images', 'enhance', 'ocr', 'output'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-[#E5322D] text-white shadow-md' : 'text-gray-800 hover:bg-white hover:shadow-sm'}`}>
                    {tab === 'images' ? '📷 Images' : tab === 'enhance' ? '✂️ Enhance' : tab === 'ocr' ? '📝 OCR' : '⚙️ Output'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row h-full relative p-6 gap-8">
                
                <div className="w-full md:w-1/2 min-h-[400px] bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[600px]">
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div 
                        key={item.id} draggable onDragStart={(e) => onDragStart(e, index)} onDragOver={(e) => onDragOver(e, index)} onDrop={onDrop}
                        className={`flex items-center justify-between bg-white border p-3 rounded-lg shadow-sm transition cursor-grab active:cursor-grabbing ${draggedIndex === index ? 'border-[#E5322D] ring-2 ring-red-100 opacity-50' : 'border-gray-200 hover:border-gray-300'}`}
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="text-gray-400 hover:text-gray-600 px-1"><Layers size={18} className="rotate-90" /></div>
                          
                          <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200 overflow-hidden relative">
                            <img 
                              src={item.url} 
                              className="w-full h-full object-cover" 
                              alt="Thumb" 
                              onError={(e) => { 
                                e.target.style.display = 'none'; 
                                e.target.nextSibling.style.display = 'flex'; 
                              }} 
                            />
                            <div className="absolute inset-0 hidden items-center justify-center text-gray-400">
                                <ImageIcon size={24} />
                            </div>
                          </div>
                          
                          <span className="text-sm font-bold text-gray-800 truncate">{item.file.name}</span>
                          {item.cropX && <span className="text-xs text-green-500 font-bold border px-1 rounded">Cropped</span>}
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleAutoCrop(index)} className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-[10px] font-bold" title="Auto Crop">✂️ Crop</button>
                          <button onClick={() => removeItem(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition ml-2"><X size={18} /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition">
                      <input type="file" id="add-more" multiple accept=".jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                      <label htmlFor="add-more" className="cursor-pointer flex items-center gap-2 text-sm font-bold text-gray-700"><UploadCloud size={18} /> Add More</label>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-between gap-4">
                  {activeTab === 'images' && (
                    <div className="flex-grow overflow-y-auto space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2">Image Actions</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <button onClick={() => setItems([...items].reverse())} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-800 font-bold text-sm rounded-lg hover:bg-gray-100"><ArrowUp size={16} className="rotate-180"/><ArrowDown size={16}/> Reverse Order</button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'enhance' && (
                    <div className="flex-grow overflow-y-auto space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2"><Scan size={18} className="inline text-[#E5322D] mr-2"/> Smart Enhancements</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                        <div className="flex items-center gap-2"><RotateCw size={16} className="text-gray-600"/> <span className="text-sm font-bold text-gray-800">Deskew / Rotate:</span>
                          <input type="range" min="-45" max="45" value={rotationAngle} onChange={(e) => setRotationAngle(Number(e.target.value))} className="accent-[#E5322D] flex-1" />
                          <span className="text-sm font-bold w-10">{rotationAngle}°</span>
                        </div>
                        <div className="flex items-center gap-2"><Contrast size={16} className="text-gray-600"/> <span className="text-sm font-bold text-gray-800">Contrast:</span>
                          <input type="range" min="0" max="200" value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="accent-[#E5322D] flex-1" />
                          <span className="text-sm font-bold w-10">{contrast}%</span>
                        </div>
                        <div className="flex items-center gap-2"><RefreshCw size={16} className="text-gray-600"/> <span className="text-sm font-bold text-gray-800">Brightness:</span>
                          <input type="range" min="0" max="200" value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="accent-[#E5322D] flex-1" />
                          <span className="text-sm font-bold w-10">{brightness}%</span>
                        </div>
                        <label className="flex items-center gap-3 text-sm font-bold text-gray-800 cursor-pointer border-t pt-2">
                          <input type="checkbox" checked={binarize} onChange={(e) => setBinarize(e.target.checked)} className="accent-[#E5322D] w-5 h-5" />
                          <Scan size={18} className="text-gray-600"/> Black & White Scanner (Binarization)
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ocr' && (
                    <div className="flex-grow overflow-y-auto space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2"><FileText size={18} className="inline text-[#E5322D] mr-2"/> OCR & Searchable PDF</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex gap-2 items-center">
                          <label className="text-sm font-bold text-gray-800">Language:</label>
                          <select value={ocrLang} onChange={(e) => setOcrLang(e.target.value)} className="bg-white border border-gray-300 text-gray-800 rounded px-3 py-1 text-sm font-bold">
                            <option value="eng">English</option>
                            <option value="hin">Hindi</option>
                            <option value="spa">Spanish</option>
                          </select>
                        </div>
                        <button onClick={triggerOcr} disabled={isOcrProcessing} className="w-full flex justify-center items-center gap-2 py-3 bg-[#E5322D] text-white font-bold rounded-lg disabled:bg-gray-400 transition">
                          {isOcrProcessing ? <Settings className="animate-spin" size={20} /> : <>Run OCR & Extract Text <Scan size={20} /></>}
                        </button>
                        {ocrText && <textarea className="w-full h-32 border p-2 text-sm text-gray-800 bg-white rounded-lg" readOnly value={ocrText} placeholder="Extracted text will appear here..." />}
                      </div>
                    </div>
                  )}

                  {activeTab === 'output' && (
                    <div className="flex-grow overflow-y-auto space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2"><FileOutput size={18} className="inline text-[#E5322D] mr-2"/> Output & Security</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div><label className="text-xs font-bold text-gray-800 block mb-1">Color Mode</label>
                            <select value={colorMode} onChange={(e) => setColorMode(e.target.value)} className="w-full bg-white border border-gray-300 p-2 text-sm font-bold text-gray-800 rounded"><option value="color">Full Color</option><option value="grayscale">Grayscale</option><option value="bw">Black & White</option></select>
                          </div>
                          <div><label className="text-xs font-bold text-gray-800 block mb-1">PDF Background Color</label><input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="w-full h-10 border border-gray-300 rounded cursor-pointer" /></div>
                        </div>
                        <div className="border-t pt-3 flex flex-wrap gap-3 items-end">
                          <div className="flex-1"><label className="text-xs font-bold text-gray-800 block mb-1">Watermark Text</label><input type="text" placeholder="Confidential" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full bg-white border border-gray-300 p-2 text-sm font-bold text-gray-800 rounded" /></div>
                          <div><label className="text-xs font-bold text-gray-800 block mb-1">Watermark Color</label><input type="color" value={watermarkColor} onChange={(e) => setWatermarkColor(e.target.value)} className="w-10 h-10 border border-gray-300 rounded cursor-pointer" /></div>
                        </div>
                        <div className="border-t pt-3">
                          <label className="text-xs font-bold text-gray-800 block mb-1">Password Protect</label>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set PDF password" className="w-full bg-white border border-gray-300 p-2 text-sm font-bold text-gray-800 rounded" />
                        </div>
                        <div className="border-t pt-3"><label className="text-xs font-bold text-gray-800 block mb-1">Output Format</label>
                          <div className="flex gap-3"><label className="text-sm font-bold text-gray-800"><input type="radio" name="fmt" checked={outputFormat === 'pdf'} onChange={() => setOutputFormat('pdf')} className="accent-[#E5322D] mr-1" /> Single PDF</label><label className="text-sm font-bold text-gray-800"><input type="radio" name="fmt" checked={outputFormat === 'zip'} onChange={() => setOutputFormat('zip')} className="accent-[#E5322D] mr-1" /> Download ZIP</label></div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end">
                    <button onClick={processScan} disabled={isProcessing} className="w-full md:w-auto flex items-center justify-center gap-2 px-12 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400">
                      {isProcessing ? <><Settings className="animate-spin" size={24} /> Generating...</> : <>Export Scan <Download size={24} /></>}
                    </button>
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
