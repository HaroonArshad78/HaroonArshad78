const express = require('express');
const { Op } = require('sequelize');
const { Order, Office, User, Vendor } = require('../models');
const { auth } = require('../middleware/auth');
const moment = require('moment');

const router = express.Router();

// Get sign requests with filters, pagination, and search
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      search = '',
      officeId,
      agentId
    } = req.query;

    // Validate required office parameter
    if (!officeId) {
      return res.status(400).json({ 
        message: 'Office selection is required',
        error: 'OFFICE_REQUIRED'
      });
    }

    const offset = (page - 1) * limit;
    const limitNum = parseInt(limit);

    // Build where clause
    const whereClause = {};

    // Business rule: Show orders with no installation date or within the last 2 years
    const twoYearsAgo = moment().subtract(2, 'years').toDate();
    whereClause[Op.or] = [
      { installationDate: null },
      { installationDate: { [Op.gte]: twoYearsAgo } }
    ];

    // Apply required office filter
    whereClause.officeId = parseInt(officeId);

    // Apply optional agent filter
    if (agentId) {
      whereClause.agentId = parseInt(agentId);
    }

    // Apply search (case-insensitive, partial-text on multiple columns)
    if (search) {
      const searchConditions = [
        { orderId: { [Op.iLike]: `%${search}%` } },
        { streetAddress: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { state: { [Op.iLike]: `%${search}%` } },
        { zipCode: { [Op.iLike]: `%${search}%` } },
        { contactName: { [Op.iLike]: `%${search}%` } },
        { contactEmail: { [Op.iLike]: `%${search}%` } },
        { installationType: { [Op.iLike]: `%${search}%` } },
        { propertyType: { [Op.iLike]: `%${search}%` } },
        { status: { [Op.iLike]: `%${search}%` } }
      ];

      // Combine search conditions with existing OR conditions
      if (whereClause[Op.or]) {
        whereClause[Op.and] = [
          { [Op.or]: whereClause[Op.or] }, // 2-year rule
          { [Op.or]: searchConditions }    // search conditions
        ];
        delete whereClause[Op.or];
      } else {
        whereClause[Op.or] = searchConditions;
      }
    }

    // Execute query with pagination
    const { count, rows } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Office,
          as: 'office',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'agent',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: Vendor,
          as: 'vendor',
          attributes: ['id', 'name'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: offset,
      distinct: true // Important for correct count with includes
    });

    // Transform data to match frontend expectations
    const transformedOrders = rows.map(order => {
      const orderData = order.toJSON();
      
      // Determine if order button should be shown based on business rules
      const canOrder = orderData.completionDate || orderData.installationType === 'REMOVAL';
      
      return {
        ...orderData,
        canOrder,
        // Ensure address fields are available for frontend display
        address: `${orderData.streetAddress || ''}, ${orderData.city || ''}, ${orderData.state || ''} ${orderData.zipCode || ''}`.trim()
      };
    });

    res.json({
      orders: transformedOrders,
      total: count,
      page: parseInt(page),
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum)
    });

  } catch (error) {
    console.error('Get sign requests error:', error);
    
    // Handle specific database errors
    if (error.name === 'SequelizeDatabaseError') {
      return res.status(500).json({ 
        message: 'Database query error',
        error: 'DATABASE_ERROR'
      });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid query parameters',
        error: 'VALIDATION_ERROR',
        details: error.errors?.map(e => e.message) || [error.message]
      });
    }

    res.status(500).json({ 
      message: 'Failed to fetch sign requests',
      error: 'SERVER_ERROR'
    });
  }
});

// Get sign request statistics (optional - for dashboard widgets)
router.get('/stats', auth, async (req, res) => {
  try {
    const { officeId, agentId } = req.query;

    if (!officeId) {
      return res.status(400).json({ 
        message: 'Office selection is required',
        error: 'OFFICE_REQUIRED'
      });
    }

    const whereClause = { officeId: parseInt(officeId) };
    if (agentId) {
      whereClause.agentId = parseInt(agentId);
    }

    // Business rule: Show orders with no installation date or within the last 2 years
    const twoYearsAgo = moment().subtract(2, 'years').toDate();
    whereClause[Op.or] = [
      { installationDate: null },
      { installationDate: { [Op.gte]: twoYearsAgo } }
    ];

    const stats = await Order.findAll({
      where: whereClause,
      attributes: [
        'installationType',
        'status',
        [Order.sequelize.fn('COUNT', Order.sequelize.col('id')), 'count']
      ],
      group: ['installationType', 'status'],
      raw: true
    });

    const totalOrders = await Order.count({ where: whereClause });

    // Count orders eligible for ordering
    const eligibleForOrdering = await Order.count({
      where: {
        ...whereClause,
        [Op.or]: [
          { completionDate: { [Op.not]: null } },
          { installationType: 'REMOVAL' }
        ]
      }
    });

    res.json({
      totalOrders,
      eligibleForOrdering,
      breakdown: stats
    });

  } catch (error) {
    console.error('Get sign request stats error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch sign request statistics',
      error: 'SERVER_ERROR'
    });
  }
});

module.exports = router;