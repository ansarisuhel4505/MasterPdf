import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import dynamic from 'next/dynamic';
import JSZip from 'jszip';
import { upload } from '@vercel/blob/client';
import { 
  UploadCloud, FileText, X, CheckSquare, ArrowRight, Settings, 
  Lock, RefreshCw, Layers, Signature, FileOutput,
  Trash2, Upload, Sparkles 
} from 'lucide-react';

import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

const DocumentWithSSR = dynamic(() => import('react-pdf').then(m => m.Document), { ssr: false });
const PageWithSSR = dynamic(() => import('react-pdf').then(m => m.Page), { ssr: false });
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PdfForms() {
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [totalPages, setTotalPages] = useState(0);
  const [renderError, setRenderError] = useState(false);

  // TABS: 'fill', 'overlay', 'batch', 'export'
  const [activeTab, setActiveTab] = useState('fill'); 
  
  // OVERLAY STATES
  const [overlayMode, setOverlayMode] = useState('text'); 
  const [overlayText, setOverlayText] = useState('');
  const [overlayPage, setOverlayPage] = useState(1);
  const [overlayColor, setOverlayColor] = useState('#000000');
  const [overlaySize, setOverlaySize] = useState(20);
  const [overlayPosition, setOverlayPosition] = useState('bottom-right'); // 🔥 NEW: Position Setting
  const [signatureDataUrl, setSignatureDataUrl] = useState(null);
  
  const signatureCanvasRef = useRef(null);
  const isDrawingRef = useRef(false); 

  // EXPORT / SECURITY STATES
  const [password, setPassword] = useState('');
  const [flattenForm, setFlattenForm] = useState(true);
  const [metadataAuthor, setMetadataAuthor] = useState('');
  const [metadataTitle, setMetadataTitle] = useState('');

  const [csvData, setCsvData] = useState([]);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }
    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));
    setIsLoading(true);
    setRenderError(false);
    setSignatureDataUrl(null);
    setCsvData([]);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setTotalPages(pdfDoc.getPageCount());

      const form = pdfDoc.getForm();
      const fields = form.getFields();
      const extractedFields = fields.map(f => {
        let type = 'unknown';
        if (f.constructor.name === 'PDFTextField') type = 'text';
        else if (f.constructor.name === 'PDFCheckBox') type = 'checkbox';
        else if (f.constructor.name === 'PDFDropdown') type = 'dropdown';
        else if (f.constructor.name === 'PDFRadioGroup') type = 'radio';
        return { name: f.getName(), type };
      });
      const validFields = extractedFields.filter(f => f.type !== 'unknown');
      setFormFields(validFields);

      const initialData = {};
      validFields.forEach(f => {
        initialData[f.name] = f.type === 'checkbox' ? false : '';
      });
      setFormData(initialData);
    } catch (error) {
      console.error("Error reading PDF:", error);
      alert("Could not detect interactive form fields.");
      setFile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileUrl(null);
    setFormFields([]);
    setFormData({});
    setCsvData([]);
    setSignatureDataUrl(null);
  };

  const handleInputChange = (name, value, type) => {
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? !prev[name] : value
    }));
  };

  // 🔥 100% RESPONSIVE SIGNATURE DRAWING 🔥
  const handlePointerDown = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    if (!signatureDataUrl) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    isDrawingRef.current = true;
  };

  const handlePointerMove = (e) => {
    if (!isDrawingRef.current) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#000000'; 
    ctx.lineWidth = 2; 
    ctx.stroke();
  };

  const handlePointerUp = () => {
    isDrawingRef.current = false;
    if (signatureCanvasRef.current) {
      setSignatureDataUrl(signatureCanvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return alert("CSV must have a header row and at least 1 data row.");
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ''; });
        return obj;
      });
      setCsvData(rows);
    };
    reader.readAsText(file);
  };

  // 🔥 MAIN PROCESS 🔥
  const processPdf = async (mode = 'single') => {
    if (!file) return alert("Please upload a base PDF form.");
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const baseDoc = await PDFDocument.load(arrayBuffer);
      const form = baseDoc.getForm();
      
      // A. Fill Existing Form Fields
      formFields.forEach(field => {
        if (field.type === 'text') {
          const f = form.getTextField(field.name);
          if (f && formData[field.name]) f.setText(formData[field.name]);
        } 
        else if (field.type === 'checkbox') {
          const f = form.getCheckBox(field.name);
          if (f) {
            if (formData[field.name]) f.check();
            else f.uncheck();
          }
        }
        else if (field.type === 'dropdown') {
          const f = form.getDropdown(field.name);
          if (f && formData[field.name]) f.select(formData[field.name]);
        }
      });

      // B. OVERLAY FIX (Perfect Positioning System)
      if (activeTab === 'overlay' || overlayText || signatureDataUrl) {
        const pageIndex = Math.min(Math.max(1, overlayPage), totalPages) - 1;
        const page = baseDoc.getPage(pageIndex);
        const { width, height } = page.getSize();

        // 🎯 Position Calculator
        const getCoords = (itemWidth, itemHeight) => {
          const pad = 40;
          if (overlayPosition === 'bottom-right') return { x: width - itemWidth - pad, y: pad };
          if (overlayPosition === 'bottom-left') return { x: pad, y: pad };
          if (overlayPosition === 'top-right') return { x: width - itemWidth - pad, y: height - itemHeight - pad };
          if (overlayPosition === 'top-left') return { x: pad, y: height - itemHeight - pad };
          return { x: (width - itemWidth) / 2, y: (height - itemHeight) / 2 };
        };

        if (overlayMode === 'text' && overlayText.trim()) {
          const font = await baseDoc.embedFont(StandardFonts.Helvetica);
          const textWidth = font.widthOfTextAtSize(overlayText, overlaySize);
          const { x, y } = getCoords(textWidth, overlaySize);

          const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(overlayColor);
          const r = result ? parseInt(result[1], 16) / 255 : 0;
          const g = result ? parseInt(result[2], 16) / 255 : 0;
          const b = result ? parseInt(result[3], 16) / 255 : 0;

          page.drawText(overlayText, { x, y, size: overlaySize, font, color: rgb(r, g, b) });
        } 
        
        if (overlayMode === 'signature' && signatureDataUrl) {
          // 🔥 FIX: Properly extracting Base64 to prevent crash
          const base64Data = signatureDataUrl.split(',')[1];
          const pngImage = await baseDoc.embedPng(base64Data);
          const { x, y } = getCoords(150, 75);
          page.drawImage(pngImage, { x, y, width: 150, height: 75 });
        }
      }

      // C. Flatten Form (Lock fields)
      if (flattenForm && mode !== 'batch') {
        form.flatten(); 
      }

      // D. Metadata Fix
      if (metadataAuthor.trim()) baseDoc.setAuthor(metadataAuthor.trim());
      if (metadataTitle.trim()) baseDoc.setTitle(metadataTitle.trim());

      const finalBytes = await baseDoc.save();

      // E. Batch Mode (CSV)
      if (mode === 'batch' && csvData.length > 0) {
        const zip = new JSZip();
        for (let rowIdx = 0; rowIdx < csvData.length; rowIdx++) {
          const row = csvData[rowIdx];
          const docCopy = await PDFDocument.load(arrayBuffer);
          const formCopy = docCopy.getForm();
          
          formFields.forEach(field => {
            const val = row[field.name];
            if (!val) return;
            if (field.type === 'text') {
              const f = formCopy.getTextField(field.name);
              if (f) f.setText(val);
            } else if (field.type === 'checkbox') {
              const f = formCopy.getCheckBox(field.name);
              if (f && (val.toLowerCase() === 'true' || val === '1')) f.check();
            }
          });

          if (flattenForm) formCopy.flatten();
          const bytes = await docCopy.save();
          zip.file(`Filled_Form_${rowIdx+1}.pdf`, bytes);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'Batch_Filled_Forms.zip';
        link.click();
        setIsProcessing(false);
        return;
      }

      // F. Normal Download & Password Encryption (Vercel Backend)
      if (password && mode !== 'batch') {
        try {
          const pdfBlob = new Blob([finalBytes], { type: 'application/pdf' });
          const pdfFile = new File([pdfBlob], `Protected_${Date.now()}.pdf`, { type: 'application/pdf' });
          
          // 🛡️ Frontend cannot encrypt existing PDFs natively, relying on Vercel Backend
          const uploadBlob = await upload(pdfFile.name, pdfFile, { access: 'public', handleUploadUrl: '/api/upload' });
          const response = await fetch('/api/master-convert', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'protect-pdf', fileUrl: uploadBlob.url, password })
          });

          const data = await response.json();
          if (response.ok && data.downloadUrl) {
            window.location.href = data.downloadUrl;
          } else {
            alert("Vercel Backend missing or failed. Downloading standard Unencrypted PDF.");
            triggerDownload(finalBytes, file.name);
          }
        } catch (error) {
          alert("Server connection failed. Downloading standard Unencrypted PDF.");
          triggerDownload(finalBytes, file.name);
        }
      } else {
        triggerDownload(finalBytes, file.name);
      }

    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Failed to process the PDF. " + error.message);
    }
    setIsProcessing(false);
  };

  const triggerDownload = (bytes, fileName) => {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MasterPdf_Filled_${fileName}`;
    link.click();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Fill PDF Forms & Sign - MasterPdf</title></Head>
      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Sparkles size={14} /> Pro Automation Suite
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">PDF Forms & Automation</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Fill forms, add text/signature overlays, automate with CSV batch processing, and secure your output.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden relative">
          
          {!file ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center p-10 bg-gray-50/50">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl">
                <UploadCloud size={28} /> Upload Fillable PDF
              </label>
            </div>
          ) : isLoading ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center bg-gray-50">
              <Settings size={48} className="animate-spin text-[#E5322D] mb-4" />
              <p className="text-gray-600 font-medium">Analyzing PDF...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              
              {/* 🔥 NEW CENTRALIZED TABS 🔥 */}
              <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1 overflow-x-auto sticky top-[72px] z-20 shadow-sm">
                {['fill', 'overlay', 'batch', 'export'].map((tab) => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab ? 'bg-[#E5322D] text-white shadow-md' : 'text-gray-800 hover:bg-white hover:shadow-sm'}`}>
                    {tab === 'fill' ? '📝 Fill Form' : tab === 'overlay' ? '🖊️ Overlay' : tab === 'batch' ? '📦 Batch' : '⚙️ Finalize & Export'}
                  </button>
                ))}
              </div>

              <div className="flex flex-col md:flex-row h-full relative p-6 gap-8">
                
                <div className="w-full md:w-1/2 min-h-[400px] bg-gray-50 border border-gray-200 rounded-xl p-4 overflow-y-auto max-h-[600px] relative">
                  <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm z-20"><X size={20} /></button>
                  
                  {renderError ? (
                    <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-sm">
                        <p className="text-sm text-gray-700 mb-4">Preview failed. Retry?</p>
                        <button onClick={() => window.location.reload()} className="flex items-center gap-2 bg-[#E5322D] text-white py-2 px-6 rounded-lg hover:bg-red-700 transition font-bold"><RefreshCw size={18} /> Reload</button>
                      </div>
                    </div>
                  ) : (
                    <DocumentWithSSR file={fileUrl} loading={<div className="text-center py-10 text-gray-500">Loading preview...</div>} onLoadError={() => setRenderError(true)}>
                      <div className="flex flex-col gap-6 items-center pb-4">
                        {Array.from(new Array(totalPages), (el, index) => (
                          <div key={`page_${index + 1}`} className="relative border border-gray-300 shadow-md rounded bg-white overflow-hidden">
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 pointer-events-none">
                              Page {index + 1}
                            </div>
                            <PageWithSSR pageNumber={index + 1} width={400} renderTextLayer={false} renderAnnotationLayer={true} />
                          </div>
                        ))}
                      </div>
                    </DocumentWithSSR>
                  )}
                  <div className="mt-2 text-center text-xs font-bold text-gray-700 bg-white/80 px-3 py-1 border rounded-full w-fit mx-auto">
                    {totalPages} Page{totalPages > 1 ? 's' : ''} | {formFields.length} Fields Detected
                  </div>
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-between gap-4">
                  
                  {activeTab === 'fill' && (
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2"><CheckSquare size={18} className="text-[#E5322D]" /> Fill Your Details</h3>
                      {formFields.length === 0 ? (
                        <div className="text-center p-6 bg-orange-50 text-orange-600 rounded-lg border border-orange-200">
                          <p className="font-bold mb-2">No interactive fields found.</p>
                          <p className="text-sm">This is a flat PDF. Use the <strong>Overlay</strong> tab to add text and signature manually.</p>
                        </div>
                      ) : (
