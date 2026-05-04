import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env["CLOUDINARY_CLOUD_NAME"];
const apiKey = process.env["CLOUDINARY_API_KEY"];
const apiSecret = process.env["CLOUDINARY_API_SECRET"];

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
} else {
  console.warn("Cloudinary not configured; uploads will fail until env vars are set.");
}

export async function uploadToCloudinary(
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> {
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        if (!result?.secure_url || !result.public_id) return reject(new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}

export function getOptimizedUrl(url: string, width: number, height: number): string {
  const token = "/upload/";
  const idx = url.indexOf(token);
  if (idx === -1) return url;
  const before = url.slice(0, idx + token.length);
  const after = url.slice(idx + token.length);
  const transform = `w_${width},h_${height},c_fill,f_auto,q_auto/`;
  return before + transform + after;
}

