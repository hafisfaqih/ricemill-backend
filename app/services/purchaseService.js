const Purchase = require('../models/purchase');
const Supplier = require('../models/supplier');
const { Op } = require('sequelize');

class PurchaseService {
  /**
   * Create a new purchase
   * @param {Object} purchaseData - Purchase data
   * @returns {Promise<Object>} Created purchase
   */
  static async createPurchase(purchaseData) {
    try {
      // Verify supplier exists and is active
      const supplier = await Supplier.findByPk(purchaseData.supplier_id);
      if (!supplier) {
        throw new Error('Supplier not found');
      }
      if (supplier.status === 'inactive') {
        throw new Error('Cannot create purchase for inactive supplier');
      }

      const purchase = await Purchase.create(purchaseData);
      return await Purchase.findByPk(purchase.id, {
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person', 'phone', 'email', 'address'],
          },
        ],
      });
    } catch (error) {
      console.error('Error creating purchase:', error);
      throw error;
    }
  }

  /**
   * Get all purchases with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Purchases with pagination
   */
  static async getAllPurchases(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        supplier_id,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        riceType,
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by supplier
      if (supplier_id) {
        whereClause.supplier_id = supplier_id;
      }

      // Filter by date range
      if (startDate || endDate) {
        whereClause.purchase_date = {};
        if (startDate) {
          whereClause.purchase_date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.purchase_date[Op.lte] = new Date(endDate);
        }
      }

      // Filter by amount range
      if (minAmount || maxAmount) {
        whereClause.total_cost = {};
        if (minAmount) {
          whereClause.total_cost[Op.gte] = parseFloat(minAmount);
        }
        if (maxAmount) {
          whereClause.total_cost[Op.lte] = parseFloat(maxAmount);
        }
      }

      // Filter by rice type
      if (riceType) {
        whereClause.rice_type = {
          [Op.iLike]: `%${riceType}%`,
        };
      }

      const { count, rows } = await Purchase.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person', 'phone', 'address'],
          },
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset,
      });

      return {
        purchases: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (error) {
      console.error('Error getting purchases:', error);
      throw error;
    }
  }

  /**
   * Get purchase by ID
   * @param {number} id - Purchase ID
   * @returns {Promise<Object>} Purchase details
   */
  static async getPurchaseById(id) {
    try {
      const purchase = await Purchase.findByPk(id, {
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person', 'phone', 'email', 'address'],
          },
        ],
      });

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      return purchase;
    } catch (error) {
      console.error('Error getting purchase by ID:', error);
      throw error;
    }
  }

  /**
   * Update purchase
   * @param {number} id - Purchase ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated purchase
   */
  static async updatePurchase(id, updateData) {
    try {
      const purchase = await Purchase.findByPk(id);
      if (!purchase) {
        throw new Error('Purchase not found');
      }

      // If supplier_id is being updated, verify the new supplier exists and is active
      if (updateData.supplier_id && updateData.supplier_id !== purchase.supplier_id) {
        const supplier = await Supplier.findByPk(updateData.supplier_id);
        if (!supplier) {
          throw new Error('Supplier not found');
        }
        if (supplier.status === 'inactive') {
          throw new Error('Cannot assign purchase to inactive supplier');
        }
      }

      await purchase.update(updateData);

      return await Purchase.findByPk(id, {
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person', 'phone', 'email', 'address'],
          },
        ],
      });
    } catch (error) {
      console.error('Error updating purchase:', error);
      throw error;
    }
  }

  /**
   * Delete purchase
   * @param {number} id - Purchase ID
   * @returns {Promise<void>}
   */
  static async deletePurchase(id) {
    try {
      const purchase = await Purchase.findByPk(id, {
        include: ['sales'], // Check if purchase has associated sales
      });

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      // Check if purchase has associated sales
      if (purchase.sales && purchase.sales.length > 0) {
        throw new Error('Cannot delete purchase with associated sales');
      }

      await purchase.destroy();
    } catch (error) {
      console.error('Error deleting purchase:', error);
      throw error;
    }
  }

  /**
   * Get purchases by supplier
   * @param {number} supplierId - Supplier ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Supplier purchases
   */
  static async getPurchasesBySupplier(supplierId, options = {}) {
    try {
      const { limit = 10, sortOrder = 'DESC' } = options;

      const supplier = await Supplier.findByPk(supplierId);
      if (!supplier) {
        throw new Error('Supplier not found');
      }

      const purchases = await Purchase.findAll({
        where: { supplier_id: supplierId },
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person'],
          },
        ],
        order: [['purchase_date', sortOrder.toUpperCase()]],
        limit: parseInt(limit),
      });

      return purchases;
    } catch (error) {
      console.error('Error getting purchases by supplier:', error);
      throw error;
    }
  }

  /**
   * Search purchases
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Search results
   */
  static async searchPurchases(searchTerm) {
    try {
      const purchases = await Purchase.findAll({
        where: {
          [Op.or]: [
            { rice_type: { [Op.iLike]: `%${searchTerm}%` } },
            { quality: { [Op.iLike]: `%${searchTerm}%` } },
            { batch_number: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name', 'contact_person'],
            where: {
              [Op.or]: [
                { name: { [Op.iLike]: `%${searchTerm}%` } },
                { contact_person: { [Op.iLike]: `%${searchTerm}%` } },
              ],
            },
            required: false,
          },
        ],
        order: [['purchase_date', 'DESC']],
        limit: 20,
      });

      return purchases;
    } catch (error) {
      console.error('Error searching purchases:', error);
      throw error;
    }
  }

  /**
   * Get purchase statistics
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Purchase statistics
   */
  static async getPurchaseStats(options = {}) {
    try {
      const { startDate, endDate, supplier_id } = options;
      const whereClause = {};

      // Filter by date range
      if (startDate || endDate) {
        whereClause.purchase_date = {};
        if (startDate) {
          whereClause.purchase_date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.purchase_date[Op.lte] = new Date(endDate);
        }
      }

      // Filter by supplier
      if (supplier_id) {
        whereClause.supplier_id = supplier_id;
      }

      const stats = await Purchase.findAll({
        where: whereClause,
        attributes: [
          [Purchase.sequelize.fn('COUNT', Purchase.sequelize.col('id')), 'totalPurchases'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('quantity')), 'totalQuantity'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('weight')), 'totalWeight'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'totalCost'],
          [Purchase.sequelize.fn('AVG', Purchase.sequelize.literal('price / weight')), 'avgPricePerKg'],
        ],
        raw: true,
      });

      const riceTypeStats = await Purchase.findAll({
        where: whereClause,
        attributes: [
          'rice_type',
          [Purchase.sequelize.fn('COUNT', Purchase.sequelize.col('id')), 'count'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('weight')), 'totalWeight'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'totalCost'],
        ],
        group: ['rice_type'],
        order: [[Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'DESC']],
        raw: true,
      });

      const supplierStats = await Purchase.findAll({
        where: whereClause,
        attributes: [
          'supplier_id',
          [Purchase.sequelize.fn('COUNT', Purchase.sequelize.col('Purchase.id')), 'purchaseCount'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'totalAmount'],
        ],
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['name'],
          },
        ],
        group: ['supplier_id', 'supplier.id', 'supplier.name'],
        order: [[Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'DESC']],
        limit: 10,
      });

      return {
        summary: {
          totalPurchases: parseInt(stats[0].totalPurchases) || 0,
          totalQuantity: parseInt(stats[0].totalQuantity) || 0,
          totalWeight: parseFloat(stats[0].totalWeight) || 0,
          totalCost: parseFloat(stats[0].totalCost) || 0,
          avgPricePerKg: parseFloat(stats[0].avgPricePerKg) || 0,
        },
        riceTypeBreakdown: riceTypeStats.map(item => ({
          riceType: item.rice_type,
          count: parseInt(item.count),
          totalWeight: parseFloat(item.totalWeight),
          totalCost: parseFloat(item.totalCost),
        })),
        topSuppliers: supplierStats.map(item => ({
          supplierId: item.supplier_id,
          supplierName: item.supplier?.name,
          purchaseCount: parseInt(item.purchaseCount),
          totalAmount: parseFloat(item.totalAmount),
        })),
      };
    } catch (error) {
      console.error('Error getting purchase statistics:', error);
      throw error;
    }
  }

  /**
   * Get available inventory from purchases
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Available inventory
   */
  static async getAvailableInventory(options = {}) {
    try {
      const { riceType } = options;
      const whereClause = {};

      if (riceType) {
        whereClause.rice_type = { [Op.iLike]: `%${riceType}%` };
      }

      // Get purchases with their remaining weight (weight that hasn't been sold)
      const inventory = await Purchase.findAll({
        where: whereClause,
        attributes: [
          'id',
          'rice_type',
          'quality',
          'weight',
          'price',
          'purchase_date',
          'batch_number',
        ],
        include: [
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['id', 'name'],
          },
        ],
        order: [['purchase_date', 'ASC']], // FIFO - First In, First Out
      });

      return inventory;
    } catch (error) {
      console.error('Error getting available inventory:', error);
      throw error;
    }
  }

  /**
   * Get monthly purchase trends
   * @param {number} year - Year to analyze
   * @returns {Promise<Array>} Monthly trends
   */
  static async getMonthlyTrends(year = new Date().getFullYear()) {
    try {
      const monthlyData = await Purchase.findAll({
        where: {
          purchase_date: {
            [Op.between]: [`${year}-01-01`, `${year}-12-31`],
          },
        },
        attributes: [
          [Purchase.sequelize.fn('EXTRACT', Purchase.sequelize.literal('MONTH FROM purchase_date')), 'month'],
          [Purchase.sequelize.fn('COUNT', Purchase.sequelize.col('id')), 'purchaseCount'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('weight')), 'totalWeight'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'totalCost'],
        ],
        group: [Purchase.sequelize.fn('EXTRACT', Purchase.sequelize.literal('MONTH FROM purchase_date'))],
        order: [Purchase.sequelize.fn('EXTRACT', Purchase.sequelize.literal('MONTH FROM purchase_date'))],
        raw: true,
      });

      // Fill in missing months with zero values
      const trends = [];
      for (let month = 1; month <= 12; month++) {
        const monthData = monthlyData.find(item => parseInt(item.month) === month);
        trends.push({
          month,
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
          purchaseCount: monthData ? parseInt(monthData.purchaseCount) : 0,
          totalWeight: monthData ? parseFloat(monthData.totalWeight) : 0,
          totalCost: monthData ? parseFloat(monthData.totalCost) : 0,
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      throw error;
    }
  }
}

module.exports = PurchaseService;