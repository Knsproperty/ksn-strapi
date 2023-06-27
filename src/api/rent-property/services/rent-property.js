'use strict';

/**
 * rent-property service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::rent-property.rent-property');
