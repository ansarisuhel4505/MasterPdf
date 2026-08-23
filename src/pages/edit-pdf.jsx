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
  Download, Settings, ChevronUp, ChevronDown, Trash2, 
  Palette, FileText, Monitor, ZoomIn, ZoomOut, Save
} from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function EditPdf() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isMounted, setIsMounted] = useState(false);
  
  // File States
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1.5); // Default HD zoom

  // Mobile View State ('pdf', 'pages', 'tools')
  const [mobileView, setMobileView] = useState('pdf');

  // Editor States (Text, Image, Draw)
  const [elements, setElements] = useState([]);
  const [activeTool, setActiveTool] = useState('text'); // 'text', 'image', 'draw'
  const [textColor, setTextColor] = useState('#E5322D');
  const [textSize, setTextSize] = useState(16);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => { setIsMounted(true); }, []);

  // --- 1. INSTANT LOCAL UPLOAD (No Backend API Wait) ---
  const handleFileChange = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFile = e.target.files[0];
    
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setStep(2); // Go straight to Editor
    } else {
      alert("Please upload a valid PDF document (.pdf).");
    }
    e.target.value = null; 
  };

  const removeFile = () => {
    setFile(null); setFileUrl(null); setElements([]); setCurrentPage(1); setStep(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages); setCurrentPage(1);
  };

  // --- 2. ADDING ELEMENTS (Company Level Editor Tools) ---
  const addTextElement = () => {
    const newElement = {
      id: Date.now(), type: 'text', page: currentPage, x: 50, y: 100, 
      width: 250, height: 50, value: 'Type something...', color: textColor, size: textSize
    };
    setElements([...elements, newElement]);
    setMobileView('pdf');
  };

  const handleImageUpload = (e) => {
    const imgFile = e.target.files[0];
    if (imgFile) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newElement = {
          id: Date.now(), type: 'image', page: currentPage, x: 50, y: 100, 
          width: 150, height: 150, imgData: ev.target.result
        };
        setElements([...elements, newElement]);
        setMobileView('pdf');
      };
      reader.readAsDataURL(imgFile);
    }
  };

  const updateElement = (id, newProps) => setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  const deleteElement = (id) => setElements(elements.filter(el => el.id !== id));

  // --- 3. EXPORT & DOWNLOAD (Using pdf-lib) ---
  const saveAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Ignore encryption to bypass author locks
      let pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      if (pdfDoc.isEncrypted) {
        const newDoc = await PDFDocument.create();
        const copiedPages = await newDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => newDoc.addPage(page));
        pdfDoc = newDoc;
      }

      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const el of elements) {
        const page = pdfDoc.getPages()[el.page - 1];
        const { height: pdfHeight } = page.getSize();
        
        // Exact coordinate mapping based on zoom level
        const scaleX = page.getSize().width / (pdfDimensions.width / zoom);
        const scaleY = pdfHeight / (pdfDimensions.height / zoom);
        
        const actualX = el.x * scaleX;
        const actualY = pdfHeight - (el.y * scaleY) - (el.height * scaleY);
        const actualW = el.width * scaleX;
        const actualH = el.height * scaleY;

        if (el.type === 'image') {
          const imgBytes = await fetch(el.imgData).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pdfImage, { x: actualX, y: actualY, width: actualW, height: actualH });
        } else if (el.type === 'text') {
          // Convert hex color to RGB for pdf-lib
          const hexToRgb = (hex) => {
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? rgb(parseInt(result[1], 16)/255, parseInt(result[2], 16)/255, parseInt(result[3], 16)/255) : rgb(0,0,0);
          };
          page.drawText(el.value, { 
            x: actualX + 5, y: actualY + 15, 
            size: el.size * scaleX, font: helveticaFont, color: hexToRgb(el.color) 
          });
        }
      }

      pdfDoc.setAuthor(user?.fullName || 'MasterPdf User');
      pdfDoc.setCreator('MasterPdf Editor');
      pdfDoc.setModificationDate(new Date());

      const finalPdfBytes = await pdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Edited_${file.name}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setStep(4);
    } catch (error) {
      console.error("Error editing PDF:", error);
      alert("Failed to edit document. The file might be corrupted.");
    }
    setIsProcessing(false);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7] overflow-hidden">
      <Head>
        <title>Edit PDF Online | MasterPdf</title>
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col pt-[72px] h-[calc(100vh-72px)] w-full relative">
        
        {/* STEP 1: UPLOAD SCREEN */}
        {step === 1 && (
          <div className="flex-grow flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white lg:rounded-2xl shadow-sm lg:border border-gray-200 p-8 lg:p-16 text-center animate-in fade-in">
              <div className="inline-flex items-center gap-2 bg-red-100 text-[#E5322D] px-3 py-1 rounded-full text-xs font-bold mb-4">
                <Edit3 size={14} /> Advanced PDF Editor
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-4 tracking-tight">Edit PDF Document</h1>
              <p className="text-base lg:text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
                Add text, images, shapes, and freehand annotations to your PDF document instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-lg lg:text-xl font-bold py-5 px-10 lg:px-14 rounded-xl shadow-lg transition-colors w-full sm:w-auto flex items-center justify-center gap-3">
                  <UploadCloud size={24} /> Select PDF file
                </label>
              </div>
              <p className="text-sm text-gray-400 mt-8 hidden sm:block">or drop PDF here</p>
            </div>
          </div>
        )}

        {/* STEP 2: ENTERPRISE EDITOR WORKSPACE */}
        {step === 2 && file && (
          <div className="w-full h-full flex flex-col bg-white shadow-lg overflow-hidden animate-in fade-in">
            
            {/* Top Toolbar (Editing Tools) */}
            <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 w-full z-20 shadow-sm">
               
               {/* Left: Tools */}
               <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto custom-scrollbar">
                 <button onClick={addTextElement} className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition">
                   <Type size={18} className="text-[#E5322D]"/> <span className="text-sm font-bold hidden sm:block">Add Text</span>
                 </button>
                 <div className="w-px h-6 bg-gray-300 hidden sm:block"></div>
                 <div className="relative">
                   <input type="file" id="img-upload" accept="image/*" onChange={handleImageUpload} className="hidden" />
                   <label htmlFor="img-upload" className="flex items-center gap-2 hover:bg-gray-100 p-2 rounded-lg text-gray-700 transition cursor-pointer">
                     <ImageIcon size={18} className="text-[#E5322D]"/> <span className="text-sm font-bold hidden sm:block">Add Image</span>
                   </label>
                 </div>
               </div>

               {/* Center: File Info */}
               <div className="hidden md:flex flex-col items-center justify-center">
                 <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{file.name}</span>
                 <span className="text-[10px] text-gray-500 font-medium">Page {currentPage} of {numPages}</span>
               </div>

               {/* Right: Actions */}
               <div className="flex items-center gap-2 shrink-0">
                 <div className="hidden sm:flex items-center gap-2 bg-gray-100 rounded-lg p-1 mr-2">
                   <button onClick={() => setZoom(z => Math.max(0.5, z - 0.2))} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm"><ZoomOut size={16}/></button>
                   <span className="text-xs font-bold text-gray-700 w-10 text-center">{Math.round(zoom * 100)}%</span>
                   <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="p-1 hover:bg-white rounded text-gray-600 shadow-sm"><ZoomIn size={16}/></button>
                 </div>
                 <button onClick={saveAndDownload} disabled={isProcessing} className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition disabled:opacity-50 flex items-center gap-2">
                   {isProcessing ? <Settings className="animate-spin" size={16}/> : <Save size={16}/>}
                   <span className="hidden sm:block">Save PDF</span>
                 </button>
                 <button onClick={removeFile} className="lg:hidden text-gray-400 hover:text-[#E5322D] p-2"><X size={20}/></button>
               </div>
            </div>

            {/* Main Editor Area (Flex Row) */}
            <div className="flex-grow flex flex-row overflow-hidden bg-[#E4E4E4] relative">
              
              {/* LEFT SIDEBAR: Mini Pages (Thumbnails) */}
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

              {/* CENTER: Document Viewer Workspace */}
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

                     {/* Movable Elements Overlay */}
                     {elements.filter(el => el.page === currentPage).map((el) => (
                       <Rnd
                         key={el.id} bounds="parent" position={{ x: el.x, y: el.y }} size={{ width: el.width, height: el.height }}
                         onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                         onResizeStop={(e, dir, ref, delta, position) => { updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...position }); }}
                         className="group absolute border-2 border-transparent hover:border-gray-400 focus-within:border-[#E5322D] border-dashed flex items-center justify-center bg-white/30 hover:bg-white/50 transition-colors touch-none"
                       >
                         <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-[#E5322D] opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X size={14} /></button>
                         
                         {el.type === 'image' ? (
                           <img src={el.imgData} alt="Element" className="w-full h-full object-contain pointer-events-none" />
                         ) : el.type === 'text' ? (
                           <textarea 
                             value={el.value} 
                             onChange={(e) => updateElement(el.id, { value: e.target.value })}
                             className="w-full h-full bg-transparent outline-none font-bold resize-none"
                             style={{ fontSize: `${el.size * zoom}px`, color: el.color }}
                           />
                         ) : null}
                       </Rnd>
                     ))}
                   </div>
                 </div>
              </div>

              {/* RIGHT SIDEBAR: Formatting Properties */}
              <div className={`w-full lg:w-[300px] bg-white flex flex-col h-full shrink-0 shadow-[-5px_0_15px_rgba(0,0,0,0.05)] z-20 ${mobileView === 'tools' ? 'absolute inset-0' : 'hidden lg:flex'}`}>
                <div className="flex justify-between items-center p-4 lg:p-5 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-xl font-bold text-gray-800">Formatting</h3>
                  <button onClick={() => { if(mobileView === 'tools') setMobileView('pdf'); else removeFile(); }} className="text-gray-400 hover:text-[#E5322D]"><X size={20}/></button>
                </div>

                <div className="p-4 lg:p-5 overflow-y-auto flex-grow custom-scrollbar">
                  
                  {/* Text Color Picker */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Palette size={16} className="text-[#E5322D]"/> Text Color</h4>
                    <div className="flex flex-wrap gap-3">
                      {['#E5322D', '#000000', '#1F2937', '#1E3A8A', '#065F46', '#D97706'].map(c => (
                        <button key={c} onClick={() => setTextColor(c)} style={{backgroundColor: c}} className={`w-8 h-8 rounded-full transition-transform ${textColor === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-300 shadow-md' : 'hover:scale-110 shadow-sm'}`} />
                      ))}
                    </div>
                  </div>

                  {/* Text Size */}
                  <div className="mb-8">
                    <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2"><Type size={16} className="text-[#E5322D]"/> Font Size</h4>
                    <input type="range" min="10" max="72" value={textSize} onChange={(e) => setTextSize(Number(e.target.value))} className="w-full accent-[#E5322D]" />
                    <div className="text-right text-xs font-bold text-gray-500 mt-1">{textSize}px</div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                    <h4 className="text-sm font-bold text-blue-800 mb-1 flex items-center gap-2"><Monitor size={16}/> Pro Tip</h4>
                    <p className="text-xs text-blue-600">Select "Add Text" or "Add Image" from the top toolbar to place elements on the document. You can drag and resize them easily.</p>
                  </div>
                </div>

                {/* Bottom Save Button (PC only) */}
                <div className="p-4 lg:p-5 border-t border-gray-200 bg-gray-50 shrink-0 hidden lg:block">
                  <button onClick={saveAndDownload} disabled={isProcessing} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 transition shadow-md disabled:bg-gray-400">
                    {isProcessing ? <Settings className="animate-spin" size={18}/> : 'Save Document'}
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Bottom Navigation Bar */}
            <div className="lg:hidden flex border-t border-gray-200 bg-white h-16 shrink-0 shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-30">
               <button onClick={() => setMobileView('pages')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'pages' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <FileText size={20} /> Pages
               </button>
               <button onClick={() => setMobileView('pdf')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'pdf' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <Edit3 size={20} /> Editor
               </button>
               <button onClick={() => setMobileView('tools')} className={`flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] ${mobileView === 'tools' ? 'text-[#E5322D] bg-red-50' : 'text-gray-500'}`}>
                 <Settings size={20} /> Format
               </button>
               <button onClick={saveAndDownload} className="flex-1 flex flex-col items-center justify-center gap-1 font-bold text-[10px] text-white bg-[#E5322D]">
                 <Save size={20} /> Save
               </button>
            </div>
          </div>
        )}

        {/* STEP 4: DOWNLOAD SCREEN */}
        {step === 4 && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center animate-in slide-in-from-bottom-8 fade-in text-center px-4 mt-10">
            <div className="bg-green-100 p-4 rounded-full mb-6">
              <Download size={40} className="text-green-600" />
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 tracking-tight">Your PDF has been Edited!</h1>
            <p className="text-gray-600 mb-8 max-w-md">Your modified document has been processed successfully and downloaded to your device.</p>
            
            <div className="flex gap-4 w-full justify-center">
              <button onClick={() => setStep(1)} className="bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-800 font-bold py-3 px-8 rounded-xl transition shadow-sm">
                Edit Another File
              </button>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
