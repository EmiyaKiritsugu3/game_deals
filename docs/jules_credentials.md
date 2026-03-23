# 🔐 Credenciais de Desenvolvimento (Para o Jules)

> [!CAUTION]
> **APENAS PARA O JULES:** Estas são as chaves reais de conexão com o banco de dados e serviços do GameDeals. Mantenha este arquivo seguro e **NÃO** o versione no Git público.

### 📄 Conteúdo do `.env.local`
Para rodar o projeto localmente, crie um arquivo `.env.local` na raiz e cole o seguinte:

```bash
# Supabase Connectivity
NEXT_PUBLIC_SUPABASE_URL=https://scsbermcpukyxfwcuvls.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_RlZprDRympNTMUTJRmbqsQ_oTEM4fcF

# Backend Secrets
CRON_SECRET=G4m3D3als_S3cr3t_2026
```

### 🛠️ Como usar:
1.  Certifique-se de que o Jules tenha o Node.js v18+ instalado.
2.  Após clonar o repo, ele deve rodar `npm install`.
3.  Criar o arquivo `.env.local` com as chaves acima.
4.  Rodar `npm run dev` para iniciar o motor social.

---
*Documento gerado em 21 de Março de 2026.*
