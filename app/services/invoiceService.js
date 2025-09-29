const Invoice = require('../models/invoice');
const InvoiceItem = require('../models/invoiceItem');
const { Op } = require('sequelize');
// moment not required; using native Date

class InvoiceService {
  /**
   * Create a new invoice with items
   * @param {Object} invoiceData - Invoice data with items
   * @returns {Promise<Object>} Created invoice
   */
  static async createInvoice(data) {
    try {
      const { items = [], ...info } = data;
      // Normalize: if amount not provided but items provided, compute after items inserted (hookless manual)
      const invoice = await Invoice.create(info);
      if (items.length > 0) {
        const prepared = items.map(it => ({ ...it, invoiceId: invoice.id }));
          await InvoiceItem.bulkCreate(prepared.map(it => ({
            ...it,
            total: parseFloat(it.quantity) * parseFloat(it.price)
          })));
        // Recompute amount from items if not explicitly passed
        if (!info.amount) {
          const sumRows = await InvoiceItem.findAll({
            where: { invoiceId: invoice.id },
            attributes: [[InvoiceItem.sequelize.fn('SUM', InvoiceItem.sequelize.col('total')), 'total']],
            raw: true,
          });
          const total = parseFloat(sumRows[0].total) || 0;
          await invoice.update({ amount: total });
        }
      }
      const full = await Invoice.findByPk(invoice.id, { include: [{ model: InvoiceItem, as: 'items' }] });
      return full;
    } catch (err) {
      console.error('Error creating invoice:', err);
      throw err;
    }
  }

