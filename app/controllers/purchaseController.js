const PurchaseService = require('../services/purchaseService');

class PurchaseController {
  /**
   * Create a new purchase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createPurchase(req, res) {
    try {
      // Backward compatibility: normalize snake_case -> camelCase
      const body = { ...req.body };
      if (body.supplier_id && !body.supplierId) body.supplierId = body.supplier_id;
      if (body.truck_cost && !body.truckCost) body.truckCost = body.truck_cost;
      if (body.labor_cost && !body.laborCost) body.laborCost = body.labor_cost;
  if (body.extra_weight && !body.extraWeight) body.extraWeight = body.extra_weight;
  if (body.pellet_cost && !body.pelletCost) body.pelletCost = body.pellet_cost;
      if (body.total_cost && !body.totalCost) body.totalCost = body.total_cost; // usually recalculated by hooks
      const purchase = await PurchaseService.createPurchase(body);
      
      res.status(201).json({
        success: true,
        message: 'Purchase created successfully',
        data: purchase,
      });
    } catch (error) {
      console.error('Error creating purchase:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('inactive')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create purchase',
      });
    }
  }

  /**
   * Get all purchases with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllPurchases(req, res) {
    try {
      // Normalize query params
      const q = { ...req.query };
      if (q.supplier_id && !q.supplierId) q.supplierId = q.supplier_id;
      if (q.start_date && !q.startDate) q.startDate = q.start_date;
      if (q.end_date && !q.endDate) q.endDate = q.end_date;
      if (q.min_total_cost && !q.minTotalCost) q.minTotalCost = q.min_total_cost;
      if (q.max_total_cost && !q.maxTotalCost) q.maxTotalCost = q.max_total_cost;
      const result = await PurchaseService.getAllPurchases(q);
      
      res.status(200).json({
        success: true,
        message: 'Purchases retrieved successfully',
        data: result.purchases,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error getting purchases:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get purchases',
      });
    }
  }

  /**
   * Get purchase by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getPurchaseById(req, res) {
    try {
      const purchase = await PurchaseService.getPurchaseById(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Purchase retrieved successfully',
        data: purchase,
      });
    } catch (error) {
      console.error('Error getting purchase by ID:', error);
      
      if (error.message === 'Purchase not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get purchase',
      });
    }
  }

  /**
   * Update purchase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updatePurchase(req, res) {
    try {
      const body = { ...req.body };
      if (body.supplier_id && !body.supplierId) body.supplierId = body.supplier_id;
      if (body.truck_cost && !body.truckCost) body.truckCost = body.truck_cost;
      if (body.labor_cost && !body.laborCost) body.laborCost = body.labor_cost;
  if (body.extra_weight && !body.extraWeight) body.extraWeight = body.extra_weight;
  if (body.pellet_cost && !body.pelletCost) body.pelletCost = body.pellet_cost;
      if (body.total_cost && !body.totalCost) body.totalCost = body.total_cost;
      const purchase = await PurchaseService.updatePurchase(req.params.id, body);
      
      res.status(200).json({
        success: true,
        message: 'Purchase updated successfully',
        data: purchase,
      });
    } catch (error) {
      console.error('Error updating purchase:', error);
      
      if (error.message === 'Purchase not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('not found') || error.message.includes('inactive')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update purchase',
      });
    }
  }

  /**
   * Delete purchase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deletePurchase(req, res) {
    try {
      await PurchaseService.deletePurchase(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Purchase deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting purchase:', error);
      
      if (error.message === 'Purchase not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('associated sales')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete purchase',
      });
    }
  }

  /**
   * Get purchases by supplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getPurchasesBySupplier(req, res) {
    try {
      const purchases = await PurchaseService.getPurchasesBySupplier(
        req.params.supplierId,
        req.query
      );
      
      res.status(200).json({
        success: true,
        message: 'Supplier purchases retrieved successfully',
        data: purchases,
      });
    } catch (error) {
      console.error('Error getting purchases by supplier:', error);
      
      if (error.message === 'Supplier not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get supplier purchases',
      });
    }
  }

  /**
   * Search purchases
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchPurchases(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required',
        });
      }

      const purchases = await PurchaseService.searchPurchases(searchTerm);
      
      res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: purchases,
      });
    } catch (error) {
      console.error('Error searching purchases:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to search purchases',
      });
    }
  }

  /**
   * Get purchase statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getPurchaseStats(req, res) {
    try {
      const stats = await PurchaseService.getPurchaseStats(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Purchase statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('Error getting purchase statistics:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get purchase statistics',
      });
    }
  }

  /**
   * Get available inventory
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAvailableInventory(req, res) {
    try {
      const inventory = await PurchaseService.getAvailableInventory(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Available inventory retrieved successfully',
        data: inventory,
      });
    } catch (error) {
      console.error('Error getting available inventory:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get available inventory',
      });
    }
  }

  /**
   * Get monthly purchase trends
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMonthlyTrends(req, res) {
    try {
      const { year } = req.query;
      const trends = await PurchaseService.getMonthlyTrends(year ? parseInt(year) : undefined);
      
      res.status(200).json({
        success: true,
        message: 'Monthly trends retrieved successfully',
        data: trends,
      });
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get monthly trends',
      });
    }
  }
}

module.exports = PurchaseController;