const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Supplier name cannot be empty',
      },
      len: {
        args: [2, 255],
        msg: 'Supplier name must be between 2 and 255 characters',
      },
    },
  },
  contactPerson: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'contact_person',
    validate: {
      len: {
        args: [0, 255],
        msg: 'Contact person name must not exceed 255 characters',
      },
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\+]?[1-9][\d]{0,15}$/,
        msg: 'Phone number format is invalid',
      },
    },
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: {
        args: [['active', 'inactive']],
        msg: 'Status must be either active or inactive',
      },
    },
  },
}, {
  tableName: 'suppliers',
  indexes: [
    {
      unique: false,
      fields: ['name'],
    },
    {
      unique: false,
      fields: ['status'],
    },
  ],
});

// Associations (inverse) added in separate require sequence to avoid circular issues
// Will be completed after Purchase model definition loads; see purchase.js for belongsTo side.

// Instance methods
Supplier.prototype.toJSON = function () {
  const values = { ...this.get() };
  // Format timestamps for better readability
  if (values.created_at) {
    values.created_at = values.created_at.toISOString();
  }
  if (values.updated_at) {
    values.updated_at = values.updated_at.toISOString();
  }
  return values;
};

// Class methods
Supplier.findActiveSuppliers = function () {
  return this.findAll({
    where: { status: 'active' },
    order: [['name', 'ASC']],
  });
};

Supplier.findByName = function (name) {
  return this.findAll({
    where: {
      name: {
        [require('sequelize').Op.iLike]: `%${name}%`,
      },
    },
    order: [['name', 'ASC']],
  });
};

module.exports = Supplier;