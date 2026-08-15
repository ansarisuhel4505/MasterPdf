import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ArrowRight, Settings, Presentation } from 'lucide-react';

export default function PdfToPowerpoint() {
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

  const removeFile = () => {
    setFile(null);
  };

  // Simulated Conversion Logic (Ready for Backend API connection)
  // Real Backend Connection
  const convertToPowerpoint = async () => {
    if (!file) return;
    setIsConverting(true);
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', 'pdf-to-powerpoint');

    try {
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = `MasterPdf_PPT_${file.name.split('.')[0]}.pptx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        <title>Convert PDF to PowerPoint online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">PDF to PowerPoint</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Turn your PDF files into easy to edit PPT and PPTX slideshows in seconds.
          </p>
        </div>

        {/* Workspace Area */}
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {!file ? (
            // Upload State
            <div className="text-center w-full">
              <input 
                type="file" 
                id="file-upload" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <UploadCloud size={28} />
                Select PDF file
              </label>
              <p className="mt-4 text-gray-400 text-sm">or drop PDF here</p>
            </div>
          ) : (
            // File Selected State
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              {/* Left Side: File Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[350px]">
                <button 
                  onClick={removeFile}
                  className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition"
                >
                  <X size={20} />
                </button>
                <div className="relative">
                  <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                  <ArrowRight size={24} className="absolute -right-8 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Presentation size={60} className="absolute -right-28 top-1/2 transform -translate-y-1/2 text-orange-600 opacity-90" />
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-8">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Ready to convert to PowerPoint (PPTX)
                </p>
              </div>

              {/* Right Side: Convert Action Area */}
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Conversion Options</h3>
                  
                  <div className="flex flex-col gap-4">
                    <label className="flex items-start p-4 border border-[#E5322D] bg-red-50 rounded-lg cursor-pointer transition">
                      <input type="radio" checked readOnly className="mt-1 mr-3 accent-[#E5322D]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">Convert to PPTX</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Transform every PDF page into an editable PowerPoint slide.</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={convertToPowerpoint}
                     disabled={isConverting}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isConverting ? (
                       <><Settings className="animate-spin" size={24} /> Converting...</>
                     ) : (
                       <>Convert to PPTX <ArrowRight size={24} /></>
                     )}
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