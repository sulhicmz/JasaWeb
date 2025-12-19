const config = {
  adapter: {
    provider: 'postgres',
    url: process.env.DATABASE_URL,
  },
};

// Validate DATABASE_URL is provided
if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is required. Please check your .env configuration.'
  );
}

export default config;
