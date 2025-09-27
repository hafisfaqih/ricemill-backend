const InvoiceService = require('../services/invoiceService');

class InvoiceController {
  /**
   * Create a new invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async createInvoice(req, res) {
    try {
      // Generate invoice number if not provided
      if (!req.body.invoice_number) {
        req.body.invoice_number = await InvoiceService.generateInvoiceNumber(
          req.body.invoice_date ? new Date(req.body.invoice_date) : new Date()
        );
      }

      const invoice = await InvoiceService.createInvoice(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Invoice created successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      
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

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'Invoice number already exists',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to create invoice',
      });
    }
  }

  /**
   * Get all invoices with pagination and filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllInvoices(req, res) {
    try {
      const result = await InvoiceService.getAllInvoices(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Invoices retrieved successfully',
        data: result.invoices,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error getting invoices:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get invoices',
      });
    }
  }

  /**
   * Get invoice by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getInvoiceById(req, res) {
    try {
      const invoice = await InvoiceService.getInvoiceById(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Invoice retrieved successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get invoice',
      });
    }
  }

  /**
   * Update invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateInvoice(req, res) {
    try {
      const invoice = await InvoiceService.updateInvoice(req.params.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Invoice updated successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
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
        message: 'Failed to update invoice',
      });
    }
  }

  /**
   * Delete invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteInvoice(req, res) {
    try {
      await InvoiceService.deleteInvoice(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'Invoice deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting invoice:', error);
      
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete invoice',
      });
    }
  }

  /**
   * Mark invoice as paid
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async markAsPaid(req, res) {
    try {
      const invoice = await InvoiceService.markAsPaid(req.params.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Invoice marked as paid successfully',
        data: invoice,
      });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('already paid')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to mark invoice as paid',
      });
    }
  }

  /**
   * Add item to invoice
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async addInvoiceItem(req, res) {
    try {
      const item = await InvoiceService.addInvoiceItem(req.params.id, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Invoice item added successfully',
        data: item,
      });
    } catch (error) {
      console.error('Error adding invoice item:', error);
      
      if (error.message === 'Invoice not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('paid invoice')) {
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
        message: 'Failed to add invoice item',
      });
    }
  }

  /**
   * Update invoice item
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateInvoiceItem(req, res) {
    try {
      const item = await InvoiceService.updateInvoiceItem(req.params.itemId, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Invoice item updated successfully',
        data: item,
      });
    } catch (error) {
      console.error('Error updating invoice item:', error);
      
      if (error.message === 'Invoice item not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('paid invoice')) {
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
        message: 'Failed to update invoice item',
      });
    }
  }

  /**
   * Delete invoice item
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteInvoiceItem(req, res) {
    try {
      await InvoiceService.deleteInvoiceItem(req.params.itemId);
      
      res.status(200).json({
        success: true,
        message: 'Invoice item deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting invoice item:', error);
      
      if (error.message === 'Invoice item not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('paid invoice')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete invoice item',
      });
    }
  }

  /**
   * Search invoices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchInvoices(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required',
        });
      }

      const invoices = await InvoiceService.searchInvoices(searchTerm);
      
      res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: invoices,
      });
    } catch (error) {
      console.error('Error searching invoices:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to search invoices',
      });
    }
  }

  /**
   * Get overdue invoices
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getOverdueInvoices(req, res) {
    try {
      const overdueInvoices = await InvoiceService.getOverdueInvoices(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Overdue invoices retrieved successfully',
        data: overdueInvoices,
      });
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get overdue invoices',
      });
    }
  }

  /**
   * Get invoice statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getInvoiceStats(req, res) {
    try {
      const stats = await InvoiceService.getInvoiceStats(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Invoice statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('Error getting invoice statistics:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get invoice statistics',
      });
    }
  }

  /**
   * Get monthly invoice trends
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getMonthlyTrends(req, res) {
    try {
      const { year } = req.query;
      const trends = await InvoiceService.getMonthlyTrends(year ? parseInt(year) : undefined);
      
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

  /**
   * Get aging report
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAgingReport(req, res) {
    try {
      const agingReport = await InvoiceService.getAgingReport();
      
      res.status(200).json({
        success: true,
        message: 'Aging report retrieved successfully',
        data: agingReport,
      });
    } catch (error) {
      console.error('Error getting aging report:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get aging report',
      });
    }
  }

  /**
   * Generate invoice number
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async generateInvoiceNumber(req, res) {
    try {
      const { date } = req.query;
      const invoiceNumber = await InvoiceService.generateInvoiceNumber(
        date ? new Date(date) : new Date()
      );
      
      res.status(200).json({
        success: true,
        message: 'Invoice number generated successfully',
        data: { invoice_number: invoiceNumber },
      });
    } catch (error) {
      console.error('Error generating invoice number:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate invoice number',
      });
    }
  }
}

module.exports = InvoiceController;