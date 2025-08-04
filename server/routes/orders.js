const express = require('express');
const { Op } = require('sequelize');
const { Order, Office, User, Vendor, Reorder } = require('../models');
const { validate, orderSchema } = require('../middleware/validation');
const { auth, authorize } = require('../middleware/auth');
const emailService = require('../services/emailService');
const moment = require('moment');

const router = express.Router();

// Get orders with filters, pagination, and search
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 5,
      search = '',
      officeId,
      agentId,
      installationType,
      status
    } = req.query;

    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause = {};

    // Business rule: Show orders with no installation date or within the last 2 years
    const twoYearsAgo = moment().subtract(2, 'years').toDate();
    whereClause[Op.or] = [
      { installationDate: null },
      { installationDate: { [Op.gte]: twoYearsAgo } }
    ];

    // Apply filters
    if (officeId) whereClause.officeId = officeId;
    if (agentId) whereClause.agentId = agentId;
    if (installationType) whereClause.installationType = installationType;
    if (status) whereClause.status = status;

    // Apply search (case-insensitive, partial-text on all columns)
    if (search) {
      whereClause[Op.or] = [
        ...whereClause[Op.or] || [],
        { orderId: { [Op.iLike]: `%${search}%` } },
        { streetAddress: { [Op.iLike]: `%${search}%` } },
        { city: { [Op.iLike]: `%${search}%` } },
        { state: { [Op.iLike]: `%${search}%` } },
        { zipCode: { [Op.iLike]: `%${search}%` } },
        { contactName: { [Op.iLike]: `%${search}%` } },
        { contactPhone: { [Op.iLike]: `%${search}%` } },
        { additionalInfo: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Role-based filtering
    if (req.user.role === 'AGENT') {
      whereClause.agentId = req.user.id;
    } else if (req.user.role === 'ADMIN_AGENT' && req.user.officeId) {
      whereClause.officeId = req.user.officeId;
    }

    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereClause,
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Vendor, as: 'vendor' },
        { model: Reorder, as: 'reorders' }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Vendor, as: 'vendor' },
        { model: Reorder, as: 'reorders', include: [
          { model: User, as: 'listingAgent', attributes: ['id', 'firstName', 'lastName', 'email'] }
        ]}
      ]
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT' && order.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'ADMIN_AGENT' && order.officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new order
router.post('/', auth, validate(orderSchema), async (req, res) => {
  try {
    const orderData = { ...req.body };

    // Find vendor by zip code if not specified
    if (!orderData.vendorId) {
      const vendor = await Vendor.findOne({
        where: {
          serviceAreas: { [Op.contains]: [orderData.zipCode] },
          isActive: true
        }
      });
      if (vendor) {
        orderData.vendorId = vendor.id;
      }
    }

    const order = await Order.create(orderData);

    const orderWithAssociations = await Order.findByPk(order.id, {
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Vendor, as: 'vendor' }
      ]
    });

    // Send email notification
    try {
      await emailService.sendOrderNotification(orderWithAssociations, 'new');
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
      // Don't fail the order creation if email fails
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: orderWithAssociations
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order
router.put('/:id', auth, validate(orderSchema), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT' && order.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'ADMIN_AGENT' && order.officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await order.update(req.body);

    const updatedOrder = await Order.findByPk(order.id, {
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: Vendor, as: 'vendor' }
      ]
    });

    // Send email notification
    try {
      await emailService.sendOrderNotification(updatedOrder, 'updated');
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }

    res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete order (Admin only)
router.delete('/:id', auth, authorize('IT_ADMIN', 'SIGN_ADMIN'), async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.destroy();

    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get orders eligible for reorder
router.get('/eligible-for-reorder/:id', auth, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if order is eligible for reorder (completed or removal-type)
    const isEligible = order.status === 'COMPLETED' || order.installationType === 'REMOVAL';

    res.json({ eligible: isEligible });
  } catch (error) {
    console.error('Check reorder eligibility error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;