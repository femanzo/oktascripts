/**
 * This is a demonstration of error tracking using Sentry and DataDog
 */

import * as Sentry from "@sentry/bun";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    release: "oktascripts@" + process.env.npm_package_version,
    integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.OnUncaughtException(),
        new Sentry.Integrations.OnUnhandledRejection()
    ]
});

main()

function main() {
    try {
        throw new Error('This is a new error 2');
    } catch (e) {
        Sentry.captureException(e);
    }
}