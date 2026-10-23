import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload destination directories exist
const blogUploadsDir = path.join(__dirname, "..", "uploads", "blogs");
if (!fs.existsSync(blogUploadsDir)) {
  fs.mkdirSync(blogUploadsDir, { recursive: true });
}

const staffUploadsDir = path.join(__dirname, "..", "uploads", "staff");
if (!fs.existsSync(staffUploadsDir)) {
  fs.mkdirSync(staffUploadsDir, { recursive: true });
}

const categoryUploadsDir = path.join(__dirname, "..", "uploads", "categories");
if (!fs.existsSync(categoryUploadsDir)) {
  fs.mkdirSync(categoryUploadsDir, { recursive: true });
}

const productUploadsDir = path.join(__dirname, "..", "uploads", "products");
if (!fs.existsSync(productUploadsDir)) {
  fs.mkdirSync(productUploadsDir, { recursive: true });
}

// 1. Blog Image Storage & Multer
const blogStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, blogUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    cb(null, `blog-${cleanBase}-${unique}${ext}`);
  },
});

export const blogUpload = multer({
  storage: blogStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|avif/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime) || (mime && mime.startsWith("image/")) || ext === "avif") {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, WEBP, AVIF, SVG, GIF) are allowed"));
    }
  },
});

// 2. Staff File Storage & Multer
const staffStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, staffUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    cb(null, `staff-${cleanBase}-${unique}${ext}`);
  },
});

export const staffUpload = multer({
  storage: staffStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|pdf|avif/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime) || (mime && mime.startsWith("image/")) || mime === "application/pdf" || ext === "avif") {
      cb(null, true);
    } else {
      cb(new Error("Only images (PNG, JPG, SVG, WEBP, AVIF) and PDF files are allowed"));
    }
  },
});

// 3. Category Image Storage & Multer
const categoryStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, categoryUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    cb(null, `cat-${cleanBase}-${unique}${ext}`);
  },
});

export const categoryUpload = multer({
  storage: categoryStorage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|avif/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime) || (mime && mime.startsWith("image/")) || ext === "avif") {
      cb(null, true);
    } else {
      cb(new Error("Only image files (JPG, PNG, WEBP, AVIF, SVG, GIF) are allowed"));
    }
  },
});

// 4. Product Image/Media Storage & Multer
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, productUploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
    const unique = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    cb(null, `prod-${cleanBase}-${unique}${ext}`);
  },
});

export const productUpload = multer({
  storage: productStorage,
  limits: { fileSize: 35 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif|svg|avif|pdf|mp4|webm/;
    const ext = path.extname(file.originalname).toLowerCase().replace(".", "");
    const mime = file.mimetype;
    if (
      allowed.test(ext) ||
      allowed.test(mime) ||
      (mime && (mime.startsWith("image/") || mime.startsWith("video/") || mime === "application/pdf")) ||
      ext === "avif"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images (PNG, JPG, SVG, WEBP, AVIF, GIF), videos, or PDF files are allowed"));
    }
  },
});
