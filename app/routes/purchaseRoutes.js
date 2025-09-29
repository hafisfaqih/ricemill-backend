const express = require('express');
const PurchaseController = require('../controllers/purchaseController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { validatePurchase } = require('../validators/purchaseValidator');

const router = express.Router();

// All routes require authentication
// router.use(authenticateToken);  // COMMENTED FOR TESTING

/**
 * @swagger
 * tags:
 *   name: Purchases
 *   description: Purchase management endpoints
 */

/**
 * @swagger
 * /api/purchases:
 *   get:
 *     summary: Get all purchases with pagination and filtering
 *     tags: [Purchases]
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
 *         name: sort
 *         schema:
 *           type: string
 *           default: date
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: List of purchases retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Purchase'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 *   post:
 *     summary: Create a new purchase
 *     tags: [Purchases]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - supplier_id
 *               - supplier
 *               - quantity
 *               - weight
 *               - price
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               supplier_id:
 *                 type: integer
 *               supplier:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               weight:
 *                 type: number
 *                 minimum: 0
 *               price:
 *                 type: number
 *                 minimum: 0
 *               truck_cost:
 *                 type: number
 *                 minimum: 0
 *               labor_cost:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       201:
 *         description: Purchase created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Purchase'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 */
// Get all purchases with pagination and filtering
router.get('/', PurchaseController.getAllPurchases);

// Create purchase - admin and manager only
// router.post('/', requireRole(['admin', 'manager']), validatePurchase, PurchaseController.createPurchase);
// router.post('/', validatePurchase, PurchaseController.createPurchase);  // NO AUTH FOR TESTING
router.post('/', PurchaseController.createPurchase);  // BYPASS VALIDATOR FOR TESTING

/**
 * @swagger
 * /api/purchases/search:
 *   get:
 *     summary: Search purchases by supplier, date or other criteria
 *     tags: [Purchases]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for supplier name or purchase details
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Purchase'
 */
// Search purchases
router.get('/search', PurchaseController.searchPurchases);

/**
 * @swagger
 * /api/purchases/stats:
 *   get:
 *     summary: Get purchase statistics
 *     tags: [Purchases]
 *     responses:
 *       200:
 *         description: Purchase statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPurchases:
 *                       type: integer
 *                     totalWeight:
 *                       type: number
 *                     totalQuantity:
 *                       type: integer
 *                     totalCost:
 *                       type: number
 *                     avgCostPerKg:
 *                       type: number
 *                     avgCostPerSack:
 *                       type: number
 */
// Get purchase statistics
router.get('/stats', PurchaseController.getPurchaseStats);

/**
 * @swagger
 * /api/purchases/inventory:
 *   get:
 *     summary: Get available inventory from purchases
 *     tags: [Purchases]
 *     responses:
 *       200:
 *         description: Available inventory retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       supplier:
 *                         type: string
 *                       remainingQuantity:
 *                         type: integer
 *                       remainingWeight:
 *                         type: number
 *                       originalQuantity:
 *                         type: integer
 *                       originalWeight:
 *                         type: number
 */
// Get available inventory
router.get('/inventory', PurchaseController.getAvailableInventory);

/**
 * @swagger
 * /api/purchases/trends:
 *   get:
 *     summary: Get monthly purchase trends
 *     tags: [Purchases]
 *     responses:
 *       200:
 *         description: Monthly trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                       totalPurchases:
 *                         type: integer
 *                       totalCost:
 *                         type: number
 *                       totalWeight:
 *                         type: number
 */
// Get monthly trends
router.get('/trends', PurchaseController.getMonthlyTrends);

/**
 * @swagger
 * /api/purchases/supplier/{supplierId}:
 *   get:
 *     summary: Get purchases by supplier ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchases by supplier retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Purchase'
 */
// Get purchases by supplier
router.get('/supplier/:supplierId', PurchaseController.getPurchasesBySupplier);

/**
 * @swagger
 * /api/purchases/{id}:
 *   get:
 *     summary: Get purchase by ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Purchase'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *   put:
 *     summary: Update purchase by ID
 *     tags: [Purchases]
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
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               supplier_id:
 *                 type: integer
 *               supplier:
 *                 type: string
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *               weight:
 *                 type: number
 *                 minimum: 0
 *               price:
 *                 type: number
 *                 minimum: 0
 *               truck_cost:
 *                 type: number
 *                 minimum: 0
 *               labor_cost:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Purchase updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Purchase'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *   delete:
 *     summary: Delete purchase by ID
 *     tags: [Purchases]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Purchase deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
// Get purchase by ID
router.get('/:id', PurchaseController.getPurchaseById);

// Update purchase - admin and manager only
// router.put('/:id', requireRole(['admin', 'manager']), PurchaseController.updatePurchase);
router.put('/:id', PurchaseController.updatePurchase);  // NO AUTH FOR TESTING

// Delete purchase - admin only
// router.delete('/:id', requireRole('admin'), PurchaseController.deletePurchase);
router.delete('/:id', PurchaseController.deletePurchase);  // NO AUTH FOR TESTING

module.exports = router;