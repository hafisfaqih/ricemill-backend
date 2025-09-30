const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const Purchase = require('./purchase');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Sale date is required',
      },
      isDate: {
        msg: 'Sale date must be a valid date',
      },
    },
  },
  purchaseId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'purchase_id',
    references: {
      model: 'purchases',
      key: 'id',
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
  weight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Weight is required',
      },
      isDecimal: {
        msg: 'Weight must be a decimal number',
      },
      min: {
        args: 0.01,
        msg: 'Weight must be greater than 0',
      },
    },
  },
  extraWeight: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'extra_weight',
    validate: {
      isDecimal: {
        msg: 'Extra weight must be a decimal number',
      },
      min: {
        args: [0],
        msg: 'Extra weight must be non-negative',
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
  pellet: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: {
        msg: 'Pellet cost must be a decimal number',
      },
      min: {
        args: [0],
        msg: 'Pellet cost must be non-negative',
      },
    },
  },
  fuel: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: {
        msg: 'Fuel cost must be a decimal number',
      },
      min: {
        args: [0],
        msg: 'Fuel cost must be non-negative',
      },
    },
  },
  labor: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      isDecimal: {
        msg: 'Labor cost must be a decimal number',
      },
      min: {
        args: [0],
        msg: 'Labor cost must be non-negative',
      },
    },
  },
  netProfit: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,
    field: 'net_profit',
  },
  rendement: {
    type: DataTypes.STRING(10),
    allowNull: true,
    validate: {
      len: {
        args: [0, 10],
        msg: 'Rendement must not exceed 10 characters',
      },
    },
  },
}, {
  tableName: 'sales',
  indexes: [
    {
      unique: false,
      fields: ['date'],
    },
    {
      unique: false,
      fields: ['purchase_id'],
    },
    {
      unique: false,
      fields: ['net_profit'],
    },
  ],
  hooks: {
    beforeSave: async (sale) => {
      // Calculate revenue
      const unitWeight = parseFloat(sale.weight) + parseFloat(sale.extraWeight || 0);
      const revenue = parseFloat(sale.quantity) * unitWeight * parseFloat(sale.price);
      
      // Calculate operational costs
      const operationalCosts = parseFloat(sale.pellet || 0) + parseFloat(sale.fuel || 0) + parseFloat(sale.labor || 0);
      
      // Get purchase cost if purchaseId is provided
      let purchaseCost = 0;
      if (sale.purchaseId) {
        const purchase = await Purchase.findByPk(sale.purchaseId);
        if (purchase) {
          // Calculate proportional purchase cost based on weight sold vs total purchase weight
          const totalPurchaseWeight = parseFloat(purchase.quantity) * (parseFloat(purchase.weight) + parseFloat(purchase.extraWeight || 0));
          const soldWeight = parseFloat(sale.quantity) * unitWeight;
          const proportion = soldWeight / totalPurchaseWeight;
          purchaseCost = parseFloat(purchase.totalCost) * proportion;
        }
      }
      
      // Calculate net profit: Revenue - Purchase Cost - Operational Costs
      sale.netProfit = revenue - purchaseCost - operationalCosts;
      
      // Calculate rendement if purchase is linked
      if (sale.purchaseId && purchaseCost > 0) {
        const soldWeight = parseFloat(sale.quantity) * unitWeight;
        const purchase = await Purchase.findByPk(sale.purchaseId);
        if (purchase) {
          const purchaseWeight = parseFloat(purchase.quantity) * (parseFloat(purchase.weight) + parseFloat(purchase.extraWeight || 0));
          const rendementPercentage = (soldWeight / purchaseWeight) * 100;
          sale.rendement = `${rendementPercentage.toFixed(1)}%`;
        }
      }
    },
  },
});

// Associations
Sale.belongsTo(Purchase, {
  foreignKey: 'purchaseId',
  as: 'purchaseData',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Inverse association defined here to avoid circular require in purchase.js
if (!Purchase.associations || !Purchase.associations.sales) {
  Purchase.hasMany(Sale, {
    foreignKey: 'purchaseId',
    as: 'sales',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
}

// Instance methods
Sale.prototype.toJSON = function () {
  const values = { ...this.get() };
  if (values.created_at) {
    values.created_at = values.created_at.toISOString();
  }
  if (values.updated_at) {
    values.updated_at = values.updated_at.toISOString();
  }
  // Convert decimals to numbers for better JSON representation
  ['weight', 'price', 'pellet', 'fuel', 'labor', 'netProfit'].forEach(field => {
    if (values[field] !== null && values[field] !== undefined) {
      values[field] = parseFloat(values[field]);
    }
  });
  if (values.extraWeight !== null && values.extraWeight !== undefined) {
    values.extraWeight = parseFloat(values.extraWeight);
  }
  return values;
};

Sale.prototype.calculateRevenue = function () {
  const unitWeight = parseFloat(this.weight) + parseFloat(this.extraWeight || 0);
  return parseFloat(this.quantity) * unitWeight * parseFloat(this.price);
};

Sale.prototype.calculateTotalWeight = function () {
  const unitWeight = parseFloat(this.weight) + parseFloat(this.extraWeight || 0);
  return parseFloat(this.quantity) * unitWeight;
};

Sale.prototype.calculateOperationalCosts = function () {
  return parseFloat(this.pellet || 0) + parseFloat(this.fuel || 0) + parseFloat(this.labor || 0);
};

// Class methods
Sale.findByDateRange = function (startDate, endDate) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      {
        model: Purchase,
        as: 'purchaseData',
        attributes: ['id', 'date', 'supplier', 'totalCost'],
      },
    ],
    order: [['date', 'DESC']],
  });
};

Sale.findByPurchase = function (purchaseId) {
  return this.findAll({
    where: { purchaseId },
    include: [
      {
        model: Purchase,
        as: 'purchaseData',
        attributes: ['id', 'date', 'supplier', 'totalCost'],
      },
    ],
    order: [['date', 'DESC']],
  });
};

Sale.getTotalsByMonth = async function (year, month) {
  const { Op } = require('sequelize');
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return await this.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0))')), 'totalWeight'],
      [sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0)) * price')), 'totalRevenue'],
      [sequelize.fn('SUM', sequelize.col('net_profit')), 'totalProfit'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
      [sequelize.fn('AVG', sequelize.col('price')), 'averagePrice'],
    ],
    where: {
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
  });
};

Sale.getProfitAnalysis = async function (startDate, endDate) {
  const { Op } = require('sequelize');
  return await this.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0)) * price')), 'totalRevenue'],
      [sequelize.fn('SUM', sequelize.col('pellet')), 'totalPelletCost'],
      [sequelize.fn('SUM', sequelize.col('fuel')), 'totalFuelCost'],
      [sequelize.fn('SUM', sequelize.col('labor')), 'totalLaborCost'],
      [sequelize.fn('SUM', sequelize.col('net_profit')), 'totalNetProfit'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalSales'],
    ],
    where: {
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
  });
};

module.exports = Sale;