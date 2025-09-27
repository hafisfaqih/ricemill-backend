const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'Username cannot be empty',
      },
      len: {
        args: [3, 255],
        msg: 'Username must be between 3 and 255 characters',
      },
    },
  },
  passwordHash: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager'),
    allowNull: false,
    defaultValue: 'manager',
    validate: {
      isIn: {
        args: [['admin', 'manager']],
        msg: 'Role must be either admin or manager',
      },
    },
  },
}, {
  tableName: 'users',
  indexes: [
    {
      unique: true,
      fields: ['username'],
    },
    {
      unique: false,
      fields: ['role'],
    },
  ],
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        user.passwordHash = await bcrypt.hash(user.password, 12);
        delete user.dataValues.password;
      }
    },
    beforeUpdate: async (user) => {
      if (user.password) {
        user.passwordHash = await bcrypt.hash(user.password, 12);
        delete user.dataValues.password;
      }
    },
  },
});

// Instance methods
User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.passwordHash; // Never return password hash
  if (values.created_at) {
    values.created_at = values.created_at.toISOString();
  }
  if (values.updated_at) {
    values.updated_at = values.updated_at.toISOString();
  }
  return values;
};

User.prototype.validatePassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Class methods
User.findByUsername = function (username) {
  return this.findOne({
    where: { username },
  });
};

User.findAdmins = function () {
  return this.findAll({
    where: { role: 'admin' },
    order: [['username', 'ASC']],
  });
};

module.exports = User;