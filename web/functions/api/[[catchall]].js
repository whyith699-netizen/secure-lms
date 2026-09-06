export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = new URL(url.pathname + url.search, 'https://robust-competing-andrew-contributors.trycloudflare.com');
  const headers = new Headers(context.request.headers);
  headers.set('host', targetUrl.host);
  const newReq = new Request(targetUrl.toString(), {
    method: context.request.method,
    headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? null : context.request.body,
    redirect: 'follow'
  });
  return fetch(newReq);
}
