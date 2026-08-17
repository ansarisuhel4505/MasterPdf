import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Globe, ChevronDown, Check, 
  Phone, Mail, MessageCircle, 
  Github, Linkedin, Instagram 
} from 'lucide-react';

export default function Footer() {
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('en'); // Default language

  // Available Languages with their Google Translate Codes
  const languages = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'es', name: 'Spanish', native: 'Español' },
    { code: 'fr', name: 'French', native: 'Français' },
    { code: 'de', name: 'German', native: 'Deutsch' },
    { code: 'zh-CN', name: 'Chinese', native: '中文 (简体)' },
    { code: 'ar', name: 'Arabic', native: 'العربية' },
    { code: 'ru', name: 'Russian', native: 'Русский' },
    { code: 'ja', name: 'Japanese', native: '日本語' },
  ];

  // Google Translate Widget Injector
  useEffect(() => {
    // Check if script already exists to avoid duplicates
    if (!document.getElementById('google-translate-script')) {
      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { pageLanguage: 'en', autoDisplay: false },
          'google_translate_element'
        );
      };
    }

    // Check cookie to set current language state on load
    const match = document.cookie.match(/(?:^|;)\s*googtrans=([^;]*)/);
    if (match) {
      const selectedLang = match[1].split('/')[2];
      if (selectedLang) setCurrentLang(selectedLang);
    }
  }, []);

  // Function to change language and translate entire website
  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    setIsLangMenuOpen(false);
    
    // Set Google Translate Cookie
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; domain=${window.location.hostname}; path=/;`;
    
    // Reload page to apply translation to the entire website
    window.location.reload();
  };

  return (
    <footer className="bg-[#1A1A1A] text-[#999999] pt-16 pb-8 text-sm font-sans mt-auto relative">
      
      {/* Hidden Google Translate Element (Required for logic to work) */}
      <div id="google_translate_element" className="hidden"></div>

      <div className="max-w-[1400px] mx-auto px-6">
        
        {/* Main Footer Grid - 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          
          {/* Column 1: Company (Logo, Developer, Copyright) */}
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-2">
                M<span className="text-[#E5322D]">ASTER</span>PDF
              </h2>
              <p className="text-gray-400 leading-relaxed text-xs">
                Your personal, browser-based PDF utility tool. Built securely without server uploads.
              </p>
            </div>
            
            <div className="bg-[#222222] p-4 rounded-lg border border-[#333333]">
              <h4 className="text-white font-bold tracking-wider mb-2 text-[10px] uppercase text-[#E5322D]">Developer</h4>
              <p className="text-white font-semibold text-sm mb-1">Suhel Ansari</p>
              <p className="text-gray-400 text-xs">B.Tech CSE (2nd Year)</p>
            </div>

            <div className="text-xs text-gray-500 mt-2">
               © {new Date().getFullYear()} MasterPdf. Handcrafted for better PDF management.
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col gap-3 lg:pl-10">
            <h4 className="text-white font-bold tracking-wider mb-2 text-xs uppercase">Quick Links</h4>
            <Link href="/" className="hover:text-[#E5322D] hover:translate-x-1 transition-all duration-300">Home</Link>
            <Link href="/about" className="hover:text-[#E5322D] hover:translate-x-1 transition-all duration-300">About Us</Link>
            <Link href="/services" className="hover:text-[#E5322D] hover:translate-x-1 transition-all duration-300">Services</Link>
            <Link href="/tools" className="hover:text-[#E5322D] hover:translate-x-1 transition-all duration-300">All PDF Tools</Link>
          </div>

          {/* Column 3: Contact */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold tracking-wider mb-2 text-xs uppercase">Contact Us</h4>
            
            <a href="tel:+919335067990" className="flex items-center gap-3 hover:text-white transition group">
              <div className="bg-[#333] p-2 rounded-full group-hover:bg-[#E5322D] transition-colors"><Phone size={16} /></div>
              <span>+91 9335067990</span>
            </a>
            
            <a href="https://wa.me/919335067990" target="_blank" rel="noreferrer" className="flex items-center gap-3 hover:text-white transition group">
              <div className="bg-[#333] p-2 rounded-full group-hover:bg-[#25D366] transition-colors"><MessageCircle size={16} /></div>
              <span>WhatsApp Chat</span>
            </a>
            
            <a href="mailto:ansarisuhel4505@gmail.com" className="flex items-center gap-3 hover:text-white transition group">
              <div className="bg-[#333] p-2 rounded-full group-hover:bg-blue-500 transition-colors"><Mail size={16} /></div>
              <span>Email Support</span>
            </a>
          </div>

          {/* Column 4: Social Media (Vertical Stack) */}
          <div className="flex flex-col gap-4">
            <h4 className="text-white font-bold tracking-wider mb-2 text-xs uppercase">Follow Us</h4>
            
            <a href="https://wa.me/919335067990" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-[#25D366] transition-colors">
              <MessageCircle size={20} /> <span className="text-sm">WhatsApp</span>
            </a>
            <a href="https://github.com/" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
              <Github size={20} /> <span className="text-sm">GitHub</span>
            </a>
            <a href="https://linkedin.com/in/" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-[#0A66C2] transition-colors">
              <Linkedin size={20} /> <span className="text-sm">LinkedIn</span>
            </a>
            <a href="https://instagram.com/" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-gray-400 hover:text-[#E1306C] transition-colors">
              <Instagram size={20} /> <span className="text-sm">Instagram</span>
            </a>
          </div>

        </div>

        <div className="border-t border-[#333333] mb-6"></div>

        {/* Bottom Area: Language Selector aligned to left like iLovePDF */}
        <div className="relative inline-block">
          
          {/* Language Button */}
          <button 
            onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
            className="flex items-center gap-2 border border-gray-600 rounded-md px-4 py-2 hover:bg-[#333] hover:text-white transition-colors text-sm font-medium"
          >
            <Globe size={18} />
            <span>{languages.find(l => l.code === currentLang)?.name || 'English'}</span>
            <ChevronDown size={16} className={`transition-transform ${isLangMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Language Dropdown Modal (Similar to image) */}
          {isLangMenuOpen && (
            <>
              {/* Overlay to close modal when clicked outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsLangMenuOpen(false)}
              ></div>
              
              <div className="absolute bottom-full left-0 mb-2 w-[280px] sm:w-[400px] bg-white text-gray-800 rounded-xl shadow-2xl p-4 z-50 transform origin-bottom-left transition-all">
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`flex items-center justify-between text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${currentLang === lang.code ? 'font-bold text-[#E5322D]' : 'font-medium'}`}
                    >
                      <span className="flex items-center gap-2">
                        {currentLang === lang.code && <Check size={16} />}
                        {lang.native}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </footer>
  );
}
