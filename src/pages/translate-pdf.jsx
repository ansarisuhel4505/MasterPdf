import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, Languages, Settings, Copy, CheckCircle2, ArrowRight, Download } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function TranslatePdf() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [translation, setTranslation] = useState('');
  const [copied, setCopied] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState('Hindi');

  const languages = [
    'Hindi', 'Spanish', 'French', 'German', 'Chinese', 
    'Arabic', 'Japanese', 'Russian', 'Portuguese', 'English', 
    'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Urdu'
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setTranslation('');
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setTranslation('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(translation);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTranslatedText = () => {
    if (!translation) return;
    const blob = new Blob([translation], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Translated_${targetLanguage}_${file?.name?.split('.')[0] || 'document'}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateTranslation = async () => {
    if (!file) return;
    setIsProcessing(true);
    
    try {
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'translate-pdf', 
          fileUrl: blob.url,
          targetLanguage: targetLanguage 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.textResult) {
        setTranslation(data.textResult);
      } else {
        alert(data.error || "Translation failed.");
      }
    } catch (error) {
      alert("Server connection failed.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Translate PDF Online Free with AI | MasterPdf</title>
        <meta name="description" content="Translate PDF documents into Hindi, Spanish, French, Arabic, and 10+ languages instantly using AI. Fast and secure document translation by MasterPdf." />
        <meta name="keywords" content="translate pdf, pdf translator online, ai pdf translate, free pdf translation, masterpdf" />
        <meta property="og:title" content="Translate PDF Online Free with AI | MasterPdf" />
        <meta property="og:description" content="Translate PDF documents into Hindi, Spanish, French, and more using AI." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Languages size={14} /> AI Translation Engine
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Translate PDF Document</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Accurately translate documents across multiple global languages using advanced AI processing.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          {!file ? (
            <div className="text-center w-full py-12">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Select PDF Document
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              <div className="w-full md:w-1/3 flex flex-col h-[400px] justify-between bg-gray-50 border border-gray-200 rounded-lg p-6 relative">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                
                <div className="flex flex-col items-center mt-4">
                  <FileText size={64} className="text-[#E5322D] mb-3 opacity-90" />
                  <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-2">{file.name}</p>
                </div>

                <div className="w-full mt-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Target Language</label>
                  <select 
                    value={targetLanguage}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#E5322D] bg-white font-medium text-gray-700"
                  >
                    {languages.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                <button 
                  onClick={generateTranslation} 
                  disabled={isProcessing} 
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-white font-bold text-sm transition shadow-md bg-[#E5322D] hover:bg-red-700 disabled:bg-gray-400"
                >
                  {isProcessing ? <><Settings className="animate-spin" size={18} /> Processing...</> : <>Translate Document <ArrowRight size={18} /></>}
                </button>
              </div>

              <div className="w-full md:w-2/3 flex flex-col h-[400px]">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Output Result</h3>
                  {translation && (
                    <div className="flex items-center gap-2">
                      <button onClick={handleCopy} className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-[#E5322D] transition px-2 py-1 rounded hover:bg-gray-100">
                        {copied ? <><CheckCircle2 size={16} className="text-green-500"/> Copied!</> : <><Copy size={16}/> Copy</>}
                      </button>
                      <button onClick={downloadTranslatedText} className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-[#E5322D] transition px-2 py-1 rounded hover:bg-gray-100">
                        <Download size={16} /> Save .txt
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow bg-white border border-gray-200 rounded-xl p-6 overflow-y-auto shadow-inner">
                  {!translation ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <Languages size={50} className="mb-4 opacity-30" />
                      <p className="text-sm font-medium">Select a language and click Translate to view output.</p>
                    </div>
                  ) : (
                    <div className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                      {translation}
                    </div>
                  )}
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
