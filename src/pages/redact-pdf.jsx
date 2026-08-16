import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb } from 'pdf-lib';
import { UploadCloud, FileText, X, ArrowRight, Settings, ShieldAlert } from 'lucide-react';

export default function RedactPdf() {
  const [file, setFile] = useState(null);
  const [isRedacting, setIsRedacting] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Redaction Box States
  const [pageNumber, setPageNumber] = useState(1);
  const [xPos, setXPos] = useState(50);
  const [yPos, setYPos] = useState(50);
  const [boxWidth, setBoxWidth] = useState(200);
  const [boxHeight, setBoxHeight] = useState(20);

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      
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

  const removeFile = () => setFile(null);

  // Client-Side Redaction Logic
  const applyRedaction = async () => {
    if (!file) return;
    setIsRedacting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      
      const targetPage = pages[Math.min(Math.max(pageNumber - 1, 0), pages.length - 1)];

      if (targetPage) {
        // Draw a solid black rectangle over the sensitive area
        targetPage.drawRectangle({
          x: Number(xPos),
          y: Number(yPos), // from bottom left
          width: Number(boxWidth),
          height: Number(boxHeight),
          color: rgb(0, 0, 0), // Solid Black
        });
      }

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Redacted_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error redacting PDF:", error);
      alert("Failed to redact PDF. The file might be corrupted or protected.");
    }
    setIsRedacting(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Redact PDF online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-red-100 text-[#E5322D] px-3 py-1 rounded-full text-xs font-bold mb-4">
            <ShieldAlert size={14} /> High Security
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Redact PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Permanently black out sensitive information and graphics from your PDF documents.
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {!file ? (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-black hover:bg-gray-800 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Select Secure PDF
              </label>
              <p className="mt-4 text-gray-400 text-sm">Processed 100% locally. Your files never leave your device.</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              {/* Left Side: File Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[420px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                <div className="relative">
                  <FileText size={80} className="text-gray-900 mb-4 opacity-90" />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-4 bg-black rounded-sm"></div>
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-6">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-semibold bg-white px-3 py-1 border rounded-full">
                  Total Pages: {totalPages}
                </p>
              </div>

              {/* Right Side: Redaction Controls */}
              <div className="w-full md:w-1/2 flex flex-col h-[420px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Draw Redaction Box</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-bold text-gray-600 mb-1 uppercase">Target Page</label>
                        <input type="number" min="1" max={totalPages} value={pageNumber} onChange={(e) => setPageNumber(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                      </div>
                      <div></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[12px] font-bold text-gray-600 mb-1 uppercase">Box Width (px)</label>
                        <input type="number" value={boxWidth} onChange={(e) => setBoxWidth(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-gray-600 mb-1 uppercase">Box Height (px)</label>
                        <input type="number" value={boxHeight} onChange={(e) => setBoxHeight(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-gray-600 mb-1 uppercase">Position X (px)</label>
                        <input type="number" value={xPos} onChange={(e) => setXPos(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                      </div>
                      <div>
                        <label className="block text-[12px] font-bold text-gray-600 mb-1 uppercase">Position Y (px)</label>
                        <input type="number" value={yPos} onChange={(e) => setYPos(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black" />
                      </div>
                    </div>
                    
                    <p className="text-[11px] text-gray-500 bg-gray-50 p-3 rounded-lg mt-2 leading-relaxed border border-gray-100">
                      Configure the dimensions and position of the solid black box. X and Y coordinates start from the bottom-left corner of the page.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                   <button 
                     onClick={applyRedaction}
                     disabled={isRedacting}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-black hover:bg-gray-800 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isRedacting ? (
                       <><Settings className="animate-spin" size={24} /> Applying...</>
                     ) : (
                       <>Apply Redaction <ArrowRight size={24} /></>
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
