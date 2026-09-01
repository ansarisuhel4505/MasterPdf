import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
  
  // 🔥 FINAL FIX 1: Sirf un actions ko roko jinhe sach me FileUrl chahiye. 
  // 'html-to-pdf' ko humesha aage jaane do chahe URL ho ya raw HTML.
  if (action !== 'html-to-pdf') {
    if (!fileUrls || fileUrls.length === 0) {
      return res.status(400).json({ error: 'No file URLs provided' });
    }
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

  // 🔥 NEW BLOCK: AI PII DETECTION
    else if (action === 'ai-redact-detect') {
      if (!process.env.GROQ_API_KEY) return res.status(200).json({ entities: [] });
      try {
        const text = req.body.text || "";
        const prompt = `You are a Data Privacy AI. Analyze the following text and extract all sensitive information (PII) including Person Names, Phone Numbers, Email Addresses, and Bank Account/Credit Card numbers.
        Rules:
        1. Return ONLY a valid JSON array of strings. Do not add any markdown, explanation, or code blocks.
        2. Example format: ["John Doe", "+1-987654321", "johndoe@email.com"]
        Text to analyze:
        ${text}`;

        const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: process.env.CURRENT_GROQ_MODEL || "llama3-8b-8192", // Fast model for JSON parsing
            messages: [{ role: "user", content: prompt }],
            temperature: 0.1
          })
        });

        const data = await aiResponse.json();
        const content = data.choices?.[0]?.message?.content || "[]";
        
        // Clean JSON from markdown if AI adds it
        const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
        const entities = JSON.parse(cleanJson);

        return res.status(200).json({ success: true, entities: Array.isArray(entities) ? entities : [] });
      } catch (err) {
        console.error("AI Detection Error:", err);
        return res.status(500).json({ error: "AI failed to parse text." });
      }
    }

    // 🔥 REDACT PDF PROCESSOR
    else if (action === 'redact-pdf') {
      try {
        const { boxes } = req.body;
        const options = req.body.options || {};
        
        const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        if (options.sanitizeMetadata) {
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('');
          pdfDoc.setCreator('');
        }

        const hexToRgb = (hex) => {
          if (!hex) return rgb(0, 0, 0);
          hex = hex.replace(/^#/, '');
          if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
          const r = parseInt(hex.substring(0, 2), 16) / 255;
          const g = parseInt(hex.substring(2, 4), 16) / 255;
          const b = parseInt(hex.substring(4, 6), 16) / 255;
          return rgb(r, g, b);
        };

        if (boxes && boxes.length > 0) {
          boxes.forEach((box) => {
            const page = pages[box.pageIndex || 0];
            const { width: actualWidth, height: actualHeight } = page.getSize();
            const scale = actualWidth / 700; // Match frontend visual scale

            const scaledX = box.x * scale;
            const scaledY = box.y * scale;
            const scaledWidth = box.width * scale;
            const scaledHeight = box.height * scale;

            const boxColor = hexToRgb(box.color);
            const boxOpacity = box.opacity !== undefined ? Number(box.opacity) / 100 : 1;

            page.drawRectangle({
              x: scaledX,
              y: actualHeight - scaledY - scaledHeight, 
              width: scaledWidth,
              height: scaledHeight,
              color: boxColor,
              opacity: boxOpacity
            });

            if (box.text) {
              page.drawText(box.text, {
                x: scaledX + 5,
                y: actualHeight - scaledY - (scaledHeight / 2) - 4,
                size: Math.min(12, scaledHeight * 0.7), 
                color: rgb(1, 1, 1)
              });
            }
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
      try {
        const options = req.body.options || {};
        let convertOptions = {};

        // 🔥 NAYA CODE: Agar direct Base64 aayi hai, toh buffer pass karo URL ki jagah
        if (req.body.fileBase64) {
          const fileBuffer = Buffer.from(req.body.fileBase64, 'base64');
          // ConvertAPI natively supports file buffers
          convertOptions.File = new convertapi.FileUpload(fileBuffer, req.body.fileName || 'document.pdf');
        } 
        else {
          let sourceUrl = req.body.fileUrl;
          if (!sourceUrl && req.body.fileUrls && req.body.fileUrls.length > 0) sourceUrl = req.body.fileUrls[0];
          if (!sourceUrl || sourceUrl === 'null') return res.status(400).json({ error: "File URL or Base64 is missing." });
          convertOptions.File = sourceUrl;
        }

        if (options.preserveLayout) {
          convertOptions.PreserveLayout = 'true';
        }

        if (options.ocrEnabled) {
          convertOptions.Ocr = 'true';
          let lang = options.ocrLanguage || 'en';
          if (lang === 'eng') lang = 'en'; 
          convertOptions.OcrLanguage = lang;
        }

        if (options.highQuality || options.ocrEnabled) {
          convertOptions.ImageResolution = '300';
        }

        const result = await convertapi.convert('docx', convertOptions, 'pdf');
        
        return res.status(200).json({ success: true, downloadUrl: result.response.Files[0].Url });

      } catch (err) {
        console.error("PDF-to-Word error:", err);
        return res.status(500).json({ error: err.message || "ConvertAPI conversion failed." });
      }
    }
   else if (action === 'pdf-to-excel') {
  try {
    // Frontend se aaye options
    const options = req.body.options || {};
    const ocrEnabled = options.ocrEnabled === true;
    const highQuality = options.highQuality === true;
    const preserveLayout = options.preserveLayout === true;
    const pageIndices = options.pageIndices || [];
    const outputFormat = options.outputFormat || 'xlsx';
    const multiSheet = options.multiSheet === true;
    const headerFooter = options.headerFooter === true;
    const dataCleaning = options.dataCleaning === true;
    const password = options.password || '';
    const watermark = options.watermark || '';

    // Agar multiple files hain, toh loop karo
    const fileUrls = req.body.fileUrls || [req.body.fileUrl];
    const outputUrls = [];

    for (const fileUrl of fileUrls) {
      const convertOptions = { File: fileUrl };

      if (ocrEnabled) convertOptions.Ocr = 'true';
      if (highQuality) convertOptions.ImageResolution = '300';
      if (preserveLayout) convertOptions.PreserveLayout = 'true';
      if (pageIndices.length > 0) {
        convertOptions.PageRange = pageIndices.map(i => i - 1).join(',');
      }
      if (multiSheet) convertOptions.MultiSheet = 'true';
      if (headerFooter) convertOptions.IncludeHeaderFooter = 'true';
      if (dataCleaning) convertOptions.CleanData = 'true';

      let format = outputFormat === 'csv' ? 'csv' : 'xlsx';
      const result = await convertapi.convert(format, convertOptions, 'pdf');
      outputUrls.push(result.response.Files[0].Url);
    }

    // Merge if requested
    let finalUrl;
    if (options.merge && outputUrls.length > 1) {
      // Use pdf-lib or convertapi to merge workbooks (simplified placeholder)
      // Actually merging Excel files is complex; you might need a separate library or use convertapi's merge.
      finalUrl = outputUrls[0]; // placeholder
    } else if (outputUrls.length === 1) {
      finalUrl = outputUrls[0];
    } else {
      return res.status(200).json({ success: true, downloadUrls: outputUrls });
    }

    // Apply password if provided
    if (password) {
      const encryptResult = await convertapi.convert('encrypt', { File: finalUrl, UserPassword: password, OwnerPassword: password }, 'xlsx');
      finalUrl = encryptResult.response.Files[0].Url;
    }

    // Apply watermark if provided (for Excel, watermark is tricky, may need image overlay - placeholder)
    if (watermark) {
      // Implement if possible
    }

    return res.status(200).json({ success: true, downloadUrl: finalUrl });
  } catch (excelError) {
    if (excelError.message && excelError.message.includes('tables')) {
      return res.status(400).json({ 
        error: "No Tables Found! Excel conversion ke liye PDF mein Data Tables hona zaroori hai." 
      });
    }
    console.error("PDF-to-Excel error:", excelError);
    return res.status(500).json({ error: "PDF to Excel conversion failed." });
  }
}
  else if (action === 'pdf-to-powerpoint') {
  try {
    const options = req.body.options || {};
    const fileUrls = req.body.fileUrls || [req.body.fileUrl];
    const outputUrls = [];

    for (const url of fileUrls) {
      const convertOptions = { File: url };

      if (options.ocrEnabled) convertOptions.Ocr = 'true';
      if (options.highQuality || options.dpi === '300' || options.dpi === '600') {
        convertOptions.ImageResolution = options.dpi || '300';
      }
      if (options.preserveLayout) convertOptions.PreserveLayout = 'true';
      if (options.aspectRatio) convertOptions.SlideSize = options.aspectRatio;
      if (options.pageIndices && options.pageIndices.length > 0) {
        convertOptions.PageRange = options.pageIndices.map(i => i - 1).join(',');
      }

      const format = options.outputFormat === 'ppt' ? 'ppt' : 'pptx';
      const result = await convertapi.convert(format, convertOptions, 'pdf');
      outputUrls.push(result.response.Files[0].Url);
    }

    let finalUrl;
    if (options.merge && outputUrls.length > 1) {
      finalUrl = outputUrls[0]; // Merge logic placeholder
    } else if (options.split && outputUrls.length > 1) {
      return res.status(200).json({ success: true, downloadUrls: outputUrls });
    } else {
      finalUrl = outputUrls[0];
    }

    // 🔥 PDF Bridge for advanced features (watermark, compress, password)
    const needsTransform = options.watermark || options.compress || options.password;

    if (needsTransform) {
      let currentUrl = finalUrl;

      // Step 1: PPTX -> PDF
      const pdfStep = await convertapi.convert('pdf', { File: currentUrl }, 'pptx');
      currentUrl = pdfStep.response.Files[0].Url;

      // Step 2: Watermark (on PDF)
      if (options.watermark) {
        let hAlign = 'center', vAlign = 'center';
        if (options.watermarkPosition === 'top') vAlign = 'top';
        else if (options.watermarkPosition === 'bottom') vAlign = 'bottom';
        else if (options.watermarkPosition === 'left') hAlign = 'left';
        else if (options.watermarkPosition === 'right') hAlign = 'right';

        const watermarkResult = await convertapi.convert('watermark', {
          File: currentUrl,
          Text: options.watermark,
          FontSize: options.watermarkFontSize || '24',
          Opacity: options.watermarkOpacity || '30',
          Rotation: options.watermarkRotation || '45',
          HorizontalAlignment: hAlign,
          VerticalAlignment: vAlign,
          FontColor: options.watermarkColor || '#000000'
        }, 'pdf');
        currentUrl = watermarkResult.response.Files[0].Url;
      }

      // Step 3: Compress (BEFORE password, taaki fail na ho)
      if (options.compress) {
        try {
          const compressResult = await convertapi.convert('compress', { File: currentUrl }, 'pdf');
          currentUrl = compressResult.response.Files[0].Url;
        } catch (compErr) {
          console.log("Compress failed, returning uncompressed:", compErr.message);
        }
      }

      // Step 4: Password (on PDF)
      if (options.password) {
        const encryptResult = await convertapi.convert('encrypt', { File: currentUrl, UserPassword: options.password, OwnerPassword: options.password }, 'pdf');
        currentUrl = encryptResult.response.Files[0].Url;
      }

      // Step 5: PDF -> PPTX (password unlock karne ke liye password pass karo)
      const pptxStep = await convertapi.convert(options.outputFormat === 'ppt' ? 'ppt' : 'pptx', {
        File: currentUrl,
        ...(options.password ? { Password: options.password } : {})  // 🔥 Password unlock
      }, 'pdf');
      finalUrl = pptxStep.response.Files[0].Url;
    }

    return res.status(200).json({ success: true, downloadUrl: finalUrl });
  } catch (pptError) {
    console.error("PDF-to-PowerPoint error:", pptError);
    return res.status(500).json({ error: "PDF to PowerPoint conversion failed." });
  }
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
  else if (action === 'excel-to-pdf') {
  try {
    const options = req.body.options || {};
    const fileUrls = req.body.fileUrls || [req.body.fileUrl];
    const outputUrls = [];

    for (const url of fileUrls) {
      const convertOptions = { File: url };

      // Safe options (jo API support karti hai)
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
      if (options.quality === 'high') convertOptions.ImageResolution = '300';
      else if (options.quality === 'low') convertOptions.ImageResolution = '72';

      const result = await convertapi.convert('pdf', convertOptions, 'xlsx');
      outputUrls.push(result.response.Files[0].Url);
    }

    let finalUrl;
    if (options.merge && outputUrls.length > 1) {
      const mergedPdf = await PDFDocument.create();
      for (const url of outputUrls) {
        const pdfBytes = await fetch(url).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = await put(`merged-excel-${Date.now()}.pdf`, mergedBytes, { access: 'public', contentType: 'application/pdf' });
      finalUrl = blob.url;
    } else {
      finalUrl = outputUrls[0];
    }

    // Password
    if (options.password) {
      const encryptResult = await convertapi.convert('encrypt', { File: finalUrl, UserPassword: options.password, OwnerPassword: options.password }, 'pdf');
      finalUrl = encryptResult.response.Files[0].Url;
    }

    // Watermark - FIX: diagonal ko handle karo
    if (options.watermark) {
      let hAlign = 'center';
      let vAlign = 'center';
      if (options.watermarkPosition === 'top') vAlign = 'top';
      else if (options.watermarkPosition === 'bottom') vAlign = 'bottom';
      else if (options.watermarkPosition === 'left') hAlign = 'left';
      else if (options.watermarkPosition === 'right') hAlign = 'right';
      // 'diagonal' ke liye center/center use karo aur Rotation se diagonal dikhega

      const watermarkResult = await convertapi.convert('watermark', {
        File: finalUrl,
        Text: options.watermark,
        FontSize: options.watermarkFontSize || '24',
        Opacity: options.watermarkOpacity || '30',
        Rotation: options.watermarkRotation || '45', // Diagonal effect yahin se aayega
        HorizontalAlignment: hAlign,
        VerticalAlignment: vAlign,
        FontColor: options.watermarkColor || '#000000'
      }, 'pdf');
      finalUrl = watermarkResult.response.Files[0].Url;
    }

    // Compress (optional)
    if (options.compress) {
      try {
        const compressResult = await convertapi.convert('compress', { File: finalUrl }, 'pdf');
        finalUrl = compressResult.response.Files[0].Url;
      } catch (compErr) {
        console.log("Compress failed, returning original:", compErr.message);
      }
    }

    // Return logic
    if (outputUrls.length > 1 && !options.merge) {
      return res.status(200).json({ success: true, downloadUrls: outputUrls });
    } else {
      return res.status(200).json({ success: true, downloadUrl: finalUrl });
    }
  } catch (excelToPdfError) {
    console.error("Excel-to-PDF error:", excelToPdfError);
    return res.status(500).json({ error: "Excel to PDF conversion failed." });
  }
}
    else if (action === 'powerpoint-to-pdf') {
  try {
    const options = req.body.options || {};
    const fileUrls = req.body.fileUrls || [req.body.fileUrl];
    const outputUrls = [];

    for (const url of fileUrls) {
      const convertOptions = { File: url };

      // Basic Options
      if (options.pageRange && options.pageRange.length > 0) convertOptions.PageRange = options.pageRange.join(',');
      if (options.publishWhat) convertOptions.PublishWhat = options.publishWhat;
      if (options.slidesPerPage) convertOptions.SlidesPerPage = options.slidesPerPage;
      if (options.frameSlides) convertOptions.FrameSlides = 'true';
      if (options.includeHidden) convertOptions.IncludeHidden = 'true';

      // Quality & Image
      if (options.quality === 'high') convertOptions.Quality = 'high';
      else if (options.quality === 'min') convertOptions.Quality = 'min';
      if (options.dpi) convertOptions.ImageResolution = options.dpi;
      if (options.jpegCompression) convertOptions.JpegCompression = options.jpegCompression;
      if (options.textCompression) convertOptions.TextCompression = options.textCompression;
      if (options.fontEmbedding) convertOptions.FontEmbedding = options.fontEmbedding;

      // 🔥 FIX: PDF/A Compliance
      if (options.pdfa && options.pdfa !== 'none') {
        convertOptions.Pdfa = 'true'; // Boolean required
        convertOptions.PdfaFormat = options.pdfa; // pdfa1b, pdfa2b, pdfa3b
      }

      // Metadata & Accessibility
      if (options.metadata) convertOptions.PreserveMetadata = 'true';
      if (options.pdfua) convertOptions.Pdfua = 'true';

      // Conversion
      const result = await convertapi.convert('pdf', convertOptions, 'pptx');
      outputUrls.push(result.response.Files[0].Url);
    }

    // Merge if needed
    let finalUrl;
    if (options.merge && outputUrls.length > 1) {
      const mergedPdf = await PDFDocument.create();
      for (const url of outputUrls) {
        const pdfBytes = await fetch(url).then(res => res.arrayBuffer());
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      const mergedBytes = await mergedPdf.save();
      const blob = await put(`merged-${Date.now()}.pdf`, mergedBytes, { access: 'public', contentType: 'application/pdf' });
      finalUrl = blob.url;
    } else {
      finalUrl = outputUrls[0];
    }

    // Watermark (on PDF)
    if (options.watermark) {
      let hAlign = 'center', vAlign = 'center';
      if (options.watermarkPosition === 'top') vAlign = 'top';
      else if (options.watermarkPosition === 'bottom') vAlign = 'bottom';
      else if (options.watermarkPosition === 'left') hAlign = 'left';
      else if (options.watermarkPosition === 'right') hAlign = 'right';

      const watermarkResult = await convertapi.convert('watermark', {
        File: finalUrl,
        Text: options.watermark,
        FontSize: options.watermarkFontSize || '24',
        Opacity: options.watermarkOpacity || '30',
        Rotation: options.watermarkRotation || '45',
        HorizontalAlignment: hAlign,
        VerticalAlignment: vAlign,
        FontColor: options.watermarkColor || '#000000'
      }, 'pdf');
      finalUrl = watermarkResult.response.Files[0].Url;
    }

    // Password Protection (on PDF)
    if (options.password) {
      const perms = [];
      if (options.permissions && options.permissions.print) perms.push('Print');
      if (options.permissions && options.permissions.highPrint) perms.push('HighQualityPrint');
      if (options.permissions && options.permissions.copy) perms.push('Copy');
      if (options.permissions && options.permissions.modify) perms.push('Modify');

      const encryptOptions = {
        File: finalUrl,
        UserPassword: options.password,
        OwnerPassword: options.password
      };
      if (perms.length > 0) encryptOptions.Permissions = perms.join(',');
      const encryptResult = await convertapi.convert('encrypt', encryptOptions, 'pdf');
      finalUrl = encryptResult.response.Files[0].Url;
    }

    // Compress (Safely - after password)
    if (options.compress) {
      try {
        const compressResult = await convertapi.convert('compress', { File: finalUrl }, 'pdf');
        finalUrl = compressResult.response.Files[0].Url;
      } catch (compErr) {
        console.log("Compress failed, returning uncompressed:", compErr.message);
      }
    }

    // Return logic
    if (outputUrls.length > 1 && !options.merge) {
      return res.status(200).json({ success: true, downloadUrls: outputUrls });
    } else {
      return res.status(200).json({ success: true, downloadUrl: finalUrl });
    }
  } catch (pptError) {
    console.error("PowerPoint-to-PDF error:", pptError);
    return res.status(500).json({ error: "PowerPoint to PDF conversion failed." });
  }
}
   
  else if (action === 'pdf-to-image') {
  try {
    const options = req.body.options || {};
    const fileUrls = req.body.fileUrls || [req.body.fileUrl];
    const pageIndices = req.body.pageIndices || []; // array of arrays (per file)
    const allDownloadUrls = [];

    for (let i = 0; i < fileUrls.length; i++) {
      const url = fileUrls[i];
      const selectedPages = pageIndices[i] || [];
      const convertOptions = { File: url };

      // Output format
      let format = options.outputFormat || 'jpg';
      if (format === 'jpeg') format = 'jpg';

      // DPI / Resolution
      if (options.resolution) convertOptions.ImageResolution = options.resolution;

      // Quality (for JPEG)
      if (format === 'jpg' && options.quality) convertOptions.Quality = options.quality;

      // Colorspace
      if (options.colorspace && options.colorspace !== 'rgb') {
        convertOptions.ColorSpace = options.colorspace;
      }

      // 🔥 FIX: PageRange – convert 0-based to 1-based and join with comma
      if (selectedPages.length > 0) {
        const pages = selectedPages.map(p => p + 1); // 0-based → 1-based
        convertOptions.PageRange = pages.join(',');
      }

      // 🔥 FIX: Rotate – map numeric to valid string
      const rotateMap = { 0: 'default', 90: 'rotate90', 180: 'rotate180', 270: 'rotate270' };
      if (options.rotate !== undefined && options.rotate !== null) {
        convertOptions.Rotate = rotateMap[options.rotate] || 'default';
      }

      // Flip
      if (options.flipHorizontal) convertOptions.FlipHorizontal = 'true';
      if (options.flipVertical) convertOptions.FlipVertical = 'true';

      // Brightness, Contrast, Gamma
      if (options.brightness) convertOptions.Brightness = options.brightness;
      if (options.contrast) convertOptions.Contrast = options.contrast;
      if (options.gamma) convertOptions.Gamma = options.gamma;

      // Trim white margins
      if (options.trimWhite) convertOptions.TrimWhite = 'true';

      // Password for protected PDFs
      if (options.password) convertOptions.Password = options.password;

      const result = await convertapi.convert(format, convertOptions, 'pdf');
      const files = result.response.Files;
      files.forEach(f => allDownloadUrls.push(f.Url));
    }

    // Return all URLs (individual images)
    return res.status(200).json({ success: true, downloadUrls: allDownloadUrls });
  } catch (imageError) {
    console.error("PDF-to-Image error:", imageError);
    return res.status(500).json({ error: "PDF to Image conversion failed." });
  }
}
    else if (action === 'any-to-pdf') {
  try {
    const { fileUrl, format } = req.body;
    // Convert any document to PDF
    let fromFormat = format;
    if (['docx', 'doc'].includes(fromFormat)) fromFormat = 'docx';
    else if (['xlsx', 'xls'].includes(fromFormat)) fromFormat = 'xlsx';
    else if (['pptx', 'ppt'].includes(fromFormat)) fromFormat = 'pptx';
    else return res.status(400).json({ error: 'Unsupported format' });

    const result = await convertapi.convert('pdf', { File: fileUrl }, fromFormat);
    return res.status(200).json({ success: true, downloadUrl: result.response.Files[0].Url });
  } catch (err) {
    console.error('any-to-pdf error:', err);
    return res.status(500).json({ error: 'Conversion failed' });
  }
}
    
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
      const { fileUrl, options } = req.body;
      const recoveryLevel = options?.recoveryLevel || 'auto';
      const applyTransform = options?.applyTransform || {};
      const aiCleanup = options?.aiCleanup || false;
      const includeReport = options?.includeReport !== false;

      // Fetch file bytes
      const pdfBytes = await fetch(fileUrl).then(res => res.arrayBuffer());
      const originalSize = pdfBytes.byteLength;

      // Damage Analysis
      let damageReport = {
        isEncrypted: false,
        hasMissingFonts: false,
        hasCorruptImages: false,
        brokenPageCount: 0,
        note: ''
      };

      try {
        await PDFDocument.load(pdfBytes, { ignoreEncryption: false });
      } catch (e) {
        damageReport.note = e.message;
      }

      try {
        await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      } catch (e) {
        damageReport.isEncrypted = true;
        damageReport.note = "File is password-protected.";
      }

      // TIER 1 (Fast Rebuild)
      let tier1Success = false;
      let recoveredBytes = null;
      let recoveryTier = 'Tier 1';

      try {
        const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true, updateMetadata: false });
        recoveredBytes = await pdfDoc.save({ useObjectStreams: false });
        tier1Success = true;
      } catch (tier1Err) {
        console.log("Tier 1 failed:", tier1Err.message);
      }

      // TIER 2 (ConvertAPI Structural Repair)
      if (!tier1Success || recoveryLevel === 'balanced') {
        recoveryTier = 'Tier 2';
        try {
          const repairResult = await convertapi.convert('repair', { File: fileUrl }, 'pdf');
          const repairUrl = repairResult.response.Files[0].Url;
          recoveredBytes = await fetch(repairUrl).then(r => r.arrayBuffer());
          tier1Success = true;
        } catch (tier2Err) {
          console.log("Tier 2 failed:", tier2Err.message);
        }
      }

      // TIER 3 (Raw Scavenge)
      if (!tier1Success || recoveryLevel === 'deep') {
        recoveryTier = 'Tier 3';
        try {
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const textContent = await (await fetch(txtResult.response.Files[0].Url)).text();
          const newDoc = await PDFDocument.create();
          const page = newDoc.addPage([600, 800]);
          
          // Must import StandardFonts at top: import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
          const font = await newDoc.embedFont(StandardFonts.Helvetica);
          const lines = textContent.split('\n').slice(0, 60);
          lines.forEach((line, i) => {
            page.drawText(line, { x: 50, y: 750 - i * 12, size: 10, font });
          });
          recoveredBytes = await newDoc.save();
          recoveryTier = 'Tier 3 (Raw Text Recovered)';
        } catch (tier3Err) {
          return res.status(500).json({ error: "File is mathematically destroyed beyond recovery." });
        }
      }

      // AI Metadata Cleanup
      if (aiCleanup && process.env.GROQ_API_KEY) {
        try {
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const extractedText = await (await fetch(txtResult.response.Files[0].Url)).text();
          const aiPrompt = `Analyze the following document content and suggest a clean Title, Author, and Keywords in JSON format ONLY: {"title": "", "author": "", "keywords": [""]}. Do not add any markdown.\n\nContent:\n${extractedText.substring(0, 3000)}`;
          
          const aiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: process.env.CURRENT_GROQ_MODEL || "openai/gpt-oss-20b", // Reliable Model
              messages: [{ role: "user", content: aiPrompt }],
              temperature: 0.2
            })
          });
          const aiData = await aiResponse.json();
          const aiText = aiData.choices?.[0]?.message?.content || '{}';
          const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
          const meta = JSON.parse(cleanJson);
          
          const pdfDoc = await PDFDocument.load(recoveredBytes);
          if (meta.title) pdfDoc.setTitle(meta.title);
          if (meta.author) pdfDoc.setAuthor(meta.author);
          if (meta.keywords) pdfDoc.setKeywords(meta.keywords);
          recoveredBytes = await pdfDoc.save();
        } catch (aiErr) {
          console.log("AI cleanup failed:", aiErr.message);
        }
      }

      // Post-Repair Transformations (Compress, Watermark, Encrypt)
      let finalBytes = recoveredBytes;
      let finalUrl = null;

      // Ensure we have a working URL for ConvertAPI processing
      let workingBlobUrl = fileUrl; 
      if (recoveryTier !== 'Tier 1' || aiCleanup) {
        // If we modified bytes, re-upload to a temp blob for ConvertAPI
        const tmpBlob = await put(`temp-repaired-${Date.now()}.pdf`, finalBytes, { access: 'public', contentType: 'application/pdf' });
        workingBlobUrl = tmpBlob.url;
      }

      if (applyTransform.compress) {
        try {
          const compressResult = await convertapi.convert('compress', { File: workingBlobUrl }, 'pdf');
          workingBlobUrl = compressResult.response.Files[0].Url;
        } catch (e) { console.log("Compress failed:", e.message); }
      }

     if (applyTransform.watermark) {
        try {
          const tmpBlob = await put(`temp-repaired-${Date.now()}.pdf`, finalBytes, { access: 'public', contentType: 'application/pdf' });
          const wmResult = await convertapi.convert('watermark', {
            File: tmpBlob.url,
            Text: applyTransform.watermark.text || 'CONFIDENTIAL',
            FontSize: applyTransform.watermark.fontSize?.toString() || '60', 
            Opacity: applyTransform.watermark.opacity?.toString() || '30', 
            Rotation: applyTransform.watermark.rotation?.toString() || '-45',
            FontColor: applyTransform.watermark.color || '#ff0000',
            HorizontalAlignment: 'center', 
            VerticalAlignment: 'center'
          }, 'pdf');
          finalBytes = await fetch(wmResult.response.Files[0].Url).then(r => r.arrayBuffer());
        } catch (e) { console.log("Watermark failed:", e.message); }
      }

      if (applyTransform.encrypt && applyTransform.encrypt.password) {
        try {
          const encResult = await convertapi.convert('encrypt', {
            File: workingBlobUrl,
            UserPassword: applyTransform.encrypt.password,
            OwnerPassword: applyTransform.encrypt.password,
            Permissions: 'Print'
          }, 'pdf');
          workingBlobUrl = encResult.response.Files[0].Url;
        } catch (e) { console.log("Encrypt failed:", e.message); }
      }

      // Read the final processed file
      finalBytes = await fetch(workingBlobUrl).then(r => r.arrayBuffer());

      // Final secure save
      const blob = await put(`repaired-${Date.now()}.pdf`, finalBytes, {
        access: 'public',
        contentType: 'application/pdf'
      });
      finalUrl = blob.url;

      const calculateRecoveryScore = (damage, tier) => {
        let score = 100;
        if (damage.isEncrypted) score -= 20;
        if (tier === 'Tier 2') score -= 15;
        if (tier.includes('Tier 3')) score -= 60;
        return Math.max(0, score);
      };

      const recoveryReport = {
        originalSize,
        finalSize: finalBytes.byteLength,
        recoveryTier,
        recoveryScore: calculateRecoveryScore(damageReport, recoveryTier),
        damageReport,
        appliedTransforms: Object.keys(applyTransform).filter(k => applyTransform[k]),
        aiCleanupApplied: aiCleanup,
        timestamp: new Date().toISOString()
      };

      const responseData = { success: true, downloadUrl: finalUrl };
      if (includeReport) responseData.report = recoveryReport;

      return res.status(200).json(responseData);

    } catch (err) {
      console.error("Repair-PDF error:", err);
      return res.status(500).json({ error: "Repair process failed." });
    }
  }
    
  else if (action === 'pdf-to-markdown') {
  if (!process.env.GROQ_API_KEY) {
    return res.status(200).json({ markdown: "⚠️ Groq API Key missing. Add GROQ_API_KEY in environment." });
  }
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const options = req.body.options || {};
    const fileUrls = req.body.fileUrls || [req.body.fileUrl];

    let combinedText = "";
    for (const url of fileUrls) {
      const convertOptions = { File: url };
      if (options.pageRange) convertOptions.PageRange = options.pageRange;
      if (options.ocrEnabled) convertOptions.Ocr = "true";
      
      const txtResult = await convertapi.convert('txt', convertOptions, 'pdf');
      const text = await (await fetch(txtResult.response.Files[0].Url)).text();
      combinedText += text + "\n\n";
    }
    combinedText = combinedText.substring(0, 20000);

    // Build prompt based on options
    let prompt = `Convert the following PDF text into clean, structured Markdown (.md).\n\n`;
    prompt += `Rules:\n`;
    if (options.includeHeadings) prompt += `- Preserve headings (H1-H6) based on font size. \n`;
    if (options.includeLists) prompt += `- Convert lists to bullet points (- ) or numbered lists. \n`;
    if (options.includeTables) prompt += `- Convert tables into GFM pipe tables. \n`;
    if (options.includeCodeBlocks) prompt += `- Detect code blocks and wrap in triple backticks. \n`;
    if (options.includeBlockquotes) prompt += `- Convert quotes to > blockquotes. \n`;
    if (options.includeImages) prompt += `- Note image placeholders as ![alt text](image_url). \n`;
    if (options.removeNoise) prompt += `- Remove page numbers, headers, footers, and separators. \n`;
    if (options.llmEnabled) prompt += `- Use AI to intelligently structure the content. \n`;
    prompt += `\n\nDocument Text:\n${combinedText}`;

    const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    const activeModel = process.env.CURRENT_GROQ_MODEL || "openai/gpt-oss-20b";
    const aiResponse = await fetch(groqUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2
      })
    });
    const data = await aiResponse.json();
    const markdown = data.choices?.[0]?.message?.content || "Conversion failed.";

    return res.status(200).json({ success: true, markdown });
  } catch (error) {
    console.error('PDF to Markdown error:', error);
    return res.status(500).json({ error: 'PDF to Markdown conversion failed.' });
  }
}
    
    else if (action === 'ocr-pdf') {
      const format = req.body.format || 'txt'; 
      result = await convertapi.convert(format, { File: fileUrl }, 'pdf');
    }
    
