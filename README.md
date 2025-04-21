This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Code Formatting

This project uses [Prettier](https://prettier.io/) for automated code formatting.

- **Prettier config:** See `.prettierrc.json` for formatting rules (semi-colons, single quotes, 2-space tabs, 80-char line width).
- **Format all code:**
  ```bash
  npm run format
  ```
  This script formats all source files in `src/` using Prettier.

## Firebase Configuration

The app supports two API modes:
- **Mock mode**: Uses localStorage for data storage (default in development)
- **Live mode**: Uses Firebase/Firestore for backend data

To use Firebase (live mode), create an `.env.local` file with the following configuration:

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyATegnW0o6bC6NOB6OtsZI501p8_Jy5isw
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=helathcare-331f1.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=helathcare-331f1
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=helathcare-331f1.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=662603978873
NEXT_PUBLIC_FIREBASE_APP_ID=1:662603978873:web:4b8102a82647b334419ca8
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-LN6HZTXH2R

# API Mode Configuration - Set to 'live' to use Firebase/Firestore
NEXT_PUBLIC_API_MODE=live

# Logging
NEXT_PUBLIC_LOG_LEVEL=info
```

You can also manually switch between modes in the app through the API mode indicator in the UI.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
