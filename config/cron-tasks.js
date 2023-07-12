const { default: axios } = require("axios");
const { parseString } = require("xml2js");
const slugify = (text) => {
  return text.toLowerCase().replace(/ /g, "-");
};
const get = (data, type) => {
  const res = data.filter((it) => it.Offering_Type === type);
  return res;
};
module.exports = {
  /**
   * Cron job with timezone example.
   * Every Monday at 1am for Asia/Dhaka timezone.
   * List of valid timezones: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List
   */

  myJob: {
    task: async ({ strapi }) => {
      console.log("task is running....");
      const response = await axios.get(
        "https://expert.propertyfinder.ae/feed/kns/privatesite/ef5baf9b94ef69775d282c15b19d22ab",
        {}
      );

      const xmlData = response.data;

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
            // createdAt: null,
            // updatedAt: null,
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
            publishedAt: new Date(),
          };

          newData.push(convertedItem);
        });

        return newData;
      };

      const convertedArray = await convertArray(parsedXml);
      console.log(convertedArray);

      // Filters the convertedArray on the behalf of offering types in array object property name is Offering_Type so categories bye ["RR","RS","CS"]

      await strapi.db.query("api::buy-property.buy-property").createMany({
        data: get(convertedArray, "RS"),
      });
      await strapi.db.query("api::rent-property.rent-property").createMany({
        data: get(convertedArray, "RR"),
      });
    },
    options: {
      rule: "10 * * * * *",
      tz: "Asia/Dhaka",
    },
  },
};
