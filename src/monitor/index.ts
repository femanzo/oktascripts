/**
 * This is a demonstration of error tracking using Sentry and DataDog
 */

import * as Sentry from "@sentry/bun";

Sentry.init({
    dsn: process.env.SENTRY_DSN,
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions
    release: "my-project-name@" + process.env.npm_package_version,
});

main()

function main() {
    try {
        throw new Error('This is a new error');
    } catch (e) {
        Sentry.captureException(e);
    }
}