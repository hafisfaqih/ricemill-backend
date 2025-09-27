const Supplier = require('../models/supplier');
const { Op } = require('sequelize');

class SupplierService {
  /**
   * Create a new supplier
   * @param {Object} supplierData - The supplier data
   * @returns {Promise<Object>} Created supplier
   */
  static async createSupplier(supplierData) {
    try {
      // Check if supplier with same name already exists
      const existingSupplier = await Supplier.findOne({
        where: {
          name: {
            [Op.iLike]: supplierData.name.trim(),
          },
        },
      });

      if (existingSupplier) {
        throw new Error('Supplier with this name already exists');
      }

      const supplier = await Supplier.create(supplierData);
      return supplier;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all suppliers with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Suppliers with pagination info
   */
  static async getAllSuppliers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = 'all',
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          {
            name: {
              [Op.iLike]: `%${search}%`,
            },
          },
          {
            contact_person: {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      // Add status filter
      if (status !== 'all') {
        whereClause.status = status;
      }

      const { count, rows: suppliers } = await Supplier.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['name', 'ASC']],
      });

      const totalPages = Math.ceil(count / limit);

      return {
        suppliers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get supplier by ID
   * @param {number} id - Supplier ID
   * @returns {Promise<Object>} Supplier data
   */
  static async getSupplierById(id) {
    try {
      const supplier = await Supplier.findByPk(id);
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      return supplier;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update supplier by ID
   * @param {number} id - Supplier ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated supplier
   */
  static async updateSupplier(id, updateData) {
    try {
      const supplier = await Supplier.findByPk(id);
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      // Check if updating name and if new name already exists
      if (updateData.name && updateData.name !== supplier.name) {
        const existingSupplier = await Supplier.findOne({
          where: {
            name: {
              [Op.iLike]: updateData.name.trim(),
            },
            id: {
              [Op.ne]: id,
            },
          },
        });

        if (existingSupplier) {
          throw new Error('Supplier with this name already exists');
        }
      }

      await supplier.update(updateData);
      return supplier;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete supplier by ID
   * @param {number} id - Supplier ID
   * @returns {Promise<boolean>} Success status
   */
  static async deleteSupplier(id) {
    try {
      const supplier = await Supplier.findByPk(id);
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      await supplier.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get active suppliers only
   * @returns {Promise<Array>} Active suppliers
   */
  static async getActiveSuppliers() {
    try {
      const suppliers = await Supplier.findActiveSuppliers();
      return suppliers;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search suppliers by name
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching suppliers
   */
  static async searchSuppliersByName(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return [];
      }

      const suppliers = await Supplier.findByName(searchTerm.trim());
      return suppliers;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Toggle supplier status
   * @param {number} id - Supplier ID
   * @returns {Promise<Object>} Updated supplier
   */
  static async toggleSupplierStatus(id) {
    try {
      const supplier = await Supplier.findByPk(id);
      
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      const newStatus = supplier.status === 'active' ? 'inactive' : 'active';
      await supplier.update({ status: newStatus });
      
      return supplier;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get supplier statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getSupplierStats() {
    try {
      const totalSuppliers = await Supplier.count();
      const activeSuppliers = await Supplier.count({
        where: { status: 'active' },
      });
      const inactiveSuppliers = await Supplier.count({
        where: { status: 'inactive' },
      });

      return {
        total: totalSuppliers,
        active: activeSuppliers,
        inactive: inactiveSuppliers,
        activePercentage: totalSuppliers > 0 ? ((activeSuppliers / totalSuppliers) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SupplierService;