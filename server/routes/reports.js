const express = require('express');
const { auth } = require('../middleware/auth');
const pdfService = require('../services/pdfService');
const path = require('path');

const router = express.Router();

// Generate PDF report
router.post('/generate', auth, async (req, res) => {
  try {
    const { startDate, endDate, officeId, vendorId, installationType } = req.body;

    const result = await pdfService.generateReport({
      startDate,
      endDate,
      officeId,
      vendorId,
      installationType
    });

    if (!result) {
      return res.status(404).json({ message: 'No data found for the specified criteria' });
    }

    res.json({
      message: 'Report generated successfully',
      filename: result.filename,
      downloadUrl: `/api/reports/download/${result.filename}`,
      data: result.data
    });
  } catch (error) {
    console.error('Generate report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Download PDF report
router.get('/download/:filename', auth, async (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(process.env.PDF_STORAGE_PATH || './uploads/reports', filename);

    // Security check: ensure filename only contains safe characters
    if (!/^report_\d+\.pdf$/.test(filename)) {
      return res.status(400).json({ message: 'Invalid filename' });
    }

    res.download(filepath, filename, (err) => {
      if (err) {
        console.error('Download error:', err);
        if (!res.headersSent) {
          res.status(404).json({ message: 'File not found' });
        }
      }
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get report preview data (without generating PDF)
router.post('/preview', auth, async (req, res) => {
  try {
    const { startDate, endDate, officeId, vendorId, installationType } = req.body;
    const { Op } = require('sequelize');
    const { Order, Office, Vendor } = require('../models');

    // Build query conditions
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (officeId) whereClause.officeId = officeId;
    if (vendorId) whereClause.vendorId = vendorId;
    if (installationType) whereClause.installationType = installationType;

    // Get orders for preview
    const orders = await Order.findAll({
      where: whereClause,
      include: [
        { model: Office, as: 'office' },
        { model: Vendor, as: 'vendor' }
      ]
    });

    if (orders.length === 0) {
      return res.status(404).json({ message: 'No data found for the specified criteria' });
    }

    // Group by office and installation type
    const grouped = {};
    orders.forEach(order => {
      const officeName = order.office.name;
      const installationType = order.installationType;
      
      if (!grouped[officeName]) {
        grouped[officeName] = {};
      }
      
      if (!grouped[officeName][installationType]) {
        grouped[officeName][installationType] = 0;
      }
      
      grouped[officeName][installationType]++;
    });

    res.json({
      totalOrders: orders.length,
      totalOffices: Object.keys(grouped).length,
      data: grouped,
      filters: { startDate, endDate, officeId, vendorId, installationType }
    });
  } catch (error) {
    console.error('Preview report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;