# Dzire Backend Server (Node.js + MongoDB Atlas)

Complete Node.js backend for the Dzire application with MongoDB Atlas support via Mongoose and full offline mock fallback support.

---

## 🚀 Features & Modules

- **Authentication**: JWT authentication (`POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`).
- **User Profile & Addresses**: Profile update (`PUT /api/user/profile`), Saved Addresses CRUD (`GET/POST/DELETE /api/user/addresses`), Dzire Credits (`GET /api/user/credits`).
- **Products Catalog**: Filter by category, search query, featured sections (`GET /api/products`, `GET /api/products/:id`, `GET /api/products/sections/all`).
- **Bookstore**: Book catalog, details, reader reviews (`GET /api/books`, `GET /api/books/:id`, `POST /api/books/:id/reviews`).
- **Equipment Rentals**: Rental gear catalog and booking enquiries (`GET /api/rentals`, `GET /api/rentals/:id`, `POST /api/rentals/book`).
- **Events & Camping**: Event catalog, filtering, registration pipeline (`GET /api/events`, `GET /api/events/:id`, `POST /api/events/register`).
- **Checkout & Orders**: Order placement, order history, order details tracking, return requests (`POST /api/orders`, `GET /api/orders`, `GET /api/orders/:orderId`, `POST /api/orders/:orderId/return`).
- **Blogs**: Adventure stories, reader comments, comment likes (`GET /api/blogs`, `GET /api/blogs/:slug`, `POST /api/blogs/:slug/comments`, `POST /api/blogs/:slug/comments/:commentId/like`).
- **Contact & Support**: Contact messages and customer queries (`POST /api/contact`, `GET /api/contact`).

---

## 🛠 MongoDB Atlas Setup

1. Open `server/.env`.
2. Replace `MONGODB_URI` with your MongoDB Atlas cluster connection string:
   ```env
   PORT=5000
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dzire_db?retryWrites=true&w=majority
   JWT_SECRET=dzire_super_secret_jwt_key_2025
   CLIENT_URL=http://localhost:5173
   ```
3. To seed initial catalog data into your MongoDB Atlas collections, run:
   ```bash
   npm run seed
   ```
4. Start the server:
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

> **Note on Fallback Mode**: If `MONGODB_URI` is not yet configured or Atlas is temporarily unreachable, the server automatically runs in in-memory fallback mode so the frontend always works seamlessly out-of-the-box.
