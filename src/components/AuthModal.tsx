'use client';

import { useState } from 'react';
import { Mail, ShieldCheck, Github, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import Modal from '@/components/Modal';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleSocialLogin = async (provider: 'google' | 'discord' | 'github') => {
        setIsLoading(true);
        if (!supabase) return setIsLoading(false);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            }
        });
        if (error) {
            setMessage({ type: 'error', text: error.message });
            setIsLoading(false);
        }
    };

    const handleMagicLink = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage(null);

        if (!supabase) return setIsLoading(false);

        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: {
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            }
        });

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setMessage({ type: 'success', text: 'Check your email for the magic link!' });
        }
        setIsLoading(false);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} maxWidth="420px">
            <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-2xl font-black text-white">🚀 Welcome to GameDeals</h2>
                <p className="text-sm font-medium text-muted-foreground">Sign in to track price drops and sync your wishlist across all devices.</p>
            </div>

                        <div className="flex flex-col gap-3">
                            <button 
                                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3 font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10 hover:shadow-lg disabled:pointer-events-none disabled:opacity-50"
                                onClick={() => handleSocialLogin('google')}
                                disabled={isLoading}
                            >
                                <Globe size={20} className="text-brand-google" />
                                <span>Continue with Google</span>
                            </button>
                            <button 
                                className="group flex w-full items-center justify-center gap-3 rounded-xl border border-brand-discord/30 bg-brand-discord/10 py-3 font-bold text-brand-discord transition-all hover:-translate-y-0.5 hover:bg-brand-discord/20 hover:shadow-lg hover:shadow-brand-discord/20 disabled:pointer-events-none disabled:opacity-50"
                                onClick={() => handleSocialLogin('discord')}
                                disabled={isLoading}
                            >
                                <Github size={20} />
                                <span>Continue with Discord</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground before:h-px before:flex-1 before:bg-white/10 after:h-px after:flex-1 after:bg-white/10">
                            <span>or use magic link</span>
                        </div>

                        <form className="flex flex-col gap-4" onSubmit={handleMagicLink}>
                            <div className="flex flex-col gap-2">
                                <label htmlFor="email" className="text-sm font-bold text-white">Email Address</label>
                                <div className="relative">
                                    <input 
                                        type="email" 
                                        id="email"
                                        placeholder="your@email.com"
                                        className="w-full rounded-xl border border-white/10 bg-black/40 py-3 pl-4 pr-10 font-medium text-white placeholder-muted-foreground outline-none transition-colors focus:border-primary focus:bg-black/60 focus:ring-1 focus:ring-primary disabled:opacity-50"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={isLoading}
                                    />
                                    <Mail size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                </div>
                            </div>

                            {message && (
                                <div className={cn(
                                    "rounded-xl border p-3 text-center text-sm font-bold",
                                    message.type === 'error' ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-primary/30 bg-primary/10 text-primary"
                                )}>
                                    {message.text}
                                </div>
                            )}

                            <button type="submit" className="w-full rounded-xl bg-primary py-3 font-black text-primary-foreground shadow-[0_0_15px_hsl(var(--primary)/0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_hsl(var(--primary)/0.5)] active:scale-95 disabled:pointer-events-none disabled:opacity-50" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send Magic Link'}
                            </button>
                        </form>

            <div className="mt-2 flex flex-col items-center gap-2 rounded-xl bg-black/20 p-4 text-center text-xs font-medium leading-relaxed text-muted-foreground">
                <ShieldCheck size={20} className="text-primary" />
                <p><strong>Privacy Priority:</strong> We only store your wishlist and alert data. No passwords required.</p>
            </div>
        </Modal>
    );
}
