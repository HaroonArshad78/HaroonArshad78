const nodemailer = require('nodemailer');
const { CCEmail, Vendor } = require('../models');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendOrderNotification(order, type = 'new') {
    try {
      const { agent, office, vendor } = order;
      const subject = `${type === 'new' ? 'New' : 'Updated'} Sign Order - ${order.orderId}`;
      
      const emailContent = this.generateOrderEmailContent(order, type);
      
      // Get CC emails for this office/agent
      const ccEmails = await CCEmail.findAll({
        where: {
          officeId: order.officeId,
          isActive: true
        }
      });

      const ccList = ccEmails.map(cc => cc.email);
      
      // Primary recipients
      const recipients = [agent.email];
      if (office.managerEmail) recipients.push(office.managerEmail);
      if (vendor && vendor.email) recipients.push(vendor.email);
      
      // Fallback email if vendor not found
      if (!vendor && office.email) recipients.push(office.email);

      await this.transporter.sendMail({
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to: recipients.join(', '),
        cc: ccList.join(', '),
        subject: subject,
        html: emailContent
      });

      console.log(`Order notification sent for ${order.orderId}`);
    } catch (error) {
      console.error('Error sending order notification:', error);
      throw error;
    }
  }

  async sendReorderNotification(reorder, originalOrder) {
    try {
      const { listingAgent } = reorder;
      const { office, agent: originalAgent } = originalOrder;
      
      const subject = `New Reorder - ${reorder.reorderId} (Original: ${originalOrder.orderId})`;
      const emailContent = this.generateReorderEmailContent(reorder, originalOrder);
      
      // Get CC emails
      const ccEmails = await CCEmail.findAll({
        where: {
          officeId: originalOrder.officeId,
          isActive: true
        }
      });

      const ccList = ccEmails.map(cc => cc.email);
      
      const recipients = [listingAgent.email, originalAgent.email];
      if (office.managerEmail) recipients.push(office.managerEmail);

      await this.transporter.sendMail({
        from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
        to: recipients.join(', '),
        cc: ccList.join(', '),
        subject: subject,
        html: emailContent
      });

      console.log(`Reorder notification sent for ${reorder.reorderId}`);
    } catch (error) {
      console.error('Error sending reorder notification:', error);
      throw error;
    }
  }

  generateOrderEmailContent(order, type) {
    const { agent, office } = order;
    
    return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>${type === 'new' ? 'New' : 'Updated'} Sign Order</h2>
          
          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
            <tr><td><strong>Order ID:</strong></td><td>${order.orderId}</td></tr>
            <tr><td><strong>Installation Type:</strong></td><td>${order.installationType}</td></tr>
            <tr><td><strong>Property Type:</strong></td><td>${order.propertyType}</td></tr>
            <tr><td><strong>Address:</strong></td><td>${order.streetAddress}, ${order.city}, ${order.state} ${order.zipCode}</td></tr>
            <tr><td><strong>Agent:</strong></td><td>${agent.firstName} ${agent.lastName}</td></tr>
            <tr><td><strong>Office:</strong></td><td>${office.name}</td></tr>
            <tr><td><strong>Contact:</strong></td><td>${order.contactName || 'N/A'}</td></tr>
            <tr><td><strong>Phone:</strong></td><td>${order.contactPhone || 'N/A'}</td></tr>
            <tr><td><strong>Listing Date:</strong></td><td>${order.listingDate ? new Date(order.listingDate).toLocaleDateString() : 'N/A'}</td></tr>
            <tr><td><strong>Installation Date:</strong></td><td>${order.installationDate ? new Date(order.installationDate).toLocaleDateString() : 'N/A'}</td></tr>
          </table>
          
          ${order.directions ? `<p><strong>Directions:</strong><br>${order.directions}</p>` : ''}
          ${order.additionalInfo ? `<p><strong>Additional Info:</strong><br>${order.additionalInfo}</p>` : ''}
          
          <h3>Special Features:</h3>
          <ul>
            <li>Underwater Sprinkler: ${order.underwaterSprinkler ? 'Yes' : 'No'}</li>
            <li>Invisible Dog Fence: ${order.invisibleDogFence ? 'Yes' : 'No'}</li>
          </ul>
          
          <p>This is an automated message from the Sign Order Management System.</p>
        </body>
      </html>
    `;
  }

  generateReorderEmailContent(reorder, originalOrder) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif;">
          <h2>New Reorder</h2>
          
          <h3>Reorder Details:</h3>
          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
            <tr><td><strong>Reorder ID:</strong></td><td>${reorder.reorderId}</td></tr>
            <tr><td><strong>Installation Type:</strong></td><td>${reorder.installationType}</td></tr>
            <tr><td><strong>Zip Code:</strong></td><td>${reorder.zipCode}</td></tr>
            <tr><td><strong>Listing Agent:</strong></td><td>${reorder.listingAgent.firstName} ${reorder.listingAgent.lastName}</td></tr>
          </table>
          
          ${reorder.additionalInfo ? `<p><strong>Additional Info:</strong><br>${reorder.additionalInfo}</p>` : ''}
          
          <h3>Original Order:</h3>
          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
            <tr><td><strong>Order ID:</strong></td><td>${originalOrder.orderId}</td></tr>
            <tr><td><strong>Address:</strong></td><td>${originalOrder.streetAddress}, ${originalOrder.city}, ${originalOrder.state} ${originalOrder.zipCode}</td></tr>
            <tr><td><strong>Original Agent:</strong></td><td>${originalOrder.agent.firstName} ${originalOrder.agent.lastName}</td></tr>
          </table>
          
          <p>This is an automated message from the Sign Order Management System.</p>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();