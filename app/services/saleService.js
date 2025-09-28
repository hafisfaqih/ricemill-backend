const Sale = require('../models/sale');
const Purchase = require('../models/purchase');
const Supplier = require('../models/supplier');
const { Op } = require('sequelize');

class SaleService {
  /**
   * Create a new sale
   * @param {Object} saleData - Sale data
   * @returns {Promise<Object>} Created sale
   */
  static async createSale(saleData) {
    try {
      // Verify purchase exists
      const purchase = await Purchase.findByPk(saleData.purchase_id, {
        include: [{ model: Supplier, as: 'supplier' }],
      });
      
      if (!purchase) {
        throw new Error('Purchase not found');
      }

      // Check if there's enough inventory
      const existingSales = await Sale.sum('weight', {
        where: { purchase_id: saleData.purchase_id },
      });
      
      const availableWeight = purchase.weight - (existingSales || 0);
      
      if (saleData.weight > availableWeight) {
        throw new Error(`Insufficient inventory. Available: ${availableWeight}kg, Requested: ${saleData.weight}kg`);
      }

      const sale = await Sale.create(saleData);
      
      return await Sale.findByPk(sale.id, {
        include: [
          {
            model: Purchase,
            as: 'purchase',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      throw error;
    }
  }

  /**
   * Get all sales with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Sales with pagination
   */
  static async getAllSales(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        purchase_id,
        customer_name,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        riceType,
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = {};
      const purchaseWhere = {};

      // Filter by purchase
      if (purchase_id) {
        whereClause.purchase_id = purchase_id;
      }

      // Filter by customer name
      if (customer_name) {
        whereClause.customer_name = { [Op.iLike]: `%${customer_name}%` };
      }

      // Filter by date range
      if (startDate || endDate) {
        whereClause.sale_date = {};
        if (startDate) {
          whereClause.sale_date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.sale_date[Op.lte] = new Date(endDate);
        }
      }

      // Filter by amount range
      if (minAmount || maxAmount) {
        whereClause.revenue = {};
        if (minAmount) {
          whereClause.revenue[Op.gte] = parseFloat(minAmount);
        }
        if (maxAmount) {
          whereClause.revenue[Op.lte] = parseFloat(maxAmount);
        }
      }

      // Filter by rice type (through purchase)
      if (riceType) {
        purchaseWhere.rice_type = { [Op.iLike]: `%${riceType}%` };
      }

      const { count, rows } = await Sale.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Purchase,
            as: 'purchase',
            where: Object.keys(purchaseWhere).length > 0 ? purchaseWhere : undefined,
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset,
      });

      return {
        sales: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (error) {
      console.error('Error getting sales:', error);
      throw error;
    }
  }

  /**
   * Get sale by ID
   * @param {number} id - Sale ID
   * @returns {Promise<Object>} Sale details
   */
  static async getSaleById(id) {
    try {
      const sale = await Sale.findByPk(id, {
        include: [
          {
            model: Purchase,
            as: 'purchase',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name', 'contact_person'],
              },
            ],
          },
        ],
      });

      if (!sale) {
        throw new Error('Sale not found');
      }

      return sale;
    } catch (error) {
      console.error('Error getting sale by ID:', error);
      throw error;
    }
  }

  /**
   * Update sale
   * @param {number} id - Sale ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated sale
   */
  static async updateSale(id, updateData) {
    try {
      const sale = await Sale.findByPk(id);
      if (!sale) {
        throw new Error('Sale not found');
      }

      // If purchase_id or weight is being updated, verify inventory
      if (updateData.purchase_id || updateData.weight) {
        const purchaseId = updateData.purchase_id || sale.purchase_id;
        const newWeight = updateData.weight || sale.weight;

        const purchase = await Purchase.findByPk(purchaseId);
        if (!purchase) {
          throw new Error('Purchase not found');
        }

        // Calculate available inventory excluding current sale
        const existingSales = await Sale.sum('weight', {
          where: {
            purchase_id: purchaseId,
            id: { [Op.ne]: id }, // Exclude current sale
          },
        });

        const availableWeight = purchase.weight - (existingSales || 0);

        if (newWeight > availableWeight) {
          throw new Error(`Insufficient inventory. Available: ${availableWeight}kg, Requested: ${newWeight}kg`);
        }
      }

      await sale.update(updateData);

      return await Sale.findByPk(id, {
        include: [
          {
            model: Purchase,
            as: 'purchase',
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error updating sale:', error);
      throw error;
    }
  }

  /**
   * Delete sale
   * @param {number} id - Sale ID
   * @returns {Promise<void>}
   */
  static async deleteSale(id) {
    try {
      const sale = await Sale.findByPk(id);
      if (!sale) {
        throw new Error('Sale not found');
      }

      await sale.destroy();
    } catch (error) {
      console.error('Error deleting sale:', error);
      throw error;
    }
  }

  /**
   * Get sales by purchase
   * @param {number} purchaseId - Purchase ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Purchase sales
   */
  static async getSalesByPurchase(purchaseId, options = {}) {
    try {
      const { limit = 10, sortOrder = 'DESC' } = options;

      const purchase = await Purchase.findByPk(purchaseId);
      if (!purchase) {
        throw new Error('Purchase not found');
      }

      const sales = await Sale.findAll({
        where: { purchase_id: purchaseId },
        include: [
          {
            model: Purchase,
            as: 'purchase',
            attributes: ['id', 'rice_type', 'quality'],
          },
        ],
        order: [['sale_date', sortOrder.toUpperCase()]],
        limit: parseInt(limit),
      });

      return sales;
    } catch (error) {
      console.error('Error getting sales by purchase:', error);
      throw error;
    }
  }

  /**
   * Search sales
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Search results
   */
  static async searchSales(searchTerm) {
    try {
      const sales = await Sale.findAll({
        where: {
          [Op.or]: [
            { customer_name: { [Op.iLike]: `%${searchTerm}%` } },
            { customer_phone: { [Op.iLike]: `%${searchTerm}%` } },
            { customer_address: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        include: [
          {
            model: Purchase,
            as: 'purchase',
            attributes: ['id', 'rice_type', 'quality'],
            include: [
              {
                model: Supplier,
                as: 'supplier',
                attributes: ['id', 'name'],
              },
            ],
          },
        ],
        order: [['sale_date', 'DESC']],
        limit: 20,
      });

      return sales;
    } catch (error) {
      console.error('Error searching sales:', error);
      throw error;
    }
  }

  /**
   * Get sale statistics
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Sale statistics
   */
  static async getSaleStats(options = {}) {
    try {
      const { startDate, endDate, purchase_id } = options;
      const whereClause = {};

      // Filter by date range
      if (startDate || endDate) {
        whereClause.sale_date = {};
        if (startDate) {
          whereClause.sale_date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.sale_date[Op.lte] = new Date(endDate);
        }
      }

      // Filter by purchase
      if (purchase_id) {
        whereClause.purchase_id = purchase_id;
      }

      const stats = await Sale.findAll({
        where: whereClause,
        attributes: [
          [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'totalSales'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('weight')), 'totalWeight'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('revenue')), 'totalRevenue'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('net_profit')), 'totalProfit'],
          [Sale.sequelize.fn('AVG', Sale.sequelize.literal('price / weight')), 'avgPricePerKg'],
          [Sale.sequelize.fn('AVG', Sale.sequelize.col('rendement')), 'avgRendement'],
        ],
        raw: true,
      });

      const customerStats = await Sale.findAll({
        where: whereClause,
        attributes: [
          'customer_name',
          [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'salesCount'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('revenue')), 'totalRevenue'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('weight')), 'totalWeight'],
        ],
        group: ['customer_name'],
        order: [[Sale.sequelize.fn('SUM', Sale.sequelize.col('revenue')), 'DESC']],
        limit: 10,
        raw: true,
      });

      const riceTypeStats = await Sale.findAll({
        where: whereClause,
        attributes: [
          [Sale.sequelize.col('purchase.rice_type'), 'riceType'],
          [Sale.sequelize.fn('COUNT', Sale.sequelize.col('Sale.id')), 'salesCount'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('weight')), 'totalWeight'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('revenue')), 'totalRevenue'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('net_profit')), 'totalProfit'],
        ],
        include: [
          {
            model: Purchase,
            as: 'purchase',
            attributes: [],
          },
        ],
        group: ['purchase.rice_type'],
        order: [[Sale.sequelize.fn('SUM', Sale.sequelize.col('revenue')), 'DESC']],
        raw: true,
      });

      return {
        summary: {
          totalSales: parseInt(stats[0].totalSales) || 0,
          totalWeight: parseFloat(stats[0].totalWeight) || 0,
          totalRevenue: parseFloat(stats[0].totalRevenue) || 0,
          totalProfit: parseFloat(stats[0].totalProfit) || 0,
          avgPricePerKg: parseFloat(stats[0].avgPricePerKg) || 0,
          avgRendement: parseFloat(stats[0].avgRendement) || 0,
        },
        topCustomers: customerStats.map(item => ({
          customerName: item.customer_name,
          salesCount: parseInt(item.salesCount),
          totalRevenue: parseFloat(item.totalRevenue),
          totalWeight: parseFloat(item.totalWeight),
        })),
        riceTypePerformance: riceTypeStats.map(item => ({
          riceType: item.riceType,
          salesCount: parseInt(item.salesCount),
          totalWeight: parseFloat(item.totalWeight),
          totalRevenue: parseFloat(item.totalRevenue),
          totalProfit: parseFloat(item.totalProfit),
          profitMargin: item.totalRevenue ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(2) : 0,
        })),
      };
    } catch (error) {
      console.error('Error getting sale statistics:', error);
      throw error;
    }
  }

