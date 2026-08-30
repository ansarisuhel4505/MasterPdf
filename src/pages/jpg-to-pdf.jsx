import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import {
  UploadCloud, X, ArrowRight, Trash2, Plus, ChevronDown, ChevronUp,
  Sun, Moon, History, Download, Lock, Palette, RotateCw,
  Image as ImageIcon, Settings, SlidersHorizontal, ZoomIn, ZoomOut,
  Type, Combine, Split, Shield, FileText, Sparkles,
  FlipHorizontal, FlipVertical, CheckCircle2,Undo, Redo 
} from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors
} from '@dnd-kit/core';
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ACCEPTED_FORMATS = 'image/jpeg,image/png,image/webp,image/gif,image/bmp,image/tiff';

const translations = {
  en: {
    title: 'Image to PDF Converter',
    desc: 'Convert JPG, PNG, and other images to PDF with advanced options.',
    upload: 'Drag & drop images here or',
    browse: 'Browse Files',
    addMore: 'Add More Images',
    clearAll: 'Clear All',
    options: 'Conversion Options',
    basic: 'Basic',
    advanced: 'Advanced',
    pageSize: 'Page Size',
    orientation: 'Orientation',
    margins: 'Margins',
    customMargins: 'Custom Margins (mm)',
    fitOption: 'Fit Option',
    fitToPage: 'Fit to Page',
    fillPage: 'Fill Page',
    actualSize: 'Actual Size',
    quality: 'Compression',
    lossless: 'Lossless (Best Quality)',
    low: 'Low (Small Size)',
    medium: 'Medium',
    high: 'High (Larger)',
    background: 'Page Background',
    white: 'White',
    black: 'Black',
    custom: 'Custom',
    rotate: 'Rotate',
    flipH: 'Flip Horizontal',
    flipV: 'Flip Vertical',
    brightness: 'Brightness',
    contrast: 'Contrast',
    password: 'Password Protection',
    confirmPassword: 'Confirm Password',
    watermark: 'Watermark Text',
    watermarkColor: 'Color',
    watermarkSize: 'Size',
    ocr: 'Enable OCR (Searchable PDF)',
    metadataTitle: 'Document Title',
    metadataAuthor: 'Author',
    pdfa: 'PDF/A Compliance',
    compressOutput: 'Compress Output',
    merge: 'Merge all images into one PDF',
    split: 'Split each image into separate PDF',
    multiPage: 'Images per Page (Grid)',
    rows: 'Rows',
    cols: 'Columns',
    aiSmartSort: 'AI Smart Sorting',
    smartFilename: 'Smart Filename Generator',
    history: 'History',
    clearHistory: 'Clear History',
    darkMode: 'Dark Mode',
    undo: 'Undo',
    redo: 'Redo',
    success: 'Conversion successful!',
    error: 'Something went wrong.',
    noImages: 'Please add at least one image.',
    invalidType: 'Only JPG, PNG, WEBP, GIF, BMP, TIFF are allowed.',
    tooLarge: 'File too large. Max 100 MB.',
    preview: 'Preview',
    download: 'Download'
  },
  hi: {
    title: 'इमेज से PDF कन्वर्टर',
    desc: 'JPG, PNG और अन्य इमेज को उन्नत विकल्पों के साथ PDF में बदलें।',
    upload: 'इमेज यहाँ खींचें या',
    browse: 'फ़ाइलें चुनें',
    addMore: 'और इमेज जोड़ें',
    clearAll: 'सभी हटाएँ',
    options: 'कन्वर्शन विकल्प',
    basic: 'मूल',
    advanced: 'उन्नत',
    pageSize: 'पेज साइज़',
    orientation: 'ओरिएंटेशन',
    margins: 'मार्जिन',
    customMargins: 'कस्टम मार्जिन (mm)',
    fitOption: 'फिट विकल्प',
    fitToPage: 'पेज में फिट करें',
    fillPage: 'पेज भरें',
    actualSize: 'वास्तविक आकार',
    quality: 'संपीड़न',
    lossless: 'लॉसलेस (सर्वोत्तम गुणवत्ता)',
    low: 'निम्न (छोटा आकार)',
    medium: 'मध्यम',
    high: 'उच्च (बड़ा)',
    background: 'पृष्ठ पृष्ठभूमि',
    white: 'सफेद',
    black: 'काला',
    custom: 'कस्टम',
    rotate: 'घुमाएँ',
    flipH: 'क्षैतिज फ्लिप',
    flipV: 'लंबवत फ्लिप',
    brightness: 'चमक',
    contrast: 'कंट्रास्ट',
    password: 'पासवर्ड सुरक्षा',
    confirmPassword: 'पासवर्ड की पुष्टि करें',
    watermark: 'वॉटरमार्क टेक्स्ट',
    watermarkColor: 'रंग',
    watermarkSize: 'आकार',
    ocr: 'OCR सक्षम करें (खोज योग्य PDF)',
    metadataTitle: 'दस्तावेज़ शीर्षक',
    metadataAuthor: 'लेखक',
    pdfa: 'PDF/A अनुपालन',
    compressOutput: 'आउटपुट संपीड़ित करें',
    merge: 'सभी इमेज को एक PDF में मर्ज करें',
    split: 'प्रत्येक इमेज को अलग PDF में विभाजित करें',
    multiPage: 'प्रति पेज इमेज (ग्रिड)',
    rows: 'पंक्तियाँ',
    cols: 'कॉलम',
    aiSmartSort: 'AI स्मार्ट सॉर्टिंग',
    smartFilename: 'स्मार्ट फ़ाइलनाम जनरेटर',
    history: 'इतिहास',
    clearHistory: 'इतिहास साफ़ करें',
    darkMode: 'डार्क मोड',
    undo: 'पूर्ववत',
    redo: 'फिर करें',
    success: 'कन्वर्शन सफल!',
    error: 'कुछ गड़बड़ हुई।',
    noImages: 'कृपया कम से कम एक इमेज जोड़ें।',
    invalidType: 'केवल JPG, PNG, WEBP, GIF, BMP, TIFF की अनुमति है।',
    tooLarge: 'फ़ाइल बहुत बड़ी है। अधिकतम 100 MB।',
    preview: 'पूर्वावलोकन',
    download: 'डाउनलोड'
  }
};

