import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, X, Edit3 } from 'lucide-react';

export default function EditPdf() {
  const [file, setFile] = useState(null);
  const [isSdkReady, setIsSdkReady] = useState(false);

  // Adobe API ko browser mein load karne ka logic
  useEffect(() => {
    const loadAdobeScript = () => {
      if (window.AdobeDC) {
        setIsSdkReady(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
      script.onload = () => setIsSdkReady(true);
      document.body.appendChild(script);
    };
    loadAdobeScript();
  }, []);

  // Jaise hi file upload ho, Adobe Viewer ko initialize karna
  useEffect(() => {
    if (isSdkReady && file && window.AdobeDC) {
      const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID || "PASTE_YOUR_CLIENT_ID_HERE_FOR_TESTING"; 
      
      const adobeDCView = new window.AdobeDC.View({
        clientId: clientId,
        divId: 'adobe-dc-view',
      });

      // Local file ko bina server par bheje ArrayBuffer mein convert karke Adobe ko dena
      const filePromise = file.arrayBuffer();

      adobeDCView.previewFile({
        content: { promise: filePromise },
        metaData: { fileName: file.name }
      }, {
        // Yeh options Drawing aur Text tools enable karte hain
        showAnnotationTools: true,
        showLeftHandPanel: false,
        showDownloadPDF: true,
        showPrintPDF: true,
        defaultViewMode: "FIT_WIDTH"
      });
    }
  }, [file, isSdkReady]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Pro Edit PDF - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Edit3 size={14} /> Pro Editor
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced PDF Editor</h1>
          <p className="text-gray-600">Draw, highlight, and add text directly to your PDF.</p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-[600px] flex flex-col relative">
          
          {!file ? (
            <div className="h-[500px] flex flex-col items-center justify-center">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg">
                <UploadCloud size={28} /> Select PDF to Edit
              </label>
              <p className="mt-4 text-gray-500 font-medium">Powered by Adobe PDF Engine</p>
            </div>
          ) : (
            <div className="w-full h-[700px] relative flex flex-col">
              <div className="flex justify-between items-center mb-2 px-2">
                <span className="font-bold text-gray-700">{file.name}</span>
                <button onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500 bg-gray-100 p-2 rounded-full transition">
                  <X size={16} />
                </button>
              </div>
              
              {/* Yeh woh Dabba hai jahan Adobe apna magic dikhayega */}
              <div id="adobe-dc-view" className="w-full h-full border border-gray-300 rounded-lg overflow-hidden"></div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
