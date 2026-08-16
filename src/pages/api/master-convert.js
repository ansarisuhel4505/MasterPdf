// Sahi syntax ConvertAPI ko initialize karne ka
const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Frontend se ab sirf fileUrl aur action aayega
  const { action, fileUrl, password } = req.body;

  if (!fileUrl) {
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
    else if (action === 'html-to-pdf') result = await convertapi.convert('pdf', { Url: fileUrl }, 'web');
    else if (action === 'pdf-to-markdown') result = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
    else if (action === 'ocr-pdf') result = await convertapi.convert('txt', { File: fileUrl }, 'pdf');

    // ==========================================
    // 🟡 CATEGORY 2: SECURITY TOOLS
    // ==========================================
    else if (action === 'protect-pdf') {
      result = await convertapi.convert('encrypt', { File: fileUrl, UserPassword: password, OwnerPassword: password }, 'pdf');
    }
    else if (action === 'unlock-pdf') {
      result = await convertapi.convert('decrypt', { File: fileUrl, Password: password }, 'pdf');
    }

    // ==========================================
    // 🧠 CATEGORY 3: AI TOOLS (Gemini API Integration)
    // ==========================================
    else if (action === 'ai-summarizer') {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API Key is missing in Vercel settings." });
      }
      const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
      const textFileUrl = txtResult.response.Files[0].Url;
      const textResponse = await fetch(textFileUrl);
      const extractedText = await textResponse.text();

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const aiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Please summarize the following document content concisely in bullet points. Highlight the main ideas:\n\n${extractedText.substring(0, 15000)}` }] }]
        })
      });
      const aiData = await aiResponse.json();
      if (aiData.error) throw new Error(aiData.error.message);
      
      return res.status(200).json({ success: true, textResult: aiData.candidates[0].content.parts[0].text });
    }
    
    else if (action === 'translate-pdf') {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API Key is missing in Vercel settings." });
      }
      const targetLang = req.body.targetLanguage || 'English';
      const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
      const textFileUrl = txtResult.response.Files[0].Url;
      const textResponse = await fetch(textFileUrl);
      const extractedText = await textResponse.text();

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const aiResponse = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Translate the following document content into ${targetLang}. Ensure the professional tone and meaning remain intact:\n\n${extractedText.substring(0, 15000)}` }] }]
        })
      });
      const aiData = await aiResponse.json();
      if (aiData.error) throw new Error(aiData.error.message);
      
      return res.status(200).json({ success: true, textResult: aiData.candidates[0].content.parts[0].text });
    }

    // ==========================================
    // 🔴 CATEGORY 4: UNKNOWN ACTIONS
    // ==========================================
    else {
      return res.status(400).json({ error: "Unknown action request." });
    }

    // Normal files response send karna (Download URL bhejna)
    if (result && result.response && result.response.Files) {
      const convertedFileUrl = result.response.Files[0].Url;
      return res.status(200).json({ success: true, downloadUrl: convertedFileUrl });
    }

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: 'Server processing failed. File might be corrupted or format mismatch.' });
  }
}
