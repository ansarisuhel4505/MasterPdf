import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { 
  Menu, X, ChevronDown, 
  Merge, Scissors, Minimize2, FileText, Presentation, 
  FileSpreadsheet, PenTool, ImageIcon, FileSignature, Type, RotateCw, 
  Globe, Unlock, Lock, Layers, FileDigit, Wrench, ListOrdered, 
  Scan, ScanText, SplitSquareHorizontal, Shield, Crop, FormInput, 
  MessageSquare, Languages, FileCode2, FileMinus, FileOutput
} from 'lucide-react';

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // Desktop dropdown state
  const [mobileConvertOpen, setMobileConvertOpen] = useState(false); // Mobile dropdown states
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isSidebarOpen]);

  // Toggle mobile sidebar and cleanup desktop menu if open
  const toggleSidebar = (open) => {
    setIsSidebarOpen(open);
    if (open) {
      setActiveDropdown(null); // Close desktop menu if mobile opens
    } else {
      setMobileConvertOpen(false);
      setMobileToolsOpen(false);
    }
  };

  const closeSidebar = () => toggleSidebar(false);

  return (
    <>
      <nav className="flex items-center justify-between px-6 bg-white border-b border-gray-200 shadow-sm fixed w-full top-0 z-40 h-[72px]">
        
        {/* Left side: Logo & Menu Button */}
        <div className="flex items-center gap-6 h-full">
          
          <button 
            onClick={() => toggleSidebar(true)} 
            className={`md:hidden text-gray-700 hover:text-gray-900 transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'rotate-180 opacity-0' : 'rotate-0 opacity-100'}`}
          >
            <Menu size={26} />
          </button>

          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 bg-[#E5322D] rounded flex items-center justify-center text-white font-bold text-xl shadow-sm">
                M
              </div>
              <span className="text-xl font-bold text-gray-900 tracking-tight">
                MASTER<span className="text-[#E5322D]">PDF</span>
              </span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center h-full ml-6 font-semibold text-sm text-gray-700">
            <Link href="/merge-pdf" className="px-3 h-full flex items-center hover:text-[#E5322D] cursor-pointer transition-colors duration-200">
              MERGE PDF
            </Link>
            <Link href="/split-pdf" className="px-3 h-full flex items-center hover:text-[#E5322D] cursor-pointer transition-colors duration-200">
              SPLIT PDF
            </Link>
            <Link href="/compress-pdf" className="px-3 h-full flex items-center hover:text-[#E5322D] cursor-pointer transition-colors duration-200">
              COMPRESS PDF
            </Link>

            {/* CONVERT PDF DESKTOP DROPDOWN (Hover + Click support added) */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setActiveDropdown('convert')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={() => setActiveDropdown(prev => prev === 'convert' ? null : 'convert')}
                className={`px-3 h-full flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors duration-200 ${activeDropdown === 'convert' ? 'text-[#E5322D]' : 'hover:text-[#E5322D]'}`}
              >
                CONVERT PDF <ChevronDown size={16} className={`transition-transform duration-200 ${activeDropdown === 'convert' ? 'rotate-180' : ''}`} />
              </button>

              {activeDropdown === 'convert' && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 rounded-b-xl p-8 w-[600px] flex gap-12 z-50 cursor-default">
                  <div className="flex-1">
                    <h4 className="text-gray-400 font-bold text-xs tracking-wider mb-4">CONVERT TO PDF</h4>
                    <ul className="space-y-1">
                      <li><Link href="/jpg-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><ImageIcon size={20} className="text-yellow-500"/> JPG to PDF</Link></li>
                      <li><Link href="/word-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><FileText size={20} className="text-blue-500"/> WORD to PDF</Link></li>
                      <li><Link href="/powerpoint-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><Presentation size={20} className="text-orange-400"/> POWERPOINT to PDF</Link></li>
                      <li><Link href="/excel-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><FileSpreadsheet size={20} className="text-green-400"/> EXCEL to PDF</Link></li>
                      <li><Link href="/html-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><Globe size={20} className="text-blue-400"/> HTML to PDF</Link></li>
                    </ul>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-gray-400 font-bold text-xs tracking-wider mb-4">CONVERT FROM PDF</h4>
                    <ul className="space-y-1">
                      <li><Link href="/pdf-to-jpg" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><ImageIcon size={20} className="text-yellow-600"/> PDF to JPG</Link></li>
                      <li><Link href="/pdf-to-word" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><FileText size={20} className="text-blue-600"/> PDF to WORD</Link></li>
                      <li><Link href="/pdf-to-powerpoint" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><Presentation size={20} className="text-orange-600"/> PDF to POWERPOINT</Link></li>
                      <li><Link href="/pdf-to-excel" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><FileSpreadsheet size={20} className="text-green-500"/> PDF to EXCEL</Link></li>
                      <li><Link href="/pdf-to-pdfa" className="flex items-center gap-3 text-[14px] text-gray-800 font-medium hover:bg-gray-50 p-2 rounded-lg transition-colors"><FileDigit size={20} className="text-teal-600"/> PDF to PDF/A</Link></li>
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* ALL PDF TOOLS DESKTOP DROPDOWN (Hover + Click support added) */}
            <div 
              className="relative h-full flex items-center"
              onMouseEnter={() => setActiveDropdown('allTools')}
              onMouseLeave={() => setActiveDropdown(null)}
            >
              <button
                onClick={() => setActiveDropdown(prev => prev === 'allTools' ? null : 'allTools')}
                className={`px-3 h-full flex items-center gap-1 bg-transparent border-none cursor-pointer transition-colors duration-200 ${activeDropdown === 'allTools' ? 'text-[#E5322D]' : 'hover:text-[#E5322D]'}`}
              >
                ALL PDF TOOLS <ChevronDown size={16} className={`transition-transform duration-200 ${activeDropdown === 'allTools' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Right side: Auth Buttons */}
        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="hidden md:block text-gray-700 font-bold hover:text-gray-900 transition">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="hidden md:block bg-[#E5322D] hover:bg-red-700 text-white font-bold py-2 px-5 rounded-md transition shadow-sm hover:shadow-md">
                  Sign up
                </button>
              </SignUpButton>
            </>
          ) : (
            <UserButton afterSignOutUrl="/" />
          )}
        </div>
      </nav>

      {/* DESKTOP ALL PDF TOOLS MEGA MENU (Full width) */}
      <div 
        className={`fixed top-[72px] left-0 w-full bg-[#F5F5F7] shadow-[0_15px_30px_rgba(0,0,0,0.1)] border-t border-gray-200 z-30 transition-all duration-300 origin-top overflow-hidden ${activeDropdown === 'allTools' ? 'opacity-100 max-h-[800px] visible' : 'opacity-0 max-h-0 invisible'}`}
        onMouseEnter={() => setActiveDropdown('allTools')}
        onMouseLeave={() => setActiveDropdown(null)}
      >
        <div className="max-w-[1400px] mx-auto p-10 grid grid-cols-6 gap-6 cursor-default">
          {/* Col 1 */}
          <div>
            <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-4">ORGANIZE PDF</h4>
            <ul className="space-y-1">
              <li><Link href="/merge-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Merge size={18} className="text-red-500"/> Merge PDF</Link></li>
              <li><Link href="/split-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Scissors size={18} className="text-orange-500"/> Split PDF</Link></li>
              <li><Link href="/remove-pages" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileMinus size={18} className="text-red-400"/> Remove pages</Link></li>
              <li><Link href="/extract-pages" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileOutput size={18} className="text-orange-400"/> Extract pages</Link></li>
              <li><Link href="/organize-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Layers size={18} className="text-orange-700"/> Organize PDF</Link></li>
              <li><Link href="/scan-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Scan size={18} className="text-orange-500"/> Scan to PDF</Link></li>
            </ul>
            <h4 className="text-gray-500 font-bold text-xs tracking-wider mt-8 mb-4">PDF INTELLIGENCE</h4>
            <ul className="space-y-1">
              <li><Link href="/ai-summarizer" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><MessageSquare size={18} className="text-indigo-600"/> AI Summarizer</Link></li>
              <li><Link href="/translate-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Languages size={18} className="text-blue-500"/> Translate PDF</Link></li>
              <li><Link href="/pdf-to-markdown" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileCode2 size={18} className="text-gray-700"/> PDF to Markdown</Link></li>
            </ul>
          </div>
          {/* Col 2 */}
          <div>
            <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-4">OPTIMIZE PDF</h4>
            <ul className="space-y-1">
              <li><Link href="/compress-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Minimize2 size={18} className="text-green-600"/> Compress PDF</Link></li>
              <li><Link href="/repair-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Wrench size={18} className="text-green-700"/> Repair PDF</Link></li>
              <li><Link href="/ocr-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><ScanText size={18} className="text-blue-600"/> OCR PDF</Link></li>
            </ul>
          </div>
          {/* Col 3 */}
          <div>
            <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-4">CONVERT TO PDF</h4>
            <ul className="space-y-1">
              <li><Link href="/jpg-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><ImageIcon size={18} className="text-yellow-500"/> JPG to PDF</Link></li>
              <li><Link href="/word-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileText size={18} className="text-blue-500"/> WORD to PDF</Link></li>
              <li><Link href="/powerpoint-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Presentation size={18} className="text-orange-400"/> POWERPOINT to PDF</Link></li>
              <li><Link href="/excel-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileSpreadsheet size={18} className="text-green-400"/> EXCEL to PDF</Link></li>
              <li><Link href="/html-to-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Globe size={18} className="text-blue-400"/> HTML to PDF</Link></li>
            </ul>
          </div>
          {/* Col 4 */}
          <div>
            <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-4">CONVERT FROM PDF</h4>
            <ul className="space-y-1">
              <li><Link href="/pdf-to-jpg" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><ImageIcon size={18} className="text-yellow-600"/> PDF to JPG</Link></li>
              <li><Link href="/pdf-to-word" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileText size={18} className="text-blue-600"/> PDF to WORD</Link></li>
              <li><Link href="/pdf-to-powerpoint" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Presentation size={18} className="text-orange-600"/> PDF to POWERPOINT</Link></li>
              <li><Link href="/pdf-to-excel" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileSpreadsheet size={18} className="text-green-500"/> PDF to EXCEL</Link></li>
              <li><Link href="/pdf-to-pdfa" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileDigit size={18} className="text-teal-600"/> PDF to PDF/A</Link></li>
            </ul>
          </div>
          {/* Col 5 */}
          <div>
            <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-4">EDIT PDF</h4>
            <ul className="space-y-1">
              <li><Link href="/rotate-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><RotateCw size={18} className="text-purple-600"/> Rotate PDF</Link></li>
              <li><Link href="/add-page-numbers" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><ListOrdered size={18} className="text-red-600"/> Add page numbers</Link></li>
              <li><Link href="/add-watermark" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Type size={18} className="text-pink-600"/> Add watermark</Link></li>
              <li><Link href="/crop-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Crop size={18} className="text-pink-500"/> Crop PDF</Link></li>
              <li><Link href="/edit-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><PenTool size={18} className="text-red-400"/> Edit PDF</Link></li>
              <li><Link href="/pdf-forms" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FormInput size={18} className="text-purple-500"/> PDF Forms</Link></li>
            </ul>
          </div>
          {/* Col 6 */}
          <div>
            <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-4">PDF SECURITY</h4>
            <ul className="space-y-1">
              <li><Link href="/unlock-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Unlock size={18} className="text-gray-500"/> Unlock PDF</Link></li>
              <li><Link href="/protect-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Lock size={18} className="text-blue-800"/> Protect PDF</Link></li>
              <li><Link href="/sign-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><FileSignature size={18} className="text-blue-700"/> Sign PDF</Link></li>
              <li><Link href="/redact-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><Shield size={18} className="text-gray-800"/> Redact PDF</Link></li>
              <li><Link href="/compare-pdf" className="flex items-center gap-3 text-[14px] text-gray-900 font-medium hover:bg-gray-200 p-2 rounded-lg transition"><SplitSquareHorizontal size={18} className="text-indigo-500"/> Compare PDF</Link></li>
            </ul>
          </div>
        </div>
      </div>

      {/* --- MOBILE SIDEBAR --- */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-500 md:hidden ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={closeSidebar}
      />
      <div 
        className={`fixed top-0 right-0 h-[100dvh] w-3/4 max-w-[280px] bg-[#F8F9FA] shadow-[-15px_0_30px_rgba(0,0,0,0.15)] z-50 flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-5 bg-white border-b border-gray-200 shadow-sm">
          <span className="font-bold text-gray-800 tracking-wider text-sm">MENU</span>
          <button 
            onClick={closeSidebar} 
            className="text-gray-500 hover:text-[#E5322D] p-1 rounded-full hover:bg-red-50 transition-colors"
          >
            <X size={26} className={`transform transition-all duration-700 ease-in-out ${isSidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>

        <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto pb-10">
          
          {/* Basic Links */}
          <Link href="/merge-pdf" onClick={closeSidebar} className="p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]">MERGE PDF</Link>
          <Link href="/split-pdf" onClick={closeSidebar} className="p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]">SPLIT PDF</Link>
          <Link href="/compress-pdf" onClick={closeSidebar} className="p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]">COMPRESS PDF</Link>

          {/* MOBILE: CONVERT PDF Accordion */}
          <div className="border-b border-gray-100">
            <button 
              onClick={() => {
                setMobileConvertOpen(!mobileConvertOpen);
                if (mobileToolsOpen) setMobileToolsOpen(false); // Close the other accordion
              }}
              className="p-3 w-full flex items-center justify-between rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]"
            >
              <span>CONVERT PDF</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${mobileConvertOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {mobileConvertOpen && (
              <div className="px-4 pb-4 bg-[#F5F5F7] border-t border-gray-100 mt-1 rounded-lg">
                <h4 className="text-gray-400 font-bold text-xs tracking-wider mt-3 mb-2">CONVERT TO PDF</h4>
                <ul className="space-y-1">
                  <li><Link href="/jpg-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><ImageIcon size={16} className="text-yellow-500"/> JPG to PDF</Link></li>
                  <li><Link href="/word-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileText size={16} className="text-blue-500"/> WORD to PDF</Link></li>
                  <li><Link href="/powerpoint-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Presentation size={16} className="text-orange-400"/> POWERPOINT to PDF</Link></li>
                  <li><Link href="/excel-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileSpreadsheet size={16} className="text-green-400"/> EXCEL to PDF</Link></li>
                  <li><Link href="/html-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Globe size={16} className="text-blue-400"/> HTML to PDF</Link></li>
                </ul>
                <h4 className="text-gray-400 font-bold text-xs tracking-wider mt-4 mb-2">CONVERT FROM PDF</h4>
                <ul className="space-y-1">
                  <li><Link href="/pdf-to-jpg" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><ImageIcon size={16} className="text-yellow-600"/> PDF to JPG</Link></li>
                  <li><Link href="/pdf-to-word" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileText size={16} className="text-blue-600"/> PDF to WORD</Link></li>
                  <li><Link href="/pdf-to-powerpoint" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Presentation size={16} className="text-orange-600"/> PDF to POWERPOINT</Link></li>
                  <li><Link href="/pdf-to-excel" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileSpreadsheet size={16} className="text-green-500"/> PDF to EXCEL</Link></li>
                  <li><Link href="/pdf-to-pdfa" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileDigit size={16} className="text-teal-600"/> PDF to PDF/A</Link></li>
                </ul>
              </div>
            )}
          </div>

          {/* MOBILE: ALL TOOLS Accordion */}
          <div className="border-b border-gray-100">
            <button 
              onClick={() => {
                setMobileToolsOpen(!mobileToolsOpen);
                if (mobileConvertOpen) setMobileConvertOpen(false); // Close the other accordion
              }}
              className="p-3 w-full flex items-center justify-between rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]"
            >
              <span>ALL PDF TOOLS</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${mobileToolsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {mobileToolsOpen && (
              <div className="px-4 pb-4 bg-[#F5F5F7] border-t border-gray-100 mt-1 rounded-lg max-h-[55vh] overflow-y-auto">
                 <div className="py-1">
                   <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-2 mt-2">ORGANIZE PDF</h4>
                   <ul className="space-y-1 ml-1">
                      <li><Link href="/merge-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Merge size={16} className="text-red-500"/> Merge PDF</Link></li>
                      <li><Link href="/split-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Scissors size={16} className="text-orange-500"/> Split PDF</Link></li>
                      <li><Link href="/remove-pages" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileMinus size={16} className="text-red-400"/> Remove pages</Link></li>
                      <li><Link href="/extract-pages" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileOutput size={16} className="text-orange-400"/> Extract pages</Link></li>
                      <li><Link href="/organize-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Layers size={16} className="text-orange-700"/> Organize PDF</Link></li>
                      <li><Link href="/scan-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Scan size={16} className="text-orange-500"/> Scan to PDF</Link></li>
                   </ul>
                   <h4 className="text-gray-500 font-bold text-xs tracking-wider mt-4 mb-2">PDF INTELLIGENCE</h4>
                   <ul className="space-y-1 ml-1">
                      <li><Link href="/ai-summarizer" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><MessageSquare size={16} className="text-indigo-600"/> AI Summarizer</Link></li>
                      <li><Link href="/translate-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Languages size={16} className="text-blue-500"/> Translate PDF</Link></li>
                      <li><Link href="/pdf-to-markdown" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileCode2 size={16} className="text-gray-700"/> PDF to Markdown</Link></li>
                   </ul>
                 </div>
                 <div className="py-1">
                   <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-2 mt-2">OPTIMIZE PDF</h4>
                   <ul className="space-y-1 ml-1">
                      <li><Link href="/compress-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Minimize2 size={16} className="text-green-600"/> Compress PDF</Link></li>
                      <li><Link href="/repair-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Wrench size={16} className="text-green-700"/> Repair PDF</Link></li>
                      <li><Link href="/ocr-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><ScanText size={16} className="text-blue-600"/> OCR PDF</Link></li>
                   </ul>
                 </div>
                 <div className="py-1">
                   <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-2 mt-2">CONVERT TO PDF</h4>
                   <ul className="space-y-1 ml-1">
                      <li><Link href="/jpg-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><ImageIcon size={16} className="text-yellow-500"/> JPG to PDF</Link></li>
                      <li><Link href="/word-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileText size={16} className="text-blue-500"/> WORD to PDF</Link></li>
                      <li><Link href="/powerpoint-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Presentation size={16} className="text-orange-400"/> POWERPOINT to PDF</Link></li>
                      <li><Link href="/excel-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileSpreadsheet size={16} className="text-green-400"/> EXCEL to PDF</Link></li>
                      <li><Link href="/html-to-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Globe size={16} className="text-blue-400"/> HTML to PDF</Link></li>
                   </ul>
                 </div>
                 <div className="py-1">
                   <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-2 mt-2">CONVERT FROM PDF</h4>
                   <ul className="space-y-1 ml-1">
                      <li><Link href="/pdf-to-jpg" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><ImageIcon size={16} className="text-yellow-600"/> PDF to JPG</Link></li>
                      <li><Link href="/pdf-to-word" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileText size={16} className="text-blue-600"/> PDF to WORD</Link></li>
                      <li><Link href="/pdf-to-powerpoint" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Presentation size={16} className="text-orange-600"/> PDF to POWERPOINT</Link></li>
                      <li><Link href="/pdf-to-excel" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileSpreadsheet size={16} className="text-green-500"/> PDF to EXCEL</Link></li>
                      <li><Link href="/pdf-to-pdfa" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileDigit size={16} className="text-teal-600"/> PDF to PDF/A</Link></li>
                   </ul>
                 </div>
                 <div className="py-1">
                   <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-2 mt-2">EDIT PDF</h4>
                   <ul className="space-y-1 ml-1">
                      <li><Link href="/rotate-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><RotateCw size={16} className="text-purple-600"/> Rotate PDF</Link></li>
                      <li><Link href="/add-page-numbers" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><ListOrdered size={16} className="text-red-600"/> Add page numbers</Link></li>
                      <li><Link href="/add-watermark" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Type size={16} className="text-pink-600"/> Add watermark</Link></li>
                      <li><Link href="/crop-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Crop size={16} className="text-pink-500"/> Crop PDF</Link></li>
                      <li><Link href="/edit-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><PenTool size={16} className="text-red-400"/> Edit PDF</Link></li>
                      <li><Link href="/pdf-forms" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FormInput size={16} className="text-purple-500"/> PDF Forms</Link></li>
                   </ul>
                 </div>
                 <div className="py-1">
                   <h4 className="text-gray-500 font-bold text-xs tracking-wider mb-2 mt-2">PDF SECURITY</h4>
                   <ul className="space-y-1 ml-1">
                      <li><Link href="/unlock-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Unlock size={16} className="text-gray-500"/> Unlock PDF</Link></li>
                      <li><Link href="/protect-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Lock size={16} className="text-blue-800"/> Protect PDF</Link></li>
                      <li><Link href="/sign-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><FileSignature size={16} className="text-blue-700"/> Sign PDF</Link></li>
                      <li><Link href="/redact-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><Shield size={16} className="text-gray-800"/> Redact PDF</Link></li>
                      <li><Link href="/compare-pdf" onClick={closeSidebar} className="flex items-center gap-2 text-[13px] text-gray-800 font-medium p-2 hover:bg-gray-200 rounded-md"><SplitSquareHorizontal size={16} className="text-indigo-500"/> Compare PDF</Link></li>
                   </ul>
                 </div>
              </div>
            )}
          </div>

          {!isSignedIn && (
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-200 px-2">
              <SignInButton mode="modal">
                <button className="w-full text-center text-gray-700 font-bold bg-white border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-shadow">Login</button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full text-center bg-[#E5322D] text-white font-bold py-3 rounded-lg hover:bg-red-700 shadow-md transition-shadow">Sign up</button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
