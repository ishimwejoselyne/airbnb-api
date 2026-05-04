import multer from "multer";

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = file.mimetype === "image/jpeg" || file.mimetype === "image/png" || file.mimetype === "image/webp";
    if (ok) return cb(null, true);
    return cb(new Error("Only jpeg, png, webp allowed"));
  }
});

