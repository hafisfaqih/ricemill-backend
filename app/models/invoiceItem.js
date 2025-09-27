const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const Invoice = require('./invoice');

const InvoiceItem = sequelize.define('InvoiceItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  invoiceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'invoice_id',
    references: {
      model: 'invoices',
      key: 'id',
    },
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Item name is required',
      },
      len: {
        args: [1, 255],
        msg: 'Item name must be between 1 and 255 characters',
      },
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Quantity is required',
      },
      isInt: {
        msg: 'Quantity must be an integer',
      },
      min: {
        args: 1,
        msg: 'Quantity must be at least 1',
      },
    },
  },
  price: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Price is required',
      },
      isDecimal: {
        msg: 'Price must be a decimal number',
      },
      min: {
        args: 0.01,
        msg: 'Price must be greater than 0',
      },
    },
  },
  total: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: {
        msg: 'Total must be a decimal number',
      },
      min: {
        args: 0,
        msg: 'Total must be non-negative',
      },
    },
  },
}, {
  tableName: 'invoice_items',
  updatedAt: false, // Invoice items typically don't get updated
  indexes: [
    {
      unique: false,
      fields: ['invoice_id'],
    },
    {
      unique: false,
      fields: ['name'],
    },
  ],
  hooks: {
    beforeSave: (invoiceItem) => {
      // Calculate total: quantity * price
      invoiceItem.total = parseFloat(invoiceItem.quantity) * parseFloat(invoiceItem.price);
    },
  },
});

// Associations
InvoiceItem.belongsTo(Invoice, {
  foreignKey: 'invoiceId',
  as: 'invoice',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// Reverse association
Invoice.hasMany(InvoiceItem, {
  foreignKey: 'invoiceId',
  as: 'items',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});

// Instance methods
InvoiceItem.prototype.toJSON = function () {
  const values = { ...this.get() };
  if (values.created_at) {
    values.created_at = values.created_at.toISOString();
  }
  // Convert decimals to numbers for better JSON representation
  ['price', 'total'].forEach(field => {
    if (values[field]) {
      values[field] = parseFloat(values[field]);
    }
  });
  return values;
};

InvoiceItem.prototype.calculateTotal = function () {
  return parseFloat(this.quantity) * parseFloat(this.price);
};

// Class methods
InvoiceItem.findByInvoice = function (invoiceId) {
  return this.findAll({
    where: { invoiceId },
    order: [['created_at', 'ASC']],
  });
};

InvoiceItem.findByName = function (name) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      name: {
        [Op.iLike]: `%${name}%`,
      },
    },
    include: [
      {
        model: Invoice,
        as: 'invoice',
        attributes: ['id', 'invoiceNumber', 'date', 'customer'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

InvoiceItem.getPopularItems = async function (limit = 10) {
  return await this.findAll({
    attributes: [
      'name',
      [sequelize.fn('COUNT', sequelize.col('id')), 'frequency'],
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
      [sequelize.fn('AVG', sequelize.col('price')), 'averagePrice'],
    ],
    group: ['name'],
    order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
    limit: limit,
  });
};

InvoiceItem.getTotalsByDateRange = async function (startDate, endDate) {
  const { Op } = require('sequelize');
  return await this.findAll({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('InvoiceItem.id')), 'totalItems'],
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.fn('SUM', sequelize.col('total')), 'totalRevenue'],
    ],
    include: [
      {
        model: Invoice,
        as: 'invoice',
        attributes: [],
        where: {
          date: {
            [Op.between]: [startDate, endDate],
          },
        },
      },
    ],
  });
};

module.exports = InvoiceItem;