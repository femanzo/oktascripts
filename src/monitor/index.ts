/**
 * This is a demonstration of error tracking using Sentry and DataDog
 */

import * as Sentry from "@sentry/bun";

Sentry.init({
    dsn: "https://107b491825f1ccdda4843b6aba2872ac@o4506776027004928.ingest.sentry.io/4506776028446720",
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions
});

try {
    throw new Error('Sentry Bun test');
} catch (e) {
    Sentry.captureException(e);
}