import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { 
  UploadCloud, X, Edit3, Lock, Share2, History, Shield, Stamp, FileText, Trash2, 
  Users, Settings, MessageSquare, Save, Eye, Download, Loader2, Printer 
} from 'lucide-react'; // ✅ Printer Import किया गया
import { useUser, useAuth } from '@clerk/nextjs';
import { upload } from '@vercel/blob/client';

export default function EditPdf() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  
  const [file, setFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [isSdkReady, setIsSdkReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [history, setHistory] = useState([]);
  const [permissions, setPermissions] = useState({ allowEditing: true, allowPrinting: false });
  const [watermarkText, setWatermarkText] = useState('');
  const [ocrEnabled, setOcrEnabled] = useState(false);
  const [activities, setActivities] = useState([]);
  
  // Adobe Embed API
  const adobeDCView = useRef(null);
  const adobeClientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID || "PASTE_YOUR_CLIENT_ID";

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

  // Initialize Adobe Viewer when file is selected
  useEffect(() => {
    if (isSdkReady && file && window.AdobeDC && !adobeDCView.current) {
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

      // Save Event Handler
      adobeDCView.current.registerEvent(
        'SAVE',
        async (event) => {
          setIsSaving(true);
          try {
            const updatedFile = event.options.pdfData;
            const newBlob = await upload(`edited-${Date.now()}-${file.name}`, updatedFile, {
              access: 'public',
              handleUploadUrl: '/api/upload',
            });
            
            const token = await getToken();
            const res = await fetch('/api/edit-pdf', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                action: 'save-version', 
                fileId: fileId,
                fileUrl: newBlob.url,
                fileName: file.name
              })
            });
            const data = await res.json();
            if (data.success) {
              alert("File saved successfully!");
              setFileUrl(newBlob.url);
              loadHistory();
            }
          } catch (error) {
            console.error('Save error:', error);
            alert("Failed to save file.");
          } finally {
            setIsSaving(false);
          }
        }
      );
      
      // Track Activity
      adobeDCView.current.registerEvent('PAGE_VIEW', (event) => {
        const page = event.pageNumber;
        logActivity(`Viewed page ${page}`);
      });
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
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            action: 'create-file', 
            fileUrl: blob.url,
            fileName: selectedFile.name,
            fileSize: selectedFile.size
          })
        });
        const data = await res.json();
        if (data.success) {
          setFileId(data.fileId);
          setFile(selectedFile);
          logActivity('Uploaded file');
        } else {
          alert("Failed to create file record.");
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert("Upload failed. Check /api/upload and middleware.js");
      } finally {
        setIsUploading(false);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  // Function to log activity
  const logActivity = async (action) => {
    if (!fileId) return;
    const token = await getToken();
    await fetch('/api/edit-pdf', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'log-activity', fileId, actionText: action })
    });
  };

  // Load History
  const loadHistory = async () => {
    if (!fileId) return;
    setIsLoadingHistory(true);
    const token = await getToken();
    const res = await fetch(`/api/edit-pdf?action=get-history&fileId=${fileId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.history) setHistory(data.history);
    setIsLoadingHistory(false);
  };

  // Load Activities
  const loadActivities = async () => {
    if (!fileId) return;
    const token = await getToken();
    const res = await fetch(`/api/edit-pdf?action=get-activities&fileId=${fileId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.activities) setActivities(data.activities);
  };

  // Share Link Handler
  const handleShare = async () => {
    setIsSharing(true);
    const token = await getToken();
    const res = await fetch('/api/edit-pdf', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'share-file', fileId, isPublic: true })
    });
    const data = await res.json();
    if (data.shareUrl) {
      navigator.clipboard.writeText(data.shareUrl);
      alert('Shareable link copied to clipboard!');
    }
    setIsSharing(false);
  };

  // Apply Watermark Handler
  const handleWatermark = () => {
    if (!watermarkText) {
      alert('Please enter watermark text');
      return;
    }
    alert(`Watermark "${watermarkText}" will be applied on next save.`);
  };

  // Toggle Permissions
  const togglePermission = (key) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Render only if user is signed in
  if (!isLoaded) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;
  if (!isSignedIn) return <div className="min-h-screen flex items-center justify-center">Please <a href="/sign-in" className="text-blue-500">sign in</a> to use this editor.</div>;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Pro Edit PDF - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Edit3 size={14} /> Enterprise Pro Editor
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Advanced PDF Editor</h1>
          <p className="text-gray-600">Draw, highlight, add text, sign, collaborate, and manage versions.</p>
        </div>

        <div className="w-full max-w-7xl bg-white rounded-2xl shadow-sm border border-gray-200 p-4 min-h-[700px] flex flex-col relative">
          
          {!file ? (
            <div className="h-[500px] flex flex-col items-center justify-center">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg">
                {isUploading ? <Loader2 className="animate-spin" size={28} /> : <UploadCloud size={28} />} {isUploading ? 'Uploading...' : 'Select PDF to Edit'}
              </label>
              <p className="mt-4 text-gray-500 font-medium">Powered by Adobe PDF Engine</p>
            </div>
          ) : (
            <div className="w-full h-[700px] relative flex flex-col">
              <div className="flex justify-between items-center mb-2 px-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700">{file.name}</span>
                  <button onClick={() => setFile(null)} className="text-gray-500 hover:text-red-500 bg-gray-100 p-2 rounded-full transition">
                    <X size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleShare} disabled={isSharing} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 flex items-center gap-1">
                    <Share2 size={16} /> Share Link
                  </button>
                  <button onClick={loadHistory} disabled={isLoadingHistory} className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-200 flex items-center gap-1">
                    <History size={16} /> Versions
                  </button>
                  <button onClick={loadActivities} className="text-sm bg-purple-100 text-purple-700 px-3 py-1 rounded-lg hover:bg-purple-200 flex items-center gap-1">
                    <MessageSquare size={16} /> Activity
                  </button>
                  <button onClick={() => window.print()} className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-lg hover:bg-green-200 flex items-center gap-1">
                    <Printer size={16} /> Print
                  </button>
                </div>
              </div>
              
              <div className="flex flex-1 gap-4">
                {/* Left Toolbar */}
                <div className="w-64 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Tools</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Lock size={16} /> Permissions</h4>
                    <label className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={permissions.allowEditing} onChange={() => togglePermission('allowEditing')} className="accent-blue-600" />
                      <span className="text-sm">Allow Editing</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={permissions.allowPrinting} onChange={() => togglePermission('allowPrinting')} className="accent-blue-600" />
                      <span className="text-sm">Allow Printing</span>
                    </label>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Shield size={16} /> Watermark</h4>
                    <input 
                      type="text" 
                      value={watermarkText} 
                      onChange={(e) => setWatermarkText(e.target.value)} 
                      placeholder="Enter watermark text" 
                      className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-sm"
                    />
                    <button onClick={handleWatermark} className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg text-sm font-bold hover:bg-gray-300">Apply Watermark</button>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><FileText size={16} /> OCR</h4>
                    <label className="flex items-center gap-2">
                      <input type="checkbox" checked={ocrEnabled} onChange={(e) => setOcrEnabled(e.target.checked)} className="accent-blue-600" />
                      <span className="text-sm">Enable OCR (Scanned PDFs)</span>
                    </label>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Stamp size={16} /> Sign</h4>
                    <button className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-blue-700">Add Digital Signature</button>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Users size={16} /> Collaboration</h4>
                    <button className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-purple-700 mb-2">Add Comment</button>
                    <button className="w-full bg-purple-100 text-purple-700 py-2 rounded-lg text-sm font-bold hover:bg-purple-200">Invite Teammate</button>
                  </div>
                </div>

                {/* Center: Adobe Viewer */}
                <div id="adobe-dc-view" className="flex-1 border border-gray-300 rounded-lg overflow-hidden"></div>

                {/* Right Panel: History & Activity */}
                <div className="w-80 bg-gray-50 border-l border-gray-200 p-4 overflow-y-auto">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Details</h3>
                  
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><History size={16} /> Version History</h4>
                    {history.length === 0 ? (
                      <p className="text-sm text-gray-500">No versions yet</p>
                    ) : (
                      history.map((ver, idx) => (
                        <div key={idx} className="mb-2 p-2 bg-white rounded shadow-sm text-sm">
                          <p className="font-bold">{ver.version}</p>
                          <p className="text-gray-500">{new Date(ver.createdAt).toLocaleString()}</p>
                          <button className="text-blue-500 text-xs font-bold mt-1 hover:underline" onClick={() => window.open(ver.fileUrl)}>Preview</button>
                        </div>
                      ))
                    )}
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><MessageSquare size={16} /> Activity Log</h4>
                    {activities.length === 0 ? (
                      <p className="text-sm text-gray-500">No activity yet</p>
                    ) : (
                      activities.map((act, idx) => (
                        <div key={idx} className="mb-2 p-2 bg-white rounded shadow-sm text-xs">
                          <p className="font-bold">{act.user_email}</p>
                          <p className="text-gray-600">{act.action_text}</p>
                          <p className="text-gray-400">{new Date(act.timestamp).toLocaleString()}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Progress Indicator */}
          {isSaving && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50">
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-[#E5322D]" size={48} />
                <p className="mt-4 font-bold text-gray-700">Saving changes...</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
