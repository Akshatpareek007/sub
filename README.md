# 🚀 Mini ERP + CRM Operations Portal

An end-to-end Operations, Inventory, and CRM platform built with **TypeScript**, **React**, **Express**, and **Prisma ORM**.

Designed for small-to-medium businesses to manage customers, track inventory levels, monitor stock movements, and issue delivery challans with PDF generation.

---

## ✨ Features

- 👥 **Customer Relationship Management (CRM):** Lead, Active, and Inactive customer tracking with follow-up notes.
- 📦 **Inventory & Stock Alert System:** Live stock counts, low stock alerts, unit pricing, and location tracking.
- 🚚 **Delivery Challans & Invoicing:** Draft and confirmed delivery challans with automatic stock deduction and PDF export.
- 📊 **Executive Dashboard:** Real-time summary of revenue, active leads, inventory valuation, and recent stock movements.
- 🔐 **Role-Based Authentication:** JWT authentication supporting Admin, Sales, Warehouse, and Accounts roles.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** CSS Design Tokens, Modern UI Aesthetics

### Backend
- **Server:** Node.js + Express + TypeScript
- **ORM:** Prisma ORM
- **Database:** PostgreSQL (Cloud/Production) or SQLite (Local Dev)
- **PDF Generation:** PDFKit

---

## 📁 Repository Structure

```text
├── backend/
│   ├── prisma/             # Prisma schema & seed scripts
│   ├── src/                # Express controllers, routes, & middleware
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/                # React pages, components, context, & services
│   ├── netlify.toml        # Netlify SPA deployment config
│   ├── vercel.json         # Vercel SPA rewrite config
│   ├── package.json
│   └── .env.example
├── Dockerfile              # Production multi-stage Docker build
├── docker-compose.yml      # Containerized deployment config
└── README.md
```

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and set your DATABASE_URL
npx prisma db push
npm run seed
npm run dev
```
*Backend API will run on `http://localhost:5000`*

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
*Frontend app will run on `http://localhost:5173`*

---

## 🌐 Production Cloud Deployment

### Target Stack
- **Frontend:** Vercel / Netlify / Render Static
- **Backend:** Render / Railway / Fly.io
- **Database:** Supabase / Neon / Render Postgres

For detailed step-by-step deployment instructions, see [Multi-Tier Cloud Deployment Guide](./walkthrough.md).

---

## 🔒 Default Admin Credentials (Post-Seed)

- **Email:** `admin@minierp.com`
- **Password:** `admin123`
