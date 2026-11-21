import dotenv from 'dotenv';
import path from 'path';

// Load test environment variables. .env is the documented local file.
dotenv.config({
  path: path.join(__dirname, '..', '.env')
});
dotenv.config({
  path: path.join(__dirname, '..', '.env.local')
});

// Set NODE_ENV to test
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

const testHelpers = {
  createTestUser: async () => {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    };
  },
  cleanupTestData: async () => {
    console.log('Cleaning up test data...');
  }
};

// Setup and teardown hooks
beforeAll(async () => {
  console.log('🧪 Setting up test environment...');
});

afterAll(async () => {
  console.log('🧹 Cleaning up test environment...');
  await testHelpers.cleanupTestData();
});
