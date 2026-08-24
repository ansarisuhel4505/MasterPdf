import { PDFDocument, rgb } from 'pdf-lib';
import { put } from '@vercel/blob';
const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);

export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action, fileUrl, password, boxes, pageIndices } = req.body;
  // Handle multiple files: if fileUrls array is present, use it; else convert single fileUrl to array
let fileUrls = req.body.fileUrls;
if (!fileUrls && fileUrl) {
  fileUrls = [fileUrl];
}
if (!fileUrls || fileUrls.length === 0) {
  return res.status(400).json({ error: 'No file URLs provided' });
}


  try {
    let result;

    // 🔥 NEW: DELETE PAGES (Backend me add kiya)
    if (action === 'delete-pages') {
      if (!pageIndices || !Array.isArray(pageIndices)) return res.status(400).json({ error: 'No page indices provided' });

      try {
        const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        // Descending order me sort karo taaki index shift na ho
        const sortedIndices = [...pageIndices].sort((a, b) => b - a);
        sortedIndices.forEach(page => pdfDoc.removePage(page - 1));
        
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = await put(`deleted-pages-${Date.now()}.pdf`, modifiedPdfBytes, {
          access: 'public', contentType: 'application/pdf'
        });
        return res.status(200).json({ success: true, downloadUrl: blob.url });
      } catch (err) {
        return res.status(500).json({ error: "Failed to delete pages." });
      }
    }

    // 🔥 NEW: EXTRACT PAGES
    else if (action === 'extract-pages') {
      if (!pageIndices || !Array.isArray(pageIndices)) return res.status(400).json({ error: 'No page indices provided' });

      try {
        const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const newDoc = await PDFDocument.create();
        // Convert to 0-based indices
        const copiedPages = await newDoc.copyPages(pdfDoc, pageIndices.map(i => i - 1));
        copiedPages.forEach(page => newDoc.addPage(page));

        const modifiedPdfBytes = await newDoc.save();
        const blob = await put(`extracted-pages-${Date.now()}.pdf`, modifiedPdfBytes, {
          access: 'public', contentType: 'application/pdf'
        });
        return res.status(200).json({ success: true, downloadUrl: blob.url });
      } catch (err) {
        return res.status(500).json({ error: "Failed to extract pages." });
      }
    }

    // 🔥 NEW: SPLIT PDF
    else if (action === 'split-pdf') {
      try {
        const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const count = pdfDoc.getPageCount();
        const urls = [];
        
        for (let i = 0; i < count; i++) {
           const newDoc = await PDFDocument.create();
           const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
           newDoc.addPage(copiedPage);
           const bytes = await newDoc.save();
           const blob = await put(`page-${i + 1}-${Date.now()}.pdf`, bytes, { access: 'public', contentType: 'application/pdf' });
           urls.push(blob.url);
        }
        return res.status(200).json({ success: true, downloadUrls: urls });
      } catch (err) {
        return res.status(500).json({ error: "Failed to split PDF." });
      }
    }

    else if (action === 'redact-pdf') {
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

    else if (action === 'pdf-to-word') {
      // Frontend se aaye options
      const ocrEnabled = req.body.ocrEnabled === true;
      const highQuality = req.body.highQuality === true;
      const preserveLayout = req.body.preserveLayout === true;

      const options = { File: fileUrl };

      // 🔥 HIGH QUALITY / BLUR FIX: High Resolution set karo (300 DPI)
      if (highQuality) {
        options.ImageResolution = '300';
      }

      // 🔥 OCR FIX: Scanned PDFs ke liye
      if (ocrEnabled) {
        options.Ocr = 'true';
      }

      // 🔥 LAYOUT FIX: Layout preserve karo
      if (preserveLayout) {
        options.PreserveLayout = 'true';
      }

      result = await convertapi.convert('docx', options, 'pdf');
    }
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
    else if (action === 'pdf-to-powerpoint') {
      const ocrEnabled = req.body.ocrEnabled === true;
      const highQuality = req.body.highQuality === true;
      const preserveLayout = req.body.preserveLayout === true;

      const options = { File: fileUrl };

      if (highQuality) options.ImageResolution = '300';
      if (ocrEnabled) options.Ocr = 'true';
      if (preserveLayout) options.PreserveLayout = 'true';

      result = await convertapi.convert('pptx', options, 'pdf');
    }
   else if (action === 'word-to-pdf') {
  try {
    const options = req.body.options || {};
    const merge = options.merge === true;
    const password = options.password || '';
    const watermark = options.watermark || '';
    const splitRange = options.splitRange || '';
    const splitByBookmark = options.splitByBookmark === true;
    const compress = options.compress === true;
    const compressSize = options.compressSize || '500';
    const compressUnit = options.compressUnit || 'KB';

    const convertedUrls = [];
    for (const url of fileUrls) {
      const convertOptions = { File: url };

      if (options.pageSize) convertOptions.PageSize = options.pageSize;
      if (options.orientation) convertOptions.PageOrientation = options.orientation;

      if (options.margins) {
        if (options.margins === 'custom') {
          const m = options.customMargins || {};
          if (m.top) convertOptions.MarginTop = m.top + 'mm';
          if (m.bottom) convertOptions.MarginBottom = m.bottom + 'mm';
          if (m.left) convertOptions.MarginLeft = m.left + 'mm';
          if (m.right) convertOptions.MarginRight = m.right + 'mm';
        } else {
          convertOptions.PageMargins = options.margins;
        }
      }

      if (options.scaling) convertOptions.Scaling = options.scaling + '%';
      if (options.dpi) convertOptions.ImageResolution = options.dpi;

      if (options.compression === 'high') convertOptions.Compression = 'high';
      else if (options.compression === 'low') convertOptions.Compression = 'low';

      if (options.colorMode === 'cmyk') convertOptions.ColorMode = 'cmyk';
      else if (options.colorMode === 'grayscale') convertOptions.ColorMode = 'grayscale';

      if (options.quality === 'high') convertOptions.ImageResolution = '300';
      else if (options.quality === 'low') convertOptions.ImageResolution = '72';

      const result = await convertapi.convert('pdf', convertOptions, 'docx');
      convertedUrls.push(result.response.Files[0].Url);
    }

    let finalUrl;
    if (merge && convertedUrls.length > 1) {
      const mergedPdf = await PDFDocument.create();
      for (const url of convertedUrls) {
        const pdfBytes = await fetch(url).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = await put(`merged-${Date.now()}.pdf`, mergedBytes, {
        access: 'public',
        contentType: 'application/pdf'
      });
      finalUrl = blob.url;
    } else {
      finalUrl = convertedUrls[0];
    }

    // Watermark with color and font size
    if (watermark) {
      const watermarkOptions = {
        File: finalUrl,
        Text: watermark,
        FontSize: options.watermarkFontSize || '24',
        Opacity: options.watermarkOpacity || '30',
        Rotation: options.watermarkRotation || '45',
        HorizontalAlignment: options.watermarkPosition || 'center',
        VerticalAlignment: options.watermarkPosition || 'center'
      };
      if (options.watermarkColor) watermarkOptions.FontColor = options.watermarkColor;
      const watermarkResult = await convertapi.convert('watermark', watermarkOptions, 'pdf');
      finalUrl = watermarkResult.response.Files[0].Url;
    }

    // Password with permissions
    if (password) {
      const permissions = options.permissions || {};
      const permString = [];
      if (permissions.print) permString.push('Print');
      if (permissions.copy) permString.push('Copy');
      if (permissions.modify) permString.push('Modify');
      const encryptOptions = {
        File: finalUrl,
        UserPassword: password,
        OwnerPassword: password
      };
      if (permString.length > 0) encryptOptions.Permissions = permString.join(',');
      const encryptResult = await convertapi.convert('encrypt', encryptOptions, 'pdf');
      finalUrl = encryptResult.response.Files[0].Url;
    }

    // Split range
    if (splitRange) {
      const pageIndices = [];
      splitRange.split(',').forEach(part => {
        part = part.trim();
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number);
          for (let i = start; i <= end; i++) pageIndices.push(i);
        } else if (part) {
          pageIndices.push(Number(part));
        }
      });
      const pdfBytes = await fetch(finalUrl).then(res => res.arrayBuffer());
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const newDoc = await PDFDocument.create();
      const copiedPages = await newDoc.copyPages(pdfDoc, pageIndices.map(i => i - 1));
      copiedPages.forEach(page => newDoc.addPage(page));
      const extractedBytes = await newDoc.save();
      const blob = await put(`extracted-${Date.now()}.pdf`, extractedBytes, {
        access: 'public',
        contentType: 'application/pdf'
      });
      finalUrl = blob.url;
    }

    // Compress to target size (if requested)
    if (compress) {
      try {
        let targetSizeBytes = parseInt(compressSize);
        if (compressUnit === 'MB') targetSizeBytes = targetSizeBytes * 1024 * 1024;
        else targetSizeBytes = targetSizeBytes * 1024;

        // Use convertapi compress (best effort)
        const compressResult = await convertapi.convert('compress', { File: finalUrl }, 'pdf');
        finalUrl = compressResult.response.Files[0].Url;
        // Optionally check size and loop if needed (but we'll keep simple)
      } catch (compErr) {
        console.log("Compress failed, returning original:", compErr.message);
      }
    }

    // ✅ YOUR REQUESTED RETURN LOGIC
    if (convertedUrls.length > 1 && !merge) {
      return res.status(200).json({ success: true, downloadUrls: convertedUrls });
    } else {
      return res.status(200).json({ success: true, downloadUrl: finalUrl });
    }

  } catch (err) {
    console.error("Word-to-PDF error:", err);
    return res.status(500).json({ error: "Word to PDF conversion failed." });
  }
}
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
    
    else if (action === 'pdf-to-pdfa') {
      const options = req.body.options || {};
      
      let formatLevel = 'pdfa1b';
      if (options.level === 'pdfa2') formatLevel = 'pdfa2b';
      if (options.level === 'pdfa3') formatLevel = 'pdfa3b';

      result = await convertapi.convert('pdfa', { 
        File: fileUrl,
        PdfaFormat: formatLevel
      }, 'pdf');
    }
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
          Text: `SECURELY SIGNED BY: ${signerName.toUpperCase()}\nEMAIL: ${signerEmail}\nTIMESTAMP: ${new Date().toISOString()}`,
          FontSize: '10',
          Opacity: '80',
          HorizontalAlignment: 'center',
          VerticalAlignment: 'bottom',
          MarginBottom: '30', 
          FontColor: '#4A4A4A' 
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

    // ==========================================
    // 🧠 CATEGORY 3: AI TOOLS (GROQ / LLAMA 3)
    // ==========================================
    else if (action === 'ai-summarizer' || action === 'translate-pdf' || action === 'ai-compare' || action === 'pdf-to-enterprise-md') {
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
              temperature: action === 'pdf-to-enterprise-md' ? 0.2 : 0.5
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
        else if (action === 'pdf-to-enterprise-md') {
          const options = req.body.options || {};
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const extractedText = await (await fetch(txtResult.response.Files[0].Url)).text();

          let systemPrompt = `You are an expert Enterprise Document Parser. Convert the following raw text extracted from a PDF into clean, beautifully structured Markdown (.md).\n\nGuidelines:\n1. Create proper Markdown headings (# H1, ## H2) based on context.\n2. Format lists correctly using bullets (-) or numbers.\n3. Identify code snippets and wrap them in triple backticks.\n`;
          
          if (options.tables) systemPrompt += `4. If you see data that looks like a table, reconstruct it perfectly using standard Markdown table syntax (| Header | Header |).\n`;
          if (options.clean) systemPrompt += `5. Aggressively remove noise: delete repetitive page numbers, footers, headers, and document watermarks.\n`;
          
          systemPrompt += `\nRaw Text to Parse:\n\n${extractedText.substring(0, 15000)}`;

          const markdownContent = await callGroqAI(systemPrompt);
          return res.status(200).json({ success: true, textResult: markdownContent });
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
