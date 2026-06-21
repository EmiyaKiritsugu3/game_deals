---
title: ActivityFeed Layout Fix (SUPERSEDED)
type: fix-report
status: superseded
scope: project
tags:
  - activity-feed
  - layout-fix
  - archived
related:
  - manual/06-feature-components
updated: "2026-06-21"
---

# 🛠️ ActivityFeed Layout Fix (Social Phase)

Este guia resolve o problema de overflow de imagens e a confusão com o Tailwind CSS que o **Jules** está enfrentando. 

Como o projeto utiliza **CSS Modules**, o Jules deve evitar classes globais do Tailwind e usar o arquivo `.module.css` dedicado.

---

## 📝 Copie e mande para o Jules:

> **Jules, aqui está a correção para o `ActivityFeed`:**
> 
> O projeto **GameDeals** utiliza estritamente **Vanilla CSS via CSS Modules**. Para evitar que as imagens quebrem o layout ou fiquem gigantes, use esta estrutura refinada:

### 1. No arquivo `ActivityFeed.module.css`:
```css
.activityContainer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 2rem;
}

.activityCard {
  display: flex;
  gap: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 1rem;
  transition: transform 0.2s ease;
  overflow: hidden; /* CORTA qualquer sobra de imagem */
}

.avatarContainer {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden; /* Garante que o avatar seja redondo e contido */
  border: 2px solid var(--accent-light);
}

.gameThumbContainer {
  flex-shrink: 0;
  width: 120px;
  height: 68px;
  border-radius: 8px;
  overflow: hidden;
  position: relative; /* Importante para o Next/Image 'fill' */
}

.imageContent {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.content {
  flex: 1;
  min-width: 0; /* Previne que o texto quebre o layout flex */
}

.username {
  color: var(--accent-light);
  font-weight: 600;
  font-size: 0.9rem;
}

.reviewText {
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.5;
  margin-top: 0.5rem;
}
```

### 2. No arquivo `ActivityFeed.tsx` (Use `Next/Image` com `object-fit`):
```tsx
import Image from 'next/image';
import styles from './ActivityFeed.module.css';

export default function ActivityItem({ user, game, review }) {
  return (
    <div className={styles.activityCard}>
      <div className={styles.avatarContainer}>
        <Image 
          src={user.avatar} 
          alt={user.name} 
          width={48} 
          height={48} 
          className={styles.imageContent}
        />
      </div>
      
      <div className={styles.content}>
        <span className={styles.username}>{user.name}</span>
        <p className={styles.reviewText}>{review}</p>
      </div>

      <div className={styles.gameThumbContainer}>
        <Image 
          src={game.thumb} 
          alt={game.title} 
          fill 
          className={styles.imageContent} 
        />
      </div>
    </div>
  );
}
```

---

## 🚩 Nota para o Jules sobre o Build da Vercel:
A correção do erro no build da Vercel já foi feita na branch `main` (utilizando um `try/catch` de fallback no de `api.ts` e forçando `dynamic = 'force-dynamic'`). Por favor, faça um `git pull origin main` dentro da sua branch para não sofrer com commits desatualizados. 🚀
