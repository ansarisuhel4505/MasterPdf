import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// 🔥 FIX: Added 'Layers' and 'Lock' in the import list below 🔥
import { Globe, ChevronDown, Phone, MessageSquare, Mail, X, FileText, Settings, Shield, Image as ImageIcon, Layers, Lock } from 'lucide-react';

export default function Footer() {
  const [selectedLang, setSelectedLang] = useState('English');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isToolsModalOpen, setIsToolsModalOpen] = useState(false);

  // 🔥 Google Translate Setup 🔥
  useEffect(() => {
    // Add Google Translate Script
    const addScript = document.createElement('script');
    addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    addScript.async = true;
    document.body.appendChild(addScript);

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false },
        'google_translate_element'
      );
    };

    // Hide Google Translate Top Banner via CSS
    const style = document.createElement('style');
    style.innerHTML = `
      .goog-te-banner-frame.skiptranslate { display: none !important; } 
      body { top: 0px !important; }
      #google_translate_element { display: none !important; }
    `;
    document.head.appendChild(style);
  }, []);

  const languages = [
    { name: 'English', code: 'en' }, { name: 'Español', code: 'es' },
    { name: 'Français', code: 'fr' }, { name: 'Deutsch', code: 'de' },
    { name: 'Italiano', code: 'it' }, { name: 'Português', code: 'pt' },
    { name: '日本語 (Japanese)', code: 'ja' }, { name: 'Русский (Russian)', code: 'ru' },
    { name: '한국어 (Korean)', code: 'ko' }, { name: '中文 (Chinese)', code: 'zh-CN' },
    { name: 'हिन्दी (Hindi)', code: 'hi' }, { name: 'Bahasa Indonesia', code: 'id' },
    { name: 'Türkçe', code: 'tr' }, { name: 'Tiếng Việt', code: 'vi' },
    { name: 'العربية (Arabic)', code: 'ar' }, { name: 'मराठी (Marathi)', code: 'mr' }
  ];

  const handleLanguageChange = (langName, langCode) => {
    setSelectedLang(langName);
    setIsLangOpen(false);
    
    const domain = window.location.hostname;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${domain}`;
    
    window.location.reload();
  };

  const toolsData = [
    { title: 'Merge PDF', path: '/merge-pdf', icon: <Layers size={16} /> },
    { title: 'Split PDF', path: '/split-pdf', icon: <FileText size={16} /> },
    { title: 'Compress PDF', path: '/compress-pdf', icon: <Settings size={16} /> },
    { title: 'PDF to Word', path: '/pdf-to-word', icon: <FileText size={16} /> },
    { title: 'Word to PDF', path: '/word-to-pdf', icon: <FileText size={16} /> },
    { title: 'Image to PDF', path: '/jpg-to-pdf', icon: <ImageIcon size={16} /> },
    { title: 'Protect PDF', path: '/protect-pdf', icon: <Shield size={16} /> },
    { title: 'Unlock PDF', path: '/unlock-pdf', icon: <Lock size={16} /> },
    { title: 'PDF to Markdown', path: '/pdf-to-markdown', icon: <FileText size={16} /> },
    { title: 'PDF to PDF/A', path: '/pdf-to-pdfa', icon: <Shield size={16} /> },
  ];

  return (
    <>
      <div id="google_translate_element"></div>

      <footer className="bg-[#1A1A1A] text-[#999999] pt-16 pb-8 text-sm font-sans mt-auto border-t border-[#333]">
        <div className="max-w-[1400px] mx-auto px-6">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-12">
            
            {/* 1. Company Column */}
            <div className="flex flex-col gap-4">
              <h2 className="text-2xl font-black text-white tracking-tight">
                M<span className="text-[#E5322D]">ASTER</span>PDF
              </h2>
              <p className="text-gray-400 text-xs leading-relaxed">
                Your personal, browser-based PDF utility tool. Built with modern web technologies to securely manage your workflow.
              </p>
              <div className="text-xs text-gray-500 mt-2">
                © {new Date().getFullYear()} MasterPdf. <br/>All rights reserved.
              </div>
            </div>

            {/* 2. Quick Links Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-bold tracking-wider mb-2 text-xs uppercase">Quick Links</h4>
              <Link href="/" className="hover:text-white transition">Home</Link>
              <Link href="/about" className="hover:text-white transition">About us</Link>
              <Link href="/services" className="hover:text-white transition">Services</Link>
              <button onClick={() => setIsToolsModalOpen(true)} className="text-left hover:text-white transition">
                All PDF Tools
              </button>
            </div>

            {/* 3. Contact Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-bold tracking-wider mb-2 text-xs uppercase">Contact Us</h4>
              <div className="flex items-center gap-2 text-gray-300">
                <Phone size={16} className="text-[#E5322D]" />
                <span>+91 9335067990</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <MessageSquare size={16} className="text-[#25D366]" />
                <span>WhatsApp: +91 9335067990</span>
              </div>
              <div className="flex items-center gap-2 text-gray-300">
                <Mail size={16} className="text-blue-400" />
                <span className="text-xs">ansarisuhel4505@gmail.com</span>
              </div>
            </div>

            {/* 4. Developer Info Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-bold tracking-wider mb-2 text-xs uppercase">Developer</h4>
              <div className="bg-[#222222] p-3 rounded-lg border border-[#333333]">
                <p className="text-white font-semibold text-sm mb-1">Suhel Ansari</p>
                <p className="text-gray-400 text-[11px] leading-tight">B.Tech Computer Science & Engineering</p>
              </div>
            </div>

            {/* 5. Social Media Icons Column */}
            <div className="flex flex-col gap-3">
              <h4 className="text-white font-bold tracking-wider mb-2 text-xs uppercase">Follow Us</h4>
              <div className="flex flex-col gap-3">
                <a href="https://wa.me/919335067990" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-[#25D366] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 0C5.385 0 0 5.383 0 12.029c0 2.124.553 4.195 1.604 6.012L.266 24l6.102-1.6c1.748.952 3.705 1.455 5.663 1.455 6.645 0 12.03-5.383 12.03-12.03S18.676 0 12.031 0zm0 21.848c-1.802 0-3.568-.485-5.116-1.404l-.367-.217-3.8.997 1.015-3.704-.238-.378C2.502 15.545 1.97 13.818 1.97 12.03 1.97 6.47 6.476 1.97 12.03 1.97c5.556 0 10.06 4.5 10.06 10.06s-4.504 10.058-10.06 10.058zm5.518-7.534c-.303-.152-1.789-.884-2.065-.986-.275-.102-.476-.152-.677.152-.2.303-.78 1.012-.956 1.214-.176.203-.353.228-.656.076-1.895-.947-3.238-2.585-3.805-3.571-.176-.303.21-.264.498-.84.076-.153.038-.278-.019-.404-.057-.127-.677-1.632-.927-2.234-.241-.58-.487-.502-.676-.511-.176-.008-.378-.01-.58-.01-.2 0-.528.076-.804.38-.276.303-1.054 1.03-1.054 2.513 0 1.484 1.08 2.918 1.23 3.12.15.203 2.128 3.25 5.155 4.557 1.942.84 2.68.868 3.513.731.954-.156 2.92-1.194 3.322-2.348.402-1.154.402-2.14.282-2.348-.12-.202-.426-.328-.73-.48z"/></svg>
                  <span className="text-xs">WhatsApp</span>
                </a>
                <a href="https://github.com/learn-coding-jet" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
                  <span className="text-xs">GitHub</span>
                </a>
                <a href="https://linkedin.com/in/suhelansari" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-[#0A66C2] transition-colors">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  <span className="text-xs">LinkedIn</span>
                </a>
              </div>
            </div>

          </div>

          <div className="border-t border-[#333333] my-6"></div>

          {/* Bottom Bar with Language Selector */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">
            
            <div className="relative">
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 bg-[#222222] border border-[#333333] px-4 py-2 rounded-md text-white text-xs font-semibold hover:bg-[#2a2a2a] transition"
              >
                <Globe size={16} className="text-gray-400" />
                <span>Translate: {selectedLang}</span>
                <ChevronDown size={14} className={`transform transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-56 bg-[#222222] border border-[#333333] rounded-lg shadow-2xl py-2 max-h-60 overflow-y-auto z-50">
                  {languages.map((lang, index) => (
                    <button
                      key={index}
                      onClick={() => handleLanguageChange(lang.name, lang.code)}
                      className="w-full text-left px-4 py-2 text-xs transition hover:bg-[#333] text-gray-300"
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-gray-500 text-center">
              MasterPDF is built for secure, fast client-side web utility operations.
            </div>
          </div>
        </div>
      </footer>

      {/* 🔥 All Tools Modal Popup 🔥 */}
      {isToolsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center bg-gray-50 border-b p-4 px-6">
              <h3 className="text-xl font-black text-gray-800">All PDF Tools</h3>
              <button onClick={() => setIsToolsModalOpen(false)} className="text-gray-500 hover:bg-gray-200 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[70vh] overflow-y-auto">
              {toolsData.map((tool, idx) => (
                <Link 
                  href={tool.path} 
                  key={idx}
                  onClick={() => setIsToolsModalOpen(false)}
                  className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-[#E5322D] hover:shadow-md transition bg-gray-50 hover:bg-red-50 group"
                >
                  <div className="text-[#E5322D] group-hover:scale-110 transition-transform">
                    {tool.icon}
                  </div>
                  <span className="font-bold text-gray-800 text-sm">{tool.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
