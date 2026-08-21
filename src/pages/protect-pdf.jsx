import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, Lock, Settings } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function ProtectPdf() {
  const [file, setFile] = useState(null);
  const [isProtecting, setIsProtecting] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => setFile(null);

  const protectPdf = async () => {
    if (!file) return;

    if (password.length < 4) {
      setPasswordError("Password must be at least 4 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setPasswordError('');
    setIsProtecting(true);

    try {
      const blob = await upload(file.name, file, { 
        access: 'public', 
        handleUploadUrl: '/api/upload' 
      });

      const res = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'protect-pdf', 
          fileUrl: blob.url, 
          password: password 
        }),
      });
      
      const data = await res.json();

      if (res.ok && data.downloadUrl) {
        // 🔥 SUPERFAST BROWSER DOWNLOAD TRICK 🔥
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.setAttribute('download', `MasterPdf_Protected_${file.name}`);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Error: " + data.error);
      }
    } catch (error) {
      console.error("Error protecting PDF:", error);
      alert("Server connection failed.");
    }
    
    setIsProtecting(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      {/* 🔥 EXACT SEO HEAD POSITION 🔥 */}
      <Head>
        <title>Protect PDF Files Online Free | MasterPdf</title>
        <meta name="description" content="Encrypt your PDF with a strong password to prevent unauthorized access. 100% secure and free PDF protector by MasterPdf. Created by Suhel Ansari." />
        <meta name="keywords" content="protect pdf, encrypt pdf, add password to pdf, secure pdf, masterpdf, Suhel Ansari" />
        <meta property="og:title" content="Protect PDF Files Online Free | MasterPdf" />
        <meta property="og:description" content="Encrypt your PDF with a strong password to prevent unauthorized access. 100% secure." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Protect PDF file</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Encrypt your PDF with a password to prevent unauthorized access.
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
              <p className="mt-4 text-gray-400 text-sm">or drop PDF here</p>
              
              <div className="mt-8 flex items-center justify-center gap-2 text-green-600 bg-green-50 w-fit mx-auto px-4 py-2 rounded-full text-sm font-semibold">
                <Lock size={16} /> Files are processed directly in your browser. 100% Secure.
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[350px]">
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
              </div>

              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Set up a password</h3>
                  
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Type password</label>
                      <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 ${passwordError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#E5322D]'}`}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Repeat password</label>
                      <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat password"
                        className={`w-full border rounded-md p-3 focus:outline-none focus:ring-2 ${passwordError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-[#E5322D]'}`}
                      />
                    </div>

                    {passwordError && (
                      <p className="text-red-500 text-sm font-medium animate-pulse">{passwordError}</p>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={protectPdf}
                     disabled={isProtecting || !password || !confirmPassword}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isProtecting ? (
                       <><Settings className="animate-spin" size={24} /> Encrypting...</>
                     ) : (
                       <>Protect PDF <Lock size={24} /></>
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
