# Emerald POS — Design System & UI/UX Specification

A clean, modern **POS & Inventory Management dashboard** built with Next.js 16, React, and Tailwind CSS v4. Red/white brand palette with full dark/light mode support, `rounded-2xl` corners, and smooth hover animations.

---

## 1. Design Direction

| Principle | Decision |
|-----------|----------|
| **Aesthetic** | Clean, modern, professional retail/F&B POS |
| **Corner radius** | `--radius: 1rem` base — cards use `rounded-2xl` / `rounded-3xl` |
| **Motion** | Subtle hover lift (`hover:-translate-y-0.5`), smooth `transition-all` |
| **Density** | Generous whitespace, clear hierarchy |
| **Modes** | Light (`slate-50` feel) + Dark (`zinc-950` feel) toggle |

---

## 2. Color Palette

Brand palette is **red + white** with neutral grays. Emerald green is reserved as a single functional accent for the "Export PDF" action and high-stock/success states.

### Roles
| Token | Purpose |
|-------|---------|
| `--primary` | Red — buttons, active nav, focus rings, key accents |
| `--background` / `--card` | White / near-white surfaces (light), zinc (dark) |
| `--foreground` | Primary text |
| `--muted` / `--muted-foreground` | Secondary surfaces & text |
| `--accent` | Soft red tint for hover/active nav backgrounds |
| `--success` | Emerald — high stock badge, "Export PDF", completed status |
| `--destructive` | Red — refund, low stock, errors |
| `--border` / `--input` / `--ring` | Hairline borders & inputs |

### Light Mode (OKLCH)
\`\`\`css
:root {
  --background: oklch(0.985 0.003 20);
  --foreground: oklch(0.18 0.01 25);
  --card: oklch(1 0 0);
  --primary: oklch(0.577 0.229 27.2);        /* red */
  --primary-foreground: oklch(0.99 0.005 20);
  --secondary: oklch(0.968 0.006 20);
  --muted-foreground: oklch(0.53 0.015 25);
  --accent: oklch(0.955 0.03 22);            /* soft red tint */
  --accent-foreground: oklch(0.45 0.18 27);
  --destructive: oklch(0.577 0.245 27.325);
  --success: oklch(0.58 0.14 152);           /* emerald */
  --border: oklch(0.912 0.006 25);
  --ring: oklch(0.577 0.229 27.2);
  --radius: 1rem;
}
\`\`\`

### Dark Mode (OKLCH)
\`\`\`css
.dark {
  --background: oklch(0.145 0.006 285);      /* zinc-950 feel */
  --foreground: oklch(0.97 0.004 20);
  --card: oklch(0.19 0.006 285);
  --primary: oklch(0.62 0.22 27.5);          /* brighter red */
  --primary-foreground: oklch(0.99 0.005 20);
  --secondary: oklch(0.25 0.006 285);
  --muted-foreground: oklch(0.7 0.01 20);
  --accent: oklch(0.3 0.06 25);
  --accent-foreground: oklch(0.9 0.05 25);
  --destructive: oklch(0.62 0.22 27.5);
  --success: oklch(0.7 0.15 152);
  --border: oklch(1 0 0 / 9%);
  --ring: oklch(0.62 0.22 27.5);
}
\`\`\`

> **Rule:** Never use raw `text-white` / `bg-black`. Always theme through tokens (`bg-primary`, `text-foreground`, `bg-card`, etc.). If you override a background, override the text color too for contrast.

---

## 3. Typography

Two families only:

| Use | Font | Class |
|-----|------|-------|
| UI / body / headings | **Geist Sans** | `font-sans` |
| Receipt / numbers / mono | **Geist Mono** | `font-mono` |

- Body line-height: `leading-relaxed` (1.4–1.6)
- Titles wrapped in `text-balance` / `text-pretty`
- Never smaller than 14px for body text

\`\`\`tsx
// layout.tsx
import { Geist, Geist_Mono } from "next/font/google"
const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans" })
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" })
\`\`\`

\`\`\`css
/* globals.css @theme inline */
--font-sans: var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif;
--font-mono: var(--font-geist-mono), ui-monospace, monospace;
\`\`\`

---

## 4. File / Component Structure

\`\`\`
app/
  layout.tsx              # Fonts, metadata, <html className="bg-background">
  globals.css             # Theme tokens (light + dark), radius, fonts
  page.tsx                # Renders <PosApp />

components/
  pos/
    pos-app.tsx           # App shell: sidebar + routing + theme state + toasts
    sidebar.tsx           # Left nav + profile card at bottom
    dashboard-page.tsx    # KPI cards + summary
    cashier-page.tsx      # Product grid + checkout panel
    transactions-page.tsx # Filter panel + transactions table
    inventory-page.tsx    # Stock list
    receipt-modal.tsx     # Monospaced receipt popup

lib/
  pos-data.ts             # Types + mock products, transactions, user

public/
  products/               # coffee, burger, juice, cake, fries, tea (.png)
\`\`\`

---

## 5. Layout: App Shell

- **Two-column flex layout**: fixed sidebar (`w-64`) + scrollable main content.
- Sidebar is `flex flex-col` with nav at top and profile card pinned at bottom (`mt-auto`).
- Main content: `flex-1 overflow-y-auto` with page padding (`p-6` / `p-8`).
- Theme state (`dark` class on `<html>`) toggled from the sidebar.

---

## 6. Page Specs

### 6.1 Left Navigation (Sidebar)
- Brand mark (red rounded square + "Emerald POS").
- Nav items: Dashboard, POS Cashier, Transactions, Inventory — each `rounded-2xl`, active state uses `bg-accent text-accent-foreground`, hover lifts subtly.
- Theme toggle (Sun/Moon icon).
- **Profile card at bottom**: `rounded-2xl bg-secondary` containing Avatar, Name, Role badge (e.g. "Admin"), and a logout icon-button.

### 6.2 Transactions Page
- **Filter panel** (card, `rounded-2xl`):
  - Month selector `<input type="month">`
  - Custom date range: **From** / **To** (`<input type="date">`)
  - Search bar (icon + input)
  - Solid **emerald green** "Export PDF" button (`bg-success`)
- **Table** columns: `Invoice #`, `Date`, `Payment`, `Tax`, `Total`, `Status Badge` (Completed = emerald, Refunded = red), and an **action column** with 3 icon-buttons: **View**, **Download Receipt**, **Refund**.
- Rows have hover highlight; badges use soft tinted backgrounds.

