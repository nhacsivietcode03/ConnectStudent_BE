const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Uni Connect API',
            version: '1.0.0',
            description: 'API documentation for Uni Connect (example)',
        },
        servers: [
            { url: 'http://localhost:9999/api', description: 'Local server' }
        ],
    },
    apis: ['./routes/*.js'], // nơi swagger đọc comment,
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
    security: [{ bearerAuth: [] }],
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
    // UI interactive
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
    // Raw JSON nếu frontend muốn lấy
    app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));
}



module.exports = setupSwagger;