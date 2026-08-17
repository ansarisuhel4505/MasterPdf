import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, MousePointer2, Sparkles, ShieldAlert, Settings } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// 🔥 FIX FOR REACT-PDF VERSION 9 (Notice the .mjs at the end) 🔥
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function RedactPdf() {
  const [file, setFile] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null); // 🔥 YEH NAYI LINE ADD KI HAI
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [mode, setMode] = useState('manual'); // 'manual' or 'auto'
  
  // Auto Redact States
  const [autoOptions, setAutoOptions] = useState({ emails: true, phones: true, cards: false });
  
  // Manual Redact States (Stores coordinates of black boxes)
  const [boxes, setBoxes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPdfUrl(URL.createObjectURL(selectedFile)); // 🔥 YEH LINE PDF SCREEN PAR LAYEGI
      setBoxes([]);
    }
  };

  const addBox = () => {
    setBoxes([...boxes, { id: Date.now(), x: 50, y: 50, width: 150, height: 30 }]);
  };

  const handleProcess = async () => {
    setIsProcessing(true);
    // Yahan backend API call aayegi jo pdf-lib se black boxes draw karegi
    console.log("Processing with Mode:", mode);
    if (mode === 'manual') console.log("Boxes Coordinates:", boxes);
    if (mode === 'auto') console.log("Auto Targets:", autoOptions);
    
    setTimeout(() => {
      alert("Redaction Logic connected! Ready for Backend.");
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Smart PDF Redact - MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Smart PDF Redaction</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Permanently hide sensitive information manually or let our AI auto-detect it.
          </p>
        </div>

        {!file ? (
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
            <input type="file" id="upload" accept=".pdf" onChange={onFileChange} className="hidden" />
            <label htmlFor="upload" className="cursor-pointer bg-black hover:bg-gray-800 text-white text-xl font-bold py-4 px-8 rounded-xl inline-flex items-center gap-3 transition">
              <UploadCloud size={24} /> Upload PDF to Redact
            </label>
          </div>
        ) : (
          <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-6">
            
            {/* LEFT SIDE: CONTROLS */}
            <div className="w-full lg:w-1/3 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
              <div className="flex justify-between items-center mb-6 border-b pb-4">
                <p className="font-bold text-gray-800 truncate pr-4">{file.name}</p>
                <button onClick={() => setFile(null)} className="text-red-500 hover:bg-red-50 p-1 rounded"><X size={20}/></button>
              </div>

              {/* Mode Switcher */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
                <button 
                  onClick={() => setMode('manual')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${mode === 'manual' ? 'bg-white shadow text-black' : 'text-gray-500'}`}
                >
                  <MousePointer2 size={16}/> Manual Draw
                </button>
                <button 
                  onClick={() => setMode('auto')}
                  className={`flex-1 py-2 text-sm font-bold rounded-md flex items-center justify-center gap-2 ${mode === 'auto' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
                >
                  <Sparkles size={16}/> Auto-Detect
                </button>
              </div>

              {/* Auto Mode Settings */}
              {mode === 'auto' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <h3 className="font-bold text-sm text-gray-700">What to hide automatically?</h3>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg cursor-pointer">
                    <input type="checkbox" checked={autoOptions.emails} onChange={(e) => setAutoOptions({...autoOptions, emails: e.target.checked})} className="w-5 h-5 accent-indigo-600"/>
                    <span className="font-medium text-gray-700">Email Addresses</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg cursor-pointer">
                    <input type="checkbox" checked={autoOptions.phones} onChange={(e) => setAutoOptions({...autoOptions, phones: e.target.checked})} className="w-5 h-5 accent-indigo-600"/>
                    <span className="font-medium text-gray-700">Phone Numbers</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 border rounded-lg cursor-pointer">
                    <input type="checkbox" checked={autoOptions.cards} onChange={(e) => setAutoOptions({...autoOptions, cards: e.target.checked})} className="w-5 h-5 accent-indigo-600"/>
                    <span className="font-medium text-gray-700">Credit Card Numbers</span>
                  </label>
                </div>
              )}

              {/* Manual Mode Settings */}
              {mode === 'manual' && (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm flex gap-2">
                    <ShieldAlert size={18} className="shrink-0"/>
                    Click the button below to add a black box, then drag it over sensitive text.
                  </div>
                  <button onClick={addBox} className="w-full py-3 border-2 border-dashed border-gray-400 text-gray-700 font-bold rounded-xl hover:border-black hover:text-black transition">
                    + Add Redaction Box
                  </button>
                </div>
              )}

              {/* Action Button */}
              <button 
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full mt-8 bg-[#E5322D] hover:bg-red-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition"
              >
                {isProcessing ? <><Settings className="animate-spin"/> Processing...</> : "Apply Redaction"}
              </button>
            </div>

            {/* RIGHT SIDE: PDF VIEWER & CANVAS */}
            <div className="w-full lg:w-2/3 bg-gray-300 rounded-2xl overflow-hidden flex flex-col items-center p-4 relative min-h-[600px]">
              {mode === 'manual' && boxes.length > 0 && (
                <div className="absolute top-2 right-2 bg-black text-white text-xs px-3 py-1 rounded-full z-50">
                  {boxes.length} Boxes Active
                </div>
              )}
              
              <Document 
                file={pdfUrl} // 🔥 YAHAN 'file' KO HATA KAR 'pdfUrl' LIKH DIYA HAI
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                className="border border-gray-400 shadow-2xl relative bg-white"
              >
                <Page pageNumber={pageNumber} width={600} renderTextLayer={false} renderAnnotationLayer={false} />
                
                {/* Overlay for Draggable Boxes (Only in Manual Mode) */}
                {mode === 'manual' && boxes.map((box, index) => (
                  <Rnd
                    key={box.id}
                    default={{ x: box.x, y: box.y, width: box.width, height: box.height }}
                    bounds="parent"
                    className="bg-black opacity-90 border-2 border-red-500 cursor-move"
                    onDragStop={(e, d) => {
                      const newBoxes = [...boxes];
                      newBoxes[index] = { ...newBoxes[index], x: d.x, y: d.y };
                      setBoxes(newBoxes);
                    }}
                    onResizeStop={(e, direction, ref, delta, position) => {
                      const newBoxes = [...boxes];
                      newBoxes[index] = { ...newBoxes[index], width: ref.style.width, height: ref.style.height, ...position };
                      setBoxes(newBoxes);
                    }}
                  >
                    <button onClick={() => setBoxes(boxes.filter(b => b.id !== box.id))} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs">X</button>
                  </Rnd>
                ))}
              </Document>

              {/* Page Controls */}
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
