const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');
const { Order, Office, Vendor } = require('../models');
const { Op } = require('sequelize');

class PDFService {
  constructor() {
    this.uploadsDir = process.env.PDF_STORAGE_PATH || './uploads/reports';
    this.ensureUploadDir();
  }

  async ensureUploadDir() {
    try {
      await fs.access(this.uploadsDir);
    } catch {
      await fs.mkdir(this.uploadsDir, { recursive: true });
    }
  }

  async generateReport(filters) {
    try {
      const { startDate, endDate, officeId, vendorId, installationType } = filters;
      
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

      // Get orders with associations
      const orders = await Order.findAll({
        where: whereClause,
        include: [
          { model: Office, as: 'office' },
          { model: Vendor, as: 'vendor' }
        ]
      });

      if (orders.length === 0) {
        return null; // Empty report
      }

      // Group by office and installation type
      const reportData = this.groupOrdersForReport(orders);
      
      // Generate HTML content
      const htmlContent = this.generateReportHTML(reportData, filters);
      
      // Generate PDF using Puppeteer
      const pdfBuffer = await this.generatePDFFromHTML(htmlContent);
      
      // Save PDF file
      const filename = `report_${Date.now()}.pdf`;
      const filepath = path.join(this.uploadsDir, filename);
      await fs.writeFile(filepath, pdfBuffer);
      
      return {
        filename,
        filepath,
        data: reportData
      };
    } catch (error) {
      console.error('Error generating PDF report:', error);
      throw error;
    }
  }

  groupOrdersForReport(orders) {
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
    
    return grouped;
  }

  generateReportHTML(reportData, filters) {
    const { startDate, endDate, officeId, vendorId, installationType } = filters;
    
    let filterInfo = '<p><strong>Filters Applied:</strong></p><ul>';
    if (startDate && endDate) {
      filterInfo += `<li>Date Range: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</li>`;
    }
    if (officeId) filterInfo += `<li>Office ID: ${officeId}</li>`;
    if (vendorId) filterInfo += `<li>Vendor ID: ${vendorId}</li>`;
    if (installationType) filterInfo += `<li>Installation Type: ${installationType}</li>`;
    filterInfo += '</ul>';

    let tableRows = '';
    let grandTotal = 0;
    
    Object.keys(reportData).forEach(officeName => {
      const officeData = reportData[officeName];
      let officeTotal = 0;
      
      const installations = officeData.INSTALLATION || 0;
      const removals = officeData.REMOVAL || 0;
      const repairs = officeData.REPAIR || 0;
      
      officeTotal = installations + removals + repairs;
      grandTotal += officeTotal;
      
      tableRows += `
        <tr>
          <td>${officeName}</td>
          <td>${installations}</td>
          <td>${removals}</td>
          <td>${repairs}</td>
          <td><strong>${officeTotal}</strong></td>
        </tr>
      `;
    });

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Sign Orders Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin-bottom: 10px; }
            .header .date { color: #666; }
            .filters { background-color: #f5f5f5; padding: 15px; margin-bottom: 30px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total-row { background-color: #e8f4fd; }
            .summary { margin-top: 30px; padding: 15px; background-color: #f9f9f9; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sign Orders Report</h1>
            <div class="date">Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="filters">
            ${filterInfo}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Office</th>
                <th>Installations</th>
                <th>Removals</th>
                <th>Repairs</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr class="total-row">
                <td><strong>GRAND TOTAL</strong></td>
                <td><strong>${Object.values(reportData).reduce((sum, office) => sum + (office.INSTALLATION || 0), 0)}</strong></td>
                <td><strong>${Object.values(reportData).reduce((sum, office) => sum + (office.REMOVAL || 0), 0)}</strong></td>
                <td><strong>${Object.values(reportData).reduce((sum, office) => sum + (office.REPAIR || 0), 0)}</strong></td>
                <td><strong>${grandTotal}</strong></td>
              </tr>
            </tbody>
          </table>
          
          <div class="summary">
            <h3>Summary</h3>
            <p>Total offices: ${Object.keys(reportData).length}</p>
            <p>Total orders: ${grandTotal}</p>
          </div>
        </body>
      </html>
    `;
  }

  async generatePDFFromHTML(htmlContent) {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true
      });
      
      return pdfBuffer;
    } finally {
      await browser.close();
    }
  }
}

module.exports = new PDFService();