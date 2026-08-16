import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { Camera, Image as ImageIcon, X, ArrowRight, Settings, Plus } from 'lucide-react';

export default function ScanToPdf() {
  const [images, setImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    const validImages = files.filter(file => file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/jpg');

    if (validImages.length === 0) return;

    // Create preview URLs for the UI
    const newImages = validImages.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Client-Side logic to stitch images into a single PDF
  const generatePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.create();

      for (const imgObj of images) {
        const imgBuffer = await imgObj.file.arrayBuffer();
        let pdfImage;

        // Check format and embed
        if (imgObj.file.type === 'image/jpeg' || imgObj.file.type === 'image/jpg') {
          pdfImage = await pdfDoc.embedJpg(imgBuffer);
        } else if (imgObj.file.type === 'image/png') {
          pdfImage = await pdfDoc.embedPng(imgBuffer);
        } else {
          continue; // Skip if somehow another format slips through
        }

        // Add a page matching the image dimensions
        const page = pdfDoc.addPage([pdfImage.width, pdfImage.height]);
        
        // Draw the image to fill the page
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: pdfImage.width,
          height: pdfImage.height,
        });
      }

      const pdfBytes = await pdfDoc.save();

      // Trigger auto-download
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Scanned_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to create PDF. Please ensure images are valid JPG or PNG.");
    }
    
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Scan to PDF online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Scan to PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Capture document scans from your mobile device or upload images to create a PDF instantly.
          </p>
        </div>

        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {images.length === 0 ? (
            <div className="text-center w-full flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Mobile Camera Access Button */}
              <input 
                type="file" 
                id="camera-upload" 
                accept="image/jpeg, image/png" 
                capture="environment" // Opens rear camera on mobile
                multiple
                onChange={handleImageAdd} 
                className="hidden" 
              />
              <label htmlFor="camera-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-10 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <Camera size={28} /> Open Camera
              </label>

              <span className="text-gray-400 font-medium">OR</span>

              {/* Normal File Upload Button */}
              <input 
                type="file" 
                id="gallery-upload" 
                accept="image/jpeg, image/png" 
                multiple
                onChange={handleImageAdd} 
                className="hidden" 
              />
              <label htmlFor="gallery-upload" className="cursor-pointer bg-gray-800 hover:bg-gray-900 text-white text-xl font-bold py-6 px-10 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <ImageIcon size={28} /> Upload Images
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              
              <div className="flex-grow w-full overflow-y-auto mb-6 bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  
                  {images.map((img, index) => (
                    <div key={index} className="relative group bg-white border border-gray-200 rounded-lg p-2 shadow-sm h-48 flex items-center justify-center">
                      <button 
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition z-10"
                      >
                        <X size={16} />
                      </button>
                      <img src={img.previewUrl} alt={`Scan ${index + 1}`} className="max-h-full max-w-full object-contain rounded-md" />
                      <div className="absolute bottom-1 left-1 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {index + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add More Button */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#E5322D] transition h-48 group relative">
                    <input type="file" accept="image/jpeg, image/png" multiple onChange={handleImageAdd} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                    <Plus size={40} className="text-gray-400 group-hover:text-[#E5322D] mb-2 transition" />
                    <span className="text-sm font-bold text-gray-500 group-hover:text-[#E5322D] transition">Add Scans</span>
                  </div>

                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-auto flex justify-between items-center w-full border-t border-gray-100 pt-6">
                 <p className="text-gray-500 font-medium">{images.length} scan(s) ready</p>
                 <button 
                   onClick={generatePdf}
                   disabled={isProcessing}
                   className="flex items-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                 >
                   {isProcessing ? (
                     <><Settings className="animate-spin" size={24} /> Processing...</>
                   ) : (
                     <>Create PDF <ArrowRight size={24} /></>
                   )}
                 </button>
              </div>

            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
