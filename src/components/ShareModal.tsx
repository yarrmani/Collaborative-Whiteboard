import React from 'react';
import { X, Copy } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  otp: string;
  link: string;
  onClose: () => void;
  requests: any[];
  onGrantAccess: (userId: string) => void;
}

export default function ShareModal({ isOpen, otp, link, onClose, requests, onGrantAccess }: ShareModalProps) {
  if (!isOpen) return null;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`Link: ${link} \nOTP: ${otp}`);
    alert('Copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-[100] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] max-w-[90vw]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Share Board</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-6 border border-slate-100">
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Passcode (OTP)</p>
            <div className="text-3xl font-mono font-bold text-indigo-600 tracking-[0.2em]">{otp}</div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Share Link</p>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={link} 
                className="flex-1 bg-white border border-slate-200 rounded px-2 py-1 text-sm text-slate-600 outline-none truncate"
              />
              <button onClick={copyToClipboard} className="p-1.5 bg-indigo-100 text-indigo-600 rounded hover:bg-indigo-200">
                <Copy size={16} />
              </button>
            </div>
          </div>
        </div>

        {requests.length > 0 && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-3">Edit Requests</h3>
            <div className="space-y-2">
              {requests.map(r => (
                <div key={r.userId} className="flex items-center justify-between border border-slate-100 p-2 rounded-lg">
                  <span className="text-sm font-medium text-slate-700">{r.userName || 'Anonymous'}</span>
                  <button 
                    onClick={() => onGrantAccess(r.userId)}
                    className="bg-indigo-600 text-white px-3 py-1 text-xs font-medium rounded hover:bg-indigo-700 transition"
                  >
                    Grant Access
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
