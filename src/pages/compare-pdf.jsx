import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { upload } from '@vercel/blob/client';
import {
  UploadCloud, X, Columns, Sparkles, Settings, ArrowRight, Copy,
  Download, FileText, Trash2, Plus, Sun, Moon, History, Search,
  ChevronDown, ChevronUp, SlidersHorizontal, Eye, EyeOff, ZoomIn, ZoomOut,
  CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Document, Packer, Paragraph, HeadingLevel } from 'docx';

const ACCEPTED_FORMATS = '.pdf';

const translations = {
  en: {
    title: 'Smart PDF Compare',
    subtitle: 'AI-powered PDF comparison with advanced options',
    upload1: 'Upload Original',
    upload2: 'Upload Modified',
    compare: 'Find Differences',
    analyzing: 'Analyzing...',
    options: 'Comparison Options',
    comparisonType: 'Comparison Type',
    text: 'Text-based',
    semantic: 'Semantic',
    visual: 'Visual',
    pageRange: 'Page Range (e.g., 1-5)',
    ignoreFormatting: 'Ignore Formatting',
    ignoreAnnotations: 'Ignore Annotations',
    ignoreImages: 'Ignore Images',
    layoutModes: 'Layout Modes',
    inline: 'Inline',
    sideBySide: 'Side-by-Side',
    interleaved: 'Interleaved',
    highlightColors: 'Highlight Colors',
    added: 'Added',
    modified: 'Modified',
    deleted: 'Deleted',
    stats: 'Statistics',
    totalChanges: 'Total Changes',
    additions: 'Additions',
    deletions: 'Deletions',
    downloadReport: 'Download Report',
    exportPdf: 'Export PDF',
    exportDocx: 'Export Word',
    exportHtml: 'Export HTML',
    searchChanges: 'Search changes...',
    history: 'History',
    clearHistory: 'Clear History',
    darkMode: 'Dark Mode',
    changeLog: 'Change Log',
    accept: 'Accept',
    reject: 'Reject',
    reset: 'Reset',
    reportGenerated: 'Report Generated',
    noChanges: 'No significant differences found.',
    file1: 'Original Document',
    file2: 'Modified Document',
    loading: 'Loading...'
  },
  hi: {
    title: 'स्मार्ट PDF तुलना',
    subtitle: 'उन्नत विकल्पों के साथ AI-संचालित PDF तुलना',
    upload1: 'मूल अपलोड करें',
    upload2: 'संशोधित अपलोड करें',
    compare: 'अंतर खोजें',
    analyzing: 'विश्लेषण हो रहा है...',
    options: 'तुलना विकल्प',
    comparisonType: 'तुलना प्रकार',
    text: 'पाठ-आधारित',
    semantic: 'अर्थपूर्ण',
    visual: 'दृश्य',
    pageRange: 'पेज रेंज (जैसे 1-5)',
    ignoreFormatting: 'फ़ॉर्मेटिंग अनदेखा करें',
    ignoreAnnotations: 'एनोटेशन अनदेखा करें',
    ignoreImages: 'छवियाँ अनदेखा करें',
    layoutModes: 'लेआउट मोड',
    inline: 'इनलाइन',
    sideBySide: 'साथ-साथ',
    interleaved: 'इंटरलीव्ड',
    highlightColors: 'हाइलाइट रंग',
    added: 'जोड़ा गया',
    modified: 'संशोधित',
    deleted: 'हटाया गया',
    stats: 'आँकड़े',
    totalChanges: 'कुल परिवर्तन',
    additions: 'जोड़',
    deletions: 'हटाव',
    downloadReport: 'रिपोर्ट डाउनलोड करें',
    exportPdf: 'PDF निर्यात',
    exportDocx: 'Word निर्यात',
    exportHtml: 'HTML निर्यात',
    searchChanges: 'परिवर्तन खोजें...',
    history: 'इतिहास',
    clearHistory: 'इतिहास साफ़ करें',
    darkMode: 'डार्क मोड',
    changeLog: 'परिवर्तन लॉग',
    accept: 'स्वीकारें',
    reject: 'अस्वीकारें',
    reset: 'रीसेट',
    reportGenerated: 'रिपोर्ट तैयार',
    noChanges: 'कोई महत्वपूर्ण अंतर नहीं मिला।',
    file1: 'मूल दस्तावेज़',
    file2: 'संशोधित दस्तावेज़',
    loading: 'लोड हो रहा है...'
  }
};

