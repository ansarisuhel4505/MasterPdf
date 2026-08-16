import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  // Fix for Next.js body parsing behavior
  const body = typeof request.body === 'string' ? JSON.parse(request.body) : request.body;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          // 🚀 FIX 1: Bypass the default 4MB Blob limit! Allow up to 100MB.
          maximumSizeInBytes: 100 * 1024 * 1024,
          
          // 🚀 FIX 2: Allow all formats (PDF, Word, Excel, PPT, Images)
          allowedContentTypes: [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/jpg',
            'application/msword', // .doc
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel', // .xls
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'application/vnd.ms-powerpoint', // .ppt
            'application/vnd.openxmlformats-officedocument.presentationml.presentation' // .pptx
          ],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    return response.status(200).json(jsonResponse);
  } catch (error) {
    console.error("Blob Upload Error:", error);
    // Yahi wo jagah hai jahan se 400 error aa raha tha
    return response.status(400).json({ error: error.message });
  }
}
