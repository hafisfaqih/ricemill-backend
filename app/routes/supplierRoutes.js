const express = require('express');
const SupplierController = require('../controllers/supplierController');
const { validateSupplier } = require('../validators/supplierValidator');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Suppliers
 *   description: Supplier management endpoints
 */

/**
 * @swagger
 * /api/suppliers/stats:
 *   get:
 *     summary: Get supplier statistics
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: Supplier statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_suppliers:
 *                       type: integer
 *                       example: 25
 *                     active_suppliers:
 *                       type: integer
 *                       example: 20
 *                     inactive_suppliers:
 *                       type: integer
 *                       example: 5
 */
router.get('/stats', SupplierController.getSupplierStats);

/**
 * @swagger
 * /api/suppliers/active:
 *   get:
 *     summary: Get all active suppliers
 *     tags: [Suppliers]
 *     responses:
 *       200:
 *         description: Active suppliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 */
router.get('/active', SupplierController.getActiveSuppliers);

/**
 * @swagger
 * /api/suppliers/search:
 *   get:
 *     summary: Search suppliers by name
 *     tags: [Suppliers]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Search term for supplier name
 *         example: "Beras"
 *     responses:
 *       200:
 *         description: Suppliers found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 */
router.get('/search', SupplierController.searchSuppliers);

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: Get all suppliers with pagination and filtering
 *     tags: [Suppliers]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or contact person
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *           default: all
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Suppliers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Supplier'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationInfo'
 *   post:
 *     summary: Create a new supplier
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SupplierCreate'
 *     responses:
 *       201:
 *         description: Supplier created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Supplier created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Supplier'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateSupplier('query'), SupplierController.getAllSuppliers);
router.post('/', validateSupplier('create'), SupplierController.createSupplier);

/**
 * @route GET /api/suppliers/:id
 * @desc Get supplier by ID
 * @access Public
 * @param {number} id - Supplier ID
 */
router.get('/:id', validateSupplier('id'), SupplierController.getSupplierById);

/**
 * @route PUT /api/suppliers/:id
 * @desc Update supplier by ID
 * @access Public
 * @param {number} id - Supplier ID
 * @body {string} name - Supplier name (optional)
 * @body {string} contactPerson - Contact person name (optional)
 * @body {string} phone - Phone number (optional)
 * @body {string} address - Address (optional)
 * @body {string} status - Status: active or inactive (optional)
 */
router.put('/:id', 
  validateSupplier('id'), 
  validateSupplier('update'), 
  SupplierController.updateSupplier
);

/**
 * @route DELETE /api/suppliers/:id
 * @desc Delete supplier by ID
 * @access Public
 * @param {number} id - Supplier ID
 */
router.delete('/:id', validateSupplier('id'), SupplierController.deleteSupplier);

/**
 * @route PATCH /api/suppliers/:id/toggle-status
 * @desc Toggle supplier status (active/inactive)
 * @access Public
 * @param {number} id - Supplier ID
 */
router.patch('/:id/toggle-status', 
  validateSupplier('id'), 
  SupplierController.toggleSupplierStatus
);

module.exports = router;