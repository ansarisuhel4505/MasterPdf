import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ArrowRight, Settings, CheckCircle2 } from 'lucide-react';

export default function GenericToolPage() {
  const router = useRouter();
  const { tool } = router.query;
  
  // Tool ke naam ko readable format mein convert karna (e.g. "pdf-to-word" -> "Pdf To Word")
  const formattedToolName = tool 
    ? tool.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
    : 'PDF Tool';

  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSuccess(false);
    }
  };

 // Updated Client-to-Server API Connection Logic for Master Backend
  // Flawless Client-to-Server API Connection Logic
  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', tool); 

    try {
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        body: formData, 
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        
        // Agar backend ne file URL diya hai (Normal Conversions)
        if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = `MasterPdf_Result_${file.name}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } 
        // Agar backend ne Text diya hai (AI Summarizer / Translate)
        else if (data.textResult) {
          alert("AI Result:\n\n" + data.textResult);
        }
      } else {
        alert("Error from server: " + data.error);
        setSuccess(false);
      }
    } catch (error) {
      console.error("API connection failed:", error);
      alert("Failed to connect to the backend server.");
      setSuccess(false);
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>{formattedToolName} online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">{formattedToolName}</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Easily perform {formattedToolName.toLowerCase()} operations securely with MasterPdf online tools.
          </p>
        </div>

        {/* Workspace Area */}
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {!file ? (
            <div className="text-center w-full">
              <input 
                type="file" 
                id="file-upload" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <UploadCloud size={28} />
                Select file for {formattedToolName}
              </label>
              <p className="mt-4 text-gray-400 text-sm">or drop file here</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              {/* File Preview */}
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[350px]">
                <button 
                  onClick={removeFile}
                  className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition"
                >
                  <X size={20} />
                </button>
                <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-4">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>

              {/* Action Area */}
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Ready to Process</h3>
                  
                  {success ? (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl flex items-center gap-3 text-green-700">
                      <CheckCircle2 size={24} />
                      <div>
                        <p className="font-bold">Process Completed Successfully!</p>
                        <p className="text-xs text-green-600 mt-0.5">Your file has been optimized using {formattedToolName}.</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 leading-relaxed bg-gray-50 p-4 rounded-lg">
                      Your file is loaded and ready. Click the button below to execute <strong>{formattedToolName}</strong> securely inside your browser environment.
                    </p>
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={handleProcess}
                     disabled={isProcessing || success}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isProcessing ? (
                       <><Settings className="animate-spin" size={24} /> Processing...</>
                     ) : success ? (
                       <>Done Successfully</>
                     ) : (
                       <>Execute {formattedToolName} <ArrowRight size={24} /></>
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