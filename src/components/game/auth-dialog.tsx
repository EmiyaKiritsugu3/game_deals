'use client';

import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock,
  Copy,
  Loader2,
  Mail,
  Mailbox,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import * as React from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { cn } from '@/lib/utils';
import { type AuthDialogView, type AuthUser, useAuth } from '@/store/auth';
import { AuthBrandPanel } from './auth-brand-panel';
import { SocialLoginButtons, type SocialProvider } from './social-login-buttons';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthDialog() {
  const dialogView = useAuth((s) => s.dialogView);
  const setDialogView = useAuth((s) => s.setDialogView);
  const closeDialog = useAuth((s) => s.closeDialog);
  const setUser = useAuth((s) => s.setUser);

  const open = dialogView !== 'closed';
  const view = dialogView as Exclude<AuthDialogView, 'closed'>;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) closeDialog();
      }}
    >
      <DialogContent className="glass-strong overflow-hidden border-border/60 p-0 sm:max-w-[920px] sm:rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Sign in to DEALFORGE</DialogTitle>
          <DialogDescription>
            Passwordless sign-in with magic link or social providers.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr]">
          <AuthBrandPanel />

          {/* Right: form panel */}
          <div className="relative flex min-h-[560px] flex-col p-6 sm:p-8">
            {view === 'sign-in' && <SignInForm onSuccess={setUser} />}
            {view === 'code-entry' && (
              <CodeEntryForm onSuccess={setUser} onBack={() => setDialogView('sign-in')} />
            )}
            {view === 'success' && (
              <SuccessState user={useAuth.getState().user} onDone={closeDialog} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */
/*                                SIGN-IN VIEW                                */
/* -------------------------------------------------------------------------- */

function SignInForm({
  onSuccess,
}: {
  onSuccess: (user: NonNullable<ReturnType<typeof useAuth.getState>['user']>) => void;
}) {
  const setDialogView = useAuth((s) => s.setDialogView);
  const setPendingEmail = useAuth((s) => s.setPendingEmail);
  const setDevCode = useAuth((s) => s.setDevCode);
  const setMagicLinkUrl = useAuth((s) => s.setMagicLinkUrl);
  const setExpiresAt = useAuth((s) => s.setExpiresAt);

  const [email, setEmail] = React.useState('');
  const [touched, setTouched] = React.useState(false);
  const [sendingLink, setSendingLink] = React.useState(false);
  const [socialLoading, setSocialLoading] = React.useState<SocialProvider | null>(null);

  const emailValid = EMAIL_RE.test(email.trim());
  const emailError = touched && !emailValid && email.length > 0;

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!emailValid || sendingLink) return;

    setSendingLink(true);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      // biome-ignore lint/suspicious/noExplicitAny: API response shape varies
      const data: any = await res.json();
      if (!res.ok || !data.ok) {
        toast.error((data.error as string) || 'Could not send magic link. Please try again.');
        return;
      }
      setPendingEmail(email.trim());
      if (data.devCode) setDevCode(data.devCode);
      if (data.magicLinkUrl) setMagicLinkUrl(data.magicLinkUrl);
      if (data.expiresIn) setExpiresAt(Date.now() + data.expiresIn);
      setDialogView('code-entry');
      toast.success('Magic link sent', {
        description: `Check ${email.trim()} for your code.`,
      });
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSendingLink(false);
    }
  };

  const handleSocial = async (provider: SocialProvider) => {
    setSocialLoading(provider);
    try {
      const res = await fetch('/api/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        devCode?: string;
        magicLinkUrl?: string;
        expiresIn?: number;
        user?: {
          id: string;
          email: string;
          name: string;
          avatar?: string;
          provider: string;
          signedInAt: number;
        };
      };
      if (!res.ok || !data.ok || !data.user) {
        toast.error((data.error as string) || `Could not sign in with ${provider}.`);
        return;
      }
      onSuccess(data.user as AuthUser);
      setDialogView('success');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col animate-fade-between" key="sign-in">
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Sparkles className="size-3.5" />
          Welcome back
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Sign in to <span className="text-gradient-emerald">DEALFORGE</span>
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          No password needed — we'll email you a magic link.
        </p>
      </div>

      {/* Social login */}
      <div className="mb-5">
        <SocialLoginButtons
          onSignIn={handleSocial}
          loading={socialLoading}
          disabled={sendingLink}
        />
      </div>

      {/* Divider */}
      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/40" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            or use email
          </span>
        </div>
      </div>

      {/* Magic-link form */}
      <form onSubmit={handleSendLink} className="flex flex-1 flex-col">
        <div className="space-y-1.5">
          <label
            htmlFor="auth-email"
            className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Email address
          </label>
          <div className="relative">
            <Mail
              className={cn(
                'pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 transition-colors',
                emailValid ? 'text-primary' : 'text-muted-foreground'
              )}
            />
            <input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="you@example.com"
              aria-invalid={emailError}
              aria-describedby={emailError ? 'auth-email-error' : undefined}
              disabled={sendingLink}
              className={cn(
                'h-12 w-full rounded-xl border bg-card/40 pl-10 pr-4 text-sm backdrop-blur-md transition-all',
                'placeholder:text-muted-foreground/60',
                'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50',
                'disabled:cursor-not-allowed disabled:opacity-60',
                emailError
                  ? 'border-destructive/60 focus:ring-destructive/30 focus:border-destructive'
                  : 'border-border/50'
              )}
            />
          </div>
          {emailError && (
            <p id="auth-email-error" className="text-xs text-destructive" role="alert">
              Please enter a valid email address.
            </p>
          )}
        </div>

        <div className="mt-auto pt-6">
          <button
            type="submit"
            disabled={!emailValid || sendingLink}
            className={cn(
              'group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold transition-all duration-300',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'sheen',
              emailValid && !sendingLink
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 hover:shadow-primary/50 hover:-translate-y-0.5'
                : 'cursor-not-allowed bg-muted/60 text-muted-foreground'
            )}
          >
            {sendingLink ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Sending magic link…
              </>
            ) : (
              <>
                Send magic link
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </button>

          {/* Privacy microcopy */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
            <ShieldCheck className="size-3 text-primary" />
            We never store passwords. Read our{' '}
            <a
              href="/privacy"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              privacy policy
            </a>
            .
          </p>
        </div>
      </form>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              CODE-ENTRY VIEW                               */
/* -------------------------------------------------------------------------- */

function CodeEntryForm({
  onSuccess: _onSuccess,
  onBack,
}: {
  onSuccess: (user: NonNullable<ReturnType<typeof useAuth.getState>['user']>) => void;
  onBack: () => void;
}) {
  const pendingEmail = useAuth((s) => s.pendingEmail);
  const devCode = useAuth((s) => s.devCode);
  const magicLinkUrl = useAuth((s) => s.magicLinkUrl);
  const expiresAt = useAuth((s) => s.expiresAt);
  const setDialogView = useAuth((s) => s.setDialogView);
  const setDevCode = useAuth((s) => s.setDevCode);
  const setMagicLinkUrl = useAuth((s) => s.setMagicLinkUrl);
  const setExpiresAt = useAuth((s) => s.setExpiresAt);

  const [code, setCode] = React.useState('');
  const [verifying, setVerifying] = React.useState(false);
  const [linkLoading, setLinkLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [resendCooldown, setResendCooldown] = React.useState(0);
  const [remainingMs, setRemainingMs] = React.useState(0);

  // Countdown timer — updates every second, drives the urgency color shift.
  React.useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const diff = Math.max(0, expiresAt - Date.now());
      setRemainingMs(diff);
      if (diff === 0) {
        setError('This link has expired. Please request a new one.');
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  // Resend cooldown timer
  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = setInterval(() => setResendCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [resendCooldown]);

  const verify = async (codeValue: string) => {
    if (!pendingEmail) return;
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, code: codeValue }),
      });
      // biome-ignore lint/suspicious/noExplicitAny: runtime JSON response
      const d: any = await res.json();
      if (!res.ok || !d.ok || !d.user) {
        setCode(''); // clear so user can re-enter
        return;
      }
      setDialogView('success');
    } catch {
      setError('Network error. Please try again.');
      setCode('');
    } finally {
      setVerifying(false);
    }
  };

  // Auto-submit when 6 digits entered
  React.useEffect(() => {
    if (code.length === 6 && !verifying) {
      void verify(code);
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: verify is useCallback-stable
  }, [code, verifying, verify]);

  // Click-through magic link path (the "fast" option)
  const handleMagicLinkClick = async () => {
    if (!pendingEmail || !magicLinkUrl || linkLoading || remainingMs === 0) return;
    setLinkLoading(true);
    setError(null);
    try {
      // Extract token from the magicLinkUrl query string and POST it to verify-link
      const url = new URL(magicLinkUrl, window.location.origin);
      const token = url.searchParams.get('token') || '';
      const res = await fetch('/api/auth/verify-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail, token }),
      });
      // biome-ignore lint/suspicious/noExplicitAny: runtime JSON response
      const d: any = await res.json();
      if (!res.ok || !d.ok || !d.user) {
        setError(d.error?.toString() || 'This magic link is invalid. Please use the code instead.');
        return;
      }
      setDialogView('success');
    } catch {
      setError('Network error. Please try the code instead.');
    } finally {
      setLinkLoading(false);
    }
  };

  const handleResend = async () => {
    if (!pendingEmail || resendCooldown > 0) return;
    setResendCooldown(30);
    try {
      const res = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        devCode?: string;
        magicLinkUrl?: string;
        expiresIn?: number;
      };
      if (data.ok) {
        if (data.devCode) setDevCode(data.devCode);
        if (data.magicLinkUrl) setMagicLinkUrl(data.magicLinkUrl);
        if (data.expiresIn) setExpiresAt(Date.now() + data.expiresIn);
        setCode('');
        setError(null);
        toast.success('New link sent', {
          description: `Check ${pendingEmail}.`,
        });
      }
    } catch {
      toast.error('Could not resend. Try again.');
      setResendCooldown(0);
    }
  };

  const copyDevCode = async () => {
    if (!devCode) return;
    try {
      await navigator.clipboard.writeText(devCode);
      setCopied(true);
      toast.success('Code copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  };

  // Format the countdown as M:SS
  const mins = Math.floor(remainingMs / 60_000);
  const secs = Math.floor((remainingMs % 60_000) / 1000);
  const countdownLabel = `${mins}:${String(secs).padStart(2, '0')}`;
  const isUrgent = remainingMs > 0 && remainingMs < 60_000; // < 1 min = urgent (amber/red)
  const isExpired = remainingMs === 0;

  return (
    <div className="flex flex-1 flex-col animate-fade-between" key="code-entry">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex w-fit items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded"
      >
        <ChevronLeft className="size-3.5" />
        Back
      </button>

      <div className="mb-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
          <Mail className="size-3.5" />
          Check your inbox
        </div>
        <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
          Verify it&apos;s <span className="text-gradient-emerald">you</span>
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We sent a magic link to{' '}
          <span className="font-semibold text-foreground">{pendingEmail}</span>. Click the link for
          instant access, or enter the code below.
        </p>
      </div>

      {/* Countdown timer — creates urgency + shows freshness */}
      <div
        className={cn(
          'mb-4 flex items-center justify-between rounded-xl border px-3 py-2 text-xs transition-colors',
          isExpired
            ? 'border-destructive/40 bg-destructive/10 text-destructive'
            : isUrgent
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
              : 'border-border/40 bg-card/30 text-muted-foreground'
        )}
        aria-live="polite"
      >
        <span className="inline-flex items-center gap-1.5">
          <Clock className="size-3.5" />
          {isExpired ? 'Link expired' : 'Link expires in'}
        </span>
        {!isExpired && (
          <span className={cn('font-mono font-bold tabular-nums', isUrgent && 'animate-pulse')}>
            {countdownLabel}
          </span>
        )}
      </div>

      {/* PRIMARY PATH: Click the magic link (fastest) */}
      <button
        type="button"
        onClick={handleMagicLinkClick}
        disabled={linkLoading || verifying || isExpired}
        className={cn(
          'group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold transition-all duration-300',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'sheen',
          !linkLoading && !isExpired
            ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:brightness-110 hover:shadow-primary/50 hover:-translate-y-0.5'
            : 'cursor-not-allowed bg-muted/60 text-muted-foreground'
        )}
        aria-label="Open the magic link to sign in instantly"
      >
        {linkLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Opening magic link…
          </>
        ) : (
          <>
            <Mailbox className="size-4" />
            Open magic link
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </>
        )}
      </button>

      {/* Divider */}
      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border/40" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-card px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            or enter code
          </span>
        </div>
      </div>

      {/* SECONDARY PATH: Enter the 6-digit code (bank-style security) */}
      <div className="flex flex-col items-center">
        <InputOTP
          maxLength={6}
          value={code}
          onChange={(v) => {
            setError(null);
            setCode(v);
          }}
          disabled={verifying || isExpired}
          containerClassName="justify-center"
          aria-label="6-digit magic code"
        >
          <InputOTPGroup className="gap-1.5">
            {Array.from({ length: 6 }, (_, i) => i).map((i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className={cn(
                  'size-11 rounded-lg border border-border/50 bg-card/40 text-base font-bold tabular-nums backdrop-blur-md transition-all',
                  'data-[active=true]:border-primary/60 data-[active=true]:ring-primary/30 data-[active=true]:ring-[3px]',
                  (verifying || isExpired) && 'opacity-60'
                )}
              />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {/* Status row */}
        <div
          className="mt-3 flex min-h-[20px] items-center justify-center gap-1.5 text-sm"
          aria-live="polite"
        >
          {verifying ? (
            <span className="inline-flex items-center gap-1.5 text-primary">
              <Loader2 className="size-4 animate-spin" />
              Verifying…
            </span>
          ) : error ? (
            <span className="text-destructive" role="alert">
              {error}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">
              {code.length === 6 ? 'Verifying…' : `${code.length}/6 digits entered`}
            </span>
          )}
        </div>
      </div>

      {/* Dev-mode helper (only shown when API returns devCode) */}
      {devCode && !isExpired && (
        <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            <Sparkles className="size-3" />
            Demo mode
          </p>
          <p className="mt-1 text-xs text-amber-200/80">Your magic code:</p>
          <div className="mt-1.5 flex items-center gap-2">
            <code className="font-mono text-lg font-bold tracking-[0.3em] text-amber-300">
              {devCode}
            </code>
            <button
              type="button"
              onClick={copyDevCode}
              className="inline-flex size-7 items-center justify-center rounded-md border border-amber-400/40 bg-amber-500/10 text-amber-300 transition-all hover:bg-amber-500/20"
              aria-label="Copy code"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </button>
          </div>
        </div>
      )}

      {/* Footer actions */}
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Didn&apos;t receive it?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className={cn(
              'font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:rounded',
              resendCooldown > 0
                ? 'cursor-not-allowed text-muted-foreground/60'
                : 'text-primary hover:underline'
            )}
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend link'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               SUCCESS VIEW                                 */
/* -------------------------------------------------------------------------- */

function SuccessState({
  user,
  onDone,
}: {
  user: NonNullable<ReturnType<typeof useAuth.getState>['user']> | null;
  onDone: () => void;
}) {
  // Auto-dismiss after 2.5s
  React.useEffect(() => {
    const id = setTimeout(onDone, 2500);
    return () => clearTimeout(id);
  }, [onDone]);

  const firstName = user?.name?.split(' ')[0] || 'Gamer';

  return (
    <div
      className="flex flex-1 flex-col items-center justify-center text-center animate-fade-between"
      key="success"
    >
      {/* Animated success check */}
      <div className="relative">
        <span className="absolute inset-0 -m-4 rounded-full bg-primary/20 blur-2xl animate-glow-pulse" />
        <svg
          viewBox="0 0 52 52"
          className="size-20 relative"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            cx="26"
            cy="26"
            r="24"
            stroke="oklch(0.78 0.2 145)"
            strokeWidth="2"
            opacity="0.3"
          />
          <circle
            cx="26"
            cy="26"
            r="24"
            stroke="oklch(0.78 0.2 145)"
            strokeWidth="2"
            strokeDasharray="151"
            strokeDashoffset="0"
            className="animate-check-draw"
            style={{ transformOrigin: 'center' }}
          />
          <path
            d="M16 27 L23 34 L36 19"
            stroke="oklch(0.78 0.2 145)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-check-draw"
          />
        </svg>
      </div>

      <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl animate-fade-in-up">
        Welcome, <span className="text-gradient-emerald">{firstName}</span>!
      </h2>
      <p
        className="mt-1.5 text-sm text-muted-foreground animate-fade-in-up"
        style={{ animationDelay: '100ms' }}
      >
        You're signed in. Your wishlist will now sync across devices.
      </p>

      {/* Auto-dismiss progress bar */}
      <div className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-border/40">
        <div
          className="h-full bg-gradient-to-r from-primary to-emerald-400"
          style={{
            // duplicated, removed
            transformOrigin: 'left',
            // Re-use the bar-grow keyframe to scaleX 0→1 over 2.5s
            animation: 'bar-grow 2.5s linear forwards',
          }}
        />
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        Taking you back…
      </p>
    </div>
  );
}
