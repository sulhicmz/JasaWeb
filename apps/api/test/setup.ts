module.exports = async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/jasaweb_test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key';
  process.env.EMAIL_HOST = 'localhost';
  process.env.EMAIL_PORT = '1025';
  process.env.AWS_S3_BUCKET = 'test-bucket';
  process.env.AWS_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'test-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';

  // Add any other global test setup here
  console.log('Test environment setup completed');
};