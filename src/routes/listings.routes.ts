import { Router } from "express";
import {
  createListing,
  deleteListing,
  getAllListings,
  getListingsStats,
  getListingById,
  searchListings,
  updateListing
} from "../controllers/listings.controller.js";
import { authenticate, requireHost } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /listings:
 *   get:
 *     tags: [Listings]
 *     summary: List listings
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 */
router.get("/", getAllListings);

/**
 * @swagger
 * /listings/search:
 *   get:
 *     tags: [Listings]
 *     summary: Search listings
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [apartment, house, villa, cabin]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: guests
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated listings
 */
router.get("/search", searchListings);

/**
 * @swagger
 * /listings/stats:
 *   get:
 *     tags: [Listings]
 *     summary: Listings statistics
 *     responses:
 *       200:
 *         description: Stats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalListings:
 *                   type: integer
 *                   example: 120
 *                 averagePrice:
 *                   type: number
 *                   example: 85.2
 *                 byLocation:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       location:
 *                         type: string
 *                         example: Cairo
 *                       count:
 *                         type: integer
 *                         example: 10
 *                 byType:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       type:
 *                         type: string
 *                         example: APARTMENT
 *                       count:
 *                         type: integer
 *                         example: 50
 */
router.get("/stats", getListingsStats);

/**
 * @swagger
 * /listings/{id}:
 *   get:
 *     tags: [Listings]
 *     summary: Get listing by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Listing with host and reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/:id", getListingById);

/**
 * @swagger
 * /listings:
 *   post:
 *     tags: [Listings]
 *     summary: Create listing
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingInput'
 *     responses:
 *       201:
 *         description: Created listing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Listing'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/", authenticate, requireHost, createListing);

/**
 * @swagger
 * /listings/{id}:
 *   put:
 *     tags: [Listings]
 *     summary: Update listing
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Any listing fields (all optional)
 *     responses:
 *       200:
 *         description: Updated listing
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *   delete:
 *     tags: [Listings]
 *     summary: Delete listing
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
 *         description: Deleted listing
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put("/:id", authenticate, updateListing);
router.delete("/:id", authenticate, deleteListing);

export default router;

