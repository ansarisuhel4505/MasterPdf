import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, X, Columns, Sparkles, Settings, ArrowRight } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function ComparePdf() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState('');

  const handleFileChange = (e, fileNumber) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (fileNumber === 1) setFile1(selectedFile);
      if (fileNumber === 2) setFile2(selectedFile);
      setAiReport(''); // Nayi file aate hi purani report clear kar do
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = (fileNumber) => {
    if (fileNumber === 1) setFile1(null);
    if (fileNumber === 2) setFile2(null);
    setAiReport('');
  };

  const analyzeComparison = async () => {
    if (!file1 || !file2) {
      alert("Please upload both PDF files to compare.");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      // 1. Upload both files to Vercel Blob
      const blob1 = await upload(file1.name, file1, { access: 'public', handleUploadUrl: '/api/upload' });
      const blob2 = await upload(file2.name, file2, { access: 'public', handleUploadUrl: '/api/upload' });

      // 2. Send both URLs to backend for AI Comparison
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'ai-compare', 
          fileUrl: blob1.url,
          fileUrl2: blob2.url 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.textResult) {
        setAiReport(data.textResult);
      } else {
        alert("Comparison failed: " + (data.error || "Unknown error"));
      }
    } catch (error) {
      console.error(error);
      alert("Server connection failed. Could not analyze documents.");
    }
    
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      {/* 🔥 EXACT SEO HEAD POSITION 🔥 */}
      <Head>
        <title>Compare PDF Files Online Free | AI PDF Comparison | MasterPdf</title>
        <meta name="description" content="Easily compare two PDF files online for free. Use AI to detect text differences, additions, and deletions instantly. Created by Suhel Ansari." />
        <meta name="keywords" content="compare pdf, pdf comparison tool, find differences in pdf, compare two pdf files, ai pdf compare, masterpdf, Suhel Ansari" />
        <meta property="og:title" content="Compare PDF Files Online Free | AI PDF Comparison | MasterPdf" />
        <meta property="og:description" content="Use AI to automatically detect exactly what changed between two PDF documents." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Sparkles size={14} /> AI Powered
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Smart PDF Compare</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload two PDFs and let AI automatically detect exactly what changed, what was added, and what was removed.
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[500px] flex flex-col relative">
          
          {/* Upload Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* File 1 */}
            <div className={`border-2 ${file1 ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300 bg-gray-50'} rounded-xl p-6 flex flex-col items-center justify-center text-center relative transition`}>
              {file1 ? (
                <>
                  <button onClick={() => removeFile(1)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={20}/></button>
                  <Sparkles size={40} className="text-indigo-500 mb-2 opacity-80" />
                  <p className="font-bold text-gray-800 text-sm">{file1.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Original Document</p>
                </>
              ) : (
                <>
                  <input type="file" id="file1-upload" accept=".pdf" onChange={(e) => handleFileChange(e, 1)} className="hidden" />
                  <label htmlFor="file1-upload" className="cursor-pointer bg-gray-800 hover:bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition">
                    <UploadCloud size={20} /> Upload File 1
                  </label>
                  <p className="text-xs text-gray-500 mt-3">Original Document</p>
                </>
              )}
            </div>

            {/* File 2 */}
            <div className={`border-2 ${file2 ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300 bg-gray-50'} rounded-xl p-6 flex flex-col items-center justify-center text-center relative transition`}>
              {file2 ? (
                <>
                  <button onClick={() => removeFile(2)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={20}/></button>
                  <Columns size={40} className="text-indigo-500 mb-2 opacity-80" />
                  <p className="font-bold text-gray-800 text-sm">{file2.name}</p>
                  <p className="text-xs text-gray-500 mt-1">Modified Document</p>
                </>
              ) : (
                <>
                  <input type="file" id="file2-upload" accept=".pdf" onChange={(e) => handleFileChange(e, 2)} className="hidden" />
                  <label htmlFor="file2-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition">
                    <UploadCloud size={20} /> Upload File 2
                  </label>
                  <p className="text-xs text-gray-500 mt-3">Modified Document</p>
                </>
              )}
            </div>
          </div>

          {/* Action Button */}
          {!aiReport && (
            <div className="flex justify-center">
              <button 
                onClick={analyzeComparison}
                disabled={!file1 || !file2 || isAnalyzing}
                className="w-full max-w-md flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {isAnalyzing ? <><Settings className="animate-spin" size={24} /> Analyzing Differences...</> : <>Find Differences with AI <ArrowRight size={24} /></>}
              </button>
            </div>
          )}

          {/* AI Result Area */}
          {aiReport && (
            <div className="mt-4 border border-indigo-100 bg-indigo-50/30 rounded-xl p-6 animate-in fade-in duration-500">
              <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <Sparkles size={20} className="text-indigo-600" /> Comparison Report
              </h3>
              <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap font-medium bg-white p-6 rounded-lg border border-gray-200 shadow-inner">
                {aiReport}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
