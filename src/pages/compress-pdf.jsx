import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, Minimize, Settings, CheckCircle2 } from 'lucide-react';

export default function CompressPdf() {
  const [file, setFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState('recommended');

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

  // PDF Compression Logic (Basic Re-serialization for Client-Side)
  const compressPdf = async () => {
    if (!file) return;

    setIsCompressing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Load the PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      
      // Save the PDF without saving metadata to reduce size
      const pdfBytes = await pdfDoc.save({ useObjectStreams: true });

      // Trigger Download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Compressed_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error compressing PDF:", error);
      alert("Failed to compress PDF. The file might be corrupted or heavily encrypted.");
    }
    setIsCompressing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Compress PDF online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Compress PDF file</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Reduce file size while optimizing for maximal PDF quality.
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
                <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {/* Right Side: Compression Options */}
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Compression Level</h3>
                  
                  <div className="flex flex-col gap-3">
                    {/* Extreme Compression */}
                    <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${compressionLevel === 'extreme' ? 'border-[#E5322D] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="compression" value="extreme" checked={compressionLevel === 'extreme'} onChange={() => setCompressionLevel('extreme')} className="mt-1 mr-3 accent-[#E5322D]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">Extreme Compression</span>
                          {compressionLevel === 'extreme' && <CheckCircle2 size={16} className="text-[#E5322D]" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Less quality, high compression</p>
                      </div>
                    </label>

                    {/* Recommended Compression */}
                    <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${compressionLevel === 'recommended' ? 'border-[#E5322D] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="compression" value="recommended" checked={compressionLevel === 'recommended'} onChange={() => setCompressionLevel('recommended')} className="mt-1 mr-3 accent-[#E5322D]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">Recommended Compression</span>
                          {compressionLevel === 'recommended' && <CheckCircle2 size={16} className="text-[#E5322D]" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Good quality, good compression</p>
                      </div>
                    </label>

                    {/* Less Compression */}
                    <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${compressionLevel === 'less' ? 'border-[#E5322D] bg-red-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="compression" value="less" checked={compressionLevel === 'less'} onChange={() => setCompressionLevel('less')} className="mt-1 mr-3 accent-[#E5322D]" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">Less Compression</span>
                          {compressionLevel === 'less' && <CheckCircle2 size={16} className="text-[#E5322D]" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">High quality, less compression</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={compressPdf}
                     disabled={isCompressing}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isCompressing ? (
                       <><Settings className="animate-spin" size={24} /> Compressing...</>
                     ) : (
                       <>Compress PDF <Minimize size={24} /></>
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