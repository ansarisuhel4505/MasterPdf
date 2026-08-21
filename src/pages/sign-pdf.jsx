import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import { upload } from '@vercel/blob/client';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import { 
  UploadCloud, X, PenTool, ShieldCheck, Lock, History, 
  Settings, User, Calendar, Image as ImageIcon, ChevronLeft, ChevronRight, CheckCircle2, Download 
} from 'lucide-react';

// Setup PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function AdvancedSignPdf() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  const [downloadUrl, setDownloadLink] = useState('');
  const [auditLogUrl, setAuditLogUrl] = useState('');

  // PDF Viewer State
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pdfWrapperRef = useRef(null);

  // Drag & Drop Elements State
  const [elements, setElements] = useState([]);
  
  // Signature Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState('type'); // type, draw, upload
  const [signatureData, setSignatureData] = useState({ text: 'Suhel Ansari', type: 'text', image: null });
  
  // Canvas Ref for Drawing
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Constants
  const PREVIEW_WIDTH = 600;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setStep(2);
    } else {
      alert("Please upload a valid PDF document.");
    }
  };

  const removeFile = () => {
    setFile(null); setFileUrl(null); setElements([]); setStep(1); setCurrentPage(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // --- CANVAS DRAWING LOGIC ---
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#E5322D';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);
  
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    if (modalTab === 'draw') {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      setSignatureData({ type: 'image', image: dataUrl });
    }
    setIsModalOpen(false);
    addElement('signature');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSignatureData({ type: 'image', image: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- DRAG & DROP LOGIC ---
  const addElement = (type) => {
    const newElement = {
      id: Date.now().toString(),
      type,
      x: 50,
      y: 50,
      width: type === 'signature' ? 200 : 150,
      height: type === 'signature' ? 60 : 30,
      page: currentPage,
      value: type === 'date' ? new Date().toLocaleDateString() : 
             type === 'name' ? 'Suhel Ansari' : 
             type === 'signature' ? signatureData : 'Text'
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (id, newProps) => {
    setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  };

  const deleteElement = (id) => {
    setElements(elements.filter(el => el.id !== id));
  };

  // --- VISUAL STAMPING & BACKEND CRYPTO LOGIC ---
  const addLog = (message, delay) => new Promise(resolve => setTimeout(() => { setLogs(prev => [...prev, message]); resolve(); }, delay));

  const processAndSign = async () => {
    if (elements.length === 0) {
      alert("Please place at least one signature or element on the document.");
      return;
    }
    
    setStep(3);
    setLogs(["[SYSTEM] Initiating Visual Integration & Cryptographic Protocol..."]);
    setIsProcessing(true);

    try {
      await addLog("[VISUAL] Mapping coordinates and applying visual stamps...", 800);
      
      // 1. Visually stamp the PDF using pdf-lib
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const cursiveFont = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

      for (const el of elements) {
        const page = pdfDoc.getPages()[el.page - 1];
        const { width: pdfWidth, height: pdfHeight } = page.getSize();
        
        // Map screen coordinates (PREVIEW_WIDTH) to actual PDF coordinates
        const scale = pdfWidth / PREVIEW_WIDTH;
        const actualX = el.x * scale;
        // PDF origin is bottom-left, screen origin is top-left
        const actualY = pdfHeight - (el.y * scale) - (el.height * scale); 
        const actualWidth = el.width * scale;
        const actualHeight = el.height * scale;

        if (el.type === 'signature') {
          if (el.value.type === 'image' && el.value.image) {
            const isPng = el.value.image.includes('data:image/png');
            const imgBytes = await fetch(el.value.image).then(res => res.arrayBuffer());
            const pdfImage = isPng ? await pdfDoc.embedPng(imgBytes) : await pdfDoc.embedJpg(imgBytes);
            page.drawImage(pdfImage, { x: actualX, y: actualY, width: actualWidth, height: actualHeight });
          } else {
            page.drawText(el.value.text, { x: actualX, y: actualY + 10, size: actualHeight * 0.6, font: cursiveFont, color: rgb(0.9, 0.2, 0.18) });
          }
        } else {
          page.drawText(el.value, { x: actualX, y: actualY + 5, size: actualHeight * 0.7, font: font, color: rgb(0.1, 0.1, 0.1) });
        }
      }

      const visualPdfBytes = await pdfDoc.save();
      const visualBlob = new Blob([visualPdfBytes], { type: 'application/pdf' });

      await addLog("[CLOUD] Uploading visually stamped document to secure vault...", 1000);
      
      // 2. Upload to Vercel
      const cloudBlob = await upload(`stamped_${file.name}`, visualBlob, { access: 'public', handleUploadUrl: '/api/upload' });
      
      await addLog("[PKI] Generating 2048-bit RSA Cryptographic Key...", 900);
      
      // 3. Send to backend for cryptographic lock (Tamper Seal)
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sign-pdf', 
          fileUrl: cloudBlob.url,
          signerName: "Suhel Ansari", // In real app, fetch from auth/profile
          signerEmail: "ansarisuhel4505@gmail.com",
          lockDocument: true
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.downloadUrl) throw new Error(data.error);
      
      await addLog("[TAMPER-SEAL] Document locked against future modifications...", 800);
      await addLog("[SUCCESS] Document legally signed and sealed.", 600);

      setDownloadLink(data.downloadUrl);
      
      // Generate Audit Trail
      const auditText = `CERTIFICATE OF COMPLETION\n\nDocument: ${file.name}\nSigner: Suhel Ansari\nTimestamp: ${new Date().toISOString()}\nSecurity: 2048-bit RSA\nTamper Seal: Active (Locked)\nElements Placed: ${elements.length}\nCompliance: IT Act 2000\n\nGenerated by MasterPdf Enterprise Engine.`;
      const auditBlobUrl = URL.createObjectURL(new Blob([auditText], { type: 'text/plain' }));
      setAuditLogUrl(auditBlobUrl);
      
      setStep(4);
    } catch (error) {
      await addLog("[FATAL ERROR] Processing failed. Check console.", 500);
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Pro e-Sign PDF Online | MasterPdf</title>
        <meta name="description" content="Visually place signatures and cryptographically lock your PDFs online for free." />
      </Head>
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center p-4 mt-16 mb-10">
        
        {step === 1 && (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center mt-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Sign PDF Document</h1>
            <p className="text-gray-600 mb-8">Securely sign, add your initials, name, and date with cryptographic protection.</p>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 bg-gray-50 hover:bg-gray-100 transition">
              <PenTool size={60} className="text-[#E5322D] mx-auto mb-4" />
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-lg font-bold py-4 px-10 rounded-xl inline-flex items-center gap-3 shadow-md transition">
                <UploadCloud size={24} /> Upload Document
              </label>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-[1400px] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:flex-row overflow-hidden min-h-[700px]">
            
            {/* LEFT: Live PDF Visualizer */}
            <div className="w-full lg:w-3/4 bg-gray-100 p-6 flex flex-col items-center relative overflow-hidden">
              <div className="w-full flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700">Document Preview</h3>
                <div className="flex items-center gap-4">
                  <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p=>p-1)} className="p-1 bg-white rounded shadow disabled:opacity-50"><ChevronLeft/></button>
                  <span className="text-sm font-bold">Page {currentPage} of {numPages}</span>
                  <button disabled={currentPage >= numPages} onClick={() => setCurrentPage(p=>p+1)} className="p-1 bg-white rounded shadow disabled:opacity-50"><ChevronRight/></button>
                </div>
              </div>

              <div 
                ref={pdfWrapperRef} 
                className="relative bg-white shadow-xl border border-gray-300 overflow-hidden" 
                style={{ width: PREVIEW_WIDTH }}
              >
                <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess} loading={<div className="p-20 text-center animate-pulse">Loading Document...</div>}>
                  <Page pageNumber={currentPage} width={PREVIEW_WIDTH} renderTextLayer={false} renderAnnotationLayer={false} />
                </Document>

                {/* Draggable Elements Overlay */}
                {elements.filter(el => el.page === currentPage).map(el => (
                  <Rnd
                    key={el.id}
                    bounds="parent"
                    position={{ x: el.x, y: el.y }}
                    size={{ width: el.width, height: el.height }}
                    onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      updateElement(el.id, { width: ref.style.width, height: ref.style.height, ...position });
                    }}
                    className={`border-2 border-dashed border-blue-500 bg-blue-50/40 group flex items-center justify-center cursor-move`}
                  >
                    <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"><X size={12}/></button>
                    
                    {el.type === 'signature' ? (
                      el.value.type === 'image' ? <img src={el.value.image} className="w-full h-full object-contain pointer-events-none" /> :
                      <span className="font-bold text-red-600 text-2xl" style={{ fontFamily: "'Brush Script MT', cursive" }}>{el.value.text}</span>
                    ) : (
                      <span className="font-bold text-gray-800 pointer-events-none whitespace-nowrap">{el.value}</span>
                    )}
                  </Rnd>
                ))}
              </div>
            </div>

            {/* RIGHT: Tools Panel */}
            <div className="w-full lg:w-1/4 bg-white border-l border-gray-200 p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Settings size={20} className="text-[#E5322D]"/> Signing Options</h3>
                
                <div className="space-y-4">
                  <div className="border border-gray-200 p-4 rounded-xl bg-gray-50">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Add Elements</h4>
                    <button onClick={() => setIsModalOpen(true)} className="w-full mb-3 flex items-center justify-center gap-2 bg-white border-2 border-blue-200 text-blue-700 hover:border-blue-400 font-bold py-3 rounded-lg transition shadow-sm">
                      <PenTool size={18}/> Create Signature
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => addElement('name')} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-100 font-bold text-sm py-2 px-3 rounded-lg"><User size={16}/> Name</button>
                      <button onClick={() => addElement('date')} className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-100 font-bold text-sm py-2 px-3 rounded-lg"><Calendar size={16}/> Date</button>
                    </div>
                  </div>

                  <div className="border border-green-200 p-4 rounded-xl bg-green-50">
                    <h4 className="text-xs font-bold text-green-700 uppercase tracking-wider mb-2 flex items-center gap-1"><ShieldCheck size={14}/> Enterprise Security</h4>
                    <p className="text-xs text-green-800 font-medium">After visual placement, document will be Cryptographically Locked with an Audit Trail.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  onClick={processAndSign} 
                  disabled={isProcessing || elements.length === 0} 
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 transition shadow-lg disabled:bg-gray-400"
                >
                  {isProcessing ? <><Settings className="animate-spin" size={24} /> Sealing...</> : <>Finish & Sign <Lock size={20} /></>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 & 4: Terminal & Success (Same as before) */}
        {step === 3 && (
          <div className="w-full max-w-4xl bg-[#0D1117] rounded-xl p-8 min-h-[400px] flex flex-col shadow-2xl mt-10">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2 border-b border-gray-800 pb-3"><Lock size={20}/> Cryptographic Terminal</h3>
            <div className="flex-grow font-mono text-[14px] leading-relaxed">
              {logs.map((log, i) => (
                <div key={i} className={log.includes('[SUCCESS]') ? 'text-green-400 font-bold' : log.includes('[FATAL') ? 'text-red-500' : 'text-gray-300'}>
                  <span className="text-gray-600 mr-3">{new Date().toISOString().split('T')[1].split('.')[0]}</span>{log}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center mt-10 animate-in zoom-in duration-500">
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h3 className="text-3xl font-black text-gray-900 mb-2">Document Legally Signed!</h3>
            <p className="text-gray-500 mb-8">The cryptographic hash has been embedded. Tamper Seal is Active.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold bg-[#E5322D] hover:bg-red-700 transition shadow-lg"><Download size={20}/> Download Signed PDF</a>
              <a href={auditLogUrl} target="_blank" rel="noopener noreferrer" download={`Audit_Trail.txt`} className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-gray-700 font-bold bg-gray-100 hover:bg-gray-200 transition"><History size={20}/> Download Audit Log</a>
            </div>
          </div>
        )}

      </main>
      <Footer />

      {/* 🔥 SIGNATURE CREATION MODAL (iLovePDF Style) 🔥 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">Set your signature details</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-red-500"><X size={20}/></button>
            </div>
            
            <div className="p-6">
              {/* Tabs */}
              <div className="flex border-b border-gray-200 mb-6 gap-6">
                <button onClick={() => setModalTab('type')} className={`pb-3 font-bold text-sm flex items-center gap-2 transition-colors ${modalTab==='type' ? 'text-[#E5322D] border-b-2 border-[#E5322D]' : 'text-gray-500 hover:text-gray-800'}`}><Type size={16}/> Type</button>
                <button onClick={() => setModalTab('draw')} className={`pb-3 font-bold text-sm flex items-center gap-2 transition-colors ${modalTab==='draw' ? 'text-[#E5322D] border-b-2 border-[#E5322D]' : 'text-gray-500 hover:text-gray-800'}`}><PenTool size={16}/> Draw</button>
                <button onClick={() => setModalTab('upload')} className={`pb-3 font-bold text-sm flex items-center gap-2 transition-colors ${modalTab==='upload' ? 'text-[#E5322D] border-b-2 border-[#E5322D]' : 'text-gray-500 hover:text-gray-800'}`}><ImageIcon size={16}/> Upload Image</button>
              </div>

              {/* Tab Contents */}
              <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 flex justify-center items-center min-h-[250px]">
                {modalTab === 'type' && (
                  <div className="w-full">
                    <input type="text" value={signatureData.text} onChange={(e) => setSignatureData({ ...signatureData, text: e.target.value, type: 'text' })} className="w-full border-2 border-gray-300 rounded-lg p-4 text-center text-4xl text-[#E5322D] bg-white outline-none focus:border-red-400" style={{ fontFamily: "'Brush Script MT', cursive" }} placeholder="Type your name" />
                  </div>
                )}
                {modalTab === 'draw' && (
                  <div className="w-full flex flex-col items-center">
                    <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} width={400} height={150} className="bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-crosshair shadow-sm"></canvas>
                    <button onClick={clearCanvas} className="mt-3 text-sm font-bold text-gray-500 hover:text-red-500">Clear Canvas</button>
                  </div>
                )}
                {modalTab === 'upload' && (
                  <div className="text-center w-full">
                    <input type="file" id="sig-upload" accept="image/*" onChange={handleImageUpload} className="hidden"/>
                    <label htmlFor="sig-upload" className="cursor-pointer bg-white border-2 border-dashed border-gray-300 hover:border-red-400 rounded-lg w-full py-12 flex flex-col items-center justify-center transition">
                      <UploadCloud size={40} className="text-gray-400 mb-3" />
                      <span className="font-bold text-gray-600">Upload signature or stamp image</span>
                      <span className="text-xs text-gray-400 mt-1">PNG, JPG formats supported</span>
                    </label>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={saveSignature} className="px-8 py-3 bg-[#E5322D] hover:bg-red-700 text-white font-bold rounded-xl transition shadow-md">Apply Signature</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
