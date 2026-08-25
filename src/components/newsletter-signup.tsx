'use client';

import { useActionState } from 'react';
import { type SubscribeState, subscribeAction } from '@/actions/subscribe';

/**
 * Newsletter signup form — client component wrapping the double-opt-in server action.
 */
export function NewsletterSignup() {
  const [state, formAction, pending] = useActionState<SubscribeState | null, FormData>(
    subscribeAction,
    null
  );

  return (
    <form action={formAction} className="flex w-full max-w-md flex-wrap gap-2">
      <input
        type="email"
        name="email"
        required
        placeholder="seu@email.com"
        aria-label="E-mail para newsletter"
        className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-cyan-400/60 focus:outline-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-cyan-950 transition hover:bg-cyan-300 disabled:opacity-50"
      >
        {pending ? 'Enviando…' : 'Inscrever'}
      </button>
      {state && !pending && (
        <p
          role="status"
          className={`w-full text-xs ${state.ok ? 'text-emerald-400' : 'text-red-400'}`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}
