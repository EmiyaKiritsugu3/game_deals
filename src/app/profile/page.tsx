import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

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
          <p className="text-base">{user.email ?? '—'}</p>
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
