import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ScanText, Settings, Copy, CheckCircle2, Download, FileJson, FileSpreadsheet, FileSearch } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function OcrPdf() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [downloadLink, setDownloadLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [outputFormat, setOutputFormat] = useState('txt');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      resetStates();
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const resetStates = () => {
    setExtractedText('');
    setDownloadLink('');
  };

  const removeFile = () => {
    setFile(null);
    resetStates();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(extractedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadTextFile = () => {
    const blob = new Blob([extractedText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `MasterPdf_OCR_${file.name.split('.')[0]}.txt`;
    link.click();
  };

  const performOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    resetStates();
    
    try {
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });

      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'ocr-pdf', 
          fileUrl: blob.url,
          format: outputFormat 
        }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.downloadUrl) {
        if (outputFormat === 'txt') {
          const textResponse = await fetch(data.downloadUrl);
          const textContent = await textResponse.text();
          setExtractedText(textContent || "No text could be found or extracted from this document.");
        } else {
          // 🔥 SUPERFAST BROWSER DOWNLOAD TRICK 🔥
          setDownloadLink(data.downloadUrl); // Update UI
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.setAttribute('download', `MasterPdf_OCR_Result.${outputFormat}`);
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } else {
        alert(data.error || "OCR processing failed.");
      }
    } catch (error) {
      alert("Server connection failed.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      
      {/* 🔥 EXACT SEO HEAD POSITION 🔥 */}
      <Head>
        <title>OCR PDF Online | Extract Text from Scanned PDFs Free | MasterPdf</title>
        <meta name="description" content="Use Enterprise-grade OCR to convert scanned PDFs into searchable PDF, Word, Excel, or Text formats. 100% Free. Created by Suhel Ansari." />
        <meta name="keywords" content="ocr pdf, extract text from pdf, scanned pdf to word, image to text, searchable pdf, masterpdf, Suhel Ansari" />
        <meta property="og:title" content="OCR PDF Online | Extract Text from Scanned PDFs Free | MasterPdf" />
        <meta property="og:description" content="Convert scanned PDFs into searchable PDF, Word, Excel, or Text formats instantly." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <ScanText size={14} /> Enterprise OCR Engine
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Advanced Document OCR</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert scanned documents into searchable PDFs, editable Word files, Excel sheets, or raw text.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[500px] flex flex-col items-center justify-center relative">
          {!file ? (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-yellow-500 hover:bg-yellow-600 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Upload Scanned PDF
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              <div className="w-full md:w-1/3 flex flex-col justify-between bg-gray-50 border border-gray-200 rounded-lg p-6 relative">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                
                <div className="flex flex-col items-center mt-4">
                  <FileText size={60} className="text-yellow-500 mb-3 opacity-90" />
                  <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-2">{file.name}</p>
                </div>

                <div className="bg-white p-5 rounded-lg border border-gray-200 mt-6 shadow-sm">
                  <p className="text-sm font-bold text-gray-900 mb-3 border-b pb-2">Select Output Format</p>
                  
                  <div className="flex flex-col gap-3">
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${outputFormat === 'txt' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="format" value="txt" checked={outputFormat === 'txt'} onChange={(e) => setOutputFormat(e.target.value)} className="hidden" />
                      <FileJson size={18} className={outputFormat === 'txt' ? 'text-yellow-600' : 'text-gray-400'} />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Raw Text (.txt)</p>
                        <p className="text-[10px] text-gray-500">Best for AI and quick copy-pasting</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${outputFormat === 'pdfa' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="format" value="pdfa" checked={outputFormat === 'pdfa'} onChange={(e) => setOutputFormat(e.target.value)} className="hidden" />
                      <FileSearch size={18} className={outputFormat === 'pdfa' ? 'text-yellow-600' : 'text-gray-400'} />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Searchable PDF</p>
                        <p className="text-[10px] text-gray-500">Adds invisible text layer for archiving</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${outputFormat === 'docx' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="format" value="docx" checked={outputFormat === 'docx'} onChange={(e) => setOutputFormat(e.target.value)} className="hidden" />
                      <FileText size={18} className={outputFormat === 'docx' ? 'text-yellow-600' : 'text-gray-400'} />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Microsoft Word</p>
                        <p className="text-[10px] text-gray-500">Reconstructs layout for editing</p>
                      </div>
                    </label>

                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition ${outputFormat === 'xlsx' ? 'border-yellow-500 bg-yellow-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input type="radio" name="format" value="xlsx" checked={outputFormat === 'xlsx'} onChange={(e) => setOutputFormat(e.target.value)} className="hidden" />
                      <FileSpreadsheet size={18} className={outputFormat === 'xlsx' ? 'text-yellow-600' : 'text-gray-400'} />
                      <div>
                        <p className="text-sm font-bold text-gray-800">Microsoft Excel</p>
                        <p className="text-[10px] text-gray-500">Extracts tables and invoice data</p>
                      </div>
                    </label>
                  </div>
                </div>

                <button 
                  onClick={performOcr} 
                  disabled={isProcessing || extractedText || downloadLink} 
                  className="w-full mt-6 flex items-center justify-center gap-2 px-4 py-4 rounded-xl text-white font-bold text-sm transition shadow-md bg-gray-900 hover:bg-black disabled:bg-gray-400"
                >
                  {isProcessing ? <><Settings className="animate-spin" size={18} /> Processing Document...</> : <>Run OCR Engine <ScanText size={18} /></>}
                </button>
              </div>

              <div className="w-full md:w-2/3 flex flex-col min-h-[450px]">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="text-xl font-bold text-gray-900">Output Result</h3>
                  {extractedText && outputFormat === 'txt' && (
                    <div className="flex gap-3">
                      <button onClick={handleCopy} className="flex items-center gap-1 text-sm font-semibold text-gray-600 hover:text-yellow-600 transition">
                        {copied ? <><CheckCircle2 size={16} className="text-green-500"/> Copied!</> : <><Copy size={16}/> Copy</>}
                      </button>
                      <button onClick={downloadTextFile} className="flex items-center gap-1 text-sm font-semibold text-white bg-gray-800 px-3 py-1 rounded hover:bg-black transition">
                        <Download size={16}/> Save .txt
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="flex-grow bg-white border border-gray-200 rounded-xl p-6 overflow-y-auto shadow-inner flex flex-col justify-center">
                  {!extractedText && !downloadLink ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <ScanText size={50} className="mb-4 opacity-30" />
                      <p className="text-sm font-medium">Select your desired format and run the OCR engine.</p>
                    </div>
                  ) : outputFormat === 'txt' ? (
                    <textarea 
                      className="w-full h-full min-h-[300px] resize-none outline-none text-gray-800 text-[14px] leading-relaxed font-mono"
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                      <CheckCircle2 size={60} className="text-green-500 mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">Conversion Successful!</h3>
                      <p className="text-gray-500 mb-6">Your scanned document has been converted and downloaded securely.</p>
                      <a 
                        href={downloadLink}
                        download={`MasterPdf_OCR_Result.${outputFormat}`}
                        className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition transform hover:-translate-y-1"
                      >
                        <Download size={20} /> Download Manually
                      </a>
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
