import React from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { Layers, Image as ImageIcon, Lock, SplitSquareVertical, FileText, ArrowRight } from 'lucide-react';

export default function Services() {
  const servicesList = [
    {
      icon: <Layers size={32} className="text-white" />,
      title: 'Organize PDF',
      desc: 'Merge multiple PDFs into a single document or split a large PDF into individual pages with precision.',
      link: '/merge-pdf',
      color: 'bg-blue-500'
    },
    {
      icon: <ImageIcon size={32} className="text-white" />,
      title: 'Format Conversion',
      desc: 'Convert high-quality JPG/PNG images to PDF or transform PDFs back into editable Word and Markdown documents.',
      link: '/jpg-to-pdf',
      color: 'bg-green-500'
    },
    {
      icon: <Lock size={32} className="text-white" />,
      title: 'Document Security',
      desc: 'Add strong password encryption to your sensitive files or unlock PDFs quickly. Protect your data.',
      link: '/protect-pdf',
      color: 'bg-red-500'
    },
    {
      icon: <SplitSquareVertical size={32} className="text-white" />,
      title: 'Compression',
      desc: 'Reduce the file size of your heavy PDF documents without losing quality, making them easy to share via email.',
      link: '/compress-pdf',
      color: 'bg-purple-500'
    },
    {
      icon: <FileText size={32} className="text-white" />,
      title: 'PDF/A Archiving',
      desc: 'Convert normal PDFs to ISO-standardized PDF/A formats for long-term secure digital archiving.',
      link: '/pdf-to-pdfa',
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Our Services - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center p-6 mt-16 mb-16">
        
        <div className="text-center mb-16 w-full max-w-3xl mt-8">
          <h1 className="text-5xl font-black text-gray-900 mb-6 tracking-tight">Our Services</h1>
          <p className="text-xl text-gray-600 leading-relaxed">
            A comprehensive suite of professional tools tailored to handle all your document processing needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl">
          {servicesList.map((service, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${service.color} shadow-sm`}>
                {service.icon}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
              <p className="text-gray-500 mb-8 flex-grow">{service.desc}</p>
              <Link href={service.link} className="flex items-center gap-2 text-[#E5322D] font-bold hover:gap-3 transition-all mt-auto w-fit">
                Explore Tool <ArrowRight size={18} />
              </Link>
            </div>
          ))}
        </div>

      </main>
      <Footer />
    </div>
  );
}
