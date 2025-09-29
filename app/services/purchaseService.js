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
      const supplier = await Supplier.findByPk(purchaseData.supplierId);
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
            as: 'supplierData',
            attributes: ['id', 'name', 'contact_person', 'phone', 'address'],
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
        sortBy = 'date',
        sortOrder = 'DESC',
        supplierId,
        startDate,
        endDate,
        minTotalCost,
        maxTotalCost,
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by supplier
      if (supplierId) {
        whereClause.supplierId = supplierId;
      }

      // Filter by date range
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date[Op.gte] = new Date(startDate);
        if (endDate) whereClause.date[Op.lte] = new Date(endDate);
      }

      // Filter by amount range
      if (minTotalCost || maxTotalCost) {
        whereClause.totalCost = {};
        if (minTotalCost) whereClause.totalCost[Op.gte] = parseFloat(minTotalCost);
        if (maxTotalCost) whereClause.totalCost[Op.lte] = parseFloat(maxTotalCost);
      }

      const { count, rows } = await Purchase.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplierData',
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
            as: 'supplierData',
            attributes: ['id', 'name', 'contact_person', 'phone', 'address'],
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
      if (updateData.supplierId && updateData.supplierId !== purchase.supplierId) {
        const supplier = await Supplier.findByPk(updateData.supplierId);
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
            as: 'supplierData',
            attributes: ['id', 'name', 'contact_person', 'phone', 'address'],
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
        where: { supplierId },
        include: [
          {
            model: Supplier,
            as: 'supplierData',
            attributes: ['id', 'name', 'contact_person'],
          },
        ],
        order: [['date', sortOrder.toUpperCase()]],
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
      // Current model does not have rice_type / quality / batch_number anymore
      // So search limited to supplier name / contact person only.
      const purchases = await Purchase.findAll({
        include: [
          {
            model: Supplier,
            as: 'supplierData',
            attributes: ['id', 'name', 'contactPerson'],
            where: {
              [Op.or]: [
                { name: { [Op.iLike]: `%${searchTerm}%` } },
                { contact_person: { [Op.iLike]: `%${searchTerm}%` } },
              ],
            },
          },
        ],
        order: [['date', 'DESC']],
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
  const { startDate, endDate, supplierId } = options;
      const whereClause = {};

      // Filter by date range
      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date[Op.gte] = new Date(startDate);
        if (endDate) whereClause.date[Op.lte] = new Date(endDate);
      }

      // Filter by supplier
      if (supplierId) whereClause.supplierId = supplierId;

      const stats = await Purchase.findAll({
        where: whereClause,
        attributes: [
          [Purchase.sequelize.fn('COUNT', Purchase.sequelize.col('id')), 'totalPurchases'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('quantity')), 'totalQuantity'],
          // Derived total weight = SUM(quantity * weight)
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.literal('quantity * weight')), 'totalWeight'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'totalCost'],
          // Average unit price (price)
          [Purchase.sequelize.fn('AVG', Purchase.sequelize.col('price')), 'avgUnitPrice'],
        ],
        raw: true,
      });

      const supplierStats = await Purchase.findAll({
        where: whereClause,
        attributes: [
          'supplierId',
          [Purchase.sequelize.fn('COUNT', Purchase.sequelize.col('Purchase.id')), 'purchaseCount'],
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'totalAmount'],
        ],
        include: [
          {
            model: Supplier,
            as: 'supplierData',
            attributes: ['name'],
          },
        ],
        group: ['supplierId', 'supplier.id', 'supplier.name'],
        order: [[Purchase.sequelize.fn('SUM', Purchase.sequelize.col('total_cost')), 'DESC']],
        limit: 10,
      });

      return {
        summary: {
          totalPurchases: parseInt(stats[0].totalPurchases) || 0,
          totalQuantity: parseInt(stats[0].totalQuantity) || 0,
            totalWeight: parseFloat(stats[0].totalWeight) || 0,
          totalCost: parseFloat(stats[0].totalCost) || 0,
          avgUnitPrice: parseFloat(stats[0].avgUnitPrice) || 0,
        },
        topSuppliers: supplierStats.map(item => ({
          supplierId: item.supplierId,
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
          'quantity',
          'weight',
          'price',
          'date',
          'totalCost',
        ],
        include: [
          {
            model: Supplier,
            as: 'supplierData',
            attributes: ['id', 'name'],
          },
          {
            model: require('../models/sale'),
            as: 'sales',
            attributes: ['id', 'quantity', 'weight'],
          },
        ],
        order: [['date', 'ASC']], // FIFO
      });

      // Augment with remaining weight (totalWeight - soldWeight)
      return inventory.map(p => {
        const totalWeight = parseFloat(p.quantity) * parseFloat(p.weight);
        const soldWeight = (p.sales || []).reduce((acc, s) => acc + (parseFloat(s.quantity) * parseFloat(s.weight)), 0);
        const remainingWeight = totalWeight - soldWeight;
        return {
          ...p.toJSON(),
          totalWeight,
          soldWeight,
          remainingWeight,
        };
      });
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