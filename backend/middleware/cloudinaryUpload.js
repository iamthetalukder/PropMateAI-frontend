const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// True when all 3 Cloudinary vars are set — used as a feature flag
const isCloudinaryEnabled = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

// Multer uses memory storage so files stay in RAM until we push them to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only jpg, jpeg, png, and webp images are allowed"));
    }
  },
});

// Upload a single file buffer to Cloudinary and return the secure URL
const uploadToCloudinary = (buffer, folder = "propmate") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      },
    );
    Readable.from(buffer).pipe(stream);
  });
};

// Delete an image from Cloudinary using its stored URL
// Extracts the public_id from the URL format:
//   https://res.cloudinary.com/CLOUD/image/upload/v123/folder/filename.ext
const deleteFromCloudinary = async (url) => {
  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return;
    let publicIdWithExt = url.slice(uploadIndex + 8);
    // Strip the version prefix if present (e.g. v1714000000/)
    publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, "");
    const dotIndex = publicIdWithExt.lastIndexOf(".");
    const publicId =
      dotIndex !== -1 ? publicIdWithExt.slice(0, dotIndex) : publicIdWithExt;
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
};

module.exports = { upload, uploadToCloudinary, deleteFromCloudinary, isCloudinaryEnabled };
