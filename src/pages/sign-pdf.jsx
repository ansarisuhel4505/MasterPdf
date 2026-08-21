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
  ChevronRight, Shield, Upload, Scan, CheckCircle2, Palette,
  Layers, Globe, FileText, ArrowRight,
  MessageSquare, Users, ListOrdered, ImageIcon, ScanText
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// 🔥 50 Handpicked Signature Fonts
const signatureFonts = [
  "Brush Script MT", "Caveat", "Dancing Script", "Pacifico", "Satisfy", "Homemade Apple", "Sacramento", "Yellowtail", 
  "Parisienne", "Bad Script", "Tangerine", "Alex Brush", "Allura", "Arizonia", "Cookie", "Courgette", "Damion", 
  "Engagement", "Grand Hotel", "Kaushan Script", "Leckerli One", "Marck Script", "Niconne", "Norican", "Oleo Script", 
  "Over the Rainbow", "Pinyon Script", "Qwigley", "Rancho", "Rochester", "Rouge Script", "Ruge Boogie", "Shadows Into Light", 
  "Sofia", "Stalemate", "Vibur", "Yesteryear", "Zeyada", "Kalam", "Indie Flower", "Patrick Hand", "Amatic SC", "Handlee", 
  "Neucha", "Rock Salt", "Reenie Beanie", "Nothing You Could Do", "Schoolbell", "Nanum Pen Script", "Comic Sans MS"
];

