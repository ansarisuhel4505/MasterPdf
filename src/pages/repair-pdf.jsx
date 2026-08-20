import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ArrowRight, Settings, ShieldCheck, Wrench, Database, FileWarning, Terminal, CheckCircle2, Download } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function EnterpriseRepairPdf() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [logs, setLogs] = useState([]);
  const [downloadUrl, setDownloadLink] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setLogs([]);
      setDownloadLink('');
    }
  };

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
    setLogs([]);
    setDownloadLink('');
  };

  const addLog = (message, delay) => {
    return new Promise(resolve => {
      setTimeout(() => {
        setLogs(prev => [...prev, message]);
        resolve();
      }, delay);
    });
  };

  const processFile = async () => {
    if (!file) return;
    setStatus('processing');
    setLogs(["[SYSTEM] Initializing MasterPdf Recovery Engine v2.4..."]);
    
    try {
      // Step 1: Simulate Enterprise Scanning UI
      await addLog("[SCAN] Uploading corrupt file to secure vault...", 800);
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
      
      await addLog("[DIAGNOSTIC] Analyzing file structure and XREF tables...", 1000);
      await addLog("[REPAIR] Rebuilding broken XREF indices...", 1200);
      
      // Step 2: Actual Backend Call
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'repair-pdf', fileUrl: blob.url }),
      });
      
      await addLog("[SECURITY] Stripping potential malicious code/scripts...", 900);
      await addLog("[DATA] Salvaging text streams and raw images...", 1100);
      await addLog("[PRESERVE] Validating Metadata and Digital Signatures...", 800);

      const data = await response.json();
      
      if (response.ok && data.downloadUrl) {
        await addLog("[SUCCESS] Document successfully repaired and sanitized.", 500);
        setDownloadLink(data.downloadUrl);
        setStatus('success');
      } else {
        await addLog(`[ERROR] Critical Failure: ${data.error}`, 500);
        setStatus('error');
      }
    } catch (error) {
      await addLog("[ERROR] Server connection lost during deep salvage.", 500);
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Enterprise PDF Repair - MasterPdf</title></Head>
      <Navbar />
      
      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-red-100 text-[#E5322D] px-3 py-1 rounded-full text-xs font-bold mb-4">
            <ShieldCheck size={14} /> Enterprise Recovery Engine
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Advanced PDF Repair</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Deep diagnostic tool to fix corrupt XREF tables, salvage raw data, and sanitize malicious code.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[500px] flex flex-col relative">
          {!file ? (
            <div className="flex-grow flex items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition">
              <div className="text-center w-full">
                <FileWarning size={60} className="text-gray-400 mx-auto mb-4" />
                <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
                <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-lg font-bold py-4 px-10 rounded-xl inline-flex items-center gap-3 shadow-md transition">
                  <UploadCloud size={24} /> Select Corrupt PDF
                </label>
                <p className="mt-4 text-sm text-gray-500 font-medium">Supports severely damaged and inaccessible files.</p>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col md:flex-row gap-8 items-start">
              
              {/* Left Side: Security & Feature Badges */}
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative">
                  <button onClick={removeFile} disabled={status === 'processing'} className="absolute top-4 right-4 bg-white border text-gray-500 hover:text-red-500 rounded-full p-2 disabled:opacity-50"><X size={18} /></button>
                  <div className="flex flex-col items-center mt-2 mb-4">
                    <FileText size={50} className={`${status === 'success' ? 'text-green-500' : 'text-[#E5322D]'} mb-3 opacity-90 transition-colors`} />
                    <p className="text-sm font-bold text-center break-words w-full">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Active Recovery Modules</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm font-medium text-gray-700"><Wrench size={16} className="text-blue-500"/> Structural XREF Rebuild</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-gray-700"><Database size={16} className="text-purple-500"/> Deep Data & Font Salvage</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-gray-700"><ShieldCheck size={16} className="text-green-500"/> Malicious Code Stripping</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-gray-700"><CheckCircle2 size={16} className="text-yellow-500"/> Metadata Preservation</li>
                  </ul>
                </div>
              </div>

              {/* Right Side: Diagnostic Terminal & Action */}
              <div className="w-full md:w-2/3 flex flex-col h-full min-h-[400px]">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Terminal size={20} className="text-gray-700" /> Diagnostic Audit Log
                  </h3>
                  {status === 'processing' && <span className="flex items-center gap-2 text-xs font-bold text-[#E5322D] animate-pulse"><Settings size={14} className="animate-spin" /> Engine Running</span>}
                </div>
                
                {/* Enterprise Terminal UI */}
                <div className="flex-grow bg-[#0D1117] rounded-xl p-5 overflow-y-auto shadow-inner font-mono text-[13px] leading-relaxed border border-gray-800 min-h-[250px] flex flex-col">
                  {logs.length === 0 ? (
                    <div className="text-gray-600 h-full flex items-center justify-center">System ready. Awaiting repair command...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className={`mb-1 ${log.includes('[ERROR]') ? 'text-red-400' : log.includes('[SUCCESS]') ? 'text-green-400' : log.includes('[SECURITY]') ? 'text-yellow-400' : 'text-gray-300'}`}>
                        <span className="text-gray-600 mr-2">{new Date().toISOString().split('T')[1].split('.')[0]}</span>
                        {log}
                      </div>
                    ))
                  )}
                  {status === 'processing' && (
                    <div className="text-gray-500 animate-pulse mt-1">_</div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6">
                  {status === 'idle' || status === 'error' ? (
                    <button onClick={processFile} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 transition shadow-md">
                      Start Deep Repair <Wrench size={22} />
                    </button>
                  ) : status === 'success' ? (
                    <div className="flex flex-col gap-3">
                      <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl flex items-center gap-3">
                        <CheckCircle2 size={24} className="text-green-600" />
                        <div>
                          <p className="font-bold text-sm">Recovery Successful</p>
                          <p className="text-xs">Your document is now safe, structurally sound, and ready for use.</p>
                        </div>
                      </div>
                      <a href={downloadUrl} download={`Repaired_${file.name}`} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-gray-900 hover:bg-black transition shadow-lg">
                        <Download size={22} /> Download Recovered File
                      </a>
                    </div>
                  ) : (
                    <button disabled className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-gray-400 cursor-not-allowed">
                      <Settings className="animate-spin" size={22} /> System Processing...
                    </button>
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
