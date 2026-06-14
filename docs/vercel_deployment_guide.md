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
2. Once finished, the **Cron Jobs** (the alert worker) will be detected automatically because of the `vercel.json` file.
3. To monitor executions, go to **Settings** > **Cron Jobs** in your project's Vercel dashboard.

## 5. Test the Alert Worker (Cron)
You can manually test if price tracking is working without waiting for the scheduled time:
1. Go to the **Functions** tab in the Vercel dashboard.
2. There you will see the execution log for `/api/cron/check-alerts`.
3. If you want to force an execution to test whether it finds alerts in your database, click the **Run** button on the Cron Jobs tab.

🚀 **Pro tip:** Once the site is live, you can configure a custom domain (e.g., `mycheapgames.com`) in **Settings** > **Domains**.

**Congratulations! GameDeals is officially live and monitoring deals!** 🎮💎
