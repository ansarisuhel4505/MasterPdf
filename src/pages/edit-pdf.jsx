import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { UploadCloud, FileText, X, Edit3, ArrowRight, Settings, Type } from 'lucide-react';

export default function EditPdf() {
  const [file, setFile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Editor States
  const [textToAdd, setTextToAdd] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [xPos, setXPos] = useState(50);
  const [yPos, setYPos] = useState(50);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      
      // Load PDF to get total pages
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
      } catch (error) {
        console.error("Error reading PDF:", error);
        setTotalPages(1);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setTextToAdd('');
  };

  // Client-Side PDF Editing Logic
  const applyEdit = async () => {
    if (!file || !textToAdd.trim()) return;
    setIsEditing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      // Embed standard font
      const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();
      
      // Target specific page (0-indexed)
      const targetPage = pages[Math.min(Math.max(pageNumber - 1, 0), pages.length - 1)];

      if (targetPage) {
        targetPage.drawText(textToAdd, {
          x: Number(xPos),
          y: Number(yPos), // from bottom
          size: 16,
          font: helveticaFont,
          color: rgb(0, 0, 0), // Black text
        });
      }

      const pdfBytes = await pdfDoc.save();

      // Trigger Download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Edited_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error editing PDF:", error);
      alert("Failed to edit PDF. The file might be corrupted or heavily encrypted.");
    }
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Edit PDF files online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Edit PDF Document</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Add custom text annotations and notes directly to your PDF pages.
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {!file ? (
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
              <p className="mt-4 text-gray-400 text-sm">Processed locally in your browser</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              {/* Left Side: File Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[420px]">
                <button 
                  onClick={removeFile}
                  className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition"
                >
                  <X size={20} />
                </button>
                <div className="relative">
                  <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                  <div className="absolute -bottom-2 -right-2 bg-blue-100 text-blue-600 p-2 rounded-full shadow-sm">
                    <Edit3 size={16} />
                  </div>
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-4">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-semibold bg-white px-3 py-1 border rounded-full">
                  Total Pages: {totalPages}
                </p>
              </div>

              {/* Right Side: Edit Tools */}
              <div className="w-full md:w-1/2 flex flex-col h-[420px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Add Text</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">Text to Insert</label>
                      <div className="relative">
                        <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                          type="text" 
                          value={textToAdd}
                          onChange={(e) => setTextToAdd(e.target.value)}
                          placeholder="e.g. Approved, Signed, or any notes"
                          className="w-full border border-gray-300 rounded-md py-2.5 pl-9 pr-3 focus:outline-none focus:ring-2 focus:ring-[#E5322D] text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">Target Page</label>
                        <input 
                          type="number" 
                          min="1"
                          max={totalPages}
                          value={pageNumber}
                          onChange={(e) => setPageNumber(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">Position X (px)</label>
                        <input 
                          type="number" 
                          value={xPos}
                          onChange={(e) => setXPos(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]" 
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-600 mb-1 uppercase">Position Y (px)</label>
                        <input 
                          type="number" 
                          value={yPos}
                          onChange={(e) => setYPos(e.target.value)}
                          className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]" 
                        />
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-lg mt-1 leading-relaxed border border-gray-100">
                      <strong>Tip:</strong> Position X moves text left/right. Position Y moves text up/down from the bottom of the page.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                   <button 
                     onClick={applyEdit}
                     disabled={isEditing || !textToAdd.trim()}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isEditing ? (
                       <><Settings className="animate-spin" size={24} /> Saving PDF...</>
                     ) : (
                       <>Apply & Download <ArrowRight size={24} /></>
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
