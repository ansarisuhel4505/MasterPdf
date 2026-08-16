import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ArrowRight, Settings, Image as ImageIcon } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function PdfToJpg() {
  const [file, setFile] = useState(null);
  const [isConverting, setIsConverting] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => setFile(null);

  const convertToJpg = async () => {
    if (!file) return;
    setIsConverting(true);
    
    try {
      // 1. Upload to Vercel Blob (No size limits)
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });

      // 2. Send request to backend
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pdf-to-jpg', fileUrl: blob.url }),
      });
      
      const data = await response.json();
      if (response.ok && data.downloadUrl) {
        window.location.href = data.downloadUrl;
      } else {
        alert("Conversion Failed: " + data.error);
      }
    } catch (error) {
      alert("Server connection failed.");
    }
    setIsConverting(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Convert PDF to JPG online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">PDF to JPG Converter</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert each PDF page into a JPG image instantly.
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
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[350px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                <div className="relative">
                  <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                  <ArrowRight size={24} className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <ImageIcon size={60} className="absolute -right-28 top-1/2 transform -translate-y-1/2 text-yellow-500 opacity-90" />
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-8">{file.name}</p>
              </div>

              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Ready to Convert</h3>
                  <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg">
                    This process will extract pages from your PDF and output them as high-quality JPG images.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                   <button onClick={convertToJpg} disabled={isConverting} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400">
                     {isConverting ? <><Settings className="animate-spin" size={24} /> Converting...</> : <>Convert to JPG <ArrowRight size={24} /></>}
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
