const UserService = require('../services/userService');

class UserController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async register(req, res) {
    try {
      const result = await UserService.registerUser(req.body);
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      console.error('Error registering user:', error);
      
      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to register user',
      });
    }
  }

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await UserService.loginUser(username, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: result.user,
          token: result.token,
          refreshToken: result.refreshToken,
        },
      });
    } catch (error) {
      console.error('Error logging in user:', error);
      
      if (error.message.includes('Invalid username or password')) {
        return res.status(401).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Login failed',
      });
    }
  }

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getProfile(req, res) {
    try {
      const user = await UserService.getUserProfile(req.user.id);
      
      res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: user,
      });
    } catch (error) {
      console.error('Error getting user profile:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get profile',
      });
    }
  }

  /**
   * Update current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async updateProfile(req, res) {
    try {
      const user = await UserService.updateUserProfile(req.user.id, req.body);
      
      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: user,
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          success: false,
          message: error.message,
        });
      }

      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => ({
          field: err.path,
          message: err.message,
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update profile',
      });
    }
  }

  /**
   * Get all users (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getAllUsers(req, res) {
    try {
      const result = await UserService.getAllUsers(req.query);
      
      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error('Error getting users:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get users',
      });
    }
  }

  /**
   * Get user by ID (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserById(req, res) {
    try {
      const user = await UserService.getUserProfile(req.params.id);
      
      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get user',
      });
    }
  }

  /**
   * Delete user (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async deleteUser(req, res) {
    try {
      await UserService.deleteUser(req.params.id, req.user.id);
      
      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('Cannot delete')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
      });
    }
  }

  /**
   * Change user role (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async changeUserRole(req, res) {
    try {
      const { role } = req.body;
      const user = await UserService.changeUserRole(req.params.id, role, req.user.id);
      
      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: user,
      });
    } catch (error) {
      console.error('Error changing user role:', error);
      
      if (error.message === 'User not found') {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      if (error.message.includes('Cannot change')) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to change user role',
      });
    }
  }

  /**
   * Search users (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async searchUsers(req, res) {
    try {
      const { q: searchTerm } = req.query;
      
      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: 'Search term is required',
        });
      }

      const users = await UserService.searchUsers(searchTerm);
      
      res.status(200).json({
        success: true,
        message: 'Search results retrieved successfully',
        data: users,
      });
    } catch (error) {
      console.error('Error searching users:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to search users',
      });
    }
  }

  /**
   * Get user statistics (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async getUserStats(req, res) {
    try {
      const stats = await UserService.getUserStats();
      
      res.status(200).json({
        success: true,
        message: 'User statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('Error getting user statistics:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to get user statistics',
      });
    }
  }

  /**
   * Logout user (invalidate token)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async logout(req, res) {
    try {
      // In a more sophisticated implementation, you would maintain a blacklist of tokens
      // For now, we'll just send a success response
      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      console.error('Error logging out:', error);
      
      res.status(500).json({
        success: false,
        message: 'Logout failed',
      });
    }
  }
}

module.exports = UserController;