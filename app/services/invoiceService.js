const Invoice = require('../models/invoice');
const InvoiceItem = require('../models/invoiceItem');
const { Op } = require('sequelize');
const moment = require('moment');

class InvoiceService {
  /**
   * Create a new invoice with items
   * @param {Object} invoiceData - Invoice data with items
   * @returns {Promise<Object>} Created invoice
   */
  static async createInvoice(invoiceData) {
    try {
      const { items, ...invoiceInfo } = invoiceData;

      // Create invoice
      const invoice = await Invoice.create(invoiceInfo);

      // Create invoice items if provided
      if (items && items.length > 0) {
        const invoiceItems = items.map(item => ({
          ...item,
          invoice_id: invoice.id,
        }));

        await InvoiceItem.bulkCreate(invoiceItems);
      }

      // Fetch the complete invoice with items
      return await Invoice.findByPk(invoice.id, {
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
      });
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * Get all invoices with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Invoices with pagination
   */
  static async getAllInvoices(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        customer_name,
        status,
        startDate,
        endDate,
        minAmount,
        maxAmount,
        overdue,
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Filter by customer name
      if (customer_name) {
        whereClause.customer_name = { [Op.iLike]: `%${customer_name}%` };
      }

      // Filter by status
      if (status) {
        whereClause.status = status;
      }

      // Filter by date range
      if (startDate || endDate) {
        whereClause.invoice_date = {};
        if (startDate) {
          whereClause.invoice_date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.invoice_date[Op.lte] = new Date(endDate);
        }
      }

      // Filter by amount range
      if (minAmount || maxAmount) {
        whereClause.total_amount = {};
        if (minAmount) {
          whereClause.total_amount[Op.gte] = parseFloat(minAmount);
        }
        if (maxAmount) {
          whereClause.total_amount[Op.lte] = parseFloat(maxAmount);
        }
      }

      // Filter by overdue status
      if (overdue === 'true') {
        whereClause.due_date = { [Op.lt]: new Date() };
        whereClause.status = { [Op.ne]: 'paid' };
      }

      const { count, rows } = await Invoice.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset: offset,
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
    } catch (error) {
      console.error('Error getting invoices:', error);
      throw error;
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
  static async updateInvoice(id, updateData) {
    try {
      const { items, ...invoiceUpdate } = updateData;

      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Update invoice basic info
      await invoice.update(invoiceUpdate);

      // Update items if provided
      if (items) {
        // Delete existing items
        await InvoiceItem.destroy({
          where: { invoice_id: id },
        });

        // Create new items
        if (items.length > 0) {
          const invoiceItems = items.map(item => ({
            ...item,
            invoice_id: id,
          }));

          await InvoiceItem.bulkCreate(invoiceItems);
        }
      }

      // Return updated invoice with items
      return await Invoice.findByPk(id, {
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
      });
    } catch (error) {
      console.error('Error updating invoice:', error);
      throw error;
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
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      // Delete associated items first
      await InvoiceItem.destroy({
        where: { invoice_id: id },
      });

      // Delete invoice
      await invoice.destroy();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  /**
   * Mark invoice as paid
   * @param {number} id - Invoice ID
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Updated invoice
   */
  static async markAsPaid(id, paymentData = {}) {
    try {
      const invoice = await Invoice.findByPk(id);
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'paid') {
        throw new Error('Invoice is already paid');
      }

      await invoice.update({
        status: 'paid',
        paid_date: paymentData.paid_date || new Date(),
        payment_method: paymentData.payment_method || null,
        payment_notes: paymentData.payment_notes || null,
      });

      return await Invoice.findByPk(id, {
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
      });
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      throw error;
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
      if (!invoice) {
        throw new Error('Invoice not found');
      }

      if (invoice.status === 'paid') {
        throw new Error('Cannot add items to paid invoice');
      }

      const item = await InvoiceItem.create({
        ...itemData,
        invoice_id: invoiceId,
      });

      // Update invoice total (this will be handled by the model hook)
      await invoice.reload();

      return item;
    } catch (error) {
      console.error('Error adding invoice item:', error);
      throw error;
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
      const item = await InvoiceItem.findByPk(itemId, {
        include: [{ model: Invoice, as: 'invoice' }],
      });

      if (!item) {
        throw new Error('Invoice item not found');
      }

      if (item.invoice.status === 'paid') {
        throw new Error('Cannot update items of paid invoice');
      }

      await item.update(updateData);

      // Reload invoice to update totals
      await item.invoice.reload();

      return item;
    } catch (error) {
      console.error('Error updating invoice item:', error);
      throw error;
    }
  }

  /**
   * Delete invoice item
   * @param {number} itemId - Item ID
   * @returns {Promise<void>}
   */
  static async deleteInvoiceItem(itemId) {
    try {
      const item = await InvoiceItem.findByPk(itemId, {
        include: [{ model: Invoice, as: 'invoice' }],
      });

      if (!item) {
        throw new Error('Invoice item not found');
      }

      if (item.invoice.status === 'paid') {
        throw new Error('Cannot delete items from paid invoice');
      }

      await item.destroy();

      // Reload invoice to update totals
      await item.invoice.reload();
    } catch (error) {
      console.error('Error deleting invoice item:', error);
      throw error;
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
            { invoice_number: { [Op.iLike]: `%${searchTerm}%` } },
            { customer_name: { [Op.iLike]: `%${searchTerm}%` } },
            { customer_email: { [Op.iLike]: `%${searchTerm}%` } },
            { customer_phone: { [Op.iLike]: `%${searchTerm}%` } },
          ],
        },
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
        order: [['invoice_date', 'DESC']],
        limit: 20,
      });

      return invoices;
    } catch (error) {
      console.error('Error searching invoices:', error);
      throw error;
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

      const overdueInvoices = await Invoice.findAll({
        where: {
          due_date: { [Op.lt]: new Date() },
          status: { [Op.ne]: 'paid' },
        },
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
        order: [['due_date', sortOrder.toUpperCase()]],
        limit: parseInt(limit),
      });

      // Calculate days overdue for each invoice
      return overdueInvoices.map(invoice => {
        const daysOverdue = Math.floor((new Date() - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
        return {
          ...invoice.toJSON(),
          daysOverdue,
        };
      });
    } catch (error) {
      console.error('Error getting overdue invoices:', error);
      throw error;
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
      const whereClause = {};

      // Filter by date range
      if (startDate || endDate) {
        whereClause.invoice_date = {};
        if (startDate) {
          whereClause.invoice_date[Op.gte] = new Date(startDate);
        }
        if (endDate) {
          whereClause.invoice_date[Op.lte] = new Date(endDate);
        }
      }

      // Filter by status
      if (status) {
        whereClause.status = status;
      }

      const totalStats = await Invoice.findAll({
        where: whereClause,
        attributes: [
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'totalInvoices'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('total_amount')), 'totalAmount'],
          [Invoice.sequelize.fn('AVG', Invoice.sequelize.col('total_amount')), 'avgAmount'],
        ],
        raw: true,
      });

      const statusStats = await Invoice.findAll({
        where: startDate || endDate ? { 
          ...whereClause,
          status: whereClause.status || { [Op.ne]: null }
        } : whereClause,
        attributes: [
          'status',
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'count'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('total_amount')), 'amount'],
        ],
        group: ['status'],
        raw: true,
      });

