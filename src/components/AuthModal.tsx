'use client';

import { Globe, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getBrowserClient } from '@/lib/supabase-browser';
import { cn } from '@/lib/utils';

const socialBtnBase =
  'flex items-center justify-center gap-3 p-[0.85rem] rounded-lg border bg-background text-foreground font-semibold cursor-pointer transition-colors duration-200 hover:bg-muted active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';

const messageTypeClasses: Record<string, string> = {
  success:
    'rounded-lg bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400 border border-green-500/20',
  error: 'rounded-lg bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20',
  info: 'rounded-lg bg-primary/10 p-3 text-sm text-primary',
  warning:
    'rounded-lg bg-yellow-500/10 p-3 text-sm text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
};

const DISCORD_PATH =
  'M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z';

interface AuthModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

function AuthFormFields({
  email,
  setEmail,
}: Readonly<{
  email: string;
  setEmail: (v: string) => void;
}>) {
  return (
    <div className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </div>
  );
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSocialLogin = async (provider: 'google' | 'discord' | 'github') => {
    setIsLoading(true);
    const { error } = await getBrowserClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${globalThis.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    const { error } = await getBrowserClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${globalThis.location.origin}/auth/callback` },
    });
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the magic link!' });
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🚀 Welcome to GameDeals</DialogTitle>
          <DialogDescription>
            Sign in to track price drops and sync your wishlist across all devices.
          </DialogDescription>
        </DialogHeader>
        {/* socialButtons: flex-col gap-3 */}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            className={`${socialBtnBase} border-[#4285f4]`}
            onClick={() => handleSocialLogin('google')}
            disabled={isLoading}
          >
            <Globe size={20} />
            <span>Continue with Google</span>
          </button>
          <button
            type="button"
            className={`${socialBtnBase} border-[#5865f2]`}
            onClick={() => handleSocialLogin('discord')}
            disabled={isLoading}
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="currentColor"
              aria-label="Discord"
            >
              <path d={DISCORD_PATH} />
            </svg>
            <span>Continue with Discord</span>
          </button>
          <button
            type="button"
            className={`${socialBtnBase} border-[#333333]`}
            onClick={() => handleSocialLogin('github')}
            disabled={isLoading}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-label="GitHub">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>Continue with GitHub</span>
          </button>
        </div>
        {/* divider: flex items-center with ::before/::after lines */}
        <div className="flex items-center my-6 text-xs text-muted-foreground uppercase tracking-widest before:flex-1 before:h-px before:bg-border after:flex-1 after:h-px after:bg-border">
          <span className="px-4">or use magic link</span>
        </div>
        {/* form: flex-col gap-5 */}
        <form className="flex flex-col gap-5" onSubmit={handleMagicLink}>
          <AuthFormFields email={email} setEmail={setEmail} />
          {/* message: padding 0.75rem, rounded-lg, text-sm, text-center — type classes from messageTypeClasses */}
          {message && (
            <div
              className={cn(
                'p-3 rounded-lg text-sm text-center mt-2',
                messageTypeClasses[message.type] || messageTypeClasses.info
              )}
            >
              {message.text}
            </div>
          )}
          {/* loginButton: primary bg, rounded-lg, p-[0.85rem], font-bold, hover:opacity-90, active:scale-[0.98], disabled:opacity-50 */}
          <button
            type="submit"
            className="mt-2 rounded-lg bg-primary text-primary-foreground p-[0.85rem] font-bold text-base cursor-pointer transition-opacity duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        {/* demoNote: mt-4 p-4 bg-primary/[5%] rounded-xl text-xs border border-primary/10 leading-relaxed text-muted-foreground */}
        <div className="mt-4 p-4 bg-primary/[5%] rounded-xl text-xs border border-primary/10 leading-relaxed text-muted-foreground">
          <ShieldCheck size={14} style={{ marginBottom: 4, color: 'hsl(var(--primary))' }} />
          <strong>Privacy Priority:</strong> We only store your wishlist and alert data. No
          passwords required.
        </div>
      </DialogContent>
    </Dialog>
  );
}
