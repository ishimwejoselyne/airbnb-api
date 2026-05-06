import { Router } from "express";
import {
  changePassword,
  forgotPassword,
  login,
  me,
  register,
  resetPassword
} from "../../controllers/auth.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           example: Resource not found
 *         message:
 *           type: string
 *           example: Resource not found
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         username:
 *           type: string
 *           example: johnny
 *         phone:
 *           type: string
 *           example: "+201000000000"
 *         role:
 *           type: string
 *           enum: [HOST, GUEST, ADMIN]
 *           example: GUEST
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "I love traveling and meeting new people."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-05-03T10:00:00.000Z"
 *     Listing:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 10
 *         title:
 *           type: string
 *           example: "Cozy Downtown Apartment"
 *         description:
 *           type: string
 *           example: "A bright, clean apartment close to everything."
 *         location:
 *           type: string
 *           example: "Cairo"
 *         pricePerNight:
 *           type: number
 *           example: 75.5
 *         guests:
 *           type: integer
 *           example: 3
 *         type:
 *           type: string
 *           enum: [apartment, house, villa, cabin, APARTMENT, HOUSE, VILLA, CABIN]
 *           example: apartment
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["wifi", "kitchen", "air conditioning"]
 *         rating:
 *           type: number
 *           nullable: true
 *           example: 4.7
 *         userId:
 *           type: integer
 *           description: Host user id (alias of hostId)
 *           example: 2
 *         host:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-05-03T10:00:00.000Z"
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 100
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2026-06-01T12:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2026-06-05T12:00:00.000Z"
 *         total:
 *           type: number
 *           description: Total booking price (alias of totalPrice)
 *           example: 302
 *         status:
 *           type: string
 *           enum: [confirmed, cancelled, pending, CONFIRMED, CANCELLED, PENDING]
 *           example: confirmed
 *         userId:
 *           type: integer
 *           description: Guest user id (alias of guestId)
 *           example: 3
 *         listingId:
 *           type: integer
 *           example: 10
 *         user:
 *           $ref: '#/components/schemas/User'
 *         listing:
 *           $ref: '#/components/schemas/Listing'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-05-03T10:00:00.000Z"
 *     Review:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 55
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: "Amazing place and great host!"
 *         userId:
 *           type: integer
 *           example: 3
 *         listingId:
 *           type: integer
 *           example: 10
 *         user:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2026-05-03T10:00:00.000Z"
 *     RegisterInput:
 *       type: object
 *       required: [name, email, username, phone, password, role]
 *       properties:
 *         name:
 *           type: string
 *           example: John Doe
 *         email:
 *           type: string
 *           example: john@example.com
 *         username:
 *           type: string
 *           example: johnny
 *         phone:
 *           type: string
 *           example: "+201000000000"
 *         password:
 *           type: string
 *           example: "P@ssw0rd123"
 *         role:
 *           type: string
 *           enum: [HOST, GUEST]
 *           example: GUEST
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           example: john@example.com
 *         password:
 *           type: string
 *           example: "P@ssw0rd123"
 *     CreateListingInput:
 *       type: object
 *       required: [title, description, location, pricePerNight, guests, type, amenities]
 *       properties:
 *         title:
 *           type: string
 *           example: "Cozy Downtown Apartment"
 *         description:
 *           type: string
 *           example: "A bright, clean apartment close to everything."
 *         location:
 *           type: string
 *           example: "Cairo"
 *         pricePerNight:
 *           type: number
 *           example: 75.5
 *         guests:
 *           type: integer
 *           example: 3
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CABIN]
 *           example: APARTMENT
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           example: ["wifi", "kitchen"]
 *     CreateBookingInput:
 *       type: object
 *       required: [listingId, checkIn, checkOut]
 *       properties:
 *         listingId:
 *           type: integer
 *           example: 10
 *         userId:
 *           type: integer
 *           description: Optional; server uses authenticated user id
 *           example: 3
 *         checkIn:
 *           type: string
 *           format: date-time
 *           example: "2026-06-01T12:00:00.000Z"
 *         checkOut:
 *           type: string
 *           format: date-time
 *           example: "2026-06-05T12:00:00.000Z"
 *     CreateReviewInput:
 *       type: object
 *       required: [rating, comment]
 *       properties:
 *         userId:
 *           type: integer
 *           description: Optional; server uses authenticated user id
 *           example: 3
 *         rating:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *           example: 5
 *         comment:
 *           type: string
 *           example: "Amazing place and great host!"
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "John Updated"
 *         email:
 *           type: string
 *           example: "john.updated@example.com"
 *         username:
 *           type: string
 *           example: "johnny_updated"
 *         phone:
 *           type: string
 *           example: "+201111111111"
 *         password:
 *           type: string
 *           example: "NewP@ssw0rd123"
 *         role:
 *           type: string
 *           enum: [HOST, GUEST]
 *           example: HOST
 *         avatar:
 *           type: string
 *           nullable: true
 *           example: "https://res.cloudinary.com/demo/image/upload/v1/avatar.jpg"
 *         bio:
 *           type: string
 *           nullable: true
 *           example: "Updated bio"
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         user:
 *           $ref: '#/components/schemas/User'
 *
 * tags:
 *   - name: Auth
 *   - name: Users
 *   - name: Listings
 *   - name: Bookings
 *   - name: Reviews
 *   - name: Uploads
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Created user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: Email already in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

router.post("/register", register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Auth response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", login);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing/invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/me", authenticate, me);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: "OldP@ssw0rd123"
 *               newPassword:
 *                 type: string
 *                 example: "NewP@ssw0rd123"
 *     responses:
 *       200:
 *         description: Password changed
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Invalid credentials / token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request password reset
 *     description: Same response is returned whether the email exists or not.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Always returns success message
 */
router.post("/forgot-password", forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password with token
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Raw reset token from the email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password:
 *                 type: string
 *                 example: "NewP@ssw0rd123"
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token / invalid password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/reset-password/:token", resetPassword);

export default router;

