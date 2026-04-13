import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import BoardFunctions from '@/models/Board';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function SocketHandler(req: NextApiRequest, res: any) {
  if (!res.socket.server.io) {
    console.log('*First use, starting socket.io');
    
    // Create the Socket.io server and attach it to the Next.js Http server
    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    // Make sure table is initialized if socket starts first somehow
    await BoardFunctions.initializeDatabase().catch(err => console.error("DB init failed", err));

    io.on('connection', (socket) => {
      // User joins a specific board
      socket.on('join-board', async ({ boardId, userId, isEditor }) => {
        socket.join(boardId);
        // Acknowledge joined
        socket.emit('joined', { boardId });
        socket.to(boardId).emit('user-joined', { userId, isEditor });
      });

      // Cursor movement
      socket.on('cursor-move', ({ boardId, userId, userName, x, y }) => {
        socket.to(boardId).emit('cursor-update', { userId, userName, x, y });
      });

      // Broadcast element changes
      socket.on('element-update', ({ boardId, elements }) => {
        // Here we just broadcast the latest state of an element or elements
        // In a complex app, we'd broadcast diffs mapped by element ID
        socket.to(boardId).emit('element-updated', elements);
      });

      // Push latest DB snapshot on bulk actions
      socket.on('save-board', async ({ boardId, elements }) => {
        try {
          await BoardFunctions.updateBoardElements(boardId, elements);
          socket.to(boardId).emit('board-saved', elements);
        } catch (error) {
          console.error("Save Board failed", error);
        }
      });

      // Request edit access
      socket.on('request-edit-access', ({ boardId, userId, userName }) => {
        // Send a request to the owner or all editors
        socket.to(boardId).emit('edit-access-requested', { userId, userName });
      });

      // Grant edit access (sent by owner)
      socket.on('grant-edit-access', async ({ boardId, targetUserId }) => {
        // Update DB
        try {
          await BoardFunctions.addEditor(boardId, targetUserId);
          io.to(boardId).emit('edit-access-granted', { userId: targetUserId });
        } catch (error) {
          console.error("Grant Edit access failed", error);
        }
      });

      socket.on('disconnect', () => {
        // Clean up or notify if necessary
      });
    });

    res.socket.server.io = io;
  } else {
    // console.log('socket.io already running');
  }
  res.end();
}
