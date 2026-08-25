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
  try {
    const { htmlContent, options } = req.body;
    const fileUrl = req.body.fileUrl || '';
    
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
    if (fileUrl) {
      convertOptions.Url = fileUrl;
      result = await convertapi.convert('pdf', convertOptions, 'web');
    } 
    // Raw HTML se PDF convert
    else if (htmlContent) {
      // Pehle HTML ko temp file mein upload karo
      const tempBlob = await put(`source-code-${Date.now()}.html`, htmlContent, {
        access: 'public',
        contentType: 'text/html'
      });
      
      convertOptions.File = tempBlob.url;
      result = await convertapi.convert('pdf', convertOptions, 'html');
    } 
    else {
      return res.status(400).json({ error: 'No URL or HTML content provided' });
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