### 6.3 POS Cashier Grid Page
- **Product grid** (`grid` responsive, `gap-4`): cards with product image, category tag, price in **Rp**, and stock number:
  - High stock → **green** badge (`bg-success`)
  - Low stock → **red** badge (`bg-destructive`)
  - Hover: lift + shadow.
- **Checkout panel** (right-aligned column):
  - Line items with qty +/- controls.
  - Calculation rows: **Subtotal**, **10% Tax**, **Grand Total**.
  - Payment buttons: **Cash**, **Debit** (and QRIS).

### 6.4 Receipt Modal
- Centered modal, monospaced (`font-mono`) receipt look on a paper-like surface.
- Shows store header, purchased items (name × qty … price), tax calculation, payment method + change.
- Bottom action buttons: **Download Receipt PDF**, **Issue Refund** (destructive), **Close**.

---

## 7. Reusable UI Conventions

| Element | Classes (pattern) |
|---------|-------------------|
| Card | `rounded-2xl border border-border bg-card p-4` |
| Primary button | `rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-all` |
| Export button | `rounded-xl bg-success text-white hover:opacity-90` |
| Icon button | `rounded-lg p-2 hover:bg-muted transition-colors` |
| Status badge (ok) | `rounded-full bg-success/15 text-success px-2.5 py-0.5 text-xs` |
| Status badge (bad) | `rounded-full bg-destructive/15 text-destructive px-2.5 py-0.5 text-xs` |
| Hover lift | `transition-all hover:-translate-y-0.5 hover:shadow-lg` |

---

## 8. Data Model (reference)

\`\`\`ts
type Product = {
  id: string
  name: string
  category: string
  price: number        // in Rupiah
  stock: number
  image: string
}

type CartItem = { product: Product; qty: number }

type Transaction = {
  id: string           // invoice #
  date: string
  payment: "Cash" | "Debit" | "QRIS"
  subtotal: number
  tax: number          // 10%
  total: number
  status: "Completed" | "Refunded"
  items: CartItem[]
}

type CurrentUser = { name: string; role: string; avatar: string }
\`\`\`

Tax rule: `tax = subtotal * 0.1`, `total = subtotal + tax`.

---

## 9. Accessibility & Best Practices

- Semantic landmarks: `<aside>` sidebar, `<main>` content, `<header>` per page.
- All icon-buttons have `aria-label` / `sr-only` text.
- Images have `alt`; decorative ones are hidden from screen readers.
- Inputs paired with `<label>`.
- Enter-to-submit handlers guard against IME composition (`isComposing` / `keyCode === 229`).
- Color is never the only signal — badges pair color with text.
