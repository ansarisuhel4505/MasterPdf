import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, ArrowRight, Settings } from 'lucide-react';

export default function MergePdf() {
  const [files, setFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);

  // Files select karne ka function
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    // Sirf PDF files allow karein
    const pdfFiles = selectedFiles.filter(file => file.type === 'application/pdf');
    setFiles([...files, ...pdfFiles]);
  };

  // Selected file ko list se hatane ka function
  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  // Asli PDF Merging Logic (Browser ke andar)
  const mergePdfs = async () => {
    if (files.length < 2) {
      alert("Please select at least 2 PDF files to merge.");
      return;
    }
    
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const pdfBytes = await mergedPdf.save();
      
      // Download trigger karna
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'MasterPdf_Merged.pdf';
      link.click();
      
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Failed to merge PDFs. The file might be encrypted or corrupted.");
    }
    setIsMerging(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <Head>
        <title>Merge PDF files online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Merge PDF files</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Combine PDFs in the order you want with the easiest PDF merger available.
          </p>
        </div>

        {/* Upload Area OR File List Area */}
        <div className="w-full max-w-4xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[400px] flex flex-col items-center justify-center relative">
          
          {files.length === 0 ? (
            // Upload State
            <div className="text-center w-full">
              <input 
                type="file" 
                id="file-upload" 
                multiple 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <UploadCloud size={28} />
                Select PDF files
              </label>
              <p className="mt-4 text-gray-400 text-sm">or drop PDFs here</p>
            </div>
          ) : (
            // Files Selected State
            <div className="w-full h-full flex flex-col">
              <div className="flex-grow w-full overflow-y-auto mb-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                  {files.map((file, index) => (
                    <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center relative group">
                      <button 
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition"
                      >
                        <X size={16} />
                      </button>
                      <FileText size={48} className="text-[#E5322D] mb-2 opacity-80" />
                      <p className="text-xs text-center text-gray-700 font-medium truncate w-full" title={file.name}>
                        {file.name}
                      </p>
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition min-h-[120px]">
                     <input type="file" id="add-more" multiple accept=".pdf" onChange={handleFileChange} className="hidden" />
                     <label htmlFor="add-more" className="cursor-pointer flex flex-col items-center text-gray-500 hover:text-gray-700">
                        <span className="text-3xl mb-1">+</span>
                        <span className="text-xs font-semibold">Add more</span>
                     </label>
                  </div>
                </div>
              </div>

              {/* Merge Button Sticky at Bottom */}
              <div className="mt-auto flex justify-end w-full border-t border-gray-100 pt-6">
                 <button 
                   onClick={mergePdfs}
                   disabled={isMerging || files.length < 2}
                   className={`flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md ${files.length < 2 ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#E5322D] hover:bg-red-700 hover:shadow-lg'}`}
                 >
                   {isMerging ? (
                     <><Settings className="animate-spin" size={24} /> Merging PDFs...</>
                   ) : (
                     <>Merge PDF <ArrowRight size={24} /></>
                   )}
                 </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}