import { Router } from "express";
import {
  createListing,
  deleteListing,
  getAllListings,
  getListingsStats,
  getListingById,
  searchListings,
  updateListing
} from "../../controllers/listings.controller.js";
import { authenticate, requireHost } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * /listings:
 *   get:
 *     summary: Get all listings with pagination
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of listings per page
 *     responses:
 *       200:
 *         description: A list of listings with pagination info
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create a new listing (Host only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - pricePerNight
 *               - location
 *             properties:
 *               title:
 *                 type: string
 *                 example: Cozy Apartment in Downtown
 *               description:
 *                 type: string
 *                 example: A comfortable and modern apartment located in the heart of the city.
 *               pricePerNight:
 *                 type: number
 *                 example: 120.00
 *               location:
 *                 type: string
 *                 example: New York, NY
 *     responses:
 *       201:
 *         description: The created listing
 *       400:
 *         description: Invalid request body
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * /listings/{id}:
 *   get:
 *     summary: Get a listing by ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       200:
 *         description: The requested listing
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update a listing (Host only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Cozy Apartment in Downtown
 *               description:
 *                 type: string
 *                 example: An updated description for the cozy apartment.
 *               pricePerNight:
 *                 type: number
 *                 example: 130.00
 *               location:
 *                 type: string
 *                 example: New York, NY
 *     responses:
 *       200:
 *         description: The updated listing
 *       400:
 *         description: Invalid request body or parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete a listing (Host only)
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The listing ID
 *     responses:
 *       204:
 *         description: Listing deleted successfully (No content)
 *       400:
 *         description: Invalid parameters
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Server error
 * /listings/search:
 *   get:
 *     summary: Search listings with filters
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: A list of listings matching the search criteria
 *       400:
 *         description: Invalid query parameters
 *       500:
 *         description: Server error
 * /listings/stats:
 *   get:
 *     summary: Get listings statistics
 *     description: Retrieve statistics about listings, such as average price, total count, and distribution by location.
 *     tags: [Listings]
 *     responses:
 *       200:
 *         description: The requested statistics
 *       500:
 *         description: Server error
 */
router.get("/", getAllListings);
router.get("/search", searchListings);
router.get("/stats", getListingsStats);
router.get("/:id", getListingById);
router.post("/", authenticate, requireHost, createListing);
router.put("/:id", authenticate, updateListing);
router.delete("/:id", authenticate, deleteListing);

export default router;

