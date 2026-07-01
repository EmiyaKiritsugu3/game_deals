'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  /** How the user signed in: "magic-link" | "google" | "github" | "discord". */
  provider: 'magic-link' | 'google' | 'github' | 'discord';
  signedInAt: number;
}

export type AuthDialogView = 'closed' | 'sign-in' | 'code-entry' | 'success';

interface AuthState {
  user: AuthUser | null;
  /** Current dialog view. Drives the multi-step magic-link flow. */
  dialogView: AuthDialogView;
  /** The email being used in the current magic-link flow (kept here so the
   *  code-entry step can submit it alongside the OTP without prop-drilling). */
  pendingEmail: string | null;
  /** The dev-mode code returned by the API (in production this would come
   *  via email; in dev we surface it so the flow is testable). */
  devCode: string | null;
  /** The magic-link click-through URL (dual-path: users can either click
   *  this link OR enter the 6-digit code manually). */
  magicLinkUrl: string | null;
  /** When the pending link expires (Unix ms). Drives the countdown timer. */
  expiresAt: number | null;

  setUser: (user: AuthUser | null) => void;
  signOut: () => void;
  setDialogView: (view: AuthDialogView) => void;
  setPendingEmail: (email: string | null) => void;
  setDevCode: (code: string | null) => void;
  setMagicLinkUrl: (url: string | null) => void;
  setExpiresAt: (ts: number | null) => void;
  openDialog: () => void;
  closeDialog: () => void;
  resetFlow: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      dialogView: 'closed',
      pendingEmail: null,
      devCode: null,
      magicLinkUrl: null,
      expiresAt: null,

      setUser: (user) => set({ user }),
      signOut: () => set({ user: null }),
      setDialogView: (dialogView) => set({ dialogView }),
      setPendingEmail: (pendingEmail) => set({ pendingEmail }),
      setDevCode: (devCode) => set({ devCode }),
      setMagicLinkUrl: (magicLinkUrl) => set({ magicLinkUrl }),
      setExpiresAt: (expiresAt) => set({ expiresAt }),
      openDialog: () =>
        set({
          dialogView: 'sign-in',
          pendingEmail: null,
          devCode: null,
          magicLinkUrl: null,
          expiresAt: null,
        }),
      closeDialog: () => set({ dialogView: 'closed' }),
      resetFlow: () =>
        set({
          dialogView: 'sign-in',
          pendingEmail: null,
          devCode: null,
          magicLinkUrl: null,
          expiresAt: null,
        }),
    }),
    {
      name: 'dealforge-auth',
      // Only persist the user — dialog state is ephemeral.
      partialize: (s) => ({ user: s.user }),
    }
  )
);
