### Task 5: Profile page — kill the 404

**Files:**
- Create: `src/app/profile/page.tsx`
- Create: `src/app/profile/__tests__/page.test.tsx`
- Modify: (none — PROTECTED_PATHS already includes /profile)

**Interfaces:**
- Consumes: `createClient()` from `@/utils/supabase/server` to get session user
- Produces: `/profile` page showing user email, provider, account creation date

- [ ] **Step 1: Create profile page**

```tsx
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/auth/auth-code-error');
  }

  const provider = user.identities?.[0]?.provider ?? 'email';
  const created = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="space-y-4">
        <div>
          <span className="text-sm text-muted-foreground">Email</span>
          <p className="text-base">{user.email}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Provider</span>
          <p className="text-base capitalize">{provider}</p>
        </div>
        <div>
          <span className="text-sm text-muted-foreground">Member since</span>
          <p className="text-base">{created}</p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create profile page test**

```tsx
/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ProfilePage from './page';

const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}));

const getUserMock = vi.fn();
vi.mock('@/utils/supabase/server', () => ({
  createClient: () => ({
    auth: {
      getUser: getUserMock,
    },
  }),
}));

describe('ProfilePage', () => {
  it('renders user info when authenticated', async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          email: 'test@example.com',
          created_at: '2024-06-01T00:00:00Z',
          identities: [{ provider: 'google' }],
        },
      },
      error: null,
    });

    render(await ProfilePage());

    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('google')).toBeInTheDocument();
    expect(screen.getByText(/June 1, 2024/)).toBeInTheDocument();
  });

  it('redirects when no user is returned', async () => {
    getUserMock.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    render(await ProfilePage());

    expect(redirectMock).toHaveBeenCalledWith('/auth/auth-code-error');
  });
});
```

- [ ] **Step 3: Run test**

Run: `pnpm vitest run src/app/profile/`
Expected: 2 passed, 0 failed

- [ ] **Step 4: Build check**

Run: `pnpm build`
Expected: Build succeeds, `/profile` route listed in output

- [ ] **Step 5: Commit**

```bash
git add src/app/profile/
git commit -m "feat(profile): kill 404 — basic profile page with user info"
```

---

