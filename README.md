# KWstore — COD E-Commerce Platform

A production e-commerce storefront built for the Pakistani market, where cash on delivery and WhatsApp ordering matter more than card checkout.

Built with Next.js 14 and TypeScript, backed by Neon PostgreSQL. Everything customers see — products, banners, flash sales, badges — is controlled from a password-protected admin dashboard.

**Live store:** _coming soon_

---

## Screenshots

| Storefront | Product Page | Admin Dashboard |
|-----------|--------------|-----------------|
| _add screenshot_ | _add screenshot_ | _add screenshot_ |

---

## Why this exists

Most e-commerce templates assume Stripe checkout and international shipping. Pakistani online retail runs differently: buyers order over WhatsApp, pay the courier in cash, and discover products through TikTok. KWstore is built around that reality.

---

## Features

### Storefront
- Product catalogue with category filtering and search
- Product detail pages with an image gallery
- Cash-on-delivery order form — no card or account required
- WhatsApp integration so buyers can confirm orders directly
- Flash sale countdown timer with a live deadline
- Promotional banner carousel, each banner linkable to a product
- Manual badge system — mark items as New, Sale, Limited, or Best Seller
- Per-product TikTok links for social-driven traffic
- Responsive cream-and-orange theme designed for mobile-first shoppers

### Admin dashboard
- Secure login with session-based authentication
- Full product management — create, edit, delete, with image uploads
- Order management with status tracking
- Banner manager with built-in crop, zoom, and reposition controls
- Flash sale scheduling — set the end time, the storefront timer follows
- Sales and traffic statistics at a glance
- Site settings editor for store-wide configuration

### Reliability
- Database connection retry logic with exponential backoff
- Friendly fallback page when the database is unreachable, instead of a crash
- Server-side validation on every form and API route
- Route protection through Next.js middleware

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Neon PostgreSQL (serverless) |
| Auth | Session-based, middleware protected |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm
- A Neon PostgreSQL database (free tier is enough)

### Installation

```bash
git clone https://github.com/kh155/KWstore.git
cd KWstore
npm install
```

Create a `.env` file in the project root:

```env
DATABASE_URL=your_neon_connection_string
ADMIN_USERNAME=your_admin_username
ADMIN_PASSWORD=your_admin_password
JWT_SECRET=a_long_random_secret_string
WHATSAPP_NUMBER=92XXXXXXXXXX
```

Set up the database:

```bash
npm run db:setup
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `ADMIN_USERNAME` | Username for the admin dashboard |
| `ADMIN_PASSWORD` | Password for the admin dashboard |
| `JWT_SECRET` | Secret used to sign session tokens |
| `WHATSAPP_NUMBER` | Store WhatsApp number, country code without the plus sign |

> Never commit your `.env` file. It is already listed in `.gitignore`.

---

## Project Structure

```
src/
├── app/
│   ├── admin/            Dashboard, products, settings, login
│   ├── api/              Auth, orders, products, settings, stats
│   ├── product/[slug]/   Product detail pages
│   └── order/success/    Post-order confirmation
├── components/
│   ├── Badges.tsx        Product badge rendering
│   ├── BannerCropper.tsx Banner crop, zoom and reposition tool
│   ├── Catalog.tsx       Product grid and filtering
│   ├── DbDown.tsx        Database-unavailable fallback screen
│   ├── HomeClient.tsx    Storefront home
│   ├── OrderForm.tsx     COD checkout form
│   └── ProductGallery.tsx
├── lib/
│   ├── auth.ts           Session handling
│   ├── db.ts             Database client with retry logic
│   ├── data.ts           Queries
│   ├── http.ts           Request helpers
│   └── validation.ts     Input schemas
└── middleware.ts         Admin route protection

scripts/                  Database setup and migration scripts
```

---

## Deployment

Deployed on [Vercel](https://vercel.com):

1. Import the repository in Vercel
2. Add every variable from the table above under **Environment Variables**
3. Deploy

Neon works out of the box with Vercel's serverless functions — no connection pooling configuration needed.

---

## Roadmap

- [ ] Order status notifications over WhatsApp
- [ ] Customer order lookup by phone number
- [ ] Inventory tracking with low-stock alerts
- [ ] Sales analytics dashboard
- [ ] Companion mobile app (React Native)

---

## Contact

**Khalil Khan** — Full Stack Web & App Developer

- GitHub: [@kh155](https://github.com/kh155)
- LinkedIn: _add your profile link_
- Email: _add your email_

Available for freelance e-commerce and web development projects.

---

## License

All rights reserved. This code is published for portfolio purposes.
