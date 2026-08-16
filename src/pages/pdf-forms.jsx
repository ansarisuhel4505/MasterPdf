import React, { useState } from 'react';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { PDFDocument } from 'pdf-lib';
import { UploadCloud, FileText, X, CheckSquare, ArrowRight, Settings } from 'lucide-react';

export default function PdfForms() {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      extractFormFields(selectedFile);
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const extractFormFields = async (uploadedFile) => {
    try {
      const arrayBuffer = await uploadedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      const extractedFields = fields.map(f => {
        let type = 'unknown';
        if (f.constructor.name === 'PDFTextField') type = 'text';
        else if (f.constructor.name === 'PDFCheckBox') type = 'checkbox';
        else if (f.constructor.name === 'PDFDropdown') type = 'dropdown';
        else if (f.constructor.name === 'PDFRadioGroup') type = 'radio';
        
        return { name: f.getName(), type };
      });

      // Filter out unknown fields and set state
      const validFields = extractedFields.filter(f => f.type !== 'unknown');
      setFormFields(validFields);
      
      // Initialize form data state
      const initialData = {};
      validFields.forEach(f => {
        initialData[f.name] = f.type === 'checkbox' ? false : '';
      });
      setFormData(initialData);

    } catch (error) {
      console.error("Error reading PDF form:", error);
      alert("Could not detect any form fields in this PDF. Please ensure it is a fillable PDF form.");
      setFile(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFormFields([]);
    setFormData({});
  };

  const handleInputChange = (name, value, type) => {
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? !prev[name] : value
    }));
  };

  // Client-Side PDF Form Filling Logic
  const fillPdfForm = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const form = pdfDoc.getForm();

      // Apply the user's data to the PDF form
      formFields.forEach(field => {
        if (field.type === 'text') {
          const f = form.getTextField(field.name);
          if (f && formData[field.name]) f.setText(formData[field.name]);
        } 
        else if (field.type === 'checkbox') {
          const f = form.getCheckBox(field.name);
          if (f) {
            if (formData[field.name]) f.check();
            else f.uncheck();
          }
        }
      });

      const pdfBytes = await pdfDoc.save();

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `MasterPdf_Filled_${file.name}`;
      link.click();
      
    } catch (error) {
      console.error("Error filling PDF:", error);
      alert("Failed to save the PDF form.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F5F5F7]">
      <Head>
        <title>Fill PDF Forms online - MasterPdf</title>
      </Head>
      <Navbar />

      <main className="flex-grow flex flex-col items-center justify-center p-6 mt-16">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold mb-4">
            <CheckSquare size={14} /> Smart Detection
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Fill PDF Forms</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload an interactive PDF form, type your answers on the web, and download the filled document.
          </p>
        </div>

        <div className="w-full max-w-6xl bg-white rounded-2xl shadow-sm border border-gray-200 p-8 min-h-[450px] flex flex-col items-center justify-center relative">
          
          {!file ? (
            <div className="text-center w-full">
              <input type="file" id="file-upload" accept=".pdf" onChange={handleFileChange} className="hidden" />
              <label htmlFor="file-upload" className="cursor-pointer bg-[#E5322D] hover:bg-red-700 text-white text-xl font-bold py-6 px-12 rounded-xl inline-flex items-center gap-3 transition shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <UploadCloud size={28} /> Upload Fillable PDF
              </label>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-8 items-start pt-4">
              
              {/* Left Side: File Preview */}
              <div className="w-full md:w-1/3 flex flex-col items-center justify-center bg-gray-50 border border-gray-200 rounded-lg p-8 relative h-[500px]">
                <button onClick={removeFile} className="absolute top-4 right-4 bg-white border border-gray-200 text-gray-500 hover:text-red-500 rounded-full p-2 shadow-sm transition">
                  <X size={20} />
                </button>
                <div className="relative">
                  <FileText size={80} className="text-[#E5322D] mb-4 opacity-90" />
                  <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-600 p-2 rounded-full shadow-sm">
                    <CheckSquare size={16} />
                  </div>
                </div>
                <p className="text-sm text-gray-800 font-bold text-center break-words w-full px-4 mt-6">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500 mt-2 font-semibold bg-white px-3 py-1 border rounded-full">
                  {formFields.length} Form Fields Detected
                </p>
              </div>

              {/* Right Side: Form Inputs */}
              <div className="w-full md:w-2/3 flex flex-col h-[500px] justify-between">
                <div className="flex-grow overflow-y-auto pr-4 mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 sticky top-0 bg-white z-10">Fill Your Details</h3>
                  
                  {formFields.length === 0 ? (
                    <div className="text-center p-8 bg-orange-50 text-orange-600 rounded-lg border border-orange-200">
                      <p className="font-bold">No interactive form fields found.</p>
                      <p className="text-sm mt-1">This PDF doesn't have fillable boxes. Try using the "Edit PDF" tool to manually add text instead.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {formFields.map((field, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <label className="block text-sm font-bold text-gray-700 mb-2 truncate">
                            {field.name}
                          </label>
                          
                          {field.type === 'text' && (
                            <input 
                              type="text" 
                              value={formData[field.name] || ''}
                              onChange={(e) => handleInputChange(field.name, e.target.value, 'text')}
                              className="w-full border border-gray-300 rounded-md p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E5322D]" 
                              placeholder={`Enter ${field.name}`}
                            />
                          )}

                          {field.type === 'checkbox' && (
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData[field.name] || false}
                                onChange={() => handleInputChange(field.name, null, 'checkbox')}
                                className="w-5 h-5 text-[#E5322D] rounded focus:ring-[#E5322D] border-gray-300"
                              />
                              <span className="text-sm font-medium text-gray-600">Check/Uncheck</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100">
                   <button 
                     onClick={fillPdfForm}
                     disabled={isProcessing || formFields.length === 0}
                     className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-white font-bold text-lg transition shadow-md bg-[#E5322D] hover:bg-red-700 hover:shadow-lg disabled:bg-gray-400"
                   >
                     {isProcessing ? (
                       <><Settings className="animate-spin" size={24} /> Generating PDF...</>
                     ) : (
                       <>Download Filled PDF <ArrowRight size={24} /></>
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
