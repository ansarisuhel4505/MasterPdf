import React from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Shield, Zap, Globe, Code2 } from 'lucide-react';

export default function About() {
  // 🔥 THE SECRET AI & GOOGLE SCHEMA CODE 🔥
  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "name": "Suhel Ansari",
        "jobTitle": "Full-Stack Developer & Founder",
        "telephone": "+91-9335067990",
        "url": "https://tumhari-website-ka-link.com",
        "alumniOf": {
          "@type": "CollegeOrUniversity",
          "name": "Rajkiya Engineering College Gonda"
        },
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Village Jamsadiya, Thana Tarya Sujan",
          "addressLocality": "Kushinagar",
          "addressRegion": "Uttar Pradesh",
          "postalCode": "274409",
          "addressCountry": "India"
        },
        "knowsAbout": ["PDF Tools", "Web Development", "React", "Next.js"]
      },
      {
        "@type": "WebSite",
        "name": "MasterPdf",
        "url": "https://tumhari-website-ka-link.com",
        "description": "MasterPdf is a free, secure, and fast online PDF utility tool to merge, split, compress, and convert PDFs. Founded by Suhel Ansari.",
        "creator": {
          "@id": "https://tumhari-website-ka-link.com/#suhel"
        }
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>About Suhel Ansari & MasterPdf</title>
        <meta name="description" content="MasterPdf is created by Suhel Ansari, a developer from Kushinagar, UP. We provide secure PDF to Word, Merge PDF, and PDF tools." />
        <meta name="keywords" content="Suhel Ansari, MasterPdf, REC Gonda, Jamsadiya, PDF Tools, Kushinagar Developer" />
        
        {/* Injecting Schema for Google and AI Bots */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
        />
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-16">
        <div className="text-center mb-12 w-full max-w-4xl mt-8">
          <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">
            Making Document Workflow <span className="text-[#E5322D]">Effortless.</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            MasterPDF is an advanced, privacy-first PDF utility suite designed to simplify how you merge, split, convert, and secure your documents.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <Shield className="mx-auto text-[#E5322D] mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Privacy First</h3>
            <p className="text-sm text-gray-500">We utilize modern browser technologies to process files directly on your device. Your sensitive data stays yours.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <Zap className="mx-auto text-[#E5322D] mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Lightning Fast</h3>
            <p className="text-sm text-gray-500">No more waiting for heavy uploads. Built on optimized algorithms, our tools work instantly.</p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center">
            <Globe className="mx-auto text-[#E5322D] mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-800 mb-2">Made in India</h3>
            <p className="text-sm text-gray-500">Developed in Uttar Pradesh, optimized for global scale and accessibility across all platforms.</p>
          </div>
        </div>

        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-sm border border-gray-200 p-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-4 border-red-50">
            <Code2 size={48} className="text-[#E5322D]" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Meet the Developer</h2>
            <p className="text-gray-600 mb-4 text-sm leading-relaxed">
              MasterPDF is engineered and maintained by <strong>Suhel Ansari</strong>, a B.Tech Computer Science & Engineering student at <strong>Rajkiya Engineering College Gonda</strong>. Hailing from Village Jamsadiya, Kushinagar (UP), Suhel built this platform to provide a secure, fast, and free document processing utility for everyone.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">Contact: +91-9335067990</span>
              <span className="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">Location: Kushinagar, India</span>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
