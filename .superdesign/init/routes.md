# Routes

The React application currently has no router configuration. `app/frontend/src/main.tsx` mounts `App` at the root.

The product screen specification defines these authentication routes:

- `/login` → `LoginPage.tsx`
- `/register` → `RegisterPage.tsx`
- `/verify-email` → `EmailVerificationPage.tsx`
- `/forgot-password` → `ForgotPasswordPage.tsx`
- `/reset-password` → `ResetPasswordPage.tsx`
- `/auth/uit/callback` → `UitSsoCallbackPage.tsx`

## Current mount

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

