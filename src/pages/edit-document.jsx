import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import { Document, Page, pdfjs } from 'react-pdf';
import * as XLSX from 'xlsx';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-markup';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-tomorrow.css';
import {
  UploadCloud, FileText, X, ArrowRight, Trash2, Plus,
  ChevronUp, ChevronDown, History, Sun, Moon, Bold, Italic,
  Undo, Redo, Image as ImageIcon, Palette, Type, RotateCw,
  Save, Download, Loader2, SlidersHorizontal, Layers
} from 'lucide-react';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const ACCEPTED_FORMATS = ['.pdf', '.docx', '.doc', '.xlsx', '.xls', '.csv', '.txt', '.pptx', '.ppt'];

// i18n translations
const translations = {
  en: {
    drag: "Drag & drop file here or",
    browse: "Browse File",
    options: "Editor Options",
    undo: "Undo",
    redo: "Redo",
    bold: "Bold",
    italic: "Italic",
    fontSize: "Font Size",
    color: "Text Color",
    addImage: "Add Image",
    rotate: "Rotate",
    deletePage: "Delete Page",
    save: "Save & Download",
    cancel: "Cancel",
    processing: "Processing...",
    page: "Page",
    addMore: "Add More Files",
    selectedCount: "Selected"
  },
  hi: {
    drag: "फ़ाइल यहाँ खींचें या",
    browse: "फ़ाइल चुनें",
    options: "एडिटर विकल्प",
    undo: "पूर्ववत करें",
    redo: "फिर से करें",
    bold: "बोल्ड",
    italic: "इटैलिक",
    fontSize: "फ़ॉन्ट साइज़",
    color: "टेक्स्ट रंग",
    addImage: "छवि जोड़ें",
    rotate: "घुमाएँ",
    deletePage: "पेज हटाएँ",
    save: "सेव करें",
    cancel: "रद्द करें",
    processing: "प्रोसेस हो रहा है...",
    page: "पेज",
    addMore: "और फ़ाइलें जोड़ें",
    selectedCount: "चयनित"
  }
};

