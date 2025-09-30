const Sale = require('../models/sale');
const Purchase = require('../models/purchase');
const Supplier = require('../models/supplier');
const { Op } = require('sequelize');
const { sequelize } = require('../../config/db');

/**
 * SaleService
 * Clean implementation aligned with current models (camelCase fields, derived revenue)
 */
class SaleService {
  // -------- Helper utilities --------
  static _computeRevenue(row) {
    const unitWeight = parseFloat(row.weight) + parseFloat(row.extraWeight || 0);
    return parseFloat(row.quantity) * unitWeight * parseFloat(row.price);
  }

  static _computeTotalWeight(row) {
    const unitWeight = parseFloat(row.weight) + parseFloat(row.extraWeight || 0);
    return parseFloat(row.quantity) * unitWeight;
  }

  static async _getSoldWeightForPurchase(purchaseId, excludeSaleId = null) {
    if (!purchaseId) return 0;
    const where = { purchaseId };
    if (excludeSaleId) where.id = { [Op.ne]: excludeSaleId };

    // Aggregate quantity * weight
    const result = await Sale.findAll({
      where,
      attributes: [
        [
          sequelize.fn(
            'COALESCE',
            sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0))')),
            0
          ),
          'soldWeight'
        ],
      ],
      raw: true,
    });
    return parseFloat(result[0].soldWeight) || 0;
  }

  static _serializeSale(row) {
    if (!row) return row;
    const sale = row.toJSON ? row.toJSON() : row;
    sale.revenue = this._computeRevenue(sale);
    sale.totalWeight = this._computeTotalWeight(sale);
    return sale;
  }

  // -------- CRUD --------
  static async createSale(data) {
    try {
      const { purchaseId, quantity, weight, extraWeight = 0 } = data;

      if (purchaseId) {
        const purchase = await Purchase.findByPk(purchaseId, { include: [{ model: Supplier, as: 'supplierData' }] });
        if (!purchase) throw new Error('Purchase not found');

        const purchaseUnitWeight = parseFloat(purchase.weight) + parseFloat(purchase.extraWeight || 0);
        const purchaseTotalWeight = parseFloat(purchase.quantity) * purchaseUnitWeight;
        const existingSoldWeight = await this._getSoldWeightForPurchase(purchaseId);
        const unitWeight = parseFloat(weight) + parseFloat(extraWeight || 0);
        const newSoldWeight = parseFloat(quantity) * unitWeight;
        const available = purchaseTotalWeight - existingSoldWeight;
        if (newSoldWeight > available) {
          throw new Error(`Insufficient inventory. Available: ${available.toFixed(2)}kg, Requested: ${newSoldWeight.toFixed(2)}kg`);
        }
      }

      const sale = await Sale.create(data);
      const created = await Sale.findByPk(sale.id, {
        include: [
          {
            model: Purchase,
            as: 'purchaseData',
            include: [{ model: Supplier, as: 'supplierData', attributes: ['id', 'name'] }],
          },
        ],
      });
      return this._serializeSale(created);
    } catch (err) {
      console.error('Error creating sale:', err);
      throw err;
    }
  }

  static async getAllSales(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'date',
        sortOrder = 'DESC',
        purchaseId,
        startDate,
        endDate,
        minRevenue,
        maxRevenue,
        minNetProfit,
        maxNetProfit,
      } = options;

      const where = {};
      if (purchaseId) where.purchaseId = purchaseId;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date[Op.gte] = new Date(startDate);
        if (endDate) where.date[Op.lte] = new Date(endDate);
      }

      const offset = (page - 1) * limit;
      const { count, rows } = await Sale.findAndCountAll({
        where,
        include: [
          {
            model: Purchase,
            as: 'purchaseData',
            include: [{ model: Supplier, as: 'supplierData', attributes: ['id', 'name'] }],
          },
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset,
      });

      // Derived filtering (revenue / netProfit) post query (simple approach)
      let sales = rows.map(r => this._serializeSale(r));
      sales = sales.filter(s => {
        if (minRevenue && s.revenue < parseFloat(minRevenue)) return false;
        if (maxRevenue && s.revenue > parseFloat(maxRevenue)) return false;
        if (minNetProfit && parseFloat(s.netProfit || 0) < parseFloat(minNetProfit)) return false;
        if (maxNetProfit && parseFloat(s.netProfit || 0) > parseFloat(maxNetProfit)) return false;
        return true;
      });

      return {
        sales,
        pagination: {
          currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            // Note: totalItems reflects DB count before derived revenue filtering
            totalItems: count,
            itemsPerPage: parseInt(limit),
        },
      };
    } catch (err) {
      console.error('Error getting sales:', err);
      throw err;
    }
  }

  static async getSaleById(id) {
    try {
      const sale = await Sale.findByPk(id, {
        include: [
          {
            model: Purchase,
            as: 'purchaseData',
            include: [{ model: Supplier, as: 'supplierData', attributes: ['id', 'name'] }],
          },
        ],
      });
      if (!sale) throw new Error('Sale not found');
      return this._serializeSale(sale);
    } catch (err) {
      console.error('Error getting sale by ID:', err);
      throw err;
    }
  }

  static async updateSale(id, updateData) {
    try {
      const sale = await Sale.findByPk(id);
      if (!sale) throw new Error('Sale not found');

      const effectivePurchaseId = updateData.purchaseId || sale.purchaseId;
      const newQuantity = updateData.quantity || sale.quantity;
      const newWeightUnit = updateData.weight !== undefined ? updateData.weight : sale.weight;
      const newExtraWeight = updateData.extraWeight !== undefined ? updateData.extraWeight : (sale.extraWeight || 0);

      if (effectivePurchaseId) {
        const purchase = await Purchase.findByPk(effectivePurchaseId);
        if (!purchase) throw new Error('Purchase not found');

        const purchaseUnitWeight = parseFloat(purchase.weight) + parseFloat(purchase.extraWeight || 0);
        const purchaseTotalWeight = parseFloat(purchase.quantity) * purchaseUnitWeight;
        const existingSoldWeight = await this._getSoldWeightForPurchase(effectivePurchaseId, id);
        const unitWeight = parseFloat(newWeightUnit) + parseFloat(newExtraWeight || 0);
        const newSoldWeight = parseFloat(newQuantity) * unitWeight;
        const available = purchaseTotalWeight - existingSoldWeight;
        if (newSoldWeight > available) {
          throw new Error(`Insufficient inventory. Available: ${available.toFixed(2)}kg, Requested: ${newSoldWeight.toFixed(2)}kg`);
        }
      }

      await sale.update(updateData);

      const updated = await Sale.findByPk(id, {
        include: [
          {
            model: Purchase,
            as: 'purchaseData',
            include: [{ model: Supplier, as: 'supplierData', attributes: ['id', 'name'] }],
          },
        ],
      });
      return this._serializeSale(updated);
    } catch (err) {
      console.error('Error updating sale:', err);
      throw err;
    }
  }

  static async deleteSale(id) {
    try {
      const sale = await Sale.findByPk(id);
      if (!sale) throw new Error('Sale not found');
      await sale.destroy();
    } catch (err) {
      console.error('Error deleting sale:', err);
      throw err;
    }
  }

  static async getSalesByPurchase(purchaseId, options = {}) {
    try {
      const { limit = 10, sortOrder = 'DESC' } = options;
      const purchase = await Purchase.findByPk(purchaseId);
      if (!purchase) throw new Error('Purchase not found');

      const sales = await Sale.findAll({
        where: { purchaseId },
        include: [
          {
            model: Purchase,
            as: 'purchaseData',
            include: [{ model: Supplier, as: 'supplierData', attributes: ['id', 'name'] }],
          },
        ],
        order: [['date', sortOrder.toUpperCase()]],
        limit: parseInt(limit),
      });
      return sales.map(r => this._serializeSale(r));
    } catch (err) {
      console.error('Error getting sales by purchase:', err);
      throw err;
    }
  }

  static async searchSales(searchTerm) {
    try {
      const sales = await Sale.findAll({
        where: {
          [Op.or]: [
            { '$purchaseData.supplierData.name$': { [Op.iLike]: `%${searchTerm}%` } },
            { '$purchaseData.supplier$': { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        include: [
          {
            model: Purchase,
            as: 'purchaseData',
            include: [{ model: Supplier, as: 'supplierData', attributes: ['id', 'name'] }],
          },
        ],
        order: [['date', 'DESC']],
        limit: 50,
      });
      return sales.map(r => this._serializeSale(r));
    } catch (err) {
      console.error('Error searching sales:', err);
      throw err;
    }
  }

  static async getSaleStats(options = {}) {
    try {
      const { startDate, endDate, purchaseId } = options;
      const where = {};
      if (purchaseId) where.purchaseId = purchaseId;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date[Op.gte] = new Date(startDate);
        if (endDate) where.date[Op.lte] = new Date(endDate);
      }

      const aggregate = await Sale.findAll({
        where,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
          [sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0))')), 'totalWeight'],
          [sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0)) * price')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.col('net_profit')), 'totalProfit'],
          [sequelize.fn('AVG', sequelize.col('price')), 'avgUnitPrice'],
        ],
        raw: true,
      });

      const agg = aggregate[0] || {};
      const rendementRows = await Sale.findAll({ where, attributes: ['rendement'], raw: true });
      const rendementValues = rendementRows
        .map(r => (r.rendement ? parseFloat(String(r.rendement).replace('%', '')) : null))
        .filter(v => v !== null);
      const avgRendement = rendementValues.length
        ? (rendementValues.reduce((a, b) => a + b, 0) / rendementValues.length).toFixed(2)
        : '0.00';

      return {
        summary: {
          totalSales: parseInt(agg.totalSales) || 0,
          totalWeight: parseFloat(agg.totalWeight) || 0,
          totalRevenue: parseFloat(agg.totalRevenue) || 0,
          totalProfit: parseFloat(agg.totalProfit) || 0,
          avgUnitPrice: parseFloat(agg.avgUnitPrice) || 0,
          avgRendement: parseFloat(avgRendement),
          profitMargin: agg.totalRevenue && parseFloat(agg.totalRevenue) > 0
            ? ((parseFloat(agg.totalProfit || 0) / parseFloat(agg.totalRevenue)) * 100).toFixed(2)
            : '0.00',
        },
      };
    } catch (err) {
      console.error('Error getting sale statistics:', err);
      throw err;
    }
  }

  static async getProfitabilityAnalysis(options = {}) {
    try {
      const { startDate, endDate, groupBy = 'month' } = options;
      const where = {};
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date[Op.gte] = new Date(startDate);
        if (endDate) where.date[Op.lte] = new Date(endDate);
      }

      let dateExpr;
      switch (groupBy) {
        case 'day':
          dateExpr = sequelize.fn('DATE', sequelize.col('date'));
          break;
        case 'week':
          dateExpr = sequelize.fn('DATE_TRUNC', 'week', sequelize.col('date'));
          break;
        case 'month':
        default:
          dateExpr = sequelize.fn('DATE_TRUNC', 'month', sequelize.col('date'));
          break;
      }

      const rows = await Sale.findAll({
        where,
        attributes: [
          [dateExpr, 'period'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'salesCount'],
          [sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0))')), 'totalWeight'],
          [sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0)) * price')), 'totalRevenue'],
          [sequelize.fn('SUM', sequelize.col('net_profit')), 'totalProfit'],
        ],
        group: [dateExpr],
        order: [[dateExpr, 'ASC']],
        raw: true,
      });

      const trends = rows.map(r => ({
        period: r.period,
        salesCount: parseInt(r.salesCount) || 0,
        totalWeight: parseFloat(r.totalWeight) || 0,
        totalRevenue: parseFloat(r.totalRevenue) || 0,
        totalProfit: parseFloat(r.totalProfit) || 0,
        profitMargin: r.totalRevenue && parseFloat(r.totalRevenue) > 0
          ? ((parseFloat(r.totalProfit || 0) / parseFloat(r.totalRevenue)) * 100).toFixed(2)
          : '0.00',
      }));

      const totalRevenue = trends.reduce((s, t) => s + t.totalRevenue, 0);
      const totalProfit = trends.reduce((s, t) => s + t.totalProfit, 0);
      const avgMargin = trends.length
        ? (trends.reduce((s, t) => s + parseFloat(t.profitMargin), 0) / trends.length).toFixed(2)
        : '0.00';

      return {
        trends,
        summary: {
          totalPeriods: trends.length,
          totalRevenue,
          totalProfit,
          averageProfitMargin: avgMargin,
        },
      };
    } catch (err) {
      console.error('Error getting profitability analysis:', err);
      throw err;
    }
  }

  static async getInventoryTurnover() {
    try {
      const rows = await Purchase.findAll({
        attributes: [
          'id', 'date', 'quantity', 'weight', 'extraWeight',
          // Disambiguate columns by qualifying with table alias to avoid Postgres 42702 (ambiguous column)
          [
            sequelize.literal(
              '"Purchase"."quantity" * ("Purchase"."weight" + COALESCE("Purchase"."extra_weight", 0))'
            ),
            'totalWeight'
          ],
          [
            sequelize.fn(
              'COALESCE',
              sequelize.fn(
                'SUM',
                sequelize.literal('"sales"."quantity" * ("sales"."weight" + COALESCE("sales"."extra_weight", 0))')
              ),
              0
            ),
            'soldWeight'
          ],
          [sequelize.fn('COUNT', sequelize.col('sales.id')), 'salesCount'],
        ],
        include: [
          { model: Sale, as: 'sales', attributes: [] },
          { model: Supplier, as: 'supplierData', attributes: ['id', 'name'] },
        ],
        group: ['Purchase.id', 'supplierData.id'],
        raw: true,
      });

      const now = new Date();
      return rows.map(r => {
        const totalWeight = parseFloat(r.totalWeight) || 0;
        const soldWeight = parseFloat(r.soldWeight) || 0;
        const remainingWeight = totalWeight - soldWeight;
        const turnoverRate = totalWeight > 0 ? ((soldWeight / totalWeight) * 100).toFixed(2) : '0.00';
        const daysInStock = Math.floor((now - new Date(r.date)) / (1000 * 60 * 60 * 24));
        return {
          purchaseId: r.id,
            supplierName: r['supplierData.name'],
          totalWeight,
          soldWeight,
          remainingWeight,
          turnoverRate: parseFloat(turnoverRate),
          salesCount: parseInt(r.salesCount) || 0,
          daysInStock,
          purchaseDate: r.date,
        };
      });
    } catch (err) {
      console.error('Error getting inventory turnover:', err);
      throw err;
    }
  }
}

module.exports = SaleService;