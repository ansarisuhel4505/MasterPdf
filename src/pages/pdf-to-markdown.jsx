import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ArrowRight, Settings, FileCode2, Wand2, ScanText, LayoutList, Eraser } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function PdfToMarkdown() {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState('');

  // 🔥 ENTERPRISE FEATURES STATES 🔥
  const [useAI, setUseAI] = useState(true); // AI Structuring
  const [useOCR, setUseOcr] = useState(false); // For Scanned PDFs
  const [cleanFormatting, setCleanFormatting] = useState(true); // Remove Watermarks/Footers
  const [preserveTables, setPreserveTables] = useState(true); // Table extraction

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => setFile(null);

  const convertToMarkdown = async () => {
    if (!file) return;
    setIsConverting(true);
    
    try {
      setLoadingStatus('Uploading to secure cloud...');
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });

      setLoadingStatus(useAI ? 'AI is structuring Markdown...' : 'Extracting raw text...');
      
      // Select Action based on Enterprise Settings
      const actionType = useAI ? 'pdf-to-enterprise-md' : 'pdf-to-markdown';

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: actionType, 
          fileUrl: blob.url,
          options: {
            ocr: useOCR,
            clean: cleanFormatting,
            tables: preserveTables
          }
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.textResult) {
        setLoadingStatus('Generating final .md file...');
        
        // Frontend par hi file generate karke download karwana
        const mdBlob = new Blob([data.textResult], { type: 'text/markdown' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(mdBlob);
        downloadLink.download = `MasterPdf_Docs_${file.name.split('.')[0]}.md`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } 
      else if (response.ok && data.downloadUrl && !useAI) {
        // Standard Raw Text Fallback
        const textResponse = await fetch(data.downloadUrl);
        const textContent = await textResponse.text();
        const mdBlob = new Blob([textContent], { type: 'text/markdown' });
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(mdBlob);
        downloadLink.download = `MasterPdf_Raw_${file.name.split('.')[0]}.md`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      } 
      else {
        alert("Conversion Failed: " + (data.error || data.textResult));
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
      <Head>
        <title>Enterprise PDF to Markdown - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Wand2 size={14} /> Enterprise AI Document Parser
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">PDF to Markdown</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Extract clean, structured Markdown from PDFs. Ideal for LLM Training, GitHub Docs, and RAG Pipelines.
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          {!file ? (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Select PDF file
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start">
              
              {/* Left Side: Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-8 relative min-h-[350px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                <div className="relative">
                  <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                  <ArrowRight size={24} className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <FileCode2 size={60} className="absolute -right-28 top-1/2 transform -translate-y-1/2 text-gray-700 opacity-90" />
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-8">{file.name}</p>
                <p className="text-xs text-gray-500 mt-2">Ready for Extraction</p>
              </div>

              {/* Right Side: Enterprise Settings */}
              <div className="w-full md:w-1/2 flex flex-col min-h-[350px] justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                    <Settings size={18} className="text-[#E5322D]" /> Extraction Settings
                  </h3>
                  
                  <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} className="mt-1 accent-[#E5322D] w-4 h-4 cursor-pointer" />
                      <div>
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><Wand2 size={14} className="text-blue-600"/> AI Layout Structuring</p>
                        <p className="text-xs text-gray-500">Uses Llama 3 to format headings (#), lists (*), and code blocks perfectly.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group border-t border-gray-200 pt-3">
                      <input type="checkbox" checked={useOCR} onChange={(e) => setUseOcr(e.target.checked)} className="mt-1 accent-[#E5322D] w-4 h-4 cursor-pointer" />
                      <div>
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><ScanText size={14} className="text-green-600"/> Force OCR Engine</p>
                        <p className="text-xs text-gray-500">Enable if your PDF contains scanned images instead of selectable text.</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group border-t border-gray-200 pt-3">
                      <input type="checkbox" checked={preserveTables} onChange={(e) => setPreserveTables(e.target.checked)} className="mt-1 accent-[#E5322D] w-4 h-4 cursor-pointer" />
                      <div>
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><LayoutList size={14} className="text-orange-600"/> Reconstruct Tables</p>
                        <p className="text-xs text-gray-500">Converts visual PDF tables into standard Markdown format (| Data |).</p>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group border-t border-gray-200 pt-3">
                      <input type="checkbox" checked={cleanFormatting} onChange={(e) => setCleanFormatting(e.target.checked)} className="mt-1 accent-[#E5322D] w-4 h-4 cursor-pointer" />
                      <div>
                        <p className="text-sm font-bold text-gray-800 flex items-center gap-1"><Eraser size={14} className="text-purple-600"/> Remove Noise</p>
                        <p className="text-xs text-gray-500">Automatically filters out repetitive headers, footers, and page numbers.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button onClick={convertToMarkdown} disabled={isConverting} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400">
                    {isConverting ? <><Settings className="animate-spin" size={24} /> {loadingStatus}</> : <>Generate Markdown <ArrowRight size={24} /></>}
                  </button>
                  {isConverting && <p className="text-[10px] text-center text-gray-500 animate-pulse">AI processing takes a few seconds depending on document length...</p>}
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
