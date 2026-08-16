import React, { useState } from 'react';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
// X icon add kiya hai taaki menu close karne ka button dikhe
import { Menu, X } from 'lucide-react'; 

export default function Navbar() {
  const { isSignedIn } = useAuth();
  
  // NAYA LOGIC: Sidebar open/close track karne ke liye state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Jab koi link click kare toh sidebar auto-close ho jaye
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm fixed w-full top-0 z-50">
      
      {/* Left side: Logo & Menu */}
      <div className="flex items-center gap-6">
        
        {/* UPDATED: Hamburger Button par onClick lagaya */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="md:hidden text-gray-700 hover:text-gray-900 transition"
        >
          {/* Agar open hai toh 'X' dikhao, warna 'Menu' icon dikhao */}
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

        {/* Desktop Links (Mobile par hidden rehte hain) */}
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

      {/* --- NAYA CODE: MOBILE SIDEBAR DROP DOWN --- */}
      {/* Agar isSidebarOpen true hai, tabhi yeh div dikhega */}
      {isSidebarOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-white border-b border-gray-200 shadow-xl md:hidden flex flex-col px-6 py-6 gap-5 z-40">
          <Link href="/merge-pdf" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D]">MERGE PDF</span></Link>
          <Link href="/split-pdf" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D]">SPLIT PDF</span></Link>
          <Link href="/compress-pdf" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D]">COMPRESS PDF</span></Link>
          <Link href="/pdf-to-word" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D]">CONVERT PDF</span></Link>
          <Link href="/tools" onClick={closeSidebar}><span className="block font-semibold text-gray-800 hover:text-[#E5322D]">ALL PDF TOOLS</span></Link>

          {/* Mobile mein Login/Signup Buttons */}
          {!isSignedIn && (
            <div className="flex flex-col gap-3 mt-4 pt-5 border-t border-gray-200">
              <SignInButton mode="modal">
                <button className="w-full text-center text-gray-700 font-bold border border-gray-300 py-3 rounded-md active:bg-gray-50">
                  Login
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="w-full text-center bg-[#E5322D] text-white font-bold py-3 rounded-md active:bg-red-800">
                  Sign up
                </button>
              </SignUpButton>
            </div>
          )}
        </div>
      )}
      
    </nav>
  );
}
