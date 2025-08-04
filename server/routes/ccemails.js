const express = require('express');
const { Op } = require('sequelize');
const { CCEmail, Office, User } = require('../models');
const { validate, ccEmailSchema } = require('../middleware/validation');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get CC emails with filters and pagination
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      officeId,
      agentId
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { isActive: true };

    // Apply filters
    if (officeId) whereClause.officeId = officeId;
    if (agentId) whereClause.agentId = agentId;

    // Apply search
    if (search) {
      whereClause.email = { [Op.iLike]: `%${search}%` };
    }

    // Role-based filtering
    if (req.user.role === 'AGENT') {
      whereClause.agentId = req.user.id;
    } else if (req.user.role === 'ADMIN_AGENT' && req.user.officeId) {
      whereClause.officeId = req.user.officeId;
    }

    const { count, rows: ccEmails } = await CCEmail.findAndCountAll({
      where: whereClause,
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'enteredByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'modifiedByUser', attributes: ['id', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      ccEmails,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get CC emails error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single CC email
router.get('/:id', auth, async (req, res) => {
  try {
    const ccEmail = await CCEmail.findByPk(req.params.id, {
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'enteredByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'modifiedByUser', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    if (!ccEmail) {
      return res.status(404).json({ message: 'CC email not found' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT' && ccEmail.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'ADMIN_AGENT' && ccEmail.officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ ccEmail });
  } catch (error) {
    console.error('Get CC email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create CC email
router.post('/', auth, validate(ccEmailSchema), async (req, res) => {
  try {
    const { email, officeId, agentId } = req.body;

    // Check for duplicate
    const existing = await CCEmail.findOne({
      where: {
        email,
        officeId,
        agentId: agentId || null,
        isActive: true
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'CC email already exists for this office/agent combination' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT') {
      if (agentId && agentId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      if (req.user.officeId && officeId !== req.user.officeId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    if (req.user.role === 'ADMIN_AGENT' && req.user.officeId && officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const ccEmail = await CCEmail.create({
      email,
      officeId,
      agentId,
      enteredBy: req.user.id
    });

    const ccEmailWithAssociations = await CCEmail.findByPk(ccEmail.id, {
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'enteredByUser', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.status(201).json({
      message: 'CC email created successfully',
      ccEmail: ccEmailWithAssociations
    });
  } catch (error) {
    console.error('Create CC email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update CC email
router.put('/:id', auth, validate(ccEmailSchema), async (req, res) => {
  try {
    const ccEmail = await CCEmail.findByPk(req.params.id);

    if (!ccEmail) {
      return res.status(404).json({ message: 'CC email not found' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT' && ccEmail.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'ADMIN_AGENT' && ccEmail.officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { email, officeId, agentId } = req.body;

    // Check for duplicate (excluding current record)
    const existing = await CCEmail.findOne({
      where: {
        email,
        officeId,
        agentId: agentId || null,
        isActive: true,
        id: { [Op.ne]: ccEmail.id }
      }
    });

    if (existing) {
      return res.status(400).json({ message: 'CC email already exists for this office/agent combination' });
    }

    await ccEmail.update({
      email,
      officeId,
      agentId,
      modifiedBy: req.user.id
    });

    const updatedCCEmail = await CCEmail.findByPk(ccEmail.id, {
      include: [
        { model: Office, as: 'office' },
        { model: User, as: 'agent', attributes: ['id', 'firstName', 'lastName', 'email'] },
        { model: User, as: 'enteredByUser', attributes: ['id', 'firstName', 'lastName'] },
        { model: User, as: 'modifiedByUser', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    res.json({
      message: 'CC email updated successfully',
      ccEmail: updatedCCEmail
    });
  } catch (error) {
    console.error('Update CC email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete (deactivate) CC email
router.delete('/:id', auth, async (req, res) => {
  try {
    const ccEmail = await CCEmail.findByPk(req.params.id);

    if (!ccEmail) {
      return res.status(404).json({ message: 'CC email not found' });
    }

    // Role-based access control
    if (req.user.role === 'AGENT' && ccEmail.agentId !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (req.user.role === 'ADMIN_AGENT' && ccEmail.officeId !== req.user.officeId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await ccEmail.update({
      isActive: false,
      modifiedBy: req.user.id
    });

    res.json({ message: 'CC email deactivated successfully' });
  } catch (error) {
    console.error('Delete CC email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;