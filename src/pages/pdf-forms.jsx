import React, { useState, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  UploadCloud, X, CheckSquare, ArrowRight, Settings, 
  Lock, RefreshCw, Layers, FileOutput, Trash2, Upload, Sparkles, Edit3 
} from 'lucide-react';

// 🔥 THE ULTIMATE FIX: No dynamic imports, direct static import for react-pdf 🔥
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Worker Setup (Strictly .mjs for Vercel/Next.js compatibility)
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
  const [overlayPosition, setOverlayPosition] = useState('bottom-right');
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

  const processPdf = async (mode = 'single') => {
    if (!file) return alert("Please upload a base PDF form.");
    setIsProcessing(true);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const baseDoc = await PDFDocument.load(arrayBuffer);
      const form = baseDoc.getForm();
      
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

      if (validateRequired) {
        let missing = [];
        formFields.forEach(f => {
          if (f.type !== 'checkbox' && !formData[f.name]?.trim()) missing.push(f.name);
        });
        if (missing.length > 0) {
          alert(`Please fill required fields: ${missing.join(', ')}`);
          setIsProcessing(false);
          return;
        }
      }

      if (activeTab === 'overlay' || overlayText || signatureDataUrl) {
        const pageIndex = Math.min(Math.max(1, overlayPage), totalPages) - 1;
        const page = baseDoc.getPage(pageIndex);
        const { width, height } = page.getSize();

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
          const base64Data = signatureDataUrl.split(',')[1];
          const pngImage = await baseDoc.embedPng(base64Data);
          const { x, y } = getCoords(150, 75);
          page.drawImage(pngImage, { x, y, width: 150, height: 75 });
        }
      }

      if (flattenForm && mode !== 'batch') {
        try {
          form.flatten(); 
        } catch(e) {
          console.warn("Could not flatten form entirely", e);
        }
      }

      if (metadataAuthor.trim()) baseDoc.setAuthor(metadataAuthor.trim());
      if (metadataTitle.trim()) baseDoc.setTitle(metadataTitle.trim());

      const finalBytes = await baseDoc.save();

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

          if (flattenForm) {
            try { formCopy.flatten(); } catch(e) {}
          }
          const bytes = await docCopy.save();
          zip.file(`Filled_Form_${rowIdx+1}.pdf`, bytes);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'Batch_Filled_Forms.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsProcessing(false);
        return;
      }

      if (password && mode !== 'batch') {
        alert("Notice: Advanced encryption requires a backend server. Generating standard PDF to your device.");
      }
      
      const blob = new Blob([finalBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Filled_${file.name}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("Failed to process the PDF. " + error.message);
    }
    setIsProcessing(false);
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
                <UploadCloud size={28} /> Upload PDF
              </label>
            </div>
          ) : isLoading ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center bg-gray-50">
              <Settings size={48} className="animate-spin text-[#E5322D] mb-4" />
              <p className="text-gray-600 font-medium">Analyzing PDF...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              
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
                    <Document file={fileUrl} loading={<div className="text-center py-10 text-gray-500">Loading preview...</div>} onLoadError={() => setRenderError(true)}>
                      <div className="flex flex-col gap-6 items-center pb-4">
                        {Array.from(new Array(totalPages), (el, index) => (
                          <div key={`page_${index + 1}`} className="relative border border-gray-300 shadow-md rounded bg-white overflow-hidden">
                            <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10 pointer-events-none">
                              Page {index + 1}
                            </div>
                            <Page pageNumber={index + 1} width={400} renderTextLayer={false} renderAnnotationLayer={true} />
                          </div>
                        ))}
                      </div>
                    </Document>
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
                        formFields.map((field, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="block text-sm font-bold text-gray-800 mb-1 truncate">{field.name}</label>
                            {field.type === 'text' && <input type="text" value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value, 'text')} className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#E5322D] outline-none" placeholder="Type here..." />}
                            {field.type === 'checkbox' && <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-800 text-sm"><input type="checkbox" checked={formData[field.name] || false} onChange={() => handleInputChange(field.name, null, 'checkbox')} className="w-5 h-5 text-[#E5322D] rounded border-gray-300 accent-[#E5322D]" /><span>Check/Uncheck</span></label>}
                            {field.type === 'dropdown' && <input type="text" value={formData[field.name] || ''} onChange={(e) => handleInputChange(field.name, e.target.value, 'text')} className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#E5322D] outline-none" placeholder="Enter dropdown value" />}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === 'overlay' && (
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2"><Layers size={18} className="text-[#E5322D]" /> Add Text / Signature Overlay</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <div className="flex gap-3">
                          <button onClick={() => setOverlayMode('text')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${overlayMode === 'text' ? 'bg-[#E5322D] text-white' : 'bg-gray-200 text-gray-800'}`}>Text</button>
                          <button onClick={() => setOverlayMode('signature')} className={`flex-1 py-2 rounded-lg font-bold text-sm ${overlayMode === 'signature' ? 'bg-[#E5322D] text-white' : 'bg-gray-200 text-gray-800'}`}>Signature <Edit3 size={14} className="inline ml-1"/></button>
                        </div>
                        {overlayMode === 'text' && (
                          <div className="space-y-2">
                            <textarea value={overlayText} onChange={(e) => setOverlayText(e.target.value)} className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#E5322D] outline-none" placeholder="Type text to overlay on PDF..." rows={3} />
                            <div className="flex items-center gap-3 text-sm font-medium text-gray-800">
                              <span>Size:</span>
                              <input type="range" min="10" max="50" value={overlaySize} onChange={(e) => setOverlaySize(parseInt(e.target.value))} className="accent-[#E5322D]" />
                              <span>{overlaySize}px</span>
                              <input type="color" value={overlayColor} onChange={(e) => setOverlayColor(e.target.value)} className="w-6 h-6 border border-gray-300 rounded cursor-pointer" />
                            </div>
                          </div>
                        )}
                        {overlayMode === 'signature' && (
                          <div className="space-y-2">
                            <div className="border border-gray-300 bg-white rounded-lg p-1">
                              <canvas 
                                ref={signatureCanvasRef} width={400} height={150} 
                                onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
                                className="w-full h-[150px] touch-none cursor-crosshair rounded bg-white" 
                              />
                            </div>
                            <button onClick={clearSignature} className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-red-500"><Trash2 size={14} /> Clear</button>
                          </div>
                        )}
                        
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center text-sm font-semibold text-gray-800 border-t pt-3 mt-3">
                          <div className="flex items-center gap-2">
                            <span>Place on Page: </span>
                            <input type="number" min="1" max={totalPages} value={overlayPage} onChange={(e) => setOverlayPage(parseInt(e.target.value))} className="w-16 bg-white border border-gray-300 text-gray-800 rounded p-1 text-center focus:ring-2 focus:ring-[#E5322D] outline-none" />
                          </div>
                          <div className="flex items-center gap-2">
                            <span>Position: </span>
                            <select value={overlayPosition} onChange={(e) => setOverlayPosition(e.target.value)} className="bg-white border border-gray-300 text-gray-800 rounded p-1.5 focus:ring-2 focus:ring-[#E5322D] outline-none">
                              <option value="bottom-right">Bottom Right (e.g., Signature)</option>
                              <option value="bottom-left">Bottom Left</option>
                              <option value="top-right">Top Right</option>
                              <option value="top-left">Top Left</option>
                              <option value="center">Center of Page</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'batch' && (
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2"><Upload size={18} className="text-[#E5322D]" /> Batch Fill (CSV)</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <p className="text-sm font-medium text-gray-800">Upload a CSV file with headers matching the detected form fields.</p>
                        <input type="file" accept=".csv" onChange={handleCsvUpload} className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-[#E5322D] file:text-white hover:file:bg-red-700" />
                        {csvData.length > 0 && (
                          <div className="mt-2"><p className="text-xs font-bold text-gray-800">{csvData.length} Rows loaded from CSV.</p><div className="max-h-[120px] overflow-y-auto bg-white border border-gray-200 rounded text-xs p-2">{csvData.slice(0, 5).map((row, idx) => (<div key={idx} className="border-b py-1 text-gray-700">{JSON.stringify(row)}</div>))}{csvData.length > 5 && <div className="text-gray-500 mt-1">...and {csvData.length - 5} more</div>}</div></div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'export' && (
                    <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                      <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2"><FileOutput size={18} className="text-[#E5322D]" /> Finalize & Export</h3>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <p className="text-sm font-bold text-gray-800 border-b pb-1">1. Document Metadata (Hidden Info)</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">Author Name</label>
                            <input type="text" value={metadataAuthor} onChange={(e) => setMetadataAuthor(e.target.value)} placeholder="e.g. MasterPdf User" className="w-full bg-white border border-gray-300 rounded p-2 text-sm outline-none" />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-800 mb-1">Document Title</label>
                            <input type="text" value={metadataTitle} onChange={(e) => setMetadataTitle(e.target.value)} placeholder="e.g. Final Form" className="w-full bg-white border border-gray-300 rounded p-2 text-sm outline-none" />
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <p className="text-sm font-bold text-gray-800 border-b pb-1">2. Security & Form Lock</p>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                          <input type="checkbox" checked={flattenForm} onChange={(e) => setFlattenForm(e.target.checked)} className="accent-[#E5322D] w-4 h-4" />
                          Flatten Form (Make text static / non-editable)
                        </label>
                        <div className="pt-2">
                          <label className="block text-xs font-bold text-gray-800 mb-1">Password Protect</label>
                          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set PDF password" className="w-full bg-white border border-gray-300 text-gray-800 rounded p-2 text-sm outline-none" />
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3">
                        <p className="text-sm font-bold text-gray-800 border-b pb-1">3. Export Form Data</p>
                        <div className="flex gap-3">
                          <button onClick={() => { const json = JSON.stringify(formData, null, 2); const blob = new Blob([json], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'form_data.json'; link.click(); }} className="flex-1 px-4 py-2 bg-gray-800 text-white text-sm font-bold rounded-lg hover:bg-gray-900 transition">Export JSON</button>
                          <button onClick={() => { const headers = Object.keys(formData).join(','); const values = Object.values(formData).join(','); const csv = `${headers}\n${values}`; const blob = new Blob([csv], { type: 'text/csv' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'form_data.csv'; link.click(); }} className="flex-1 px-4 py-2 bg-[#E5322D] text-white text-sm font-bold rounded-lg hover:bg-red-700 transition">Export CSV</button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-auto pt-4 border-t border-gray-200 flex justify-end">
                    <button onClick={() => { if (activeTab === 'batch' && csvData.length > 0) processPdf('batch'); else processPdf('single'); }} disabled={isProcessing || (activeTab === 'batch' && csvData.length === 0)} className="w-full md:w-auto flex items-center justify-center gap-2 px-12 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed">
                      {isProcessing ? <><Settings className="animate-spin" size={24} /> Processing...</> : <>{activeTab === 'batch' ? 'Process Batch & Download ZIP' : 'Download Filled PDF'} <ArrowRight size={24} /></>}
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
