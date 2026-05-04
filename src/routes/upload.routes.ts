import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware.js";
import { upload } from "../config/multer.js";
import {
  deleteAvatar,
  deleteListingPhoto,
  uploadAvatar,
  uploadListingPhotos
} from "../controllers/upload.controller.js";

const router = Router();

/**
 * @swagger
 * /users/{id}/avatar:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload user avatar
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Updated user
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete user avatar
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Avatar removed
 *       400:
 *         description: No avatar to remove
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.post("/users/:id/avatar", authenticate, upload.single("image"), uploadAvatar);
router.delete("/users/:id/avatar", authenticate, deleteAvatar);

/**
 * @swagger
 * /listings/{id}/photos:
 *   post:
 *     tags: [Uploads]
 *     summary: Upload listing photos
 *     security:
 *       - bearerAuth: []
 *     description: Upload up to 5 photos (field name is `photos`).
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [photos]
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing with photos
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Listing not found
 *
 * /listings/{id}/photos/{photoId}:
 *   delete:
 *     tags: [Uploads]
 *     summary: Delete a listing photo
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
router.post("/listings/:id/photos", authenticate, upload.array("photos", 5), uploadListingPhotos);
router.delete("/listings/:id/photos/:photoId", authenticate, deleteListingPhoto);

export default router;

