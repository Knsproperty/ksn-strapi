'use strict';

/**
 * off-plan service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::off-plan.off-plan');
