import React, { useState, useRef, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import { upload } from '@vercel/blob/client';
import JSZip from 'jszip';
import { 
  UploadCloud, FileText, X, ArrowRight, Settings, 
  Image as ImageIcon, Layers, ArrowUp, ArrowDown, 
  Lock, Unlock, Download, FileOutput
} from 'lucide-react';

const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false });

export default function MergePdf() {
  const [items, setItems] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const [outputFormat, setOutputFormat] = useState('pdf'); 
  const [compressAfter, setCompressAfter] = useState(false);
  const [author, setAuthor] = useState('');
  const [title, setTitle] = useState('');

  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = '//unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.js';
  }, []);

  const handlePDFUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validPdfs = selectedFiles.filter(f => f.type === 'application/pdf');
    if (validPdfs.length === 0) return alert("Please upload at least one PDF.");

    const newItems = [];
    for (const file of validPdfs) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const totalPages = pdf.getPageCount();
      newItems.push({
        id: `pdf-${Date.now()}-${Math.random()}`,
        name: file.name,
        type: 'pdf',
        file: file,
        previewUrl: URL.createObjectURL(file),
        pages: totalPages,
      });
    }
    setItems(prev => [...prev, ...newItems]);
    e.target.value = null; 
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert("Please upload JPG or PNG image.");

    try {
      const arrayBuffer = await file.arrayBuffer();
      const tempPdf = await PDFDocument.create();
      let image;
      if (file.type === 'image/png') image = await tempPdf.embedPng(arrayBuffer);
      else image = await tempPdf.embedJpg(arrayBuffer);

      const page = tempPdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
      const pdfBytes = await tempPdf.save();
      const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

      const newItem = {
        id: `img-${Date.now()}`,
        name: file.name.replace(/\.[^/.]+$/, "") + ".pdf",
        type: 'image',
        file: pdfBlob, 
        previewUrl: URL.createObjectURL(pdfBlob),
        pages: 1,
        originalType: file.type
      };
      setItems(prev => [...prev, newItem]);
    } catch (error) {
      console.error(error);
      alert("Failed to process image.");
    }
    e.target.value = null;
  };

  const handleInsertBlank = async () => {
    const tempPdf = await PDFDocument.create();
    tempPdf.addPage([595.28, 841.89]);
    const pdfBytes = await tempPdf.save();
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    setItems(prev => [...prev, {
      id: `blank-${Date.now()}`,
      name: 'Blank A4 Page.pdf',
      type: 'blank',
      file: pdfBlob,
      previewUrl: URL.createObjectURL(pdfBlob),
      pages: 1,
    }]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const reverseOrder = () => {
    setItems(prev => [...prev].reverse());
  };

  const onDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    
    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    setItems(newItems);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDraggedIndex(null);
  };

  const processMerge = async () => {
    if (items.length < 1) return alert("Please upload at least one file.");
    setIsProcessing(true);

    try {
      const mergedPdf = await PDFDocument.create();

      for (let item of items) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      if (title) mergedPdf.setTitle(title);
      if (author) mergedPdf.setAuthor(author);

      let finalBytes = await mergedPdf.save();

      if (outputFormat === 'zip') {
        const zip = new JSZip();
        zip.file('Merged_Document.pdf', finalBytes);
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        
        const url = URL.createObjectURL(zipBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'MasterPdf_Merged.zip';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsProcessing(false);
        return;
      }

      if (compressAfter) {
        const blobToUpload = new Blob([finalBytes], { type: 'application/pdf' });
        const blob = await upload('merged_temp.pdf', blobToUpload, { 
          access: 'public', 
          handleUploadUrl: '/api/upload' 
        });

        const response = await fetch('/api/master-convert', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: 'compress-pdf', 
            fileUrl: blob.url,
            quality: 70 
          }),
        });
        const data = await response.json();
        
        if (response.ok && data.downloadUrl) {
          // 🔥 SUPERFAST BROWSER DOWNLOAD TRICK 🔥
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.setAttribute('download', `MasterPdf_Merged_Compressed.pdf`);
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          alert("Compression failed: " + (data.error || "Unknown error"));
        }
      } else {
        // 🔥 FAST LOCAL BLOB DOWNLOAD TRICK 🔥
        const blob = new Blob([finalBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'MasterPdf_Merged.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
    } catch (error) {
      console.error("Error merging PDFs:", error);
      alert("Failed to merge PDFs. The file might be corrupted.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      
      {/* 🔥 EXACT SEO HEAD POSITION 🔥 */}
      <Head>
        <title>Merge PDF Files Online Free | MasterPdf</title>
        <meta name="description" content="Combine multiple PDF files into one document instantly. Add blank pages, images, and reorder pages. Free, secure, and fast PDF merger tool by MasterPdf. Created by Suhel Ansari." />
        <meta name="keywords" content="merge pdf, combine pdf, join pdf, free pdf merger, add images to pdf, masterpdf, Suhel Ansari" />
        <meta property="og:title" content="Merge PDF Files Online Free | MasterPdf" />
        <meta property="og:description" content="Combine multiple PDF files into one document instantly. Add blank pages, images, and reorder pages." />
      </Head>

      <Navbar />
      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Merge PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Combine, reorder, insert images/blanks, add metadata and download as a single PDF or ZIP.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {items.length === 0 ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center p-10 bg-gray-50/50 transition-colors">
              <input type="file" id="file-upload" multiple accept=".pdf" onChange={handlePDFUpload} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-4 border-dashed border-red-200/50 hover:border-red-100">
                <UploadCloud size={28} /> Select PDF files
              </label>
              <p className="mt-4 text-gray-400 text-sm">You can also insert Images / Blank Pages below after upload.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full relative p-6 gap-6">
              
              <div className="w-full border border-gray-200 rounded-xl bg-gray-50 p-4">
                <div className="flex justify-between items-center mb-3 border-b pb-2">
                  <h4 className="text-sm font-bold text-gray-800">{items.length} File(s) Loaded</h4>
                  <div className="flex gap-2">
                    <button onClick={reverseOrder} className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-white border px-3 py-1 rounded-lg hover:bg-gray-100 transition">
                      <ArrowUp size={14} /><ArrowDown size={14} /> Reverse
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {items.map((item, index) => (
                    <div 
                      key={item.id}
                      draggable={true}
                      onDragStart={(e) => onDragStart(e, index)}
                      onDragOver={(e) => onDragOver(e, index)}
                      onDrop={onDrop}
                      className={`flex items-center justify-between bg-white border p-3 rounded-lg shadow-sm transition cursor-grab active:cursor-grabbing ${draggedIndex === index ? 'border-[#E5322D] ring-2 ring-red-100 opacity-50' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="text-gray-400 hover:text-gray-600 px-1">
                          <Layers size={18} className="rotate-90" />
                        </div>

                        <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center shrink-0">
                          {item.type === 'image' ? <ImageIcon size={20} className="text-green-500" /> : 
                           item.type === 'blank' ? <Layers size={20} className="text-purple-500" /> : 
                           <FileText size={20} className="text-[#E5322D]" />}
                        </div>
                        
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-gray-800 truncate">{item.name}</span>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500">
                            <span>{item.pages} Page{item.pages > 1 ? 's' : ''}</span>
                            {item.type === 'image' && <span className="bg-green-50 text-green-600 border border-green-200 px-1.5 rounded-full">Image</span>}
                            {item.type === 'blank' && <span className="bg-purple-50 text-purple-600 border border-purple-200 px-1.5 rounded-full">Blank</span>}
                          </div>
                        </div>
                      </div>

                      <button onClick={() => removeItem(index)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition ml-2">
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 border border-gray-200 rounded-lg">
                
                <div className="relative">
                  <input type="file" id="add-pdf" multiple accept=".pdf" onChange={handlePDFUpload} className="hidden" />
                  <label htmlFor="add-pdf" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-800 font-bold text-xs rounded-lg cursor-pointer hover:bg-gray-100 transition">
                    <UploadCloud size={16} /> Add PDF
                  </label>
                </div>

                <div className="relative">
                  <input type="file" id="add-image" accept=".jpg,.jpeg,.png" onChange={handleImageUpload} className="hidden" />
                  <label htmlFor="add-image" className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-800 font-bold text-xs rounded-lg cursor-pointer hover:bg-gray-100 transition">
                    <ImageIcon size={16} /> Insert Image
                  </label>
                </div>

                <button onClick={handleInsertBlank} className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-800 font-bold text-xs rounded-lg hover:bg-gray-100 transition">
                  <Layers size={16} /> Insert Blank
                </button>

                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="ml-auto px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-lg transition"
                >
                  <Settings size={16} className="mr-1 inline" /> {showAdvanced ? 'Hide Pro' : 'Pro Settings'}
                </button>
              </div>

              {showAdvanced && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="space-y-3">
                    <h5 className="font-bold text-sm text-gray-900 border-b pb-1">Document Metadata</h5>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Author Name</label>
                      <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Enter author" className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#E5322D] outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Document Title</label>
                      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" className="w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#E5322D] outline-none" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="font-bold text-sm text-gray-900 border-b pb-1">Output & Compression</h5>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-800 mb-1">Output Format</label>
                      <div className="flex gap-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                          <input type="radio" name="output" checked={outputFormat === 'pdf'} onChange={() => setOutputFormat('pdf')} className="accent-[#E5322D] w-4 h-4" />
                          Single PDF
                        </label>
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                          <input type="radio" name="output" checked={outputFormat === 'zip'} onChange={() => setOutputFormat('zip')} className="accent-[#E5322D] w-4 h-4" />
                          Download as ZIP
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-sm font-bold text-gray-800 cursor-pointer">
                        <input type="checkbox" checked={compressAfter} onChange={() => setCompressAfter(!compressAfter)} className="accent-[#E5322D] w-4 h-4" />
                        <Lock size={16} className={compressAfter ? 'text-[#E5322D]' : 'text-gray-400'} /> Compress Output (Reduce size)
                      </label>
                      <p className="text-[10px] text-gray-500 mt-1">Uses backend API to compress the merged file.</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-auto flex justify-end pt-4 border-t border-gray-200">
                 <button 
                   onClick={processMerge}
                   disabled={isProcessing || items.length === 0}
                   className={`w-full md:w-auto flex items-center justify-center gap-2 px-12 py-4 rounded-xl text-white font-bold text-lg transition shadow-md ${isProcessing || items.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#E5322D] hover:bg-red-700 hover:shadow-lg'}`}
                 >
                   {isProcessing ? (
                     <><Settings className="animate-spin" size={24} /> {compressAfter ? 'Merging & Compressing...' : 'Merging...'}</>
                   ) : (
                     <>{outputFormat === 'zip' ? 'Download ZIP' : 'Merge & Download'} <ArrowRight size={24} /></>
                   )}
                 </button>
              </div>

            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
