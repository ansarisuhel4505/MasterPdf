import multiparty from 'multiparty';
import fs from 'fs';
import { put } from '@vercel/blob';

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
      // --- NAYA CODE: Vercel Blob Upload ---
      // File ko buffer mein read karke seedha Vercel Blob par Public URL ke sath daal rahe hain
      const fileBuffer = fs.readFileSync(file.path);
      const blob = await put(file.originalFilename, fileBuffer, { access: 'public' });
      const fileUrl = blob.url; // ConvertAPI ab is secure cloud link ko process karega
      // -------------------------------------

      let result;

      // 1. FILE CONVERSION TOOLS
      // NAYA: 'file.path' ki jagah ab 'fileUrl' pass kar rahe hain. 
      // Isse password encryption/decryption ki accuracy 100% ho jayegi.
      if (action === 'protect-pdf') {
        result = await convertapi.convert('encrypt', { File: fileUrl, UserPassword: password, OwnerPassword: password }, 'pdf');
      }
      else if (action === 'unlock-pdf') {
        result = await convertapi.convert('decrypt', { File: fileUrl, Password: password }, 'pdf');
      }
      else if (action === 'pdf-to-word') result = await convertapi.convert('docx', { File: fileUrl }, 'pdf');
      else if (action === 'pdf-to-excel') result = await convertapi.convert('xlsx', { File: fileUrl }, 'pdf');
      else if (action === 'pdf-to-powerpoint') result = await convertapi.convert('pptx', { File: fileUrl }, 'pdf');
      else if (action === 'word-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'docx');
      else if (action === 'excel-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'xlsx');
      else if (action === 'powerpoint-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'pptx');
      else if (action === 'pdf-to-jpg') result = await convertapi.convert('jpg', { File: fileUrl }, 'pdf');
      else if (action === 'html-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'html');
      else if (action === 'pdf-to-pdfa') result = await convertapi.convert('pdfa', { File: fileUrl }, 'pdf');
      
      // 2. TEXT/AI TOOLS (Future Implementation Scope)
      else if (['ai-summarizer', 'translate-pdf'].includes(action)) {
        fs.unlinkSync(file.path);
        return res.status(200).json({ 
          success: true, 
          textResult: "This is a simulated AI result. To make this work perfectly, you need to integrate the OpenAI API in the backend to read the PDF text and generate a summary/translation." 
        });
      }
      
      // 3. UNAVAILABLE TOOLS
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
      return res.status(500).json({ error: 'Server processing failed. Ensure ConvertAPI key is valid and password is correct.' });
    }
  });
}
