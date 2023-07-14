module.exports = {
  "fuzzy-search": {
    enabled: true,
    config: {
      contentTypes: [
        {
          uid: "api::buy-property.buy-property",
          modelName: "buy-property",
          transliterate: true,
          fuzzysortOptions: {
            characterLimit: 300,
            threshold: -600,
            limit: 10,
            keys: [
              {
                name: "Name",
                weight: 100,
              },
              {
                name: "Community",
                weight: 100,
              },
              {
                name: "Sub_Community",
                weight: 100,
              },
              {
                name: "Description",
                weight: -100,
              },
            ],
          },
        },
        {
          uid: "api::rent-property.rent-property",
          modelName: "rent-property",
          fuzzysortOptions: {
            characterLimit: 500,
            keys: [
              {
                name: "Name",
                weight: 100,
              },
              {
                name: "Community",
                weight: 100,
              },
              {
                name: "Sub_Community",
                weight: 100,
              },
              {
                name: "Description",
                weight: -100,
              },
            ],
          },
        },
      ],
    },
  },
  seo: {
    enabled: true,
  },
  "ai-text-generation": {
    enabled: true,
    config: {
      apiToken: process.env.OPEN_AI_API_TOKEN,
    },
  },
  upload: {
    config: {
      provider: "cloudinary",
      providerOptions: {
        cloud_name: process.env.CLOUDINARY_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET,
      },
      actionOptions: {
        upload: {},
        delete: {},
      },
    },
  },
  //...
};
