import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        return {
          // 100 MB तक की फाइल्स को सपोर्ट करें (Large Files)
          maximumSizeInBytes: 100 * 1024 * 1024,
          // सभी फॉर्मेट्स को allow करें ताकि कोई error न आए
        };
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Upload successful:', blob.url);
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Vercel Blob API Error:", error);
    return res.status(400).json({ error: error.message });
  }
}
