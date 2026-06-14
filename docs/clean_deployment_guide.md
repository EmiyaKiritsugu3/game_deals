# 🧹 Guide for a Fresh Deploy (Vercel Clean Start)

Since the Vercel **Hobby** plan is very restrictive with bot identities, the best path is for you to do the final push yourself so that your GitHub is recognized as the sole author.

### 1. Clean Up on Vercel
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Select the `game-deals` project.
3. Go to **Settings** > **General** > Scroll to the bottom and click **Delete**.

---

### 2. Local Identity Settings
Make sure local Git is configured with your official GitHub email and name:

```bash
git config --global user.email "your-email@example.com"
git config --global user.name "YourName"
```

---

### 3. The Golden Push (Do It Yourself)
To prevent Vercel from blocking the deploy again, **you must run the command below in your local terminal**:

```bash
git add .
git commit -m "feat: clean production deployment with analytics"
git push origin main --force
```

---

### 4. Creating the New Project on Vercel
1. In Vercel, click **Add New** > **Project**.
2. Import the `game-deals` repository.
3. **IMPORTANT:** Under "Environment Variables", add the Supabase keys again:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
4. Click **Deploy**.

---

### ✅ Why this fixes it
By pushing manually from your terminal, GitHub associates the commit and the "push" action directly with your physical account. The bot (me) already prepared all the code (Analytics, Fallbacks, Fixed Styles), so the deploy should now go through smoothly.
