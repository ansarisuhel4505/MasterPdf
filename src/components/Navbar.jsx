import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Jab sidebar khule toh background (body) ka scroll lock karne ke liye
  useEffect(() => {
    if (isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  }, [isSidebarOpen]);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <>
      <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm fixed w-full top-0 z-40">
        
        {/* Left side: Logo & Menu Button */}
        <div className="flex items-center gap-6">
          
          {/* Yeh original Menu icon hai (Left Side) */}
          <button 
            onClick={() => setIsSidebarOpen(true)} 
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
          <div className="hidden md:flex items-center gap-6 ml-6 font-semibold text-sm text-gray-700">
            <Link href="/merge-pdf"><span className="hover:text-[#E5322D] cursor-pointer transition-colors duration-200">MERGE PDF</span></Link>
            <Link href="/split-pdf"><span className="hover:text-[#E5322D] cursor-pointer transition-colors duration-200">SPLIT PDF</span></Link>
            <Link href="/compress-pdf"><span className="hover:text-[#E5322D] cursor-pointer transition-colors duration-200">COMPRESS PDF</span></Link>
            <Link href="/pdf-to-word"><span className="hover:text-[#E5322D] cursor-pointer transition-colors duration-200">CONVERT PDF</span></Link>
            <Link href="/tools"><span className="hover:text-[#E5322D] cursor-pointer transition-colors duration-200">ALL PDF TOOLS</span></Link>
          </div>
        </div>

        {/* Right side: Auth Buttons (Desktop) */}
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

      {/* --- NAYA MOBILE SIDEBAR (RIGHT SIDE SLIDE) --- */}
      
      {/* 1. Black Transparent Overlay (Background dull karne ke liye) */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity duration-500 md:hidden ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={closeSidebar}
      />

      {/* 2. Main Sidebar Panel (Jitna content, utna width aur Right se slide) */}
      <div 
        className={`fixed top-0 right-0 h-[100dvh] w-3/4 max-w-[280px] bg-[#F8F9FA] shadow-[-15px_0_30px_rgba(0,0,0,0.15)] z-50 flex flex-col transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:hidden ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Sidebar Header & Rotated Close Icon (Right Side) */}
        <div className="flex items-center justify-between p-5 bg-white border-b border-gray-200 shadow-sm">
          <span className="font-bold text-gray-800 tracking-wider text-sm">MENU</span>
          <button 
            onClick={closeSidebar} 
            className="text-gray-500 hover:text-[#E5322D] p-1 rounded-full hover:bg-red-50 transition-colors"
          >
            {/* Rotate animation jab sidebar khulta hai */}
            <X size={26} className={`transform transition-all duration-700 ease-in-out ${isSidebarOpen ? 'rotate-90' : '-rotate-90'}`} />
          </button>
        </div>

        {/* Sidebar Links (Bottom Space & Scroll Manage Kiya Hai) */}
        <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto pb-10">
          <Link href="/merge-pdf" onClick={closeSidebar} className="p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]">
            MERGE PDF
          </Link>
          <Link href="/split-pdf" onClick={closeSidebar} className="p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]">
            SPLIT PDF
          </Link>
          <Link href="/compress-pdf" onClick={closeSidebar} className="p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]">
            COMPRESS PDF
          </Link>
          <Link href="/pdf-to-word" onClick={closeSidebar} className="p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]">
            CONVERT PDF
          </Link>
          <Link href="/tools" onClick={closeSidebar} className="p-3 rounded-lg hover:bg-white hover:shadow-sm transition-all font-semibold text-gray-700 hover:text-[#E5322D]">
            ALL PDF TOOLS
          </Link>

          {/* Auth Buttons in Sidebar */}
          {!isSignedIn && (
            <div className="flex flex-col gap-3 mt-6 pt-6 border-t border-gray-200 px-2">
              <SignInButton mode="modal">
                <button className="w-full text-center text-gray-700 font-bold bg-white border border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition-shadow">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full text-center bg-[#E5322D] text-white font-bold py-3 rounded-lg hover:bg-red-700 shadow-md transition-shadow">
                  Sign up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
