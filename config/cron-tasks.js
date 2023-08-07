const { default: axios } = require("axios");
const { parseString } = require("xml2js");
const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

module.exports = {
  myJob: {
    task: async ({ strapi }) => {
      console.log("Task is running....");

      // Fetch XML data from the source
      const response = await axios.get(
        "https://expert.propertyfinder.ae/feed/kns/privatesite/ef5baf9b94ef69775d282c15b19d22ab"
      );
      const xmlData = response.data;

      // Parse XML data to JSON
      const parsedData = await new Promise((resolve, reject) => {
        parseString(xmlData, (err, results) => {
          if (err) {
            console.error("Error parsing XML:", err);
            reject(err);
          } else {
            const jsonData = JSON.stringify(results);
            resolve(jsonData);
          }
        });
      });

      const parsedXml = await JSON.parse(parsedData).list.property;

      const convertArray = async (inputArray) => {
        const newData = [];

        inputArray.forEach((item, index) => {
          const convertedItem = {
            Offering_Type: item.offering_type ? item.offering_type[0] : null,
            Street: item.title_en ? item.reference_number[0] : null,
            Rooms: item.bedroom ? parseInt(item.bedroom[0]) : 2,
            Short_Address: item.title_en ? item.title_en[0] : null,
            Price: item.price ? parseInt(item.price[0]) : null,
            Description: item.description_en ? item.description_en[0] : null,
            PricePerSqFt: 22,
            ReraNumber: 2,
            ReferenceNumber: item.reference_number
              ? item.reference_number[0]
              : null,
            AgentBRN: item.agent
              ? item.agent[0].license_no
                ? parseInt(item.agent[0].license_no[0])
                : null
              : null,
            Bedrooms: item.bedroom ? parseInt(item.bedroom[0]) : 2,
            Bathrooms: item.bathroom ? parseInt(item.bathroom[0]) : 2,
            Area: item.size ? parseInt(item.size[0]) : null,
            Property_Type: item.property_type ? item.property_type[0] : null,
            Location: item.city ? item.city[0] : null,
            Name: item.title_en ? item.title_en[0] : null,
            slug: item.title_en ? slugify(item.title_en[0]) : null,
            Exclusive: false,
            Parking: item.parking ? parseInt(item.parking[0]) : null,
            Community: item.community ? item.community[0] : null,
            Sub_Community: item.sub_community ? item.sub_community[0] : null,
            Furnished: item.furnished ? item.furnished[0] : "No",
            Geopoints: item.geopoints ? item.geopoints[0] : null,
            Cron_Images: {
              data: item.photo
                ? item.photo[0].url.map((photo) => ({
                    url: photo._ ? photo._ : null,
                  }))
                : [],
            },
            Completed: item.completion_status
              ? item.completion_status[0]
              : "completed",
            publishedAt: new Date(),
          };

          newData.push(convertedItem);
        });

        return newData;
      };

      const convertedArray = await convertArray(parsedXml);
      console.log("Converted Array:", convertedArray);

      // Fetch existing data from the database
      const existingData = {
        RS: await strapi.db
          .query("api::buy-property.buy-property")
          .findMany({ Offering_Type: "RS" }),
        RR: await strapi.db
          .query("api::rent-property.rent-property")
          .findMany({ Offering_Type: "RR" }),
        OF: await strapi.db.query("api::off-plan.off-plan").findMany({
          Completed: "off plan",
        }),
      };

      // Compare existing data with new data
      const newData = {
        RS: [],
        RR: [],
        OF: [],
      };

      convertedArray.forEach((item) => {
        if (item.Completed === "completed") {
          if (item.Offering_Type === "RS" || item.Offering_Type === "CS") {
            const existingItem = existingData.RS.find(
              (existing) => existing.ReferenceNumber === item.ReferenceNumber
            );
            if (!existingItem) {
              newData.RS.push(item);
            }
          } else if (item.Offering_Type === "RR") {
            const existingItem = existingData.RR.find(
              (existing) => existing.ReferenceNumber === item.ReferenceNumber
            );
            if (!existingItem) {
              newData.RR.push(item);
            }
          }
        } else {
          // Check for existing off-plan item with the same slug
          const existingOffPlanItem = existingData.OF.find(
            (existing) => existing.ReferenceNumber === item.ReferenceNumber
          );

          if (!existingOffPlanItem) {
            newData.OF.push(item);
          }
        }
      });

      // Remove deleted data from the database
      existingData.RS.forEach(async (existing) => {
        const found = convertedArray.find(
          (item) => item.ReferenceNumber === existing.ReferenceNumber
        );
        if (!found) {
          await strapi.db.query("api::buy-property.buy-property").deleteMany({
            where: {
              id: existing.id,
            },
          });
        }
      });

      existingData.RR.forEach(async (existing) => {
        const found = convertedArray.find(
          (item) => item.ReferenceNumber === existing.ReferenceNumber
        );
        if (!found) {
          await strapi.db.query("api::rent-property.rent-property").delete({
            where: {
              id: existing.id,
            },
          });
        }
      });

      existingData.OF.forEach(async (existing) => {
        const found = convertedArray.find(
          (item) => item.ReferenceNumber === existing.ReferenceNumber
        );
        if (!found) {
          await strapi.db
            .query("api::offplan-property.offplan-property")
            .delete({
              where: {
                id: existing.id,
              },
            });
        }
      });

      // Add new data to the database
      if (newData.RS.length > 0) {
        await strapi.db
          .query("api::buy-property.buy-property")
          .createMany({ data: newData.RS });
        console.log("New RS data added:", newData.RS);
      }

      if (newData.RR.length > 0) {
        await strapi.db
          .query("api::rent-property.rent-property")
          .createMany({ data: newData.RR });
        console.log("New RR data added:", newData.RR);
      }

      if (newData.OF.length > 0) {
        await strapi.db
          .query("api::off-plan.off-plan")
          .createMany({ data: newData.OF });
        console.log("New OF data added:", newData.OF);
      }
    },
    options: {
      rule: "* 1 * * * *",
      tz: "Asia/Dhaka",
    },
  },
};
