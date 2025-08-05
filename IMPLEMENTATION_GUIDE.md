# Sign Request Grid Implementation Guide

## Overview

This document describes the implementation of the Sign Request Grid (UC01) feature for the Sign Order Management System. The feature allows users to display and filter existing sign orders with comprehensive search, pagination, and business rule enforcement.

## Architecture

### Frontend (React + TypeScript)
- **Component**: `SignRequestGridPage.tsx`
- **Route**: `/sign-requests`
- **Technology Stack**: React, Material-UI, React Query, TypeScript

### Backend (Node.js + Express)
- **Endpoint**: `GET /api/sign-requests`
- **Additional**: `GET /api/sign-requests/stats`
- **Technology Stack**: Node.js, Express, Sequelize, PostgreSQL

## Implementation Details

### 1. Frontend Component (`client/src/pages/SignRequestGridPage.tsx`)

**Key Features:**
- Material-UI DataGrid with server-side pagination
- Office dropdown filter (mandatory)
- Agent dropdown filter (optional, filtered by selected office)
- Global search across all columns (case-insensitive, partial matches)
- Column visibility controls
- Business rule enforcement for "Order" button visibility

**Columns:**
- Order ID (with chip styling)
- Address (concatenated from street, city, state, zip)
- Type (Installation/Removal/Repair with color coding)
- Order Date (formatted from createdAt)
- Completion Date (formatted)
- Actions (Order button for eligible orders)

**Business Rules:**
- Office selection is mandatory
- Agent filter is optional and filtered by selected office
- Order button appears only for:
  - Completed orders (have completion date)
  - Removal orders (regardless of completion status)

### 2. Backend API (`server/routes/signRequests.js`)

**Main Endpoint**: `GET /api/sign-requests`

**Query Parameters:**
- `officeId` (required): Filter by office
- `agentId` (optional): Filter by agent
- `search` (optional): Search across multiple fields
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 5)

**Business Rules:**
- **2-Year Rule**: Only returns orders with:
  - No installation date, OR
  - Installation date within the last 2 years
- **Office Required**: Returns 400 error if no office is provided

**Search Fields:**
- Order ID
- Street Address
- City, State, Zip Code
- Contact Name, Email
- Installation Type
- Property Type
- Status

**Response Format:**
```json
{
  "orders": [...],
  "total": 25,
  "page": 1,
  "limit": 5,
  "totalPages": 5
}
```

### 3. Database Schema

The implementation uses the existing `Order` model with these key fields:
- `id`, `orderId`
- `officeId`, `agentId` (foreign keys)
- `installationType` (INSTALLATION/REMOVAL/REPAIR)
- `streetAddress`, `city`, `state`, `zipCode`
- `createdAt` (used as Order Date)
- `completionDate`, `installationDate`
- Related models: `Office`, `User` (agents), `Vendor`

### 4. Navigation Integration

**Sidebar Component** (`client/src/components/Layout/Sidebar.tsx`):
- Added "Sign Requests" menu item with ViewList icon
- Route: `/sign-requests`
- Description: "View and filter sign orders"

**App Routing** (`client/src/App.tsx`):
- Added protected route for `/sign-requests`
- Integrated with existing authentication system

## Setup Instructions

### Prerequisites
- Node.js 16+
- PostgreSQL database
- npm or yarn

### Backend Setup

1. **Install Dependencies**
```bash
cd server
npm install
```

2. **Environment Configuration**
Create `.env` file in server directory:
```env
DB_NAME=sign_orders
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
NODE_ENV=development
JWT_SECRET=your_jwt_secret
```

3. **Database Setup**
```bash
# Run migrations (if available)
npm run migrate

# Seed sample data
npm run seed
```

4. **Start Server**
```bash
npm run dev
```

### Frontend Setup

1. **Install Dependencies**
```bash
cd client
npm install
```

2. **Start Development Server**
```bash
npm start
```

### Sample Data

