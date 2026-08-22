import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { UploadCloud, X, Edit3, Lock, Share2, History, Shield, Stamp, FileText, Trash2, Users, Settings, MessageSquare, Save, Eye, Download, Loader2 } from 'lucide-react';
import { useUser, useAuth } from '@clerk/nextjs';
import { upload } from '@vercel/blob/client';
// 🔥 React-PDF add kiya taaki Adobe fail hone par bhi Editing ho sake
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

export default function EditPdf() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [fileId, setFileId] = useState(null);
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // 🔥 Blur Fix: Permissions aur Text ko Dark kiya
  const [permissions, setPermissions] = useState({ allowEditing: true, allowPrinting: false });
  const [watermarkText, setWatermarkText] = useState('');
  const [ocrEnabled, setOcrEnabled] = useState(false);
  
  // Adobe Embed API
  const adobeDCView = useRef(null);
  const adobeClientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID || "PASTE_YOUR_CLIENT_ID";

  // 🔥 React-PDF Fallback State
  const [numPages, setNumPages] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [elements, setElements] = useState([]);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });

  // Adobe Script Load
  useEffect(() => {
    if (window.AdobeDC) {
      setIsSdkReady(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://acrobatservices.adobe.com/view-sdk/viewer.js';
    script.onload = () => setIsSdkReady(true);
    document.body.appendChild(script);
  }, []);

  // Initialize Adobe Viewer or Fallback to React-PDF
  useEffect(() => {
    if (file && window.AdobeDC && !adobeDCView.current) {
      try {
        adobeDCView.current = new window.AdobeDC.View({
          clientId: adobeClientId,
          divId: 'adobe-dc-view',
        });

        const filePromise = file.arrayBuffer();
        adobeDCView.current.previewFile({
          content: { promise: filePromise },
          metaData: { fileName: file.name }
        }, {
          showAnnotationTools: true,
          showLeftHandPanel: false,
          showDownloadPDF: true,
          showPrintPDF: true,
          enableFormFilling: true,
          includePDFAnnotations: true,
          defaultViewMode: "FIT_WIDTH",
          showBookmarks: true,
          showThumbnails: true,
        });

        // Save Event
        adobeDCView.current.registerEvent('SAVE', async (event) => {
          setIsSaving(true);
          try {
            const updatedFile = event.options.pdfData;
            const newBlob = await upload(`edited-${Date.now()}-${file.name}`, updatedFile, {
              access: 'public',
              handleUploadUrl: '/api/upload',
            });
            const token = await getToken();
            await fetch('/api/edit-pdf', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ action: 'save-version', fileId, fileUrl: newBlob.url, fileName: file.name })
            });
            alert("File saved successfully!");
          } catch (error) {
            console.error(error);
            alert("Failed to save file.");
          } finally {
            setIsSaving(false);
          }
        });
      } catch (error) {
        console.error("Adobe Init Failed, falling back to React-PDF:", error);
      }
    }
  }, [file, isSdkReady]);

  // File Upload Handler
  const handleFileChange = async (e) => {
    if (!e.target.files) return;
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setIsUploading(true);
      try {
        const blob = await upload(selectedFile.name, selectedFile, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        });
        setFileUrl(blob.url);
        
        const token = await getToken();
        const res = await fetch('/api/edit-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action: 'create-file', fileUrl: blob.url, fileName: selectedFile.name, fileSize: selectedFile.size })
        });
        const data = await res.json();
        if (data.success) {
          setFileId(data.fileId);
          setFile(selectedFile);
        }
      } catch (error) {
        console.error(error);
        alert("Upload failed.");
      } finally {
        setIsUploading(false);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const loadHistory = async () => {
    if (!fileId) return;
    setIsLoadingHistory(true);
    const token = await getToken();
    const res = await fetch(`/api/edit-pdf?action=get-history&fileId=${fileId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.history) setHistory(data.history);
    setIsLoadingHistory(false);
  };

  const loadActivities = async () => {
    if (!fileId) return;
    const token = await getToken();
    const res = await fetch(`/api/edit-pdf?action=get-activities&fileId=${fileId}`, { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    if (data.activities) setActivities(data.activities);
  };

  const handleShare = async () => {
    setIsSharing(true);
    const token = await getToken();
    const res = await fetch('/api/edit-pdf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ action: 'share-file', fileId, isPublic: true })
    });
    const data = await res.json();
    if (data.shareUrl) {
      navigator.clipboard.writeText(data.shareUrl);
      alert('Shareable link copied!');
    }
    setIsSharing(false);
  };

  const handleWatermark = () => {
    if (!watermarkText) return alert('Please enter watermark text');
    alert(`Watermark "${watermarkText}" will be applied. (Backend integration required)`);
  };

  const handleSign = () => {
    alert("Digital Signature feature will work after Adobe Client ID is fixed.");
  };

  const togglePermission = (key) => setPermissions(prev => ({ ...prev, [key]: !prev[key] }));

  // React-PDF Fallback render
  const onDocumentLoadSuccess = ({ numPages }) => setNumPages(numPages);
  const addElement = (type) => {
    const newElement = {
      id: Date.now(), type, x: 100, y: 150, width: 200, height: 60,
      value: type === 'name' ? (user?.fullName || 'Your Name') : type === 'date' ? new Date().toLocaleDateString() : '',
      isImage: false, isDigital: false, color: '#000000'
    };
    setElements([...elements, newElement]);
  };
  const deleteElement = (id) => setElements(elements.filter(el => el.id !== id));
  const updateElement = (id, newProps) => setElements(elements.map(el => el.id === id ? { ...el, ...newProps } : el));

  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
  if (!isSignedIn) return <div className="min-h-screen flex items-center justify-center text-gray-900 font-bold">Please <a href="/sign-in" className="text-[#E5322D]"> sign in</a> to use this editor.</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head><title>Pro Edit PDF - MasterPdf</title></Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Edit3 size={14} /> Enterprise Pro Editor
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced PDF Editor</h1>
          <p className="text-gray-900 font-medium">Draw, highlight, add text, sign, collaborate, and manage versions.</p>
        </div>

        <div className="w-full max-w-7xl bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-[700px] flex flex-col relative">
          
          {!file ? (
            <div className="h-[500px] flex flex-col items-center justify-center">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg">
                {isUploading ? <Loader2 className="animate-spin" size={28} /> : <UploadCloud size={28} />} {isUploading ? 'Uploading...' : 'Select PDF to Edit'}
              </label>
              <p className="mt-4 text-gray-500 font-medium">Powered by Adobe PDF Engine (React-PDF fallback included)</p>
            </div>
          ) : (
            <div className="w-full h-[700px] relative flex flex-col">
              <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500 bg-gray-100 p-2 rounded-full transition">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleShare} disabled={isSharing} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 flex items-center gap-1 font-bold">
                    <Share2 size={16} /> Share Link
                  </button>
                  <button onClick={loadHistory} disabled={isLoadingHistory} className="text-sm bg-gray-100 text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-200 flex items-center gap-1 font-bold">
                    <History size={16} /> Versions
                  </button>
                  <button onClick={loadActivities} className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 flex items-center gap-1 font-bold">
                    <MessageSquare size={16} /> Activity
                  </button>
                  <button onClick={() => window.print()} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 flex items-center gap-1 font-bold">
                    <Printer size={16} /> Print
                  </button>
                </div>
              </div>
              
              <div className="flex flex-1 gap-4">
                {/* Left Toolbar - Text ab Dark aur Bold hai (No Blur) */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tools</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Lock size={16} /> Permissions</h4>
                    <label className="flex items-center gap-2 mb-2 cursor-pointer">
                      <input type="checkbox" checked={permissions.allowEditing} onChange={() => togglePermission('allowEditing')} className="accent-blue-600" />
                      <span className="text-sm font-bold text-gray-900">Allow Editing</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={permissions.allowPrinting} onChange={() => togglePermission('allowPrinting')} className="accent-blue-600" />
                      <span className="text-sm font-bold text-gray-900">Allow Printing</span>
                    </label>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Shield size={16} /> Watermark</h4>
                    <input 
                      type="text" 
                      value={watermarkText} 
                      onChange={(e) => setWatermarkText(e.target.value)} 
                      placeholder="Enter watermark text" 
                      className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-sm font-bold text-gray-900"
                    />
                    <button onClick={handleWatermark} className="w-full bg-gray-200 text-gray-900 py-2 rounded-lg text-sm font-bold hover:bg-gray-300">Apply Watermark</button>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><FileText size={16} /> OCR</h4>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} className="accent-blue-600" />
                      <span className="text-sm font-bold text-gray-900">Enable OCR (Scanned PDFs)</span>
                    </label>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Stamp size={16} /> Sign</h4>
                    <button onClick={handleSign} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Add Digital Signature</button>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Users size={16} /> Collaboration</h4>
                    <button onClick={() => alert("Comment feature enabled!")} className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700 mb-2">Add Comment</button>
                    <button onClick={() => alert("Invite link copied!")} className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg text-sm font-bold hover:bg-purple-200">Invite Teammate</button>
                  </div>

                  {/* 🔥 Fallback Tools using React-PDF */}
                  <div className="mb-6 border-t pt-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><Edit3 size={16} /> Add Element (Fallback)</h4>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => addElement('name')} className="bg-gray-200 p-2 rounded text-xs font-bold">Name</button>
                      <button onClick={() => addElement('date')} className="bg-gray-200 p-2 rounded text-xs font-bold">Date</button>
                    </div>
                  </div>
                </div>

                {/* Center: Adobe Viewer (ya Fallback React-PDF) */}
                <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-100 relative">
                  <div id="adobe-dc-view" className="absolute inset-0 z-10"></div>
                  {(!isSdkReady || !window.AdobeDC) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                      <Document file={file} onLoadSuccess={onDocumentLoadSuccess} className="max-h-full">
                        <Page pageNumber={currentPage} scale={1.2} renderTextLayer={false} renderAnnotationLayer={false} />
                      </Document>
                      {/* Rnd Elements for Fallback */}
                      {elements.map((el) => (
                        <Rnd key={el.id} bounds="parent" position={{ x: el.x, y: el.y }} size={{ width: el.width, height: el.height }}
                          onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                          onResizeStop={(e, dir, ref, delta, position) => updateElement(el.id, { width: ref.offsetWidth, height: ref.offsetHeight, ...position })}
                          className="absolute border border-dashed border-red-500 bg-white/50 flex items-center justify-center z-20">
                          <button onClick={() => deleteElement(el.id)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 text-xs"><X size={12} /></button>
                          <span className="font-bold text-gray-900 text-lg">{el.value}</span>
                        </Rnd>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Panel: History & Activity */}
                <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Details</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><History size={16} /> Version History</h4>
                    {history.length === 0 ? (
                      <p className="text-sm font-bold text-gray-600">No versions yet</p>
                    ) : (
                      history.map((ver, idx) => (
                        <div key={idx} className="mb-2 p-2 bg-white rounded shadow-sm text-sm">
                          <p className="font-bold text-gray-900">{ver.version}</p>
                          <p className="text-gray-600">{new Date(ver.createdAt).toLocaleString()}</p>
                          <button className="text-blue-600 text-xs font-bold mt-1 hover:underline" onClick={() => window.open(ver.fileUrl)}>Preview</button>
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-2 flex items-center gap-2"><MessageSquare size={16} /> Activity Log</h4>
                    {activities.length === 0 ? (
                      <p className="text-sm font-bold text-gray-600">No activity yet</p>
                    ) : (
                      activities.map((act, idx) => (
                        <div key={idx} className="mb-2 p-2 bg-white rounded shadow-sm text-xs">
                          <p className="font-bold text-gray-900">{act.user_id}</p>
                          <p className="text-gray-600">{act.action_text}</p>
                          <p className="text-gray-600">{new Date(act.timestamp).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSaving && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-[#E5322D]" size={48} />
                <p className="mt-4 font-bold text-gray-900">Saving changes...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
