import app from '../server/index.js';

export default function handler(req, res) {
  const requestUrl = new URL(req.url, 'http://localhost');
  const forwardedPath = requestUrl.searchParams.get('path');

  if (forwardedPath !== null) {
    requestUrl.searchParams.delete('path');
    const query = requestUrl.searchParams.toString();
    req.url = `/api/${forwardedPath}${query ? `?${query}` : ''}`;
  }

  return app(req, res);
}