      const overdueStats = await Invoice.findAll({
        where: {
          ...whereClause,
          due_date: { [Op.lt]: new Date() },
          status: { [Op.ne]: 'paid' },
        },
        attributes: [
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'overdueCount'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('total_amount')), 'overdueAmount'],
        ],
        raw: true,
      });

      const customerStats = await Invoice.findAll({
        where: whereClause,
        attributes: [
          'customer_name',
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'invoiceCount'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('total_amount')), 'totalAmount'],
        ],
        group: ['customer_name'],
        order: [[Invoice.sequelize.fn('SUM', Invoice.sequelize.col('total_amount')), 'DESC']],
        limit: 10,
        raw: true,
      });

      return {
        summary: {
          totalInvoices: parseInt(totalStats[0].totalInvoices) || 0,
          totalAmount: parseFloat(totalStats[0].totalAmount) || 0,
          avgAmount: parseFloat(totalStats[0].avgAmount) || 0,
          overdueCount: parseInt(overdueStats[0]?.overdueCount) || 0,
          overdueAmount: parseFloat(overdueStats[0]?.overdueAmount) || 0,
        },
        statusBreakdown: statusStats.map(item => ({
          status: item.status,
          count: parseInt(item.count),
          amount: parseFloat(item.amount),
        })),
        topCustomers: customerStats.map(item => ({
          customerName: item.customer_name,
          invoiceCount: parseInt(item.invoiceCount),
          totalAmount: parseFloat(item.totalAmount),
        })),
      };
    } catch (error) {
      console.error('Error getting invoice statistics:', error);
      throw error;
    }
  }

  /**
   * Get monthly invoice trends
   * @param {number} year - Year to analyze
   * @returns {Promise<Array>} Monthly trends
   */
  static async getMonthlyTrends(year = new Date().getFullYear()) {
    try {
      const monthlyData = await Invoice.findAll({
        where: {
          invoice_date: {
            [Op.between]: [`${year}-01-01`, `${year}-12-31`],
          },
        },
        attributes: [
          [Invoice.sequelize.fn('EXTRACT', Invoice.sequelize.literal('MONTH FROM invoice_date')), 'month'],
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.col('id')), 'invoiceCount'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.col('total_amount')), 'totalAmount'],
          [Invoice.sequelize.fn('COUNT', Invoice.sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")), 'paidCount'],
          [Invoice.sequelize.fn('SUM', Invoice.sequelize.literal("CASE WHEN status = 'paid' THEN total_amount ELSE 0 END")), 'paidAmount'],
        ],
        group: [Invoice.sequelize.fn('EXTRACT', Invoice.sequelize.literal('MONTH FROM invoice_date'))],
        order: [Invoice.sequelize.fn('EXTRACT', Invoice.sequelize.literal('MONTH FROM invoice_date'))],
        raw: true,
      });

      // Fill in missing months with zero values
      const trends = [];
      for (let month = 1; month <= 12; month++) {
        const monthData = monthlyData.find(item => parseInt(item.month) === month);
        trends.push({
          month,
          monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' }),
          invoiceCount: monthData ? parseInt(monthData.invoiceCount) : 0,
          totalAmount: monthData ? parseFloat(monthData.totalAmount) : 0,
          paidCount: monthData ? parseInt(monthData.paidCount) : 0,
          paidAmount: monthData ? parseFloat(monthData.paidAmount) : 0,
          collectionRate: monthData && monthData.totalAmount > 0 
            ? ((monthData.paidAmount / monthData.totalAmount) * 100).toFixed(2)
            : 0,
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting monthly trends:', error);
      throw error;
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
      
      // Find the last invoice number for this month
      const lastInvoice = await Invoice.findOne({
        where: {
          invoice_number: {
            [Op.like]: `INV-${year}${month}-%`
          }
        },
        order: [['invoice_number', 'DESC']],
      });

      let sequence = 1;
      if (lastInvoice) {
        const lastSequence = lastInvoice.invoice_number.split('-')[2];
        sequence = parseInt(lastSequence) + 1;
      }

      return `INV-${year}${month}-${String(sequence).padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      throw error;
    }
  }

  /**
   * Get aging report
   * @returns {Promise<Object>} Aging report
   */
  static async getAgingReport() {
    try {
      const currentDate = new Date();
      const unpaidInvoices = await Invoice.findAll({
        where: {
          status: { [Op.ne]: 'paid' },
        },
        include: [
          {
            model: InvoiceItem,
            as: 'items',
          },
        ],
        order: [['due_date', 'ASC']],
      });

      const agingBuckets = {
        current: { invoices: [], amount: 0 },
        overdue1_30: { invoices: [], amount: 0 },
        overdue31_60: { invoices: [], amount: 0 },
        overdue61_90: { invoices: [], amount: 0 },
        overdue90Plus: { invoices: [], amount: 0 },
      };

      unpaidInvoices.forEach(invoice => {
        const daysOverdue = Math.floor((currentDate - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
        const invoiceWithDays = { ...invoice.toJSON(), daysOverdue };

        if (daysOverdue < 0) {
          agingBuckets.current.invoices.push(invoiceWithDays);
          agingBuckets.current.amount += invoice.total_amount;
        } else if (daysOverdue <= 30) {
          agingBuckets.overdue1_30.invoices.push(invoiceWithDays);
          agingBuckets.overdue1_30.amount += invoice.total_amount;
        } else if (daysOverdue <= 60) {
          agingBuckets.overdue31_60.invoices.push(invoiceWithDays);
          agingBuckets.overdue31_60.amount += invoice.total_amount;
        } else if (daysOverdue <= 90) {
          agingBuckets.overdue61_90.invoices.push(invoiceWithDays);
          agingBuckets.overdue61_90.amount += invoice.total_amount;
        } else {
          agingBuckets.overdue90Plus.invoices.push(invoiceWithDays);
          agingBuckets.overdue90Plus.amount += invoice.total_amount;
        }
      });

      const totalAmount = Object.values(agingBuckets).reduce((sum, bucket) => sum + bucket.amount, 0);

      return {
        totalUnpaidAmount: totalAmount,
        totalUnpaidInvoices: unpaidInvoices.length,
        agingBuckets: {
          current: {
            ...agingBuckets.current,
            percentage: totalAmount > 0 ? ((agingBuckets.current.amount / totalAmount) * 100).toFixed(2) : 0,
          },
          overdue1_30: {
            ...agingBuckets.overdue1_30,
            percentage: totalAmount > 0 ? ((agingBuckets.overdue1_30.amount / totalAmount) * 100).toFixed(2) : 0,
          },
          overdue31_60: {
            ...agingBuckets.overdue31_60,
            percentage: totalAmount > 0 ? ((agingBuckets.overdue31_60.amount / totalAmount) * 100).toFixed(2) : 0,
          },
          overdue61_90: {
            ...agingBuckets.overdue61_90,
            percentage: totalAmount > 0 ? ((agingBuckets.overdue61_90.amount / totalAmount) * 100).toFixed(2) : 0,
          },
          overdue90Plus: {
            ...agingBuckets.overdue90Plus,
            percentage: totalAmount > 0 ? ((agingBuckets.overdue90Plus.amount / totalAmount) * 100).toFixed(2) : 0,
          },
        },
      };
    } catch (error) {
      console.error('Error getting aging report:', error);
      throw error;
    }
  }
}

module.exports = InvoiceService;