import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, PenTool, Settings, Image as ImageIcon } from 'lucide-react';

export default function SignPdf() {
  const [file, setFile] = useState(null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [isSigning, setIsSigning] = useState(false);

  const handlePdfChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const handleSignatureChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg')) {
      setSignatureFile(selectedFile);
      setSignaturePreview(URL.createObjectURL(selectedFile));
    } else {
      alert("Please upload a valid signature image (PNG or JPG).");
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const removeSignature = () => {
    setSignatureFile(null);
    setSignaturePreview(null);
  };

  // Client-Side PDF Signing Logic
  const signPdf = async () => {
    if (!file || !signatureFile) return;

    setIsSigning(true);
    try {
      // Load PDF
      const pdfBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(pdfBuffer);

      // Load Signature Image
      const sigBuffer = await signatureFile.arrayBuffer();
      let signatureImage;
      
      if (signatureFile.type === 'image/png') {
        signatureImage = await pdfDoc.embedPng(sigBuffer);
      } else {
        signatureImage = await pdfDoc.embedJpg(sigBuffer);
      }

      // Get the first page to place the signature
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      // Scale signature down (max width 150px)
      const scaleFactor = 150 / signatureImage.width;
      const scaledWidth = signatureImage.width * scaleFactor;
      const scaledHeight = signatureImage.height * scaleFactor;

      // Draw image on the bottom right corner of the first page
      firstPage.drawImage(signatureImage, {
        x: width - scaledWidth - 50, // 50px margin from right
        y: 50,                       // 50px margin from bottom
        width: scaledWidth,
        height: scaledHeight,
      });

      const pdfBytes = await pdfDoc.save();

      // Trigger Download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Signed_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error signing PDF:", error);
      alert("Failed to sign PDF. The file might be encrypted or corrupted.");
    }
    setIsSigning(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Sign PDF documents online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Sign PDF document</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Add your electronic signature to your PDF document instantly.
          </p>
        </div>

        {/* Workspace Area */}
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {!file ? (
            // Upload State
            <div className="text-center w-full">
              <input 
                type="file" 
                id="pdf-upload" 
                accept=".pdf" 
                onChange={handlePdfChange} 
                className="hidden" 
              />
              <label 
                htmlFor="pdf-upload" 
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
                  {signaturePreview && (
                    <div className="absolute -bottom-4 -right-4 bg-white p-1 rounded-md shadow-lg border border-gray-200">
                      <PenTool size={20} className="text-blue-500" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-4">
                  {file.name}
                </p>
              </div>

              {/* Right Side: Signature Upload */}
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Your Signature</h3>
                  
                  {!signatureFile ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50">
                      <input 
                        type="file" 
                        id="sig-upload" 
                        accept="image/png, image/jpeg" 
                        onChange={handleSignatureChange} 
                        className="hidden" 
                      />
                      <label htmlFor="sig-upload" className="cursor-pointer flex flex-col items-center">
                        <ImageIcon size={32} className="text-gray-400 mb-3" />
                        <span className="text-sm font-bold text-gray-700 hover:text-[#E5322D] transition">Upload Signature Image</span>
                        <span className="text-xs text-gray-500 mt-1">PNG or JPG</span>
                      </label>
                    </div>
                  ) : (
                    <div className="relative border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col items-center justify-center h-32">
                      <button 
                        onClick={removeSignature}
                        className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-1 shadow-sm transition"
                      >
                        <X size={16} />
                      </button>
                      <img src={signaturePreview} alt="Signature" className="max-h-full object-contain mix-blend-multiply" />
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-500 mt-4 leading-relaxed">
                    Upload an image of your signature. We will automatically place it on the bottom-right corner of the first page.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={signPdf}
                     disabled={isSigning || !signatureFile}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isSigning ? (
                       <><Settings className="animate-spin" size={24} /> Signing...</>
                     ) : (
                       <>Sign PDF <PenTool size={24} /></>
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