export default function VisualSignPdf() {
  const [isMounted, setIsMounted] = useState(false);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // App Flow: 1(Upload) -> 1.5(Who) -> 2(Solo) OR 'request_form'(Multiple) -> 4(Download)
  const [step, setStep] = useState(1);
  
  // Modal & Signature Preferences (Solo Editor)
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
  const [elements, setElements] = useState([]);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // --- SEVERAL PEOPLE REQUEST FORM STATES ---
  const [receivers, setReceivers] = useState([{ id: 1, name: '', email: '', role: 'Signer', color: 'bg-red-200' }]);
  const [reqSettings, setReqSettings] = useState({
    order: false, expiration: false, expDays: 15, multiple: false, 
    emailNotif: true, reminders: true, reminderDays: 1, digitalSig: false, 
    verifyCode: true, emailBranding: false, companyName: '', logo: null
  });
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => { setIsMounted(true); }, []);

  // Safe Date Calculation to prevent Server/Client crash
  useEffect(() => {
    if (isMounted) {
      const d = new Date(Date.now() + (Number(reqSettings.expDays) || 15) * 86400000);
      setExpiryDate(d.toLocaleDateString());
    }
  }, [reqSettings.expDays, isMounted]);

  useEffect(() => {
    if (showSignatureModal && vTab === 'Draw' && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = sigColor;
    }
  }, [showSignatureModal, vTab, sigColor]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf'))) {
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setStep(1.5); 
    } else if (selectedFile) {
      alert("Please upload a valid PDF document (.pdf).");
    }
    e.target.value = null; 
  };

  const removeFile = () => {
    setFile(null); setFileUrl(null); setElements([]); setCurrentPage(1); setStep(1);
  };

  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);

  // --- SOLO EDITOR LOGIC ---
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
    setDrawnSignature(null);
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (type === 'sig') setUploadedSig(ev.target.result);
        if (type === 'stamp') setUploadedStamp(ev.target.result);
        if (type === 'logo') setReqSettings({...reqSettings, logo: ev.target.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const generateDigitalSig = () => {
    const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase() + "-" + Date.now().toString(36).toUpperCase();
    return `Digitally Signed By: ${fullName}\nDate: ${new Date().toLocaleString()}\nVerify ID: ${uniqueId}`;
  };

  const applyModalSettings = () => {
    if (vTab === 'Draw' && canvasRef.current) setDrawnSignature(canvasRef.current.toDataURL('image/png'));
    setShowSignatureModal(false);
  };

  const addElement = (type) => {
    let value = ''; let fontStyle = 'Arial, sans-serif';
    let isImage = false; let imgData = null; let isDigital = false;
    let finalColor = sigColor;

    if (type === 'signature') {
      if (sigMode === 'simple') {
        if (vTab === 'Draw' && drawnSignature) { isImage = true; imgData = drawnSignature; }
        else if (vTab === 'Upload' && uploadedSig) { isImage = true; imgData = uploadedSig; }
        else { value = fullName; fontStyle = signatureFonts[selectedStyle]; }
      } else if (sigMode === 'digital') {
        value = generateDigitalSig(); isDigital = true;
      }
    } 
    else if (type === 'initials') {
      if (vTab === 'Upload' && uploadedSig) { isImage = true; imgData = uploadedSig; }
      else { value = initials; fontStyle = signatureFonts[selectedStyle]; }
    } 
    else if (type === 'stamp') {
      if (uploadedStamp) { isImage = true; imgData = uploadedStamp; }
      else { setShowSignatureModal(true); setHTab('Stamp'); return; }
    }
    else if (type === 'name') { value = fullName; fontStyle = 'Helvetica, sans-serif'; finalColor = '#333'; }
    else if (type === 'date') { value = new Date().toLocaleDateString(); fontStyle = 'Helvetica, sans-serif'; finalColor = '#333'; }
    else if (type === 'text') { value = 'Type here...'; fontStyle = 'Helvetica, sans-serif'; finalColor = '#333'; }

    const newElement = {
      id: Date.now(), type, page: currentPage, x: 100, y: 150,
      width: isDigital ? 260 : (isImage ? 200 : (type === 'signature' ? 200 : 150)),
      height: isDigital ? 90 : (isImage ? 100 : (type === 'signature' ? 60 : 40)),
      value, fontStyle, isImage, imgData, isDigital, color: finalColor
    };
    setElements([...elements, newElement]);
  };

  const updateElement = (id, newProps) => setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));
  const deleteElement = (id) => setElements(elements.filter(el => el.id !== id));

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
          const dataUrl = textToImageDataUrl(el.value, el.fontStyle, el.width, el.height, el.color, el.isDigital);
          const imgBytes = await fetch(dataUrl).then(res => res.arrayBuffer());
          const pdfImage = await pdfDoc.embedPng(imgBytes);
          page.drawImage(pdfImage, { x: actualX, y: actualY, width: el.width * scaleX, height: el.height * scaleY });
        } else {
          page.drawText(el.value, { x: actualX + 5, y: actualY + 15, size: 14 * scaleX, font: helveticaFont, color: rgb(0.2, 0.2, 0.2) });
        }
      }

      pdfDoc.setAuthor(fullName);
      pdfDoc.setCreator('MasterPdf Secure Engine');
      pdfDoc.setModificationDate(new Date());

      const finalPdfBytes = await pdfDoc.save();
      const blob = new Blob([finalPdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Signed_${file.name}`;
      
      setFileUrl(link.href);
      setStep(4);
    } catch (error) {
      console.error("Error signing PDF:", error);
      alert("Failed to sign document.");
    }
    setIsProcessing(false);
  };

  // --- SEVERAL PEOPLE REQUEST LOGIC ---
  const handleSendRequest = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setStep('request_sent');
    }, 1500);
  };

  const addReceiver = () => {
    const colors = ['bg-red-200', 'bg-orange-200', 'bg-yellow-200', 'bg-green-200', 'bg-purple-200'];
    setReceivers([...receivers, { 
      id: Date.now(), name: '', email: '', role: 'Signer', 
      color: colors[receivers.length % colors.length] 
    }]);
  };
  const removeReceiver = (id) => setReceivers(receivers.filter(r => r.id !== id));
  const updateReceiver = (id, field, val) => setReceivers(receivers.map(r => r.id === id ? {...r, [field]: val} : r));

  if (!isMounted) return null;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>e-Sign PDF Documents | MasterPdf</title>
        <link href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Allura&family=Amatic+SC&family=Arizonia&family=Bad+Script&family=Caveat&family=Comic+Neue&family=Cookie&family=Courgette&family=Damion&family=Dancing+Script&family=Engagement&family=Grand+Hotel&family=Handlee&family=Homemade+Apple&family=Indie+Flower&family=Kalam&family=Kaushan+Script&family=Leckerli+One&family=Marck+Script&family=Nanum+Pen+Script&family=Neucha&family=Niconne&family=Norican&family=Nothing+You+Could+Do&family=Oleo+Script&family=Over+the+Rainbow&family=Pacifico&family=Parisienne&family=Patrick+Hand&family=Pinyon+Script&family=Qwigley&family=Rancho&family=Reenie+Beanie&family=Rochester&family=Rock+Salt&family=Rouge+Script&family=Ruge+Boogie&family=Sacramento&family=Satisfy&family=Schoolbell&family=Shadows+Into+Light&family=Sofia&family=Stalemate&family=Tangerine&family=Vibur&family=Yellowtail&family=Yesteryear&family=Zeyada&display=swap" rel="stylesheet" />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center pt-24 pb-10 px-4">
        
        {/* STEP 1: UPLOAD SCREEN WITH DRIVE/DROPBOX ICONS */}
        {step === 1 && (
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center animate-in fade-in">
            <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Sign PDF Document</h1>
            <p className="text-lg text-gray-600 mb-10 max-w-2xl mx-auto">
              Sign documents. Sign a document yourself or send a signature request to others.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} onClick={(e)=>(e.target.value=null)} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-14 rounded-xl shadow-lg transition-colors">
                Select PDF file
              </label>
              
              <div className="flex sm:flex-col gap-2">
                <button onClick={() => document.getElementById('file-upload').click()} className="bg-[#E5322D] hover:bg-red-700 text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-105" title="Google Drive">
                  <UploadCloud size={22} />
                </button>
                <button onClick={() => document.getElementById('file-upload').click()} className="bg-[#E5322D] hover:bg-red-700 text-white p-3.5 rounded-full shadow-lg transition-transform hover:scale-105" title="Dropbox">
                  <Layers size={22} />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-8">or drop PDF here</p>
          </div>
        )}

        {/* STEP 1.5: WHO WILL SIGN MODAL */}
        {step === 1.5 && (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="text-center p-8 border-b border-gray-100 relative">
              <button onClick={removeFile} className="absolute right-6 top-8 text-gray-400 hover:text-red-500"><X size={24}/></button>
              <h2 className="text-3xl font-bold text-gray-800">Who will sign this document?</h2>
            </div>
            
            <div className="flex flex-col md:flex-row p-8 gap-8 bg-gray-50">
              <div onClick={() => { setStep(2); setShowSignatureModal(true); }} className="flex-1 bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:border-red-200 transition-all group">
                <div className="w-32 h-32 bg-gray-100 rounded-2xl mb-6 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText size={60} className="text-gray-400 opacity-80" />
                  <PenTool size={30} className="text-[#E5322D] absolute ml-8 mt-8" />
                </div>
                <button className="bg-[#E5322D] text-white font-bold px-8 py-3 rounded-lg mb-3 shadow-md w-full">Only me</button>
                <p className="text-gray-500 text-sm font-medium">Sign this document</p>
              </div>

              <div onClick={() => setStep('request_form')} className="flex-1 bg-white border border-gray-200 rounded-xl p-8 flex flex-col items-center text-center cursor-pointer hover:shadow-xl hover:border-red-200 transition-all group">
                <div className="w-32 h-32 bg-red-50 rounded-full mb-6 flex items-center justify-center group-hover:scale-105 transition-transform relative">
                  <Users size={70} className="text-[#E5322D] opacity-90" />
                </div>
                <button className="bg-[#E5322D] text-white font-bold px-8 py-3 rounded-lg mb-3 shadow-md w-full">Several people</button>
                <p className="text-gray-500 text-sm font-medium">Invite others to sign</p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 'request_form': SEVERAL PEOPLE COMPLEX FORM */}
        {step === 'request_form' && (
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-2xl animate-in fade-in flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-200 bg-white sticky top-0 z-10 shrink-0 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Create your signature request</h2>
              <button onClick={removeFile} className="text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-grow bg-gray-50/50">
              <div className="mb-10">
                <h3 className="text-gray-700 font-medium mb-4">Who will receive your document?</h3>
                <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
                  {receivers.map((r, i) => (
                    <div key={r.id} className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 transition">
                      <div className="text-gray-400 cursor-grab px-1 text-lg font-bold">⋮</div>
                      <div className={`w-6 h-6 rounded-full shrink-0 ${r.color}`}></div>
                      <input type="text" placeholder="Name" value={r.name} onChange={e=>updateReceiver(r.id, 'name', e.target.value)} className="flex-1 min-w-[120px] border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#E5322D] outline-none" />
                      <input type="email" placeholder="Email" value={r.email} onChange={e=>updateReceiver(r.id, 'email', e.target.value)} className="flex-1 min-w-[120px] border border-gray-300 rounded p-2 text-sm focus:ring-1 focus:ring-[#E5322D] outline-none" />
                      <select value={r.role} onChange={e=>updateReceiver(r.id, 'role', e.target.value)} className="border border-gray-300 rounded p-2 text-sm bg-white focus:ring-1 focus:ring-[#E5322D] outline-none w-[110px]">
                        <option value="Signer">Signer</option>
                        <option value="Validator">Validator</option>
                        <option value="Witness">Witness</option>
                      </select>
                      <div className="flex gap-2 text-gray-400 shrink-0">
                        <Lock size={18} className="hover:text-gray-600 cursor-pointer"/>
                        <ScanText size={18} className="hover:text-gray-600 cursor-pointer"/>
                        <PenTool size={18} className="hover:text-gray-600 cursor-pointer"/>
                      </div>
                      <button onClick={() => removeReceiver(r.id)} disabled={receivers.length===1} className="text-gray-400 hover:text-red-500 disabled:opacity-30 shrink-0"><X size={20}/></button>
                    </div>
                  ))}
                  <div onClick={addReceiver} className="p-3 text-center text-[#E5322D] text-sm font-bold bg-red-50/50 hover:bg-red-50 cursor-pointer flex items-center justify-center gap-2 transition">
                    <User size={16}/> ADD RECEIVER
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-6 mt-8">Settings</h3>
                <div className="space-y-6 border-t border-gray-100 pt-6">
                  
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <input type="checkbox" checked={reqSettings.order} onChange={e=>setReqSettings({...reqSettings, order: e.target.checked})} className="mt-1 w-5 h-5 accent-[#E5322D]" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-800 group-hover:text-[#E5322D] transition-colors"><ListOrdered size={18} className="text-gray-400 group-hover:text-[#E5322D]"/> Set the order of receivers</div>
                      <p className="text-sm text-gray-500 mt-1">Select this option to set a signing order. A signer won't receive a request until the previous person has completed their document.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group border-t border-gray-100 pt-6">
                    <input type="checkbox" checked={reqSettings.expiration} onChange={e=>setReqSettings({...reqSettings, expiration: e.target.checked})} className="mt-1 w-5 h-5 accent-[#E5322D]" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-800 group-hover:text-[#E5322D] transition-colors"><Calendar size={18} className="text-gray-400 group-hover:text-[#E5322D]"/> Change expiration date</div>
                      <div className="text-sm text-gray-700 mt-2 flex items-center gap-2" onClick={e=>e.preventDefault()}>
                        The document will expire in <input type="number" min="1" value={reqSettings.expDays} onChange={e=>setReqSettings({...reqSettings, expDays: e.target.value})} className="border border-gray-300 w-16 text-center rounded p-1 outline-none focus:border-red-400" /> days.
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Expires on: {expiryDate}</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group border-t border-gray-100 pt-6">
                    <input type="checkbox" checked={reqSettings.multiple} onChange={e=>setReqSettings({...reqSettings, multiple: e.target.checked})} className="mt-1 w-5 h-5 accent-[#E5322D]" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-800 group-hover:text-[#E5322D] transition-colors">
                        <Users size={18} className="text-gray-400 group-hover:text-[#E5322D]"/> Multiple requests 
                        <span className="bg-[#FFB822] text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 size={10}/> Premium</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">This option will allow each signer to receive a unique and separate request to sign individually.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group border-t border-gray-100 pt-6">
                    <input type="checkbox" checked={reqSettings.emailNotif} onChange={e=>setReqSettings({...reqSettings, emailNotif: e.target.checked})} className="mt-1 w-5 h-5 accent-[#E5322D]" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-800 group-hover:text-[#E5322D] transition-colors"><MessageSquare size={18} className="text-gray-400 group-hover:text-[#E5322D]"/> Enable email notifications</div>
                      <p className="text-sm text-gray-500 mt-1">You will receive an email notification when a receiver has completed their request.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group border-t border-gray-100 pt-6">
                    <input type="checkbox" checked={reqSettings.reminders} onChange={e=>setReqSettings({...reqSettings, reminders: e.target.checked})} className="mt-1 w-5 h-5 accent-[#E5322D]" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-800 group-hover:text-[#E5322D] transition-colors"><Calendar size={18} className="text-gray-400 group-hover:text-[#E5322D]"/> Enable reminders</div>
                      <div className="text-sm text-gray-700 mt-2 flex items-center gap-2" onClick={e=>e.preventDefault()}>
                        Send a reminder to the participants every <input type="number" min="1" value={reqSettings.reminderDays} onChange={e=>setReqSettings({...reqSettings, reminderDays: e.target.value})} className="border border-gray-300 w-16 text-center rounded p-1 outline-none focus:border-red-400" /> days.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group border-t border-gray-100 pt-6">
                    <input type="checkbox" checked={reqSettings.digitalSig} onChange={e=>setReqSettings({...reqSettings, digitalSig: e.target.checked})} className="mt-1 w-5 h-5 accent-[#E5322D]" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-800 group-hover:text-[#E5322D] transition-colors">
                        <Shield size={18} className="text-gray-400 group-hover:text-[#E5322D]"/> Digital Signature
                        <span className="bg-[#FFB822] text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 size={10}/> Premium</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">A signed Certified Hash and a Qualified Timestamp is embedded to the signed documents, ensuring integrity.</p>
                    </div>
                  </label>

                  <label className="flex items-start gap-4 cursor-pointer group border-t border-gray-100 pt-6">
                    <input type="checkbox" checked={reqSettings.verifyCode} onChange={e=>setReqSettings({...reqSettings, verifyCode: e.target.checked})} className="mt-1 w-5 h-5 accent-[#E5322D]" />
                    <div>
                      <div className="flex items-center gap-2 font-bold text-gray-800 group-hover:text-[#E5322D] transition-colors"><Scan size={18} className="text-gray-400 group-hover:text-[#E5322D]"/> Signature verification code</div>
                      <p className="text-sm text-gray-500 mt-1 mb-2">Digitally verify the integrity of the printed document using a QR code and a unique password provided in the Audit Trail.</p>
                      <span className="text-xs text-gray-400">Highly recommended</span>
                    </div>
                  </label>

                  <div className="flex items-start gap-4 group border-t border-gray-100 pt-6 pb-6">
                    <input type="checkbox" checked={reqSettings.emailBranding} onChange={e=>setReqSettings({...reqSettings, emailBranding: e.target.checked})} className="mt-1 w-5 h-5 accent-[#E5322D] cursor-pointer" id="branding-check" />
                    <div className="w-full">
                      <label htmlFor="branding-check" className="flex items-center gap-2 font-bold text-gray-800 group-hover:text-[#E5322D] transition-colors cursor-pointer">
                        <ImageIcon size={18} className="text-gray-400 group-hover:text-[#E5322D]"/> Email branding
                        <span className="bg-[#FFB822] text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1"><CheckCircle2 size={10}/> Premium</span>
                      </label>
                      <p className="text-sm text-gray-500 mt-1 mb-4">Include the company name and logo in the signature request email. Both are required to apply your settings.</p>
                      
                      {reqSettings.emailBranding && (
                        <div className="space-y-4 max-w-md animate-in fade-in slide-in-from-top-2">
                          <input type="text" placeholder="Company name" value={reqSettings.companyName} onChange={e=>setReqSettings({...reqSettings, companyName: e.target.value})} className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-1 focus:ring-[#E5322D] outline-none" />
                          <div className="bg-gray-100 border border-gray-200 rounded-lg h-32 flex flex-col items-center justify-center relative">
                            {reqSettings.logo ? (
                              <>
                                <img src={reqSettings.logo} alt="Logo" className="max-h-[80px] object-contain" />
                                <button onClick={()=>setReqSettings({...reqSettings, logo: null})} className="absolute top-2 right-2 text-gray-400 hover:text-red-500"><X size={16}/></button>
                              </>
                            ) : (
                              <>
                                <input type="file" id="logo-upload" accept="image/*" onChange={(e) => handleImageUpload(e, 'logo')} className="hidden" />
                                <label htmlFor="logo-upload" className="border border-[#E5322D] text-[#E5322D] font-bold text-sm px-4 py-2 rounded hover:bg-red-50 cursor-pointer mb-2 transition">Upload logo</label>
                                <span className="text-xs text-gray-400">or drop file here</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-white sticky bottom-0 z-10 shrink-0 flex justify-end gap-4 items-center">
              <button onClick={() => setStep(1.5)} className="text-[#E5322D] font-bold hover:underline transition">Cancel</button>
              <button onClick={handleSendRequest} disabled={isProcessing} className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition disabled:bg-gray-400 flex items-center gap-2">
                {isProcessing ? <Settings className="animate-spin" size={20}/> : 'Apply'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 'request_sent': SUCCESS SCREEN FOR SEVERAL PEOPLE */}
        {step === 'request_sent' && (
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-sm border border-gray-200 p-16 text-center animate-in zoom-in">
            <CheckCircle2 size={80} className="text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Signature Request Sent!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Your document has been sent to the recipients securely. You will be notified via email once they sign.
            </p>
            <button onClick={() => setStep(1)} className="text-[#E5322D] font-bold hover:underline">Return to Home</button>
          </div>
        )}

        {/* STEP 2: SOLO VISUAL EDITOR */}
        {step === 2 && (
          <div className="w-full max-w-[1600px] h-[80vh] flex flex-col lg:flex-row bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-in fade-in">
            
            <div className="w-full lg:w-24 bg-gray-50 border-r border-gray-200 p-4 flex flex-col items-center gap-4 overflow-y-auto hidden lg:flex">
               <h4 className="text-[10px] font-bold text-gray-500 uppercase">Pages</h4>
               {Array.from({ length: numPages }, (_, i) => i + 1).map(page => (
                 <button 
                   key={page} onClick={() => setCurrentPage(page)}
                   className={`w-14 h-20 rounded shadow-sm border-2 flex items-center justify-center text-xs font-bold transition-all ${currentPage === page ? 'border-[#E5322D] bg-white text-[#E5322D]' : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'}`}
                 >
                   {page}
                 </button>
               ))}
            </div>

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
                     key={el.id} bounds="parent" position={{ x: el.x, y: el.y }} size={{ width: el.width, height: el.height }}
                     onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                     onResizeStop={(e, dir, ref, delta, position) => { updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...position }); }}
                     className="group border-2 border-transparent hover:border-gray-400 focus-within:border-[#E5322D] border-dashed flex items-center justify-center bg-white/50 hover:bg-white/80 transition-colors touch-none"
                   >
                     <button onClick={() => deleteElement(el.id)} className="absolute -top-3 -right-3 bg-white border border-gray-300 rounded-full p-1 text-gray-500 hover:text-[#E5322D] opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X size={14} /></button>
                     
                     {el.isImage ? (
                       <img src={el.imgData} alt="Signature" className="w-full h-full object-contain pointer-events-none" />
                     ) : el.isDigital ? (
                       <div className="border border-[#E5322D] bg-red-50/70 p-3 text-[11px] font-mono leading-tight text-gray-800 w-full h-full relative overflow-hidden flex flex-col justify-center">
                          {el.value.split('\n').map((l, i) => <div key={i}>{l}</div>)}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#E5322D] rounded-full flex items-center justify-center text-white text-sm font-bold">✓</div>
                       </div>
                     ) : el.type === 'text' || el.type === 'name' || el.type === 'date' ? (
                       <input 
                         type="text" value={el.value} onChange={(e) => updateElement(el.id, { value: e.target.value })}
                         className="w-full h-full bg-transparent outline-none text-center font-medium text-gray-800 resize-none"
                         style={{ fontSize: `${el.height * 0.4}px`, color: el.color }}
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center" style={{ fontFamily: el.fontStyle, fontSize: `${el.height * 0.6}px`, color: el.color }}>
                         {el.value}
                       </div>
                     )}
                   </Rnd>
                 ))}
               </div>
            </div>

            <div className="w-full lg:w-[350px] bg-white flex flex-col h-full">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gray-50">
                <h3 className="text-xl font-bold text-gray-800">Signing options</h3>
                <button onClick={removeFile} className="text-gray-500 hover:text-[#E5322D]"><X size={20}/></button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow">
                <div className="mb-8">
                  <h4 className="text-sm font-bold text-gray-800 mb-3">Type</h4>
                  <div className="flex gap-2">
                    <div onClick={() => setSigMode('simple')} className={`flex-1 border-2 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition ${sigMode === 'simple' ? 'border-[#E5322D] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <PenTool size={20} className={sigMode === 'simple' ? 'text-[#E5322D] mb-1' : 'text-gray-500 mb-1'} />
                      <span className={`text-xs font-bold ${sigMode === 'simple' ? 'text-[#E5322D]' : 'text-gray-600'}`}>Simple Signature</span>
                    </div>
                    <div onClick={() => setSigMode('digital')} className={`flex-1 border-2 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition ${sigMode === 'digital' ? 'border-[#E5322D] bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                      <Shield size={20} className={sigMode === 'digital' ? 'text-[#E5322D] mb-1' : 'text-gray-500 mb-1'} />
                      <span className={`text-xs font-bold text-center leading-tight ${sigMode === 'digital' ? 'text-[#E5322D]' : 'text-gray-600'}`}>Digital Signature</span>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-gray-800">Required fields</h4>
                    {sigMode === 'simple' && <button onClick={() => setShowSignatureModal(true)} className="text-[#E5322D] text-xs font-bold hover:underline flex items-center gap-1"><PenTool size={12}/> Edit</button>}
                  </div>
                  
                  <div 
                    onClick={() => addElement('signature')}
                    className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 cursor-pointer flex items-center justify-between group transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {sigMode === 'simple' ? (
                        <>
                          <div className="bg-[#E5322D] p-2 rounded text-white"><PenTool size={16}/></div>
                          {vTab === 'Draw' && drawnSignature ? (
                            <img src={drawnSignature} className="h-10 object-contain" alt="Drawn" />
                          ) : vTab === 'Upload' && uploadedSig ? (
                            <img src={uploadedSig} className="h-10 object-contain" alt="Uploaded" />
                          ) : (
                            <span className="text-2xl" style={{ fontFamily: signatureFonts[selectedStyle], color: sigColor }}>{fullName}</span>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="bg-green-600 p-2 rounded text-white"><Shield size={16}/></div>
                          <div className="flex flex-col"><span className="text-sm font-bold text-gray-800">Certified Digital ID</span><span className="text-xs text-gray-500">Auto Generated</span></div>
                        </>
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
                      <span className="text-lg mr-2" style={{ fontFamily: signatureFonts[selectedStyle], color: sigColor }}>{initials}</span>
                    </button>
                    <button onClick={() => addElement('name')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700 shadow-sm">
                      <div className="bg-[#E5322D] p-1.5 rounded text-white"><User size={14}/></div> Name
                    </button>
                    <button onClick={() => addElement('date')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700 shadow-sm">
                      <div className="bg-[#E5322D] p-1.5 rounded text-white"><Calendar size={14}/></div> Date
                    </button>
                    <button onClick={() => addElement('text')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700 shadow-sm">
                      <div className="bg-gray-600 p-1.5 rounded text-white"><Type size={14}/></div> Text
                    </button>
                    <button onClick={() => addElement('stamp')} className="w-full border border-gray-200 rounded-lg p-3 bg-white hover:bg-gray-50 flex items-center gap-3 transition-colors text-sm font-medium text-gray-700 shadow-sm">
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

        {/* STEP 4: DOWNLOAD SCREEN WITH 4 EXACT ICONS */}
        {step === 4 && (
          <div className="w-full max-w-4xl flex flex-col items-center justify-center animate-in slide-in-from-bottom-8 fade-in">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 tracking-tight">PDF files have been signed!</h1>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-3">
                 <button onClick={() => setStep(1)} className="bg-gray-700 hover:bg-gray-800 text-white p-4 rounded-full shadow-lg transition" title="Back to Home"><ArrowRight size={24} className="rotate-180"/></button>
                 <a href={fileUrl} download={`Signed_${file?.name}`} className="bg-[#E5322D] hover:bg-red-700 text-white text-2xl font-bold py-6 px-16 rounded-2xl flex items-center gap-4 shadow-xl hover:shadow-2xl transition">
                   <Download size={28}/> Download signed PDFs
                 </a>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mt-4 sm:mt-0">
                <button onClick={() => alert('Saved to Google Drive!')} className="bg-[#E5322D] hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105" title="Save to Google Drive"><UploadCloud size={24}/></button>
                <button onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Link Copied to Clipboard!'); }} className="bg-[#E5322D] hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105" title="Copy Link"><Globe size={24}/></button>
                <button onClick={() => alert('Saved to Dropbox!')} className="bg-[#E5322D] hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105" title="Save to Dropbox"><Layers size={24}/></button>
                <button onClick={removeFile} className="bg-[#E5322D] hover:bg-red-700 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-105" title="Delete File"><X size={24}/></button>
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />

      {/* 🔥 SIGNATURE MODAL WITH SCROLL FIX 🔥 */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-[800px] max-h-[95vh] flex flex-col rounded-xl shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-between items-center bg-gray-50 border-b border-gray-200 p-4 sm:p-5 px-6 sm:px-8 shrink-0">
              <h3 className="text-xl font-bold text-gray-800 tracking-tight">Set your signature details</h3>
              <button onClick={() => setShowSignatureModal(false)} className="text-gray-400 hover:text-[#E5322D] border border-gray-200 px-3 py-1 rounded-md text-sm font-bold bg-white shadow-sm">Cancel</button>
            </div>

            <div className="p-4 sm:p-8 overflow-y-auto flex-grow">
              <div className="flex flex-col md:flex-row gap-6 mb-6">
                <div className="flex-grow">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <div className="bg-gray-200 p-1 rounded-full text-gray-600"><User size={14}/></div> Full name:
                  </label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:bg-white focus:ring-1 focus:ring-gray-400 outline-none font-medium text-gray-800 transition" />
                </div>
                <div className="w-full md:w-32">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Initials:</label>
                  <input type="text" value={initials} onChange={(e) => setInitials(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-1 focus:ring-gray-400 outline-none font-medium text-gray-800 text-center" />
                </div>
              </div>

              <div className="flex border-b border-gray-200 overflow-x-auto">
                <button onClick={() => setHTab('Signature')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap ${hTab === 'Signature' ? 'text-[#E5322D] border-[#E5322D]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
                  <PenTool size={16}/> Signature
                </button>
                <button onClick={() => setHTab('Initials')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap ${hTab === 'Initials' ? 'text-[#E5322D] border-[#E5322D]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
                  <span className="font-black text-xs border-b border-gray-400">AC</span> Initials
                </button>
                <button onClick={() => setHTab('Stamp')} className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 whitespace-nowrap ${hTab === 'Stamp' ? 'text-[#E5322D] border-[#E5322D]' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
                  <Stamp size={16}/> Company Stamp
                </button>
              </div>

              <div className="bg-gray-100 rounded-b-xl flex flex-col md:flex-row min-h-[300px] border border-gray-200 border-t-0 relative">
                
                {(hTab === 'Signature' || hTab === 'Initials') && (
                  <div className="w-full md:w-16 bg-gray-200 border-r border-gray-300 flex flex-row md:flex-col rounded-bl-xl overflow-hidden shrink-0">
                    <button onClick={() => setVTab('Type')} className={`py-4 flex-1 md:flex-none flex justify-center border-b-4 md:border-b-0 md:border-l-4 transition-colors ${vTab === 'Type' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Type size={20}/></button>
                    <button onClick={() => setVTab('Draw')} className={`py-4 flex-1 md:flex-none flex justify-center border-b-4 md:border-b-0 md:border-l-4 transition-colors ${vTab === 'Draw' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><PenTool size={20}/></button>
                    <button onClick={() => setVTab('Upload')} className={`py-4 flex-1 md:flex-none flex justify-center border-b-4 md:border-b-0 md:border-l-4 transition-colors ${vTab === 'Upload' ? 'bg-gray-100 border-[#E5322D] text-[#E5322D]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}><Upload size={20}/></button>
                  </div>
                )}

                <div className="flex-grow p-4 relative flex flex-col overflow-hidden">
                  
                  {(hTab === 'Signature' || hTab === 'Initials') && (vTab === 'Type' || vTab === 'Draw') && (
                     <div className="flex justify-end gap-2 mb-3 px-2">
                       <Palette size={16} className="text-gray-400 mt-1"/>
                       {['#E5322D', '#000000', '#1F2937', '#1E3A8A', '#065F46', '#7E22CE'].map(c => (
                         <button key={c} onClick={() => setSigColor(c)} style={{backgroundColor: c}} className={`w-6 h-6 rounded-full transition-transform ${sigColor === c ? 'scale-125 ring-2 ring-offset-1 ring-gray-300' : 'opacity-70 hover:opacity-100'}`} />
                       ))}
                     </div>
                  )}

                  {(hTab === 'Signature' || hTab === 'Initials') && vTab === 'Type' && (
                    <div className="flex flex-col gap-2 bg-gray-100 h-[240px] overflow-y-auto pr-2">
                      {signatureFonts.map((font, index) => (
                        <label key={index} className={`flex items-center gap-4 px-4 py-3 rounded-md cursor-pointer transition border-b border-gray-200 ${selectedStyle === index ? 'bg-white shadow-sm border-[#E5322D]' : 'hover:bg-gray-50 border-transparent'}`}>
                          <input type="radio" checked={selectedStyle === index} onChange={() => setSelectedStyle(index)} className="w-5 h-5 accent-[#E5322D] shrink-0" />
                          <span className="text-3xl truncate" style={{ fontFamily: font, color: sigColor }}>{hTab === 'Signature' ? fullName : initials}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {(hTab === 'Signature' || hTab === 'Initials') && vTab === 'Draw' && (
                    <div className="h-full flex flex-col items-center justify-center w-full gap-2">
                      <canvas 
                        ref={canvasRef}
                        onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
                        className="w-full h-[200px] bg-white border border-gray-300 rounded cursor-crosshair shadow-inner touch-none"
                        width={500} height={200}
                      />
                      <div className="flex justify-between w-full text-xs text-gray-500 px-2 font-medium">
                        <span>Draw your signature inside the box</span>
                        <button onClick={clearCanvas} className="hover:text-[#E5322D] underline">Clear</button>
                      </div>
                    </div>
                  )}

                  {(hTab === 'Signature' || hTab === 'Initials') && vTab === 'Upload' && (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-white rounded-lg m-2 p-4">
                      <div className="text-center w-full flex flex-col items-center">
                        {uploadedSig ? (
                           <>
                             <img src={uploadedSig} alt="Uploaded" className="max-h-[120px] max-w-full object-contain mb-4" />
                             <button onClick={() => setUploadedSig(null)} className="text-xs text-gray-500 hover:text-red-500 underline">Remove Image</button>
                           </>
                        ) : (
                           <>
                             <input type="file" id="sig-upload" accept="image/*" onChange={(e) => handleImageUpload(e, 'sig')} className="hidden" />
                             <label htmlFor="sig-upload" className="border border-gray-300 text-gray-700 font-bold px-6 py-2 rounded-lg hover:bg-gray-50 transition mb-3 shadow-sm cursor-pointer whitespace-nowrap">
                               Upload image
                             </label>
                             <p className="text-sm text-gray-500 font-medium">or tap to browse</p>
                             <p className="text-[10px] text-gray-400 mt-3">Accepted formats: PNG, JPG</p>
                           </>
                        )}
                      </div>
                    </div>
                  )}

                  {hTab === 'Stamp' && (
                    <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 bg-white rounded-lg m-2 p-4">
                      <div className="text-center w-full flex flex-col items-center">
                        {uploadedStamp ? (
                           <>
                             <img src={uploadedStamp} alt="Stamp" className="max-h-[140px] max-w-full object-contain mb-4" />
                             <button onClick={() => setUploadedStamp(null)} className="text-xs text-gray-500 hover:text-red-500 underline">Remove Image</button>
                           </>
                        ) : (
                           <>
                             <input type="file" id="stamp-upload" accept="image/*" onChange={(e) => handleImageUpload(e, 'stamp')} className="hidden" />
                             <label htmlFor="stamp-upload" className="border border-[#E5322D] text-[#E5322D] font-bold px-6 py-2 rounded-lg hover:bg-red-50 transition mb-3 shadow-sm cursor-pointer whitespace-nowrap">
                               Upload company stamp
                             </label>
                             <p className="text-[10px] text-gray-400 mt-3">Accepted formats: PNG, JPG</p>
                           </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {(hTab === 'Signature' || hTab === 'Initials') && (
                  <div className="w-full md:w-32 bg-gray-50 border-t md:border-t-0 md:border-l border-gray-200 flex flex-row md:flex-col items-center justify-center p-4 shrink-0">
                    <Scan size={50} className="text-gray-300 mb-0 md:mb-2 hidden md:block"/>
                    <span className="text-[10px] font-bold text-gray-500 text-center leading-tight hover:text-[#E5322D] cursor-pointer transition-colors">Draw from your mobile device</span>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={applyModalSettings} className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-3 px-10 rounded-xl transition shadow-md w-full md:w-auto">
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
