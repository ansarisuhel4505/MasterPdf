import React, { useState } from 'react';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const { isSignedIn } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm fixed w-full top-0 z-50">
      
      {/* Left side: Logo & Menu Button */}
      <div className="flex items-center gap-6">
        
        {/* ROTATING ICON ANIMATION */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className={`md:hidden text-gray-700 hover:text-gray-900 transform transition-all duration-500 ease-in-out ${
            isSidebarOpen ? 'rotate-180' : 'rotate-0'
          }`}
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer" onClick={closeSidebar}>
            <div className="w-8 h-8 bg-[#E5322D] rounded flex items-center justify-center text-white font-bold text-xl">
              M
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">
              MASTER<span className="text-[#E5322D]">PDF</span>
            </span>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 ml-6 font-semibold text-sm text-gray-700">
          <Link href="/merge-pdf"><span className="hover:text-[#E5322D] cursor-pointer transition">MERGE PDF</span></Link>
          <Link href="/split-pdf"><span className="hover:text-[#E5322D] cursor-pointer transition">SPLIT PDF</span></Link>
          <Link href="/compress-pdf"><span className="hover:text-[#E5322D] cursor-pointer transition">COMPRESS PDF</span></Link>
          <Link href="/pdf-to-word"><span className="hover:text-[#E5322D] cursor-pointer transition">CONVERT PDF</span></Link>
          <Link href="/tools"><span className="hover:text-[#E5322D] cursor-pointer transition">ALL PDF TOOLS</span></Link>
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

      {/* --- RIGHT SIDE SLIDING SIDEBAR (Mobile) --- */}
      {/* 
        - translate-x-full: By default screen ke right side bahar chhupa rahega
        - translate-x-0: Open hone par smoothly andar aayega
        - w-fit: Sirf utni width lega jitna content hai
      */}
      <div 
        className={`fixed top-[72px] right-0 h-[calc(100vh-72px)] w-fit min-w-[220px] bg-white border-l border-gray-200 shadow-2xl flex flex-col px-8 py-8 gap-6 z-40 transform transition-transform duration-500 ease-in-out md:hidden ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <Link href="/merge-pdf" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D] transition-colors">MERGE PDF</span></Link>
        <Link href="/split-pdf" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D] transition-colors">SPLIT PDF</span></Link>
        <Link href="/compress-pdf" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D] transition-colors">COMPRESS PDF</span></Link>
        <Link href="/pdf-to-word" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D] transition-colors">CONVERT PDF</span></Link>
        <Link href="/tools" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D] transition-colors">ALL PDF TOOLS</span></Link>

        {/* Mobile Authentication Buttons */}
        {!isSignedIn && (
          <div className="flex flex-col gap-3 mt-4 pt-6 border-t border-gray-100">
            <SignInButton mode="modal">
              <button className="w-full text-center text-gray-700 font-bold border border-gray-300 py-2.5 rounded-md active:bg-gray-50 transition-colors">
                Login
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="w-full text-center bg-[#E5322D] text-white font-bold py-2.5 rounded-md active:bg-red-800 transition-colors">
                Sign up
              </button>
            </SignUpButton>
          </div>
        )}
      </div>
      
    </nav>
  );
}
