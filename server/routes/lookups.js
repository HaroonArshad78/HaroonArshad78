const express = require('express');
const { Office, User, Vendor } = require('../models');
const { validate, officeSchema, vendorSchema } = require('../middleware/validation');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Get all offices
router.get('/offices', auth, async (req, res) => {
  try {
    const offices = await Office.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({ offices });
  } catch (error) {
    console.error('Get offices error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create office (Admin only)
router.post('/offices', auth, authorize('IT_ADMIN', 'SIGN_ADMIN'), validate(officeSchema), async (req, res) => {
  try {
    const office = await Office.create(req.body);

    res.status(201).json({
      message: 'Office created successfully',
      office
    });
  } catch (error) {
    console.error('Create office error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get agents by office
router.get('/agents', auth, async (req, res) => {
  try {
    const { officeId } = req.query;
    const whereClause = { isActive: true };

    if (officeId) {
      whereClause.officeId = officeId;
    }

    // Role-based filtering
    if (req.user.role === 'AGENT') {
      whereClause.id = req.user.id;
    } else if (req.user.role === 'ADMIN_AGENT' && req.user.officeId) {
      whereClause.officeId = req.user.officeId;
    }

    const agents = await User.findAll({
      where: whereClause,
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'officeId'],
      include: [{ model: Office, as: 'office', attributes: ['id', 'name'] }],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']]
    });

    res.json({ agents });
  } catch (error) {
    console.error('Get agents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all vendors
router.get('/vendors', auth, async (req, res) => {
  try {
    const { zipCode } = req.query;
    let whereClause = { isActive: true };

    if (zipCode) {
      const { Op } = require('sequelize');
      whereClause.serviceAreas = { [Op.contains]: [zipCode] };
    }

    const vendors = await Vendor.findAll({
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({ vendors });
  } catch (error) {
    console.error('Get vendors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create vendor (Admin only)
router.post('/vendors', auth, authorize('IT_ADMIN', 'SIGN_ADMIN'), validate(vendorSchema), async (req, res) => {
  try {
    const vendor = await Vendor.create(req.body);

    res.status(201).json({
      message: 'Vendor created successfully',
      vendor
    });
  } catch (error) {
    console.error('Create vendor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update vendor (Admin only)
router.put('/vendors/:id', auth, authorize('IT_ADMIN', 'SIGN_ADMIN'), validate(vendorSchema), async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    await vendor.update(req.body);

    res.json({
      message: 'Vendor updated successfully',
      vendor
    });
  } catch (error) {
    console.error('Update vendor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get installation types
router.get('/installation-types', auth, async (req, res) => {
  try {
    const installationTypes = [
      { value: 'INSTALLATION', label: 'Installation' },
      { value: 'REMOVAL', label: 'Removal' },
      { value: 'REPAIR', label: 'Repair' }
    ];

    res.json({ installationTypes });
  } catch (error) {
    console.error('Get installation types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get property types
router.get('/property-types', auth, async (req, res) => {
  try {
    const propertyTypes = [
      { value: 'Residential', label: 'Residential' },
      { value: 'Commercial', label: 'Commercial' },
      { value: 'Land', label: 'Land' },
      { value: 'Multi-Family', label: 'Multi-Family' },
      { value: 'Condo', label: 'Condo' },
      { value: 'Townhouse', label: 'Townhouse' }
    ];

    res.json({ propertyTypes });
  } catch (error) {
    console.error('Get property types error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get US states
router.get('/states', auth, async (req, res) => {
  try {
    const states = [
      { value: 'AL', label: 'Alabama' },
      { value: 'AK', label: 'Alaska' },
      { value: 'AZ', label: 'Arizona' },
      { value: 'AR', label: 'Arkansas' },
      { value: 'CA', label: 'California' },
      { value: 'CO', label: 'Colorado' },
      { value: 'CT', label: 'Connecticut' },
      { value: 'DE', label: 'Delaware' },
      { value: 'FL', label: 'Florida' },
      { value: 'GA', label: 'Georgia' },
      { value: 'HI', label: 'Hawaii' },
      { value: 'ID', label: 'Idaho' },
      { value: 'IL', label: 'Illinois' },
      { value: 'IN', label: 'Indiana' },
      { value: 'IA', label: 'Iowa' },
      { value: 'KS', label: 'Kansas' },
      { value: 'KY', label: 'Kentucky' },
      { value: 'LA', label: 'Louisiana' },
      { value: 'ME', label: 'Maine' },
      { value: 'MD', label: 'Maryland' },
      { value: 'MA', label: 'Massachusetts' },
      { value: 'MI', label: 'Michigan' },
      { value: 'MN', label: 'Minnesota' },
      { value: 'MS', label: 'Mississippi' },
      { value: 'MO', label: 'Missouri' },
      { value: 'MT', label: 'Montana' },
      { value: 'NE', label: 'Nebraska' },
      { value: 'NV', label: 'Nevada' },
      { value: 'NH', label: 'New Hampshire' },
      { value: 'NJ', label: 'New Jersey' },
      { value: 'NM', label: 'New Mexico' },
      { value: 'NY', label: 'New York' },
      { value: 'NC', label: 'North Carolina' },
      { value: 'ND', label: 'North Dakota' },
      { value: 'OH', label: 'Ohio' },
      { value: 'OK', label: 'Oklahoma' },
      { value: 'OR', label: 'Oregon' },
      { value: 'PA', label: 'Pennsylvania' },
      { value: 'RI', label: 'Rhode Island' },
      { value: 'SC', label: 'South Carolina' },
      { value: 'SD', label: 'South Dakota' },
      { value: 'TN', label: 'Tennessee' },
      { value: 'TX', label: 'Texas' },
      { value: 'UT', label: 'Utah' },
      { value: 'VT', label: 'Vermont' },
      { value: 'VA', label: 'Virginia' },
      { value: 'WA', label: 'Washington' },
      { value: 'WV', label: 'West Virginia' },
      { value: 'WI', label: 'Wisconsin' },
      { value: 'WY', label: 'Wyoming' }
    ];

    res.json({ states });
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;