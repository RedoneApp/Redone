'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/3.0.0-beta.x/guides/controllers.html#core-controllers)
 * to customize this controller
 */

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

module.exports = {
  /**
   * Create a record.
   *
   * @return {Object}
   */

  async create(ctx) {
    let entity;
    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx);
      data.created_by = ctx.state.user.id;
      entity = await strapi.services.task.create(data, { files });
    } else {
      ctx.request.body.created_by = ctx.state.user.id;
      entity = await strapi.services.task.create(ctx.request.body);
    }
    return sanitizeEntity(entity, { model: strapi.models.task });
  },
  
};
