const Sentry = require('@sentry/node');

function sentryInit() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
  });

  Sentry.configureScope((scope) => {
    scope.setTag('environment', process.env.NODE_ENV);
  });
}

function sentryCapture(err, extra) {
  if (extra.length > 0 || extra !== undefined) {
    Sentry.captureException(err, {
      extra: {
        response: JSON.stringify(extra),
      },
    });
  } else {
    Sentry.captureException(err);
  }
}

module.exports = { sentryInit, sentryCapture };
