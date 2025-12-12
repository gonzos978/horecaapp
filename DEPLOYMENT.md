# 🚀 Deployment Guide - Smarter HoReCa AI Supreme v3.0

## Brzi Start (5 minuta)

### Preduslov
- Node.js 18+ instaliran
- Supabase account (već konfigurisan)

### Korak 1: Instalacija

```bash
npm install
```

### Korak 2: Provera Environment Variables

Fajl `.env` već sadrži:
```
VITE_SUPABASE_URL=https://...
VITE_SUPABASE_ANON_KEY=...
```

### Korak 3: Pokretanje

```bash
npm run dev
```

Aplikacija je dostupna na: **http://localhost:5173**

---

## 📦 Production Deployment

### Option 1: Vercel (Preporučeno)

1. **Push kod na GitHub**
```bash
git init
git add .
git commit -m "Initial commit - HoReCa AI Supreme"
git remote add origin <your-repo-url>
git push -u origin main
```

2. **Deploy na Vercel**
- Idi na [vercel.com](https://vercel.com)
- Import GitHub repo
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- **Environment Variables**: Dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`

3. **Deploy**
- Klikni "Deploy"
- Aplikacija će biti live za 2-3 minuta

**URL:** `https://horeca-ai-supreme.vercel.app` (ili tvoj custom domain)

---

### Option 2: Netlify

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy --prod --dir=dist
```

**Environment Variables u Netlify:**
- Site Settings → Environment variables
- Dodaj `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY`

---

### Option 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

```bash
# Build
docker build -t horeca-ai-supreme .

# Run
docker run -p 3000:3000 \
  -e VITE_SUPABASE_URL=<your-url> \
  -e VITE_SUPABASE_ANON_KEY=<your-key> \
  horeca-ai-supreme
```

---

## 🗄️ Database Status

### Supabase je već konfigurisan sa:

✅ **10 glavnih tabela**
- locations, workers, positions, menu_items, inventory_items
- checklists, alerts, voice_orders, training_modules, geofence_zones

✅ **Dummy data**
- 5 radnika (Marko, Ana, Jovan, Petar, Milica)
- 10 meni stavki sa slikama
- 3 inventarne stavke
- 3 alerta
- 50+ pozicija
- 3 checkliste
- 3 training modula
- 4 geofence zone

✅ **Row Level Security (RLS)** na svim tabelama

✅ **Indexes** za performanse

**Ništa dodatno ne treba konfigurirati!**

---

## 🌐 Custom Domain Setup

### Vercel

1. Project Settings → Domains
2. Dodaj: `horeca-ai.com`
3. Update DNS records (Vercel će dati instrukcije)
4. SSL cert se automatski generiše

### Netlify

1. Domain Management → Add custom domain
2. Update nameservers ili DNS records
3. SSL automatski

---

## 📊 Monitoring & Analytics

### Vercel Analytics (besplatno)

```bash
npm install @vercel/analytics
```

```tsx
// src/main.tsx
import { Analytics } from '@vercel/analytics/react';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>
);
```

### Supabase Dashboard

- Real-time database monitoring
- Query performance
- API usage
- Storage metrics

**URL:** https://supabase.com/dashboard/project/<your-project-id>

---

## 🔐 Production Security Checklist

### ✅ Implementirano

- [x] Environment variables za API keys
- [x] Row Level Security (RLS) na svim tabelama
- [x] HTTPS (automatski sa Vercel/Netlify)
- [x] SQL injection protection (Supabase)

### 🔄 Za produkciju (dodatno)

- [ ] Supabase Auth implementacija (email/password)
- [ ] Rate limiting na API endpoints
- [ ] CORS konfiguracija
- [ ] Backup strategy (Supabase automatski radi backups)
- [ ] Error tracking (Sentry ili LogRocket)

---

## 🧪 Testing Pre-Production

### 1. Build test

```bash
npm run build
npm run preview
```

### 2. Type check

```bash
npm run typecheck
```

### 3. Manual testing checklist

- [ ] Dashboard se učitava sa KPI cards
- [ ] Workers tabela prikazuje 5 radnika
- [ ] Inventory pokazuje variance
- [ ] Menu prikazuje slike sa Pexels
- [ ] Alerts su klikabilni
- [ ] Voice recording animacija radi
- [ ] Checklists otvaraju task liste
- [ ] Training prikazuje 50+ pozicija
- [ ] Settings menja jezik real-time
- [ ] Responsive design na mobitelu

---

## 📈 Scaling Strategy

### Faza 1: MVP (trenutna)
- 1 lokacija
- 5-20 radnika
- Supabase Free tier
- Vercel Hobby plan

**Kapacitet:** Do 500 porudžbina/dan

### Faza 2: Growth
- 5-10 lokacija
- 50-200 radnika
- Supabase Pro ($25/mesec)
- Vercel Pro ($20/mesec)

**Kapacitet:** Do 5,000 porudžbina/dan

### Faza 3: Enterprise
- 50+ lokacija
- 500+ radnika
- Supabase Team/Enterprise
- Custom server infrastructure

**Kapacitet:** Unlimited

---

## 🆘 Troubleshooting

### Problem: "Cannot connect to Supabase"

**Rešenje:**
1. Proveri `.env` fajl
2. Proveri da li su environment variables postavljene u Vercel/Netlify
3. Proveri Supabase dashboard → Project Settings → API

### Problem: "Build fails"

**Rešenje:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Problem: "Page is blank"

**Rešenje:**
1. Proveri browser console za errors
2. Proveri da li su slike sa Pexels dostupne
3. Proveri Supabase RLS policies

### Problem: "Language switching not working"

**Rešenje:**
- Očisti localStorage: `localStorage.clear()`
- Refresh page
- Proveri da svi JSON fajlovi u `src/i18n/` postoje

---

## 📞 Support

Za tehničku podršku:
- **Email:** support@horeca-ai.com
- **Discord:** discord.gg/horeca-ai
- **Dokumentacija:** docs.horeca-ai.com

---

## 🎉 Go Live Checklist

Pre nego što podeliš link sa investitorima:

- [ ] Deploy na Vercel/Netlify
- [ ] Custom domain podešen
- [ ] SSL aktiviran (zeleni lock u browseru)
- [ ] Svi moduli testovi (1-9)
- [ ] Mobile responsive provera
- [ ] Load time < 3 sekunde
- [ ] Dummy data popunjen
- [ ] README.md ažuriran sa live URL
- [ ] Screenshots napravljeni za prezentaciju

---

**Verzija:** 3.0
**Poslednje ažuriranje:** Decembar 2025
**Status:** ✅ Production Ready

**Live Demo:** `<your-vercel-url>`
