const multer = require("multer");
const path = require("path");
const fs = require("fs");

// If Cloudinary is configured in .env, we use it
const useCloudinary = process.env.CLOUD_NAME && process.env.API_KEY && process.env.API_SECRET;

let storage;

if (useCloudinary) {
  try {
    const cloudinary = require("cloudinary").v2;
    const { CloudinaryStorage } = require("multer-storage-cloudinary");

    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET,
    });

    storage = new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: "countries",
        allowed_formats: ["jpg", "jpeg", "png", "svg", "webp"],
      },
    });
    console.log("Multer configured to upload to Cloudinary");
  } catch (err) {
    console.error("Failed to initialize Cloudinary storage, falling back to local storage:", err.message);
    useCloudinary = false;
  }
}

// Fallback to local storage (or default)
if (!useCloudinary) {
  const uploadDir = path.join(__dirname, "../public/uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
    },
  });
  console.log("Multer configured to upload locally to public/uploads");
}

const fileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|svg|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, svg, webp)"), false);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

module.exports = upload;
