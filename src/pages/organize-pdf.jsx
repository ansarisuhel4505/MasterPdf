import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import { 
  UploadCloud, Trash2, ArrowUp, ArrowDown, RotateCcw, RotateCw, 
  Layers, FileOutput, Undo2, X, Settings, ChevronDown, FilePlus
} from 'lucide-react';

// Dynamic import with SSR disabled (Next.js के लिए अनिवार्य)
const Document = dynamic(() => import('react-pdf').then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false });

export default function OrganizePdf() {
  const [file, setFile] = useState(null);
  const [pages, setPages] = useState([]); 
  const [pdfDoc, setPdfDoc] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [renderError, setRenderError] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]); 

  // 🛑 MASTER FIX: अब CDN की जगह "लोकल वर्कर" को सेट कर रहा है
  useEffect(() => {
    // वर्कर को public फोल्डर से लोड करें (आपको एक फाइल कॉपी करनी होगी, नीचे बताया है)
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
  }, []);

  const pushHistory = (newPages) => {
    setHistory(prev => [prev, pages].slice(-20));
    setPages(newPages);
  };

  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setPages(lastState);
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || selectedFile.type !== 'application/pdf') {
      alert("Please upload a valid PDF file.");
      return;
    }
    setFile(selectedFile);
    setIsLoading(true);
    setPages([]);
    setPdfDoc(null);
    setHistory([]);
    setUploadedFiles([]);
    setRenderError(false);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadedPdf = await PDFDocument.load(arrayBuffer);
      setPdfDoc(loadedPdf);
      
      const totalPages = loadedPdf.getPageCount();
      const initialPages = Array.from({ length: totalPages }, (_, i) => ({
        id: `src-${i}`,
        type: 'source',
        sourceIndex: i,
        rotation: 0,
        selected: false,
      }));
      setPages(initialPages);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert("Corrupted or invalid PDF file.");
    } finally {
      setIsLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPages([]);
    setPdfDoc(null);
    setHistory([]);
    setUploadedFiles([]);
    setRenderError(false);
  };

  const onDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;

    const newPages = [...pages];
    const [draggedItem] = newPages.splice(dragIndex, 1);
    newPages.splice(dropIndex, 0, draggedItem);
    pushHistory(newPages);
  };

  const handlePageClick = (index, event) => {
    const newPages = [...pages];
    if (event.ctrlKey || event.metaKey) {
      newPages[index].selected = !newPages[index].selected;
      setPages(newPages);
    } else if (event.shiftKey) {
      const lastSelected = newPages.findIndex(p => p.selected);
      if (lastSelected !== -1) {
        const start = Math.min(lastSelected, index);
        const end = Math.max(lastSelected, index);
        for (let i = start; i <= end; i++) newPages[i].selected = true;
        setPages(newPages);
      } else {
        setPages(newPages.map(p => ({ ...p, selected: false })));
        newPages[index].selected = true;
        setPages(newPages);
      }
    } else {
      setPages(newPages.map(p => ({ ...p, selected: false })));
      newPages[index].selected = true;
      setPages(newPages);
    }
  };

  const selectAll = () => setPages(pages.map(p => ({ ...p, selected: true })));
  const deselectAll = () => setPages(pages.map(p => ({ ...p, selected: false })));

  const deleteSelected = () => {
    const newPages = pages.filter(p => !p.selected);
    if (newPages.length === 0) return alert("Cannot delete all pages. Keep at least one.");
    pushHistory(newPages);
  };

  const rotateSelected = (deg) => {
    const newPages = pages.map(p => {
      if (p.selected) return { ...p, rotation: (p.rotation + deg) % 360 };
      return p;
    });
    pushHistory(newPages);
  };

  const extractSelected = async () => {
    const selectedSourceIndices = pages.filter(p => p.selected && p.type === 'source').map(p => p.sourceIndex);
    if (selectedSourceIndices.length === 0) return alert("Select original source pages to extract.");

    try {
      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdfDoc, selectedSourceIndices);
      copiedPages.forEach(page => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Extracted_${file.name}`;
      link.click();
    } catch (error) {
      console.error("Extract Error:", error);
      alert("Failed to extract pages.");
    }
  };

  const insertBlankPage = () => {
    const newPages = [...pages];
    const lastSelectedIndex = newPages.map((p, i) => p.selected ? i : -1).reduce((max, curr) => Math.max(max, curr), -1);
    const insertIndex = lastSelectedIndex !== -1 ? lastSelectedIndex + 1 : newPages.length;
    newPages.splice(insertIndex, 0, { id: `blank-${Date()}`, type: 'blank', rotation: 0, selected: false });
    pushHistory(newPages);
  };

  const handleInsertFile = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      let pagesToInsert = [];
      
      if (selectedFile.type === 'application/pdf') {
        const insertPdf = await PDFDocument.load(arrayBuffer);
        const totalInsertPages = insertPdf.getPageCount();
        const uniqueId = `upload-${Date.now()}`;
        setUploadedFiles(prev => [...prev, { id: uniqueId, bytes: arrayBuffer, type: 'pdf' }]);

        for (let i = 0; i < totalInsertPages; i++) {
          pagesToInsert.push({ 
            id: `${uniqueId}-${i}`, 
            type: 'upload', 
            uploadId: uniqueId, 
            uploadPageIndex: i, 
            rotation: 0, 
            selected: false 
          });
        }
      } 
      else if (selectedFile.type === 'image/png' || selectedFile.type === 'image/jpeg') {
        const uniqueId = `upload-${Date.now()}`;
        setUploadedFiles(prev => [...prev, { id: uniqueId, bytes: arrayBuffer, type: 'image', mimeType: selectedFile.type }]);
        pagesToInsert.push({ 
          id: uniqueId, 
          type: 'upload', 
          uploadId: uniqueId, 
          uploadPageIndex: 0, 
          rotation: 0, 
          selected: false 
        });
      } else {
        alert("Only PDF, JPG, or PNG files can be inserted.");
        return;
      }

      const newPages = [...pages];
      const lastSelectedIndex = newPages.map((p, i) => p.selected ? i : -1).reduce((max, curr) => Math.max(max, curr), -1);
      const insertIndex = lastSelectedIndex !== -1 ? lastSelectedIndex + 1 : newPages.length;
      newPages.splice(insertIndex, 0, ...pagesToInsert);
      pushHistory(newPages);

    } catch (error) {
      console.error("Insert Error:", error);
      alert("Failed to insert file.");
    }
  };

  const reverseOrder = () => {
    const newPages = [...pages].reverse();
    pushHistory(newPages);
  };

  const movePage = (index, direction) => {
    const newPages = [...pages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newPages.length) return;
    [newPages[index], newPages[targetIndex]] = [newPages[targetIndex], newPages[index]];
    pushHistory(newPages);
  };

  const processPdf = async () => {
    if (!pdfDoc && pages.every(p => p.type !== 'source')) {
      alert("Please upload a primary PDF to organize.");
      return;
    }

    setIsProcessing(true);
    try {
      const newPdf = await PDFDocument.create();
      
      for (let i = 0; i < pages.length; i++) {
        const pageData = pages[i];

        if (pageData.type === 'source') {
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageData.sourceIndex]);
          copiedPage.setRotation(pageData.rotation);
          newPdf.addPage(copiedPage);
        } 
        else if (pageData.type === 'blank') {
          const blankPage = newPdf.addPage([595.28, 841.89]); 
          blankPage.setRotation(pageData.rotation);
        } 
        else if (pageData.type === 'upload') {
          const uploaded = uploadedFiles.find(f => f.id === pageData.uploadId);
          if (!uploaded) continue;

          if (uploaded.type === 'pdf') {
            const insertPdf = await PDFDocument.load(uploaded.bytes);
            const [copiedPage] = await newPdf.copyPages(insertPdf, [pageData.uploadPageIndex]);
            copiedPage.setRotation(pageData.rotation);
            newPdf.addPage(copiedPage);
          } 
          else if (uploaded.type === 'image') {
            let image;
            if (uploaded.mimeType === 'image/png') {
              image = await newPdf.embedPng(uploaded.bytes);
            } else {
              image = await newPdf.embedJpg(uploaded.bytes);
            }
            const page = newPdf.addPage([image.width, image.height]);
            page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
            page.setRotation(pageData.rotation);
          }
        }
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Organized_${file.name}`;
      link.click();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to organize PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Organize PDF Pages - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Organize PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Drag to reorder, delete, rotate, extract, or insert images/PDFs as new pages.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          {!file ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center p-10 bg-gray-50/50 transition-colors">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1 border-4 border-dashed border-red-200/50 hover:border-red-100">
                <UploadCloud size={28} /> Select PDF file
              </label>
              <p className="mt-4 text-gray-400 text-sm">or drop your PDF file here</p>
            </div>
          ) : isLoading ? (
            <div className="min-h-[450px] flex flex-col items-center justify-center bg-gray-50">
              <Settings size={48} className="animate-spin text-[#E5322D] mb-4" />
              <p className="text-gray-600 font-medium">Analyzing and loading pages...</p>
            </div>
          ) : (
            <div className="flex flex-col h-full relative">
              {/* Toolbar */}
              <div className="bg-gray-50 border-b border-gray-200 p-4 flex flex-wrap items-center gap-2 sticky top-[72px] z-10 shadow-sm">
                <div className="flex items-center gap-2 mr-4 pr-4 border-r border-gray-300">
                  <span className="text-sm font-semibold text-gray-700">{pages.length} Pages</span>
                  <span className="text-xs text-gray-500">({pages.filter(p => p.selected).length} selected)</span>
                </div>
                <button onClick={undo} disabled={history.length === 0} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 text-sm text-gray-600">
                  <Undo2 size={18} /> Undo
                </button>
                <div className="h-6 w-[1px] bg-gray-300 mx-1"></div>
                <button onClick={selectAll} className="text-sm hover:bg-white hover:shadow-sm px-3 py-1.5 rounded-lg transition text-gray-600">Select All</button>
                <button onClick={deselectAll} className="text-sm hover:bg-white hover:shadow-sm px-3 py-1.5 rounded-lg transition text-gray-600">Deselect</button>
                <div className="h-6 w-[1px] bg-gray-300 mx-1"></div>
                <button onClick={deleteSelected} disabled={pages.filter(p => p.selected).length === 0} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed" title="Delete Selected">
                  <Trash2 size={18} />
                </button>
                <button onClick={() => rotateSelected(-90)} disabled={pages.filter(p => p.selected).length === 0} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-gray-600" title="Rotate Left 90°">
                  <RotateCcw size={18} />
                </button>
                <button onClick={() => rotateSelected(90)} disabled={pages.filter(p => p.selected).length === 0} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-gray-600" title="Rotate Right 90°">
                  <RotateCw size={18} />
                </button>
                <div className="h-6 w-[1px] bg-gray-300 mx-1"></div>
                <button onClick={extractSelected} disabled={pages.filter(p => p.selected && p.type === 'source').length === 0} className="flex items-center gap-1 text-sm hover:bg-white hover:shadow-sm px-3 py-1.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed text-gray-600">
                  <FileOutput size={18} /> Extract
                </button>
                <div className="relative">
                   <input type="file" id="insert-upload" accept=".pdf,.jpg,.jpeg,.png" onChange={handleInsertFile} className="hidden" />
                   <label htmlFor="insert-upload" className="flex items-center gap-1 text-sm cursor-pointer hover:bg-white hover:shadow-sm px-3 py-1.5 rounded-lg transition text-gray-600">
                     <FilePlus size={18} /> Insert File
                   </label>
                </div>
                <button onClick={insertBlankPage} className="flex items-center gap-1 text-sm hover:bg-white hover:shadow-sm px-3 py-1.5 rounded-lg transition text-gray-600">
                  <Layers size={18} /> Insert Blank
                </button>
                <button onClick={reverseOrder} className="flex items-center gap-1 text-sm hover:bg-white hover:shadow-sm px-3 py-1.5 rounded-lg transition text-gray-600">
                  <ArrowUp size={16} className="rotate-180" /><ArrowDown size={16} /> Reverse
                </button>
              </div>

              {/* 🔥 SUPER FIX: Thumbnail vs Text Fallback UI */}
              <div className="p-6 bg-white max-h-[65vh] overflow-y-auto custom-scrollbar">
                {/* अगर Thumbnail एरर आता है, तो यह Text Mode चालू होगा */}
                {renderError ? (
                  <div className="w-full">
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4 text-yellow-800 text-sm flex items-center gap-2">
                      <span className="font-bold">⚠️ Preview Failed!</span> 
                      <span>Don't worry, you can still manage pages using this Text-Mode.</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {pages.map((pageData, index) => (
                        <div 
                          key={index}
                          onClick={(e) => handlePageClick(index, e)}
                          className={`flex items-center justify-between px-4 py-3 border-2 rounded-lg cursor-pointer transition-all bg-white ${
                            pageData.selected ? 'border-[#E5322D] bg-red-50' : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm text-gray-700">Page {index + 1}</span>
                            {pageData.type === 'blank' && <span className="text-xs text-gray-400 border px-2 py-0.5 rounded-full">Blank</span>}
                            {pageData.type === 'upload' && <span className="text-xs text-green-500 border border-green-300 px-2 py-0.5 rounded-full bg-green-50">Inserted</span>}
                          </div>
                          <div className="flex gap-1">
                             <button onClick={(e) => { e.stopPropagation(); movePage(index, 'up'); }} className="p-1 hover:bg-gray-200 rounded-md text-gray-600"><ArrowUp size={16}/></button>
                             <button onClick={(e) => { e.stopPropagation(); movePage(index, 'down'); }} className="p-1 hover:bg-gray-200 rounded-md text-gray-600"><ArrowDown size={16}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* अगर सब ठीक है तो Visual Grid दिखेगा */
                  <Document 
                    file={file} 
                    loading={<div className="col-span-full text-center py-10 text-gray-500">Loading page previews...</div>}
                    onLoadError={(err) => { console.error("React-PDF Load Error:", err); setRenderError(true); }}
                    onSourceError={(err) => { console.error("Source Error:", err); setRenderError(true); }}
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
                      {pages.map((pageData, index) => (
                        <div 
                          key={index} 
                          draggable={pageData.type === 'source'}
                          onDragStart={(e) => pageData.type === 'source' && onDragStart(e, index)}
                          onDragOver={onDragOver}
                          onDrop={(e) => onDrop(e, index)}
                          onClick={(e) => handlePageClick(index, e)}
                          className={`relative group flex flex-col items-center rounded-lg p-2 transition-all cursor-pointer border-2 ${
                            pageData.selected ? 'border-[#E5322D] bg-red-50 ring-2 ring-red-100' : 'border-transparent hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="shadow-sm rounded bg-gray-50 overflow-hidden flex items-center justify-center w-full h-auto min-h-[140px] border border-gray-100">
                            {pageData.type === 'source' && (
                              <Page 
                                pageNumber={pageData.sourceIndex + 1} 
                                width={140} 
                                renderTextLayer={false} 
                                renderAnnotationLayer={false}
                                scale={pageData.rotation === 90 || pageData.rotation === 270 ? 0.8 : 1} 
                              />
                            )}
                            {pageData.type === 'blank' && <div className="text-gray-400 text-xs bg-gray-100 h-full w-full flex items-center justify-center">Blank Page</div>}
                            {pageData.type === 'upload' && <div className="text-gray-400 text-xs flex flex-col items-center"><FilePlus size={30} className="mb-2"/> Inserted</div>}
                          </div>
                          <div className="absolute bottom-8 left-0 right-0 text-center text-xs font-mono bg-black/60 text-white w-fit mx-auto px-3 py-0.5 rounded-full">
                            {index + 1}
                          </div>
                          {pageData.selected && (
                            <div className="md:hidden absolute -top-3 flex gap-2 bg-white shadow-md border rounded-full p-1 px-2 z-20">
                               <button onClick={(e) => { e.stopPropagation(); movePage(index, 'up'); }} className="text-gray-700 hover:text-[#E5322D]"><ArrowUp size={14} /></button>
                               <button onClick={(e) => { e.stopPropagation(); movePage(index, 'down'); }} className="text-gray-700 hover:text-[#E5322D]"><ArrowDown size={14} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </Document>
                )}
              </div>

              <div className="border-t border-gray-200 p-6 bg-gray-50 flex justify-end">
                <button 
                  onClick={processPdf}
                  disabled={isProcessing}
                  className="w-full md:w-auto flex items-center justify-center gap-2 px-12 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <><Settings className="animate-spin" size={24} /> Generating Organized PDF...</>
                  ) : (
                    <>Download Organized PDF <ChevronDown size={24} className="rotate-[-90deg]" /></>
                  )}
                </button>
              </div>

              <button onClick={removeFile} className="absolute top-16 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm hover:shadow-md transition z-20">
                <X size={20} />
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
