const swaggerConfig = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Journally App - API",
            version: "1.0.0",
            description:
                "Documentación de la API REST de Journally para usuarios, posts y colecciones.",
        },
        servers: [
            {
                url: `http://${process.env.SERVER}:${process.env.PORT}/`,
                description: "Local server",
            },
        ],
    },
    apis: [`./api/swagger/*.ts`],
};

export default swaggerConfig;
