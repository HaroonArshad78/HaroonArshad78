# Sign Order Management System

A comprehensive web-based application for managing sign orders (installation, removal, repair) for real estate properties. Built with React + TypeScript frontend and Node.js + Express backend with PostgreSQL database.

## 🚀 Features

### 📋 Order Management
- **Paginated Order Grid**: View all orders with search and filtering capabilities
- **Advanced Filtering**: Filter by Office (mandatory), Agent (optional), Installation Type, Status
- **Smart Search**: Case-insensitive, partial-text search across all columns
- **Business Rules**: Shows orders with no installation date or within the last 2 years
- **Column Visibility**: Toggle column visibility for customized views
- **Default Pagination**: 5 rows per page (configurable)

### ➕ New Order Creation
- **Comprehensive Form**: Modal with all required fields including:
  - Office and Agent selection (dropdowns)
  - Installation Type and Property Type
  - Listing/Expiration Dates
  - Complete address details
  - Contact information and directions
  - Special features (Underwater Sprinkler, Invisible Dog Fence)
- **Validation**: Required fields and US phone format validation
- **Auto Email**: Notifications sent to Agent, Office Manager, and Vendor
- **Vendor Assignment**: Automatic vendor matching by zip code with fallback

### 🔁 Reorder Functionality
- **Eligibility Check**: Available for completed or removal-type orders
- **Three-Section Modal**:
  - Original order details (read-only)
  - Past reorders history (read-only)
  - New reorder form (editable)
- **Editable Fields**: Installation Type, Zip Code, Additional Info, Listing Agent
- **Email Notifications**: Automatic notifications on reorder creation
- **Grid Refresh**: Real-time updates after reorder completion

### 📊 PDF Reporting
- **Flexible Filters**: Start/End Date, Office, Vendor, Installation Type
- **Installation Summary**: Installation-type-wise sign count per office
- **Multiple Formats**: Preview and PDF download options
- **Empty State Handling**: Graceful handling when no data matches filters
- **New Tab Opening**: Reports open in separate browser tab

### ✉️ CC Email Management
- **Grid Interface**: View and manage CC emails with Office/Agent filters
- **Complete Tracking**: 
  - Email, Entered By, Date Entered
  - Modified By, Modified Date, Status
- **Add/Edit Modal**: User-friendly forms for email management
- **Change Logging**: Full audit trail of modifications
- **Search & Pagination**: Easy navigation through large email lists
- **Business Rules**: Office selection required for Agent dropdown population

### 👥 User Roles & Permissions
- **IT Administrator**: Full system access and user management
- **Sign Admin**: Order and system management
- **Agent**: Personal order management
- **Administrative Agent**: Office-level order management

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Material-UI (MUI)** for modern, responsive UI
- **React Router** for navigation
- **React Query** for state management and caching
- **React Hook Form** with Yup validation
- **jsPDF** for client-side PDF generation
- **Axios** for API communication

### Backend
- **Node.js** with Express.js
- **PostgreSQL** database with Sequelize ORM
- **JWT** authentication with role-based access control
- **Nodemailer** for email notifications
- **Puppeteer** for server-side PDF generation
- **Joi** for request validation
- **bcryptjs** for password hashing

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

### 1. Clone Repository
```bash
git clone <repository-url>
cd sign-order-management
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb sign_orders

# Copy environment variables
cd server
cp .env.example .env

# Update .env with your database credentials
```

### 4. Configure Environment Variables
Update `server/.env` with your settings:
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sign_orders
DB_USER=your_username
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your-super-secret-key

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 5. Initialize Database
```bash
# Run database seeding (creates tables and test data)
cd server
node scripts/seed.js
```

### 6. Start Application
```bash
# From root directory - starts both frontend and backend
npm run dev

# Or start separately:
# Backend: npm run server
# Frontend: npm run client
```

## 🎯 Usage

### Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

### Test Accounts
```
IT Admin: admin@signorders.com / admin123
Sign Admin: signmanager@signorders.com / manager123
Agent: john.agent@downtownre.com / agent123
Admin Agent: mike.admin@downtownre.com / admin123
```

### Key Workflows

1. **Login**: Use test credentials or create new users (admin required)
2. **Create Order**: Use "New Order" button, fill required fields
3. **View Orders**: Use filters and search to find specific orders
4. **Reorder**: Click reorder button on eligible orders
5. **Generate Reports**: Use Reports page with date/office filters
6. **Manage CC Emails**: Add email addresses for automatic notifications

## 🏗️ Project Structure

```
sign-order-management/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── services/       # API services
│   │   └── theme/          # Material-UI theme
├── server/                 # Node.js backend
│   ├── models/             # Database models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic services
│   └── scripts/            # Database scripts
└── package.json           # Root package configuration
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access**: Granular permissions by user role
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side validation with Joi
- **Rate Limiting**: Protection against API abuse
- **CORS Configuration**: Secure cross-origin requests
- **SQL Injection Protection**: Sequelize ORM with parameterized queries

## 📧 Email Notifications

The system automatically sends email notifications for:
- New order creation
- Order updates
- New reorders
- Recipients include: Agent, Office Manager, Vendor, and CC emails

## 🚀 Deployment

### Production Environment
1. Set `NODE_ENV=production` in server/.env
2. Update database credentials for production
3. Configure SMTP settings for email service
4. Build frontend: `cd client && npm run build`
5. Start server: `cd server && npm start`

### Environment Variables for Production
- Update JWT_SECRET with strong secret key
- Configure production database connection
- Set up production SMTP service
- Update CORS origins for production domains

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the test accounts and sample data

---

Built with ❤️ for real estate professionals
