import multiparty from 'multiparty';
import fs from 'fs';

// Sahi syntax ConvertAPI ko initialize karne ka
const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new multiparty.Form();

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Form parsing failed' });
    if (!files.file) return res.status(400).json({ error: 'No file uploaded' });

    const file = files.file[0];
    const action = fields.action[0]; 
    const password = fields.password ? fields.password[0] : null;

    try {
      let result;

      // 1. FILE CONVERSION TOOLS (Returns a File URL)
      if (action === 'protect-pdf') {
        // 'Pdf' word hata diya gaya hai parameter keys se
        result = await convertapi.convert('encrypt', { File: file.path, UserPassword: password, OwnerPassword: password }, 'pdf');
      }
      // NAYA CODE: Unlock PDF (Decrypt) logic add kiya hai
      else if (action === 'unlock-pdf') {
        result = await convertapi.convert('decrypt', { File: file.path, Password: password }, 'pdf');
      }
      else if (action === 'pdf-to-word') result = await convertapi.convert('docx', { File: file.path }, 'pdf');
      else if (action === 'pdf-to-excel') result = await convertapi.convert('xlsx', { File: file.path }, 'pdf');
      else if (action === 'pdf-to-powerpoint') result = await convertapi.convert('pptx', { File: file.path }, 'pdf');
      else if (action === 'word-to-pdf') result = await convertapi.convert('pdf', { File: file.path }, 'docx');
      else if (action === 'excel-to-pdf') result = await convertapi.convert('pdf', { File: file.path }, 'xlsx');
      else if (action === 'powerpoint-to-pdf') result = await convertapi.convert('pdf', { File: file.path }, 'pptx');
      else if (action === 'pdf-to-jpg') result = await convertapi.convert('jpg', { File: file.path }, 'pdf');
      else if (action === 'html-to-pdf') result = await convertapi.convert('pdf', { File: file.path }, 'html');
      else if (action === 'pdf-to-pdfa') result = await convertapi.convert('pdfa', { File: file.path }, 'pdf');
      
      // 2. TEXT/AI TOOLS (Future Implementation Scope)
      else if (['ai-summarizer', 'translate-pdf'].includes(action)) {
        fs.unlinkSync(file.path);
        // Yahan OpenAI API integration lagega. Abhi ke liye hum mock text bhej rahe hain taaki crash na ho.
        return res.status(200).json({ 
          success: true, 
          textResult: "This is a simulated AI result. To make this work perfectly, you need to integrate the OpenAI API in the backend to read the PDF text and generate a summary/translation." 
        });
      }
      
      // 3. UNAVAILABLE TOOLS (Needs specialized engines beyond ConvertAPI)
      else if (['ocr-pdf', 'repair-pdf', 'compare-pdf', 'redact-pdf', 'crop-pdf', 'pdf-forms', 'pdf-to-markdown'].includes(action)) {
        fs.unlinkSync(file.path);
        return res.status(501).json({ error: `The ${action.replace(/-/g, ' ').toUpperCase()} tool requires a specialized engine (like Ghostscript or specific OCR APIs) which is not covered by the current ConvertAPI setup.` });
      }

      // If it's a standard file conversion, send the URL
      if (result && result.response && result.response.Files) {
        const convertedFileUrl = result.response.Files[0].Url;
        fs.unlinkSync(file.path);
        return res.status(200).json({ success: true, downloadUrl: convertedFileUrl });
      }

    } catch (error) {
      console.error("Backend Error:", error);
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      return res.status(500).json({ error: 'Server processing failed. Ensure ConvertAPI key is valid.' });
    }
  });
}
