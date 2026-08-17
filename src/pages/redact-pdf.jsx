import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, X, MousePointer2, Sparkles, ShieldAlert, Settings, ScanSearch } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import { upload } from '@vercel/blob/client';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 🔥 FIX FOR REACT-PDF VERSION 9 🔥
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function RedactPdf() {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null); 
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [mode, setMode] = useState('auto');
  
  // 🚀 ULTIMATE ENTERPRISE AUTO-REDACT OPTIONS
  const [autoOptions, setAutoOptions] = useState({ 
    emails: true, phones: true, dob: false,
    cards: true, bankAccounts: false, ifsc: false, upi: false,
    aadhar: true, pan: true, passport: false, dl: false, voter: false, ssn: false, gstin: false,
    ip: false, mac: false, apikeys: true, crypto: false
  });
  
  const [boxes, setBoxes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile)); 
      setBoxes([]);
    }
  };

  const addBox = () => {
    setBoxes([...boxes, { id: Date.now(), x: 50, y: 50, width: 150, height: 25, pageIndex: pageNumber - 1 }]);
  };

  // 🔥 THE GOD-LEVEL MULTI-LAYER SCANNER 🔥
  const runAutoScanner = () => {
    const textLayer = document.querySelector('.react-pdf__Page__textContent');
    
    // ERROR FIX 1: Prevent scanning before text is ready
    if (!textLayer || textLayer.childElementCount === 0) {
      return alert("⏳ PDF text is still loading. Please wait 1-2 seconds and click 'Scan' again.");
    }

    const spans = textLayer.querySelectorAll('span');
    const newBoxes = [];

    spans.forEach((span) => {
      const text = span.textContent;
      let isSensitive = false;

      // 1. BASIC
      if (autoOptions.emails && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(text)) isSensitive = true;
      if (autoOptions.phones && /(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,4}/.test(text)) isSensitive = true;
      if (autoOptions.dob && /\b(?:0[1-9]|[12][0-9]|3[01])[-/.](?:0[1-9]|1[012])[-/.](?:19|20)\d\d\b/.test(text)) isSensitive = true;

      // 2. FINANCIAL
      if (autoOptions.cards && /\b(?:\d{4}[\s-]?){3}\d{4}\b/.test(text)) isSensitive = true;
      if (autoOptions.bankAccounts && /\b\d{9,18}\b/.test(text)) isSensitive = true; 
      if (autoOptions.ifsc && /\b[A-Z]{4}0[A-Z0-9]{6}\b/.test(text)) isSensitive = true;
      if (autoOptions.upi && /\b[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}\b/.test(text)) isSensitive = true;

      // 3. IDENTITY & BUSINESS
      if (autoOptions.aadhar && /\b\d{4}\s?\d{4}\s?\d{4}\b/.test(text)) isSensitive = true;
      if (autoOptions.pan && /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/.test(text)) isSensitive = true;
      if (autoOptions.passport && /\b[A-Z][1-9]\d{6}\b/.test(text)) isSensitive = true; 
      if (autoOptions.dl && /\b[A-Z]{2}[0-9]{2}[ ]?[0-9]{11}\b/.test(text)) isSensitive = true; 
      if (autoOptions.voter && /\b[A-Z]{3}[0-9]{7}\b/.test(text)) isSensitive = true; 
      if (autoOptions.ssn && /\b\d{3}-\d{2}-\d{4}\b/.test(text)) isSensitive = true; 
      if (autoOptions.gstin && /\b[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/.test(text)) isSensitive = true;

      // 4. TECH, WEB & CRYPTO (ADVANCED)
      if (autoOptions.ip && /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(text)) isSensitive = true;
      if (autoOptions.mac && /\b(?:[0-9A-Fa-f]{2}[:-]){5}(?:[0-9A-Fa-f]{2})\b/.test(text)) isSensitive = true;
      if (autoOptions.apikeys && /\b(AKIA[0-9A-Z]{16}|eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*)\b/.test(text)) isSensitive = true; // AWS & JWT
      if (autoOptions.crypto && /\b(0x[a-fA-F0-9]{40}|(?:bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39})\b/.test(text)) isSensitive = true; // ETH & BTC

      if (isSensitive) {
        const layerRect = textLayer.getBoundingClientRect();
        const spanRect = span.getBoundingClientRect();

        newBoxes.push({
          id: Date.now() + Math.random(),
          x: spanRect.left - layerRect.left - 2, 
          y: spanRect.top - layerRect.top - 2,
          width: spanRect.width + 4, 
          height: spanRect.height + 4,
          pageIndex: pageNumber - 1
        });
      }
    });

    if (newBoxes.length > 0) {
      setBoxes([...boxes, ...newBoxes]);
      alert(`Awesome! 🤖 Scanner found ${newBoxes.length} sensitive details and covered them.`);
    } else {
      alert("✅ No sensitive details found on this page.");
    }
  };

  const handleProcess = async () => {
    if (boxes.length === 0) return alert("Please add at least one black box (or run Auto-Scan) to redact.");
    
    setIsProcessing(true);
    try {
      // ERROR FIX 2: Sanitize file name to prevent Vercel Blob upload crashes
      const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      
      const blob = await upload(safeFileName, file, { access: 'public', handleUploadUrl: '/api/upload' });
      
      const formattedBoxes = boxes.map(b => ({
        x: parseInt(b.x), y: parseInt(b.y), width: parseInt(b.width), height: parseInt(b.height), pageIndex: b.pageIndex
      }));

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redact-pdf', fileUrl: blob.url, mode: 'manual', boxes: formattedBoxes })
      });

      const data = await response.json();
      if (response.ok && data.downloadUrl) window.location.href = data.downloadUrl;
      else alert("Error: " + (data.error || "Failed to redact document."));
    } catch (err) {
      console.error(err);
      alert("Server connection failed! Please check your network.");
    }
    setIsProcessing(false);
  };

  const toggleOption = (key) => setAutoOptions({ ...autoOptions, [key]: !autoOptions[key] });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Enterprise PDF Redact - MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Enterprise PDF Redaction</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            World-class DLP algorithm to auto-detect and hide 18+ types of sensitive information.
          </p>
        </div>

        {!file ? (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <input type="file" id="upload" accept=".pdf" onChange={onFileChange} className="hidden" />
            <label htmlFor="upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-4 px-8 rounded-xl inline-flex items-center gap-3 transition">
              <UploadCloud size={24} /> Upload PDF Document
            </label>
          </div>
        ) : (
          <div className="w-full max-w-7xl flex flex-col xl:flex-row gap-6">
            
            {/* LEFT SIDE: CONTROLS */}
            <div className="w-full xl:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit max-h-[850px] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <p className="font-bold text-gray-800 truncate pr-4">{file.name}</p>
                <button onClick={() => setFile(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={20}/></button>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button onClick={() => setMode('auto')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${mode === 'auto' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>
                  <Sparkles size={16}/> Auto-Detect
                </button>
                <button onClick={() => setMode('manual')} className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${mode === 'manual' ? 'bg-white shadow text-black' : 'text-gray-500'}`}>
                  <MousePointer2 size={16}/> Manual Draw
                </button>
              </div>

              {/* Auto Mode Settings */}
              {mode === 'auto' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  <div>
                    <h3 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Identity & Personal</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.emails} onChange={() => toggleOption('emails')} className="accent-indigo-600"/> Emails</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.phones} onChange={() => toggleOption('phones')} className="accent-indigo-600"/> Phones</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.aadhar} onChange={() => toggleOption('aadhar')} className="accent-indigo-600"/> Aadhar Card</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.pan} onChange={() => toggleOption('pan')} className="accent-indigo-600"/> PAN Card</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.passport} onChange={() => toggleOption('passport')} className="accent-indigo-600"/> Passport</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.dl} onChange={() => toggleOption('dl')} className="accent-indigo-600"/> Driving Lic.</label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Financial & Business</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.cards} onChange={() => toggleOption('cards')} className="accent-indigo-600"/> Credit Cards</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.bankAccounts} onChange={() => toggleOption('bankAccounts')} className="accent-indigo-600"/> Bank A/C No.</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.ifsc} onChange={() => toggleOption('ifsc')} className="accent-indigo-600"/> IFSC Code</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.gstin} onChange={() => toggleOption('gstin')} className="accent-indigo-600"/> GSTIN</label>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-3">Tech, Web & Crypto</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.apikeys} onChange={() => toggleOption('apikeys')} className="accent-indigo-600"/> API/JWT Keys</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.crypto} onChange={() => toggleOption('crypto')} className="accent-indigo-600"/> Crypto Wallets</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.ip} onChange={() => toggleOption('ip')} className="accent-indigo-600"/> IP Address</label>
                      <label className="flex items-center gap-2 p-2 bg-gray-50 border rounded-md cursor-pointer text-xs font-semibold"><input type="checkbox" checked={autoOptions.mac} onChange={() => toggleOption('mac')} className="accent-indigo-600"/> MAC Address</label>
                    </div>
                  </div>

                  <button onClick={runAutoScanner} className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition">
                    <ScanSearch size={20} /> Scan Page & Auto Hide
                  </button>
                </div>
              )}

              {/* Manual Mode Settings */}
              {mode === 'manual' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2">
                    <ShieldAlert size={18} className="shrink-0"/>
                    Click the button below to add a black box, then drag it over sensitive text.
                  </div>
                  <button onClick={addBox} className="w-full py-4 border-2 border-dashed border-gray-400 text-gray-700 font-bold rounded-xl hover:border-black hover:text-black transition">
                    + Add Redaction Box
                  </button>
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full mt-8 bg-black hover:bg-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition disabled:bg-gray-400"
              >
                {isProcessing ? <><Settings className="animate-spin"/> Redacting...</> : "Confirm & Download PDF"}
              </button>
            </div>

            {/* RIGHT SIDE: PDF VIEWER & CANVAS */}
            <div className="w-full xl:w-2/3 bg-gray-300 rounded-2xl overflow-hidden flex flex-col items-center p-4 relative min-h-[600px]">
              {boxes.length > 0 && (
                <div className="absolute top-2 right-2 bg-black text-white text-xs px-3 py-1 rounded-full z-50 shadow-lg">
                  {boxes.length} Active Boxes
                </div>
              )}
              
              <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setNumPages(numPages)} className="border border-gray-400 shadow-2xl relative bg-white">
                <Page pageNumber={pageNumber} width={700} renderTextLayer={true} renderAnnotationLayer={false} />
                
                {boxes.filter(b => b.pageIndex === pageNumber - 1).map((box, index) => (
                  <Rnd
                    key={box.id} default={{ x: box.x, y: box.y, width: box.width, height: box.height }} bounds="parent"
                    className="bg-black opacity-90 border-2 border-red-500 cursor-move z-50"
                    onDragStop={(e, d) => {
                      const newBoxes = [...boxes]; const boxIndex = newBoxes.findIndex(b => b.id === box.id);
                      newBoxes[boxIndex] = { ...newBoxes[boxIndex], x: d.x, y: d.y }; setBoxes(newBoxes);
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      const newBoxes = [...boxes]; const boxIndex = newBoxes.findIndex(b => b.id === box.id);
                      newBoxes[boxIndex] = { ...newBoxes[boxIndex], width: ref.style.width, height: ref.style.height, ...position };
                      setBoxes(newBoxes);
                    }}
                  >
                    <button onClick={() => setBoxes(boxes.filter(b => b.id !== box.id))} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs">X</button>
                  </Rnd>
                ))}
              </Document>

              {numPages > 1 && (
                <div className="mt-4 flex gap-4 items-center bg-white px-4 py-2 rounded-full shadow">
                  <button disabled={pageNumber <= 1} onClick={() => setPageNumber(pageNumber - 1)} className="font-bold disabled:text-gray-300">&lt; Prev</button>
                  <span className="text-sm font-medium">Page {pageNumber} of {numPages}</span>
                  <button disabled={pageNumber >= numPages} onClick={() => setPageNumber(pageNumber + 1)} className="font-bold disabled:text-gray-300">Next &gt;</button>
                </div>
              )}
            </div>

          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
