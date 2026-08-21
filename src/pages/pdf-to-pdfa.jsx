import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { 
  UploadCloud, FileText, X, ArrowRight, Settings, 
  ShieldCheck, Baseline, Palette, Eraser, Layers, CheckCircle2 
} from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function PdfToPdfA() {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Enterprise Settings States
  const [conformanceLevel, setConformanceLevel] = useState('pdfa'); // Default PDF/A
  const [embedFonts, setEmbedFonts] = useState(true);
  const [flattenTransparency, setFlattenTransparency] = useState(true);
  const [stripActiveContent, setStripActiveContent] = useState(true);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => setFile(null);

  const processFile = async () => {
    if (!file) return;
    setIsConverting(true);
    
    try {
      setLoadingStatus('Uploading to secure vault...');
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
      
      setLoadingStatus('Applying ISO 19005 Compliance...');
      
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'pdf-to-pdfa', 
          fileUrl: blob.url,
          options: {
            level: conformanceLevel,
            fonts: embedFonts,
            flatten: flattenTransparency,
            strip: stripActiveContent
          }
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.downloadUrl) {
        setLoadingStatus('Finalizing Archival PDF...');
        
        // Safe Download Method (Instant Download Fix)
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.setAttribute('download', `MasterPdf_Archive_${file.name.split('.')[0]}_PDFA.pdf`);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Action Failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Server connection failed.");
    }
    
    setIsConverting(false);
    setLoadingStatus('');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      {/* 🔥 EXACT SEO HEAD POSITION 🔥 */}
      <Head>
        <title>Convert PDF to PDF/A Online Free | MasterPdf</title>
        <meta name="description" content="Transform your PDFs into ISO 19005 compliance-ready, long-term archival PDF/A documents online. 100% Free. Created by Suhel Ansari." />
        <meta name="keywords" content="pdf to pdf/A, convert pdf to pdfa, iso 19005 archiving, pdf compliance, pdf archive tool, masterpdf, Suhel Ansari" />
        <meta property="og:title" content="Convert PDF to PDF/A Online Free | MasterPdf" />
        <meta property="og:description" content="Transform your PDFs into ISO 19005 compliance-ready PDF/A documents online." />
      </Head>

      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <ShieldCheck size={14} /> ISO 19005 Archiving Standard
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Convert to PDF/A</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Transform your PDFs into compliance-ready, long-term archival documents. Guaranteed to look exactly the same 50 years from now.
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          {!file ? (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Select PDF Document
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              {/* Left Side: Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-8 relative min-h-[380px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                <div className="relative">
                  <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                  <ShieldCheck size={40} className="absolute -bottom-2 -right-4 text-green-600 bg-white rounded-full p-1 shadow-sm" />
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-8">{file.name}</p>
                <p className="text-xs text-gray-500 mt-2 font-medium">Status: Pending Verification</p>
              </div>

              {/* Right Side: Enterprise Settings */}
              <div className="w-full md:w-1/2 flex flex-col min-h-[380px] justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                    <Settings size={18} className="text-[#E5322D]" /> Archiving Specifications
                  </h3>
                  
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    
                    {/* Compliance Level Selection */}
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-800 mb-2">Conformance Level</label>
                      <select 
                        value={conformanceLevel} 
                        onChange={(e) => setConformanceLevel(e.target.value)} 
                        className="w-full bg-white border border-gray-300 text-gray-800 rounded p-2 text-sm outline-none focus:ring-2 focus:ring-[#E5322D]"
                      >
                        <option value="pdfa">PDF/A-1b (Basic Archival)</option>
                        <option value="pdfa2">PDF/A-2b (Supports Transparency)</option>
                        <option value="pdfa3">PDF/A-3b (Allows Embedded Files)</option>
                      </select>
                    </div>

                    {/* Strict Features Breakdown */}
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 pt-2 border-t">Strict Compliance Checks applied:</p>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded border shadow-sm">
                        <Baseline size={16} className="text-blue-500 shrink-0"/>
                        <span className="flex-1 font-medium">100% Font Embedding</span>
                        {embedFonts ? <CheckCircle2 size={16} className="text-green-500"/> : null}
                      </label>
                      
                      <label className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded border shadow-sm">
                        <Palette size={16} className="text-pink-500 shrink-0"/>
                        <span className="flex-1 font-medium">ICC Color Profile Standardization</span>
                        <CheckCircle2 size={16} className="text-green-500"/>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded border shadow-sm cursor-pointer">
                        <Layers size={16} className="text-orange-500 shrink-0"/>
                        <span className="flex-1 font-medium">Flatten Transparency & Metadata</span>
                        <input type="checkbox" checked={flattenTransparency} onChange={(e)=>setFlattenTransparency(e.target.checked)} className="accent-[#E5322D] w-4 h-4"/>
                      </label>

                      <label className="flex items-center gap-2 text-sm text-gray-700 bg-white p-2 rounded border shadow-sm cursor-pointer">
                        <Eraser size={16} className="text-purple-500 shrink-0"/>
                        <span className="flex-1 font-medium">Strip Macros, Audio & JS</span>
                        <input type="checkbox" checked={stripActiveContent} onChange={(e)=>setStripActiveContent(e.target.checked)} className="accent-[#E5322D] w-4 h-4"/>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button onClick={processFile} disabled={isConverting} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400">
                    {isConverting ? <><Settings className="animate-spin" size={24} /> {loadingStatus}</> : <>Generate PDF/A <ArrowRight size={24} /></>}
                  </button>
                  {isConverting && <p className="text-[10px] text-center text-gray-500 animate-pulse">Running ISO verification algorithms...</p>}
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
