import { getAuth } from '@clerk/nextjs/server';
import { put, del } from '@vercel/blob';
import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  const { userId } = getAuth(req);
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, fileId, fileUrl, fileName, fileSize, isPublic, actionText } = req.body;

  try {
    switch (action) {
      case 'create-file': {
        const result = await sql`
          INSERT INTO pdf_files (user_id, file_name, file_url, file_size, current_version, created_at)
          VALUES (${userId}, ${fileName}, ${fileUrl}, ${fileSize}, 1, NOW())
          RETURNING id;
        `;
        const newFileId = result.rows[0].id;
        
        await sql`
          INSERT INTO activities (file_id, user_id, action_text, timestamp)
          VALUES (${newFileId}, ${userId}, 'Uploaded file', NOW());
        `;
        
        return res.status(200).json({ success: true, fileId: newFileId });
      }

      case 'save-version': {
        const fileResult = await sql`SELECT current_version FROM pdf_files WHERE id = ${fileId} AND user_id = ${userId}`;
        if (fileResult.rowCount === 0) return res.status(404).json({ error: 'File not found' });
        
        const currentVersion = fileResult.rows[0].current_version;
        const newVersion = currentVersion + 1;
        
        await sql`
          UPDATE pdf_files 
          SET file_url = ${fileUrl}, current_version = ${newVersion}, updated_at = NOW()
          WHERE id = ${fileId} AND user_id = ${userId};
        `;
        
        await sql`
          INSERT INTO file_versions (file_id, version, file_url, created_at)
          VALUES (${fileId}, ${newVersion}, ${fileUrl}, NOW());
        `;
        
        await sql`
          INSERT INTO activities (file_id, user_id, action_text, timestamp)
          VALUES (${fileId}, ${userId}, 'Saved new version', NOW());
        `;
        
        return res.status(200).json({ success: true, newVersion });
      }

      case 'share-file': {
        const shareToken = Math.random().toString(36).substring(2, 15);
        
        await sql`
          UPDATE pdf_files SET share_token = ${shareToken}, is_public = ${isPublic || false}
          WHERE id = ${fileId} AND user_id = ${userId};
        `;
        
        const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL}/shared/${shareToken}`;
        
        return res.status(200).json({ success: true, shareUrl });
      }

      case 'log-activity': {
        await sql`
          INSERT INTO activities (file_id, user_id, action_text, timestamp)
          VALUES (${fileId}, ${userId}, ${actionText}, NOW());
        `;
        return res.status(200).json({ success: true });
      }

      default:
        return res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Edit PDF API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET handler for fetching history and activities
export async function GET(req, res) {
  const { userId } = getAuth(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');
  const fileId = searchParams.get('fileId');
  
  try {
    if (action === 'get-history') {
      const result = await sql`
        SELECT * FROM file_versions WHERE file_id = ${fileId} ORDER BY version DESC;
      `;
      return res.status(200).json({ history: result.rows });
    }
    
    if (action === 'get-activities') {
      const result = await sql`
        SELECT a.action_text, a.timestamp, a.user_id
        FROM activities a
        WHERE a.file_id = ${fileId}
        ORDER BY a.timestamp DESC
        LIMIT 50;
      `;
      return res.status(200).json({ activities: result.rows });
    }
    
    return res.status(400).json({ error: 'Unknown action' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
}
