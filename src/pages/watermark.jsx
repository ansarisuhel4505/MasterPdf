import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import { UploadCloud, FileText, X, Type, Settings, Stamp } from 'lucide-react';

export default function AddWatermark() {
  const [file, setFile] = useState(null);
  const [isWatermarking, setIsWatermarking] = useState(false);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkColor, setWatermarkColor] = useState('#E5322D'); 

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const removeFile = () => {
    setFile(null);
  };

  const hexToPdfRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    return rgb(r, g, b);
  };

  const applyWatermark = async () => {
    if (!file) return;
    if (!watermarkText.trim()) {
      alert("Please enter some text for the watermark.");
      return;
    }

    setIsWatermarking(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      
      const customFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        
        // --- DYNAMIC TEXT SIZING LOGIC ---
        // Page ke diagonal ki length calculate karna
        const diagonal = Math.sqrt(width * width + height * height);
        const maxTextWidth = diagonal * 0.75; // Diagonal ka 75% max width manenge taaki side mein thodi jagah (margin) bache
        
        // Base size par text ki width check karna
        const baseSize = 100;
        const textWidthAtBase = customFont.widthOfTextAtSize(watermarkText, baseSize);
        
        // Scale factor nikalna
        const scale = maxTextWidth / textWidthAtBase;
        
        // Final size set karna (Max size 70 rakha hai taaki chhote words bohot zyada bade na ho jayein)
        const textSize = Math.min(baseSize * scale, 70);
        // ---------------------------------

        const textWidth = customFont.widthOfTextAtSize(watermarkText, textSize);
        const textHeight = textSize; // Approximate height
        
        // 45 degrees in radians
        const angle = 45;
        const angleRad = (angle * Math.PI) / 180;

        // Math for perfect centering after rotation
        const x = (width / 2) - (textWidth / 2) * Math.cos(angleRad) + (textHeight / 2) * Math.sin(angleRad);
        const y = (height / 2) - (textWidth / 2) * Math.sin(angleRad) - (textHeight / 2) * Math.cos(angleRad);
        
        page.drawText(watermarkText, {
          x: x,
          y: y,
          size: textSize,
          font: customFont,
          color: hexToPdfRgb(watermarkColor), 
          opacity: 0.3, 
          rotate: degrees(angle), 
        });
      });

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Watermarked_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error adding watermark:", error);
      alert("Failed to add watermark. The file might be corrupted or heavily encrypted.");
    }
    setIsWatermarking(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Add watermark to PDFs online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Add Watermark to PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Stamp a text over your PDF in seconds. Secure your documents easily.
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {!file ? (
            <div className="text-center w-full">
              <input 
                type="file" 
                id="file-upload" 
                accept=".pdf" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <UploadCloud size={28} />
                Select PDF file
              </label>
              <p className="mt-4 text-gray-400 text-sm">or drop PDF here</p>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              <div className="w-full md:w-1/2 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[350px]">
                <button 
                  onClick={removeFile}
                  className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition"
                >
                  <X size={20} />
                </button>
                <div className="relative">
                  <FileText size={80} className="text-gray-300 mb-4" />
                  <span 
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-45 font-bold opacity-30 text-xl tracking-widest pointer-events-none"
                    style={{ color: watermarkColor }}
                  >
                    TEXT
                  </span>
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-2">
                  {file.name}
                </p>
              </div>

              <div className="w-full md:w-1/2 flex flex-col h-full justify-between min-h-[350px]">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b pb-2">Watermark Settings</h3>
                  
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Type your text</label>
                      <div className="relative">
                        <Type className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="e.g. CONFIDENTIAL or DRAFT"
                          className="w-full border border-gray-300 rounded-md py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#E5322D] font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Choose Color</label>
                      <div className="flex items-center gap-3">
                        {['#E5322D', '#000000', '#2563EB', '#16A34A', '#9333EA'].map((color) => (
                          <button
                            key={color}
                            onClick={() => setWatermarkColor(color)}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${
                              watermarkColor === color ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                        <div className="ml-2 pl-3 border-l border-gray-300 relative flex items-center">
                          <input 
                            type="color" 
                            value={watermarkColor}
                            onChange={(e) => setWatermarkColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                            title="Choose custom color"
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg mt-2">
                      The text size will adjust automatically to fit your document perfectly.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                   <button 
                     onClick={applyWatermark}
                     disabled={isWatermarking || !watermarkText.trim()}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isWatermarking ? (
                       <><Settings className="animate-spin" size={24} /> Stamping...</>
                     ) : (
                       <>Add Watermark <Stamp size={24} /></>
                     )}
                   </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
