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
    // 🛡️ CATEGORY 0: NEW REDACT PDF FEATURE
    // ==========================================
    if (action === 'redact-pdf') {
      try {
        const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        if (mode === 'manual' && boxes && boxes.length > 0) {
          boxes.forEach((box) => {
            const page = pages[box.pageIndex || 0]; 
            const { height: pageHeight } = page.getSize();
            
            page.drawRectangle({
              x: box.x,
              y: pageHeight - box.y - box.height, 
              width: box.width,
              height: box.height,
              color: rgb(0, 0, 0), // Solid Black Box
            });
          });
        } 
        else if (mode === 'auto') {
          return res.status(200).json({ 
            success: false, 
            error: "Auto-Redact requires an external OCR API. Please use Manual Mode for now." 
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
    // 🟢 CATEGORY 1: 100% WORKING CONVERSIONS
    // ==========================================
    else if (action === 'pdf-to-word') result = await convertapi.convert('docx', { File: fileUrl }, 'pdf');
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
    else if (action === 'pdf-to-markdown') result = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
    else if (action === 'ocr-pdf') result = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
    
    // 🔥 FIX: SMART HTML TO PDF HANDLER 🔥
    else if (action === 'html-to-pdf') {
      if (fileUrl.startsWith('http')) {
        // Agar proper link aaya hai toh web to pdf use karo
        result = await convertapi.convert('pdf', { Url: fileUrl }, 'web');
      } else {
        // Agar raw HTML aaya hai, toh pehle usko Vercel par temporary host karo
        const tempBlob = await put(`temp-html-${Date.now()}.html`, fileUrl, {
          access: 'public',
          contentType: 'text/html'
        });
        // Ab us temporary link ko HTML file man kar PDF me badal do
        result = await convertapi.convert('pdf', { File: tempBlob.url }, 'html');
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
      if (!process.env.GROQ_API_KEY) {
        return res.status(200).json({ success: false, textResult: "⚠️ Groq API Key is missing in Vercel settings." });
      }

      try {
        const apiKey = process.env.GROQ_API_KEY;

        const callGroqAI = async (promptText) => {
          const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
          const aiResponse = await fetch(groqUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [{ role: "user", content: promptText }],
              temperature: 0.5
            })
          });

          const data = await aiResponse.json();

          if (aiResponse.ok && data.choices && data.choices.length > 0) {
            return data.choices[0].message.content; // SUCCESS!
          } else {
            throw new Error(data.error?.message || "Unknown Groq API error");
          }
        };

        if (action === 'ai-summarizer') {
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const extractedText = await (await fetch(txtResult.response.Files[0].Url)).text();
          const resultText = await callGroqAI(`Summarize this clearly in bullet points:\n\n${extractedText.substring(0, 15000)}`);
          return res.status(200).json({ success: true, textResult: resultText });
        }
        else if (action === 'translate-pdf') {
          const targetLang = req.body.targetLanguage || 'English';
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const extractedText = await (await fetch(txtResult.response.Files[0].Url)).text();
          const resultText = await callGroqAI(`Translate into ${targetLang}:\n\n${extractedText.substring(0, 15000)}`);
          return res.status(200).json({ success: true, textResult: resultText });
        }
        else if (action === 'ai-compare') {
          const { fileUrl2 } = req.body;
          if (!fileUrl2) return res.status(400).json({ error: 'Second file URL missing' });

          const txtResult1 = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const text1 = await (await fetch(txtResult1.response.Files[0].Url)).text();
          const txtResult2 = await convertapi.convert('txt', { File: fileUrl2 }, 'pdf');
          const text2 = await (await fetch(txtResult2.response.Files[0].Url)).text();

          const resultText = await callGroqAI(`Compare these documents and list differences:\n\n--- DOC 1 ---\n${text1.substring(0, 7000)}\n\n--- DOC 2 ---\n${text2.substring(0, 7000)}`);
          return res.status(200).json({ success: true, textResult: resultText });
        }

      } catch (aiError) {
        console.error("Groq AI Error:", aiError.message);
        return res.status(200).json({ 
          success: true, 
          textResult: `❌ AI Error: ${aiError.message}\nPlease check your API limit or key.` 
        });
      }
    }

    // ==========================================
    // 🔴 CATEGORY 4: UNKNOWN ACTIONS
    // ==========================================
    else {
      return res.status(400).json({ error: "Unknown action request." });
    }

    if (result && result.response && result.response.Files) {
      return res.status(200).json({ success: true, downloadUrl: result.response.Files[0].Url });
    }

  } catch (error) {
    console.error("Backend Error:", error);
    return res.status(500).json({ error: 'Server processing failed. File might be corrupted.' });
  }
}
