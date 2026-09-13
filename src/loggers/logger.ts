import winston from "winston";

const isProduction = process.env.NODE_ENV === "production";
const isTest = process.env.NODE_ENV === "test";

const productionFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

const developmentFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(
        ({ timestamp, level, message, stack, ...metadata }) => {
            const details = Object.keys(metadata).length
                ? ` ${JSON.stringify(metadata)}`
                : "";
            return `${timestamp} ${level}: ${stack ?? message}${details}`;
        }
    )
);

const logger = winston.createLogger({
    level: isProduction ? "info" : "debug",
    silent: isTest,
    format: isProduction ? productionFormat : developmentFormat,
    defaultMeta: {
        service: "journally-api",
        environment:
            process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    },
    transports: [new winston.transports.Console()],
    exitOnError: false,
});

export default logger;
