"use client";

import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
  children: React.ReactNode;
  className?: string;
}

export default function CollapsibleCard({ title, description, isOpen, onToggle, onSave, saving, saveLabel = "Kaydet", children, className = "" }: Props) {
  return (
    <div className={`card p-6 ${className}`}>
      <button onClick={onToggle} className="w-full flex items-center justify-between">
        <div className="text-left">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {isOpen && onSave && (
            <button onClick={(e) => { e.stopPropagation(); onSave(); }} disabled={saving} className="btn btn-primary text-sm">
              {saving ? "Kaydediliyor..." : saveLabel}
            </button>
          )}
          {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
        </div>
      </button>
      {isOpen && <div className="mt-4">{children}</div>}
    </div>
  );
}
