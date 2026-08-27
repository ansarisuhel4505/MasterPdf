import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

import { 
  UploadCloud, X, Edit3, Type, Image as ImageIcon, PenTool, 
  Download, Settings, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, 
  Trash2, Palette, FileText, Monitor, ZoomIn, ZoomOut, Save, 
  Square, Circle, Highlighter, ShieldCheck, Upload, QrCode, 
  User, Calendar, Stamp, Lock, Layers, ArrowLeft, ArrowRightCircle, 
  HardDrive, Link2, Plus, Menu, Bold
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const signatureFonts = [
  "Brush Script MT", "Caveat", "Dancing Script", "Pacifico", "Satisfy", "Homemade Apple", "Sacramento", "Yellowtail", 
  "Parisienne", "Bad Script", "Tangerine", "Alex Brush", "Allura", "Arizonia", "Cookie", "Courgette", "Damion", 
  "Engagement", "Grand Hotel", "Kaushan Script", "Leckerli One", "Marck Script", "Niconne", "Norican", "Oleo Script", 
  "Over the Rainbow", "Pinyon Script", "Qwigley", "Rancho", "Rochester", "Rouge Script", "Ruge Boogie", "Shadows Into Light", 
  "Sofia", "Stalemate", "Vibur", "Yesteryear", "Zeyada", "Kalam", "Indie Flower", "Patrick Hand", "Amatic SC", "Handlee", 
  "Neucha", "Rock Salt", "Reenie Beanie", "Nothing You Could Do", "Schoolbell", "Nanum Pen Script", "Comic Sans MS"
];

const HIGHLIGHT_COLORS = [
  { hex: '#FDE047', name: 'Yellow' },
  { hex: '#86EFAC', name: 'Green' },
  { hex: '#93C5FD', name: 'Blue' },
  { hex: '#FCA5A5', name: 'Red' },
  { hex: '#F9A8D4', name: 'Pink' },
  { hex: '#D8B4FE', name: 'Purple' }
];

const TEXT_COLORS = ['#E5322D', '#000000', '#1F2937', '#1E3A8A', '#065F46', '#D97706', '#FFFFFF'];

export default function EditPdf() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  
  const [files, setFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const activeFile = files[activeFileIndex] || null;
  
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1.0); 
  const [mobileView, setMobileView] = useState('pdf'); 

  // Elements State
  const [elements, setElements] = useState([]);
  const [activeElementId, setActiveElementId] = useState(null);

  // Global Tool Properties
  const [toolColor, setToolColor] = useState('#000000');
  const [boxBgColor, setBoxBgColor] = useState('#FFFFFF'); // Box Background
  const [highlightColor, setHighlightColor] = useState('#FDE047');
  const [textSize, setTextSize] = useState(16);
  const [isBold, setIsBold] = useState(false); 
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);

  // Modal States
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [hTab, setHTab] = useState('Signature'); 
  const [vTab, setVTab] = useState('Type'); 
  const [fullName, setFullName] = useState('Suhel Ansari');
  const [initials, setInitials] = useState('SA');
  const [sigColor, setSigColor] = useState('#E5322D');
  const [selectedStyle, setSelectedStyle] = useState(1); 
  const [drawnSignature, setDrawnSignature] = useState(null);
  const [uploadedSig, setUploadedSig] = useState(null);
  const [uploadedStamp, setUploadedStamp] = useState(null);
  const [sigMode, setSigMode] = useState('simple'); 
  const [lockDocument, setLockDocument] = useState(false); 

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (showSignatureModal && vTab === 'Draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = sigColor;
    }
  }, [showSignatureModal, vTab, sigColor]);

  const handleFileChange = (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const validFiles = Array.from(selectedFiles).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    
    if (validFiles.length > 0) {
      const newFilesData = validFiles.map(f => ({ file: f, name: f.name, url: URL.createObjectURL(f) }));
      setFiles(prev => [...prev, ...newFilesData]);
      if (step === 1) setStep(2); 
    } else {
      alert("Please upload a valid PDF document (.pdf).");
    }
    e.target.value = ''; 
  };

  const removeFile = () => {
    setFiles([]); setElements([]); setCurrentPage(1); setStep(1); setActiveFileIndex(0); setNumPages(null);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages); setCurrentPage(1);
  };

  // 🔥 FIX 1: Jab element update ho toh previous state pakde taaki real-time chal sake
  const updateElement = (id, newProps) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, ...newProps } : el));
  };

  // 🔥 FIX 2: Centralized Property Handler for REAL-TIME updates
  const handlePropChange = (prop, value) => {
    if (prop === 'color') setToolColor(value);
    if (prop === 'size') setTextSize(value);
    if (prop === 'isBold') setIsBold(value);
    if (prop === 'bgColor') setBoxBgColor(value);
    if (prop === 'highlightColor') setHighlightColor(value);

    // Agar koi box screen par selected hai, toh turant usme ye property daal do
    if (activeElementId) {
      updateElement(activeElementId, { [prop]: value });
    }
  };

  // 🔥 FIX 3: Element Select karne par Toolbars Auto-Sync ho jayein
  const handleSelectElement = (e, el) => {
    e.stopPropagation(); // Background click ko block karo
    setActiveElementId(el.id);
    
    // Tools update karo selected box ke hisaab se
    if (el.color) setToolColor(el.color);
    if (el.size) setTextSize(el.size);
    if (el.isBold !== undefined) setIsBold(el.isBold);
    if (el.bgColor) setBoxBgColor(el.bgColor);
    if (el.type === 'highlight' && el.color) setHighlightColor(el.color);
  };

  const addElement = (type) => {
    let value = ''; let fontStyle = 'Arial, sans-serif';
    let isImage = false; let imgData = null; let isDigital = false;
    let finalColor = toolColor;
    let finalBold = isBold;
    let finalBgColor = boxBgColor;

    if (type === 'signature') {
      if (sigMode === 'simple') {
        if (vTab === 'Draw' && drawnSignature) { isImage = true; imgData = drawnSignature; finalColor = sigColor; }
        else if (vTab === 'Upload' && uploadedSig) { isImage = true; imgData = uploadedSig; finalColor = sigColor; }
        else { value = fullName; fontStyle = signatureFonts[selectedStyle]; finalColor = sigColor; }
      } else if (sigMode === 'digital') {
        const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
        value = `Digitally Signed By: ${fullName}\nDate: ${new Date().toLocaleString()}\nVerify ID: ${uniqueId}`; 
        isDigital = true;
      }
    } 
    else if (type === 'initials') {
      if (vTab === 'Upload' && uploadedSig) { isImage = true; imgData = uploadedSig; }
      else { value = initials; fontStyle = signatureFonts[selectedStyle]; finalColor = sigColor; }
    } 
    else if (type === 'stamp') {
      if (uploadedStamp) { isImage = true; imgData = uploadedStamp; }
      else { setShowSignatureModal(true); setHTab('Stamp'); return; }
    }
    else if (type === 'text') { value = 'Type text here...'; fontStyle = 'Helvetica, sans-serif'; }
    else if (type === 'replaceText') { value = 'New Word'; fontStyle = 'Helvetica, sans-serif'; }

    const baseW = isDigital ? 260 : (isImage ? 200 : (type === 'text' || type === 'replaceText' ? 200 : 150));
    const baseH = isDigital ? 90 : (isImage ? 100 : (type === 'text' ? 40 : (type === 'replaceText' ? 30 : 100)));

    const newElement = {
      id: Date.now(), type, fileIndex: activeFileIndex, page: currentPage, 
      x: 50 / zoom, y: 100 / zoom, 
      width: baseW / zoom, height: baseH / zoom, 
      value, fontStyle, isImage, imgData, isDigital, 
      color: finalColor, size: textSize, isBold: finalBold, bgColor: finalBgColor
    };
    
    if (type === 'highlight') newElement.color = highlightColor; 
    if (type === 'redact') newElement.color = '#000000'; 
    
    setElements(prev => [...prev, newElement]);
    setActiveElementId(newElement.id);
    setMobileView('pdf');
  };

  const applyModalSettings = () => {
    if (vTab === 'Draw' && canvasRef.current) setDrawnSignature(canvasRef.current.toDataURL('image/png'));
    setShowSignatureModal(false);
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'sig') setUploadedSig(ev.target.result);
        else if (type === 'stamp') setUploadedStamp(ev.target.result);
        else {
          const newElement = { id: Date.now(), type: 'image', fileIndex: activeFileIndex, page: currentPage, x: 50/zoom, y: 100/zoom, width: 150/zoom, height: 150/zoom, imgData: ev.target.result };
          setElements(prev => [...prev, newElement]);
          setMobileView('pdf');
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const startDrawing = (e) => {
    let clientX, clientY;
    if (e.touches) {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      clientX = touch.clientX - rect.left;
      clientY = touch.clientY - rect.top;
    } else {
      clientX = e.nativeEvent.offsetX;
      clientY = e.nativeEvent.offsetY;
    }
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(clientX, clientY); setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    let clientX, clientY;
    if (e.touches) {
      const touch = e.touches[0];
      const rect = canvasRef.current.getBoundingClientRect();
      clientX = touch.clientX - rect.left;
      clientY = touch.clientY - rect.top;
    } else {
      clientX = e.nativeEvent.offsetX;
      clientY = e.nativeEvent.offsetY;
    }
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = showDrawModal ? toolColor : sigColor;
    ctx.lineTo(clientX, clientY); ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    if(!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  const saveDraw = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const newElement = { id: Date.now(), type: 'draw', fileIndex: activeFileIndex, page: currentPage, x: 50/zoom, y: 100/zoom, width: 200/zoom, height: 100/zoom, imgData: dataUrl };
      setElements(prev => [...prev, newElement]);
      setShowDrawModal(false);
    }
  };

  const deleteElement = (e, id) => {
    e.stopPropagation();
    setElements(prev => prev.filter(el => el.id !== id));
    if (activeElementId === id) setActiveElementId(null);
  };

  const textToImageDataUrl = (text, fontStyle, width, height, color, isDigital = false) => {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    if (isDigital) {
      ctx.fillStyle = 'rgba(229, 50, 45, 0.05)'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = '#E5322D'; ctx.lineWidth = 2; ctx.strokeRect(0, 0, width, height);
      ctx.font = `12px monospace`; ctx.fillStyle = '#333333'; ctx.textBaseline = 'top';
      const lines = text.split('\n');
      lines.forEach((line, i) => ctx.fillText(line, 10, 15 + (i * 22)));
      ctx.fillStyle = '#E5322D'; ctx.beginPath(); ctx.arc(width - 30, height / 2, 18, 0, 2 * Math.PI); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = 'bold 18px Arial'; ctx.fillText('✓', width - 38, height / 2 - 8);
    } else {
      ctx.font = `34px ${fontStyle}`; ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(text, 10, height / 2);
    }
    return canvas.toDataURL('image/png');
  };

  const saveAndDownload = async () => {
    if (!activeFile) return;
    setIsProcessing(true);
    let isSuccess = false;
    setActiveElementId(null); // Save hone se pehle selection hata do
    
    try {
      const arrayBuffer = await activeFile.file.arrayBuffer();
      let pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      if (pdfDoc.isEncrypted) {
        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => newDoc.addPage(page));
        pdfDoc = newDoc;
      }

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? rgb(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255) : rgb(0,0,0);
      };

      const currentFileElements = elements.filter(el => el.fileIndex === activeFileIndex);

      for (const el of currentFileElements) {
        if (el.page > pdfDoc.getPageCount()) continue;
        const page = pdfDoc.getPages()[el.page - 1];
        const { height: pdfHeight } = page.getSize();
        
        const actualX = el.x;
        const actualW = el.width;
        const actualH = el.height;
        const actualY = pdfHeight - el.y - actualH;

        if (el.type === 'text') {
          const font = el.isBold ? helveticaBoldFont : helveticaFont;
          page.drawText(el.value, { x: actualX + 5, y: actualY + (actualH/2) - (el.size)/2, size: el.size, font: font, color: hexToRgb(el.color) });
        } 
        else if (el.type === 'replaceText') {
          const bgRgb = hexToRgb(el.bgColor || '#FFFFFF');
          page.drawRectangle({ x: actualX, y: actualY, width: actualW, height: actualH, color: bgRgb, opacity: 1 });
          
          const font = el.isBold ? helveticaBoldFont : helveticaFont;
          page.drawText(el.value, { x: actualX + 4, y: actualY + (actualH/2) - (el.size)/3, size: el.size, font: font, color: hexToRgb(el.color) });
        }
        else if (el.type === 'signature' || el.type === 'initials') {
          const dataUrl = textToImageDataUrl(el.value, el.fontStyle, el.width, el.height, el.color, el.isDigital);
          const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pdfImage, { x: actualX, y: actualY, width: actualW, height: actualH });
        }
        else if (el.type === 'image' || el.type === 'draw' || el.type === 'stamp') {
          const imgBytes = await fetch(el.imgData).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes); 
          page.drawImage(pdfImage, { x: actualX, y: actualY, width: actualW, height: actualH });
        }
        else if (el.type === 'highlight') {
          const highlightRgb = hexToRgb(el.color);
          page.drawRectangle({ x: actualX, y: actualY, width: actualW, height: actualH, color: highlightRgb, opacity: 0.5 });
        }
        else if (el.type === 'redact') {
          page.drawRectangle({ x: actualX, y: actualY, width: actualW, height: actualH, color: rgb(0, 0, 0), opacity: 1 });
        }
        else if (el.type === 'rect') {
          page.drawRectangle({ x: actualX, y: actualY, width: actualW, height: actualH, borderColor: hexToRgb(el.color), borderWidth: 2, opacity: 0 });
        }
        else if (el.type === 'circle') {
          page.drawEllipse({ x: actualX + actualW/2, y: actualY + actualH/2, xScale: actualW/2, yScale: actualH/2, borderColor: hexToRgb(el.color), borderWidth: 2, opacity: 0 });
        }
      }

      pdfDoc.setAuthor(user?.fullName || 'MasterPdf User');
      pdfDoc.setCreator('MasterPdf Editor');
      pdfDoc.setModificationDate(new Date());

      if (lockDocument) {
        pdfDoc.encrypt({
          userPassword: '', 
          ownerPassword: Math.random().toString(36).substring(2, 15), 
          permissions: { modifying: false, copying: false, annotating: false, fillingInteractiveForms: false }
        });
      }

      const finalPdfBytes = await pdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Edited_${activeFile.name}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      isSuccess = true;
      setStep(4);
    } catch (error) {
      console.error("Error editing PDF:", error);
      if (!isSuccess) alert("Failed to edit document. The file might have permanent modification locks.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7] overflow-hidden">
      <Head><title>Pro Edit PDF | MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col pt-[72px] h-[calc(100vh-72px)] w-full relative">
        
        {step === 1 && (
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white lg:rounded-2xl shadow-sm lg:border border-gray-200 p-8 lg:p-16 text-center animate-in fade-in">
              <div className="inline-flex items-center gap-2 bg-red-100 text-[#E5322D] px-3 py-1 rounded-full text-xs font-bold mb-4">
                <Edit3 size={14} /> Full Annotation Editor
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Edit PDF Document</h1>
              <p className="text-base lg:text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                Add text, replace existing text seamlessly, add images, highlights, redactions, shapes, and freehand annotations directly in your browser.
              </p>
              
              <div className="flex justify-center">
                <input type="file" id="file-upload" accept=".pdf" multiple onChange={handleFileChange} className="hidden" />
                <button onClick={() => document.getElementById('file-upload').click()} className="bg-[#E5322D] hover:bg-red-700 text-white text-lg font-bold py-5 px-10 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-3 w-full sm:w-auto">
                  <UploadCloud size={24} /> Select PDF file
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && activeFile && (
          <div className="w-full h-full flex flex-col bg-white shadow-lg overflow-hidden animate-in fade-in">
            
            {/* Top Toolbar */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-2 sm:px-4 shrink-0 w-full z-20 shadow-sm overflow-x-auto custom-scrollbar">
               <div className="flex items-center gap-1 sm:gap-2 min-w-max">
                 <button onClick={(e) => { e.stopPropagation(); addElement('text'); }} className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Add Text"><Type size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Text</span></button>
                 <button onClick={(e) => { e.stopPropagation(); addElement('replaceText'); }} className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Magic Replace Text"><Edit3 size={18} className="text-blue-500"/> <span className="text-xs font-bold hidden sm:block">Edit Text</span></button>
                 
                 <div className="w-px h-6 bg-gray-300 mx-1"></div>
                 
                 <div className="relative">
                   <input type="file" id="img-upload-tool" accept="image/*" onChange={(e) => handleImageUpload(e, 'general')} className="hidden" />
                   <button onClick={(e) => { e.stopPropagation(); document.getElementById('img-upload-tool').click(); }} className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition cursor-pointer" title="Add Image"><ImageIcon size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Image</span></button>
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); setShowDrawModal(true); }} className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Draw"><PenTool size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Draw</span></button>
                 
                 <div className="w-px h-6 bg-gray-300 mx-1"></div>
                 
                 <button onClick={(e) => { e.stopPropagation(); addElement('highlight'); }} className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Highlight Box"><Highlighter size={18} style={{color: highlightColor}}/> <span className="text-xs font-bold hidden xl:block">Highlight</span></button>
                 <button onClick={(e) => { e.stopPropagation(); addElement('redact'); }} className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Redact (Blackout)"><Square size={18} className="text-black fill-black"/> <span className="text-xs font-bold hidden xl:block">Redact</span></button>
                 
                 <div className="w-px h-6 bg-gray-300 mx-1"></div>
                 
                 <button onClick={(e) => { e.stopPropagation(); addElement('rect'); }} className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Rectangle"><Square size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden xl:block">Shape</span></button>
                 <button onClick={(e) => { e.stopPropagation(); addElement('circle'); }} className="flex items-center gap-1 sm:gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Circle"><Circle size={18} className="text-[#E5322D]"/></button>
               </div>

               <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-2 sm:ml-4">
                 <div className="hidden lg:flex items-center gap-1 bg-gray-100 rounded p-1">
                   <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(0.5, z - 0.2)); }} className="p-1 hover:bg-white rounded text-gray-600"><ZoomOut size={14}/></button>
                   <span className="text-[10px] font-bold text-gray-700 w-8 text-center">{Math.round(zoom * 100)}%</span>
                   <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(3, z + 0.2)); }} className="p-1 hover:bg-white rounded text-gray-600"><ZoomIn size={14}/></button>
                 </div>
                 <button onClick={(e) => { e.stopPropagation(); saveAndDownload(); }} disabled={isProcessing} className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-1.5 px-3 sm:px-4 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-2 text-xs sm:text-sm">
                   {isProcessing ? <Settings className="animate-spin" size={14}/> : <Save size={14}/>} <span className="hidden sm:block">Export</span>
                 </button>
                 <button onClick={removeFile} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
               </div>
            </div>

            <div className="flex-grow flex flex-row overflow-hidden relative bg-[#E4E4E4]">
              
              {/* Left Mini Pages */}
              <div className={`w-32 sm:w-40 lg:w-48 bg-gray-100 border-r border-gray-300 p-4 flex flex-col items-center gap-4 overflow-y-auto shrink-0 z-10 custom-scrollbar shadow-[2px_0_5px_rgba(0,0,0,0.05)] ${mobileView === 'pages' ? 'flex absolute inset-0 w-full z-40' : 'hidden lg:flex'}`}>
                 {mobileView === 'pages' && (
                   <div className="w-full flex justify-between items-center mb-4 lg:hidden">
                     <h3 className="font-bold text-gray-800">Pages</h3>
                     <button onClick={() => setMobileView('pdf')} className="p-2 text-gray-500"><X size={20}/></button>
                   </div>
                 )}
                 <Document file={activeFile.url} onLoadSuccess={onDocumentLoadSuccess}>
                   {Array.from({ length: numPages || 0 }, (_, i) => (
                     <div key={i} onClick={(e) => { e.stopPropagation(); setCurrentPage(i + 1); if(mobileView === 'pages') setMobileView('pdf'); }} className="flex flex-col items-center mb-4 cursor-pointer group">
                       <div className={`border-2 p-1 bg-white shadow-sm transition-all ${currentPage === i + 1 ? 'border-[#E5322D] scale-105 shadow-md' : 'border-transparent group-hover:border-gray-300'}`}>
                         <Page pageNumber={i + 1} width={80} renderTextLayer={false} renderAnnotationLayer={false} />
                       </div>
                       <span className={`text-xs font-bold mt-2 ${currentPage === i + 1 ? 'text-[#E5322D]' : 'text-gray-500'}`}>{i + 1}</span>
                     </div>
                   ))}
                 </Document>
              </div>

              {/* Center Document Area */}
              {/* 🔥 FIX 4: Document Wrapper par onMouseDown se deselection hoga */}
              <div className={`flex-grow flex flex-col relative min-w-0 ${mobileView === 'pdf' ? 'flex' : 'hidden lg:flex'}`}>
                 
                 {/* Page Controls Overlay */}
                 <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/80 backdrop-blur-sm text-white px-3 sm:px-4 py-2 rounded-full flex items-center gap-3 sm:gap-4 z-30 shadow-lg">
                   <button onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(1, p - 1)); }} className="hover:text-[#E5322D]"><ChevronLeft size={16} sm={20}/></button>
                   <span className="text-[10px] sm:text-xs font-bold w-12 sm:w-16 text-center">Pg {currentPage}/{numPages}</span>
                   <button onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(numPages || 1, p + 1)); }} className="hover:text-[#E5322D]"><ChevronRight size={16} sm={20}/></button>
                 </div>

                 <div className="flex-grow overflow-y-auto p-2 sm:p-4 lg:p-8 flex flex-col items-center custom-scrollbar pb-24 lg:pb-8" onMouseDown={() => setActiveElementId(null)}>
                   <div className="relative shadow-2xl bg-white select-none max-w-full overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
                     <Document file={activeFile.url} loading={<div className="p-10 text-gray-500 font-medium text-sm">Loading Document...</div>}>
                       <Page 
                         pageNumber={currentPage} 
                         scale={zoom} 
                         renderTextLayer={false} 
                         renderAnnotationLayer={false} 
                         onLoadSuccess={(pageInfo) => {
                            setPdfDimensions(prev => {
                              if(prev.width !== pageInfo.width || prev.height !== pageInfo.height) {
                                return { width: pageInfo.width, height: pageInfo.height };
                              }
                              return prev;
                            });
                         }} 
                       />
                     </Document>

                     {/* RND Elements Mapping (Zoom Independent UI & Realtime Sync) */}
                     {elements.filter(el => el.page === currentPage && el.fileIndex === activeFileIndex).map((el) => (
                       <Rnd
                         key={el.id} 
                         bounds="parent" 
                         position={{ x: el.x * zoom, y: el.y * zoom }} 
                         size={{ width: el.width * zoom, height: el.height * zoom }}
                         onDragStop={(e, d) => updateElement(el.id, { x: d.x / zoom, y: d.y / zoom })}
                         onResizeStop={(e, dir, ref, delta, position) => { updateElement(el.id, { width: ref.offsetWidth / zoom, height: ref.offsetHeight / zoom, x: position.x / zoom, y: position.y / zoom }); }}
                         onMouseDown={(e) => handleSelectElement(e, el)} // 🔥 FIX 3: Click to auto-sync properties!
                         className={`group absolute z-20 touch-none ${
                           el.type === 'highlight' ? 'bg-opacity-50' :
                           el.type === 'redact' ? 'bg-black' :
                           el.type === 'replaceText' ? 'shadow-sm' :
                           el.type === 'rect' ? 'border-2' :
                           el.type === 'circle' ? 'border-2 rounded-full' :
                           'hover:border-gray-400 focus-within:border-[#E5322D]'
                         } ${activeElementId === el.id ? 'ring-2 ring-blue-500 border border-dashed border-gray-500' : (el.type === 'replaceText' ? '' : 'border-2 border-transparent')}`}
                         style={{ 
                           borderColor: (el.type === 'rect' || el.type === 'circle') ? el.color : undefined,
                           backgroundColor: el.type === 'highlight' ? el.color : (el.type === 'replaceText' ? el.bgColor : undefined) // 🔥 REAL-TIME BACKGROUND
                         }}
                       >
                         <button onClick={(e) => deleteElement(e, el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 text-gray-500 rounded-full p-1 text-xs hover:text-[#E5322D] opacity-0 group-hover:opacity-100 shadow-sm z-30"><X size={12} /></button>
                         
                         {el.type === 'image' || el.type === 'draw' || el.type === 'signature' || el.type === 'stamp' || el.type === 'initials' ? (
                           <img src={el.imgData} alt="Element" className="w-full h-full object-fill pointer-events-none" />
                         ) : el.type === 'text' || el.type === 'replaceText' || el.type === 'name' || el.type === 'date' ? (
                           <textarea 
                             value={el.value} 
                             onChange={(e) => updateElement(el.id, { value: e.target.value })}
                             className="w-full h-full bg-transparent outline-none resize-none overflow-hidden"
                             style={{ 
                               fontSize: `${el.size * zoom}px`, // 🔥 REAL-TIME SIZE
                               color: el.color,                 // 🔥 REAL-TIME TEXT COLOR
                               fontWeight: el.isBold ? 'bold' : 'normal', // 🔥 REAL-TIME BOLD
                               lineHeight: '1.2'
                             }}
                           />
                         ) : null}
                       </Rnd>
                     ))}
                   </div>
                 </div>
              </div>

              {/* Right Sidebar: Tools Properties */}
              <div className={`w-full lg:w-[280px] bg-white flex flex-col h-full shrink-0 shadow-[-5px_0_15px_rgba(0,0,0,0.05)] z-20 ${mobileView === 'tools' ? 'absolute inset-0' : 'hidden lg:flex'}`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800">Properties</h3>
                  <button onClick={() => { if(mobileView === 'tools') setMobileView('pdf'); else removeFile(); }} className="text-gray-400 hover:text-[#E5322D]"><X size={18}/></button>
                </div>

                <div className="p-4 overflow-y-auto flex-grow custom-scrollbar">
                  
                  {files.length > 1 && (
                    <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-2">Switch File</h4>
                      <select 
                        value={activeFileIndex} 
                        onChange={(e) => { setActiveFileIndex(Number(e.target.value)); setCurrentPage(1); }}
                        className="w-full border border-gray-300 rounded p-2 text-xs sm:text-sm font-bold text-gray-800 outline-none"
                      >
                        {files.map((f, i) => <option key={i} value={i}>{f.name}</option>)}
                      </select>
                    </div>
                  )}

                  {/* Text Formatting */}
                  <div className="mb-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-3">Text Formatting</h4>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs sm:text-sm font-bold text-gray-700">Bold Text</span>
                      <button 
                        onClick={() => handlePropChange('isBold', !isBold)} 
                        className={`p-2 rounded transition-colors ${isBold ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                      >
                        <Bold size={16} />
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs sm:text-sm font-bold text-gray-700"><Type size={14} className="inline mr-1 text-[#E5322D]"/> Size</span>
                        <span className="text-[10px] sm:text-xs font-bold text-gray-500">{textSize}px</span>
                      </div>
                      {/* 🔥 Slider calling handlePropChange */}
                      <input type="range" min="10" max="72" value={textSize} onChange={(e) => handlePropChange('size', Number(e.target.value))} className="w-full accent-[#E5322D]" />
                    </div>
                  </div>

                  {/* Text Color */}
                  <div className="mb-6">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Palette size={14} className="text-[#E5322D]"/> Text / Shape Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {TEXT_COLORS.map(c => (
                        <button key={c} onClick={() => handlePropChange('color', c)} style={{backgroundColor: c}} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full transition-transform border border-gray-200 ${toolColor === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400 shadow-md' : 'hover:scale-105 shadow-sm'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Magic Box Background Color */}
                  <div className="mb-6">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Square size={14} className="text-[#E5322D]"/> Box Background Color</h4>
                    <div className="flex items-center gap-2">
                      <input type="color" value={boxBgColor} onChange={(e) => handlePropChange('bgColor', e.target.value)} className="w-10 h-10 p-0 border border-gray-300 rounded cursor-pointer" />
                      <span className="text-xs font-medium text-gray-500">Pick matching paper color</span>
                    </div>
                  </div>

                  {/* Highlight Color */}
                  <div className="mb-6">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Highlighter size={14} className="text-[#E5322D]"/> Highlight Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {HIGHLIGHT_COLORS.map(c => (
                        <button key={c.name} onClick={() => handlePropChange('highlightColor', c.hex)} style={{backgroundColor: c.hex}} title={c.name} className={`w-6 h-6 sm:w-8 sm:h-8 rounded-sm transition-transform border border-gray-200 ${highlightColor === c.hex ? 'scale-110 ring-2 ring-offset-2 ring-gray-400 shadow-md' : 'hover:scale-105 shadow-sm'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Sign & Stamp Integration */}
                  <div className="mb-6 border-t border-gray-200 pt-6">
                    <h4 className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase mb-3">Signatures & Fields</h4>
                    <button onClick={() => addElement('signature')} className="w-full bg-white border border-gray-300 text-gray-800 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-50 mb-2 flex items-center justify-center gap-2 transition"><PenTool size={14} sm={16}/> Add Signature</button>
                    <button onClick={() => addElement('stamp')} className="w-full bg-white border border-gray-300 text-gray-800 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-50 flex items-center justify-center gap-2 transition"><Stamp size={14} sm={16}/> Add Stamp</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden flex border-t border-gray-200 bg-white h-14 shrink-0 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-30" >
               <button onClick={() => setMobileView('pages')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'pages' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <FileText size={16} /> Pages
               </button>
               <button onClick={() => setMobileView('pdf')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'pdf' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <Monitor size={16} /> Editor
               </button>
               <button onClick={() => setMobileView('tools')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'tools' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <Settings size={16} /> Tools
               </button>
               <button onClick={saveAndDownload} className="flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] text-white bg-[#E5322D]">
                 <Save size={16} /> Export
               </button>
            </div>
          </div>
        )}

        {/* STEP 4: DOWNLOAD SCREEN */}
        {step === 4 && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center animate-in fade-in text-center mt-10 p-4">
            <div className="bg-green-100 p-4 rounded-full mb-6"><Download size={40} className="text-green-600" /></div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">Your PDF is Ready!</h1>
            <p className="text-sm sm:text-base text-gray-600 mb-8 max-w-md">Your edits, annotations, and redactions have been permanently embedded into the document.</p>
            <button onClick={() => setStep(1)} className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition shadow-sm text-sm sm:text-base">
              Edit Another File
            </button>
          </div>
        )}

      </main>

      {/* DRAW MODAL */}
      {showDrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base">Freehand Draw</h3>
              <button onClick={() => setShowDrawModal(false)} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <canvas 
                ref={canvasRef}
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing}
                className="w-full h-40 sm:h-48 bg-white border border-gray-300 rounded-lg cursor-crosshair shadow-inner touch-none"
                width={400} height={200}
              />
              <div className="flex justify-between w-full mt-3">
                <button onClick={clearCanvas} className="text-xs sm:text-sm font-bold text-gray-500 hover:text-[#E5322D]">Clear</button>
                <button onClick={saveDraw} className="bg-[#E5322D] text-white px-4 py-2 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-700">Add to PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIGNATURE MODAL */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[800px] max-h-[95vh] flex flex-col rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 p-3 sm:p-4 shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 tracking-tight">Set your details</h3>
              <button onClick={() => setShowSignatureModal(false)} className="text-gray-400 hover:text-[#E5322D] border border-gray-200 px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-bold bg-white shadow-sm">Cancel</button>
            </div>
            <div className="p-3 sm:p-4 overflow-y-auto flex-grow custom-scrollbar">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-grow">
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2">Full name:</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 sm:p-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-[#E5322D] outline-none font-medium text-gray-800 transition text-sm sm:text-base" />
                </div>
              </div>
              <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar">
                <button onClick={() => setHTab('Signature')} className={`px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap ${hTab === 'Signature' ? 'text-[#E5322D] border-[#E5322D]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}><PenTool size={14}/> Signature</button>
                <button onClick={() => setHTab('Stamp')} className={`px-4 sm:px-6 py-2 sm:py-3 font-bold text-xs sm:text-sm flex items-center gap-2 border-b-2 whitespace-nowrap ${hTab === 'Stamp' ? 'text-[#E5322D] border-[#E5322D]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}><Stamp size={14}/> Company Stamp</button>
              </div>
              <div className="bg-gray-100 rounded-b-xl flex flex-col md:flex-row min-h-[250px] sm:min-h-[300px] border border-gray-200 border-t-0 relative">
                <div className="w-full md:w-16 bg-gray-200 border-r border-gray-300 flex flex-row md:flex-col rounded-bl-none md:rounded-bl-xl overflow-hidden shrink-0">
                  <button onClick={() => setVTab('Type')} className={`py-3 sm:py-4 flex-1 md:flex-none flex justify-center border-b-4 md:border-b-0 md:border-l-4 transition-colors ${vTab === 'Type' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Type size={18}/></button>
                  <button onClick={() => setVTab('Draw')} className={`py-3 sm:py-4 flex-1 md:flex-none flex justify-center border-b-4 md:border-b-0 md:border-l-4 transition-colors ${vTab === 'Draw' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><PenTool size={18}/></button>
                  <button onClick={() => setVTab('Upload')} className={`py-3 sm:py-4 flex-1 md:flex-none flex justify-center border-b-4 md:border-b-0 md:border-l-4 transition-colors ${vTab === 'Upload' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Upload size={18}/></button>
                </div>
                <div className="flex-grow p-2 sm:p-4 relative flex flex-col overflow-hidden">
                  {(hTab === 'Signature') && vTab === 'Type' && (
                    <div className="flex flex-col gap-2 bg-gray-100 h-[200px] sm:h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                      {signatureFonts.map((font, index) => (
                        <label key={index} className={`flex items-center gap-2 sm:gap-4 px-2 sm:px-4 py-2 sm:py-3 rounded-md cursor-pointer transition border-b border-gray-200 ${selectedStyle === index ? 'bg-white shadow-sm border-[#E5322D]' : 'hover:bg-gray-50 border-transparent'}`}>
                          <input type="radio" checked={selectedStyle === index} onChange={() => setSelectedStyle(index)} className="w-4 h-4 sm:w-5 sm:h-5 accent-[#E5322D] shrink-0" />
                          <span className="text-xl sm:text-3xl truncate" style={{ fontFamily: font, color: '#000' }}>{fullName}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {(hTab === 'Signature') && vTab === 'Draw' && (
                    <div className="h-full flex flex-col items-center justify-center w-full gap-2">
                      <canvas 
                        ref={canvasRef} 
                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} 
                        onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} 
                        className="w-full h-[150px] sm:h-[200px] bg-white border border-gray-300 rounded cursor-crosshair shadow-inner touch-none" 
                        width={500} height={200} 
                      />
                      <div className="flex justify-between w-full text-[10px] sm:text-xs text-gray-500 px-2 font-medium"><span>Draw inside the box</span><button onClick={clearCanvas} className="hover:text-[#E5322D] underline">Clear</button></div>
                    </div>
                  )}
                  {vTab === 'Upload' && (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-white rounded-lg m-1 sm:m-2 p-2 sm:p-4">
                      <div className="text-center w-full flex flex-col items-center">
                        {hTab === 'Stamp' && uploadedStamp ? (
                           <><img src={uploadedStamp} alt="Stamp" className="max-h-[100px] sm:max-h-[140px] object-contain mb-2 sm:mb-4" /><button onClick={() => setUploadedStamp(null)} className="text-xs hover:text-[#E5322D]">Remove</button></>
                        ) : hTab === 'Signature' && uploadedSig ? (
                           <><img src={uploadedSig} alt="Sig" className="max-h-[100px] sm:max-h-[140px] object-contain mb-2 sm:mb-4" /><button onClick={() => setUploadedSig(null)} className="text-xs hover:text-[#E5322D]">Remove</button></>
                        ) : (
                           <><input type="file" id="modal-upload" accept="image/*" onChange={(e) => handleImageUpload(e, hTab === 'Stamp' ? 'stamp' : 'sig')} className="hidden" /><label htmlFor="modal-upload" className="border border-[#E5322D] text-[#E5322D] font-bold px-4 sm:px-6 py-2 rounded-lg hover:bg-red-50 cursor-pointer text-xs sm:text-sm">Upload Image</label></>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 sm:mt-6 flex justify-end">
                <button onClick={applyModalSettings} className="bg-[#E5322D] text-white font-bold py-2 sm:py-3 px-6 sm:px-10 rounded-xl text-sm sm:text-base">Apply</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
