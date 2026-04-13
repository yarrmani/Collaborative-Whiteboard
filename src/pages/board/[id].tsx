import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import io, { Socket } from 'socket.io-client';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';

import Topbar from '@/components/Topbar';
import Sidebar from '@/components/Sidebar';
import ShareModal from '@/components/ShareModal';

let socket: Socket;

interface Element {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  color?: string;
  text?: string;
  points?: { x: number, y: number }[];
  url?: string;
  fontFamily?: string;
  fontSize?: number;
}

export default function BoardPage() {
  const router = useRouter();
  const { id } = router.query;
  
  const [boardInfo, setBoardInfo] = useState<any>(null);
  const [elements, setElements] = useState<Element[]>([]);
  const [cursors, setCursors] = useState<{ [id: string]: { x: number, y: number, name?: string } }>({});
  const [activeTool, setActiveTool] = useState('select');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [editRequests, setEditRequests] = useState<any[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPathId, setCurrentPathId] = useState<string | null>(null);

  const [isDraggingShape, setIsDraggingShape] = useState(false);
  const [shapeStart, setShapeStart] = useState({ x: 0, y: 0 });
  const [currentElementId, setCurrentElementId] = useState<string | null>(null);

  const [textFont, setTextFont] = useState('sans');
  const [textSize, setTextSize] = useState(18);

  const [history, setHistory] = useState<Element[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Identify user
  const userId = useRef<string>('');

  useEffect(() => {
    if (!id) return;

    userId.current = localStorage.getItem('userId') || uuidv4();
    localStorage.setItem('userId', userId.current);

    // Bootstrap Board data
    fetch(`/api/boards/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert('Board not found');
          router.push('/');
          return;
        }
        setBoardInfo(data);
        const initialElts = data.elements || [];
        setElements(initialElts);
        setHistory([initialElts]);
        setHistoryIndex(0);
      });

    // Initialize socket connection
    const initSocket = async () => {
      await fetch('/api/socket');
      socket = io({ path: '/api/socket' });

      socket.on('connect', () => {
        socket.emit('join-board', { boardId: id, userId: userId.current });
      });

      socket.on('element-updated', (updatedElements: Element[]) => {
        setElements(updatedElements);
      });

      socket.on('cursor-update', ({ userId, userName, x, y }) => {
        setCursors(prev => ({ ...prev, [userId]: { x, y, name: userName } }));
      });

      socket.on('edit-access-requested', ({ userId: reqUserId, userName }) => {
        // Simple append if not there
        setEditRequests(prev => [...prev, { userId: reqUserId, userName }]);
      });
    };

    initSocket();

    return () => {
      if (socket) socket.disconnect();
    };
  }, [id, router]);

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only place elements if clicking directly on the background, except when drawing
    if (e.target !== e.currentTarget && activeTool !== 'draw') return;
    if (activeTool === 'select' || activeTool === 'expand' || activeTool === 'upload' || activeTool === 'pipette' || activeTool === 'coffee' || activeTool === 'connect' || activeTool === 'add' || activeTool === 'image') return;

    const x = e.clientX;
    const y = e.clientY;

    if (activeTool === 'sticky') {
      const newSticky: Element = {
        id: uuidv4(),
        type: 'sticky',
        x, y,
        color: ['#fef08a', '#bbf7d0', '#bfdbfe', '#fbcfe8'][Math.floor(Math.random() * 4)],
        text: 'New Sticky'
      };
      syncElements([...elements, newSticky]);
      setActiveTool('select');
    } else if (activeTool === 'rectangle' || activeTool === 'circle') {
      setIsDraggingShape(true);
      const id = uuidv4();
      setCurrentElementId(id);
      setShapeStart({ x, y });
      const newShape: Element = {
        id,
        type: activeTool,
        x, y,
        width: 0, 
        height: 0,
        color: activeTool === 'rectangle' ? '#e2e8f0' : '#dbeafe', 
      };
      setElements(prev => [...prev, newShape]);
    } else if (activeTool === 'text') {
      const newText: Element = {
        id: uuidv4(),
        type: 'text',
        x, y,
        text: '', 
        fontFamily: textFont,
        fontSize: textSize
      };
      syncElements([...elements, newText]);
      setActiveTool('select');
    } else if (activeTool === 'draw') {
      setIsDrawing(true);
      const id = uuidv4();
      setCurrentPathId(id);
      const newPath: Element = { id, type: 'path', x: 0, y: 0, points: [{ x, y }], color: '#000000' };
      setElements(prev => [...prev, newPath]);
    }
  };

  const handleImageUpload = (dataUrl: string) => {
    const newImage: Element = {
      id: uuidv4(),
      type: 'image',
      x: window.innerWidth / 2 - 150,
      y: window.innerHeight / 2 - 150,
      url: dataUrl
    };
    syncElements([...elements, newImage]);
    setActiveTool('select');
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (socket) {
      socket.emit('cursor-move', {
        boardId: id,
        userId: userId.current,
        x: e.clientX,
        y: e.clientY
      });
    }

    if (isDrawing && currentPathId && activeTool === 'draw') {
      setElements(prev => prev.map(el => {
        if (el.id === currentPathId && el.points) {
          return { ...el, points: [...el.points, { x: e.clientX, y: e.clientY }] };
        }
        return el;
      }));
    }

    if (isDraggingShape && currentElementId && (activeTool === 'rectangle' || activeTool === 'circle')) {
      const width = Math.abs(e.clientX - shapeStart.x);
      const height = Math.abs(e.clientY - shapeStart.y);
      const x = Math.min(e.clientX, shapeStart.x);
      const y = Math.min(e.clientY, shapeStart.y);

      setElements(prev => prev.map(el => {
        if (el.id === currentElementId) {
          return { ...el, x, y, width, height };
        }
        return el;
      }));
    }
  };

  const handlePointerUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      setCurrentPathId(null);
      syncElements(elements);
    }
    if (isDraggingShape) {
      setIsDraggingShape(false);
      setCurrentElementId(null);
      setActiveTool('select');
      syncElements(elements);
    }
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prev = history[prevIndex];
      setHistoryIndex(prevIndex);
      syncElements(prev, false);
    }
  };

  const handleRedo = () => {
    if (historyIndex > -1 && historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const next = history[nextIndex];
      setHistoryIndex(nextIndex);
      syncElements(next, false);
    }
  };

  const syncElements = (newElements: Element[], recordHistory = true) => {
    setElements(newElements);
    
    if (recordHistory) {
      const newHistory = history.slice(0, historyIndex + 1).slice(-50);
      newHistory.push(newElements);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }

    if (socket) {
      socket.emit('element-update', { boardId: id, elements: newElements });
      socket.emit('save-board', { boardId: id, elements: newElements });
    }
  };

  const updateElementPos = (elId: string, x: number, y: number) => {
    const newEls = elements.map(el => (el.id === elId ? { ...el, x, y } : el));
    syncElements(newEls);
  };

  const updateElementText = (elId: string, text: string) => {
    const newEls = elements.map(el => (el.id === elId ? { ...el, text } : el));
    syncElements(newEls);
  };

  const grantAccess = (reqUserId: string) => {
    socket.emit('grant-edit-access', { boardId: id, targetUserId: reqUserId });
    setEditRequests(prev => prev.filter(r => r.userId !== reqUserId));
  };

  if (!boardInfo) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading plano...</div>;

  const handleSelectTool = (tool: string) => {
    if (tool === 'clear') {
      syncElements([]);
      setActiveTool('select');
    } else {
      setActiveTool(tool);
    }
  };

  return (
    <div 
      className="h-screen w-screen bg-slate-50 overflow-hidden relative cursor-crosshair grid-pattern"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <Head>
        <title>plano - {id}</title>
      </Head>

      <Topbar 
        boardName={boardInfo.name || "Design Thinking Ideation"}
        onShare={() => setIsShareOpen(true)}
        editors={boardInfo.editors || []}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      <Sidebar 
        activeTool={activeTool} 
        onSelectTool={handleSelectTool} 
        onImageUpload={handleImageUpload}
      />

      {activeTool === 'text' && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-md border border-slate-200 p-2 flex gap-4 z-50">
          <select value={textFont} onChange={e => setTextFont(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-sm bg-white outline-none cursor-pointer hover:bg-slate-50 transition-colors">
            <option value="sans">Sans-Serif</option>
            <option value="serif">Serif</option>
            <option value="mono">Monospace</option>
          </select>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
            <span className="text-sm font-medium text-slate-500">Size</span>
            <input type="number" value={textSize} onChange={e => setTextSize(Number(e.target.value))} className="w-16 border border-slate-200 rounded px-2 py-1 text-sm outline-none" min="8" max="120" />
          </div>
        </div>
      )}

      {/* Infinite Canvas Simulation */}
      <div className="absolute inset-0 z-10 w-full h-full pointer-events-none">
        
        {elements.map(el => (
          <motion.div
            key={el.id}
            drag={activeTool === 'select' && el.type !== 'path'}
            dragMomentum={false}
            onDragEnd={(e, info) => {
              if (activeTool !== 'select') return;
              updateElementPos(el.id, el.x + info.offset.x, el.y + info.offset.y);
            }}
            initial={{ x: el.x, y: el.y, scale: 0 }}
            animate={{ x: el.x, y: el.y, scale: 1 }}
            className={`absolute ${el.type === 'path' ? 'pointer-events-none' : 'pointer-events-auto'}`}
            style={{ x: el.x, y: el.y }}
          >
            {el.type === 'sticky' && (
              <div 
                className="w-48 h-48 rounded shadow-lg p-4 cursor-grab active:cursor-grabbing flex items-center justify-center relative group"
                style={{ backgroundColor: el.color }}
              >
                <textarea 
                  className="w-full h-full bg-transparent resize-none outline-none text-slate-800 font-medium text-center"
                  value={el.text}
                  onChange={(e) => updateElementText(el.id, e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {el.type === 'rectangle' && (
              <div 
                className="border-2 border-slate-300 shadow-sm cursor-grab active:cursor-grabbing"
                style={{ backgroundColor: el.color, width: el.width || 120, height: el.height || 120, borderRadius: '8px' }}
              />
            )}
            {el.type === 'circle' && (
              <div 
                className="border-2 border-slate-300 shadow-sm cursor-grab active:cursor-grabbing rounded-full"
                style={{ backgroundColor: el.color, width: el.width || 120, height: el.height || 120 }}
              />
            )}
            {el.type === 'text' && (
              <div className="cursor-grab active:cursor-grabbing min-w-[120px] p-2 hover:bg-slate-100/50 rounded">
                <textarea 
                  className={`w-full h-full bg-transparent resize-none outline-none text-slate-800 font-${el.fontFamily || 'sans'} leading-tight`}
                  style={{ fontSize: el.fontSize || 18, minHeight: '40px' }}
                  value={el.text || ''}
                  onChange={(e) => updateElementText(el.id, e.target.value)}
                  onPointerDown={(e) => e.stopPropagation()}
                  placeholder="Type here..."
                />
              </div>
            )}
            {el.type === 'image' && el.url && (
              <div className="cursor-grab active:cursor-grabbing p-1 bg-white shadow-sm border border-slate-200 rounded">
                <img 
                  src={el.url} 
                  alt="Board Image" 
                  className="max-w-[400px] max-h-[400px] object-contain rounded pointer-events-none" 
                />
              </div>
            )}
            {el.type === 'path' && el.points && el.points.length > 0 && (
              <svg className="absolute top-0 left-0 overflow-visible pointer-events-none">
                <path 
                  d={`M ${el.points.map(p => `${p.x} ${p.y}`).join(' L ')}`} 
                  stroke={el.color || '#000000'} 
                  strokeWidth="4" 
                  fill="none" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                />
              </svg>
            )}
          </motion.div>
        ))}

        {/* Remote Cursors */}
        {Object.entries(cursors).map(([cid, pos]) => (
          <motion.div
            key={cid}
            className="absolute z-50 pointer-events-none"
            animate={{ x: pos.x, y: pos.y }}
            transition={{ type: "tween", ease: "linear", duration: 0.05 }}
          >
            <svg width="24" height="36" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7871 12.3673H5.65376Z" fill="#F97316"/>
              <path d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7871 12.3673H5.65376Z" stroke="#FFFFFF" strokeWidth="1"/>
            </svg>
            <div className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded shadow mt-1 whitespace-nowrap ml-4">
              {pos.name || cid.substring(0,6)}
            </div>
          </motion.div>
        ))}
      </div>

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        otp={boardInfo.otp}
        link={typeof window !== 'undefined' ? window.location.href : ''}
        requests={editRequests}
        onGrantAccess={grantAccess}
      />
    </div>
  );
}
