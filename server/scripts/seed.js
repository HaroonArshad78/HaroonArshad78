const { sequelize, User, Office, Vendor } = require('../models');
require('dotenv').config();

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synchronized (all tables recreated)');

    // Create offices
    const offices = await Office.bulkCreate([
      {
        name: 'Downtown Real Estate',
        address: '123 Main St, Suite 100, Downtown, NY 10001',
        phone: '(555) 123-4567',
        email: 'info@downtownre.com',
        managerEmail: 'manager@downtownre.com'
      },
      {
        name: 'Suburban Properties',
        address: '456 Oak Ave, Suburbia, NY 10002',
        phone: '(555) 234-5678',
        email: 'contact@suburbanprops.com',
        managerEmail: 'manager@suburbanprops.com'
      },
      {
        name: 'Luxury Homes Group',
        address: '789 Elite Blvd, Uptown, NY 10003',
        phone: '(555) 345-6789',
        email: 'luxury@homesgroup.com',
        managerEmail: 'manager@homesgroup.com'
      }
    ]);

    console.log(`Created ${offices.length} offices`);

    // Create users
    const users = await User.bulkCreate([
      {
        email: 'admin@signorders.com',
        password: 'admin123',
        firstName: 'System',
        lastName: 'Administrator',
        role: 'IT_ADMIN'
      },
      {
        email: 'signmanager@signorders.com',
        password: 'manager123',
        firstName: 'Sign',
        lastName: 'Manager',
        role: 'SIGN_ADMIN'
      },
      {
        email: 'john.agent@downtownre.com',
        password: 'agent123',
        firstName: 'John',
        lastName: 'Smith',
        role: 'AGENT',
        officeId: offices[0].id
      },
      {
        email: 'jane.agent@downtownre.com',
        password: 'agent123',
        firstName: 'Jane',
        lastName: 'Doe',
        role: 'AGENT',
        officeId: offices[0].id
      },
      {
        email: 'mike.admin@downtownre.com',
        password: 'admin123',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'ADMIN_AGENT',
        officeId: offices[0].id
      },
      {
        email: 'sarah.agent@suburbanprops.com',
        password: 'agent123',
        firstName: 'Sarah',
        lastName: 'Wilson',
        role: 'AGENT',
        officeId: offices[1].id
      },
      {
        email: 'david.agent@suburbanprops.com',
        password: 'agent123',
        firstName: 'David',
        lastName: 'Brown',
        role: 'AGENT',
        officeId: offices[1].id
      },
      {
        email: 'lisa.admin@suburbanprops.com',
        password: 'admin123',
        firstName: 'Lisa',
        lastName: 'Garcia',
        role: 'ADMIN_AGENT',
        officeId: offices[1].id
      },
      {
        email: 'robert.agent@homesgroup.com',
        password: 'agent123',
        firstName: 'Robert',
        lastName: 'Miller',
        role: 'AGENT',
        officeId: offices[2].id
      },
      {
        email: 'emily.agent@homesgroup.com',
        password: 'agent123',
        firstName: 'Emily',
        lastName: 'Davis',
        role: 'AGENT',
        officeId: offices[2].id
      }
    ]);

    console.log(`Created ${users.length} users`);

    // Create vendors
    const vendors = await Vendor.bulkCreate([
      {
        name: 'Metro Sign Solutions',
        email: 'orders@metrosigns.com',
        phone: '(555) 111-2222',
        address: '100 Industrial Way, Metro City, NY 10010',
        serviceAreas: ['10001', '10002', '10003', '10004', '10005']
      },
      {
        name: 'Suburban Sign Co',
        email: 'service@suburbansigns.com',
        phone: '(555) 222-3333',
        address: '200 Commerce Dr, Suburban, NY 10020',
        serviceAreas: ['10020', '10021', '10022', '10023', '10024']
      },
      {
        name: 'Premium Sign Services',
        email: 'premium@signsvc.com',
        phone: '(555) 333-4444',
        address: '300 Business Plaza, Uptown, NY 10030',
        serviceAreas: ['10030', '10031', '10032', '10033', '10034']
      },
      {
        name: 'All-City Signs',
        email: 'info@allcitysigns.com',
        phone: '(555) 444-5555',
        address: '400 Central Ave, Metro City, NY 10040',
        serviceAreas: ['10001', '10002', '10003', '10020', '10021', '10030', '10031']
      }
    ]);

    console.log(`Created ${vendors.length} vendors`);

    console.log('\n=== SEEDING COMPLETED ===');
    console.log('\nTest Accounts:');
    console.log('IT Admin: admin@signorders.com / admin123');
    console.log('Sign Admin: signmanager@signorders.com / manager123');
    console.log('Agent: john.agent@downtownre.com / agent123');
    console.log('Admin Agent: mike.admin@downtownre.com / admin123');
    console.log('\nAll other agents use password: agent123');
    console.log('\nNote: Remember to update .env file with your database credentials');

  } catch (error) {
    console.error('Seeding failed:', error);
  } finally {
    await sequelize.close();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;