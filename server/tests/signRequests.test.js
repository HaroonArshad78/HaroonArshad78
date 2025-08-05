const request = require('supertest');
const express = require('express');
const { sequelize, Order, Office, User, Vendor } = require('../models');
const signRequestRoutes = require('../routes/signRequests');
const { auth } = require('../middleware/auth');
const moment = require('moment');

// Mock the auth middleware
jest.mock('../middleware/auth', () => ({
  auth: (req, res, next) => {
    req.user = {
      id: 1,
      email: 'test@example.com',
      role: 'AGENT',
      officeId: 1
    };
    next();
  }
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/sign-requests', signRequestRoutes);

describe('Sign Requests API', () => {
  let testOffice1, testOffice2;
  let testAgent1, testAgent2, testAgent3;
  let testVendor;
  let testOrders = [];

  beforeAll(async () => {
    // Set up test database
    await sequelize.sync({ force: true });

    // Create test offices
    testOffice1 = await Office.create({
      name: 'Test Office 1',
      address: '123 Test St',
      phone: '555-0001',
      email: 'office1@test.com',
      isActive: true
    });

    testOffice2 = await Office.create({
      name: 'Test Office 2',
      address: '456 Test Ave',
      phone: '555-0002',
      email: 'office2@test.com',
      isActive: true
    });

    // Create test agents
    testAgent1 = await User.create({
      email: 'agent1@test.com',
      password: 'hashedpassword',
      firstName: 'John',
      lastName: 'Doe',
      role: 'AGENT',
      officeId: testOffice1.id,
      isActive: true
    });

    testAgent2 = await User.create({
      email: 'agent2@test.com',
      password: 'hashedpassword',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'AGENT',
      officeId: testOffice1.id,
      isActive: true
    });

    testAgent3 = await User.create({
      email: 'agent3@test.com',
      password: 'hashedpassword',
      firstName: 'Bob',
      lastName: 'Johnson',
      role: 'AGENT',
      officeId: testOffice2.id,
      isActive: true
    });

    // Create test vendor
    testVendor = await Vendor.create({
      name: 'Test Vendor',
      contactPerson: 'Vendor Contact',
      phone: '555-0100',
      email: 'vendor@test.com',
      isActive: true
    });

    // Create test orders
    const orderData = [
      // Recent orders (within 2 years)
      {
        orderId: 'SO-RECENT-001',
        officeId: testOffice1.id,
        agentId: testAgent1.id,
        installationType: 'INSTALLATION',
        propertyType: 'Single Family',
        streetAddress: '100 Main St',
        city: 'Springfield',
        state: 'CA',
        zipCode: '90210',
        contactName: 'Customer One',
        contactPhone: '555-1001',
        contactEmail: 'customer1@email.com',
        listingDate: moment().subtract(30, 'days').toDate(),
        installationDate: moment().subtract(15, 'days').toDate(),
        completionDate: moment().subtract(10, 'days').toDate(),
        status: 'COMPLETED',
        vendorId: testVendor.id,
        createdAt: moment().subtract(45, 'days').toDate()
      },
      {
        orderId: 'SO-RECENT-002',
        officeId: testOffice1.id,
        agentId: testAgent2.id,
        installationType: 'REMOVAL',
        propertyType: 'Condo',
        streetAddress: '200 Oak Ave',
        city: 'Franklin',
        state: 'CA',
        zipCode: '90211',
        contactName: 'Customer Two',
        contactPhone: '555-1002',
        contactEmail: 'customer2@email.com',
        listingDate: moment().subtract(20, 'days').toDate(),
        installationDate: null,
        completionDate: null,
        status: 'PENDING',
        vendorId: testVendor.id,
        createdAt: moment().subtract(25, 'days').toDate()
      },
      {
        orderId: 'SO-RECENT-003',
        officeId: testOffice2.id,
        agentId: testAgent3.id,
        installationType: 'INSTALLATION',
        propertyType: 'Townhouse',
        streetAddress: '300 Pine Blvd',
        city: 'Georgetown',
        state: 'CA',
        zipCode: '90212',
        contactName: 'Customer Three',
        contactPhone: '555-1003',
        contactEmail: 'customer3@email.com',
        listingDate: moment().subtract(60, 'days').toDate(),
        installationDate: moment().subtract(45, 'days').toDate(),
        completionDate: null,
        status: 'IN_PROGRESS',
        vendorId: null,
        createdAt: moment().subtract(70, 'days').toDate()
      },
      // Old orders (older than 2 years) - should be filtered out
      {
        orderId: 'SO-OLD-001',
        officeId: testOffice1.id,
        agentId: testAgent1.id,
        installationType: 'INSTALLATION',
        propertyType: 'Single Family',
        streetAddress: '400 Elm St',
        city: 'Clinton',
        state: 'CA',
        zipCode: '90213',
        contactName: 'Old Customer',
        contactPhone: '555-1004',
        contactEmail: 'oldcustomer@email.com',
        listingDate: moment().subtract(3, 'years').toDate(),
        installationDate: moment().subtract(3, 'years').add(30, 'days').toDate(),
        completionDate: moment().subtract(3, 'years').add(35, 'days').toDate(),
        status: 'COMPLETED',
        vendorId: testVendor.id,
        createdAt: moment().subtract(3, 'years').toDate()
      },
      // Order with no installation date (should be included)
      {
        orderId: 'SO-NO-INSTALL-001',
        officeId: testOffice1.id,
        agentId: testAgent1.id,
        installationType: 'INSTALLATION',
        propertyType: 'Commercial',
        streetAddress: '500 Maple Dr',
        city: 'Riverside',
        state: 'CA',
        zipCode: '90214',
        contactName: 'No Install Customer',
        contactPhone: '555-1005',
        contactEmail: 'noinstall@email.com',
        listingDate: moment().subtract(100, 'days').toDate(),
        installationDate: null,
        completionDate: null,
        status: 'PENDING',
        vendorId: null,
        createdAt: moment().subtract(120, 'days').toDate()
      }
    ];

    for (const data of orderData) {
      const order = await Order.create(data);
      testOrders.push(order);
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/sign-requests', () => {
    it('should return 400 when office is not provided', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .expect(400);

      expect(response.body).toEqual({
        message: 'Office selection is required',
        error: 'OFFICE_REQUIRED'
      });
    });

    it('should return orders for a specific office', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ officeId: testOffice1.id })
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page', 1);
      expect(response.body).toHaveProperty('limit', 5);

      // Should return 3 orders from office 1 (excluding old order due to 2-year rule)
      expect(response.body.orders).toHaveLength(3);
      expect(response.body.total).toBe(3);

      // Check that orders include necessary fields
      const order = response.body.orders[0];
      expect(order).toHaveProperty('orderId');
      expect(order).toHaveProperty('streetAddress');
      expect(order).toHaveProperty('city');
      expect(order).toHaveProperty('state');
      expect(order).toHaveProperty('zipCode');
      expect(order).toHaveProperty('installationType');
      expect(order).toHaveProperty('createdAt');
      expect(order).toHaveProperty('canOrder');
      expect(order).toHaveProperty('office');
      expect(order).toHaveProperty('agent');
    });

    it('should filter by agent when provided', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ 
          officeId: testOffice1.id,
          agentId: testAgent1.id 
        })
        .expect(200);

      expect(response.body.orders).toHaveLength(2); // 2 orders for agent1 (excluding old one)
      response.body.orders.forEach(order => {
        expect(order.agentId).toBe(testAgent1.id);
      });
    });

    it('should apply 2-year rule correctly', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ officeId: testOffice1.id })
        .expect(200);

      // Should not include the old order (SO-OLD-001)
      const orderIds = response.body.orders.map(order => order.orderId);
      expect(orderIds).not.toContain('SO-OLD-001');
      
      // Should include order with no installation date
      expect(orderIds).toContain('SO-NO-INSTALL-001');
    });

    it('should handle search functionality', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ 
          officeId: testOffice1.id,
          search: 'SO-RECENT-001'
        })
        .expect(200);

      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].orderId).toBe('SO-RECENT-001');
    });

    it('should search across multiple fields', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ 
          officeId: testOffice1.id,
          search: 'Franklin'
        })
        .expect(200);

      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0].city).toBe('Franklin');
    });

    it('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ 
          officeId: testOffice1.id,
          page: 1,
          limit: 2
        })
        .expect(200);

      expect(response.body.orders).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.totalPages).toBe(2); // 3 orders / 2 per page = 2 pages
    });

    it('should set canOrder correctly based on business rules', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ officeId: testOffice1.id })
        .expect(200);

      response.body.orders.forEach(order => {
        const expectedCanOrder = order.completionDate || order.installationType === 'REMOVAL';
        expect(order.canOrder).toBe(expectedCanOrder);
      });
    });

    it('should include related office and agent data', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ officeId: testOffice1.id })
        .expect(200);

      const order = response.body.orders[0];
      expect(order.office).toHaveProperty('id');
      expect(order.office).toHaveProperty('name');
      expect(order.agent).toHaveProperty('id');
      expect(order.agent).toHaveProperty('firstName');
      expect(order.agent).toHaveProperty('lastName');
      expect(order.agent).toHaveProperty('email');
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const originalFindAndCountAll = Order.findAndCountAll;
      Order.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/sign-requests')
        .query({ officeId: testOffice1.id })
        .expect(500);

      expect(response.body).toEqual({
        message: 'Failed to fetch sign requests',
        error: 'SERVER_ERROR'
      });

      // Restore original method
      Order.findAndCountAll = originalFindAndCountAll;
    });

    it('should validate numeric parameters', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ 
          officeId: 'invalid',
          agentId: 'invalid'
        })
        .expect(200); // Should still work as parseInt will handle conversion

      // The endpoint should handle invalid numbers gracefully
      expect(response.body).toHaveProperty('orders');
    });

    it('should return empty results for non-existent office', async () => {
      const response = await request(app)
        .get('/api/sign-requests')
        .query({ officeId: 99999 })
        .expect(200);

      expect(response.body.orders).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe('GET /api/sign-requests/stats', () => {
    it('should return 400 when office is not provided', async () => {
      const response = await request(app)
        .get('/api/sign-requests/stats')
        .expect(400);

      expect(response.body).toEqual({
        message: 'Office selection is required',
        error: 'OFFICE_REQUIRED'
      });
    });

    it('should return statistics for a specific office', async () => {
      const response = await request(app)
        .get('/api/sign-requests/stats')
        .query({ officeId: testOffice1.id })
        .expect(200);

      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body).toHaveProperty('eligibleForOrdering');
      expect(response.body).toHaveProperty('breakdown');

      expect(typeof response.body.totalOrders).toBe('number');
      expect(typeof response.body.eligibleForOrdering).toBe('number');
      expect(Array.isArray(response.body.breakdown)).toBe(true);
    });

    it('should filter stats by agent when provided', async () => {
      const response = await request(app)
        .get('/api/sign-requests/stats')
        .query({ 
          officeId: testOffice1.id,
          agentId: testAgent1.id 
        })
        .expect(200);

      expect(response.body).toHaveProperty('totalOrders');
      expect(response.body.totalOrders).toBeGreaterThan(0);
    });

    it('should handle stats database errors gracefully', async () => {
      // Mock a database error
      const originalFindAll = Order.findAll;
      Order.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/sign-requests/stats')
        .query({ officeId: testOffice1.id })
        .expect(500);

      expect(response.body).toEqual({
        message: 'Failed to fetch sign request statistics',
        error: 'SERVER_ERROR'
      });

      // Restore original method
      Order.findAll = originalFindAll;
    });
  });
});