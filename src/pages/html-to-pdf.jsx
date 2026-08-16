import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { ArrowRight, Settings, Link as LinkIcon } from 'lucide-react';

export default function HtmlToPdf() {
  const [urlInput, setUrlInput] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const processUrl = async () => {
    if (!urlInput) return;
    setIsConverting(true);
    try {
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Yahan Vercel Blob nahi, balki direct typed URL backend ko de rahe hain
        body: JSON.stringify({ action: 'html-to-pdf', fileUrl: urlInput }),
      });
      const data = await response.json();
      if (response.ok && data.downloadUrl) window.location.href = data.downloadUrl;
      else alert("Action Failed: " + data.error);
    } catch (error) {
      alert("Server connection failed.");
    }
    setIsConverting(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>HTML to PDF - MasterPdf</title></Head>
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">HTML to PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Convert webpages in HTML to PDF. Copy and paste the URL below.</p>
        </div>
        <div className="w-full max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[300px] flex flex-col items-center justify-center">
          <div className="w-full flex flex-col items-center gap-6">
             <div className="w-full flex items-center bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 focus-within:ring-2 focus-within:ring-[#E5322D]">
                <LinkIcon className="text-gray-400 mr-3" size={24} />
                <input 
                  type="url" 
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com" 
                  className="w-full bg-transparent outline-none text-lg text-gray-700"
                />
             </div>
             <button onClick={processUrl} disabled={isConverting || !urlInput} className="w-full flex items-center justify-center gap-2 px-12 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 disabled:bg-gray-400">
                {isConverting ? <><Settings className="animate-spin" size={24} /> Converting...</> : <>Convert to PDF <ArrowRight size={24} /></>}
             </button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
