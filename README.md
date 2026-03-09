# SplitzPay Manager App

Web application for Fund Managers and Company Admins to manage chit funds, run auctions, review KYC, and configure the marketplace.

**URL**: `manager.splitzpay.app`

## Stack
- React 18 + TypeScript + Vite
- Tailwind CSS (purple brand)
- Supabase (Auth, Database)
- React Router v6, TanStack Query, React Hook Form + Zod

## Roles
- **Company Admin** — Full access: create funds, manage team, marketplace, settings
- **Fund Manager** — Fund-scoped: members, auctions, documents, notifications

## Features
- Multi-company switcher in sidebar
- Create companies on signup
- Chit fund CRUD + one-click duplication (with/without members)
- Member approval workflow (invited → pending → approved)
- KYC document review (view, approve, reject with reason)
- Auction scheduling, starting, and winner selection
- Marketplace listing management (list/unlist, feature/unfeature)
- Per-fund notification config (10 event types via AWS SES)
- Team role management (admin → manager → member)
- Company settings

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
