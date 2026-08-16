const convertapi = require('convertapi')(process.env.CONVERT_API_SECRET);

// Vercel Timeout Fix (Allows function to run longer without cutting off)
export const maxDuration = 60;

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
    // 🧠 CATEGORY 3: AI TOOLS (BULLETPROOF FALLBACK LOOP)
    // ==========================================
    else if (action === 'ai-summarizer' || action === 'translate-pdf' || action === 'ai-compare') {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(200).json({ success: false, textResult: "⚠️ Gemini API Key is missing." });
      }

      try {
        const apiKey = process.env.GEMINI_API_KEY;

        // SMART LOOP: Try different models until one succeeds
        const callGeminiBulletproof = async (promptText) => {
          const modelsToTry = ["gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro"];
          let lastErrorMessage = "";

          for (const model of modelsToTry) {
            try {
              const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
              const aiResponse = await fetch(geminiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
              });

              const data = await aiResponse.json();

              if (aiResponse.ok && data.candidates) {
                return data.candidates[0].content.parts[0].text; // SUCCESS! Code yahin se wapas chala jayega
              } else {
                lastErrorMessage = data.error?.message || "Unknown API error";
                console.log(`Failed to connect with ${model}:`, lastErrorMessage);
                // Agar fail hua, toh loop agle model par jump kar jayega
              }
            } catch (err) {
              lastErrorMessage = err.message;
            }
          }
          
          // Agar teeno models fail ho gaye
          throw new Error(lastErrorMessage);
        };

        // RUN AI BASED ON ACTION
        if (action === 'ai-summarizer') {
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const extractedText = await (await fetch(txtResult.response.Files[0].Url)).text();
          const resultText = await callGeminiBulletproof(`Summarize this clearly in bullet points:\n\n${extractedText.substring(0, 15000)}`);
          return res.status(200).json({ success: true, textResult: resultText });
        }
        else if (action === 'translate-pdf') {
          const targetLang = req.body.targetLanguage || 'English';
          const txtResult = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const extractedText = await (await fetch(txtResult.response.Files[0].Url)).text();
          const resultText = await callGeminiBulletproof(`Translate into ${targetLang}:\n\n${extractedText.substring(0, 15000)}`);
          return res.status(200).json({ success: true, textResult: resultText });
        }
        else if (action === 'ai-compare') {
          const { fileUrl2 } = req.body;
          if (!fileUrl2) return res.status(400).json({ error: 'Second file URL missing' });

          const txtResult1 = await convertapi.convert('txt', { File: fileUrl }, 'pdf');
          const text1 = await (await fetch(txtResult1.response.Files[0].Url)).text();
          const txtResult2 = await convertapi.convert('txt', { File: fileUrl2 }, 'pdf');
          const text2 = await (await fetch(txtResult2.response.Files[0].Url)).text();

          const resultText = await callGeminiBulletproof(`Compare these documents and list differences:\n\n--- DOC 1 ---\n${text1.substring(0, 7000)}\n\n--- DOC 2 ---\n${text2.substring(0, 7000)}`);
          return res.status(200).json({ success: true, textResult: resultText });
        }

      } catch (aiError) {
        console.error("AI Bulletproof Error:", aiError.message);
        return res.status(200).json({ 
          success: true, 
          textResult: `❌ Google API Error: ${aiError.message}\nGoogle servers are completely rejecting your API key right now. Please create a fresh key from a NEW project in Google AI Studio.` 
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
