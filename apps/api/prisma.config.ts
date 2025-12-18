const config = {
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.DOCKER_DATABASE_URL,
    },
  },
};

export default config;
