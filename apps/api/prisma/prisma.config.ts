const config = {
  adapter: {
    provider: 'postgres',
    url:
      process.env.DATABASE_URL ||
      'postgresql://postgres:password@localhost:5432/jasaweb?schema=public',
  },
};

export default config;
