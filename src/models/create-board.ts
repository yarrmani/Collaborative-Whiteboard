import { NextApiRequest, NextApiResponse } from 'next';
import BoardFunctions from '@/models/Board';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, passcode } = req.body;

  if (!name || !passcode) {
    return res.status(400).json({ error: 'Name and Passcode are required' });
  }

  try {
    // 1. Ensure the table exists in the cloud database
    await BoardFunctions.initializeDatabase();

    // 2. Insert the new board
    const boardId = await BoardFunctions.createBoard(name, passcode);

    console.log(`🚀 Board Created Successfully: ${boardId}`);
    return res.status(200).json({ id: boardId });
  } catch (error: any) {
    console.error("Board API Error:", error.message);
    return res.status(500).json({ 
      error: 'Failed to create board', 
      details: error.message 
    });
  }
}