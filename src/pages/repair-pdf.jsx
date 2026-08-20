import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, FileText, X, ArrowRight, Settings, ShieldCheck, Wrench, Database, FileWarning, Terminal, CheckCircle2, Download, AlertTriangle } from 'lucide-react';
import { upload } from '@vercel/blob/client';

export default function EnterpriseRepairPdf() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle');
  const [logs, setLogs] = useState([]);
  const [downloadUrl, setDownloadLink] = useState('');
  const [recoveryLevel, setRecoveryLevel] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setLogs([]);
      setDownloadLink('');
      setRecoveryLevel('');
    }
  };

  const removeFile = () => {
    setFile(null);
    setStatus('idle');
    setLogs([]);
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
    setLogs(["[SYSTEM] Initializing MasterPdf Multi-Tier Recovery Engine..."]);
    
    try {
      await addLog("[SCAN] Uploading corrupt file to secure vault...", 800);
      const blob = await upload(file.name, file, { access: 'public', handleUploadUrl: '/api/upload' });
      
      await addLog("[TIER 1] Attempting Standard Structural Rebuild...", 1000);
      
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'repair-pdf', fileUrl: blob.url }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.downloadUrl) {
        if (data.recoveryLevel.includes('Tier 2')) {
          await addLog("[WARNING] Tier 1 Failed. Triggering Tier 2 Force Rebuild...", 500);
        } else if (data.recoveryLevel.includes('Tier 3')) {
          await addLog("[WARNING] Core Structure Dead. Triggering Tier 3 Data Scavenge...", 500);
          await addLog("[DATA] Extracting surviving raw text...", 800);
        }
        
        await addLog(`[SUCCESS] Process completed via: ${data.recoveryLevel}`, 500);
        setDownloadLink(data.downloadUrl);
        setRecoveryLevel(data.recoveryLevel);
        setStatus('success');
      } else {
        await addLog(`[FATAL ERROR] System Failure: ${data.error}`, 500);
        setStatus('error');
      }
    } catch (error) {
      await addLog("[FATAL ERROR] Server connection lost.", 500);
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
            <ShieldCheck size={14} /> Multi-Tier Recovery Engine
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Advanced PDF Repair</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our 3-Tier system attempts structural rebuild, force byte-loading, and raw data scavenge to save your files.
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
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col md:flex-row gap-8 items-start">
              
              <div className="w-full md:w-1/3 flex flex-col gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative">
                  <button onClick={removeFile} disabled={status === 'processing'} className="absolute top-4 right-4 bg-white border text-gray-500 hover:text-red-500 rounded-full p-2 disabled:opacity-50"><X size={18} /></button>
                  <div className="flex flex-col items-center mt-2 mb-4">
                    <FileText size={50} className={`${status === 'success' ? 'text-green-500' : 'text-[#E5322D]'} mb-3 opacity-90 transition-colors`} />
                    <p className="text-sm font-bold text-center break-words w-full">{file.name}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-5">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Recovery Tiers</h4>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3 text-sm font-medium text-gray-700"><CheckCircle2 size={16} className="text-green-500"/> Tier 1: Standard Rebuild</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-gray-700"><Wrench size={16} className="text-blue-500"/> Tier 2: Forced Byte Rescue</li>
                    <li className="flex items-center gap-3 text-sm font-medium text-gray-700"><Database size={16} className="text-yellow-500"/> Tier 3: Raw Text Scavenge</li>
                  </ul>
                </div>
              </div>

              <div className="w-full md:w-2/3 flex flex-col h-full min-h-[400px]">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Terminal size={20} className="text-gray-700" /> Diagnostic Audit Log
                  </h3>
                </div>
                
                <div className="flex-grow bg-[#0D1117] rounded-xl p-5 overflow-y-auto shadow-inner font-mono text-[13px] leading-relaxed border border-gray-800 min-h-[250px] flex flex-col">
                  {logs.length === 0 ? (
                    <div className="text-gray-600 h-full flex items-center justify-center">System ready. Awaiting repair command...</div>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className={`mb-1 ${log.includes('[FATAL') ? 'text-red-500 font-bold' : log.includes('[ERROR]') || log.includes('[WARNING]') ? 'text-yellow-400' : log.includes('[SUCCESS]') ? 'text-green-400' : 'text-gray-300'}`}>
                        <span className="text-gray-600 mr-2">{new Date().toISOString().split('T')[1].split('.')[0]}</span>
                        {log}
                      </div>
                    ))
                  )}
                  {status === 'processing' && <div className="text-gray-500 animate-pulse mt-1">_</div>}
                </div>

                <div className="mt-6">
                  {status === 'idle' || status === 'error' ? (
                    <button onClick={processFile} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-[#E5322D] hover:bg-red-700 transition shadow-md">
                      Initiate 3-Tier Repair <Wrench size={22} />
                    </button>
                  ) : status === 'success' ? (
                    <div className="flex flex-col gap-3">
                      <div className={`border p-4 rounded-xl flex items-center gap-3 ${recoveryLevel.includes('Tier 3') ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 'bg-green-50 border-green-200 text-green-800'}`}>
                        {recoveryLevel.includes('Tier 3') ? <AlertTriangle size={24} className="text-yellow-600" /> : <CheckCircle2 size={24} className="text-green-600" />}
                        <div>
                          <p className="font-bold text-sm">Recovery Status: {recoveryLevel}</p>
                          <p className="text-xs">
                            {recoveryLevel.includes('Tier 3') 
                              ? "PDF structure was completely destroyed. We scavenged and saved the raw text inside a TXT file." 
                              : "Your PDF document has been structurally recovered and is ready for use."}
                          </p>
                        </div>
                      </div>
                      <a href={downloadUrl} download={recoveryLevel.includes('Tier 3') ? `Scavenged_Data_${file.name}.txt` : `Repaired_${file.name}`} className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-gray-900 hover:bg-black transition shadow-lg">
                        <Download size={22} /> {recoveryLevel.includes('Tier 3') ? "Download Text Data" : "Download Recovered PDF"}
                      </a>
                    </div>
                  ) : (
                    <button disabled className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg bg-gray-400 cursor-not-allowed">
                      <Settings className="animate-spin" size={22} /> Processing Rescue Ops...
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
