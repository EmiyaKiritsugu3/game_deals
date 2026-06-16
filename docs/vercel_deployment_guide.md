# Vercel Deployment Guide — GameDeals

Now that the code is ready and connected to Supabase, follow these final steps to get your site live.

## 1. Push to GitHub
Make sure all files (including the new `vercel.json`) have been pushed to your Git repository.

```bash
git add .
git commit -m "chore: prepare production build for Vercel"
git push origin main
```

## 2. Import the Project on Vercel
1. Go to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** > **Project**.
3. Import your `game-deals` repository.

## 3. Configure Environment Variables
Before clicking "Deploy", open the **Environment Variables** section and add the 3 keys we configured locally:

| Key | Value |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your anon public key |
| `CRON_SECRET` | The long password you created |

## 4. Deploy and Cron Jobs
1. Click **Deploy**.
2. Cron scheduling is handled by **GitHub Actions** (`.github/workflows/cron.yml`), not Vercel.
3. The API endpoints run on Vercel and are called by GitHub Actions via HTTP with `CRON_SECRET` auth.
4. To monitor cron executions, go to **GitHub > Actions > Cron Jobs**.
5. To trigger manually: `gh workflow run cron.yml`

## 5. Test the Alert Worker (Cron)
You can manually test if price tracking is working without waiting for the scheduled time:
1. Open **GitHub > Actions > Cron Jobs**.
2. Click **Run workflow > Run workflow** (uses `workflow_dispatch`).
3. Or trigger locally:
   ```bash
   curl -v http://localhost:3000/api/cron/check-alerts \
     -H "authorization: Bearer $CRON_SECRET"
   ```
4. Check the execution logs in GitHub Actions tab.

🚀 **Pro tip:** Once the site is live, you can configure a custom domain (e.g., `mycheapgames.com`) in **Settings** > **Domains**.

**Congratulations! GameDeals is officially live and monitoring deals!** 🎮💎