  /**
   * Get all invoices with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Invoices with pagination
   */
  static async getAllInvoices(options = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'DESC', customer, status, startDate, endDate, minAmount, maxAmount, overdue } = options;
      const where = {};
      if (customer) where.customer = { [Op.iLike]: `%${customer}%` };
      if (status) where.status = status;
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date[Op.gte] = new Date(startDate);
        if (endDate) where.date[Op.lte] = new Date(endDate);
      }
      if (minAmount || maxAmount) {
        where.amount = {};
        if (minAmount) where.amount[Op.gte] = parseFloat(minAmount);
        if (maxAmount) where.amount[Op.lte] = parseFloat(maxAmount);
      }
      if (overdue === 'true') {
        where.dueDate = { [Op.lt]: new Date() };
        where.status = { [Op.ne]: 'paid' };
      }
      const offset = (page - 1) * limit;
      const { count, rows } = await Invoice.findAndCountAll({
        where,
        include: [{ model: InvoiceItem, as: 'items' }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset,
      });
      return {
        invoices: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit),
        },
      };
    } catch (err) {
      console.error('Error getting invoices:', err);
      throw err;
    }
  }

  /**
   * Get invoice by ID
   * @param {number} id - Invoice ID
   * @returns {Promise<Object>} Invoice details
   */
  static async getInvoiceById(id) {
    try {
      const invoice = await Invoice.findByPk(id, {
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
      });

      if (!invoice) {
        throw new Error('Invoice not found');
      }

      return invoice;
    } catch (error) {
      console.error('Error getting invoice by ID:', error);
      throw error;
    }
  }

  /**
   * Update invoice
   * @param {number} id - Invoice ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated invoice
   */
  static async updateInvoice(id, data) {
    try {
      const { items, ...invoiceUpdate } = data;
      const invoice = await Invoice.findByPk(id, { include: [{ model: InvoiceItem, as: 'items' }] });
      if (!invoice) throw new Error('Invoice not found');
      await invoice.update(invoiceUpdate);
      if (items) {
        await InvoiceItem.destroy({ where: { invoiceId: id } });
        if (items.length > 0) {
          const prepared = items.map(it => ({ ...it, invoiceId: id }));
            await InvoiceItem.bulkCreate(prepared.map(it => ({
              ...it,
              total: parseFloat(it.quantity) * parseFloat(it.price)
            })));
          // If amount not provided, recalc
          if (!invoiceUpdate.amount) {
            const sumRows = await InvoiceItem.findAll({
              where: { invoiceId: id },
              attributes: [[InvoiceItem.sequelize.fn('SUM', InvoiceItem.sequelize.col('total')), 'total']],
              raw: true,
            });
            const total = parseFloat(sumRows[0].total) || 0;
            await invoice.update({ amount: total });
          }
        }
      }
      return await Invoice.findByPk(id, { include: [{ model: InvoiceItem, as: 'items' }] });
    } catch (err) {
      console.error('Error updating invoice:', err);
      throw err;
    }
  }

  /**
   * Delete invoice
   * @param {number} id - Invoice ID
   * @returns {Promise<void>}
   */
  static async deleteInvoice(id) {
    try {
      const invoice = await Invoice.findByPk(id);
      if (!invoice) throw new Error('Invoice not found');
      await InvoiceItem.destroy({ where: { invoiceId: id } });
      await invoice.destroy();
      return true;
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      throw err;
    }
  }

  /**
   * Mark invoice as paid
   * @param {number} id - Invoice ID
   * @returns {Promise<Object>} Paid invoice with items
   */
  static async markAsPaid(id) {
    try {
      const invoice = await Invoice.findByPk(id, { include: [{ model: InvoiceItem, as: 'items' }] });
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'paid') throw new Error('Invoice is already paid');
      await invoice.update({ status: 'paid' });
      return invoice;
    } catch (err) {
      console.error('Error marking invoice as paid:', err);
      throw err;
    }
  }

  /**
   * Add item to existing invoice
   * @param {number} invoiceId - Invoice ID
   * @param {Object} itemData - Item data
   * @returns {Promise<Object>} Created item
   */
  static async addInvoiceItem(invoiceId, itemData) {
    try {
      const invoice = await Invoice.findByPk(invoiceId);
      if (!invoice) throw new Error('Invoice not found');
      if (invoice.status === 'paid') throw new Error('Cannot add items to paid invoice');
      const computedTotal = parseFloat(itemData.quantity) * parseFloat(itemData.price);
      const item = await InvoiceItem.create({ ...itemData, invoiceId, total: computedTotal });
      // Recalculate amount
      const sumRows = await InvoiceItem.findAll({
        where: { invoiceId },
        attributes: [[InvoiceItem.sequelize.fn('SUM', InvoiceItem.sequelize.col('total')), 'total']],
        raw: true,
      });
      const total = parseFloat(sumRows[0].total) || 0;
      await invoice.update({ amount: total });
      return item;
    } catch (err) {
      console.error('Error adding invoice item:', err);
      throw err;
    }
  }

  /**
   * Update invoice item
   * @param {number} itemId - Item ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated item
   */
  static async updateInvoiceItem(itemId, updateData) {
    try {
      const item = await InvoiceItem.findByPk(itemId, { include: [{ model: Invoice, as: 'invoice' }] });
      if (!item) throw new Error('Invoice item not found');
      if (item.invoice.status === 'paid') throw new Error('Cannot update items of paid invoice');
      const patch = { ...updateData };
      if (patch.quantity != null || patch.price != null) {
        const newQty = patch.quantity != null ? patch.quantity : item.quantity;
        const newPrice = patch.price != null ? patch.price : item.price;
        patch.total = parseFloat(newQty) * parseFloat(newPrice);
      }
      await item.update(patch);
      const sumRows = await InvoiceItem.findAll({
        where: { invoiceId: item.invoiceId },
        attributes: [[InvoiceItem.sequelize.fn('SUM', InvoiceItem.sequelize.col('total')), 'total']],
        raw: true,
      });
      const total = parseFloat(sumRows[0].total) || 0;
      await item.invoice.update({ amount: total });
      return item;
    } catch (err) {
      console.error('Error updating invoice item:', err);
      throw err;
    }
  }

  /**
   * Delete invoice item
   * @param {number} itemId - Item ID
   * @returns {Promise<void>}
   */
  static async deleteInvoiceItem(itemId) {
    try {
      const item = await InvoiceItem.findByPk(itemId, { include: [{ model: Invoice, as: 'invoice' }] });
      if (!item) throw new Error('Invoice item not found');
      if (item.invoice.status === 'paid') throw new Error('Cannot delete items from paid invoice');
      const invoiceId = item.invoiceId;
      await item.destroy();
      const sumRows = await InvoiceItem.findAll({
        where: { invoiceId },
        attributes: [[InvoiceItem.sequelize.fn('SUM', InvoiceItem.sequelize.col('total')), 'total']],
        raw: true,
      });
      const total = sumRows.length > 0 && sumRows[0].total !== null
        ? parseFloat(sumRows[0].total)
        : 0;
      const invoice = await Invoice.findByPk(invoiceId);
      if (invoice) await invoice.update({ amount: total });
    } catch (err) {
      console.error('Error deleting invoice item:', err);
      throw err;
    }
  }

  /**
   * Search invoices
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Search results
   */
  static async searchInvoices(searchTerm) {
    try {
      const invoices = await Invoice.findAll({
        where: {
          [Op.or]: [
            { invoiceNumber: { [Op.iLike]: `%${searchTerm}%` } },
            { customer: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        include: [{ model: InvoiceItem, as: 'items' }],
        order: [['date', 'DESC']],
        limit: 30,
      });
      return invoices;
    } catch (err) {
      console.error('Error searching invoices:', err);
      throw err;
    }
  }

  /**
   * Get overdue invoices
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Overdue invoices
   */
  static async getOverdueInvoices(options = {}) {
    try {
      const { limit = 50, sortOrder = 'ASC' } = options;
      const rows = await Invoice.findAll({
        where: { dueDate: { [Op.lt]: new Date() }, status: { [Op.ne]: 'paid' } },
        include: [{ model: InvoiceItem, as: 'items' }],
        order: [['dueDate', sortOrder.toUpperCase()]],
        limit: parseInt(limit),
      });
      return rows.map(inv => {
        const daysOverdue = Math.floor((new Date() - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
        return { ...inv.toJSON(), daysOverdue };
      });
    } catch (err) {
      console.error('Error getting overdue invoices:', err);
      throw err;
    }
  }

  /**
   * Get invoice statistics
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Invoice statistics
   */
  static async getInvoiceStats(options = {}) {
    try {
      const { startDate, endDate, status } = options;
      const where = {};
      if (startDate || endDate) {
        where.date = {};
        if (startDate) where.date[Op.gte] = new Date(startDate);
        if (endDate) where.date[Op.lte] = new Date(endDate);
      }
      if (status) where.status = status;
      const totals = await Invoice.findAll({
        where,
        attributes: [
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'totalInvoices'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('amount')), 'totalAmount'],
          [Invoice.sequelize.fn('AVG', Invoice.sequelize.col('amount')), 'avgAmount'],
        ],
        raw: true,
      });
      const statusRows = await Invoice.findAll({
        where,
        attributes: [
          'status',
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'count'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('amount')), 'amount'],
        ],
        group: ['status'],
        raw: true,
      });
      const overdueRows = await Invoice.findAll({
        where: { ...where, dueDate: { [Op.lt]: new Date() }, status: { [Op.ne]: 'paid' } },
        attributes: [
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'overdueCount'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('amount')), 'overdueAmount'],
        ],
        raw: true,
      });
      const customerRows = await Invoice.findAll({
        where,
        attributes: [
          'customer',
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'invoiceCount'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('amount')), 'totalAmount'],
        ],
        group: ['customer'],
        order: [[Invoice.sequelize.fn('SUM', Invoice.sequelize.col('amount')), 'DESC']],
        limit: 10,
        raw: true,
      });
      const t = totals[0] || {};
      return {
        summary: {
          totalInvoices: parseInt(t.totalInvoices) || 0,
          totalAmount: parseFloat(t.totalAmount) || 0,
          avgAmount: parseFloat(t.avgAmount) || 0,
          overdueCount: parseInt(overdueRows[0]?.overdueCount) || 0,
          overdueAmount: parseFloat(overdueRows[0]?.overdueAmount) || 0,
        },
        statusBreakdown: statusRows.map(r => ({ status: r.status, count: parseInt(r.count), amount: parseFloat(r.amount) })),
        topCustomers: customerRows.map(r => ({ customer: r.customer, invoiceCount: parseInt(r.invoiceCount), totalAmount: parseFloat(r.totalAmount) })),
      };
    } catch (err) {
      console.error('Error getting invoice statistics:', err);
      throw err;
    }
  }

  /**
   * Get monthly invoice trends
   * @param {number} year - Year to analyze
   * @returns {Promise<Array>} Monthly trends
   */
  static async getMonthlyTrends(year = new Date().getFullYear()) {
    try {
      const rows = await Invoice.findAll({
        where: { date: { [Op.between]: [`${year}-01-01`, `${year}-12-31`] } },
        attributes: [
          [Invoice.sequelize.fn('EXTRACT', Invoice.sequelize.literal('MONTH FROM date')), 'month'],
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'invoiceCount'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('amount')), 'totalAmount'],
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")), 'paidCount'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 'paidAmount'],
        ],
        group: [Invoice.sequelize.fn('EXTRACT', Invoice.sequelize.literal('MONTH FROM date'))],
        order: [Invoice.sequelize.fn('EXTRACT', Invoice.sequelize.literal('MONTH FROM date'))],
        raw: true,
      });
      const trends = [];
      for (let m = 1; m <= 12; m++) {
        const md = rows.find(r => parseInt(r.month) === m);
        const totalAmount = md ? parseFloat(md.totalAmount) : 0;
        const paidAmount = md ? parseFloat(md.paidAmount) : 0;
        trends.push({
          month: m,
          monthName: new Date(year, m - 1).toLocaleString('default', { month: 'long' }),
          invoiceCount: md ? parseInt(md.invoiceCount) : 0,
          totalAmount,
          paidCount: md ? parseInt(md.paidCount) : 0,
          paidAmount,
          collectionRate: totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(2) : 0,
        });
      }
      return trends;
    } catch (err) {
      console.error('Error getting monthly trends:', err);
      throw err;
    }
  }

  /**
   * Generate invoice number
   * @param {Date} date - Invoice date
   * @returns {Promise<string>} Generated invoice number
   */
  static async generateInvoiceNumber(date = new Date()) {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const last = await Invoice.findOne({
        where: { invoiceNumber: { [Op.like]: `INV-${year}${month}-%` } },
        order: [['invoiceNumber', 'DESC']],
      });
      let sequence = 1;
      if (last) {
        const lastSeq = last.invoiceNumber.split('-')[2];
        sequence = parseInt(lastSeq) + 1;
      }
      return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
    } catch (err) {
      console.error('Error generating invoice number:', err);
      throw err;
    }
  }

  /**
   * Get aging report
   * @returns {Promise<Object>} Aging report
   */
  static async getAgingReport() {
    try {
      const now = new Date();
      const rows = await Invoice.findAll({
        where: { status: { [Op.ne]: 'paid' } },
        include: [{ model: InvoiceItem, as: 'items' }],
        order: [['dueDate', 'ASC']],
      });
      const buckets = {
        current: { invoices: [], amount: 0 },
        overdue1_30: { invoices: [], amount: 0 },
        overdue31_60: { invoices: [], amount: 0 },
        overdue61_90: { invoices: [], amount: 0 },
        overdue90Plus: { invoices: [], amount: 0 },
      };
      rows.forEach(inv => {
        const daysOverdue = Math.floor((now - new Date(inv.dueDate)) / (1000 * 60 * 60 * 24));
        const dto = { ...inv.toJSON(), daysOverdue };
        const amt = parseFloat(inv.amount) || 0;
        if (daysOverdue < 0) { buckets.current.invoices.push(dto); buckets.current.amount += amt; }
        else if (daysOverdue <= 30) { buckets.overdue1_30.invoices.push(dto); buckets.overdue1_30.amount += amt; }
        else if (daysOverdue <= 60) { buckets.overdue31_60.invoices.push(dto); buckets.overdue31_60.amount += amt; }
        else if (daysOverdue <= 90) { buckets.overdue61_90.invoices.push(dto); buckets.overdue61_90.amount += amt; }
        else { buckets.overdue90Plus.invoices.push(dto); buckets.overdue90Plus.amount += amt; }
      });
      const totalAmount = Object.values(buckets).reduce((s, b) => s + b.amount, 0);
      const withPct = Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, { ...v, percentage: totalAmount > 0 ? ((v.amount / totalAmount) * 100).toFixed(2) : 0 }]));
      return { totalUnpaidAmount: totalAmount, totalUnpaidInvoices: rows.length, agingBuckets: withPct };
    } catch (err) {
      console.error('Error getting aging report:', err);
      throw err;
    }
  }
}

module.exports = InvoiceService;