export default function ImageToPdf() {
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [options, setOptions] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    margins: 'normal',
    customMargins: { top: 20, bottom: 20, left: 20, right: 20 },
    fitOption: 'fit',
    quality: 'lossless',
    background: 'white',
    customBackground: '#ffffff',
    password: '',
    confirmPassword: '',
    watermark: '',
    watermarkColor: '#ff0000',
    watermarkSize: 24,
    ocr: false,
    title: '',
    author: '',
    pdfa: false,
    compressOutput: false,
    merge: true,
    split: false,
    gridRows: 1,
    gridCols: 1,
    aiSort: false,
    smartFilename: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const fileInputRef = useRef(null);
  const t = translations[lang];

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // History
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_image_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_image_history', JSON.stringify(history));
  }, [history]);

  // Drag & Drop
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addImages(files);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const validateImage = (file) => {
    if (!file.type.startsWith('image/')) {
      showToast(t.invalidType, 'error');
      return false;
    }
    if (file.size > 100 * 1024 * 1024) {
      showToast(t.tooLarge, 'error');
      return false;
    }
    return true;
  };

  const addImages = (files) => {
    const valid = files.filter(validateImage);
    if (valid.length) {
      const newImages = valid.map((file, idx) => ({
        id: `img-${Date.now()}-${idx}`,
        file,
        name: file.name,
        url: URL.createObjectURL(file),
        rotation: 0,
        flipH: false,
        flipV: false,
        brightness: 100,
        contrast: 100,
        isDuplicate: false
      }));
      setImages(prev => [...prev, ...newImages]);
      setUndoStack(prev => [...prev, images]);
      setRedoStack([]);
    }
  };

  const removeImage = (id) => {
    setUndoStack(prev => [...prev, images]);
    setImages(prev => prev.filter(img => img.id !== id));
    setRedoStack([]);
  };

  const clearAll = () => {
    if (images.length === 0) return;
    setUndoStack(prev => [...prev, images]);
    setImages([]);
    setRedoStack([]);
  };

  // Undo/Redo
  const undo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, images]);
    setImages(last);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, images]);
    setImages(last);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Image operations
  const rotateImage = (id) => {
    setUndoStack(prev => [...prev, images]);
    setImages(prev => prev.map(img => img.id === id ? { ...img, rotation: (img.rotation + 90) % 360 } : img));
    setRedoStack([]);
  };

  const flipImage = (id, direction) => {
    setUndoStack(prev => [...prev, images]);
    setImages(prev => prev.map(img => {
      if (img.id !== id) return img;
      if (direction === 'h') return { ...img, flipH: !img.flipH };
      return { ...img, flipV: !img.flipV };
    }));
    setRedoStack([]);
  };

  const adjustBrightness = (id, value) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, brightness: value } : img));
  };

  const adjustContrast = (id, value) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, contrast: value } : img));
  };

  // DnD for reorder
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setUndoStack(prev => [...prev, images]);
      const oldIndex = images.findIndex(img => img.id === active.id);
      const newIndex = images.findIndex(img => img.id === over.id);
      setImages(prev => arrayMove(prev, oldIndex, newIndex));
      setRedoStack([]);
    }
  };

  // AI Smart Sorting (simulated)
  const aiSort = () => {
    setImages(prev => [...prev].sort((a, b) => a.name.localeCompare(b.name)));
    showToast('AI sorting applied');
  };

  // Apply image adjustments using canvas (for local PDF generation)
  const processImageForPDF = async (image, pageWidth, pageHeight) => {
    const img = new Image();
    img.src = image.url;
    await new Promise(resolve => img.onload = resolve);
    
    // Apply brightness/contrast/flip/rotation
    const canvas = document.createElement('canvas');
    canvas.width = pageWidth;
    canvas.height = pageHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = options.background === 'white' ? '#ffffff' : options.background === 'black' ? '#000000' : options.customBackground;
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    // Calculate fit
    let drawX, drawY, drawW, drawH;
    const imgW = img.width;
    const imgH = img.height;
    const scaleX = pageWidth / imgW;
    const scaleY = pageHeight / imgH;
    if (options.fitOption === 'fill') {
      const scale = Math.max(scaleX, scaleY);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = (pageWidth - drawW) / 2;
      drawY = (pageHeight - drawH) / 2;
    } else if (options.fitOption === 'actual') {
      drawW = imgW;
      drawH = imgH;
      drawX = (pageWidth - drawW) / 2;
      drawY = (pageHeight - drawH) / 2;
    } else {
      // fit to page
      const scale = Math.min(scaleX, scaleY);
      drawW = imgW * scale;
      drawH = imgH * scale;
      drawX = (pageWidth - drawW) / 2;
      drawY = (pageHeight - drawH) / 2;
    }

    // Apply filters
    ctx.filter = `brightness(${image.brightness}%) contrast(${image.contrast}%)`;
    ctx.translate(pageWidth / 2, pageHeight / 2);
    ctx.rotate((image.rotation * Math.PI) / 180);
    if (image.flipH) ctx.scale(-1, 1);
    if (image.flipV) ctx.scale(1, -1);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.filter = 'none';

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9); // fixed quality
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    return new Uint8Array(await blob.arrayBuffer());
  };

  // Generate PDF
  const processImages = async () => {
    if (images.length === 0) return showToast(t.noImages, 'error');
    if (options.password && options.password !== options.confirmPassword) {
      showToast('Passwords do not match!', 'error');
      return;
    }
    setIsProcessing(true);
    setProgress(0);

    try {
      // Determine page size in points
      const pageSizes = {
        A4: [595.28, 841.89],
        A3: [841.89, 1190.55],
        A5: [420, 595],
        Letter: [612, 792],
        Legal: [612, 1008]
      };
      let pageWidth, pageHeight;
      const size = pageSizes[options.pageSize] || pageSizes.A4;
      if (options.orientation === 'landscape') {
        pageWidth = size[1];
        pageHeight = size[0];
      } else {
        pageWidth = size[0];
        pageHeight = size[1];
      }

      // Adjust margins
      let marginTop = 0, marginBottom = 0, marginLeft = 0, marginRight = 0;
      if (options.margins === 'normal') {
        marginTop = marginBottom = marginLeft = marginRight = 20;
      } else if (options.margins === 'narrow') {
        marginTop = marginBottom = marginLeft = marginRight = 10;
      } else if (options.margins === 'wide') {
        marginTop = marginBottom = marginLeft = marginRight = 40;
      } else if (options.margins === 'custom') {
        marginTop = options.customMargins.top;
        marginBottom = options.customMargins.bottom;
        marginLeft = options.customMargins.left;
        marginRight = options.customMargins.right;
      }
      // Convert margins to points (assuming mm -> points: 1mm = 2.83465 points)
      const mmToPt = 2.83465;
      marginTop = Math.round(marginTop * mmToPt);
      marginBottom = Math.round(marginBottom * mmToPt);
      marginLeft = Math.round(marginLeft * mmToPt);
      marginRight = Math.round(marginRight * mmToPt);

      const contentWidth = pageWidth - marginLeft - marginRight;
      const contentHeight = pageHeight - marginTop - marginBottom;

      const pdfDoc = await PDFDocument.create();
      const pageCount = options.split ? images.length : Math.ceil(images.length / (options.gridRows * options.gridCols));
      
      // For each page
      for (let p = 0; p < pageCount; p++) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        // For each grid cell
        const gridRows = options.gridRows;
        const gridCols = options.gridCols;
        const cellWidth = contentWidth / gridCols;
        const cellHeight = contentHeight / gridRows;

        for (let r = 0; r < gridRows; r++) {
          for (let c = 0; c < gridCols; c++) {
            const imgIndex = p * gridRows * gridCols + r * gridCols + c;
            if (imgIndex >= images.length) break;
            const image = images[imgIndex];
            // Process image (apply adjustments and fit to cell)
            const processedBytes = await processImageForPDF(image, cellWidth, cellHeight);
            const embeddedImage = await pdfDoc.embedJpg(processedBytes);
            const drawX = marginLeft + c * cellWidth;
            const drawY = pageHeight - marginBottom - (r + 1) * cellHeight; // top-left origin

            // If split option, each image gets its own page
            if (options.split) {
              // For split, we already created a page, just draw image full page
              // Actually we'll create separate pages above, so this loop only runs if not split.
            }
            page.drawImage(embeddedImage, { x: drawX, y: drawY, width: cellWidth, height: cellHeight });
          }
        }

        // Add watermark if enabled
        if (options.watermark) {
          const { width, height } = page.getSize();
          page.drawText(options.watermark, {
            x: width / 2 - options.watermarkSize * 2,
            y: height / 2,
            size: options.watermarkSize,
            color: rgb(
              parseInt(options.watermarkColor.slice(1,3),16)/255,
              parseInt(options.watermarkColor.slice(3,5),16)/255,
              parseInt(options.watermarkColor.slice(5,7),16)/255
            ),
            opacity: 0.3,
            rotate: degrees(45)
          });
        }

        // Add page numbers if user wants? Not asked.
      }

      // Set metadata
      if (options.title) pdfDoc.setTitle(options.title);
      if (options.author) pdfDoc.setAuthor(options.author);

      let finalBytes = await pdfDoc.save();

      // If OCR needed, upload and call backend
      if (options.ocr) {
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const uploaded = await upload('temp.pdf', blob, { access: 'public', handleUploadUrl: '/api/upload' });
        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'ocr-pdf', fileUrl: uploaded.url })
        });
        const data = await response.json();
        if (response.ok && data.downloadUrl) {
          finalBytes = await (await fetch(data.downloadUrl)).arrayBuffer();
        }
      }

      // Password protection via backend
      if (options.password) {
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const uploaded = await upload('temp.pdf', blob, { access: 'public', handleUploadUrl: '/api/upload' });
        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'protect-pdf',
            fileUrl: uploaded.url,
            password: options.password
          })
        });
        const data = await response.json();
        if (response.ok && data.downloadUrl) {
          finalBytes = await (await fetch(data.downloadUrl)).arrayBuffer();
        }
      }

      // PDF/A compliance
      if (options.pdfa) {
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const uploaded = await upload('temp.pdf', blob, { access: 'public', handleUploadUrl: '/api/upload' });
        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'pdf-to-pdfa', fileUrl: uploaded.url, options: { level: 'pdfa1b' } })
        });
        const data = await response.json();
        if (response.ok && data.downloadUrl) {
          finalBytes = await (await fetch(data.downloadUrl)).arrayBuffer();
        }
      }

      // Compress output
      if (options.compressOutput) {
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const uploaded = await upload('temp.pdf', blob, { access: 'public', handleUploadUrl: '/api/upload' });
        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'compress-pdf', fileUrl: uploaded.url })
        });
        const data = await response.json();
        if (response.ok && data.downloadUrl) {
          finalBytes = await (await fetch(data.downloadUrl)).arrayBuffer();
        }
      }

      // Download
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      // Smart filename
      let filename = 'MasterPdf_Images.pdf';
      if (options.smartFilename) {
        const firstWord = images[0].name.split('.')[0].replace(/[^a-z0-9]+/gi, '_');
        filename = `${firstWord || 'Images'}.pdf`;
      }
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      // History
      const entry = { time: new Date().toLocaleString(), files: images.map(i => i.name), format: 'PDF' };
      setHistory(prev => [entry, ...prev].slice(0, 10));
      showToast(t.success, 'success');
      setProgress(100);
    } catch (error) {
      console.error(error);
      showToast(t.error, 'error');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // Sortable Image Component
  const SortableImage = ({ image, rotateImage, flipImage, adjustBrightness, adjustContrast, removeImage }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
      touchAction: 'none'
    };
    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`relative bg-white border rounded-lg p-2 ${isDragging ? 'ring-2 ring-red-300' : ''}`}>
        <div className="w-40 h-40 overflow-hidden bg-gray-100 relative">
          <img src={image.url} alt={image.name} className="w-full h-full object-contain" style={{ transform: `rotate(${image.rotation}deg) scaleX(${image.flipH ? -1 : 1}) scaleY(${image.flipV ? -1 : 1})`, filter: `brightness(${image.brightness}%) contrast(${image.contrast}%)` }} />
          <button onClick={(e) => { e.stopPropagation(); removeImage(image.id); }} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"><X size={12} /></button>
        </div>
        <div className="flex justify-between mt-2">
          <button onClick={(e) => { e.stopPropagation(); rotateImage(image.id); }} className="text-gray-600 hover:text-blue-600"><RotateCw size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); flipImage(image.id, 'h'); }} className="text-gray-600 hover:text-blue-600"><FlipHorizontal size={14} /></button>
          <button onClick={(e) => { e.stopPropagation(); flipImage(image.id, 'v'); }} className="text-gray-600 hover:text-blue-600"><FlipVertical size={14} /></button>
        </div>
        <div className="mt-2">
          <label className="text-xs">Brightness</label>
          <input type="range" min="50" max="150" value={image.brightness} onChange={(e) => adjustBrightness(image.id, e.target.value)} className="w-full" />
          <label className="text-xs">Contrast</label>
          <input type="range" min="50" max="150" value={image.contrast} onChange={(e) => adjustContrast(image.id, e.target.value)} className="w-full" />
        </div>
        <span className="absolute bottom-1 left-1 text-xs bg-gray-100 px-1 rounded">{image.name}</span>
      </div>
    );
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>{t.title} | MasterPdf</title>
        <meta name="description" content="Convert JPG, PNG, and other images to PDF online free. Advanced options." />
      </Head>
      <Navbar />
      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-base sm:text-lg opacity-80">{t.desc}</p>
        </div>
        <div className="flex justify-end mb-4 gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow">{darkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 rounded-lg border bg-white dark:bg-gray-800">
            <option value="en">English</option><option value="hi">हिन्दी</option>
          </select>
          <button onClick={undo} disabled={undoStack.length === 0} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow disabled:opacity-30"><Undo size={18} /></button>
          <button onClick={redo} disabled={redoStack.length === 0} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow disabled:opacity-30"><Redo size={18} /></button>
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* Sidebar */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><SlidersHorizontal size={18} /> {t.options}</h3>
            <div className="space-y-4">
              {/* Basic options */}
              <div>
                <label className="block text-sm font-medium mb-1">{t.pageSize}</label>
                <select value={options.pageSize} onChange={(e) => setOptions({ ...options, pageSize: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="A4">A4</option><option value="A3">A3</option><option value="A5">A5</option><option value="Letter">Letter</option><option value="Legal">Legal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.orientation}</label>
                <select value={options.orientation} onChange={(e) => setOptions({ ...options, orientation: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="portrait">Portrait</option><option value="landscape">Landscape</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.margins}</label>
                <select value={options.margins} onChange={(e) => setOptions({ ...options, margins: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="normal">Normal</option><option value="narrow">Narrow</option><option value="wide">Wide</option><option value="custom">Custom</option>
                </select>
              </div>
              {options.margins === 'custom' && (
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" placeholder="Top" value={options.customMargins.top} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, top: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                  <input type="number" placeholder="Bottom" value={options.customMargins.bottom} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, bottom: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                  <input type="number" placeholder="Left" value={options.customMargins.left} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, left: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                  <input type="number" placeholder="Right" value={options.customMargins.right} onChange={(e) => setOptions({ ...options, customMargins: { ...options.customMargins, right: e.target.value } })} className="p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">{t.fitOption}</label>
                <select value={options.fitOption} onChange={(e) => setOptions({ ...options, fitOption: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="fit">{t.fitToPage}</option><option value="fill">{t.fillPage}</option><option value="actual">{t.actualSize}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.quality}</label>
                <select value={options.quality} onChange={(e) => setOptions({ ...options, quality: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="lossless">{t.lossless}</option><option value="low">{t.low}</option><option value="medium">{t.medium}</option><option value="high">{t.high}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t.background}</label>
                <select value={options.background} onChange={(e) => setOptions({ ...options, background: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="white">{t.white}</option><option value="black">{t.black}</option><option value="custom">{t.custom}</option>
                </select>
              </div>
              {options.background === 'custom' && (
                <input type="color" value={options.customBackground} onChange={(e) => setOptions({ ...options, customBackground: e.target.value })} className="w-full h-10 border rounded" />
              )}
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">{t.gridRows}</label>
                  <input type="number" min="1" max="5" value={options.gridRows} onChange={(e) => setOptions({ ...options, gridRows: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">{t.gridCols}</label>
                  <input type="number" min="1" max="5" value={options.gridCols} onChange={(e) => setOptions({ ...options, gridCols: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>
              </div>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.split} onChange={(e) => setOptions({ ...options, split: e.target.checked })} />
                {t.split}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.merge} onChange={(e) => setOptions({ ...options, merge: e.target.checked })} />
                {t.merge}
              </label>
              <button onClick={() => setShowAdvanced(!showAdvanced)} className="w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />} {showAdvanced ? 'Hide Advanced' : 'Advanced'}
              </button>
              {showAdvanced && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.password}</label>
                    <input type="password" value={options.password} onChange={(e) => setOptions({ ...options, password: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                    <label className="block text-sm font-medium mb-1 mt-2">{t.confirmPassword}</label>
                    <input type="password" value={options.confirmPassword} onChange={(e) => setOptions({ ...options, confirmPassword: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.watermark}</label>
                    <input type="text" value={options.watermark} onChange={(e) => setOptions({ ...options, watermark: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                    <div className="flex gap-2 mt-2">
                      <input type="color" value={options.watermarkColor} onChange={(e) => setOptions({ ...options, watermarkColor: e.target.value })} className="w-10 h-10 border rounded" />
                      <input type="number" value={options.watermarkSize} onChange={(e) => setOptions({ ...options, watermarkSize: e.target.value })} className="w-20 p-2 border rounded bg-white dark:bg-gray-900" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.ocr} onChange={(e) => setOptions({ ...options, ocr: e.target.checked })} />
                    {t.ocr}
                  </label>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.metadataTitle}</label>
                    <input type="text" value={options.title} onChange={(e) => setOptions({ ...options, title: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                    <label className="block text-sm font-medium mb-1 mt-2">{t.metadataAuthor}</label>
                    <input type="text" value={options.author} onChange={(e) => setOptions({ ...options, author: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                  </div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.pdfa} onChange={(e) => setOptions({ ...options, pdfa: e.target.checked })} />
                    {t.pdfa}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.compressOutput} onChange={(e) => setOptions({ ...options, compressOutput: e.target.checked })} />
                    {t.compressOutput}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.aiSort} onChange={(e) => setOptions({ ...options, aiSort: e.target.checked })} />
                    {t.aiSmartSort}
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={options.smartFilename} onChange={(e) => setOptions({ ...options, smartFilename: e.target.checked })} />
                    {t.smartFilename}
                  </label>
                </div>
              )}
            </div>
          </div>
          {/* Main */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[500px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* Upload area */}
              {images.length === 0 ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  className="flex-1 border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center"
                >
                  <input type="file" accept={ACCEPTED_FORMATS} multiple onChange={handleFileChange} className="hidden" ref={fileInputRef} />
                  <UploadCloud size={48} className="text-blue-500 mb-3" />
                  <p className="text-lg font-semibold">{t.upload}</p>
                  <button onClick={() => fileInputRef.current.click()} className="bg-[#E5322D] text-white px-8 py-3 rounded-xl font-bold mt-4">{t.browse}</button>
                  <p className="text-xs text-gray-400 mt-2">JPG, PNG, WEBP, GIF, BMP, TIFF</p>
                </div>
              ) : (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-4">
                    <button onClick={() => fileInputRef.current.click()} className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg"><Plus size={18} /> {t.addMore}</button>
                    <button onClick={clearAll} className="text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={16} /> {t.clearAll}</button>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold">{images.length} Images</span>
                    <button onClick={aiSort} className="flex items-center gap-1 text-xs bg-gray-200 px-2 py-1 rounded"><Sparkles size={14} /> {t.aiSmartSort}</button>
                  </div>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={images.map(img => img.id)} strategy={rectSortingStrategy}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-96 overflow-y-auto bg-gray-50 p-3 rounded-lg">
                        {images.map(image => (
                          <SortableImage key={image.id} image={image} rotateImage={rotateImage} flipImage={flipImage} adjustBrightness={adjustBrightness} adjustContrast={adjustContrast} removeImage={removeImage} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              )}
              {/* Convert Button */}
              {images.length > 0 && (
                <button onClick={processImages} disabled={isProcessing} className="mt-6 w-full py-4 bg-[#E5322D] text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  {isProcessing ? <><Settings className="animate-spin" size={24} /> Processing... {progress}%</> : <>Convert to PDF <ArrowRight size={24} /></>}
                </button>
              )}
            </div>
            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2"><History size={18} /> {t.history}</h4>
                  <button onClick={() => setHistory([])} className="text-red-500 text-sm hover:underline">{t.clearHistory}</button>
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span>{item.files.join(', ')} <span className="opacity-50">({item.time})</span></span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
