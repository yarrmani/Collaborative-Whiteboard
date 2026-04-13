import type { NextApiRequest, NextApiResponse } from 'next';
import BoardFunctions from '@/models/Board';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const board = await BoardFunctions.getBoardById(id as string);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      return res.status(200).json(board);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to fetch board' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { otp } = req.body;
      const board = await BoardFunctions.getBoardById(id as string);
      if (!board) {
        return res.status(404).json({ error: 'Board not found' });
      }

      if (board.otp !== otp) {
        return res.status(401).json({ error: 'Invalid OTP' });
      }

      return res.status(200).json({ success: true, board });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to verify OTP' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
