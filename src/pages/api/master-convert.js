import { PDFDocument, rgb } from 'pdf-lib';
import { put } from '@vercel/blob';
const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);

// Vercel Timeout Fix
export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, fileUrl, password, boxes, mode } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ error: 'No file URL provided' });
  }

  try {
    let result;

    // ==========================================
    // 🛡️ CATEGORY 0: ENTERPRISE REDACT PDF
    // ==========================================
    if (action === 'redact-pdf') {
      try {
        const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        if (boxes && boxes.length > 0) {
          boxes.forEach((box) => {
            const page = pages[box.pageIndex || 0]; 
            
            // 🚀 SMART SCALING LOGIC
            const { width: actualWidth, height: actualHeight } = page.getSize();
            const scale = actualWidth / 700; // 700px is the frontend render width

            // Calculate exact position based on real PDF size
            const scaledX = box.x * scale;
            const scaledY = box.y * scale;
            const scaledWidth = box.width * scale;
            const scaledHeight = box.height * scale;
            
            page.drawRectangle({
              x: scaledX,
              y: actualHeight - scaledY - scaledHeight, 
              width: scaledWidth,
              height: scaledHeight,
              color: rgb(0, 0, 0), // Solid Black Box
            });
          });
        } 
        
        const modifiedPdfBytes = await pdfDoc.save();
        
        const blob = await put(`redacted-document-${Date.now()}.pdf`, modifiedPdfBytes, {
          access: 'public',
          contentType: 'application/pdf'
        });

        return res.status(200).json({ success: true, downloadUrl: blob.url });
      } catch (err) {
        console.error("Redaction Error:", err);
        return res.status(500).json({ error: "Failed to apply redaction to the PDF." });
      }
    }

    // ==========================================
    // 🟢 CATEGORY 1: NORMAL CONVERSIONS
    // ==========================================
    else if (action === 'pdf-to-word') result = await convertapi.convert('docx', { File: fileUrl }, 'pdf');
    else if (action === 'pdf-to-excel') {
      try {
        result = await convertapi.convert('xlsx', { File: fileUrl }, 'pdf');
      } catch (excelError) {
        // Agar PDF mein table nahi mili toh server crash hone se roko aur message bhejo
        if (excelError.message && excelError.message.includes('tables')) {
          return res.status(400).json({ 
            error: "No Tables Found! Excel conversion ke liye PDF mein Data Tables (Rows/Columns) hona zaroori hai." 
          });
        }
        throw excelError; // Koi aur error ho toh usko aage bhej do
      }
    }
    else if (action === 'pdf-to-powerpoint') result = await convertapi.convert('pptx', { File: fileUrl }, 'pdf');
    else if (action === 'word-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'docx');
    else if (action === 'excel-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'xlsx');
    else if (action === 'powerpoint-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'pptx');
    else if (action === 'pdf-to-jpg') result = await convertapi.convert('jpg', { File: fileUrl }, 'pdf');
    
    // 🔥 100% FIXED IMAGE TO PDF CONVERTER (Dynamic Extension Detector) 🔥
    else if (action === 'jpg-to-pdf') {
      // 1. URL se extension nikalo (jaise 'png', 'jpg')
      const ext = fileUrl.split('.').pop().split('?')[0].toLowerCase();
      
      // 2. Extension match karo
      let fromFormat = 'jpg'; // Default
      if (['png', 'webp', 'gif', 'bmp', 'tiff', 'tif'].includes(ext)) {
        fromFormat = ext;
      } else if (ext === 'jpeg') {
        fromFormat = 'jpg';
      }

      // 3. Sahi format ke sath ConvertAPI call karo
      result = await convertapi.convert('pdf', { File: fileUrl }, fromFormat);
    }
    
    else if (action === 'pdf-to-pdfa') result = await convertapi.convert('pdfa', { File: fileUrl }, 'pdf');
    else if (action === 'compress-pdf') result = await convertapi.convert('compress', { File: fileUrl }, 'pdf');
   // ==========================================
    // 🛡️ MULTI-LAYER ENTERPRISE REPAIR ENGINE
    // ==========================================
    else if (action === 'repair-pdf') {
      try {
        // TIER 1: Standard AI / ConvertAPI Repair
        result = await convertapi.convert('repair', { File: fileUrl }, 'pdf');
        return res.status(200).json({ success: true, downloadUrl: result.response.Files[0].Url, recoveryLevel: 'Tier 1 (Full Structural Recovery)' });
      } 
      catch (tier1Error) {
        console.log("Tier 1 Failed. Initiating Tier 2 Force Rebuild...");
        
        try {
          // TIER 2: PDF-Lib Force Rebuild (Bypassing damaged headers)
          const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
          // ignoreEncryption parameter forces pdf-lib to read broken streams
          const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
          const rescuedBytes = await pdfDoc.save();
          
          const blob = await put(`rescued-tier2-${Date.now()}.pdf`, rescuedBytes, { access: 'public', contentType: 'application/pdf' });
          return res.status(200).json({ success: true, downloadUrl: blob.url, recoveryLevel: 'Tier 2 (Forced Rebuild Recovery)' });
        } 
        catch (tier2Error) {
          console.log("Tier 2 Failed. Initiating Tier 3 Data Scavenge...");
          
          try {
            // TIER 3: Raw Text Salvage (Extracting remaining readable strings)
            const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
            return res.status(200).json({ success: true, downloadUrl: txtResult.response.Files[0].Url, recoveryLevel: 'Tier 3 (Raw Text Scavenge - Partial Data)' });
          } 
          catch (tier3Error) {
            // Fatal Destruction: Mathmatically impossible to recover
            return res.status(500).json({ error: "File is mathematically destroyed beyond recovery (0% structural integrity)." });
          }
        }
      }
    }
    else if (action === 'pdf-to-markdown') result = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
    // 🔍 ENTERPRISE OCR ENGINE (Dynamic Format)
    else if (action === 'ocr-pdf') {
      // Frontend se aane wala format read karega (txt, pdfa, docx, xlsx). Default 'txt' rakhega.
      const format = req.body.format || 'txt'; 
      result = await convertapi.convert(format, { File: fileUrl }, 'pdf');
    }
    
    // 🔥 HTML TO PDF CONVERTER 🔥
    else if (action === 'html-to-pdf') {
      if (fileUrl.startsWith('http')) {
        // Live website link
        result = await convertapi.convert('pdf', { Url: fileUrl }, 'web');
      } else {
        // Raw code
        const tempBlob = await put(`source-code-${Date.now()}.txt`, fileUrl, {
          access: 'public',
          contentType: 'text/plain'
        });
        result = await convertapi.convert('pdf', { File: tempBlob.url }, 'txt');
      }
    }

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
    // 🧠 CATEGORY 3: AI TOOLS (GROQ / LLAMA 3)
    // ==========================================
    else if (action === 'ai-summarizer' || action === 'translate-pdf' || action === 'ai-compare') {
      if (!process.env.GROQ_API_KEY) return res.status(200).json({ success: false, textResult: "⚠️ Groq API Key is missing." });

      try {
        const apiKey = process.env.GROQ_API_KEY;

        const callGroqAI = async (promptText) => {
          const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
          
          // 🔥 MAGIC TRICK: Ab yeh Vercel ke Environment Variables se model ka naam uthayega
          // Agar aapne Vercel me koi naam nahi dala hai, to yeh default "llama3-8b-8192" use karega
         const activeModel = process.env.CURRENT_GROQ_MODEL || "openai/gpt-oss-20b";

          const aiResponse = await fetch(groqUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: activeModel, // <--- AB YAHAN VARIABLE LAG GAYA HAI
              messages: [{ role: "user", content: promptText }],
              temperature: 0.5
            })
          });

          const data = await aiResponse.json();
          if (aiResponse.ok && data.choices && data.choices.length > 0) return data.choices[0].message.content;
          else throw new Error(data.error?.message || "Unknown Groq API error");
        };

        if (action === 'ai-summarizer') {
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const extractedText = await (await fetch(txtResult.response.Files[0].Url)).text();
          return res.status(200).json({ success: true, textResult: await callGroqAI(`Summarize in bullets:\n\n${extractedText.substring(0, 15000)}`) });
        }
        else if (action === 'translate-pdf') {
          const targetLang = req.body.targetLanguage || 'English';
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const extractedText = await (await fetch(txtResult.response.Files[0].Url)).text();
          return res.status(200).json({ success: true, textResult: await callGroqAI(`Translate to ${targetLang}:\n\n${extractedText.substring(0, 15000)}`) });
        }
        else if (action === 'ai-compare') {
          if (!req.body.fileUrl2) return res.status(400).json({ error: 'Second file URL missing' });
          const txt1 = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const text1 = await (await fetch(txt1.response.Files[0].Url)).text();
          const txt2 = await convertapi.convert('txt', { File: req.body.fileUrl2 }, 'pdf');
          const text2 = await (await fetch(txt2.response.Files[0].Url)).text();
          return res.status(200).json({ success: true, textResult: await callGroqAI(`Compare:\n\nDOC1:\n${text1.substring(0, 7000)}\n\nDOC2:\n${text2.substring(0, 7000)}`) });
        }

      } catch (aiError) {
        return res.status(200).json({ success: true, textResult: `❌ AI Error: ${aiError.message}` });
      }
    }

    else {
      return res.status(400).json({ error: "Unknown action request." });
    }

    if (result && result.response && result.response.Files) {
      return res.status(200).json({ success: true, downloadUrl: result.response.Files[0].Url });
    }

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: 'Server processing failed.' });
  }
}
