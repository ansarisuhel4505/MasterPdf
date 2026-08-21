import React from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Shield, Zap, Globe, Code2 } from 'lucide-react';

export default function About() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>About Us - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-16">
        
        {/* Header Section */}
        <div className="text-center mb-12 w-full max-w-4xl mt-8">
          <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">
            Making Document Workflow <span className="text-[#E5322D]">Effortless.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            MasterPDF is an advanced, privacy-first PDF utility suite designed to simplify how you merge, split, convert, and secure your documents.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <Shield className="mx-auto text-[#E5322D] mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Privacy First</h3>
            <p className="text-sm text-gray-500">We utilize modern browser technologies to process files directly on your device. Your sensitive data stays yours.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <Zap className="mx-auto text-[#E5322D] mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-500">No more waiting for heavy uploads. Built on optimized algorithms, our tools work instantly to save your precious time.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <Globe className="mx-auto text-[#E5322D] mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Accessible Anywhere</h3>
            <p className="text-sm text-gray-500">Whether you are on a desktop, tablet, or mobile phone, MasterPDF delivers a seamless experience across all platforms.</p>
          </div>
        </div>

        {/* Developer Info Section */}
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-gray-200 p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-red-50">
            <Code2 size={48} className="text-[#E5322D]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Meet the Developer</h2>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              MasterPDF is engineered and maintained by <strong>Suhel Ansari</strong>, a B.Tech Computer Science & Engineering student at Dr. A.P.J. Abdul Kalam Technical University. With a passion for creating impactful web applications, this platform was built to solve everyday document problems efficiently.
            </p>
            <div className="flex gap-4">
              <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">Full-Stack Development</span>
              <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">Next.js</span>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
