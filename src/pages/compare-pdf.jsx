import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, X, Columns, FileText } from 'lucide-react';

export default function ComparePdf() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [url1, setUrl1] = useState('');
  const [url2, setUrl2] = useState('');

  // Generate local preview URLs when files are uploaded
  useEffect(() => {
    if (file1) setUrl1(URL.createObjectURL(file1));
    if (file2) setUrl2(URL.createObjectURL(file2));
    
    // Cleanup URLs from memory to prevent memory leaks
    return () => {
      if (url1) URL.revokeObjectURL(url1);
      if (url2) URL.revokeObjectURL(url2);
    };
  }, [file1, file2]);

  const handleFileChange = (e, fileNumber) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      if (fileNumber === 1) setFile1(selectedFile);
      if (fileNumber === 2) setFile2(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = (fileNumber) => {
    if (fileNumber === 1) {
      setFile1(null);
      setUrl1('');
    }
    if (fileNumber === 2) {
      setFile2(null);
      setUrl2('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Compare PDF files side-by-side - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Columns size={14} /> Side-by-Side View
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Compare PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Visually compare two PDF documents side-by-side to easily spot changes and differences.
          </p>
        </div>

        <div className="w-full max-w-[95%] bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[600px] flex flex-col relative">
          
          <div className="flex flex-col lg:flex-row gap-6 h-full flex-grow">
            
            {/* Document 1 Area */}
            <div className="w-full lg:w-1/2 flex flex-col border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden relative min-h-[500px]">
              {!file1 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <input type="file" id="file-1-upload" accept=".pdf" onChange={(e) => handleFileChange(e, 1)} className="hidden" />
                  <label htmlFor="file-1-upload" className="cursor-pointer bg-gray-800 hover:bg-black text-white text-lg font-bold py-4 px-8 rounded-xl inline-flex items-center gap-3 transition shadow-md">
                    <UploadCloud size={24} /> Upload First PDF
                  </label>
                  <p className="mt-4 text-gray-400 text-sm font-medium">Original Document</p>
                </div>
              ) : (
                <div className="h-full flex flex-col relative">
                  <div className="bg-gray-800 text-white p-3 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={18} className="flex-shrink-0 text-gray-300" />
                      <span className="text-sm font-semibold truncate">{file1.name}</span>
                    </div>
                    <button onClick={() => removeFile(1)} className="text-gray-400 hover:text-white transition">
                      <X size={20} />
                    </button>
                  </div>
                  <iframe src={`${url1}#toolbar=1&navpanes=0&scrollbar=1`} className="w-full flex-grow border-none" title="Document 1"></iframe>
                </div>
              )}
            </div>

            {/* Document 2 Area */}
            <div className="w-full lg:w-1/2 flex flex-col border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden relative min-h-[500px]">
              {!file2 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <input type="file" id="file-2-upload" accept=".pdf" onChange={(e) => handleFileChange(e, 2)} className="hidden" />
                  <label htmlFor="file-2-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-lg font-bold py-4 px-8 rounded-xl inline-flex items-center gap-3 transition shadow-md">
                    <UploadCloud size={24} /> Upload Second PDF
                  </label>
                  <p className="mt-4 text-gray-400 text-sm font-medium">Modified Document</p>
                </div>
              ) : (
                <div className="h-full flex flex-col relative">
                  <div className="bg-[#E5322D] text-white p-3 flex justify-between items-center z-10">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={18} className="flex-shrink-0 text-red-200" />
                      <span className="text-sm font-semibold truncate">{file2.name}</span>
                    </div>
                    <button onClick={() => removeFile(2)} className="text-red-200 hover:text-white transition">
                      <X size={20} />
                    </button>
                  </div>
                  <iframe src={`${url2}#toolbar=1&navpanes=0&scrollbar=1`} className="w-full flex-grow border-none" title="Document 2"></iframe>
                </div>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
