import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';
import BoardFunctions from '@/models/Board';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Lazy cleanup when anyone creates a new board
      await BoardFunctions.lazyCleanupExpiredBoards().catch(console.error);

      // We should also initialize db if it doesn't exist
      await BoardFunctions.initializeDatabase().catch(console.error);

      const { ownerId } = req.body;
      if (!ownerId) {
        return res.status(400).json({ error: 'Owner ID is required' });
      }

      const boardId = uuidv4().substring(0, 8); // Short ID for URL
      const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit OTP

      await BoardFunctions.createBoard({
        _id: boardId,
        otp,
        ownerId,
        editors: [ownerId], // Owner is an editor by default
        elements: []
      });

      return res.status(201).json({ boardId, otp });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to create board.' });
    }
  }

  res.setHeader('Allow', ['POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
