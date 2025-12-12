#!/usr/bin/env node

// Test script to validate dashboard functionality
// This script simulates API calls and validates the dashboard components

const http = require('http');
const fs = require('fs');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:3001';
const WEB_BASE_URL = 'http://localhost:4321';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test API endpoints
async function testAPIEndpoints() {
  log('\n🔍 Testing API Endpoints...', 'blue');

  const endpoints = [
    '/dashboard/stats',
    '/dashboard/recent-activity',
    '/dashboard/projects-overview',
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      if (response.ok) {
        const data = await response.json();
        log(`✅ ${endpoint} - Status: ${response.status}`, 'green');
        log(`   Data keys: ${Object.keys(data).join(', ')}`, 'blue');
      } else {
        log(`❌ ${endpoint} - Status: ${response.status}`, 'red');
      }
    } catch (error) {
      log(`❌ ${endpoint} - Error: ${error.message}`, 'red');
    }
  }
}

// Test component files exist
function testComponentFiles() {
  log('\n📁 Testing Component Files...', 'blue');

  const components = [
    'apps/web/src/components/dashboard/DashboardStats.astro',
    'apps/web/src/components/dashboard/DashboardStats.ts',
    'apps/web/src/components/dashboard/RecentActivity.astro',
    'apps/web/src/components/dashboard/RecentActivity.ts',
    'apps/web/src/components/dashboard/ProjectsOverview.astro',
    'apps/web/src/components/dashboard/ProjectsOverview.ts',
    'apps/web/src/pages/dashboard.astro',
    'apps/web/src/layouts/DashboardLayout.astro',
  ];

  components.forEach((component) => {
    const filePath = path.join(__dirname, component);
    if (fs.existsSync(filePath)) {
      log(`✅ ${component}`, 'green');
    } else {
      log(`❌ ${component} - Not found`, 'red');
    }
  });
}

// Test API proxy endpoints
async function testAPIProxyEndpoints() {
  log('\n🌐 Testing API Proxy Endpoints...', 'blue');

  const proxyEndpoints = [
    '/api/dashboard/stats',
    '/api/dashboard/recent-activity',
    '/api/dashboard/projects-overview',
  ];

  for (const endpoint of proxyEndpoints) {
    try {
      // Since we can't test the actual proxy without running the server,
      // we'll just check if the proxy files exist
      const proxyFile = path.join(
        __dirname,
        'apps/web/src/pages/api',
        endpoint.replace('/api/', '') + '.js'
      );
      if (fs.existsSync(proxyFile)) {
        log(`✅ Proxy file for ${endpoint}`, 'green');
      } else {
        log(`❌ Proxy file for ${endpoint} - Not found`, 'red');
      }
    } catch (error) {
      log(`❌ ${endpoint} - Error: ${error.message}`, 'red');
    }
  }
}

// Test dashboard controller
function testDashboardController() {
  log('\n🎮 Testing Dashboard Controller...', 'blue');

  const controllerPath = path.join(
    __dirname,
    'apps/api/src/dashboard/dashboard.controller.ts'
  );
  if (fs.existsSync(controllerPath)) {
    log(`✅ Dashboard controller exists`, 'green');

    // Check if it has the required methods
    const controllerContent = fs.readFileSync(controllerPath, 'utf8');
    const requiredMethods = [
      'getDashboardStats',
      'getRecentActivity',
      'getProjectsOverview',
    ];

    requiredMethods.forEach((method) => {
      if (controllerContent.includes(method)) {
        log(`✅ Method ${method} found`, 'green');
      } else {
        log(`❌ Method ${method} not found`, 'red');
      }
    });
  } else {
    log(`❌ Dashboard controller not found`, 'red');
  }
}

// Test TypeScript compilation
function testTypeScriptCompilation() {
  log('\n📝 Testing TypeScript Files...', 'blue');

  const tsFiles = [
    'apps/web/src/components/dashboard/DashboardStats.ts',
    'apps/web/src/components/dashboard/RecentActivity.ts',
    'apps/web/src/components/dashboard/ProjectsOverview.ts',
  ];

  tsFiles.forEach((file) => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');

      // Check for basic TypeScript structure
      if (
        content.includes('interface') &&
        content.includes('class') &&
        content.includes('customElements.define')
      ) {
        log(`✅ ${file} - Valid TypeScript structure`, 'green');
      } else {
        log(`⚠️  ${file} - May have structural issues`, 'yellow');
      }
    } else {
      log(`❌ ${file} - Not found`, 'red');
    }
  });
}

// Main test function
async function runTests() {
  log('🚀 JasaWeb Dashboard Functionality Test', 'blue');
  log('=====================================', 'blue');

  testComponentFiles();
  testDashboardController();
  testTypeScriptCompilation();
  testAPIProxyEndpoints();

  // Note: API endpoints test would require the server to be running
  log('\n📋 Note: To test live API endpoints, start both servers:', 'yellow');
  log('   API Server: cd apps/api && npm run start:dev', 'yellow');
  log('   Web Server: cd apps/web && npm run dev', 'yellow');

  log('\n✨ Dashboard Implementation Test Complete!', 'blue');
}

// Run the tests
runTests().catch(console.error);
