import React from 'react';
import { Undo, Redo, Settings, Search, Share, Download, MessageSquare, Send, AlertCircle } from 'lucide-react';

interface TopbarProps {
  boardName: string;
  onShare: () => void;
  editors: string[]; 
  onUndo?: () => void;
  onRedo?: () => void;
}

export default function Topbar({ boardName, onShare, editors, onUndo, onRedo }: TopbarProps) {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[96%] max-w-6xl h-14 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-between px-6 z-50">
      {/* Left section */}
      <div className="flex items-center gap-6">
        <div className="font-extrabold text-xl tracking-tight text-slate-800">
          plano
        </div>
        <div className="w-[1px] h-6 bg-slate-200"></div>
        <div className="font-medium text-slate-800">{boardName}</div>
        
        <div className="flex items-center gap-3 text-slate-500 ml-4">
          <button onClick={onUndo} className="hover:text-slate-800 transition-colors" title="Undo"><Undo size={18} /></button>
          <button onClick={onRedo} className="hover:text-slate-800 transition-colors" title="Redo"><Redo size={18} /></button>
          <button className="hover:text-slate-800 transition-colors"><Settings size={18} /></button>
          <button className="hover:text-slate-800 transition-colors"><Search size={18} /></button>
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-6">
        {/* Avatars */}
        <div className="flex -space-x-2">
          {editors.slice(0, 3).map((id, index) => (
            <div key={index} className="w-8 h-8 rounded-full border-2 border-white bg-orange-500 flex items-center justify-center text-white text-xs font-bold">
              {id.substring(0, 2).toUpperCase()}
            </div>
          ))}
          {editors.length > 3 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-medium">
              +{editors.length - 3}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          <button className="hover:text-slate-800 transition-colors"><MessageSquare size={18} /></button>
          <button className="hover:text-slate-800 transition-colors"><Send size={18} /></button>
          <button className="hover:text-slate-800 transition-colors"><Download size={18} /></button>
          
          <button 
            onClick={onShare}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded flex items-center gap-2 font-medium transition-colors text-sm"
          >
            <Share size={14} />
            Share
          </button>

          <button className="hover:text-slate-800 transition-colors text-slate-400"><AlertCircle size={18} /></button>
        </div>
      </div>
    </div>
  );
}
