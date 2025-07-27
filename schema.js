const Joi = require("joi");

const listingSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required().min(0),
  image: Joi.string().allow("", null),
  price: Joi.number().required(),
  location: Joi.string().required(),
  country: Joi.string().required(),
}).required();

module.exports = listingSchema;
