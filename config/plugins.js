module.exports = {
  seo: {
    enabled: true,
  },
  "ai-text-generation": {
    enabled: true,
    config: {
      apiToken: process.env.OPEN_AI_API_TOKEN,
    },
  },
  //...
};
