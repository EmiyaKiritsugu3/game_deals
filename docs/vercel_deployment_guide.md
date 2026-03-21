# Guia de Deploy: GameDeals na Vercel

Agora que o código está pronto e conectado ao Supabase, siga estes passos finais para colocar seu site no ar.

## 1. Subir para o GitHub
Certifique-se de que todos os arquivos (incluindo o novo `vercel.json`) foram enviados para o seu repositório Git.

```bash
git add .
git commit -m "chore: prepare production build for Vercel"
git push origin main
```

## 2. Importar o Projeto na Vercel
1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard).
2. Clique em **Add New...** > **Project**.
3. Importe o seu repositório `game-deals`.

## 3. Configurar Variáveis de Ambiente
Antes de clicar em "Deploy", abra a seção **Environment Variables** e adicione as 3 chaves que configuramos localmente:

| Chave | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Sua URL do Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sua anon public key |
| `CRON_SECRET` | A senha longa que você inventou |

## 4. Deploy e Cron Jobs
1. Clique em **Deploy**.
2. Uma vez finalizado, os **Cron Jobs** (o worker de alertas) serão detectados automaticamente por causa do arquivo `vercel.json`.
3. Para monitorar as execuções, vá na aba **Settings** > **Cron Jobs** no dashboard do seu projeto na Vercel.

## 5. Testar o Worker de Alertas (Cron)
Você pode testar manualmente se o rastreio de preços está funcionando sem esperar o horário agendado:
1. Vá na aba **Functions** no dashboard da Vercel.
2. Lá você verá o log de execução do `/api/cron/check-alerts`.
3. Se quiser forçar uma execução para testar se ele encontra os alertas no seu banco, você pode clicar no botão **Run** na aba de Cron Jobs.

🚀 **Dica de mestre:** Depois que o site estiver no ar, você pode configurar um domínio customizado (ex: `meusjogosbaratos.com`) na aba **Settings** > **Domains**.

**Parabéns! O GameDeals está oficialmente no ar e monitorando ofertas para transformar o mercado brasileiro de jogos.** 🎮💎
