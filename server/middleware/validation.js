const Joi = require('joi');

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        message: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }
    next();
  };
};

// Validation schemas
const orderSchema = Joi.object({
  officeId: Joi.number().required(),
  agentId: Joi.number().required(),
  installationType: Joi.string().valid('INSTALLATION', 'REMOVAL', 'REPAIR').required(),
  propertyType: Joi.string().required(),
  streetAddress: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
  contactName: Joi.string().allow(''),
  contactPhone: Joi.string().pattern(/^\(\d{3}\) \d{3}-\d{4}$/).allow(''),
  contactEmail: Joi.string().email().allow(''),
  listingDate: Joi.date().allow(null),
  expirationDate: Joi.date().allow(null),
  installationDate: Joi.date().allow(null),
  directions: Joi.string().allow(''),
  additionalInfo: Joi.string().allow(''),
  underwaterSprinkler: Joi.boolean(),
  invisibleDogFence: Joi.boolean()
});

const reorderSchema = Joi.object({
  originalOrderId: Joi.number().required(),
  installationType: Joi.string().valid('INSTALLATION', 'REMOVAL', 'REPAIR').required(),
  zipCode: Joi.string().pattern(/^\d{5}(-\d{4})?$/).required(),
  additionalInfo: Joi.string().allow(''),
  listingAgentId: Joi.number().required()
});

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  role: Joi.string().valid('IT_ADMIN', 'SIGN_ADMIN', 'AGENT', 'ADMIN_AGENT'),
  officeId: Joi.number().allow(null)
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const ccEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  officeId: Joi.number().required(),
  agentId: Joi.number().allow(null)
});

const officeSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().allow(''),
  phone: Joi.string().allow(''),
  email: Joi.string().email().allow(''),
  managerEmail: Joi.string().email().allow('')
});

const vendorSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow(''),
  address: Joi.string().allow(''),
  serviceAreas: Joi.array().items(Joi.string())
});

module.exports = {
  validate,
  orderSchema,
  reorderSchema,
  userSchema,
  loginSchema,
  ccEmailSchema,
  officeSchema,
  vendorSchema
};