# SMR Creator Lab — PRO Daily Drop Edition

A premium Indian Gen-Z creator storefront + private admin command center.

## What is included

- Premium dark studio-style storefront
- Indian Gen-Z male/female visual showcase
- ₹1 Daily Drop system for fresh prompts
- 1–2 daily prompt publishing workflow from `/admin`
- Larger PDF toolkits remain supported
- Razorpay server-side order creation + signature verification
- Secure PDF download tokens
- Secure prompt delivery after payment
- Page-view, visitor, product-view, checkout and purchase event tracking
- Admin dashboard for page views, visitors, product views, sales and revenue
- Product library ready for future products
- `products.json` as the local product catalog
- `orders.json` as the local order ledger
- `analytics.json` as the local event ledger

## Run locally

1. Copy `.env.example` to `.env`.
2. Put your Razorpay test keys in `.env`.
3. Set a strong `ADMIN_PASSWORD`.
4. Install packages:

```bash
npm install
```

5. Start the API in one terminal:

```bash
node server.js
```

6. Start Vite in another terminal:

```bash
npm run dev
```

Open the Vite URL shown by the terminal, normally `http://localhost:5173`.

## Admin

Open:

`http://localhost:5173/admin`

Enter the `ADMIN_PASSWORD` from `.env`.

From the dashboard you can:
- see page views
- see unique visitors
- see product views
- see sales
- see revenue
- see recent orders
- publish a new ₹1 Daily Drop without editing React code

## Important production notes

This version is designed as a strong local/prototype foundation. Before public launch:

- move products/orders/analytics to Supabase or another real database
- use a proper admin authentication system instead of a shared password header
- store images in object storage/CDN
- add rate limiting and validation
- configure production CORS
- use live Razorpay keys only after testing
- add privacy/terms/refund pages
- add consent-aware analytics where required
- replace demo model imagery with licensed or owned Indian creator imagery
- deploy API and frontend separately if needed

Never commit `.env` or secret keys.


## Product pages + PDF / Ebook selling

The admin now supports two product types:

- **Daily Drop / Prompt** — delivers the premium prompt after verified payment.
- **PDF / Ebook** — accepts a PDF upload (up to 20MB) and delivers it through a private, time-limited download link after verified payment.

Every product gets its own direct URL:

`/product/<product-id>`

Use the **Copy Link** button in Admin to copy the exact product URL for Instagram Reels, Facebook posts, ads, WhatsApp, etc. Customers land directly on that product's page and can return to the home page only if they choose.

### Admin product flow

1. Open `/admin`.
2. Choose **Daily Drop / Prompt** or **PDF / Ebook**.
3. Enter your own price in the Price field.
4. Add title, category, cover image and description. The cover image is uploaded directly from the Admin panel; you do not need to create or paste an image URL.
5. For a prompt, enter the Premium Prompt.
6. For a PDF, select the PDF file (maximum 20MB).
7. Publish.
8. Use **Copy Link** beside the product.

### Cover image upload

Cover images can be selected directly in `/admin` (JPG, PNG or WEBP, maximum 10MB). The server stores the uploaded image in `product-images/` and automatically saves its public product-image path. Existing products that already have an external image URL continue to work.

For the current local/prototype setup, uploaded cover images are served from `/product-images/...`. Before production deployment, move this folder to persistent object storage/CDN (such as Supabase Storage) because serverless deployment filesystems are not persistent. The Admin workflow can remain the same; only the storage layer needs to be switched.

PDF files are stored in `private-products/` and are not exposed as public static files. Successful payments receive a tokenized download URL with a 24-hour expiry and a 3-download limit.

### Frontend routing

`vercel.json` contains SPA rewrites for `/product/*` and `/admin/*` so direct links work after deployment.
