Application web moderne de tontine (téléphone) avec **Next.js App Router**, **Tailwind CSS**, **Prisma** et **MongoDB (Atlas)**.

Espaces inclus :
- Admin : `/admin`
- Connexion participants : `/login`
- Participant 1 : `/p1` (protégé)
- Participant 2 : `/p2` (protégé)

Fonctionnalités clés :
- Règles : 2000 FCFA / jour, du lundi au vendredi, sur 1 mois (période seedée)
- Calculs automatiques : total payé, restant, jours restants, total général collecté
- Admin : tableau ✅/❌, retards en rouge, bouton “Paiement reçu”
- Temps réel : mise à jour via SSE (`/api/events`) + compte à rebours dynamique

## Getting Started

### 1) Installer les dépendances

```bash
npm install
```

### 2) Configurer la base (MongoDB Atlas)

Dans `.env`, définissez `DATABASE_URL` avec votre chaîne de connexion MongoDB Atlas.

```bash
npm run prisma:push
```

Si vous avez besoin de repartir de zéro (dev) :

```bash
npm run prisma:reset
```

### 3) Ajouter des données mockées

```bash
npm run db:seed
```

### 4) Lancer en dev

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Connexion (participants)

- Ouvrir `/login`
- Identifiants seed par défaut :
	- `admin` / `1518` (Admin)
	- `ibrahim` / `7482` (Participant 1)
	- `banel` / `5557` (Participant 2)

### Scripts utiles

```bash
npm run prisma:studio
npm run prisma:generate
npm run prisma:push
npm run prisma:reset
npm run lint
npm run build
```

Notes :
- Les routes API sont dans `src/app/api/*`.
- Prisma : `prisma/schema.prisma`, seed : `prisma/seed.js`.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
