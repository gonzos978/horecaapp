#!/bin/bash

# Smarter HoReCa AI Supreme v3.1 - Automated Installer
# This script automates the complete installation and deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║   SMARTER HORECA AI SUPREME v3.1 - INSTALLER            ║"
echo "║   Automated Installation & Deployment Script             ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Warning: Running as root. Consider using a non-root user.${NC}"
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check system requirements
echo -e "\n${YELLOW}[1/8] Checking system requirements...${NC}"

if ! command_exists docker; then
    print_error "Docker is not installed!"
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    print_status "Docker installed successfully"
else
    print_status "Docker is installed ($(docker --version))"
fi

if ! command_exists docker-compose; then
    print_error "Docker Compose is not installed!"
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "Docker Compose installed successfully"
else
    print_status "Docker Compose is installed ($(docker-compose --version))"
fi

if ! command_exists git; then
    print_error "Git is not installed!"
    sudo apt-get update && sudo apt-get install -y git
    print_status "Git installed successfully"
else
    print_status "Git is installed"
fi

if ! command_exists node; then
    print_error "Node.js is not installed!"
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "Node.js installed successfully"
else
    print_status "Node.js is installed ($(node --version))"
fi

# Check environment file
echo -e "\n${YELLOW}[2/8] Checking environment configuration...${NC}"

if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    echo "Creating .env file from template..."
    cat > .env << 'EOF'
VITE_SUPABASE_URL=https://txurvvaklklerkvgtiac.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR4dXJ2dmFrbGtsZXJrdmd0aWFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MzQ0MTksImV4cCI6MjA4MDQxMDQxOX0.NQ6cjN-zdSqt8Tvp7Vb9Lv-yxYH4An7b8Qg1tZpklno
EOF
    print_status ".env file created"
else
    print_status ".env file exists"
fi

# Install Node dependencies
echo -e "\n${YELLOW}[3/8] Installing dependencies...${NC}"
npm install
print_status "Node dependencies installed"

# Build the application
echo -e "\n${YELLOW}[4/8] Building application...${NC}"
npm run build
print_status "Application built successfully"

# Create Socket.io server directory
echo -e "\n${YELLOW}[5/8] Setting up Socket.io server...${NC}"
mkdir -p server

if [ ! -f "server/package.json" ]; then
    cat > server/package.json << 'EOF'
{
  "name": "smarter-horeca-socketio-server",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "node --watch index.js"
  },
  "dependencies": {
    "socket.io": "^4.7.2",
    "cors": "^2.8.5",
    "express": "^4.18.2"
  }
}
EOF
    print_status "Socket.io server package.json created"
fi

cd server
npm install
cd ..
print_status "Socket.io server dependencies installed"

# Stop existing containers
echo -e "\n${YELLOW}[6/8] Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true
print_status "Existing containers stopped"

# Build Docker images
echo -e "\n${YELLOW}[7/8] Building Docker images...${NC}"
docker-compose build --no-cache
print_status "Docker images built successfully"

# Start containers
echo -e "\n${YELLOW}[8/8] Starting containers...${NC}"
docker-compose up -d
print_status "Containers started successfully"

# Wait for services to be healthy
echo -e "\n${BLUE}Waiting for services to be ready...${NC}"
sleep 10

# Check container status
echo -e "\n${YELLOW}Container Status:${NC}"
docker-compose ps

# Display access information
echo -e "\n${GREEN}"
echo "╔══════════════════════════════════════════════════════════╗"
echo "║           🎉 INSTALLATION COMPLETED! 🎉                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

print_info "Web Application: http://localhost"
print_info "Socket.io Server: http://localhost:3001"
print_info ""
print_info "To view logs:"
echo "  docker-compose logs -f web"
echo "  docker-compose logs -f socketio"
print_info ""
print_info "To stop services:"
echo "  docker-compose down"
print_info ""
print_info "To restart services:"
echo "  docker-compose restart"

echo -e "\n${GREEN}✓ Smarter HoReCa AI Supreme v3.1 is now running!${NC}\n"

# Display system information
echo -e "${BLUE}System Information:${NC}"
echo "  Docker Version: $(docker --version)"
echo "  Docker Compose Version: $(docker-compose --version)"
echo "  Node.js Version: $(node --version)"
echo "  NPM Version: $(npm --version)"

# Health check
echo -e "\n${YELLOW}Performing health check...${NC}"
sleep 5

if curl -f http://localhost:80 > /dev/null 2>&1; then
    print_status "Web application is responding"
else
    print_error "Web application is not responding"
fi

if curl -f http://localhost:3001/health > /dev/null 2>&1; then
    print_status "Socket.io server is responding"
else
    print_error "Socket.io server is not responding (may take a few more seconds)"
fi

echo -e "\n${BLUE}Installation log saved to: install.log${NC}"