  /**
   * Get profitability analysis
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Profitability analysis
   */
  static async getProfitabilityAnalysis(options = {}) {
    try {
      const { startDate, endDate, groupBy = 'month' } = options;
      const whereClause = {};

      // Filter by date range
      if (startDate || endDate) {
        whereClause.sale_date = {};
        if (startDate) {
          whereClause.sale_date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.sale_date[Op.lte] = new Date(endDate);
        }
      }

      let dateGroup;
      switch (groupBy) {
        case 'day':
          dateGroup = Sale.sequelize.fn('DATE', Sale.sequelize.col('sale_date'));
          break;
        case 'week':
          dateGroup = Sale.sequelize.fn('DATE_TRUNC', 'week', Sale.sequelize.col('sale_date'));
          break;
        case 'month':
        default:
          dateGroup = Sale.sequelize.fn('DATE_TRUNC', 'month', Sale.sequelize.col('sale_date'));
          break;
      }

      const profitTrends = await Sale.findAll({
        where: whereClause,
        attributes: [
          [dateGroup, 'period'],
          [Sale.sequelize.fn('COUNT', Sale.sequelize.col('id')), 'salesCount'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('weight')), 'totalWeight'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('revenue')), 'totalRevenue'],
          [Sale.sequelize.fn('SUM', Sale.sequelize.col('net_profit')), 'totalProfit'],
        ],
        group: [dateGroup],
        order: [dateGroup],
        raw: true,
      });

