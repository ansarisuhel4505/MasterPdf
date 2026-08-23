import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { 
  UploadCloud, X, Edit3, Type, Image as ImageIcon, PenTool, 
  Download, Settings, ChevronUp, ChevronDown, Trash2, 
  Palette, FileText, Monitor, ZoomIn, ZoomOut, Save, Square, Circle, Highlighter
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

const RENDER_SCALE = 1.5; 

export default function EditPdf() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  
  const [files, setFiles] = useState([]);
  const [activeFileIndex, setActiveFileIndex] = useState(0);
  const activeFile = files[activeFileIndex] || null;
  
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1.5); 

  const [mobileView, setMobileView] = useState('pdf'); 

  // Editor States
  const [elements, setElements] = useState([]);
  const [toolColor, setToolColor] = useState('#E5322D');
  const [textSize, setTextSize] = useState(16);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [drawnSignature, setDrawnSignature] = useState(null);

  useEffect(() => { setIsMounted(true); }, []);

  // --- 1. UPLOAD HANDLING ---
  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);
    const validFiles = selectedFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    
    if (validFiles.length > 0) {
      const newFilesData = validFiles.map(f => ({ file: f, name: f.name, url: URL.createObjectURL(f) }));
      setFiles(prev => [...prev, ...newFilesData]);
      if (step === 1) setStep(2); 
    } else {
      alert("Please upload a valid PDF document (.pdf).");
    }
    e.target.value = null; 
  };

  const removeFile = () => {
    setFiles([]); setElements([]); setCurrentPage(1); setStep(1); setActiveFileIndex(0);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages); setCurrentPage(1);
  };

  // --- 2. ADDING ELEMENTS (Text, Image, Highlight, Redact, Shapes) ---
  const addElement = (type) => {
    const newElement = {
      id: Date.now(), type, page: currentPage, 
      x: 50, y: 100, 
      width: type === 'text' ? 200 : 150, 
      height: type === 'text' ? 40 : 100, 
      value: type === 'text' ? 'Type text here...' : '', 
      color: toolColor, size: textSize
    };
    
    // Default colors for specific tools
    if (type === 'highlight') newElement.color = '#FDE047'; // Yellow
    if (type === 'redact') newElement.color = '#000000'; // Black
    
    setElements([...elements, newElement]);
    setMobileView('pdf');
  };

  const handleImageUpload = (e) => {
    const imgFile = e.target.files[0];
    if (imgFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newElement = { id: Date.now(), type: 'image', page: currentPage, x: 50, y: 100, width: 150, height: 150, imgData: ev.target.result };
        setElements([...elements, newElement]);
        setMobileView('pdf');
      };
      reader.readAsDataURL(imgFile);
    }
  };

  // Freehand Drawing Logic
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath(); ctx.moveTo(offsetX, offsetY); setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY); ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };
  const saveDraw = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const newElement = { id: Date.now(), type: 'draw', page: currentPage, x: 50, y: 100, width: 200, height: 100, imgData: dataUrl };
      setElements([...elements, newElement]);
      setShowDrawModal(false);
    }
  };

  const updateElement = (id, newProps) => setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  const deleteElement = (id) => setElements(elements.filter(el => el.id !== id));

  // --- 3. EXPORT TO PDF (Applying all elements via pdf-lib) ---
  const saveAndDownload = async () => {
    if (!activeFile) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await activeFile.file.arrayBuffer();
      let pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      if (pdfDoc.isEncrypted) {
        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => newDoc.addPage(page));
        pdfDoc = newDoc;
      }

      const hexToRgb = (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? rgb(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255) : rgb(0,0,0);
      };

      for (const el of elements) {
        if (el.page > pdfDoc.getPageCount()) continue;
        const page = pdfDoc.getPages()[el.page - 1];
        const { height: pdfHeight } = page.getSize();
        
        // Accurate Coordinate mapping
        const scaleX = page.getSize().width / (pdfDimensions.width / zoom);
        const scaleY = pdfHeight / (pdfDimensions.height / zoom);
        
        const actualX = el.x * scaleX;
        const actualW = el.width * scaleX;
        const actualH = el.height * scaleY;
        const actualY = pdfHeight - (el.y * scaleY) - actualH; // PDF Y axis is bottom-to-top

        if (el.type === 'text') {
          page.drawText(el.value, { x: actualX + 5, y: actualY + (actualH/2) - (el.size * scaleX)/2, size: el.size * scaleX, color: hexToRgb(el.color) });
        } 
        else if (el.type === 'image' || el.type === 'draw') {
          const imgBytes = await fetch(el.imgData).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pdfImage, { x: actualX, y: actualY, width: actualW, height: actualH });
        }
        else if (el.type === 'highlight') {
          page.drawRectangle({ x: actualX, y: actualY, width: actualW, height: actualH, color: rgb(1, 0.9, 0.2), opacity: 0.5 });
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

      const finalPdfBytes = await pdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Edited_${activeFile.name}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStep(4);
    } catch (error) {
      console.error("Error editing PDF:", error);
      alert("Failed to edit document. Ensure it's not permanently locked.");
    }
    setIsProcessing(false);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7] overflow-hidden">
      <Head><title>Pro Edit PDF | MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col pt-[72px] h-[calc(100vh-72px)] w-full relative">
        
        {/* STEP 1: UPLOAD */}
        {step === 1 && (
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white lg:rounded-2xl shadow-sm lg:border border-gray-200 p-8 lg:p-16 text-center animate-in fade-in">
              <div className="inline-flex items-center gap-2 bg-red-100 text-[#E5322D] px-3 py-1 rounded-full text-xs font-bold mb-4">
                <Edit3 size={14} /> Full Annotation Editor
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Edit PDF Document</h1>
              <p className="text-base lg:text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                Add text, images, highlights, redactions, shapes, and freehand annotations.
              </p>
              
              <div className="flex justify-center">
                <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-lg font-bold py-5 px-10 rounded-xl shadow-lg transition-colors flex items-center gap-3">
                  <UploadCloud size={24} /> Select PDF file
                </label>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: EDITOR */}
        {step === 2 && activeFile && (
          <div className="w-full h-full flex flex-col bg-white shadow-lg overflow-hidden animate-in fade-in">
            
            {/* Top Toolbar */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 w-full z-20 shadow-sm overflow-x-auto custom-scrollbar">
               <div className="flex items-center gap-2 min-w-max">
                 <button onClick={() => addElement('text')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Add Text"><Type size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Text</span></button>
                 <div className="relative">
                   <input type="file" id="img-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                   <label htmlFor="img-upload" className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition cursor-pointer" title="Add Image"><ImageIcon size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Image</span></label>
                 </div>
                 <button onClick={() => setShowDrawModal(true)} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Draw"><PenTool size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden sm:block">Draw</span></button>
                 <div className="w-px h-6 bg-gray-300 mx-1"></div>
                 <button onClick={() => addElement('highlight')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Highlight Box"><Highlighter size={18} className="text-yellow-500"/> <span className="text-xs font-bold hidden xl:block">Highlight</span></button>
                 <button onClick={() => addElement('redact')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Redact (Blackout)"><Square size={18} className="text-black fill-black"/> <span className="text-xs font-bold hidden xl:block">Redact</span></button>
                 <div className="w-px h-6 bg-gray-300 mx-1"></div>
                 <button onClick={() => addElement('rect')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Rectangle"><Square size={18} className="text-[#E5322D]"/> <span className="text-xs font-bold hidden xl:block">Shape</span></button>
                 <button onClick={() => addElement('circle')} className="flex items-center gap-1.5 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition" title="Circle"><Circle size={18} className="text-[#E5322D]"/></button>
               </div>

               <div className="flex items-center gap-3 shrink-0 ml-4">
                 <div className="hidden md:flex items-center gap-1 bg-gray-100 rounded p-1">
                   <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-1 hover:bg-white rounded text-gray-600"><ZoomOut size={14}/></button>
                   <span className="text-[10px] font-bold text-gray-700 w-8 text-center">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 hover:bg-white rounded text-gray-600"><ZoomIn size={14}/></button>
                 </div>
                 <button onClick={saveAndDownload} disabled={isProcessing} className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-1.5 px-4 rounded-lg shadow transition disabled:opacity-50 flex items-center gap-2 text-sm">
                   {isProcessing ? <Settings className="animate-spin" size={14}/> : <Save size={14}/>} <span className="hidden sm:block">Export</span>
                 </button>
                 <button onClick={removeFile} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
               </div>
            </div>

            <div className="flex-grow flex flex-row overflow-hidden bg-[#E4E4E4] relative">
              
              {/* Left Mini Pages */}
              <div className={`w-40 lg:w-48 bg-gray-100 border-r border-gray-300 p-4 flex flex-col items-center gap-4 overflow-y-auto shrink-0 z-10 custom-scrollbar shadow-[2px_0_5px_rgba(0,0,0,0.05)] ${mobileView === 'pages' ? 'flex absolute inset-0 w-full z-40' : 'hidden lg:flex'}`}>
                 {mobileView === 'pages' && (
                   <div className="w-full flex justify-between items-center mb-4 lg:hidden">
                     <h3 className="font-bold text-gray-800">Pages</h3>
                     <button onClick={() => setMobileView('pdf')} className="p-2 text-gray-500"><X size={20}/></button>
                   </div>
                 )}
                 <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                   {Array.from({ length: numPages || 0 }, (_, i) => (
                     <div key={i} onClick={() => { setCurrentPage(i + 1); if(mobileView === 'pages') setMobileView('pdf'); }} className="flex flex-col items-center mb-4 cursor-pointer group">
                       <div className={`border-2 p-1 bg-white shadow-sm transition-all ${currentPage === i + 1 ? 'border-[#E5322D] scale-105 shadow-md' : 'border-transparent group-hover:border-gray-300'}`}>
                         <Page pageNumber={i + 1} width={100} renderTextLayer={false} renderAnnotationLayer={false} />
                       </div>
                       <span className={`text-xs font-bold mt-2 ${currentPage === i + 1 ? 'text-[#E5322D]' : 'text-gray-500'}`}>{i + 1}</span>
                     </div>
                   ))}
                 </Document>
              </div>

              {/* Center Document Area */}
              <div className={`flex-grow flex flex-col relative min-w-0 ${mobileView === 'pdf' ? 'flex' : 'hidden lg:flex'}`}>
                 <div className="flex-grow overflow-y-auto p-4 lg:p-8 flex flex-col items-center custom-scrollbar pb-24 lg:pb-8">
                   <div className="relative shadow-2xl bg-white select-none">
                     <Document file={fileUrl} loading={<div className="p-10 text-gray-500 font-medium">Loading Document...</div>}>
                       <Page 
                         pageNumber={currentPage} 
                         scale={zoom} 
                         renderTextLayer={false} 
                         renderAnnotationLayer={false} 
                         onLoadSuccess={(pageInfo) => {
                            if (pdfDimensions.width !== pageInfo.width || pdfDimensions.height !== pageInfo.height) {
                               setPdfDimensions({ width: pageInfo.width, height: pageInfo.height });
                            }
                         }} 
                       />
                     </Document>

                     {/* RND Elements Mapping */}
                     {elements.filter(el => el.page === currentPage).map((el) => (
                       <Rnd
                         key={el.id} bounds="parent" position={{ x: el.x, y: el.y }} size={{ width: el.width, height: el.height }}
                         onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                         onResizeStop={(e, dir, ref, delta, position) => { updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...position }); }}
                         className={`group absolute z-20 touch-none ${
                           el.type === 'highlight' ? 'bg-yellow-300/50' :
                           el.type === 'redact' ? 'bg-black' :
                           el.type === 'rect' ? 'border-2' :
                           el.type === 'circle' ? 'border-2 rounded-full' :
                           'border-2 border-transparent hover:border-gray-400 focus-within:border-[#E5322D] border-dashed bg-white/10'
                         }`}
                         style={{ 
                           borderColor: (el.type === 'rect' || el.type === 'circle') ? el.color : undefined 
                         }}
                       >
                         <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-[#E5322D] opacity-0 group-hover:opacity-100 transition-opacity z-30 shadow-sm"><X size={12} /></button>
                         
                         {el.type === 'image' || el.type === 'draw' ? (
                           <img src={el.imgData} alt="Element" className="w-full h-full object-contain pointer-events-none" />
                         ) : el.type === 'text' ? (
                           <textarea 
                             value={el.value} 
                             onChange={(e) => updateElement(el.id, { value: e.target.value })}
                             className="w-full h-full bg-transparent outline-none font-bold resize-none"
                             style={{ fontSize: `${el.size * (zoom/1.5)}px`, color: el.color }}
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
                  <h3 className="text-lg font-bold text-gray-800">Properties</h3>
                  <button onClick={() => { if(mobileView === 'tools') setMobileView('pdf'); else removeFile(); }} className="text-gray-400 hover:text-[#E5322D]"><X size={18}/></button>
                </div>

                <div className="p-4 overflow-y-auto flex-grow custom-scrollbar">
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Palette size={16} className="text-[#E5322D]"/> Tool Color</h4>
                    <div className="flex flex-wrap gap-2">
                      {['#E5322D', '#000000', '#1F2937', '#1E3A8A', '#065F46', '#D97706'].map(c => (
                        <button key={c} onClick={() => setToolColor(c)} style={{backgroundColor: c}} className={`w-8 h-8 rounded-full transition-transform ${toolColor === c ? 'scale-110 ring-2 ring-offset-2 ring-gray-400 shadow-md' : 'hover:scale-105 shadow-sm'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">Applies to Text, Shapes, and Drawing.</p>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><Type size={16} className="text-[#E5322D]"/> Text Size</h4>
                    <input type="range" min="10" max="72" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full accent-[#E5322D]" />
                    <div className="text-right text-xs font-bold text-gray-500 mt-1">{textSize}px</div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl mb-4">
                    <h4 className="text-xs font-bold text-gray-800 mb-1 flex items-center gap-1"><Monitor size={14}/> Pro Tip</h4>
                    <p className="text-[10px] text-gray-600">Select tools from the top bar to add content. Drag corners to resize highlights, redactions, and shapes.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="lg:hidden flex border-t border-gray-200 bg-white h-14 shrink-0 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-30">
               <button onClick={() => setMobileView('pages')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'pages' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <FileText size={18} /> Pages
               </button>
               <button onClick={() => setMobileView('pdf')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'pdf' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <Monitor size={18} /> Editor
               </button>
               <button onClick={() => setMobileView('tools')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'tools' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <Settings size={18} /> Tools
               </button>
            </div>
          </div>
        )}

        {/* STEP 4: DOWNLOAD SCREEN */}
        {step === 4 && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center animate-in fade-in text-center mt-10">
            <div className="bg-green-100 p-4 rounded-full mb-6"><Download size={40} className="text-green-600" /></div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Your PDF is Ready!</h1>
            <p className="text-gray-600 mb-8 max-w-md">Your edits, annotations, and redactions have been permanently embedded into the document.</p>
            <button onClick={() => setStep(1)} className="bg-gray-800 hover:bg-black text-white font-bold py-3 px-8 rounded-xl transition shadow-sm">
              Edit Another File
            </button>
          </div>
        )}

      </main>

      {/* DRAW MODAL */}
      {showDrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-bold text-gray-800">Freehand Draw</h3>
              <button onClick={() => setShowDrawModal(false)} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <canvas 
                ref={canvasRef}
                onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                onTouchStart={(e) => { e.preventDefault(); const touch = e.touches[0]; const rect = canvasRef.current.getBoundingClientRect(); startDrawing({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top } }); }}
                onTouchMove={(e) => { e.preventDefault(); const touch = e.touches[0]; const rect = canvasRef.current.getBoundingClientRect(); draw({ nativeEvent: { offsetX: touch.clientX - rect.left, offsetY: touch.clientY - rect.top } }); }}
                onTouchEnd={stopDrawing}
                className="w-full h-48 bg-white border border-gray-300 rounded-lg cursor-crosshair shadow-inner touch-none"
                width={400} height={200}
              />
              <div className="flex justify-between w-full mt-3">
                <button onClick={clearCanvas} className="text-sm font-bold text-gray-500 hover:text-[#E5322D]">Clear</button>
                <button onClick={saveDraw} className="bg-[#E5322D] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700">Add to PDF</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
