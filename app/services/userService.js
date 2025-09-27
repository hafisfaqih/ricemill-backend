const User = require('../models/user');
const { Op } = require('sequelize');
const { generateToken, generateRefreshToken } = require('../middleware/auth');

class UserService {
  /**
   * Register a new user
   * @param {Object} userData - The user data
   * @returns {Promise<Object>} Created user with tokens
   */
  static async registerUser(userData) {
    try {
      // Check if username already exists
      const existingUser = await User.findByUsername(userData.username);
      if (existingUser) {
        throw new Error('Username already exists');
      }

      // Create user (password will be hashed in model hook)
      const user = await User.create({
        username: userData.username,
        password: userData.password, // This will be hashed by the model hook
        role: userData.role || 'manager',
      });

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      return {
        user: user.toJSON(),
        token,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<Object>} User with tokens
   */
  static async loginUser(username, password) {
    try {
      // Find user by username
      const user = await User.findByUsername(username);
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Validate password
      const isValidPassword = await user.validatePassword(password);
      if (!isValidPassword) {
        throw new Error('Invalid username or password');
      }

      // Generate tokens
      const token = generateToken(user);
      const refreshToken = generateRefreshToken(user);

      return {
        user: user.toJSON(),
        token,
        refreshToken,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user profile by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User data
   */
  static async getUserProfile(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated user
   */
  static async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if updating username and if new username already exists
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await User.findByUsername(updateData.username);
        if (existingUser) {
          throw new Error('Username already exists');
        }
      }

      // If password is being updated, it will be hashed by model hook
      await user.update(updateData);
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all users with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Users with pagination info
   */
  static async getAllUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        role = 'all',
      } = options;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add role filter
      if (role !== 'all') {
        whereClause.role = role;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['username', 'ASC']],
        attributes: { exclude: ['passwordHash'] }, // Never return password hash
      });

      const totalPages = Math.ceil(count / limit);

      return {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user by ID
   * @param {number} userId - User ID
   * @param {number} requestingUserId - ID of user making the request
   * @returns {Promise<boolean>} Success status
   */
  static async deleteUser(userId, requestingUserId) {
    try {
      // Prevent users from deleting themselves
      if (userId === requestingUserId) {
        throw new Error('Cannot delete your own account');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change user role (admin only)
   * @param {number} userId - User ID
   * @param {string} newRole - New role
   * @param {number} requestingUserId - ID of user making the request
   * @returns {Promise<Object>} Updated user
   */
  static async changeUserRole(userId, newRole, requestingUserId) {
    try {
      // Prevent users from changing their own role
      if (userId === requestingUserId) {
        throw new Error('Cannot change your own role');
      }

      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      await user.update({ role: newRole });
      return user.toJSON();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} Statistics
   */
  static async getUserStats() {
    try {
      const totalUsers = await User.count();
      const adminUsers = await User.count({
        where: { role: 'admin' },
      });
      const managerUsers = await User.count({
        where: { role: 'manager' },
      });

      return {
        total: totalUsers,
        admin: adminUsers,
        manager: managerUsers,
        adminPercentage: totalUsers > 0 ? ((adminUsers / totalUsers) * 100).toFixed(2) : 0,
        managerPercentage: totalUsers > 0 ? ((managerUsers / totalUsers) * 100).toFixed(2) : 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Search users by username
   * @param {string} searchTerm - Search term
   * @returns {Promise<Array>} Matching users
   */
  static async searchUsers(searchTerm) {
    try {
      if (!searchTerm || searchTerm.trim() === '') {
        return [];
      }

      const users = await User.findAll({
        where: {
          username: {
            [Op.iLike]: `%${searchTerm.trim()}%`,
          },
        },
        attributes: { exclude: ['passwordHash'] },
        order: [['username', 'ASC']],
        limit: 20,
      });

      return users;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = UserService;