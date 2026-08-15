import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, Trash2, Settings, Layers } from 'lucide-react';

export default function OrganizePdf() {
  const [file, setFile] = useState(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [pagesToRemove, setPagesToRemove] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPagesToRemove('');
      
      // Total pages count karna
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdfDoc.getPageCount());
      } catch (error) {
        console.error("Error reading PDF:", error);
        setTotalPages(0);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setTotalPages(0);
    setPagesToRemove('');
  };

  // Client-Side Remove Pages Logic
  const processPdf = async () => {
    if (!file) return;

    // Input string ko numbers ke array mein convert karna
    const pagesToDelete = pagesToRemove
      .split(',')
      .map(num => parseInt(num.trim()))
      .filter(num => !isNaN(num) && num > 0 && num <= totalPages);

    if (pagesToDelete.length === 0) {
      alert("Please enter valid page numbers to remove.");
      return;
    }

    if (pagesToDelete.length === totalPages) {
      alert("You cannot remove all pages from the document.");
      return;
    }

    setIsOrganizing(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      // Unique page numbers nikalna aur DESCENDING order mein sort karna
      // (Descending zaroori hai taaki aage ke pages delete karne se piche walo ka index change na ho)
      const uniquePages = [...new Set(pagesToDelete)].sort((a, b) => b - a);

      uniquePages.forEach(pageNum => {
        // pdf-lib mein page index 0 se shuru hota hai
        pdfDoc.removePage(pageNum - 1);
      });

      const pdfBytes = await pdfDoc.save();

      // Download trigger karna
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Organized_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error organizing PDF:", error);
      alert("Failed to remove pages. The file might be corrupted or encrypted.");
    }
    setIsOrganizing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Organize PDF pages online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Organize PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Sort, add and delete PDF pages. Remove the pages you don't need instantly.
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
                  <Layers size={80} className="text-[#E5322D] mb-4 opacity-90" />
                  <div className="absolute -bottom-2 -right-2 bg-red-100 text-red-500 p-2 rounded-full shadow-sm">
                    <Trash2 size={16} />
                  </div>
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-4">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-semibold bg-white px-3 py-1 border rounded-full">
                  Total Pages: {totalPages}
                </p>
              </div>

              {/* Right Side: Delete Pages Settings */}
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Remove Pages</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Pages to delete (comma separated)
                      </label>
                      <input 
                        type="text" 
                        value={pagesToRemove}
                        onChange={(e) => setPagesToRemove(e.target.value)}
                        placeholder="e.g. 1, 3, 5"
                        className="w-full border border-gray-300 rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#E5322D] font-mono"
                      />
                    </div>
                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg mt-2 leading-relaxed">
                      Enter the exact page numbers you want to permanently remove from this document. The remaining pages will be saved as a new file.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={processPdf}
                     disabled={isOrganizing || !pagesToRemove.trim()}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isOrganizing ? (
                       <><Settings className="animate-spin" size={24} /> Processing...</>
                     ) : (
                       <>Remove Pages <Trash2 size={24} /></>
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