import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, Unlock, Lock, Settings } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function UnlockPdf() {
  const [file, setFile] = useState(null);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile); setPassword(''); setErrorMsg('');
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => { setFile(null); setPassword(''); setErrorMsg(''); };

  const unlockPdf = async () => {
    if (!file || !password) { setErrorMsg("Password required."); return; }
    setIsUnlocking(true); setErrorMsg('');

    try {
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unlock-pdf', fileUrl: blob.url, password }),
      });
      
      const data = await response.json();
      if (response.ok && data.downloadUrl) {
        // 🔥 SUPERFAST BROWSER DOWNLOAD TRICK 🔥
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.setAttribute('download', `MasterPdf_Unlocked_${file.name}`);
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setErrorMsg(data.error || "Incorrect password.");
      }
    } catch (error) {
      setErrorMsg("Server connection failed.");
    }
    setIsUnlocking(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      {/* 🔥 EXACT SEO HEAD POSITION 🔥 */}
      <Head>
        <title>Unlock PDF Files Online Free | MasterPdf</title>
        <meta name="description" content="Remove PDF passwords securely and instantly. Free online PDF unlocker tool by MasterPdf. Created by Suhel Ansari." />
        <meta name="keywords" content="unlock pdf, remove pdf password, free pdf unlocker, decrypt pdf, masterpdf, Suhel Ansari" />
        <meta property="og:title" content="Unlock PDF Files Online Free | MasterPdf" />
        <meta property="og:description" content="Remove PDF passwords securely and instantly. Free online PDF unlocker tool." />
      </Head>

      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Unlock PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Remove password security from your PDF documents instantly.</p>
        </div>
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          {!file ? (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Select PDF file
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[350px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition"><X size={20} /></button>
                <div className="relative"><FileText size={80} className="text-[#E5322D] mb-4 opacity-90" /><div className="absolute -bottom-2 -right-2 bg-yellow-400 text-white p-2 rounded-full shadow-md"><Lock size={20} /></div></div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-4">{file.name}</p>
              </div>
              <div className="w-full md:w-1/2 flex flex-col h-[350px] justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Enter Document Password</h3>
                  <div className="flex flex-col gap-4">
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password..." className="w-full border rounded-md p-3 focus:outline-none focus:ring-2 focus:ring-[#E5322D]" />
                    {errorMsg && <p className="text-red-500 text-sm font-medium">{errorMsg}</p>}
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                   <button onClick={unlockPdf} disabled={isUnlocking || !password} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 disabled:bg-gray-400">
                     {isUnlocking ? <><Settings className="animate-spin" size={24} /> Processing...</> : <>Unlock PDF <Unlock size={24} /></>}
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
