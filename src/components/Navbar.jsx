import React from 'react';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, useAuth } from '@clerk/nextjs';
import { Menu } from 'lucide-react';

export default function Navbar() {
  // Clerk ka naya aur best tarika check karne ka ki user login hai ya nahi
  const { isSignedIn } = useAuth(); 

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shadow-sm fixed w-full top-0 z-50">
      
      {/* Left side: Logo & Menu */}
      <div className="flex items-center gap-6">
        <button className="md:hidden text-gray-700 hover:text-gray-900 transition">
          <Menu size={24} />
        </button>
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
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

      {/* Right side: Auth Buttons */}
      <div className="flex items-center gap-4">
        
        {/* Condition: Agar user login NAHI hai (!isSignedIn) toh Login/Signup dikhao */}
        {!isSignedIn ? (
          <>
            <SignInButton mode="modal">
              <button className="hidden md:block text-gray-700 font-bold hover:text-gray-900 transition">
                Login
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="bg-[#E5322D] hover:bg-red-700 text-white font-bold py-2 px-5 rounded-md transition shadow-sm hover:shadow-md">
                Sign up
              </button>
            </SignUpButton>
          </>
        ) : (
          /* Condition: Agar user login HAI toh uski Profile/Avatar dikhao */
          <UserButton afterSignOutUrl="/" />
        )}

      </div>
    </nav>
  );
}