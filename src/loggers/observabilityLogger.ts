import * as Sentry from "@sentry/node";

type ObservabilityMetadata = Record<string, unknown>;

const commonMetadata = {
    service: "journally-api",
    environment:
        process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
};

const withCommonMetadata = (metadata: ObservabilityMetadata = {}) => ({
    ...metadata,
    ...commonMetadata,
});

const observabilityLogger = {
    info(message: string, metadata?: ObservabilityMetadata) {
        Sentry.logger.info(message, withCommonMetadata(metadata));
    },

    warn(message: string, metadata?: ObservabilityMetadata) {
        Sentry.logger.warn(message, withCommonMetadata(metadata));
    },
};

export default observabilityLogger;
