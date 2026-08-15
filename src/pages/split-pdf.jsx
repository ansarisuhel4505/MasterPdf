import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, Scissors, Settings } from 'lucide-react';

export default function SplitPdf() {
  const [file, setFile] = useState(null);
  const [isSplitting, setIsSplitting] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);

  // File upload handle karna aur total pages count karna
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      
      // PDF load karke pages count nikalna
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const count = pdfDoc.getPageCount();
        setTotalPages(count);
        setEndPage(count); // By default end page ko last page set kar do
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Failed to read PDF. It might be encrypted or corrupted.");
        setFile(null);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setTotalPages(0);
    setStartPage(1);
    setEndPage(1);
  };

  // Asli PDF Splitting Logic
  const splitPdf = async () => {
    if (!file) return;

    if (startPage < 1 || endPage > totalPages || startPage > endPage) {
      alert(`Please enter a valid range between 1 and ${totalPages}.`);
      return;
    }

    setIsSplitting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const newPdf = await PDFDocument.create();

      // Start page aur End page ke beech ke pages copy karna (0-indexed ke hisaab se)
      const pageIndices = [];
      for (let i = startPage - 1; i < endPage; i++) {
        pageIndices.push(i);
      }

      const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();

      // Download trigger karna
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Split_${startPage}-${endPage}.pdf`;
      link.click();

    } catch (error) {
      console.error("Error splitting PDF:", error);
      alert("Failed to split PDF.");
    }
    setIsSplitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Head>
        <title>Split PDF files online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Split PDF file</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Separate one page or a whole set for easy conversion into independent PDF files.
          </p>
        </div>

        {/* Upload Area OR File Options Area */}
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col items-center justify-center relative">
          
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
            <div className="w-full h-full flex flex-col items-center md:flex-row gap-8 md:items-start pt-4">
              
              {/* Left Side: File Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative group h-full min-h-[250px]">
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
                <p className="text-xs text-gray-500 mt-2">{totalPages} Pages</p>
              </div>

              {/* Right Side: Split Options */}
              <div className="w-full md:w-1/2 flex flex-col h-full justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Custom Range</h3>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">From Page</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={totalPages}
                        value={startPage}
                        onChange={(e) => setStartPage(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">To Page</label>
                      <input 
                        type="number" 
                        min="1" 
                        max={totalPages}
                        value={endPage}
                        onChange={(e) => setEndPage(Number(e.target.value))}
                        className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-md">
                    This will create a single PDF file containing pages from <strong>{startPage}</strong> to <strong>{endPage}</strong>.
                  </p>
                </div>

                <div className="mt-8 flex justify-end">
                   <button 
                     onClick={splitPdf}
                     disabled={isSplitting}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isSplitting ? (
                       <><Settings className="animate-spin" size={24} /> Splitting...</>
                     ) : (
                       <>Split PDF <Scissors size={24} /></>
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