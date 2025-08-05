const { sequelize, Office, User, Order, Vendor } = require('../models');
const bcrypt = require('bcryptjs');
const moment = require('moment');

async function seedSignRequestData() {
  try {
    console.log('Starting sign request data seeding...');

    // Create sample offices
    const offices = await Office.bulkCreate([
      {
        name: 'Downtown Office',
        address: '123 Main St, City, ST 12345',
        phone: '(555) 123-4567',
        email: 'downtown@realty.com',
        managerEmail: 'manager.downtown@realty.com',
        isActive: true
      },
      {
        name: 'Westside Office',
        address: '456 Oak Ave, City, ST 12346',
        phone: '(555) 234-5678',
        email: 'westside@realty.com',
        managerEmail: 'manager.westside@realty.com',
        isActive: true
      },
      {
        name: 'Northside Office',
        address: '789 Pine Blvd, City, ST 12347',
        phone: '(555) 345-6789',
        email: 'northside@realty.com',
        managerEmail: 'manager.northside@realty.com',
        isActive: true
      },
      {
        name: 'Eastside Office',
        address: '321 Elm St, City, ST 12348',
        phone: '(555) 456-7890',
        email: 'eastside@realty.com',
        managerEmail: 'manager.eastside@realty.com',
        isActive: true
      }
    ], { ignoreDuplicates: true });

    console.log(`Created ${offices.length} offices`);

    // Create sample agents
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const agents = await User.bulkCreate([
      // Downtown Office Agents
      {
        email: 'john.doe@realty.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        role: 'AGENT',
        officeId: offices[0].id,
        isActive: true
      },
      {
        email: 'jane.smith@realty.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'AGENT',
        officeId: offices[0].id,
        isActive: true
      },
      // Westside Office Agents
      {
        email: 'mike.johnson@realty.com',
        password: hashedPassword,
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'AGENT',
        officeId: offices[1].id,
        isActive: true
      },
      {
        email: 'sarah.wilson@realty.com',
        password: hashedPassword,
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'ADMIN_AGENT',
        officeId: offices[1].id,
        isActive: true
      },
      // Northside Office Agents
      {
        email: 'david.brown@realty.com',
        password: hashedPassword,
        firstName: 'David',
        lastName: 'Brown',
        role: 'AGENT',
        officeId: offices[2].id,
        isActive: true
      },
      {
        email: 'lisa.davis@realty.com',
        password: hashedPassword,
        firstName: 'Lisa',
        lastName: 'Davis',
        role: 'AGENT',
        officeId: offices[2].id,
        isActive: true
      },
      // Eastside Office Agents
      {
        email: 'robert.miller@realty.com',
        password: hashedPassword,
        firstName: 'Robert',
        lastName: 'Miller',
        role: 'AGENT',
        officeId: offices[3].id,
        isActive: true
      },
      {
        email: 'amanda.garcia@realty.com',
        password: hashedPassword,
        firstName: 'Amanda',
        lastName: 'Garcia',
        role: 'AGENT',
        officeId: offices[3].id,
        isActive: true
      }
    ], { ignoreDuplicates: true });

    console.log(`Created ${agents.length} agents`);

    // Create sample vendors
    const vendors = await Vendor.bulkCreate([
      {
        name: 'SignCorp Solutions',
        contactPerson: 'Tom Anderson',
        phone: '(555) 111-2222',
        email: 'tom@signcorp.com',
        isActive: true
      },
      {
        name: 'Premier Sign Co',
        contactPerson: 'Maria Rodriguez',
        phone: '(555) 333-4444',
        email: 'maria@premiersign.com',
        isActive: true
      }
    ], { ignoreDuplicates: true });

    console.log(`Created ${vendors.length} vendors`);

    // Create sample orders with various dates and statuses
    const sampleOrders = [];
    const installationTypes = ['INSTALLATION', 'REMOVAL', 'REPAIR'];
    const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
    const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Commercial', 'Land'];

    // Generate orders for each office and agent combination
    for (let officeIndex = 0; officeIndex < offices.length; officeIndex++) {
      const office = offices[officeIndex];
      const officeAgents = agents.filter(agent => agent.officeId === office.id);

      for (let agentIndex = 0; agentIndex < officeAgents.length; agentIndex++) {
        const agent = officeAgents[agentIndex];

        // Create 8-12 orders per agent
        const orderCount = Math.floor(Math.random() * 5) + 8;
        
        for (let i = 0; i < orderCount; i++) {
          const installationType = installationTypes[Math.floor(Math.random() * installationTypes.length)];
          const status = statuses[Math.floor(Math.random() * statuses.length)];
          const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
          
          // Generate random dates
          const createdAt = moment().subtract(Math.floor(Math.random() * 365 * 3), 'days').toDate(); // Up to 3 years ago
          const listingDate = moment(createdAt).add(Math.floor(Math.random() * 30), 'days').toDate();
          
          // Some orders have installation dates, some don't
          let installationDate = null;
          let completionDate = null;
          
          if (Math.random() > 0.3) { // 70% chance of having installation date
            installationDate = moment(listingDate).add(Math.floor(Math.random() * 60), 'days').toDate();
            
            // If completed status, set completion date
            if (status === 'COMPLETED') {
              completionDate = moment(installationDate).add(Math.floor(Math.random() * 7), 'days').toDate();
            }
          }

          // Generate some orders older than 2 years to test filtering
          if (i === 0 && Math.random() > 0.5) {
            const oldDate = moment().subtract(Math.floor(Math.random() * 365) + 730, 'days').toDate(); // 2-3 years ago
            installationDate = oldDate;
          }

          const orderData = {
            orderId: `SO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            officeId: office.id,
            agentId: agent.id,
            installationType,
            propertyType,
            streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${['Main', 'Oak', 'Pine', 'Elm', 'Maple', 'Cedar'][Math.floor(Math.random() * 6)]} ${['St', 'Ave', 'Blvd', 'Dr', 'Ln'][Math.floor(Math.random() * 5)]}`,
            city: ['Springfield', 'Riverside', 'Franklin', 'Georgetown', 'Clinton'][Math.floor(Math.random() * 5)],
            state: 'CA',
            zipCode: `9${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
            contactName: `${['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa'][Math.floor(Math.random() * 6)]} ${['Smith', 'Johnson', 'Williams', 'Brown', 'Davis', 'Miller'][Math.floor(Math.random() * 6)]}`,
            contactPhone: `(555) ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
            contactEmail: `contact${i}@email.com`,
            listingDate,
            expirationDate: moment(listingDate).add(6, 'months').toDate(),
            installationDate,
            completionDate,
            directions: `Turn ${['left', 'right'][Math.floor(Math.random() * 2)]} at the ${['red', 'blue', 'white'][Math.floor(Math.random() * 3)]} house`,
            additionalInfo: Math.random() > 0.5 ? 'Special instructions for installation' : null,
            underwaterSprinkler: Math.random() > 0.8,
            invisibleDogFence: Math.random() > 0.9,
            vendorId: Math.random() > 0.3 ? vendors[Math.floor(Math.random() * vendors.length)].id : null,
            status,
            createdAt,
            updatedAt: createdAt
          };

          sampleOrders.push(orderData);
        }
      }
    }

    // Insert orders in batches
    const batchSize = 50;
    let createdOrdersCount = 0;

    for (let i = 0; i < sampleOrders.length; i += batchSize) {
      const batch = sampleOrders.slice(i, i + batchSize);
      const createdOrders = await Order.bulkCreate(batch, { ignoreDuplicates: true });
      createdOrdersCount += createdOrders.length;
    }

    console.log(`Created ${createdOrdersCount} sample orders`);

    // Summary
    console.log('\n=== Seeding Summary ===');
    console.log(`Offices: ${offices.length}`);
    console.log(`Agents: ${agents.length}`);
    console.log(`Vendors: ${vendors.length}`);
    console.log(`Orders: ${createdOrdersCount}`);
    
    // Show breakdown by office
    for (const office of offices) {
      const officeOrderCount = sampleOrders.filter(order => order.officeId === office.id).length;
      console.log(`${office.name}: ${officeOrderCount} orders`);
    }

    console.log('\n=== Test Data Ready ===');
    console.log('You can now test the sign request grid with the following:');
    console.log('- Multiple offices with different agents');
    console.log('- Orders spanning 3+ years (some filtered by 2-year rule)');
    console.log('- Various installation types and statuses');
    console.log('- Orders eligible and not eligible for ordering');
    
    console.log('\nSign request data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding sign request data:', error);
    throw error;
  }
}

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedSignRequestData()
    .then(() => {
      console.log('Seeding completed, closing database connection...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedSignRequestData };