const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const Supplier = require('./supplier');

const Purchase = sequelize.define('Purchase', {
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
        msg: 'Purchase date is required',
      },
      isDate: {
        msg: 'Purchase date must be a valid date',
      },
    },
  },
  supplierId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'supplier_id',
    references: {
      model: 'suppliers',
      key: 'id',
    },
  },
  supplier: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      len: {
        args: [0, 255],
        msg: 'Supplier name must not exceed 255 characters',
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
  pelletCost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'pellet_cost',
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
  truckCost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'truck_cost',
    validate: {
      isDecimal: {
        msg: 'Truck cost must be a decimal number',
      },
      min: {
        args: [0],
        msg: 'Truck cost must be non-negative',
      },
    },
  },
  laborCost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    field: 'labor_cost',
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
  totalCost: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: true,  // Allow null, will be calculated by beforeSave hook
    field: 'total_cost',
    validate: {
      isDecimal: {
        msg: 'Total cost must be a decimal number',
      },
      min: {
        args: [0],
        msg: 'Total cost must be non-negative',
      },
    },
  },
}, {
  tableName: 'purchases',
  indexes: [
    {
      unique: false,
      fields: ['date'],
    },
    {
      unique: false,
      fields: ['supplier_id'],
    },
    {
      unique: false,
      fields: ['total_cost'],
    },
  ],
  hooks: {
    beforeCreate: (purchase) => {
      // Calculate total cost: (quantity * weight * price) + truckCost + laborCost
      const unitWeight = parseFloat(purchase.weight) + parseFloat(purchase.extraWeight || 0);
      const productCost = parseFloat(purchase.quantity) * unitWeight * parseFloat(purchase.price);
      const truckCost = parseFloat(purchase.truckCost) || 0;
      const laborCost = parseFloat(purchase.laborCost) || 0;
      const pelletCost = parseFloat(purchase.pelletCost) || 0;
      purchase.totalCost = productCost + truckCost + laborCost + pelletCost;
    },
    beforeUpdate: (purchase) => {
      // Calculate total cost: (quantity * weight * price) + truckCost + laborCost
      const unitWeight = parseFloat(purchase.weight) + parseFloat(purchase.extraWeight || 0);
      const productCost = parseFloat(purchase.quantity) * unitWeight * parseFloat(purchase.price);
      const truckCost = parseFloat(purchase.truckCost) || 0;
      const laborCost = parseFloat(purchase.laborCost) || 0;
      const pelletCost = parseFloat(purchase.pelletCost) || 0;
      purchase.totalCost = productCost + truckCost + laborCost + pelletCost;
    },
  },
});

// Associations
Purchase.belongsTo(Supplier, {
  foreignKey: 'supplierId',
  as: 'supplierData',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE',
});

// Inverse for Supplier -> Purchase
if (!Supplier.associations || !Supplier.associations.purchases) {
  Supplier.hasMany(Purchase, {
    foreignKey: 'supplierId',
    as: 'purchases',
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  });
}

// Purchase -> Sales association is defined in sale.js after Sale model creation to avoid circular require

// Instance methods
Purchase.prototype.toJSON = function () {
  const values = { ...this.get() };
  if (values.created_at) {
    values.created_at = values.created_at.toISOString();
  }
  if (values.updated_at) {
    values.updated_at = values.updated_at.toISOString();
  }
  // Convert decimals to numbers for better JSON representation
  ['weight', 'price', 'truckCost', 'laborCost', 'totalCost'].forEach(field => {
    if (values[field] !== null && values[field] !== undefined) {
      values[field] = parseFloat(values[field]);
    }
  });
  ['extraWeight', 'pelletCost'].forEach(field => {
    if (values[field] !== null && values[field] !== undefined) {
      values[field] = parseFloat(values[field]);
    }
  });
  return values;
};

Purchase.prototype.calculateTotalWeight = function () {
  const unitWeight = parseFloat(this.weight) + parseFloat(this.extraWeight || 0);
  return parseFloat(this.quantity) * unitWeight;
};

Purchase.prototype.calculateProductCost = function () {
  const unitWeight = parseFloat(this.weight) + parseFloat(this.extraWeight || 0);
  return parseFloat(this.quantity) * unitWeight * parseFloat(this.price);
};

// Class methods
Purchase.findByDateRange = function (startDate, endDate) {
  const { Op } = require('sequelize');
  return this.findAll({
    where: {
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
    include: [
      {
        model: Supplier,
        as: 'supplierData',
        attributes: ['id', 'name', 'contactPerson'],
      },
    ],
    order: [['date', 'DESC']],
  });
};

Purchase.findBySupplier = function (supplierId) {
  return this.findAll({
    where: { supplierId },
    include: [
      {
        model: Supplier,
        as: 'supplierData',
        attributes: ['id', 'name', 'contactPerson'],
      },
    ],
    order: [['date', 'DESC']],
  });
};

Purchase.getTotalsByMonth = async function (year, month) {
  const { Op } = require('sequelize');
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return await this.findAll({
    attributes: [
      [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
      [sequelize.fn('SUM', sequelize.literal('quantity * (weight + COALESCE(extra_weight, 0))')), 'totalWeight'],
      [sequelize.fn('SUM', sequelize.col('total_cost')), 'totalCost'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
    ],
    where: {
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
  });
};

module.exports = Purchase;