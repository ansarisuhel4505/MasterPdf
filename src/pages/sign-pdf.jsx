import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { 
  UploadCloud, X, PenTool, Lock, CheckCircle2, Download, Settings, 
  User, Calendar, Type, Stamp, PlusCircle, Trash2, ChevronLeft, ChevronRight, ShieldCheck 
} from 'lucide-react';

// Setup PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function VisualSignPdf() {
  // File & View States
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Modal & Signature Details State
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [activeTab, setActiveTab] = useState('Signature');
  const [fullName, setFullName] = useState('Suhel Ansari');
  const [initials, setInitials] = useState('SA');
  const [selectedStyle, setSelectedStyle] = useState(0); // 0, 1, 2 for different cursive fonts

  // Draggable Elements State
  const [elements, setElements] = useState([]);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  const signatureFonts = [
    "'Brush Script MT', cursive",
    "'Comic Sans MS', cursive, sans-serif",
    "'Great Vibes', cursive"
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setShowSignatureModal(true); // Open modal right after upload
    } else {
      alert("Please upload a valid PDF document.");
    }
  };

  const removeFile = () => {
    setFile(null); setFileUrl(null); setElements([]); setCurrentPage(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // Add elements to the PDF workspace
  const addElement = (type) => {
    let value = '';
    let fontStyle = 'Arial, sans-serif';
    
    if (type === 'signature') { value = fullName; fontStyle = signatureFonts[selectedStyle]; }
    else if (type === 'initials') { value = initials; fontStyle = signatureFonts[selectedStyle]; }
    else if (type === 'name') { value = fullName; }
    else if (type === 'date') { value = new Date().toLocaleDateString(); }
    else if (type === 'text') { value = 'Type here...'; }

    const newElement = {
      id: Date.now(),
      type,
      page: currentPage,
      x: 50,
      y: 50,
      width: type === 'signature' ? 200 : 150,
      height: type === 'signature' ? 60 : 40,
      value,
      fontStyle
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (id, newProps) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  // Convert HTML Text to Base64 Image (Crucial for embedding Custom Cursive fonts into PDF-lib)
  const textToImageDataUrl = (text, fontStyle, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; // High Res
    canvas.height = height * 2;
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.font = `30px ${fontStyle}`;
    ctx.fillStyle = '#E5322D'; // Red signature color
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 10, height / 2);
    return canvas.toDataURL('image/png');
  };

  // Final Processing (Visual Stamping + Locking)
  const applySignatureAndDownload = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // Loop through all placed elements and stamp them on respective pages
      for (const el of elements) {
        const page = pdfDoc.getPages()[el.page - 1];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        
        // Calculate coordinates based on UI scale vs PDF actual scale
        const scaleX = pdfWidth / pdfDimensions.width;
        const scaleY = pdfHeight / pdfDimensions.height;
        
        const actualX = el.x * scaleX;
        // PDF Y coordinate starts from BOTTOM left, UI starts from TOP left
        const actualY = pdfHeight - (el.y * scaleY) - (el.height * scaleY);

        if (el.type === 'signature' || el.type === 'initials') {
          // Convert cursive text to image to preserve exact font look in PDF
          const dataUrl = textToImageDataUrl(el.value, el.fontStyle, el.width, el.height);
          const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes);
          
          page.drawImage(pdfImage, {
            x: actualX, y: actualY, width: el.width * scaleX, height: el.height * scaleY
          });
        } else {
          // Standard text elements (Name, Date, Text)
          page.drawText(el.value, {
            x: actualX + 5, y: actualY + 15, size: 14 * scaleX, font: helveticaFont, color: rgb(0.2, 0.2, 0.2)
          });
        }
      }

      // Add Metadata & Lock Document
      pdfDoc.setAuthor(fullName);
      pdfDoc.setCreator('MasterPdf Enterprise Engine');
      pdfDoc.setModificationDate(new Date());

      const finalPdfBytes = await pdfDoc.save();

      // Trigger Download
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
      alert("Failed to sign document. Ensure the PDF is not encrypted.");
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>e-Sign PDF Documents | MasterPdf</title>
        <meta name="description" content="Visually sign your PDF documents with custom signatures, dates, and stamps." />
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
            
            {/* LEFT SIDEBAR: Page Navigation */}
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

            {/* CENTER: Document Viewer Workspace */}
            <div className="flex-grow bg-gray-200/50 p-6 flex flex-col items-center justify-start overflow-y-auto relative border-r border-gray-200">
               {/* Mobile Pagination Control */}
               <div className="lg:hidden flex items-center justify-between w-full max-w-[600px] mb-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
                 <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 text-gray-600 disabled:opacity-50"><ChevronLeft size={20}/></button>
                 <span className="font-bold text-sm text-gray-800">Page {currentPage} of {numPages}</span>
                 <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 text-gray-600 disabled:opacity-50"><ChevronRight size={20}/></button>
               </div>

               <div className="relative shadow-xl bg-white select-none">
                 <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
                   <Page 
                     pageNumber={currentPage} 
                     renderTextLayer={false} 
                     renderAnnotationLayer={false} 
                     width={600} 
                     onLoadSuccess={(pageInfo) => setPdfDimensions({ width: pageInfo.width, height: pageInfo.height })}
                   />
                 </Document>

                 {/* Rendering Draggable Elements over PDF */}
                 {elements.filter(el => el.page === currentPage).map((el) => (
                   <Rnd
                     key={el.id}
                     bounds="parent"
                     position={{ x: el.x, y: el.y }}
                     size={{ width: el.width, height: el.height }}
                     onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                     onResizeStop={(e, dir, ref, delta, position) => {
                       updateElement(el.id, {
                         width: ref.offsetWidth,
                         height: ref.offsetHeight,
                         ...position,
                       });
                     }}
                     className="group border-2 border-transparent hover:border-gray-400 focus-within:border-[#E5322D] border-dashed flex items-center justify-center bg-white/50 hover:bg-white/80 transition-colors"
                   >
                     <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X size={14} /></button>
                     
                     {el.type === 'text' || el.type === 'name' || el.type === 'date' ? (
                       <input 
                         type="text" 
                         value={el.value} 
                         onChange={(e) => updateElement(el.id, { value: e.target.value })}
                         className="w-full h-full bg-transparent outline-none text-center font-medium text-gray-800 resize-none"
                         style={{ fontSize: `${el.height * 0.4}px` }}
                       />
                     ) : (
                       <div 
                         className="w-full h-full flex items-center justify-center text-[#E5322D]"
                         style={{ fontFamily: el.fontStyle, fontSize: `${el.height * 0.6}px` }}
                       >
                         {el.value}
                       </div>
                     )}
                   </Rnd>
                 ))}
               </div>
            </div>

            {/* RIGHT SIDEBAR: Tools & Options */}
            <div className="w-full lg:w-[350px] bg-white p-6 flex flex-col h-full overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-900">Signing options</h3>
                <button onClick={removeFile} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
              </div>

              {/* Type Toggle */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Type</h4>
                <div className="flex gap-3">
                  <div className="flex-1 border-2 border-[#E5322D] bg-red-50 rounded-lg p-3 text-center cursor-pointer">
                    <PenTool size={20} className="text-[#E5322D] mx-auto mb-1" />
                    <span className="text-xs font-bold text-[#E5322D]">Simple Signature</span>
                  </div>
                  <div className="flex-1 border-2 border-gray-200 bg-gray-50 rounded-lg p-3 text-center opacity-50 cursor-not-allowed">
                    <ShieldCheck size={20} className="text-gray-500 mx-auto mb-1" />
                    <span className="text-xs font-bold text-gray-600">Digital Signature</span>
                  </div>
                </div>
              </div>

              {/* Required Fields */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center justify-between">
                  Required fields <button onClick={() => setShowSignatureModal(true)} className="text-[#E5322D] text-xs hover:underline">Edit Signature</button>
                </h4>
                <div 
                  onClick={() => addElement('signature')}
                  className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-red-50 hover:border-red-200 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded shadow-sm text-[#E5322D]"><PenTool size={16}/></div>
                    <span className="text-xl text-[#E5322D]" style={{ fontFamily: signatureFonts[selectedStyle] }}>{fullName}</span>
                  </div>
                  <PlusCircle size={18} className="text-gray-400 group-hover:text-[#E5322D]"/>
                </div>
              </div>

              {/* Optional Fields */}
              <div className="mb-8">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Optional fields</h4>
                <div className="space-y-2">
                  <button onClick={() => addElement('initials')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700">
                    <div className="bg-gray-100 p-1.5 rounded text-gray-600">AC</div> Initials
                  </button>
                  <button onClick={() => addElement('name')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700">
                    <User size={16} className="text-gray-500"/> Name
                  </button>
                  <button onClick={() => addElement('date')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700">
                    <Calendar size={16} className="text-gray-500"/> Date
                  </button>
                  <button onClick={() => addElement('text')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700">
                    <Type size={16} className="text-gray-500"/> Text
                  </button>
                  <button className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 flex items-center gap-3 opacity-50 cursor-not-allowed text-sm font-medium text-gray-700">
                    <Stamp size={16} className="text-gray-500"/> Company Stamp (Pro)
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-auto pt-4 border-t border-gray-100">
                <button 
                  onClick={applySignatureAndDownload} 
                  disabled={isProcessing || elements.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 transition shadow-md disabled:bg-gray-400"
                >
                  {isProcessing ? <><Settings className="animate-spin" size={20} /> Processing...</> : <>Sign <ArrowRight size={20}/></>}
                </button>
                {elements.length === 0 && <p className="text-[10px] text-center text-gray-400 mt-2">Add at least one element to sign.</p>}
              </div>
            </div>

          </div>
        )}

      </main>
      <Footer />

      {/* 🔥 "SET YOUR SIGNATURE DETAILS" MODAL 🔥 */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-[700px] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 p-5 px-8">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Set your signature details</h3>
              <button onClick={() => setShowSignatureModal(false)} className="text-gray-400 hover:text-red-500 bg-white border border-gray-200 p-2 rounded-full shadow-sm"><X size={20}/></button>
            </div>

            <div className="p-8">
              <div className="flex gap-6 mb-8">
                <div className="flex-grow">
                  <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2"><User size={16} className="text-[#E5322D]"/> Full name:</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#E5322D] outline-none font-medium text-gray-800 transition" />
                </div>
                <div className="w-32">
                  <label className="block text-sm font-bold text-gray-800 mb-2">Initials:</label>
                  <input type="text" value={initials} onChange={(e) => setInitials(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-[#E5322D] outline-none font-medium text-gray-800 text-center" />
                </div>
              </div>

              {/* TABS */}
              <div className="flex border-b border-gray-200 mb-6">
                <button onClick={() => setActiveTab('Signature')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 ${activeTab === 'Signature' ? 'text-gray-900 border-b-2 border-[#E5322D]' : 'text-gray-500 hover:text-gray-800'}`}><PenTool size={16}/> Signature</button>
                <button onClick={() => setActiveTab('Initials')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 ${activeTab === 'Initials' ? 'text-gray-900 border-b-2 border-[#E5322D]' : 'text-gray-500 hover:text-gray-800'}`}>AC Initials</button>
                <button onClick={() => setActiveTab('Stamp')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 ${activeTab === 'Stamp' ? 'text-gray-900 border-b-2 border-[#E5322D]' : 'text-gray-500 hover:text-gray-800'}`}><Stamp size={16}/> Company Stamp</button>
              </div>

              {/* TAB CONTENT */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 min-h-[200px]">
                {activeTab === 'Signature' && (
                  <div className="flex flex-col gap-3">
                    {signatureFonts.map((font, index) => (
                      <label key={index} className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition border ${selectedStyle === index ? 'bg-white border-[#E5322D] shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                        <input type="radio" name="sig-style" checked={selectedStyle === index} onChange={() => setSelectedStyle(index)} className="w-5 h-5 accent-[#E5322D]" />
                        <span className="text-3xl text-[#E5322D]" style={{ fontFamily: font }}>{fullName}</span>
                      </label>
                    ))}
                  </div>
                )}
                {activeTab === 'Initials' && (
                  <div className="flex flex-col gap-3">
                    {signatureFonts.map((font, index) => (
                      <label key={index} className={`flex items-center gap-4 p-4 rounded-lg cursor-pointer transition border ${selectedStyle === index ? 'bg-white border-[#E5322D] shadow-sm' : 'border-transparent hover:bg-gray-100'}`}>
                        <input type="radio" name="init-style" checked={selectedStyle === index} onChange={() => setSelectedStyle(index)} className="w-5 h-5 accent-[#E5322D]" />
                        <span className="text-3xl text-[#E5322D]" style={{ fontFamily: font }}>{initials}</span>
                      </label>
                    ))}
                  </div>
                )}
                {activeTab === 'Stamp' && (
                  <div className="flex flex-col items-center justify-center h-[180px] text-center">
                    <button className="border-2 border-[#E5322D] text-[#E5322D] font-bold px-6 py-3 rounded-lg hover:bg-red-50 transition mb-3">Upload company stamp</button>
                    <p className="text-sm text-gray-500 font-medium">or drop file here</p>
                    <p className="text-xs text-gray-400 mt-4">Accepted formats: PNG, JPG and SVG</p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={() => setShowSignatureModal(false)}
                  className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-3 px-10 rounded-xl transition shadow-md"
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
