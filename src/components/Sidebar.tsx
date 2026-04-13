import React from 'react';
import { 
  Plus, 
  MousePointer2, 
  Square,
  Circle,
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
  onImageUpload?: (dataUrl: string) => void;
}

export default function Sidebar({ activeTool, onSelectTool, onImageUpload }: SidebarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const tools = [
    { id: 'add', icon: Plus },
    { id: 'select', icon: MousePointer2 },
    { id: 'rectangle', icon: Square },
    { id: 'circle', icon: Circle },
    { id: 'image', icon: ImageIcon },
    { id: 'sticky', icon: StickyNote },
    { id: 'text', icon: Type },
    { id: 'draw', icon: PenTool },
    { id: 'connect', icon: Hash }, 
    { id: 'coffee', icon: Coffee },
    { id: 'pipette', icon: Pipette },
    { id: 'upload', icon: Upload },
    { id: 'expand', icon: ChevronsRight }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImageUpload(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 bg-white rounded-xl shadow-sm border border-slate-200 py-3 flex flex-col items-center gap-2 z-50 max-h-[90vh] overflow-y-auto">
      {tools.map((t) => {
        const isActive = activeTool === t.id;
        return (
          <button
            key={t.id}
            onClick={() => {
              if (t.id === 'image' || t.id === 'upload') {
                fileInputRef.current?.click();
              } else if (t.id === 'coffee') {
                alert('Time for a coffee break! ☕');
              } else if (t.id === 'pipette') {
                alert('Color picker coming soon! 🎨');
              } else if (t.id === 'connect') {
                alert('Connection lines coming soon! 🔗');
              } else if (t.id === 'expand') {
                if (document.fullscreenElement) document.exitFullscreen().catch(console.error);
                else document.documentElement.requestFullscreen().catch(console.error);
              } else if (t.id === 'add') {
                if (window.confirm('Clear the entire board?')) {
                  onSelectTool('clear');
                }
              } else {
                onSelectTool(t.id);
              }
            }}
            title={t.id}
            className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg mx-2 transition-all ${
              isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
            }`}
          >
            <t.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          </button>
        );
      })}
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
    </div>
  );
}
