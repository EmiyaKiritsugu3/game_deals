/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const subscribeAction = vi.hoisted(() =>
  vi.fn<(prev: unknown, formData: FormData) => Promise<{ ok: boolean; message: string }>>()
);
vi.mock('@/actions/subscribe', () => ({ subscribeAction }));

import { NewsletterSignup } from '@/components/newsletter-signup';

beforeEach(() => {
  subscribeAction.mockReset();
});

describe('NewsletterSignup', () => {
  it('renders email input and submit button', () => {
    render(<NewsletterSignup />);
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /inscrever/i })).toBeInTheDocument();
  });

  it('shows success message on ok state', async () => {
    subscribeAction.mockResolvedValueOnce({ ok: true, message: 'Inscrição registrada!' });
    const user = userEvent.setup();
    render(<NewsletterSignup />);
    await user.type(screen.getByLabelText(/e-mail/i), 'a@b.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Inscrição registrada!')
    );
  });

  it('shows error message on failure', async () => {
    subscribeAction.mockResolvedValueOnce({
      ok: false,
      message: 'Não foi possível enviar o e-mail agora. Tente mais tarde.',
    });
    const user = userEvent.setup();
    render(<NewsletterSignup />);
    // type="email" blocks invalid values client-side; use a valid one and let the action fail.
    await user.type(screen.getByLabelText(/e-mail/i), 'a@b.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Não foi possível enviar')
    );
  });

  it('disables button while pending', async () => {
    let resolveFn: (v: { ok: boolean; message: string }) => void = () => {};
    subscribeAction.mockReturnValueOnce(new Promise((r) => (resolveFn = r)));
    const user = userEvent.setup();
    render(<NewsletterSignup />);
    await user.type(screen.getByLabelText(/e-mail/i), 'a@b.com');
    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toBeDisabled();
    resolveFn({ ok: true, message: 'ok' });
    await waitFor(() => expect(screen.getByRole('button')).toBeEnabled());
  });
});
