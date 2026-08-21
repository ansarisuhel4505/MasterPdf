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
  UploadCloud, X, PenTool, Lock, Download, Settings, 
  User, Calendar, Type, Stamp, PlusCircle, ChevronLeft, 
  ChevronRight, ShieldCheck, Upload, QrCode
} from 'lucide-react';

// Stabilized Worker for Next.js to prevent Client-Side Exceptions
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function VisualSignPdf() {
  const [isMounted, setIsMounted] = useState(false);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal & Signature Preferences
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [hTab, setHTab] = useState('Signature'); // Signature, Initials, Stamp
  const [vTab, setVTab] = useState('Type'); // Type, Draw, Upload
  
  const [fullName, setFullName] = useState('Suhel Ansari');
  const [initials, setInitials] = useState('SA');
  
  const [selectedStyle, setSelectedStyle] = useState(0); 
  const [drawnSignature, setDrawnSignature] = useState(null);
  
  const [elements, setElements] = useState([]);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  const signatureFonts = [
    "'Brush Script MT', cursive",
    "'Comic Sans MS', cursive, sans-serif",
    "'Great Vibes', cursive"
  ];

  // Canvas Ref for Drawing
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize Canvas Context
  useEffect(() => {
    if (showSignatureModal && vTab === 'Draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#E5322D';
    }
  }, [showSignatureModal, vTab]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf'))) {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setShowSignatureModal(true); 
    } else if (selectedFile) {
      alert("Please upload a valid PDF document (.pdf).");
    }
    e.target.value = null; // allow re-upload
  };

  const removeFile = () => {
    setFile(null); setFileUrl(null); setElements([]); setCurrentPage(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // Drawing Functions
  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };
  const draw = (e) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };
  const stopDrawing = () => setIsDrawing(false);
  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setDrawnSignature(null);
  };

  const applyModalSettings = () => {
    if (vTab === 'Draw' && canvasRef.current) {
      setDrawnSignature(canvasRef.current.toDataURL('image/png'));
    }
    setShowSignatureModal(false);
  };

  const addElement = (type) => {
    let value = '';
    let fontStyle = 'Arial, sans-serif';
    let isImage = false;
    let imgData = null;
    
    if (type === 'signature') { 
      if (vTab === 'Draw' && drawnSignature) {
        isImage = true; imgData = drawnSignature;
      } else {
        value = fullName; fontStyle = signatureFonts[selectedStyle]; 
      }
    }
    else if (type === 'initials') { value = initials; fontStyle = signatureFonts[selectedStyle]; }
    else if (type === 'name') { value = fullName; fontStyle = 'Helvetica, sans-serif'; }
    else if (type === 'date') { value = new Date().toLocaleDateString(); fontStyle = 'Helvetica, sans-serif'; }
    else if (type === 'text') { value = 'Type here...'; fontStyle = 'Helvetica, sans-serif'; }

    const newElement = {
      id: Date.now(),
      type,
      page: currentPage,
      x: 100, y: 150,
      width: isImage ? 200 : (type === 'signature' ? 200 : 150),
      height: isImage ? 100 : (type === 'signature' ? 60 : 40),
      value, fontStyle, isImage, imgData
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (id, newProps) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  const textToImageDataUrl = (text, fontStyle, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; 
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.font = `30px ${fontStyle}`;
    ctx.fillStyle = '#E5322D'; 
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 10, height / 2);
    return canvas.toDataURL('image/png');
  };

  const applySignatureAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const el of elements) {
        const page = pdfDoc.getPages()[el.page - 1];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        
        const scaleX = pdfWidth / pdfDimensions.width;
        const scaleY = pdfHeight / pdfDimensions.height;
        
        const actualX = el.x * scaleX;
        const actualY = pdfHeight - (el.y * scaleY) - (el.height * scaleY);

        if (el.isImage) {
          const imgBytes = await fetch(el.imgData).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pdfImage, { x: actualX, y: actualY, width: el.width * scaleX, height: el.height * scaleY });
        } else if (el.type === 'signature' || el.type === 'initials') {
          const dataUrl = textToImageDataUrl(el.value, el.fontStyle, el.width, el.height);
          const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pdfImage, { x: actualX, y: actualY, width: el.width * scaleX, height: el.height * scaleY });
        } else {
          page.drawText(el.value, {
            x: actualX + 5, y: actualY + 15, size: 14 * scaleX, font: helveticaFont, color: rgb(0.2, 0.2, 0.2)
          });
        }
      }

      pdfDoc.setAuthor(fullName);
      pdfDoc.setCreator('MasterPdf Engine');
      pdfDoc.setModificationDate(new Date());

      const finalPdfBytes = await pdfDoc.save();

      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Signed_${file.name}`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error signing PDF:", error);
      alert("Failed to sign document.");
    }
    
    setIsProcessing(false);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Sign PDF Documents | MasterPdf</title>
        <meta name="description" content="Visually sign your PDF documents securely." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-10 px-4">
        {!file ? (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center">
            <ShieldCheck size={60} className="text-[#E5322D] mx-auto mb-6 opacity-90" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Sign PDF Document</h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Sign yourself or request electronic signatures from others. Secure, fast, and legally binding.
            </p>
            <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
            <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-5 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              <UploadCloud size={28} /> Select PDF file
            </label>
          </div>
        ) : (
          <div className="w-full max-w-[1600px] h-[80vh] flex flex-col lg:flex-row bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            
            {/* Sidebar - Page Thumbnails */}
            <div className="w-full lg:w-24 bg-gray-50 border-r border-gray-200 p-4 flex flex-col items-center gap-4 overflow-y-auto hidden lg:flex">
               <h4 className="text-[10px] font-bold text-gray-500 uppercase">Pages</h4>
               {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
                 <button 
                   key={page} 
                   onClick={() => setCurrentPage(page)}
                   className={`w-14 h-20 rounded shadow-sm border-2 flex items-center justify-center text-xs font-bold transition-all ${currentPage === page ? 'border-[#E5322D] bg-white text-[#E5322D]' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
                 >
                   {page}
                 </button>
               ))}
            </div>

            {/* Document Viewer */}
            <div className="flex-grow bg-[#EFEFEF] p-6 flex flex-col items-center justify-start overflow-y-auto relative border-r border-gray-200">
               <div className="lg:hidden flex items-center justify-between w-full max-w-[600px] mb-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                 <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 text-gray-600 disabled:opacity-50"><ChevronLeft size={20}/></button>
                 <span className="font-bold text-sm text-gray-800">Page {currentPage} of {numPages}</span>
                 <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 text-gray-600 disabled:opacity-50"><ChevronRight size={20}/></button>
               </div>

               <div className="relative shadow-xl bg-white select-none">
                 <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="p-10 text-gray-500 font-medium">Loading PDF Document...</div>}>
                   <Page pageNumber={currentPage} renderTextLayer={false} renderAnnotationLayer={false} width={600} onLoadSuccess={(pageInfo) => setPdfDimensions({ width: pageInfo.width, height: pageInfo.height })} />
                 </Document>

                 {elements.filter(el => el.page === currentPage).map((el) => (
                   <Rnd
                     key={el.id}
                     bounds="parent"
                     position={{ x: el.x, y: el.y }}
                     size={{ width: el.width, height: el.height }}
                     onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                     onResizeStop={(e, dir, ref, delta, position) => { updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...position }); }}
                     className="group border-2 border-transparent hover:border-gray-400 focus-within:border-[#E5322D] border-dashed flex items-center justify-center bg-white/50 hover:bg-white/80 transition-colors"
                   >
                     <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-[#E5322D] opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X size={14} /></button>
                     
                     {el.isImage ? (
                       <img src={el.imgData} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
                     ) : el.type === 'text' || el.type === 'name' || el.type === 'date' ? (
                       <input 
                         type="text" value={el.value} onChange={(e) => updateElement(el.id, { value: e.target.value })}
                         className="w-full h-full bg-transparent outline-none text-center font-medium text-gray-800 resize-none"
                         style={{ fontSize: `${el.height * 0.4}px` }}
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center text-[#E5322D]" style={{ fontFamily: el.fontStyle, fontSize: `${el.height * 0.6}px` }}>
                         {el.value}
                       </div>
                     )}
                   </Rnd>
                 ))}
               </div>
            </div>

            {/* Right Sidebar - EXACT iLovePDF Matching Layout */}
            <div className="w-full lg:w-[350px] bg-white flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">Signing options</h3>
                <button onClick={removeFile} className="text-gray-500 hover:text-[#E5322D]"><X size={20}/></button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow">
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Type</h4>
                  <div className="flex gap-2">
                    <div className="flex-1 border-2 border-[#E5322D] bg-red-50 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer">
                      <PenTool size={20} className="text-[#E5322D] mb-2" />
                      <span className="text-xs font-bold text-[#E5322D]">Simple Signature</span>
                    </div>
                    <div className="flex-1 border-2 border-gray-200 bg-gray-50 rounded-lg p-3 flex flex-col items-center justify-center opacity-50 cursor-not-allowed">
                      <ShieldCheck size={20} className="text-gray-500 mb-2" />
                      <span className="text-xs font-bold text-gray-600 text-center leading-tight">Digital Signature</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-800">Required fields</h4>
                    <button onClick={() => setShowSignatureModal(true)} className="text-[#E5322D] text-xs font-bold hover:underline flex items-center gap-1"><PenTool size={12}/> Edit</button>
                  </div>
                  
                  <div 
                    onClick={() => addElement('signature')}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between group transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-[#E5322D] p-2 rounded text-white"><PenTool size={16}/></div>
                      {vTab === 'Draw' && drawnSignature ? (
                        <img src={drawnSignature} className="h-10 object-contain" alt="Drawn" />
                      ) : (
                        <span className="text-2xl text-[#E5322D]" style={{ fontFamily: signatureFonts[selectedStyle] }}>{fullName}</span>
                      )}
                    </div>
                    <PlusCircle size={18} className="text-gray-400 group-hover:text-gray-800"/>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Optional fields</h4>
                  <div className="space-y-2">
                    <button onClick={() => addElement('initials')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center justify-between transition-colors shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="bg-gray-100 px-2 py-1 rounded text-[#E5322D] font-bold text-xs">AC</div> 
                        <span className="text-sm font-medium text-gray-700">Initials</span>
                      </div>
                      <span className="text-lg text-[#E5322D] mr-2" style={{ fontFamily: signatureFonts[selectedStyle] }}>{initials}</span>
                    </button>
                    <button onClick={() => addElement('name')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700 shadow-sm">
                      <div className="bg-[#E5322D] p-1.5 rounded text-white"><User size={14}/></div> Name
                    </button>
                    <button onClick={() => addElement('date')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700 shadow-sm">
                      <div className="bg-[#E5322D] p-1.5 rounded text-white"><Calendar size={14}/></div> Date
                    </button>
                    <button onClick={() => addElement('text')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700 shadow-sm">
                      <div className="bg-[#E5322D] p-1.5 rounded text-white"><Type size={14}/></div> Text
                    </button>
                    <button className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center gap-3 opacity-50 cursor-not-allowed text-sm font-medium text-gray-700">
                      <div className="bg-gray-400 p-1.5 rounded text-white"><Stamp size={14}/></div> Company Stamp
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <button 
                  onClick={applySignatureAndDownload} 
                  disabled={isProcessing || elements.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 transition shadow-md disabled:bg-gray-400"
                >
                  {isProcessing ? <><Settings className="animate-spin" size={20} /> Processing...</> : <>Sign <ChevronRight size={20}/></>}
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
      <Footer />

      {/* 🔥 EXACT ILOVEPDF STYLE MODAL 🔥 */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[800px] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 p-5 px-8">
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">Set your signature details</h3>
              <button onClick={() => setShowSignatureModal(false)} className="text-gray-400 hover:text-[#E5322D] border border-gray-200 px-3 py-1 rounded-md text-sm font-bold bg-white shadow-sm">Cancel</button>
            </div>

            <div className="p-8">
              {/* Inputs */}
              <div className="flex gap-6 mb-6">
                <div className="flex-grow">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="bg-gray-200 p-1 rounded-full text-gray-600"><User size={14}/></div> Full name:
                  </label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 bg-blue-50/30 focus:bg-white focus:ring-1 focus:ring-gray-400 outline-none font-medium text-gray-800 transition" />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Initials:</label>
                  <input type="text" value={initials} onChange={(e) => setInitials(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-1 focus:ring-gray-400 outline-none font-medium text-gray-800 text-center" />
                </div>
              </div>

              {/* Horizontal Tabs */}
              <div className="flex border-b border-gray-200">
                <button onClick={() => setHTab('Signature')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 ${hTab === 'Signature' ? 'text-[#E5322D] border-[#E5322D]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
                  <PenTool size={16}/> Signature
                </button>
                <button onClick={() => setHTab('Initials')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 ${hTab === 'Initials' ? 'text-[#E5322D] border-[#E5322D]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
                  <span className="font-black text-xs border-b border-gray-400">AC</span> Initials
                </button>
                <button onClick={() => setHTab('Stamp')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 ${hTab === 'Stamp' ? 'text-[#E5322D] border-[#E5322D]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
                  <Stamp size={16}/> Company Stamp
                </button>
              </div>

              {/* Workspace Content */}
              <div className="bg-gray-100 rounded-b-xl flex min-h-[250px] border border-gray-200 border-t-0">
                
                {/* Vertical Tabs (Left Sidebar) */}
                {(hTab === 'Signature' || hTab === 'Initials') && (
                  <div className="w-16 bg-gray-200 border-r border-gray-300 flex flex-col rounded-bl-xl overflow-hidden">
                    <button onClick={() => setVTab('Type')} className={`py-4 flex justify-center border-l-4 transition-colors ${vTab === 'Type' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Type size={20}/></button>
                    <button onClick={() => setVTab('Draw')} className={`py-4 flex justify-center border-l-4 transition-colors ${vTab === 'Draw' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><PenTool size={20}/></button>
                    <button onClick={() => setVTab('Upload')} className={`py-4 flex justify-center border-l-4 transition-colors ${vTab === 'Upload' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Upload size={20}/></button>
                  </div>
                )}

                {/* Main Content Area */}
                <div className="flex-grow p-4">
                  {(hTab === 'Signature' || hTab === 'Initials') && vTab === 'Type' && (
                    <div className="flex flex-col gap-2 bg-gray-100 h-[220px] overflow-y-auto pr-2">
                      {signatureFonts.map((font, index) => (
                        <label key={index} className={`flex items-center gap-4 px-4 py-3 rounded-md cursor-pointer transition border-b border-gray-200 ${selectedStyle === index ? 'bg-white shadow-sm' : 'hover:bg-gray-50'}`}>
                          <input type="radio" checked={selectedStyle === index} onChange={() => setSelectedStyle(index)} className="w-5 h-5 accent-[#E5322D]" />
                          <span className="text-3xl text-[#E5322D]" style={{ fontFamily: font }}>{hTab === 'Signature' ? fullName : initials}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {(hTab === 'Signature' || hTab === 'Initials') && vTab === 'Draw' && (
                    <div className="h-full flex flex-col items-center justify-center w-full gap-2">
                      <canvas 
                        ref={canvasRef}
                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                        className="w-full h-[180px] bg-white border border-gray-300 rounded cursor-crosshair shadow-inner"
                        width={500} height={180}
                      />
                      <div className="flex justify-between w-full text-xs text-gray-500 px-2 font-medium">
                        <span>Draw your signature inside the box</span>
                        <button onClick={clearCanvas} className="hover:text-[#E5322D] underline">Clear</button>
                      </div>
                    </div>
                  )}

                  {(hTab === 'Signature' || hTab === 'Initials') && vTab === 'Upload' && (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-white rounded-lg m-2">
                      <div className="text-center p-6">
                        <button className="border border-gray-300 text-gray-700 font-bold px-6 py-2 rounded-lg hover:bg-gray-50 transition mb-3 shadow-sm">Upload signature</button>
                        <p className="text-sm text-gray-500 font-medium">or drop file here</p>
                        <p className="text-[10px] text-gray-400 mt-3">Accepted formats: PNG, JPG and SVG</p>
                      </div>
                    </div>
                  )}

                  {hTab === 'Stamp' && (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-white rounded-lg m-2">
                      <div className="text-center p-6">
                        <button className="border border-[#E5322D] text-[#E5322D] font-bold px-6 py-2 rounded-lg hover:bg-red-50 transition mb-3 shadow-sm">Upload company stamp</button>
                        <p className="text-sm text-gray-500 font-medium">or drop file here</p>
                        <p className="text-[10px] text-gray-400 mt-3">Accepted formats: PNG, JPG and SVG</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side QR Box (Static Layout matching image) */}
                {(hTab === 'Signature' || hTab === 'Initials') && (
                  <div className="w-32 bg-gray-50 border-l border-gray-200 flex flex-col items-center justify-center p-4">
                    <QrCode size={50} className="text-gray-300 mb-2"/>
                    <span className="text-[10px] font-bold text-[#E5322D] text-center leading-tight hover:underline cursor-pointer">Draw from your mobile device</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button 
                  onClick={applyModalSettings}
                  className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-2.5 px-10 rounded-lg transition shadow-md"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
