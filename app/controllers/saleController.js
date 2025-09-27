const SaleService = require('../services/saleService');

class SaleController {
  /**
   * Create a new sale
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createSale(req, res) {
    try {
      const sale = await SaleService.createSale(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Sale created successfully',
        data: sale,
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('Insufficient inventory')) {
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
        message: 'Failed to create sale',
      });
    }
  }

  /**
   * Get all sales with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllSales(req, res) {
    try {
      const result = await SaleService.getAllSales(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Sales retrieved successfully',
        data: result.sales,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error getting sales:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get sales',
      });
    }
  }

  /**
   * Get sale by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSaleById(req, res) {
    try {
      const sale = await SaleService.getSaleById(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Sale retrieved successfully',
        data: sale,
      });
    } catch (error) {
      console.error('Error getting sale by ID:', error);
      
      if (error.message === 'Sale not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get sale',
      });
    }
  }

  /**
   * Update sale
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateSale(req, res) {
    try {
      const sale = await SaleService.updateSale(req.params.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Sale updated successfully',
        data: sale,
      });
    } catch (error) {
      console.error('Error updating sale:', error);
      
      if (error.message === 'Sale not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('not found') || error.message.includes('Insufficient inventory')) {
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
        message: 'Failed to update sale',
      });
    }
  }

  /**
   * Delete sale
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteSale(req, res) {
    try {
      await SaleService.deleteSale(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Sale deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      
      if (error.message === 'Sale not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete sale',
      });
    }
  }

  /**
   * Get sales by purchase
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSalesByPurchase(req, res) {
    try {
      const sales = await SaleService.getSalesByPurchase(
        req.params.purchaseId,
        req.query
      );
      
      res.status(200).json({
        success: true,
        message: 'Purchase sales retrieved successfully',
        data: sales,
      });
    } catch (error) {
      console.error('Error getting sales by purchase:', error);
      
      if (error.message === 'Purchase not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get purchase sales',
      });
    }
  }

  /**
   * Search sales
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchSales(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required',
        });
      }

      const sales = await SaleService.searchSales(searchTerm);
      
      res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: sales,
      });
    } catch (error) {
      console.error('Error searching sales:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to search sales',
      });
    }
  }

  /**
   * Get sale statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSaleStats(req, res) {
    try {
      const stats = await SaleService.getSaleStats(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Sale statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('Error getting sale statistics:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get sale statistics',
      });
    }
  }

  /**
   * Get profitability analysis
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getProfitabilityAnalysis(req, res) {
    try {
      const analysis = await SaleService.getProfitabilityAnalysis(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Profitability analysis retrieved successfully',
        data: analysis,
      });
    } catch (error) {
      console.error('Error getting profitability analysis:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get profitability analysis',
      });
    }
  }

  /**
   * Get inventory turnover analysis
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getInventoryTurnover(req, res) {
    try {
      const turnover = await SaleService.getInventoryTurnover();
      
      res.status(200).json({
        success: true,
        message: 'Inventory turnover analysis retrieved successfully',
        data: turnover,
      });
    } catch (error) {
      console.error('Error getting inventory turnover:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get inventory turnover analysis',
      });
    }
  }
}

module.exports = SaleController;