'use client';
import { User } from 'lucide-react';

export function AuthSection({ onLoginClickAction }: Readonly<{ onLoginClickAction: () => void }>) {
  return (
    <button
      type="button"
      className="bg-gradient-to-br from-primary to-[hsl(260,70%,60%)] text-foreground border-none px-5 py-2 rounded-lg font-bold text-sm cursor-pointer flex items-center gap-2 hover:opacity-90 hover:shadow-[0_4px_15px_color-mix(in_srgb,var(--primary)_30%,transparent)] transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
      onClick={onLoginClickAction}
    >
      <User size={18} />
      <span>Login</span>
    </button>
  );
}