      const formattedTrends = profitTrends.map(item => ({
        period: item.period,
        salesCount: parseInt(item.salesCount),
        totalWeight: parseFloat(item.totalWeight),
        totalRevenue: parseFloat(item.totalRevenue),
        totalProfit: parseFloat(item.totalProfit),
        profitMargin: item.totalRevenue ? ((item.totalProfit / item.totalRevenue) * 100).toFixed(2) : 0,
      }));

      return {
        trends: formattedTrends,
        summary: {
          totalPeriods: formattedTrends.length,
          totalRevenue: formattedTrends.reduce((sum, item) => sum + item.totalRevenue, 0),
          totalProfit: formattedTrends.reduce((sum, item) => sum + item.totalProfit, 0),
          averageProfitMargin: formattedTrends.length > 0 
            ? (formattedTrends.reduce((sum, item) => sum + parseFloat(item.profitMargin), 0) / formattedTrends.length).toFixed(2)
            : 0,
        },
      };
    } catch (error) {
      console.error('Error getting profitability analysis:', error);
      throw error;
    }
  }

  /**
   * Get inventory turnover analysis
   * @returns {Promise<Array>} Inventory turnover data
   */
  static async getInventoryTurnover() {
    try {
      const turnoverData = await Purchase.findAll({
        attributes: [
          'id',
          'rice_type',
          'quality',
          'weight',
          'purchase_date',
          [Purchase.sequelize.fn('SUM', Purchase.sequelize.col('sales.weight')), 'soldWeight'],
          [Purchase.sequelize.fn('COUNT', Purchase.sequelize.col('sales.id')), 'salesCount'],
        ],
        include: [
          {
            model: Sale,
            as: 'sales',
            attributes: [],
          },
          {
            model: Supplier,
            as: 'supplier',
            attributes: ['name'],
          },
        ],
        group: ['Purchase.id', 'supplier.id'],
        raw: true,
      });

      return turnoverData.map(item => {
        const soldWeight = parseFloat(item.soldWeight) || 0;
        const totalWeight = parseFloat(item.weight);
        const remainingWeight = totalWeight - soldWeight;
        const turnoverRate = totalWeight > 0 ? ((soldWeight / totalWeight) * 100).toFixed(2) : 0;
        const daysInStock = Math.floor((new Date() - new Date(item.purchase_date)) / (1000 * 60 * 60 * 24));

        return {
          purchaseId: item.id,
          riceType: item.rice_type,
          quality: item.quality,
          supplierName: item['supplier.name'],
          totalWeight,
          soldWeight,
          remainingWeight,
          turnoverRate: parseFloat(turnoverRate),
          salesCount: parseInt(item.salesCount) || 0,
          daysInStock,
          purchaseDate: item.purchase_date,
        };
      });
    } catch (error) {
      console.error('Error getting inventory turnover:', error);
      throw error;
    }
  }
}

module.exports = SaleService;