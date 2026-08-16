// Sahi syntax ConvertAPI ko initialize karne ka
const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Frontend se ab sirf fileUrl aur action aayega (4.5MB limit bypass)
  const { action, fileUrl, password } = req.body;

  if (!fileUrl && action !== 'html-to-pdf') {
    return res.status(400).json({ error: 'No file URL provided' });
  }

  try {
    let result;

    // ==========================================
    // 🟢 CATEGORY 1: 100% WORKING CONVERSIONS
    // ==========================================
    if (action === 'pdf-to-word') result = await convertapi.convert('docx', { File: fileUrl }, 'pdf');
    else if (action === 'pdf-to-excel') result = await convertapi.convert('xlsx', { File: fileUrl }, 'pdf');
    else if (action === 'pdf-to-powerpoint') result = await convertapi.convert('pptx', { File: fileUrl }, 'pdf');
    else if (action === 'word-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'docx');
    else if (action === 'excel-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'xlsx');
    else if (action === 'powerpoint-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'pptx');
    else if (action === 'pdf-to-jpg') result = await convertapi.convert('jpg', { File: fileUrl }, 'pdf');
    else if (action === 'jpg-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'jpg');
    else if (action === 'pdf-to-pdfa') result = await convertapi.convert('pdfa', { File: fileUrl }, 'pdf');
    else if (action === 'compress-pdf') result = await convertapi.convert('compress', { File: fileUrl }, 'pdf');
    else if (action === 'repair-pdf') result = await convertapi.convert('repair', { File: fileUrl }, 'pdf');

    // ==========================================
    // 🟡 CATEGORY 2: SECURITY TOOLS (Working)
    // ==========================================
    else if (action === 'protect-pdf') {
      result = await convertapi.convert('encrypt', { File: fileUrl, UserPassword: password, OwnerPassword: password }, 'pdf');
    }
    else if (action === 'unlock-pdf') {
      result = await convertapi.convert('decrypt', { File: fileUrl, Password: password }, 'pdf');
    }

    // ==========================================
    // 🔴 CATEGORY 3: UNAVAILABLE / REQUIRES CUSTOM UI
    // ==========================================
    // Ye features ConvertAPI ke basic system se direct convert nahi hote. 
    // Inke liye React par custom UI banana padega (jaise Edit PDF par text likhna).
    else if (['merge-pdf', 'split-pdf', 'edit-pdf', 'sign-pdf', 'watermark', 'rotate-pdf', 'organize-pdf', 'page-numbers', 'scan-to-pdf', 'ocr-pdf', 'compare-pdf', 'redact-pdf', 'crop-pdf', 'pdf-forms', 'html-to-pdf', 'pdf-to-markdown'].includes(action)) {
      return res.status(501).json({ error: `The ${action.toUpperCase()} tool requires a custom frontend UI or advanced engine setup which is currently pending.` });
    }
    // AI tools require OpenAI API key
    else if (['ai-summarizer', 'translate-pdf'].includes(action)) {
      return res.status(501).json({ error: "This feature requires OpenAI API integration which is pending." });
    }
    else {
      return res.status(400).json({ error: "Unknown action request." });
    }

    // Response send karna (File ka naya download URL bhejna)
    if (result && result.response && result.response.Files) {
      const convertedFileUrl = result.response.Files[0].Url;
      return res.status(200).json({ success: true, downloadUrl: convertedFileUrl });
    } else {
      throw new Error("Conversion failed internally.");
    }

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: 'Server processing failed. File might be corrupted or format mismatch.' });
  }
}
