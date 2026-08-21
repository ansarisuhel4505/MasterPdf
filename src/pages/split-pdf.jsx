import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { 
  UploadCloud, FileText, X, Scissors, Settings, 
  Layers, Download, AlertTriangle
} from 'lucide-react';

export default function SplitPdf() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [totalPages, setTotalPages] = useState(0);

  // Split Modes: 'extract', 'every', 'custom'
  const [splitMode, setSplitMode] = useState('extract');

  // Mode 1: Extract Range (From - To)
  const [extractStart, setExtractStart] = useState(1);
  const [extractEnd, setExtractEnd] = useState(1);

  // Mode 2: Split Every N Pages
  const [everyN, setEveryN] = useState(2);

  // Mode 3: Custom Groups (e.g., 1-5, 7, 9-12)
  const [customInput, setCustomInput] = useState('');

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const count = pdfDoc.getPageCount();
        setTotalPages(count);
        setExtractEnd(count);
        setCustomInput(`1-${count}`);
      } catch (error) {
        console.error("Error loading PDF:", error);
        alert("Failed to read PDF. It might be encrypted or corrupted.");
        setFile(null);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
    setTotalPages(0);
    setExtractStart(1);
    setExtractEnd(1);
    setCustomInput('');
    setIsProcessing(false);
  };

  const getPageGroups = () => {
    let groups = [];

    if (splitMode === 'extract') {
      if (extractStart < 1 || extractEnd > totalPages || extractStart > extractEnd) {
        alert(`Please enter a valid range between 1 and ${totalPages}.`);
        return null;
      }
      groups.push({ start: extractStart - 1, end: extractEnd - 1 });
    } 
    else if (splitMode === 'every') {
      if (everyN < 1) { alert("Please enter at least 1 page."); return null; }
      for (let i = 0; i < totalPages; i += everyN) {
        groups.push({ start: i, end: Math.min(i + everyN - 1, totalPages - 1) });
      }
    } 
    else if (splitMode === 'custom') {
      if (!customInput.trim()) { alert("Please enter custom groups."); return null; }
      const parts = customInput.split(',').map(s => s.trim());
      for (const part of parts) {
        if (part.includes('-')) {
          const [s, e] = part.split('-').map(Number);
          if (isNaN(s) || isNaN(e) || s < 1 || e > totalPages || s > e) {
            alert(`Invalid range: "${part}". Range must be within 1-${totalPages}.`);
            return null;
          }
          groups.push({ start: s - 1, end: e - 1 });
        } else {
          const p = Number(part);
          if (isNaN(p) || p < 1 || p > totalPages) {
            alert(`Invalid page number: "${part}". Must be 1-${totalPages}.`);
            return null;
          }
          groups.push({ start: p - 1, end: p - 1 });
        }
      }
    }
    return groups;
  };

  const splitPdf = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const groups = getPageGroups();
      if (!groups) { setIsProcessing(false); return; }

      const pdfFiles = [];

      for (let i = 0; i < groups.length; i++) {
        const { start, end } = groups[i];
        const newPdf = await PDFDocument.create();
        
        const pageIndices = [];
        for (let j = start; j <= end; j++) pageIndices.push(j);
        
        const copiedPages = await newPdf.copyPages(originalPdf, pageIndices);
        copiedPages.forEach((page) => newPdf.addPage(page));

        const pdfBytes = await newPdf.save();
        const fileName = `MasterPdf_Split_Part_${i+1}_(Page_${start+1}-${end+1}).pdf`;
        pdfFiles.push({ bytes: pdfBytes, name: fileName });
      }

      if (pdfFiles.length === 1) {
        const blob = new Blob([pdfFiles[0].bytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = pdfFiles[0].name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (pdfFiles.length > 1) {
        const zip = new JSZip();
        for (const pdf of pdfFiles) {
          zip.file(pdf.name, pdf.bytes);
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `MasterPdf_Split_Parts.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

    } catch (error) {
      console.error("Error splitting PDF:", error);
      alert("Failed to split PDF.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Split PDF Files Online Free | MasterPdf</title>
        <meta name="description" content="Separate and extract specific pages from PDF documents online for free. Download single or multiple pages in a ZIP file securely with MasterPdf." />
        <meta name="keywords" content="split pdf, extract pdf pages, separate pdf pages, free pdf splitter, masterpdf" />
        <meta property="og:title" content="Split PDF Files Online Free | MasterPdf" />
        <meta property="og:description" content="Separate and extract specific pages from PDF documents online for free." />
      </Head>

      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Split PDF file</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Separate pages using custom ranges, split every N pages, or extract specific groups. 
            <span className="font-bold text-[#E5322D] block mt-1">Download multiple files as a ZIP!</span>
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col relative">
          {!file ? (
            <div className="text-center w-full flex flex-col items-center justify-center h-[350px]">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-4 border-dashed border-red-200/50 hover:border-red-100">
                <UploadCloud size={28} /> Select PDF file
              </label>
              <p className="mt-4 text-gray-500 font-medium text-sm">or drop PDF here</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 md:items-start pt-4">
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-xl p-8 relative min-h-[280px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition"><X size={20} /></button>
                <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                <p className="text-sm font-bold text-gray-900 text-center break-words w-full px-4">{file.name}</p>
                <div className="mt-2 px-4 py-1 border rounded-full bg-white text-xs font-semibold text-[#E5322D]">
                  {totalPages} Pages Total
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col h-full justify-between">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                    <Scissors size={20} className="text-[#E5322D]" /> Splitting Mode
                  </h3>

                  <div className="flex flex-wrap bg-gray-100 p-1 rounded-lg gap-1 text-sm font-semibold">
                    {['extract', 'every', 'custom'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setSplitMode(mode)}
                        className={`flex-1 px-4 py-2 rounded-md transition-all ${
                          splitMode === mode 
                          ? 'bg-[#E5322D] text-white shadow-md' 
                          : 'text-gray-800 hover:bg-white hover:shadow-sm'
                        }`}
                      >
                        {mode === 'extract' ? 'Extract Range' : mode === 'every' ? 'Split Every N' : 'Custom Groups'}
                      </button>
                    ))}
                  </div>

                  <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 space-y-4 mt-2">
                    {splitMode === 'extract' && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-gray-800 mb-1">From Page</label>
                          <input 
                            type="number" min="1" max={totalPages} value={extractStart}
                            onChange={(e) => setExtractStart(Number(e.target.value))}
                            className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-3 font-bold focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-gray-800 mb-1">To Page</label>
                          <input 
                            type="number" min="1" max={totalPages} value={extractEnd}
                            onChange={(e) => setExtractEnd(Number(e.target.value))}
                            className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-3 font-bold focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                          />
                        </div>
                      </div>
                    )}

                    {splitMode === 'every' && (
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-sm font-bold text-gray-800 mb-1">Every N Pages</label>
                          <input 
                            type="number" min="1" max={totalPages} value={everyN}
                            onChange={(e) => setEveryN(Number(e.target.value))}
                            className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-3 font-bold focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                          />
                        </div>
                        <div className="flex-1 text-center mt-6 pt-1 text-sm font-medium text-gray-600">
                          Creates ~{Math.ceil(totalPages / everyN)} files
                        </div>
                      </div>
                    )}

                    {splitMode === 'custom' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-1">Custom Page Groups</label>
                        <input 
                          type="text" value={customInput}
                          onChange={(e) => setCustomInput(e.target.value)}
                          placeholder="e.g. 1-5, 7, 9-12"
                          className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-3 font-medium focus:outline-none focus:ring-2 focus:ring-[#E5322D]"
                        />
                        <p className="text-xs text-gray-500 mt-2 font-medium">
                          Separate groups by comma. Use dash for ranges.
                        </p>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-xs text-gray-600 bg-white p-3 rounded border border-gray-200 mt-2">
                      <AlertTriangle size={14} className="text-orange-500 mt-0.5" />
                      <span>
                        If more than 1 file is created, they will be <strong className="text-gray-800">automatically zipped</strong> and downloaded together.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end">
                   <button 
                     onClick={splitPdf}
                     disabled={isProcessing}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                   >
                     {isProcessing ? (
                       <><Settings className="animate-spin" size={24} /> Splitting & Zipping...</>
                     ) : (
                       <>Split & Export <Download size={24} /></>
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
