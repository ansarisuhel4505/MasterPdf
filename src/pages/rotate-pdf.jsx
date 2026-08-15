import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, degrees } from 'pdf-lib';
import { UploadCloud, FileText, X, RotateCw, RotateCcw, Settings, ArrowRight } from 'lucide-react';

export default function RotatePdf() {
  const [file, setFile] = useState(null);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationAmount, setRotationAmount] = useState(0); // 0, 90, 180, 270

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setRotationAmount(0); // File change hone par rotation reset
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setRotationAmount(0);
  };

  const rotateRight = () => {
    setRotationAmount((prev) => (prev + 90) % 360);
  };

  const rotateLeft = () => {
    setRotationAmount((prev) => (prev - 90) % 360);
  };

  // Client-Side PDF Rotation Logic
  const applyRotation = async () => {
    if (!file) return;
    if (rotationAmount === 0) {
      alert("Please rotate the document first.");
      return;
    }

    setIsRotating(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();

      // Har page par naya rotation apply karna
      pages.forEach((page) => {
        const currentRotation = page.getRotation().angle;
        // Current angle mein naya angle add karke normalize karna
        page.setRotation(degrees((currentRotation + rotationAmount) % 360));
      });

      const pdfBytes = await pdfDoc.save();

      // Download trigger karna
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Rotated_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error rotating PDF:", error);
      alert("Failed to rotate PDF. The file might be corrupted or protected.");
    }
    setIsRotating(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Rotate PDF files online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Rotate PDF files</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Rotate your PDFs the way you need them. Apply rotation to your document instantly.
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
              
              {/* Left Side: Live Preview Area */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[350px] overflow-hidden">
                <button 
                  onClick={removeFile}
                  className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition z-10"
                >
                  <X size={20} />
                </button>
                
                {/* Visual Preview of Rotation */}
                <div 
                  className="flex flex-col items-center justify-center transition-transform duration-300 ease-in-out"
                  style={{ transform: `rotate(${rotationAmount}deg)` }}
                >
                  <FileText size={100} className="text-[#E5322D] mb-4 opacity-90" />
                  <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 max-w-[200px]">
                    {file.name}
                  </p>
                </div>
              </div>

              {/* Right Side: Rotation Controls */}
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Direction</h3>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={rotateLeft}
                      className="flex-1 flex flex-col items-center justify-center gap-2 py-6 border-2 border-gray-200 rounded-xl hover:border-[#E5322D] hover:bg-red-50 text-gray-700 transition"
                    >
                      <RotateCcw size={32} />
                      <span className="font-semibold text-sm">Left</span>
                    </button>
                    
                    <button 
                      onClick={rotateRight}
                      className="flex-1 flex flex-col items-center justify-center gap-2 py-6 border-2 border-gray-200 rounded-xl hover:border-[#E5322D] hover:bg-red-50 text-gray-700 transition"
                    >
                      <RotateCw size={32} />
                      <span className="font-semibold text-sm">Right</span>
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-6 bg-gray-50 p-4 rounded-lg">
                    Current Rotation: <strong className="text-gray-900">{rotationAmount > 0 ? rotationAmount : 360 + rotationAmount}°</strong>
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={applyRotation}
                     disabled={isRotating || rotationAmount === 0}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     {isRotating ? (
                       <><Settings className="animate-spin" size={24} /> Rotating...</>
                     ) : (
                       <>Rotate PDF <ArrowRight size={24} /></>
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