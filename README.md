# রাধা মাধব অনলাইন সেন্টার - Shop Management & Digital Khata Book
**Radhamadhab Online Center - Digital Accounting & Bahi Khata System**

A modern, high-contrast, production-ready Shop Accounting & Digital Udhar Ledger (Khata Book) built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Express**.

---

## 🌟 Key Features

1. **Digital Khata Book (উধার খতিয়ান / Bahi Khata)**:
   - Tracks **Total Due (Credit given / দিলাম)** and **Total Paid (Payments received / পেলাম)**.
   - **Customer & Supplier Accounts** with balance statements, dates, and bills.
   - **One-Tap WhatsApp & SMS Payment Reminders**: Sends pre-formatted bilingual balance reminders with shop UPI ID.
   - Printable account statements and ledger history.

2. **Daily Cash & Bank Accounting**:
   - Morning Opening Balances (Cash Drawer & Bank/UPI).
   - Real-time Cash In/Out, Bank In/Out, and Net Profit calculations.
   - Daily Cash-to-Bank and Bank-to-Cash contra transfers.

3. **Digital Services & Portals**:
   - Xerox & Color Printing
   - Passport & Studio Photos
   - Online Form Applications
   - Mobile & DTH Recharge Portal
   - Domestic Money Transfer (DMT) & AEPS Banking
   - Electricity & Utility Bill Payments

4. **Invoicing & Printable Receipts**:
   - Instant digital receipts with customizable shop headers and footer messages.
   - Receipt search, reprint, and history archive.

5. **Backup & Data Persistence**:
   - Full JSON database export and restore.
   - CSV export of all transactions.
   - Multi-device real-time sync with offline fallback.

---

## 🚀 How to Run Locally

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm** or **bun** or **yarn**

### 1. Installation
Extract the zip file, open your terminal in the extracted folder, and install dependencies:
```bash
npm install
```

### 2. Development Mode
Start the local development server:
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 3. Production Build
Build the optimized frontend application:
```bash
npm run build
```

### 4. Run Full-Stack Express Server
```bash
# Ensure build exists first:
npm run build

# Run the Node.js production server:
node server.ts
# or using tsx:
npx tsx server.ts
```

---

## 📁 Project Structure

```text
├── src/
│   ├── components/         # Reusable UI components & modals
│   │   ├── BottomNav.tsx   # Mobile navigation bar
│   │   ├── Navbar.tsx      # Top branding & action header
│   │   ├── Sidebar.tsx     # Desktop sidebar navigation
│   │   └── modals/         # Receipt, Entry, Opening Balance modals
│   ├── context/            # Global React Contexts
│   │   ├── AuthContext.tsx # Authentication & profile
│   │   ├── LanguageContext.tsx # English & Bengali bilingual system
│   │   ├── ShopContext.tsx # Accounting engine & Khata transactions
│   │   └── ThemeContext.tsx # Dark mode theme provider
│   ├── data/               # Default settings & starter sample data
│   ├── lib/                # Accounting algorithms, i18n, API client
│   ├── views/              # Main App views (Dashboard, KhataBook, etc.)
│   ├── App.tsx             # Main App layout & routing
│   └── main.tsx            # React application entry point
├── server.ts               # Standalone Express production server
├── vite-plugin-api.ts      # Vite dev-server API middleware
├── vite.config.ts          # Vite build & bundler configuration
└── package.json            # Project manifest & dependencies
```

---

## 🛡️ License
Apache-2.0 License. Built for Radhamadhab Online Center.
