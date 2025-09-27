const SupplierService = require('../services/supplierService');

class SupplierController {
  /**
   * Create a new supplier
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createSupplier(req, res) {
    try {
      const supplier = await SupplierService.createSupplier(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: supplier,
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      
      // Handle specific errors
      if (error.message.includes('already exists')) {
        return res.status(409).json({
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
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get all suppliers with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllSuppliers(req, res) {
    try {
      const result = await SupplierService.getAllSuppliers(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Suppliers retrieved successfully',
        data: result.suppliers,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error getting suppliers:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get supplier by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSupplierById(req, res) {
    try {
      const supplier = await SupplierService.getSupplierById(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Supplier retrieved successfully',
        data: supplier,
      });
    } catch (error) {
      console.error('Error getting supplier by ID:', error);
      
      if (error.message === 'Supplier not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Update supplier by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateSupplier(req, res) {
    try {
      const supplier = await SupplierService.updateSupplier(req.params.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Supplier updated successfully',
        data: supplier,
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      
      if (error.message === 'Supplier not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
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
        message: 'Internal server error',
      });
    }
  }

  /**
   * Delete supplier by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteSupplier(req, res) {
    try {
      await SupplierService.deleteSupplier(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      
      if (error.message === 'Supplier not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get active suppliers only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getActiveSuppliers(req, res) {
    try {
      const suppliers = await SupplierService.getActiveSuppliers();
      
      res.status(200).json({
        success: true,
        message: 'Active suppliers retrieved successfully',
        data: suppliers,
      });
    } catch (error) {
      console.error('Error getting active suppliers:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Search suppliers by name
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchSuppliers(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required',
        });
      }

      const suppliers = await SupplierService.searchSuppliersByName(searchTerm);
      
      res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: suppliers,
      });
    } catch (error) {
      console.error('Error searching suppliers:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Toggle supplier status (active/inactive)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async toggleSupplierStatus(req, res) {
    try {
      const supplier = await SupplierService.toggleSupplierStatus(req.params.id);
      
      res.status(200).json({
        success: true,
        message: `Supplier status changed to ${supplier.status}`,
        data: supplier,
      });
    } catch (error) {
      console.error('Error toggling supplier status:', error);
      
      if (error.message === 'Supplier not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * Get supplier statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getSupplierStats(req, res) {
    try {
      const stats = await SupplierService.getSupplierStats();
      
      res.status(200).json({
        success: true,
        message: 'Supplier statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('Error getting supplier statistics:', error);
      
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
}

module.exports = SupplierController;