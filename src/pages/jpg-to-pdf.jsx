import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, Image as ImageIcon, X, ArrowRight, Settings } from 'lucide-react';

export default function JpgToPdf() {
  const [files, setFiles] = useState([]);
  const [isConverting, setIsConverting] = useState(false);

  // Sirf images (JPG/PNG) accept karna
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const imageFiles = selectedFiles.filter(file => 
      file.type === 'image/jpeg' || file.type === 'image/png'
    );
    
    if (imageFiles.length !== selectedFiles.length) {
      alert("Only JPG and PNG images are supported.");
    }
    
    // Nayi images ko purani list mein add karna aur unka preview URL banana
    const newFilesWithPreview = imageFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    
    setFiles([...files, ...newFilesWithPreview]);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  // Client-Side Image to PDF Logic
  const convertToPdf = async () => {
    if (files.length === 0) return;

    setIsConverting(true);
    try {
      const pdfDoc = await PDFDocument.create();

      for (let item of files) {
        const arrayBuffer = await item.file.arrayBuffer();
        let imageToEmbed;

        // Check if JPG or PNG and embed accordingly
        if (item.file.type === 'image/jpeg') {
          imageToEmbed = await pdfDoc.embedJpg(arrayBuffer);
        } else if (item.file.type === 'image/png') {
          imageToEmbed = await pdfDoc.embedPng(arrayBuffer);
        }

        if (imageToEmbed) {
          // Page ka size exactly image ke dimensions jaisa set karna
          const page = pdfDoc.addPage([imageToEmbed.width, imageToEmbed.height]);
          page.drawImage(imageToEmbed, {
            x: 0,
            y: 0,
            width: imageToEmbed.width,
            height: imageToEmbed.height,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();

      // Download trigger karna
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = files.length > 1 ? 'MasterPdf_Images.pdf' : `MasterPdf_${files[0].file.name.split('.')[0]}.pdf`;
      link.click();
      
    } catch (error) {
      console.error("Error converting images to PDF:", error);
      alert("Failed to create PDF. Some images might be unsupported or corrupted.");
    }
    setIsConverting(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Convert JPG to PDF online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        {/* Tool Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">JPG to PDF</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert JPG images to PDF in seconds. Easily combine multiple images into a single document.
          </p>
        </div>

        {/* Workspace Area */}
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {files.length === 0 ? (
            // Upload State
            <div className="text-center w-full">
              <input 
                type="file" 
                id="file-upload" 
                multiple 
                accept="image/jpeg, image/png" 
                onChange={handleFileChange} 
                className="hidden" 
              />
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer bg-[#FFB822] hover:bg-[#F2A900] text-gray-900 text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                <UploadCloud size={28} />
                Select JPG images
              </label>
              <p className="mt-4 text-gray-400 text-sm">or drop images here</p>
            </div>
          ) : (
            // Files Selected State
            <div className="w-full h-full flex flex-col">
              
              {/* Images Grid */}
              <div className="flex-grow w-full overflow-y-auto mb-6 bg-gray-50 p-6 rounded-xl border border-gray-100">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {files.map((item, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-2 flex flex-col items-center justify-center relative group shadow-sm h-40">
                      <button 
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition z-10"
                      >
                        <X size={16} />
                      </button>
                      
                      {/* Image Preview */}
                      <div className="w-full h-24 overflow-hidden rounded flex items-center justify-center bg-gray-100 mb-2">
                        <img src={item.preview} alt={`preview ${index}`} className="max-w-full max-h-full object-contain" />
                      </div>
                      
                      <p className="text-xs text-center text-gray-700 font-medium truncate w-full px-1" title={item.file.name}>
                        {item.file.name}
                      </p>
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-white hover:border-[#FFB822] transition h-40">
                     <input type="file" id="add-more" multiple accept="image/jpeg, image/png" onChange={handleFileChange} className="hidden" />
                     <label htmlFor="add-more" className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-[#FFB822]">
                        <span className="text-3xl mb-1">+</span>
                        <span className="text-xs font-semibold">Add more</span>
                     </label>
                  </div>
                </div>
              </div>

              {/* Conversion Settings & Button */}
              <div className="mt-auto flex flex-col md:flex-row justify-between items-center border-t border-gray-100 pt-6 gap-4">
                 <div className="text-sm text-gray-500 flex items-center gap-2">
                   <ImageIcon size={18} />
                   <span>{files.length} image(s) selected</span>
                 </div>

                 <button 
                   onClick={convertToPdf}
                   disabled={isConverting}
                   className="w-full md:w-auto flex items-center justify-center gap-2 px-10 py-4 rounded-xl text-gray-900 font-bold text-lg transition shadow-md bg-[#FFB822] hover:bg-[#F2A900] hover:shadow-lg disabled:bg-gray-300 disabled:text-gray-500"
                 >
                   {isConverting ? (
                     <><Settings className="animate-spin" size={24} /> Converting...</>
                   ) : (
                     <>Convert to PDF <ArrowRight size={24} /></>
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