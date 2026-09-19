# PDFBolt ⚡ — In-Browser PDF Suite

> **The Lightning-Fast, 100% Private, Free iLovePDF Alternative**  
> *Engineered by **infas.mk** • Powered by **WEB⚡BITS***

![PDFBolt](https://img.shields.io/badge/Powered%20By-WEB%E2%9A%A1BITS-blue?style=for-the-badge)
![Founder](https://img.shields.io/badge/Founder-infas.mk-06b6d4?style=for-the-badge)
![License](https://img.shields.io/badge/Cost-%240%20Free%20Forever-emerald?style=for-the-badge)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20In--Browser-indigo?style=for-the-badge)

---

## 🚀 Overview

**PDFBolt** is an open-source, serverless web application that delivers the core functionality of **iLovePDF** directly within the user's browser.

Because all PDF transformations (merging, splitting, watermarking, password encryption, signing, and converting) are executed using client-side WebAssembly and modern JavaScript, **no files are ever uploaded to any server**. 

### 💡 Why this is 100% Free to Host & Run:
1. **$0 Hosting / Cloud Bills**: The visitors' own device/browser performs the heavy processing via WebAssembly (`pdf-lib` & `pdfjs-dist`).
2. **Zero Server Maintenance**: Can be deployed completely free on **Vercel**, **Cloudflare Pages**, or **Netlify** static tiers.
3. **Enterprise Privacy**: 100% confidentiality — documents never leave the computer or phone.

---

## 🛠️ Built-in Working Tools

| Tool | Capability | Engine |
| :--- | :--- | :--- |
| **Merge PDF** | Combine multiple PDFs into a single document with drag-and-drop ordering | `pdf-lib` |
| **Split PDF** | Extract custom page ranges (`1-3, 5`) or split every page into a ZIP archive | `pdf-lib` + `JSZip` |
| **Organize Pages** | Visual interactive thumbnail grid: reorder, rotate individual pages, or delete pages | `pdfjs-dist` + `pdf-lib` |
| **Images to PDF** | Convert JPG, PNG, and WebP images to a PDF (A4 standard or auto-fit) | `pdf-lib` |
| **PDF to Images** | High-res Canvas rasterization to PNG or JPG, exported as a single ZIP | `pdfjs-dist` + HTML5 Canvas |
| **Rotate PDF** | 90°, 180°, or 270° clockwise document orientation fixer | `pdf-lib` |
| **Add Watermark** | Stamp custom text with configurable opacity, angle, and font size | `pdf-lib` |
| **Page Numbers** | Dynamic header/footer page numbering (`Page {n} of {total}`) | `pdf-lib` |
| **Protect PDF** | High-security 128-bit AES password encryption | `pdf-lib` |
| **Sign PDF** | Digital canvas signature pad: draw signature and stamp onto document | HTML5 Canvas + `pdf-lib` |
| **Compress PDF** | Stream and structural dictionary optimization | `pdf-lib` |

---

## 💻 Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **PDF Core**: [pdf-lib](https://pdf-lib.js.org/) & [PDF.js (Mozilla)](https://mozilla.github.io/pdf.js/)
- **Packaging**: [JSZip](https://stuk.github.io/jszip/)
- **Animations**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)

---

## 🏁 Quick Start (Run Locally)

```bash
# 1. Navigate to the project directory
locate ur file

# 2. Install dependencies (already completed)
npm install

# 3. Start development server
npm run dev

# 4. Open in browser:
http://localhost:5173
```

---

## 🌐 How to Deploy for Free (1-Click)

### Option 1: Vercel (Recommended — 100% Free)
1. Push this folder to a GitHub repository.
2. Go to [vercel.com](https://vercel.com) and log in.
3. Click **"Add New Project"** and import your GitHub repository.
4. Framework Preset will auto-detect as **Vite**.
5. Click **"Deploy"**.
6. You get a free `your-app.vercel.app` domain with free SSL, and you can connect your own custom domain for free!

### Option 2: Cloudflare Pages (100% Free)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) > **Workers & Pages**.
2. Click **Create Application** > **Pages** > Connect GitHub.
3. Build command: `npm run build`
4. Build output directory: `dist`
5. Click **Deploy**.

---

## ⚡ Branding & Attribution

- **Founder & Lead Developer**: `infas.mk`
- **Team**: `WEB⚡BITS`
- **Product Name**: `PDFBolt ⚡`
- **Theme**: Balanced Electric Blue & Obsidian Slate (Dark & Light Mode)
