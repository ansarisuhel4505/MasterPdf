import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { UploadCloud, FileText, X, Hash, Settings } from 'lucide-react';

export default function PageNumbers() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [position, setPosition] = useState('center'); // 'left', 'center', 'right'

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

  // Client-Side Page Number Logic
  const addPageNumbers = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      pages.forEach((page, index) => {
        const { width, height } = page.getSize();
        const text = `Page ${index + 1} of ${pages.length}`;
        const textSize = 12;
        const textWidth = customFont.widthOfTextAtSize(text, textSize);
        
        let xPosition;
        if (position === 'left') {
          xPosition = 30; // 30px from left
        } else if (position === 'right') {
          xPosition = width - textWidth - 30; // 30px from right
        } else {
          xPosition = width / 2 - textWidth / 2; // Center
        }

        page.drawText(text, {
          x: xPosition,
          y: 30, // 30px from bottom margin
          size: textSize,
          font: customFont,
          color: rgb(0, 0, 0), // Black color
        });
      });

      const pdfBytes = await pdfDoc.save();

      // Download trigger karna
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_PageNumbers_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error adding page numbers:", error);
      alert("Failed to add page numbers. The file might be corrupted or encrypted.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Add page numbers to PDF online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Add page numbers</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Add page numbers into PDFs with ease. Choose your positions and dimensions.
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
                <div className="relative w-24 h-32 bg-white border-2 border-gray-300 shadow-md flex items-center justify-center mb-6">
                  <FileText size={40} className="text-[#E5322D] opacity-80" />
                  {/* Visual Indicator of Page Number Position */}
                  <div className={`absolute bottom-2 text-[8px] font-bold text-red-500 ${position === 'left' ? 'left-2' : position === 'right' ? 'right-2' : 'left-1/2 transform -translate-x-1/2'}`}>
                    1
                  </div>
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4">
                  {file.name}
                </p>
              </div>

              {/* Right Side: Page Number Settings */}
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Position Options</h3>
                  
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setPosition('left')}
                      className={`flex-1 py-4 border-2 rounded-xl text-sm font-bold transition ${position === 'left' ? 'border-[#E5322D] bg-red-50 text-[#E5322D]' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      Bottom Left
                    </button>
                    
                    <button 
                      onClick={() => setPosition('center')}
                      className={`flex-1 py-4 border-2 rounded-xl text-sm font-bold transition ${position === 'center' ? 'border-[#E5322D] bg-red-50 text-[#E5322D]' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      Bottom Center
                    </button>

                    <button 
                      onClick={() => setPosition('right')}
                      className={`flex-1 py-4 border-2 rounded-xl text-sm font-bold transition ${position === 'right' ? 'border-[#E5322D] bg-red-50 text-[#E5322D]' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}`}
                    >
                      Bottom Right
                    </button>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-6 bg-gray-50 p-4 rounded-lg">
                    Numbers will be added to the bottom margin of every page in the format: <strong>"Page 1 of X"</strong>.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={addPageNumbers}
                     disabled={isProcessing}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isProcessing ? (
                       <><Settings className="animate-spin" size={24} /> Processing...</>
                     ) : (
                       <>Add Page Numbers <Hash size={24} /></>
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