const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Invoice = sequelize.define('Invoice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoiceNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'invoice_number',
    validate: {
      notEmpty: {
        msg: 'Invoice number is required',
      },
      len: {
        args: [1, 50],
        msg: 'Invoice number must be between 1 and 50 characters',
      },
    },
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Invoice date is required',
      },
      isDate: {
        msg: 'Invoice date must be a valid date',
      },
    },
  },
  customer: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Customer name is required',
      },
      len: {
        args: [2, 255],
        msg: 'Customer name must be between 2 and 255 characters',
      },
    },
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true, // Will be computed from items if not provided
    validate: {
      isDecimal: {
        msg: 'Invoice amount must be a decimal number',
      },
      min: {
        args: 0.01,
        msg: 'Invoice amount must be greater than 0',
      },
    },
  },
  dueDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    field: 'due_date',
    validate: {
      notEmpty: {
        msg: 'Due date is required',
      },
      isDate: {
        msg: 'Due date must be a valid date',
      },
      isAfterDate: function (value) {
        if (new Date(value) < new Date(this.date)) {
          throw new Error('Due date must be after invoice date');
        }
      },
    },
  },
  status: {
    type: DataTypes.ENUM('paid', 'unpaid'),
    allowNull: false,
    defaultValue: 'unpaid',
    validate: {
      isIn: {
        args: [['paid', 'unpaid']],
        msg: 'Status must be either paid or unpaid',
      },
    },
  },
}, {
  tableName: 'invoices',
  indexes: [
    {
      unique: true,
      fields: ['invoice_number'],
    },
    {
      unique: false,
      fields: ['date'],
    },
    {
      unique: false,
      fields: ['due_date'],
    },
    {
      unique: false,
      fields: ['status'],
    },
    {
      unique: false,
      fields: ['customer'],
    },
  ],
  hooks: {
    beforeCreate: (invoice) => {
      // Auto-generate invoice number if not provided
      if (!invoice.invoiceNumber) {
        const date = new Date(invoice.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const timestamp = Date.now().toString().slice(-4); // Last 4 digits of timestamp
        invoice.invoiceNumber = `INV-${year}${month}${day}-${timestamp}`;
      }
      // If amount explicitly zero or missing with items (items created later), leave null; service will recalc after items insert
    },
  },
});

// Instance methods
Invoice.prototype.toJSON = function () {
  const values = { ...this.get() };
  if (values.created_at) {
    values.created_at = values.created_at.toISOString();
  }
  if (values.updated_at) {
    values.updated_at = values.updated_at.toISOString();
  }
  // Convert amount to number for better JSON representation
  if (values.amount) {
    values.amount = parseFloat(values.amount);
  }
  return values;
};

Invoice.prototype.isOverdue = function () {
  return this.status === 'unpaid' && new Date() > new Date(this.dueDate);
};

Invoice.prototype.getDaysUntilDue = function () {
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = dueDate - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

Invoice.prototype.getDaysOverdue = function () {
  if (this.status === 'paid' || !this.isOverdue()) {
    return 0;
  }
  const today = new Date();
  const dueDate = new Date(this.dueDate);
  const diffTime = today - dueDate;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Class methods
Invoice.findByStatus = function (status) {
  return this.findAll({
    where: { status },
    order: [['date', 'DESC']],
  });
};

Invoice.findOverdue = function () {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      status: 'unpaid',
      dueDate: {
        [Op.lt]: new Date(),
      },
    },
    order: [['dueDate', 'ASC']],
  });
};

Invoice.findDueSoon = function (days = 7) {
  const { Op } = require('sequelize');
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + days);
  
  return this.findAll({
    where: {
      status: 'unpaid',
      dueDate: {
        [Op.between]: [today, futureDate],
      },
    },
    order: [['dueDate', 'ASC']],
  });
};

Invoice.findByCustomer = function (customer) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      customer: {
        [Op.iLike]: `%${customer}%`,
      },
    },
    order: [['date', 'DESC']],
  });
};

Invoice.findByDateRange = function (startDate, endDate) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
    order: [['date', 'DESC']],
  });
};

Invoice.getStatusSummary = async function () {
  return await this.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
    ],
    group: ['status'],
  });
};

Invoice.getMonthlyTotals = async function (year, month) {
  const { Op } = require('sequelize');
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalInvoices'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'paid' THEN amount ELSE 0 END")), 'paidAmount'],
      [sequelize.fn('SUM', sequelize.literal("CASE WHEN status = 'unpaid' THEN amount ELSE 0 END")), 'unpaidAmount'],
    ],
    where: {
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
  });
};

module.exports = Invoice;