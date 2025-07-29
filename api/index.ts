import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan"; //combinar con winston o pino para logs de servidor
import helmet from "helmet";
import cors from "cors";
// import routes from "./routes/routes";
import prisma from "./db/db";
import notFound from "./middlewares/notFound";
import Swagger from "swagger-jsdoc";
import SwaggerUi from "swagger-ui-express";
import swaggerConfig from "./swagger/swagger";

const server = express();
server.use(helmet());
server.use(express.json());
server.use(
    cors({
        origin: "http://localhost:3000", // cambiar por varible de entorno
        credentials: true,
    })
);
server.use(morgan("dev")); //configuración básica para desarrollo
server.use(cookieParser());

//configuración de swagger - documentación de end points
const docs = Swagger(swaggerConfig);
server.use("/swagger", SwaggerUi.serve, SwaggerUi.setup(docs));

// server.use("/api", routes);

// middleware de notFound
server.use(notFound);

async function startServer() {
    try {
        await prisma.$connect();
        console.log("✅ Conectado a la base de datos con Prisma");
    } catch (error) {
        await prisma.$disconnect();
        console.error("❌ Error conectando a la base de datos:", error);
    }

    server.listen(process.env.PORT, () => {
        console.log("Enviroment", process.env.NODE_ENV);
        console.log("Server listen", process.env.PORT);
        console.log("API version", process.env.npm_package_version);
    });
}

startServer();
