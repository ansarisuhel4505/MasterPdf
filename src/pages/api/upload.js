import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  // Sirf POST request allow karna
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Next.js body ko sahi se parse karna (400 error yahan se bhi aa sakta hai)
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          // 🚀 FIX 1: Default limit hata kar 100 MB allow kar diya
          maximumSizeInBytes: 100 * 1024 * 1024,
          
          // 🚀 FIX 2: allowedContentTypes hata diya gaya hai taaki PDF, JPG, Excel kisi par bhi format error na aaye
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Upload successful:', blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
    
  } catch (error) {
    console.error("Vercel Blob API Error:", error);
    // Error message ko properly return karna
    return res.status(400).json({ error: error.message });
  }
}
