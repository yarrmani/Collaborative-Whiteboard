import React from 'react';
import { 
  Plus, 
  MousePointer2, 
  Square, 
  Image as ImageIcon, 
  StickyNote, 
  Type, 
  PenTool, 
  Hash, 
  Coffee, 
  Pipette, 
  Upload, 
  ChevronsRight 
} from 'lucide-react';

interface SidebarProps {
  activeTool: string;
  onSelectTool: (tool: string) => void;
}

export default function Sidebar({ activeTool, onSelectTool }: SidebarProps) {
  const tools = [
    { id: 'add', icon: Plus },
    { id: 'select', icon: MousePointer2 },
    { id: 'shape', icon: Square },
    { id: 'image', icon: ImageIcon },
    { id: 'sticky', icon: StickyNote },
    { id: 'text', icon: Type },
    { id: 'draw', icon: PenTool },
    { id: 'connect', icon: Hash }, // roughly equivalent to connecting lines
    { id: 'coffee', icon: Coffee },
    { id: 'pipette', icon: Pipette },
    { id: 'upload', icon: Upload },
    { id: 'expand', icon: ChevronsRight }
  ];

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-sm border border-slate-200 py-3 flex flex-col items-center gap-2 z-50">
      {tools.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onSelectTool(t.id)}
            className={`w-10 h-10 flex items-center justify-center rounded-lg mx-2 transition-all ${
              isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <t.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
    </div>
  );
}
