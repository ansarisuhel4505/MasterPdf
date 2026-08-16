import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, Sparkles, Settings, Copy, CheckCircle2 } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function AiSummarizer() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState('');
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setSummary(''); // Nayi file aane par purani summary clear kar do
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setSummary('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateSummary = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      // 1. Upload to Vercel Blob
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });

      // 2. Send request to backend
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ai-summarizer', fileUrl: blob.url }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.textResult) {
        // Backend se aayi hui summary ko state mein set karna
        setSummary(data.textResult);
      } else {
        // Temporary fallback jab tak backend mein API key add nahi hoti
        alert(data.error || "Summarization failed.");
        setSummary("This is a simulated AI summary. To get real summaries, you need to integrate an OpenAI or Gemini API key in your master-convert.js backend file. \n\nYour document contains valuable information that has been processed successfully by the UI.");
      }
    } catch (error) {
      alert("Server connection failed.");
      // Fallback for UI testing
      setSummary("Simulated output: The server connection was interrupted, but the UI is working perfectly. Add your AI API key to see real results.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>AI PDF Summarizer online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Sparkles size={14} /> AI Powered
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">AI PDF Summarizer</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Quickly generate concise summaries from articles, paragraphs, and essays using advanced AI.
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
              
              {/* Left Side: File Preview */}
              <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-6 relative h-[380px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-2 mt-4">{file.name}</p>
                <p className="text-xs text-gray-500 mt-2">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>

                <button 
                  onClick={generateSummary} 
                  disabled={isProcessing || summary} 
                  className="w-full mt-8 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white font-bold text-sm transition shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                >
                  {isProcessing ? <><Settings className="animate-spin" size={18} /> Analyzing...</> : <>Generate Summary <Sparkles size={18} /></>}
                </button>
              </div>

              {/* Right Side: AI Output Area */}
              <div className="w-full md:w-2/3 flex flex-col h-[380px]">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">AI Summary Result</h3>
                  {summary && (
                    <button onClick={handleCopy} className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-indigo-600 transition">
                      {copied ? <><CheckCircle2 size={16} className="text-green-500"/> Copied!</> : <><Copy size={16}/> Copy Text</>}
                    </button>
                  )}
                </div>
                
                <div className="flex-grow bg-gray-50 border border-gray-200 rounded-xl p-6 overflow-y-auto">
                  {!summary ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <Sparkles size={40} className="mb-3 opacity-50" />
                      <p className="text-sm font-medium">Click "Generate Summary" to extract key insights.</p>
                    </div>
                  ) : (
                    <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                      {summary}
                    </div>
                  )}
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
