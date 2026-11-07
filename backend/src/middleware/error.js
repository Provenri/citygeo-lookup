export function errorHandler(err, req, res, next) {
  console.error(err);
  const status = Number.isInteger(err.status) ? err.status : 500;
  const message = status >= 500
    ? 'The service could not complete the request'
    : err.message || 'Request failed';
  res.status(status).json({ error: message });
}
