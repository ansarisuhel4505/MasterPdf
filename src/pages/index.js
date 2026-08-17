import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { 
  CheckCircle2, Merge, Scissors, Minimize2, FileText, Presentation, 
  FileSpreadsheet, PenTool, ImageIcon, FileSignature, Type, RotateCw, 
  Globe, Unlock, Lock, Layers, FileDigit, Wrench, ListOrdered, 
  Scan, ScanText, SplitSquareHorizontal, Shield, Crop, FormInput, 
  MessageSquare, Languages, FileCode2
} from 'lucide-react';

export default function Home() {
  // 1. State for active tab
  const [activeTab, setActiveTab] = useState('All');

  // 2. Added 'category' to each tool
  const allTools = [
    { title: 'Merge PDF', desc: 'Combine PDFs in the order you want with the easiest PDF merger available.', color: 'text-red-500', icon: Merge, category: 'Organize PDF' },
    { title: 'Split PDF', desc: 'Separate one page or a whole set for easy conversion into independent PDF files.', color: 'text-orange-500', icon: Scissors, category: 'Organize PDF' },
    { title: 'Compress PDF', desc: 'Reduce file size while optimizing for maximal PDF quality.', color: 'text-green-600', icon: Minimize2, category: 'Optimize PDF' },
    { title: 'PDF to Word', desc: 'Easily convert your PDF files into easy to edit DOC and DOCX documents.', color: 'text-blue-600', icon: FileText, category: 'Convert PDF' },
    { title: 'PDF to PowerPoint', desc: 'Turn your PDF files into easy to edit PPT and PPTX slideshows.', color: 'text-orange-600', icon: Presentation, category: 'Convert PDF' },
    { title: 'PDF to Excel', desc: 'Pull data straight from PDFs into Excel spreadsheets in a few short seconds.', color: 'text-green-500', icon: FileSpreadsheet, category: 'Convert PDF' },
    { title: 'Word to PDF', desc: 'Make DOC and DOCX files easy to read by converting them to PDF.', color: 'text-blue-500', icon: FileText, category: 'Convert PDF' },
    { title: 'PowerPoint to PDF', desc: 'Make PPT and PPTX slideshows easy to view by converting them to PDF.', color: 'text-orange-400', icon: Presentation, category: 'Convert PDF' },
    { title: 'Excel to PDF', desc: 'Make EXCEL spreadsheets easy to read by converting them to PDF.', color: 'text-green-400', icon: FileSpreadsheet, category: 'Convert PDF' },
    { title: 'Edit PDF', desc: 'Add text, images, shapes or freehand annotations to a PDF document.', color: 'text-red-400', icon: PenTool, category: 'Edit PDF' },
    { title: 'PDF to JPG', desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', color: 'text-yellow-500', icon: ImageIcon, category: 'Convert PDF' },
    { title: 'JPG to PDF', desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', color: 'text-yellow-600', icon: ImageIcon, category: 'Convert PDF' },
    { title: 'Sign PDF', desc: 'Sign yourself or request electronic signatures from others.', color: 'text-blue-700', icon: FileSignature, category: 'PDF Security' },
    { title: 'Watermark', desc: 'Stamp an image or text over your PDF in seconds. Choose typography, transparency.', color: 'text-pink-600', icon: Type, category: 'Edit PDF' },
    { title: 'Rotate PDF', desc: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs.', color: 'text-purple-600', icon: RotateCw, category: 'Organize PDF' },
    { title: 'HTML to PDF', desc: 'Convert webpages in HTML to PDF. Copy and paste the URL of the page.', color: 'text-blue-400', icon: Globe, category: 'Convert PDF' },
    { title: 'Unlock PDF', desc: 'Remove PDF password security, giving you the freedom to use your PDFs.', color: 'text-gray-500', icon: Unlock, category: 'PDF Security' },
    { title: 'Protect PDF', desc: 'Protect PDF files with a password. Encrypt PDF documents to prevent access.', color: 'text-blue-800', icon: Lock, category: 'PDF Security' },
    { title: 'Organize PDF', desc: 'Sort pages of your PDF file however you like. Delete PDF pages or add pages.', color: 'text-orange-700', icon: Layers, category: 'Organize PDF' },
    { title: 'PDF to PDF/A', desc: 'Transform your PDF to PDF/A, the ISO-standardized version of PDF.', color: 'text-teal-600', icon: FileDigit, category: 'Convert PDF' },
    { title: 'Repair PDF', desc: 'Repair a damaged PDF and recover data from corrupt PDF. Fix PDF files.', color: 'text-green-700', icon: Wrench, category: 'Optimize PDF' },
    { title: 'Page numbers', desc: 'Add page numbers into PDFs with ease. Choose your positions, dimensions.', color: 'text-red-600', icon: ListOrdered, category: 'Edit PDF' },
    { title: 'Scan to PDF', desc: 'Capture document scans from your mobile device and send them instantly.', color: 'text-orange-500', icon: Scan, category: 'Workflows' },
    { title: 'OCR PDF', desc: 'Easily convert scanned PDF into searchable and selectable documents.', color: 'text-blue-600', icon: ScanText, category: 'Optimize PDF' },
    { title: 'Compare PDF', desc: 'Show a side-by-side document comparison and easily spot changes.', color: 'text-indigo-500', icon: SplitSquareHorizontal, category: 'Workflows' },
    { title: 'Redact PDF', desc: 'Redact text and graphics to permanently remove sensitive information.', color: 'text-gray-800', icon: Shield, category: 'PDF Security' },
    { title: 'Crop PDF', desc: 'Crop margins of PDF documents or select specific areas, then apply.', color: 'text-pink-500', icon: Crop, category: 'Edit PDF' },
    { title: 'PDF Forms', desc: 'Detect form fields automatically, create interactive fillable PDFs.', color: 'text-purple-500', icon: FormInput, category: 'Workflows' },
    { title: 'AI Summarizer', desc: 'Quickly generate concise summaries from articles, paragraphs, and essays.', color: 'text-indigo-600', badge: 'New!', icon: MessageSquare, category: 'PDF Intelligence' },
    { title: 'Translate PDF', desc: 'Easily translate PDF files powered by AI. Keep fonts, layout intact.', color: 'text-blue-500', badge: 'New!', icon: Languages, category: 'PDF Intelligence' },
    { title: 'PDF to Markdown', desc: 'Easily turn PDFs into Markdown files. Perfect for notes, docs, and LLMs.', color: 'text-gray-700', badge: 'New!', icon: FileCode2, category: 'Convert PDF' },
  ];

  const tabs = ['All', 'Workflows', 'Organize PDF', 'Optimize PDF', 'Convert PDF', 'Edit PDF', 'PDF Security', 'PDF Intelligence'];

  // 3. Filter logic based on the active tab
  const filteredTools = activeTab === 'All' 
    ? allTools 
    : allTools.filter(tool => tool.category === activeTab);

  return (
    <div className="min-h-screen bg-[#F5F5F7] font-sans">
      <Head><title>MasterPdf | Online PDF tools for PDF lovers</title></Head>
      <Navbar />

      <main className="max-w-[1400px] mx-auto px-4 pt-28 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-[42px] font-bold text-gray-900 mb-4 tracking-tight">
            Every tool you need to work with PDFs in one place
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto font-medium">
            Every tool you need to use PDFs, at your fingertips. All are 100% FREE and easy to use! Merge, split, compress, convert, rotate, unlock and watermark PDFs with just a few clicks.
          </p>
        </div>

        {/* Tab Buttons Setup */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {tabs.map((tab, idx) => (
            <button 
              key={idx} 
              // Set the active tab when clicked
              onClick={() => setActiveTab(tab)}
              // Dynamically change styles based on active tab
              className={`px-4 py-2 rounded-full text-sm font-semibold transition ${
                activeTab === tab 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-sm'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Rendering filtered tools instead of all tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 xl:gap-5 mb-20">
          {filteredTools.map((tool, index) => {
            const ToolIcon = tool.icon; 
            return (
              <Link href={`/${tool.title.toLowerCase().replace(/ /g, '-')}`} key={index}>
                <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md border border-gray-100 h-full cursor-pointer relative group transition-all duration-200">
                  {tool.badge && (
                    <span className="absolute top-4 right-4 bg-teal-100 text-teal-700 text-xs font-bold px-2 py-1 rounded-md">
                      {tool.badge}
                    </span>
                  )}
                  <div className={`w-10 h-10 mb-4 flex items-center justify-center ${tool.color}`}>
                    <ToolIcon size={36} strokeWidth={1.5} /> 
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#E5322D] transition-colors">{tool.title}</h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{tool.desc}</p>
                </div>
              </Link>
            )
          })}
        </div>

        {/* Promo Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Work offline with Desktop</h3>
            <p className="text-gray-500 mb-6 text-sm">Batch edit and manage documents locally, with no internet and no limits.</p>
            <span className="inline-block text-xl text-gray-400">↗</span>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-3">On-the-go with Mobile</h3>
            <p className="text-gray-500 mb-6 text-sm">Your favorite tools, right in your pocket. Keep working on your projects anytime, anywhere.</p>
            <span className="inline-block text-xl text-red-500">↗</span>
          </div>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Built for business</h3>
            <p className="text-gray-500 mb-6 text-sm">Automate document management, onboard teams easily, and scale with flexible plans.</p>
            <span className="inline-block text-xl text-gray-400">↗</span>
          </div>
        </div>

        <div className="bg-[#FFF4E5] rounded-2xl p-10 flex flex-col md:flex-row items-center justify-between mb-10 overflow-hidden relative">
          <div className="z-10 w-full md:w-1/2">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Get more with Premium</h2>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3"><CheckCircle2 className="text-green-600 mt-1 shrink-0" size={20} /><span className="text-gray-700">Get full access to MasterPdf and work offline with Desktop</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="text-green-600 mt-1 shrink-0" size={20} /><span className="text-gray-700">Edit PDFs, get advanced OCR for scanned documents and request secure e-Signatures</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="text-green-600 mt-1 shrink-0" size={20} /><span className="text-gray-700">Connect tools and create custom workflows</span></li>
            </ul>
            <button className="bg-[#FFB822] hover:bg-[#F2A900] text-gray-900 font-bold px-8 py-3 rounded-md transition">Get Premium</button>
          </div>
          <div className="hidden md:block w-1/2 absolute right-0 top-0 h-full bg-cover bg-right opacity-30" style={{backgroundImage: "url('https://www.ilovepdf.com/img/ilovepdf/premium/premium-home-banner.svg')"}}></div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