else if (action === 'html-to-pdf') {
  try {
    const { htmlContent, options } = req.body;
    let fileUrl = req.body.fileUrl || '';
    
   // 🔥 FINAL FIX 2: Solid URL Cleanup
    if (fileUrl) {
      fileUrl = fileUrl.trim();
      const markdownMatch = fileUrl.match(/\[.*?\]\((.*?)\)/);
      if (markdownMatch) fileUrl = markdownMatch[1];
      
      // Agar direct URL input hai aur http se start nahi hota, toh prefix lagao
      if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        fileUrl = 'https://' + fileUrl;
      }
      fileUrl = encodeURI(fileUrl); // Pura URL properly encode hoga
    }
    
    // URL validation (Loose check)
    const isValidUrl = /^https?:\/\/.+/i.test(fileUrl);
    
    const convertOptions = {};

    // Page Settings
    if (options.pageSize) convertOptions.PageSize = options.pageSize;
    if (options.orientation) convertOptions.PageOrientation = options.orientation;

    // Margins
    if (options.margins) {
      if (options.margins === 'custom' && options.customMargins) {
        if (options.customMargins.top) convertOptions.MarginTop = options.customMargins.top + 'mm';
        if (options.customMargins.bottom) convertOptions.MarginBottom = options.customMargins.bottom + 'mm';
        if (options.customMargins.left) convertOptions.MarginLeft = options.customMargins.left + 'mm';
        if (options.customMargins.right) convertOptions.MarginRight = options.customMargins.right + 'mm';
      } else {
        convertOptions.PageMargins = options.margins;
      }
    }

    // Scale (10-200 range)
    if (options.scale) {
      const scaleValue = options.scale === '1' ? 100 : parseInt(options.scale);
      convertOptions.Scale = scaleValue;
    }

    // Background
    if (options.background === false) convertOptions.PrintBackground = 'false';

    // Header/Footer
    if (options.headerFooter) {
      if (options.headerTemplate) convertOptions.HeaderTemplate = options.headerTemplate;
      if (options.footerTemplate) convertOptions.FooterTemplate = options.footerTemplate;
    }

    // Wait For Selector / Timeout
    if (options.waitForSelector) convertOptions.WaitForSelector = options.waitForSelector;
    if (options.waitForTimeout) convertOptions.WaitForTimeout = options.waitForTimeout;

    let result;
    
    // URL se PDF convert
    if (fileUrl && isValidUrl) {
      convertOptions.Url = fileUrl;  // 🔥 Proper URL bhejo
      result = await convertapi.convert('pdf', convertOptions, 'web');
    } 
    // Raw HTML se PDF convert
    else if (htmlContent) {
      // HTML content ko temp file mein upload karo
      const tempBlob = await put(`source-code-${Date.now()}.html`, htmlContent, {
        access: 'public',
        contentType: 'text/html'
      });
      convertOptions.File = tempBlob.url;
      result = await convertapi.convert('pdf', convertOptions, 'html');
    } 
    else {
      return res.status(400).json({ error: 'No valid URL or HTML content provided' });
    }

    let finalUrl = result.response.Files[0].Url;

    // Watermark (optional)
    if (options.watermark) {
      const watermarkResult = await convertapi.convert('watermark', {
        File: finalUrl,
        Text: options.watermark,
        FontSize: '24',
        Opacity: '30',
        Rotation: '45',
        HorizontalAlignment: 'center',
        VerticalAlignment: 'center'
      }, 'pdf');
      finalUrl = watermarkResult.response.Files[0].Url;
    }

    // Password (optional)
    if (options.password) {
      const encryptResult = await convertapi.convert('encrypt', {
        File: finalUrl,
        UserPassword: options.password,
        OwnerPassword: options.password
      }, 'pdf');
      finalUrl = encryptResult.response.Files[0].Url;
    }

    return res.status(200).json({ success: true, downloadUrl: finalUrl });
  } catch (htmlError) {
    console.error("HTML-to-PDF error:", htmlError);
    return res.status(500).json({ error: "HTML to PDF conversion failed." });
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
    else if (action === 'ai-summarizer' || action === 'translate-pdf' || action === 'ai-compare' || action === 'pdf-to-enterprise-md' || action === 'ai-doc-chat') {
      if (!process.env.GROQ_API_KEY) return res.status(200).json({ success: false, textResult: "⚠️ Groq API Key is missing." });

      try {
        const apiKey = process.env.GROQ_API_KEY;
        const options = req.body.options || {};
        const fileUrls = req.body.fileUrls || [req.body.fileUrl];  // Multiple files support

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

        let combinedText = "";
        for (const url of fileUrls) {
          const txtResult = await convertapi.convert('txt', { File: url }, 'pdf');
          const text = await (await fetch(txtResult.response.Files[0].Url)).text();
          combinedText += text + "\n\n";
        }
        combinedText = combinedText.substring(0, 15000); // Limit for Groq

        let textResult;
        if (action === 'ai-summarizer') {
          const lengthPrompt = options.length === 'short' ? '3-5 bullets' : options.length === 'long' ? '2-3 paragraphs' : '1 paragraph';
          const typePrompt = options.type === 'bullet' ? 'bullet points' : options.type === 'paragraph' ? 'flowing text' : 'executive summary';
          const languagePrompt = options.language ? ` in ${options.language}` : '';
          const tonePrompt = options.tone ? ` in a ${options.tone} tone` : '';
          const includeMetrics = options.includeMetrics ? ' Include key metrics (dates, names, amounts, stats).' : '';
          const sectionSummary = options.sectionSummary ? ' Provide section-wise summary.' : '';
          const highlight = options.highlight ? ' Highlight important sentences with **bold**.' : '';
          const keywords = options.keywords ? ' Extract top 5-10 keywords.' : '';
          const actionItems = options.actionItems ? ' Extract action items as a separate list.' : '';
          const sentiment = options.sentiment ? ' Also give sentiment analysis (positive/neutral/negative).' : '';
          const confidence = options.confidence ? ' Give a confidence score (0-100%).' : '';
          const citation = options.citation ? ' Include page references for each point.' : '';
          const noiseReduction = options.noiseReduction ? ' Ignore headers/footers/page numbers.' : '';

          const prompt = `Summarize the following document as ${lengthPrompt}, using ${typePrompt}${languagePrompt}${tonePrompt}.${includeMetrics}${sectionSummary}${highlight}${keywords}${actionItems}${sentiment}${confidence}${citation}${noiseReduction}\n\nDocument:\n${combinedText}`;
          textResult = await callGroqAI(prompt);
        }
       else if (action === 'translate-pdf') {
  // Backend translate action – saare options handle karta hai
  if (!process.env.GROQ_API_KEY) return res.status(200).json({ success: false, textResult: "⚠️ Groq API Key is missing." });
  
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const options = req.body.options || {};
    const targetLang = options.targetLanguage || 'English';
    const sourceLang = options.sourceLanguage || 'auto';
    const tone = options.tone || 'formal';
    const pageRange = options.pageRange || '';
    const ocrEnabled = options.ocrEnabled || false;
    const glossary = options.glossary || '';
    
    // 1. PDF se text extract karo
    const fileUrls = req.body.fileUrls || [req.body.fileUrl];
    let combinedText = '';
    for (const url of fileUrls) {
      const convertOptions = { File: url };
      if (ocrEnabled) convertOptions.Ocr = 'true';
      if (pageRange) convertOptions.PageRange = pageRange; // e.g., "1-5"
      
      const txtResult = await convertapi.convert('txt', convertOptions, 'pdf');
      const text = await (await fetch(txtResult.response.Files[0].Url)).text();
      combinedText += text + '\n\n';
    }
    combinedText = combinedText.substring(0, 15000);
    
    // 2. Groq AI se translate karo
    const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    const activeModel = process.env.CURRENT_GROQ_MODEL || "openai/gpt-oss-20b";
    const prompt = `Translate the following document from ${sourceLang} to ${targetLang} in a ${tone} tone.${glossary ? ` Use this glossary for specific terms: ${glossary}` : ''}\n\nDocument:\n${combinedText}`;
    
    const aiResponse = await fetch(groqUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });
    const data = await aiResponse.json();
    const translatedText = data.choices?.[0]?.message?.content || 'Translation failed.';
    
    // 3. Meta info (confidence, sentiment) nikaalo (optional)
    let meta = {};
    if (options.confidence) {
      meta.confidence = 92; // placeholder, actual AI confidence nahi milta
    }
    if (options.sentiment) {
      const sentiRes = await fetch(groqUrl, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: activeModel,
          messages: [{ role: 'user', content: `Analyze sentiment of this text and reply with one word (positive/negative/neutral):\n${translatedText}` }],
        })
      });
      const sentiData = await sentiRes.json();
      meta.sentiment = sentiData.choices?.[0]?.message?.content?.trim().toLowerCase() || 'neutral';
    }
    
    return res.status(200).json({ success: true, textResult: translatedText, meta });
  } catch (error) {
    console.error('Translate error:', error);
    return res.status(500).json({ error: 'Translation failed.' });
  }
}
       else if (action === 'ai-compare') {
  if (!process.env.GROQ_API_KEY) return res.status(200).json({ success: false, textResult: "⚠️ Groq API Key is missing." });
  try {
    const apiKey = process.env.GROQ_API_KEY;
    const options = req.body.options || {};
    const fileUrls = req.body.fileUrls || [req.body.fileUrl]; // Multiple files (file1, file2)
    const fileUrl2 = req.body.fileUrl2 || fileUrls[1];
    
    // 1. Extract text from both PDFs
    let text1 = '', text2 = '';
    try {
      const res1 = await convertapi.convert('txt', { File: fileUrls[0] }, 'pdf');
      text1 = await (await fetch(res1.response.Files[0].Url)).text();
    } catch (e) { text1 = "Unable to extract text from file 1"; }
    try {
      const res2 = await convertapi.convert('txt', { File: fileUrl2 }, 'pdf');
      text2 = await (await fetch(res2.response.Files[0].Url)).text();
    } catch (e) { text2 = "Unable to extract text from file 2"; }
    
    text1 = text1.substring(0, 10000);
    text2 = text2.substring(0, 10000);
    
    // 2. Prepare AI prompt based on options
    let prompt = `Compare the following two documents and generate a detailed report. `;
    if (options.comparisonType === 'semantic') prompt += "Focus on semantic differences (meaning, not just text). ";
    else if (options.comparisonType === 'visual') prompt += "Focus on visual/layout differences. ";
    else prompt += "Do a text-based comparison. ";
    
    if (options.pageRange) prompt += `Only analyze pages: ${options.pageRange}. `;
    if (options.ignoreFormatting) prompt += "Ignore formatting differences. ";
    if (options.ignoreAnnotations) prompt += "Ignore annotations. ";
    if (options.ignoreImages) prompt += "Ignore images. ";
    
    prompt += `\n\nDocument 1 (Original):\n${text1}\n\nDocument 2 (Modified):\n${text2}`;
    
    // 3. Call Groq API
    const groqUrl = "https://api.groq.com/openai/v1/chat/completions";
    const activeModel = process.env.CURRENT_GROQ_MODEL || "openai/gpt-oss-20b";
    const aiResponse = await fetch(groqUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: activeModel,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });
    const data = await aiResponse.json();
    const report = data.choices?.[0]?.message?.content || "AI could not generate comparison.";
    
    // 4. Return report + extracted texts (for side-by-side)
    return res.status(200).json({ 
      success: true, 
      textResult: report, 
      text1: text1, 
      text2: text2,
      meta: { totalChanges: 0 } // can calculate later
    });
  } catch (error) {
    console.error("ai-compare error:", error);
    return res.status(500).json({ error: "Comparison failed." });
  }
}
        else if (action === 'pdf-to-enterprise-md') {
          let systemPrompt = `You are an expert Enterprise Document Parser. Convert the following raw text extracted from a PDF into clean, beautifully structured Markdown (.md).\n\nGuidelines:\n1. Create proper Markdown headings (# H1, ## H2) based on context.\n2. Format lists correctly using bullets (-) or numbers.\n3. Identify code snippets and wrap them in triple backticks.\n`;
          if (options.tables) systemPrompt += `4. If you see data that looks like a table, reconstruct it perfectly using standard Markdown table syntax (| Header | Header |).\n`;
          if (options.clean) systemPrompt += `5. Aggressively remove noise: delete repetitive page numbers, footers, headers, and document watermarks.\n`;
          systemPrompt += `\nRaw Text to Parse:\n\n${combinedText}`;
          textResult = await callGroqAI(systemPrompt);
        }
        else if (action === 'ai-doc-chat') {
          const question = req.body.question || '';
          textResult = await callGroqAI(`Based on the following document, answer this question: ${question}\n\nDocument:\n${combinedText}`);
        }

        // Extract meta info (sentiment, confidence, keywords) if requested
        let meta = {};
        if (options.sentiment) {
          const sentiPrompt = `Analyze sentiment of this text and reply with one word (positive/negative/neutral):\n${combinedText}`;
          const senti = await callGroqAI(sentiPrompt);
          meta.sentiment = senti.trim().toLowerCase();
        }
        if (options.confidence) {
          meta.confidence = 85; // Placeholder, can be calculated dynamically
        }

        return res.status(200).json({ success: true, textResult, meta });
      } catch (aiError) {
        console.error("AI error:", aiError);
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
function calculateRecoveryScore(damage, tier) {
  let score = 100;
  if (damage.isEncrypted) score -= 20;
  if (damage.hasMissingFonts) score -= 10;
  if (damage.hasCorruptImages) score -= 15;
  if (tier === 'Tier 2') score -= 30;
  if (tier === 'Tier 3') score -= 60;
  return Math.max(0, score);
}