export default function ComparePdf() {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState('');
  const [text1, setText1] = useState('');
  const [text2, setText2] = useState('');
  const [meta, setMeta] = useState({});
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [lang, setLang] = useState('en');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [layoutMode, setLayoutMode] = useState('sideBySide');
  const [searchTerm, setSearchTerm] = useState('');
  const [acceptState, setAcceptState] = useState({}); // per diff
  const [zoom, setZoom] = useState(1);
  
  const [options, setOptions] = useState({
    comparisonType: 'text',
    pageRange: '',
    ignoreFormatting: false,
    ignoreAnnotations: false,
    ignoreImages: false,
    highlightAdded: '#22c55e',
    highlightModified: '#facc15',
    highlightDeleted: '#ef4444'
  });

  const t = translations[lang];
  const dragCounter1 = useRef(0);
  const dragCounter2 = useRef(0);
  const fileInput1Ref = useRef(null);
  const fileInput2Ref = useRef(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load history
  useEffect(() => {
    const saved = localStorage.getItem('masterpdf_compare_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('masterpdf_compare_history', JSON.stringify(history));
  }, [history]);

  // File upload handlers
  const handleFileChange = (e, fileNum) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      if (fileNum === 1) setFile1(selected);
      if (fileNum === 2) setFile2(selected);
      setReport('');
      setText1('');
      setText2('');
    } else {
      showToast('Please upload a valid PDF', 'error');
    }
  };

  const handleDrop = (e, fileNum) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    const pdf = files.find(f => f.type === 'application/pdf');
    if (pdf) {
      if (fileNum === 1) setFile1(pdf);
      if (fileNum === 2) setFile2(pdf);
      setReport('');
    }
  };

  const removeFile = (fileNum) => {
    if (fileNum === 1) setFile1(null);
    if (fileNum === 2) setFile2(null);
    setReport('');
    setText1('');
    setText2('');
  };

  const startProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 5;
      });
    }, 200);
    return () => clearInterval(interval);
  };

  // Main analysis
  const analyzeComparison = async () => {
    if (!file1 || !file2) {
      showToast('Please upload both PDFs', 'error');
      return;
    }
    setIsAnalyzing(true);
    setProgress(0);
    const clearProgress = startProgress();

    try {
      // Upload files
      const blob1 = await upload(file1.name, file1, { access: 'public', handleUploadUrl: '/api/upload' });
      const blob2 = await upload(file2.name, file2, { access: 'public', handleUploadUrl: '/api/upload' });

      // Call backend ai-compare with options
      const response = await fetch('/api/master-convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ai-compare',
          fileUrls: [blob1.url, blob2.url],
          options: {
            comparisonType: options.comparisonType,
            pageRange: options.pageRange,
            ignoreFormatting: options.ignoreFormatting,
            ignoreAnnotations: options.ignoreAnnotations,
            ignoreImages: options.ignoreImages
          }
        })
      });

      const data = await response.json();
      if (response.ok && data.textResult) {
        setReport(data.textResult);
        setText1(data.text1 || '');
        setText2(data.text2 || '');
        setMeta(data.meta || {});
        // Add to history
        const newEntry = {
          time: new Date().toLocaleString(),
          files: [file1.name, file2.name],
          type: options.comparisonType
        };
        setHistory(prev => [newEntry, ...prev].slice(0, 10));
      } else {
        throw new Error(data.error || 'Comparison failed');
      }
    } catch (error) {
      console.error(error);
      showToast('Server connection failed', 'error');
    } finally {
      clearProgress();
      setIsAnalyzing(false);
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
    }
  };

  // Export Report as PDF
  const exportReportPdf = async () => {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const lines = report.split('\n');
    let y = 750;
    for (const line of lines) {
      if (y < 50) {
        page = pdfDoc.addPage([600, 800]);
        y = 750;
      }
      page.drawText(line, { x: 50, y, size: 12, font, color: rgb(0, 0, 0) });
      y -= 20;
    }
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comparison-report.pdf';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export as Word
  const exportReportDocx = async () => {
    const { Document, Packer, Paragraph, HeadingLevel } = await import('docx');
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: 'Comparison Report', heading: HeadingLevel.HEADING_1 }),
          ...report.split('\n').map(line => new Paragraph({ text: line }))
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comparison-report.docx';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export HTML
  const exportReportHtml = () => {
    const html = `<html><head><title>Comparison Report</title></head><body><pre>${report.replace(/</g, '&lt;')}</pre></body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comparison-report.html';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Simple diff highlighting (naive split by lines)
  const highlightDiff = (text, type) => {
    if (!text) return '';
    const lines = text.split('\n').slice(0, 30); // limit for performance
    return lines.map((line, i) => (
      <div key={i} style={{ 
        backgroundColor: type === 'added' ? options.highlightAdded : type === 'deleted' ? options.highlightDeleted : 'transparent',
        padding: '2px 5px',
        borderRadius: '3px'
      }}>
        {line}
      </div>
    ));
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans ${darkMode ? 'dark' : ''} ${darkMode ? 'bg-gray-900 text-white' : 'bg-[#F5F5F7] text-gray-900'}`}>
      <Head>
        <title>Compare PDF Files Online Free | AI PDF Comparison | MasterPdf</title>
        <meta name="description" content="Easily compare two PDF files online for free. Use AI to detect text differences, additions, and deletions instantly." />
      </Head>

      <Navbar />

      <main className="flex-grow flex flex-col p-4 sm:p-6 mt-16 mb-10">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <Sparkles size={14} /> AI Powered
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">{t.title}</h1>
          <p className="text-base sm:text-lg opacity-80">{t.subtitle}</p>
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
          {/* Sidebar */}
          <div className={`md:w-72 w-full p-4 rounded-2xl border shadow-sm ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><SlidersHorizontal size={18} /> {t.options}</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.comparisonType}</label>
                <select value={options.comparisonType} onChange={(e) => setOptions({ ...options, comparisonType: e.target.value })} className="w-full p-2 border rounded bg-white dark:bg-gray-900">
                  <option value="text">{t.text}</option>
                  <option value="semantic">{t.semantic}</option>
                  <option value="visual">{t.visual}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.pageRange}</label>
                <input type="text" value={options.pageRange} onChange={(e) => setOptions({ ...options, pageRange: e.target.value })} placeholder="e.g., 1-5" className="w-full p-2 border rounded bg-white dark:bg-gray-900" />
              </div>

              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.ignoreFormatting} onChange={(e) => setOptions({ ...options, ignoreFormatting: e.target.checked })} />
                {t.ignoreFormatting}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.ignoreAnnotations} onChange={(e) => setOptions({ ...options, ignoreAnnotations: e.target.checked })} />
                {t.ignoreAnnotations}
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={options.ignoreImages} onChange={(e) => setOptions({ ...options, ignoreImages: e.target.checked })} />
                {t.ignoreImages}
              </label>

              <button onClick={() => setShowAdvanced(!showAdvanced)} className="mt-2 w-full flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAdvanced ? 'Basic' : 'Advanced'}
              </button>

              {showAdvanced && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.highlightColors} - {t.added}</label>
                    <input type="color" value={options.highlightAdded} onChange={(e) => setOptions({ ...options, highlightAdded: e.target.value })} className="w-full h-10 p-1 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.highlightColors} - {t.modified}</label>
                    <input type="color" value={options.highlightModified} onChange={(e) => setOptions({ ...options, highlightModified: e.target.value })} className="w-full h-10 p-1 border rounded" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">{t.highlightColors} - {t.deleted}</label>
                    <input type="color" value={options.highlightDeleted} onChange={(e) => setOptions({ ...options, highlightDeleted: e.target.value })} className="w-full h-10 p-1 border rounded" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Area */}
          <div className="flex-1">
            <div className={`rounded-2xl shadow-sm border p-6 min-h-[500px] flex flex-col ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {/* Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* File 1 */}
                <div
                  onDragEnter={(e) => { e.preventDefault(); dragCounter1.current++; }}
                  onDragLeave={() => { dragCounter1.current--; }}
                  onDrop={(e) => handleDrop(e, 1)}
                  onDragOver={(e) => e.preventDefault()}
                  className={`border-2 ${file1 ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300 bg-gray-50'} rounded-xl p-6 flex flex-col items-center justify-center text-center relative transition`}
                >
                  {file1 ? (
                    <>
                      <button onClick={() => removeFile(1)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={20}/></button>
                      <Sparkles size={40} className="text-indigo-500 mb-2 opacity-80" />
                      <p className="font-bold text-gray-800 text-sm truncate max-w-full">{file1.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.file1}</p>
                    </>
                  ) : (
                    <>
                      <input type="file" id="file1-upload" accept={ACCEPTED_FORMATS} onChange={(e) => handleFileChange(e, 1)} className="hidden" ref={fileInput1Ref} />
                      <button onClick={() => fileInput1Ref.current.click()} className="cursor-pointer bg-gray-800 hover:bg-black text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition">
                        <UploadCloud size={20} /> {t.upload1}
                      </button>
                      <p className="text-xs text-gray-500 mt-3">{t.file1}</p>
                    </>
                  )}
                </div>

                {/* File 2 */}
                <div
                  onDragEnter={(e) => { e.preventDefault(); dragCounter2.current++; }}
                  onDragLeave={() => { dragCounter2.current--; }}
                  onDrop={(e) => handleDrop(e, 2)}
                  onDragOver={(e) => e.preventDefault()}
                  className={`border-2 ${file2 ? 'border-indigo-500 bg-indigo-50' : 'border-dashed border-gray-300 bg-gray-50'} rounded-xl p-6 flex flex-col items-center justify-center text-center relative transition`}
                >
                  {file2 ? (
                    <>
                      <button onClick={() => removeFile(2)} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X size={20}/></button>
                      <Columns size={40} className="text-indigo-500 mb-2 opacity-80" />
                      <p className="font-bold text-gray-800 text-sm truncate max-w-full">{file2.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{t.file2}</p>
                    </>
                  ) : (
                    <>
                      <input type="file" id="file2-upload" accept={ACCEPTED_FORMATS} onChange={(e) => handleFileChange(e, 2)} className="hidden" ref={fileInput2Ref} />
                      <button onClick={() => fileInput2Ref.current.click()} className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition">
                        <UploadCloud size={20} /> {t.upload2}
                      </button>
                      <p className="text-xs text-gray-500 mt-3">{t.file2}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Button */}
              {!report && (
                <div className="flex justify-center">
                  <button
                    onClick={analyzeComparison}
                    disabled={!file1 || !file2 || isAnalyzing}
                    className="w-full max-w-md flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400"
                  >
                    {isAnalyzing ? <><Settings className="animate-spin" size={24} /> {t.analyzing} {progress}%</> : <>{t.compare} <ArrowRight size={24} /></>}
                  </button>
                </div>
              )}

              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
              )}

              {/* Report Area */}
              {report && (
                <div className="mt-4 flex flex-col gap-4">
                  {/* Statistics */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-indigo-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-indigo-600">{meta.totalChanges || 0}</p>
                      <p className="text-xs text-gray-600">{t.totalChanges}</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-green-600">{meta.additions || 0}</p>
                      <p className="text-xs text-gray-600">{t.additions}</p>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-red-600">{meta.deletions || 0}</p>
                      <p className="text-xs text-gray-600">{t.deletions}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-600">{new Date().toLocaleDateString()}</p>
                      <p className="text-xs text-gray-600">Date</p>
                    </div>
                  </div>

                  {/* Layout modes */}
                  <div className="flex gap-2">
                    {['inline', 'sideBySide', 'interleaved'].map(mode => (
                      <button
                        key={mode}
                        onClick={() => setLayoutMode(mode)}
                        className={`px-3 py-1 rounded-lg text-sm font-semibold ${layoutMode === mode ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
                      >
                        {t[mode]}
                      </button>
                    ))}
                  </div>

                  {/* Search box */}
                  <div className="relative">
                    <Search size={16} className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder={t.searchChanges}
                      className="w-full pl-10 p-2 border rounded-lg bg-white dark:bg-gray-900"
                    />
                  </div>

                  {/* Comparison View */}
                  <div className={`border rounded-xl p-4 ${layoutMode === 'sideBySide' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                    {layoutMode === 'sideBySide' ? (
                      <>
                        <div>
                          <h4 className="font-bold mb-2">{t.file1}</h4>
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg max-h-80 overflow-y-auto">
                            {highlightDiff(text1, '')}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-bold mb-2">{t.file2}</h4>
                          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg max-h-80 overflow-y-auto">
                            {highlightDiff(text2, 'added')}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <h4 className="font-bold mb-2">{t.changeLog}</h4>
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg max-h-80 overflow-y-auto">
                          {/* Use AI report */}
                          <div className="whitespace-pre-wrap text-sm">{report}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Export Options */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={exportReportPdf} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
                      <Download size={16} /> {t.exportPdf}
                    </button>
                    <button onClick={exportReportDocx} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                      <Download size={16} /> {t.exportDocx}
                    </button>
                    <button onClick={exportReportHtml} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                      <Download size={16} /> {t.exportHtml}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold flex items-center gap-2"><History size={18} /> {t.history}</h4>
                  <button onClick={() => setHistory([])} className="text-red-500 text-sm hover:underline">{t.clearHistory}</button>
                </div>
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {history.map((item, idx) => (
                    <li key={idx} className="flex justify-between items-center text-sm bg-gray-50 dark:bg-gray-700 p-2 rounded">
                      <span>{item.files.join(' vs ')} <span className="opacity-50">({item.type}, {item.time})</span></span>
                    </li>
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
          {toast.msg}
        </div>
      )}
    </div>
  );
}
