# UIT Server Discord design system

## Product context

UIT Server Discord is an account-based collaboration app with private servers, one shared chat per server, calls, a document library, and a moderated forum. The `/register` screen is for guests creating a personal account. The form collects only `full_name`, `email`, and `password`; successful registration directs the user to email verification.

## Visual direction

- Dark theme is the default.
- Use clean, modern, illustration-led compositions.
- Use flat vector and outline art with clear silhouettes.
- Do not use neon gradients, glassmorphism, or heavy shadows.
- Use indigo only for primary actions and active states.
- Use coral sparingly for community-oriented accents, not errors.
- Prefer borders and surface contrast over shadows.

## Tokens

- Canvas: `#0F1218`
- Surface: `#151A24`
- Raised surface: `#202737`
- Border: `#2B3445`
- Text primary: `#F4F6FA`
- Text secondary: `#B5BFCE`
- Text muted: `#7F8A9C`
- Primary: `#5B55B8`
- Primary hover: `#6A63C8`
- Focus ring: `#9B96E8`
- Coral accent: `#D47B72`
- Success: `#62B99C`
- Error: `#E17B87`

## Typography and layout

- Font stack: Inter, ui-sans-serif, system-ui, sans-serif.
- One `h1` per page, concise functional copy, sentence case.
- Form controls have a 48px minimum height and visible labels.
- Use an 8px radius for inputs and controls; use a 12px radius for major panels.
- Mobile is single-column; desktop uses an illustration panel beside the form.
- Maintain visible keyboard focus and WCAG AA contrast.
- Respect reduced-motion preferences.

## Registration content

- Page title: `Create your account`
- Fields: `Full name`, `Personal email`, `Password`
- Primary action: `Create account`
- Secondary route: `Sign in`
- Verification guidance: a verification link is sent after account creation.
- UIT email guidance: UIT accounts use UIT SSO from the login screen.

