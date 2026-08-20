import { PDFDocument, rgb } from 'pdf-lib';
import { put } from '@vercel/blob';
const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, fileUrl, password, boxes } = req.body;

  if (!fileUrl) {
    return res.status(400).json({ error: 'No file URL provided' });
  }

  try {
    let result;

    if (action === 'redact-pdf') {
      try {
        const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        if (boxes && boxes.length > 0) {
          boxes.forEach((box) => {
            const page = pages[box.pageIndex || 0]; 
            const { width: actualWidth, height: actualHeight } = page.getSize();
            const scale = actualWidth / 700; 

            const scaledX = box.x * scale;
            const scaledY = box.y * scale;
            const scaledWidth = box.width * scale;
            const scaledHeight = box.height * scale;
            
            page.drawRectangle({
              x: scaledX,
              y: actualHeight - scaledY - scaledHeight, 
              width: scaledWidth,
              height: scaledHeight,
              color: rgb(0, 0, 0),
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

    else if (action === 'pdf-to-word') result = await convertapi.convert('docx', { File: fileUrl }, 'pdf');
    else if (action === 'pdf-to-excel') {
      try {
        result = await convertapi.convert('xlsx', { File: fileUrl }, 'pdf');
      } catch (excelError) {
        if (excelError.message && excelError.message.includes('tables')) {
          return res.status(400).json({ 
            error: "No Tables Found! Excel conversion ke liye PDF mein Data Tables hona zaroori hai." 
          });
        }
        throw excelError;
      }
    }
    else if (action === 'pdf-to-powerpoint') result = await convertapi.convert('pptx', { File: fileUrl }, 'pdf');
    else if (action === 'word-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'docx');
    else if (action === 'excel-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'xlsx');
    else if (action === 'powerpoint-to-pdf') result = await convertapi.convert('pdf', { File: fileUrl }, 'pptx');
    else if (action === 'pdf-to-jpg') result = await convertapi.convert('jpg', { File: fileUrl }, 'pdf');
    
    else if (action === 'jpg-to-pdf') {
      const ext = fileUrl.split('.').pop().split('?')[0].toLowerCase();
      let fromFormat = 'jpg'; 
      if (['png', 'webp', 'gif', 'bmp', 'tiff', 'tif'].includes(ext)) {
        fromFormat = ext;
      } else if (ext === 'jpeg') {
        fromFormat = 'jpg';
      }
      result = await convertapi.convert('pdf', { File: fileUrl }, fromFormat);
    }
    
    else if (action === 'pdf-to-pdfa') result = await convertapi.convert('pdfa', { File: fileUrl }, 'pdf');
    else if (action === 'compress-pdf') result = await convertapi.convert('compress', { File: fileUrl }, 'pdf');
    
    else if (action === 'repair-pdf') {
      try {
        result = await convertapi.convert('repair', { File: fileUrl }, 'pdf');
        return res.status(200).json({ success: true, downloadUrl: result.response.Files[0].Url, recoveryLevel: 'Tier 1 (Full Structural Recovery)' });
      } 
      catch (tier1Error) {
        console.log("Tier 1 Failed:", tier1Error.message);
        try {
          const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
          const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
          const rescuedBytes = await pdfDoc.save();
          
          const blob = await put(`rescued-tier2-${Date.now()}.pdf`, rescuedBytes, { access: 'public', contentType: 'application/pdf' });
          return res.status(200).json({ success: true, downloadUrl: blob.url, recoveryLevel: 'Tier 2 (Forced Rebuild Recovery)' });
        } 
        catch (tier2Error) {
          console.log("Tier 2 Failed:", tier2Error.message);
          try {
            const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
            return res.status(200).json({ success: true, downloadUrl: txtResult.response.Files[0].Url, recoveryLevel: 'Tier 3 (Raw Text Scavenge - Partial Data)' });
          } 
          catch (tier3Error) {
            console.log("Tier 3 Failed:", tier3Error.message);
            return res.status(500).json({ error: "File is mathematically destroyed beyond recovery." });
          }
        }
      }
    }
    else if (action === 'pdf-to-markdown') result = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
    
    else if (action === 'ocr-pdf') {
      const format = req.body.format || 'txt'; 
      result = await convertapi.convert(format, { File: fileUrl }, 'pdf');
    }
    
    else if (action === 'html-to-pdf') {
      if (fileUrl.startsWith('http')) {
        result = await convertapi.convert('pdf', { Url: fileUrl }, 'web');
      } else {
        const tempBlob = await put(`source-code-${Date.now()}.txt`, fileUrl, {
          access: 'public',
          contentType: 'text/plain'
        });
        result = await convertapi.convert('pdf', { File: tempBlob.url }, 'txt');
      }
    }

    else if (action === 'protect-pdf') {
      result = await convertapi.convert('encrypt', { File: fileUrl, UserPassword: password, OwnerPassword: password }, 'pdf');
    }
    else if (action === 'unlock-pdf') {
      result = await convertapi.convert('decrypt', { File: fileUrl, Password: password }, 'pdf');
    }

    else if (action === 'sign-pdf') {
      const { signerName, signerEmail, lockDocument } = req.body;
      try {
        let stampResult = await convertapi.convert('watermark', {
          File: fileUrl,
          Text: `SECURELY SIGNED BY: ${signerName.toUpperCase()} | EMAIL: ${signerEmail}\nTIMESTAMP: ${new Date().toISOString()} | MASTERPDF ENTERPRISE SEAL`,
          FontSize: '9',
          Opacity: '75',
          HorizontalAlignment: 'left',
          VerticalAlignment: 'bottom',
          FontColor: '#000000' 
        }, 'pdf');

        let finalUrl = stampResult.response.Files[0].Url;

        if (lockDocument) {
          const lockResult = await convertapi.convert('encrypt', {
            File: finalUrl,
            OwnerPassword: 'MasterPdfSecureLock2026', 
            Permissions: 'Print' 
          }, 'pdf');
          finalUrl = lockResult.response.Files[0].Url;
        }

        return res.status(200).json({ success: true, downloadUrl: finalUrl });
      } catch (signError) {
        console.error("Sign PDF Error:", signError);
        return res.status(500).json({ error: "Failed to apply cryptographic seal and lock." });
      }
    }

    else if (action === 'ai-summarizer' || action === 'translate-pdf' || action === 'ai-compare') {
      if (!process.env.GROQ_API_KEY) return res.status(200).json({ success: false, textResult: "⚠️ Groq API Key is missing." });

      try {
        const apiKey = process.env.GROQ_API_KEY;

        const callGroqAI = async (promptText) => {
          const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
          const activeModel = process.env.CURRENT_GROQ_MODEL || "openai/gpt-oss-20b";

          const aiResponse = await fetch(groqUrl, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: activeModel,
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
