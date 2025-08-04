const express = require('express');
const { Reorder, Order, User, Office } = require('../models');
const { validate, reorderSchema } = require('../middleware/validation');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();

// Get reorders for an order
router.get('/order/:orderId', auth, async (req, res) => {
  try {
    const reorders = await Reorder.findAll({
      where: { originalOrderId: req.params.orderId },
      include: [
        { model: User, as: 'listingAgent', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ reorders });
  } catch (error) {
    console.error('Get reorders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create reorder
router.post('/', auth, validate(reorderSchema), async (req, res) => {
  try {
    const { originalOrderId, installationType, zipCode, additionalInfo, listingAgentId } = req.body;

    // Verify original order exists and is eligible for reorder
    const originalOrder = await Order.findByPk(originalOrderId, {
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    if (!originalOrder) {
      return res.status(404).json({ message: 'Original order not found' });
    }

    // Check eligibility
    const isEligible = originalOrder.status === 'COMPLETED' || originalOrder.installationType === 'REMOVAL';
    if (!isEligible) {
      return res.status(400).json({ message: 'Order is not eligible for reorder' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT' && originalOrder.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'ADMIN_AGENT' && originalOrder.officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reorder = await Reorder.create({
      originalOrderId,
      installationType,
      zipCode,
      additionalInfo,
      listingAgentId
    });

    const reorderWithAssociations = await Reorder.findByPk(reorder.id, {
      include: [
        { model: User, as: 'listingAgent', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    // Send email notification
    try {
      await emailService.sendReorderNotification(reorderWithAssociations, originalOrder);
    } catch (emailError) {
      console.error('Error sending reorder notification:', emailError);
    }

    res.status(201).json({
      message: 'Reorder created successfully',
      reorder: reorderWithAssociations
    });
  } catch (error) {
    console.error('Create reorder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update reorder
router.put('/:id', auth, validate(reorderSchema), async (req, res) => {
  try {
    const reorder = await Reorder.findByPk(req.params.id, {
      include: [
        { model: Order, as: 'originalOrder' }
      ]
    });

    if (!reorder) {
      return res.status(404).json({ message: 'Reorder not found' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT' && reorder.originalOrder.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'ADMIN_AGENT' && reorder.originalOrder.officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await reorder.update(req.body);

    const updatedReorder = await Reorder.findByPk(reorder.id, {
      include: [
        { model: User, as: 'listingAgent', attributes: ['id', 'firstName', 'lastName', 'email'] }
      ]
    });

    res.json({
      message: 'Reorder updated successfully',
      reorder: updatedReorder
    });
  } catch (error) {
    console.error('Update reorder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete reorder
router.delete('/:id', auth, async (req, res) => {
  try {
    const reorder = await Reorder.findByPk(req.params.id, {
      include: [{ model: Order, as: 'originalOrder' }]
    });

    if (!reorder) {
      return res.status(404).json({ message: 'Reorder not found' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT' && reorder.originalOrder.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'ADMIN_AGENT' && reorder.originalOrder.officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await reorder.destroy();

    res.json({ message: 'Reorder deleted successfully' });
  } catch (error) {
    console.error('Delete reorder error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;