The seed script (`server/scripts/seedSignRequestData.js`) creates:
- 4 sample offices (Downtown, Westside, Northside, Eastside)
- 8 sample agents (2 per office)
- 2 sample vendors
- 200+ sample orders with varied dates, statuses, and types
- Orders spanning 3+ years to test the 2-year filtering rule

## Testing

### Frontend Tests (`client/src/pages/__tests__/SignRequestGridPage.test.tsx`)

**Test Coverage:**
- Component rendering and UI elements
- Office/Agent dropdown population
- Search functionality
- Pagination handling
- Filter interactions
- Business rule enforcement (Order button visibility)
- Error handling
- API integration

**Run Tests:**
```bash
cd client
npm test
```

### Backend Tests (`server/tests/signRequests.test.js`)

**Test Coverage:**
- Office requirement validation
- Agent filtering
- 2-year rule enforcement
- Search functionality across multiple fields
- Pagination
- Business rule logic (canOrder flag)
- Related data inclusion (office, agent info)
- Error handling
- Statistics endpoint

**Run Tests:**
```bash
cd server
npm test
```

## API Endpoints

### GET /api/sign-requests
**Purpose**: Retrieve filtered sign requests with pagination

**Parameters:**
- `officeId` (required): Office ID
- `agentId` (optional): Agent ID
- `search` (optional): Search term
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response**: Paginated list of orders with related data

### GET /api/sign-requests/stats
**Purpose**: Get statistics for dashboard widgets

**Parameters:**
- `officeId` (required): Office ID
- `agentId` (optional): Agent ID

**Response**: Order counts and breakdowns

## Business Rules Implementation

### 1. 2-Year Rule
```javascript
const twoYearsAgo = moment().subtract(2, 'years').toDate();
whereClause[Op.or] = [
  { installationDate: null },
  { installationDate: { [Op.gte]: twoYearsAgo } }
];
```

### 2. Order Button Visibility
```javascript
const canOrder = orderData.completionDate || orderData.installationType === 'REMOVAL';
```

### 3. Office Requirement
```javascript
if (!officeId) {
  return res.status(400).json({ 
    message: 'Office selection is required',
    error: 'OFFICE_REQUIRED'
  });
}
```

## Performance Considerations

1. **Database Indexing**: Ensure indexes on:
   - `officeId`, `agentId`
   - `installationDate`, `createdAt`
   - `installationType`, `status`

2. **Query Optimization**:
   - Uses `distinct: true` for accurate pagination with joins
   - Limits included model attributes
   - Server-side pagination to handle large datasets

3. **Frontend Optimization**:
   - React Query for caching and background updates
   - Debounced search input
   - Memoized column definitions

## Security

- All endpoints protected with authentication middleware
- Input validation and sanitization
- SQL injection prevention through Sequelize ORM
- Role-based access control integration ready

## Future Enhancements

1. **Export Functionality**: Add CSV/Excel export
2. **Advanced Filters**: Date range, status filters
3. **Bulk Actions**: Multi-select operations
4. **Real-time Updates**: WebSocket integration
5. **Mobile Responsiveness**: Enhanced mobile layout
6. **Audit Trail**: Track user actions and changes

## Troubleshooting

### Common Issues

1. **Office dropdown empty**: Check `/api/lookups/offices` endpoint
2. **Agent dropdown not filtering**: Verify office selection triggers agent reload
3. **Search not working**: Confirm search parameter is being sent to API
4. **Pagination issues**: Check total count calculation in backend
5. **Order button not showing**: Verify business rule logic for completion date and removal type

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API responses in Network tab
3. Check server logs for backend errors
4. Confirm database connectivity and data
5. Validate authentication token

## Conclusion

The Sign Request Grid implementation provides a comprehensive solution for viewing and filtering sign orders with robust business rule enforcement, comprehensive testing, and scalable architecture. The feature integrates seamlessly with the existing system while providing excellent user experience and performance.