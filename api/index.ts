import express from "express";
import morgan from "morgan"; //combinar con winston o pino para logs de servidor
import helmet from "helmet";
import cors from "cors";
import routes from "./routes/routes";
import notFound from "./middlewares/notFound";

const server = express();
server.use(helmet());
server.use(express.json());
server.use(cors()); //configuración wild card
server.use(morgan("dev")); //configuración básica para desarrollo

//configuración de swagger - documentación de end points

server.use("/api", routes);

// middleware de notFound
server.use(notFound);

function startServer() {
    server.listen(process.env.PORT, () => {
        console.log("Enviroment", process.env.NODE_ENV);
        console.log("Server listen", process.env.PORT);
        console.log("API version", process.env.npm_package_version);
    });
}

startServer();
