import * as Sentry from "@sentry/node";
import AppError from "../errors/AppError";

const configuredSampleRate = Number(process.env.SENTRY_TRACES_SAMPLE_RATE);
const tracesSampleRate = Number.isFinite(configuredSampleRate)
    ? configuredSampleRate
    : 0.1;

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: Boolean(process.env.SENTRY_DSN) && process.env.NODE_ENV !== "test",
    environment:
        process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
    // release: process.env.VERCEL_GIT_COMMIT_SHA,
    sendDefaultPii: false,
    tracesSampleRate,
});

export function setupSentryErrorHandler(
    app: Parameters<typeof Sentry.setupExpressErrorHandler>[0]
) {
    Sentry.setupExpressErrorHandler(app, {
        shouldHandleError: (error) => !(error instanceof AppError),
    });
}
