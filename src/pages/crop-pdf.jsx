import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, Crop, ArrowRight, Settings } from 'lucide-react';

export default function CropPdf() {
  const [file, setFile] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [margins, setMargins] = useState({ top: 30, bottom: 30, left: 30, right: 30 });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => setFile(null);

  const handleMarginChange = (side, value) => {
    setMargins(prev => ({ ...prev, [side]: Math.max(0, Number(value) || 0) }));
  };

  // Client-Side PDF Cropping Logic using pdf-lib
  const cropPdf = async () => {
    if (!file) return;

    setIsCropping(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();

        // Calculate new crop box dimensions
        const newX = margins.left;
        const newY = margins.bottom;
        const newWidth = width - margins.left - margins.right;
        const newHeight = height - margins.top - margins.bottom;

        if (newWidth > 50 && newHeight > 50) {
          page.setCropBox(newX, newY, newWidth, newHeight);
        }
      });

      const pdfBytes = await pdfDoc.save();

      // Trigger instant download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Cropped_${file.name}`;
      link.click();

    } catch (error) {
      console.error("Error cropping PDF:", error);
      alert("Failed to crop PDF. The file might be encrypted or protected.");
    }
    setIsCropping(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Crop PDF margins online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Crop PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trim and adjust document margins cleanly across all PDF pages.
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          {!file ? (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Select PDF file
              </label>
              <p className="mt-4 text-gray-400 text-sm">or drop PDF here</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              {/* File Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[380px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                <div className="relative border-2 border-dashed border-[#E5322D] p-6 rounded-lg bg-white shadow-sm">
                  <FileText size={80} className="text-[#E5322D] opacity-90" />
                  <Crop className="absolute top-2 right-2 text-gray-400" size={20} />
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-6">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">Processed locally in browser</p>
              </div>

              {/* Crop Margin Controls */}
              <div className="w-full md:w-1/2 flex flex-col h-[380px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Margin Crop Settings (points)</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Top Margin</label>
                      <input 
                        type="number" 
                        value={margins.top} 
                        onChange={(e) => handleMarginChange('top', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Bottom Margin</label>
                      <input 
                        type="number" 
                        value={margins.bottom} 
                        onChange={(e) => handleMarginChange('bottom', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Left Margin</label>
                      <input 
                        type="number" 
                        value={margins.left} 
                        onChange={(e) => handleMarginChange('left', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Right Margin</label>
                      <input 
                        type="number" 
                        value={margins.right} 
                        onChange={(e) => handleMarginChange('right', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]" 
                      />
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg mt-4 leading-relaxed">
                    Adjust how many points to shave off from each edge. All pages will be cropped uniformly.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={cropPdf} 
                     disabled={isCropping} 
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isCropping ? <><Settings className="animate-spin" size={24} /> Cropping PDF...</> : <>Crop & Download <ArrowRight size={24} /></>}
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
