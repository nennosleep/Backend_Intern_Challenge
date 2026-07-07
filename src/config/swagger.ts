import swaggerJSdoc from 'swagger-jsdoc';

const options: swaggerJSdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM Backend API',
      version: '1.0.0',
      description: 'API documentation',
    },
  },
  apis: ['./src/modules/**/*.route.js'],
};

export const swaggerSpec = swaggerJSdoc(options);
