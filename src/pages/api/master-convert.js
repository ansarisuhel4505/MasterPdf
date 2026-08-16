const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);
const { GoogleGenerativeAI } = require('@google/generative-ai');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    // 🧠 CATEGORY 3: AI TOOLS (Official Google SDK)
    // ==========================================
    else if (action === 'ai-summarizer' || action === 'translate-pdf' || action === 'ai-compare') {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API Key is missing in Vercel settings." });
      }

      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

      // 1. AI SUMMARIZER
      if (action === 'ai-summarizer') {
        const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
        const textResponse = await fetch(txtResult.response.Files[0].Url);
        const extractedText = await textResponse.text();

        const prompt = `Summarize the following document concisely in bullet points:\n\n${extractedText.substring(0, 15000)}`;
        const aiResult = await model.generateContent(prompt);
        const response = await aiResult.response;

        return res.status(200).json({ success: true, textResult: response.text() });
      }

      // 2. TRANSLATE PDF
      else if (action === 'translate-pdf') {
        const targetLang = req.body.targetLanguage || 'English';
        const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
        const textResponse = await fetch(txtResult.response.Files[0].Url);
        const extractedText = await textResponse.text();

        const prompt = `Translate the following document into ${targetLang}:\n\n${extractedText.substring(0, 15000)}`;
        const aiResult = await model.generateContent(prompt);
        const response = await aiResult.response;

        return res.status(200).json({ success: true, textResult: response.text() });
      }

      // 3. SMART AI COMPARE
      else if (action === 'ai-compare') {
        const { fileUrl2 } = req.body;
        if (!fileUrl2) return res.status(400).json({ error: 'Second file URL is missing for comparison' });

        const txtResult1 = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
        const text1 = await (await fetch(txtResult1.response.Files[0].Url)).text();

        const txtResult2 = await convertapi.convert('txt', { File: fileUrl2 }, 'pdf');
        const text2 = await (await fetch(txtResult2.response.Files[0].Url)).text();

        const prompt = `Compare these two documents and list what changed, what was added, and what was removed in bullet points:\n\n--- DOC 1 ---\n${text1.substring(0, 7000)}\n\n--- DOC 2 ---\n${text2.substring(0, 7000)}`;
        const aiResult = await model.generateContent(prompt);
        const response = await aiResult.response;

        return res.status(200).json({ success: true, textResult: response.text() });
      }
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
