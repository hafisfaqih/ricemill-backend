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

      const purchases = await Purchase.findAll({
        where: whereClause,
        include: [
          {
            model: Supplier,
            as: 'supplierData',
            attributes: ['id', 'name'],
          },
        ],
      });

      let totalPurchases = 0;
      let totalQuantity = 0;
      let totalWeight = 0;
      let totalCost = 0;
      let totalPrice = 0;

      const supplierAgg = new Map();

      purchases.forEach(purchase => {
        totalPurchases += 1;

        const quantity = Number(purchase.quantity) || 0;
        const weight = Number(purchase.weight) || 0;
        const extraWeight = Number(purchase.extraWeight) || 0;
        const price = Number(purchase.price) || 0;
        const truckCost = Number(purchase.truckCost) || 0;
        const laborCost = Number(purchase.laborCost) || 0;
        const pelletCost = Number(purchase.pelletCost) || 0;
        const unitWeight = weight + extraWeight;
        const computedCost = quantity * unitWeight * price + truckCost + laborCost + pelletCost;
        const cost = Number(purchase.totalCost) || computedCost;

        totalQuantity += quantity;
        totalWeight += quantity * unitWeight;
        totalCost += cost;
        totalPrice += price;

        if (purchase.supplierId) {
          const existing = supplierAgg.get(purchase.supplierId) || {
            supplierId: purchase.supplierId,
            supplierName: purchase.supplierData?.name || null,
            purchaseCount: 0,
            totalAmount: 0,
          };

          existing.purchaseCount += 1;
          existing.totalAmount += cost;
          supplierAgg.set(purchase.supplierId, existing);
        }
      });

      const supplierStats = Array.from(supplierAgg.values())
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      const avgUnitPrice = totalPurchases > 0 ? totalPrice / totalPurchases : 0;

      return {
        summary: {
          totalPurchases,
          totalQuantity,
          totalWeight,
          totalCost,
          avgUnitPrice,
        },
        topSuppliers: supplierStats.map(item => ({
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          purchaseCount: item.purchaseCount,
          totalAmount: item.totalAmount,
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
          'extraWeight',
          'price',
          'date',
          'totalCost',
          'pelletCost',
          'truckCost',
          'laborCost',
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
            attributes: ['id', 'quantity', 'weight', 'extraWeight'],
          },
        ],
        order: [['date', 'ASC']], // FIFO
      });

      // Augment with remaining weight (totalWeight - soldWeight)
      return inventory.map(p => {
        const unitWeight = parseFloat(p.weight) + parseFloat(p.extraWeight || 0);
        const totalWeight = parseFloat(p.quantity) * unitWeight;
        const soldWeight = (p.sales || []).reduce((acc, s) => {
          const saleUnitWeight = parseFloat(s.weight) + parseFloat(s.extraWeight || 0);
          return acc + (parseFloat(s.quantity) * saleUnitWeight);
        }, 0);
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
      const purchases = await Purchase.findAll({
        where: {
          date: {
            [Op.between]: [new Date(`${year}-01-01`), new Date(`${year}-12-31`)],
          },
        },
        attributes: ['id', 'date', 'quantity', 'weight', 'extraWeight', 'totalCost'],
      });

      const monthlyTotals = Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        monthName: new Date(year, index).toLocaleString('default', { month: 'long' }),
        purchaseCount: 0,
        totalWeight: 0,
        totalCost: 0,
      }));

      purchases.forEach(purchase => {
        const purchaseDate = purchase.date ? new Date(purchase.date) : null;
        if (!purchaseDate || Number.isNaN(purchaseDate.getMonth())) return;

        const monthIndex = purchaseDate.getMonth();
    const quantity = Number(purchase.quantity) || 0;
    const weight = Number(purchase.weight) || 0;
    const extraWeight = Number(purchase.extraWeight) || 0;
        const totalCost = Number(purchase.totalCost) || 0;

        const monthBucket = monthlyTotals[monthIndex];
        monthBucket.purchaseCount += 1;
    monthBucket.totalWeight += quantity * (weight + extraWeight);
        monthBucket.totalCost += totalCost;
      });

      return monthlyTotals;
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      throw error;
    }
  }
}

module.exports = PurchaseService;