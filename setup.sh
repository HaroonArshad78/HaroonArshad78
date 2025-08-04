#!/bin/bash

echo "🏗️  Sign Order Management System Setup"
echo "======================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16 or higher."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL v12 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server && npm install

# Install client dependencies
echo "📦 Installing client dependencies..."
cd ../client && npm install && cd ..

# Setup environment file
if [ ! -f "server/.env" ]; then
    echo "📝 Setting up environment file..."
    cp server/.env.example server/.env
    echo "⚠️  Please update server/.env with your database credentials and email settings"
else
    echo "✅ Environment file already exists"
fi

# Create uploads directory
mkdir -p server/uploads/reports

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Update server/.env with your database credentials"
echo "2. Create PostgreSQL database: createdb sign_orders"
echo "3. Run database seeding: cd server && node scripts/seed.js"
echo "4. Start the application: npm run dev"
echo ""
echo "📖 For detailed instructions, see README.md"