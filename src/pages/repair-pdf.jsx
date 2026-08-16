import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ArrowRight, Settings } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function RepairPdf() {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) setFile(selectedFile);
  };

  const processFile = async () => {
    if (!file) return;
    setIsConverting(true);
    try {
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'repair-pdf', fileUrl: blob.url }),
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
      <Head><title>Repair PDF - MasterPdf</title></Head>
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Repair PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Repair a damaged PDF and recover data from corrupt files.</p>
        </div>
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          {!file ? (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3">
                <UploadCloud size={28} /> Select Corrupt PDF
              </label>
            </div>
          ) : (
            <div className="w-full flex flex-col md:flex-row gap-8 items-start pt-4">
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[350px]">
                <button onClick={() => setFile(null)} className="absolute top-4 right-4 bg-white border text-gray-500 hover:text-red-500 rounded-full p-2"><X size={20} /></button>
                <FileText size={80} className="text-gray-400 mb-4 opacity-90" />
                <p className="text-sm font-bold mt-4">{file.name}</p>
              </div>
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div><h3 className="text-xl font-bold border-b pb-2">Ready to Repair</h3></div>
                <div className="mt-6 flex justify-end">
                   <button onClick={processFile} disabled={isConverting} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 disabled:bg-gray-400">
                     {isConverting ? <><Settings className="animate-spin" size={24} /> Repairing...</> : <>Repair PDF <ArrowRight size={24} /></>}
                   </button>
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