export default function EditDocument() {
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [content, setContent] = useState('');
  const [docxData, setDocxData] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [pdfBytes, setPdfBytes] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [textColor, setTextColor] = useState('#000000');

  const fileInputRef = useRef(null);
  const t = translations[lang];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Upload & detect file type
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setFileName(selectedFile.name);
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    setFileType(ext);
    setIsProcessing(true);

    try {
      if (ext === 'pdf') {
        const bytes = await selectedFile.arrayBuffer();
        setPdfBytes(bytes);
      } else if (ext === 'docx' || ext === 'doc') {
        const arrayBuffer = await selectedFile.arrayBuffer();
        // Simple docx text extraction (demo)
        const { Document, Packer, Paragraph, TextRun } = await import('docx');
        // For real editing, you'd use a full editor like OnlyOffice.
        // Here we just store the docx object for saving back (demo).
        const doc = {
          sections: [{ children: [new Paragraph({ children: [new TextRun('Sample text')] })] }]
        };
        setDocxData(doc);
        setContent(await selectedFile.text());
      } else if (ext === 'xlsx' || ext === 'xls') {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const wb = XLSX.read(arrayBuffer);
        setSheetData(wb);
        setContent(JSON.stringify(wb.Sheets[wb.SheetNames[0]], null, 2));
      } else if (ext === 'csv' || ext === 'txt') {
        const text = await selectedFile.text();
        setContent(text);
      } else if (ext === 'pptx' || ext === 'ppt') {
        const bytes = await selectedFile.arrayBuffer();
        setPdfBytes(bytes); // Preview as PDF (not full edit, but preview)
      }
    } catch (error) {
      console.error(error);
      showToast('Error loading file', 'error');
    }
    setIsProcessing(false);
  };

  // Undo / Redo
  const addToUndo = (newContent) => {
    setUndoStack(prev => [...prev, content]);
    setContent(newContent);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    setRedoStack(prev => [...prev, content]);
    setContent(undoStack[undoStack.length - 1]);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    setUndoStack(prev => [...prev, content]);
    setContent(redoStack[redoStack.length - 1]);
    setRedoStack(prev => prev.slice(0, -1));
  };

  // Text Formatting (for TXT/CSV)
  const makeBold = () => {
    const selection = window.getSelection().toString();
    if (selection) {
      const newContent = content.replace(selection, `**${selection}**`);
      addToUndo(newContent);
    }
  };

  const makeItalic = () => {
    const selection = window.getSelection().toString();
    if (selection) {
      const newContent = content.replace(selection, `*${selection}*`);
      addToUndo(newContent);
    }
  };

  // PDF Operations
  const deletePage = async (pageIndex) => {
    if (!pdfBytes) return;
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    pdfDoc.removePage(pageIndex);
    const newBytes = await pdfDoc.save();
    setPdfBytes(newBytes);
    showToast('Page deleted');
  };

  const rotatePage = async (pageIndex) => {
    if (!pdfBytes) return;
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const page = pdfDoc.getPage(pageIndex);
    page.setRotation((page.getRotation().angle + 90) % 360);
    const newBytes = await pdfDoc.save();
    setPdfBytes(newBytes);
    showToast('Page rotated');
  };

  const addImageToPdf = async (e) => {
    const imageFile = e.target.files[0];
    if (!imageFile || !pdfBytes) return;
    const { PDFDocument } = await import('pdf-lib');
    const imageBytes = await imageFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const image = await pdfDoc.embedJpg(imageBytes);
    const pages = pdfDoc.getPages();
    pages.forEach(page => {
      const { width, height } = page.getSize();
      page.drawImage(image, {
        x: width / 4,
        y: height / 4,
        width: width / 2,
        height: height / 2,
      });
    });
    const newBytes = await pdfDoc.save();
    setPdfBytes(newBytes);
    showToast('Image added to all pages');
  };

  // Save edited file
  const saveFile = async () => {
    if (!file) return;
    setIsProcessing(true);
    let outputBytes = null;
    let contentType = 'application/octet-stream';
    let outputName = `edited_${fileName}`;

    try {
      if (fileType === 'txt' || fileType === 'csv') {
        outputBytes = new TextEncoder().encode(content);
        contentType = fileType === 'csv' ? 'text/csv' : 'text/plain';
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const wb = XLSX.read(content);
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        outputBytes = wbout;
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (fileType === 'pdf') {
        outputBytes = pdfBytes;
        contentType = 'application/pdf';
      } else if (fileType === 'docx' && docxData) {
        const { Packer } = await import('docx');
        const buffer = await Packer.toBuffer(docxData);
        outputBytes = buffer;
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }

      // Upload to Vercel Blob
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-edited-file',
          fileName: outputName,
          fileContent: Buffer.from(outputBytes).toString('base64'),
          fileType: contentType
        })
      });
      const data = await response.json();
      if (response.ok && data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = outputName;
        link.click();
        showToast('File saved and downloaded');
      } else {
        showToast('Save failed: ' + data.error, 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Error saving file', 'error');
    }
    setIsProcessing(false);
  };

  // Render Editor based on file type
  const renderEditor = () => {
    if (isProcessing) return <Loader2 className="animate-spin mx-auto my-20" size={48} />;
    if (!file) {
      return (
        <div className="text-center py-20">
          <input type="file" accept={ACCEPTED_FORMATS.join(',')} onChange={handleFileChange} className="hidden" ref={fileInputRef} />
          <button onClick={() => fileInputRef.current.click()} className="bg-[#E5322D] text-white px-8 py-4 rounded-xl font-bold text-xl inline-flex items-center gap-3 shadow-lg hover:bg-red-700 transition">
            <UploadCloud size={28} /> Select File to Edit
          </button>
          <p className="text-sm text-gray-500 mt-4">Supports PDF, DOCX, XLSX, CSV, TXT, PPTX</p>
        </div>
      );
    }

    // PDF Editor
    if (fileType === 'pdf') {
      return (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 overflow-auto max-h-[600px] border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
            {pdfBytes && (
              <Document file={pdfBytes} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
                {Array.from(new Array(numPages), (el, index) => (
                  <div key={index} className="p-2 border-b border-gray-200 dark:border-gray-600 mb-4">
                    <Page pageNumber={index + 1} width={400} />
                    <div className="flex gap-2 mt-2">
                      <button onClick={() => deletePage(index)} className="text-red-500 text-xs flex items-center gap-1">
                        <Trash2 size={14} /> Delete
                      </button>
                      <button onClick={() => rotatePage(index)} className="text-blue-500 text-xs flex items-center gap-1">
                        <RotateCw size={14} /> Rotate
                      </button>
                    </div>
                  </div>
                ))}
              </Document>
            )}
          </div>
        </div>
      );
    }

    // Text / CSV / TXT
    if (fileType === 'txt' || fileType === 'csv') {
      return (
        <div className="w-full">
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={makeBold} className="p-2 bg-gray-200 rounded"><Bold size={16} /></button>
            <button onClick={makeItalic} className="p-2 bg-gray-200 rounded"><Italic size={16} /></button>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value)}
              className="w-16 p-2 border rounded"
            />
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="p-2 border rounded"
            />
            <button onClick={undo} className="p-2 bg-gray-200 rounded"><Undo size={16} /></button>
            <button onClick={redo} className="p-2 bg-gray-200 rounded"><Redo size={16} /></button>
          </div>
          <Editor
            value={content}
            onValueChange={(code) => addToUndo(code)}
            highlight={(code) => highlight(code, languages.js)}
            padding={10}
            style={{ fontFamily: '"Fira code", monospace', fontSize: `${fontSize}px`, color: textColor, minHeight: 400 }}
            className="border rounded-lg"
          />
        </div>
      );
    }

    // Excel Editor
    if (fileType === 'xlsx' || fileType === 'xls') {
      return (
        <div className="w-full overflow-x-auto">
          <div className="flex gap-2 mb-4">
            <button onClick={undo} className="p-2 bg-gray-200 rounded"><Undo size={16} /></button>
            <button onClick={redo} className="p-2 bg-gray-200 rounded"><Redo size={16} /></button>
          </div>
          <Editor
            value={content}
            onValueChange={(code) => addToUndo(code)}
            highlight={(code) => highlight(code, languages.js)}
            padding={10}
            style={{ fontFamily: '"Fira code", monospace', fontSize: 14, minHeight: 400 }}
            className="border rounded-lg"
          />
        </div>
      );
    }

    // DOCX Editor (Demo)
    if (fileType === 'docx') {
      return (
        <div className="text-center py-20">
          <FileText size={48} className="text-[#E5322D] mx-auto mb-4" />
          <p className="text-lg font-bold mb-4">DOCX Editor (Demo)</p>
          <p className="text-sm">Basic text editing with 'docx' library. For full editing, use OnlyOffice.</p>
          <textarea
            value={content}
            onChange={(e) => addToUndo(e.target.value)}
            className="w-full h-64 p-4 border rounded mt-4"
          />
        </div>
      );
    }

    return <p>Editing for {fileType} not fully implemented yet.</p>;
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>Edit Document - MasterPdf</title>
        <meta name="description" content="Edit PDF, DOCX, XLSX, CSV, TXT, PPTX files online free. MasterPdf Document Editor." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Document Editor</h1>
          <p className="text-base sm:text-lg opacity-80">Edit PDF, Word, Excel, CSV, TXT, PPT files with advanced tools</p>
        </div>

        {/* Toolbar */}
        <div className="flex justify-end mb-4 gap-2">
          <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-full bg-white dark:bg-gray-800 shadow">
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="p-2 rounded-lg border bg-white dark:bg-gray-800">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-6 w-full max-w-7xl mx-auto">
          {/* SIDEBAR */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <SlidersHorizontal size={18} /> {t.options}
            </h3>

            {/* File Upload */}
            <div className="space-y-4">
              <button onClick={() => fileInputRef.current.click()} className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                <Plus size={18} /> {t.addMore}
              </button>
              {file && (
                <p className="text-sm font-semibold truncate max-w-full">{file.name} <span className="text-xs opacity-50">({(file.size / 1024 / 1024).toFixed(2)} MB)</span></p>
              )}
            </div>

            {/* Formatting Tools */}
            {file && (
              <div className="mt-6 space-y-4">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
                  <Sun size={16} /> Dark Mode
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={undo} className="flex items-center justify-center gap-2 p-2 bg-gray-200 rounded"><Undo size={16} /> {t.undo}</button>
                  <button onClick={redo} className="flex items-center justify-center gap-2 p-2 bg-gray-200 rounded"><Redo size={16} /> {t.redo}</button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button onClick={makeBold} className="flex items-center justify-center gap-2 p-2 bg-gray-200 rounded"><Bold size={16} /> {t.bold}</button>
                  <button onClick={makeItalic} className="flex items-center justify-center gap-2 p-2 bg-gray-200 rounded"><Italic size={16} /> {t.italic}</button>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t.fontSize}</label>
                  <input type="number" value={fontSize} onChange={(e) => setFontSize(e.target.value)} className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">{t.color}</label>
                  <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full p-1 border rounded bg-white dark:bg-gray-900" />
                </div>

                {/* PDF-specific tools */}
                {fileType === 'pdf' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.addImage}</label>
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={addImageToPdf} className="hidden" />
                    <button onClick={() => document.querySelector('input[type="file"].pdf-image').click()} className="w-full p-2 bg-yellow-500 text-white rounded">
                      <ImageIcon size={16} className="inline mr-2" /> {t.addImage}
                    </button>
                    <input type="file" accept=".jpg,.jpeg,.png" onChange={addImageToPdf} className="hidden pdf-image" />
                  </div>
                )}
              </div>
            )}

            {/* Save Button */}
            {file && (
              <button onClick={saveFile} className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600">
                <Save size={18} /> {t.save}
              </button>
            )}
          </div>

          {/* MAIN EDITOR AREA */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[600px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {renderEditor()}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h4 className="font-bold flex items-center gap-2"><History size={18} /> History</h4>
                <ul className="space-y-2 mt-2">
                  {history.map((item, idx) => (
                    <li key={idx} className="text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {toast && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
