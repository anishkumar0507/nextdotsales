const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");

function readSheetsApiFromEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (!fs.existsSync(envPath)) return "";
  const text = fs.readFileSync(envPath, "utf8");
  const line = text.split(/\r?\n/).find(l => l.startsWith("REACT_APP_SHEETS_API="));
  if (!line) return "";
  return line.slice("REACT_APP_SHEETS_API=".length).trim();
}

// Manually forward a request to Google, following all redirects.
// http-proxy-middleware v3 dropped followRedirects, so we do it ourselves.
function proxyRequest(method, url, body, depth) {
  depth = depth || 0;
  return new Promise((resolve, reject) => {
    if (depth > 8) { reject(new Error("Too many redirects")); return; }

    let parsed;
    try { parsed = new URL(url); } catch (e) { reject(e); return; }

    const lib = parsed.protocol === "https:" ? https : http;
    const port = parsed.port
      ? parseInt(parsed.port)
      : parsed.protocol === "https:" ? 443 : 80;
    const bodyBuf = body ? Buffer.from(body, "utf8") : null;

    const opts = {
      hostname: parsed.hostname,
      port,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        ...(bodyBuf ? { "Content-Length": bodyBuf.length } : {}),
      },
    };

    const req = lib.request(opts, (res) => {
      const { statusCode, headers } = res;
      // Follow redirects
      if ([301, 302, 303, 307, 308].includes(statusCode) && headers.location) {
        const nextMethod = [307, 308].includes(statusCode) ? method : "GET";
        const nextBody  = nextMethod === "GET" ? null : body;
        resolve(proxyRequest(nextMethod, headers.location, nextBody, depth + 1));
        return;
      }
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end",  () => resolve({ status: statusCode, body: data }));
    });

    req.on("error", reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

module.exports = function setupProxy(app) {
  const rawApi = process.env.REACT_APP_SHEETS_API || readSheetsApiFromEnv();
  if (!rawApi || !rawApi.includes("script.google.com/macros/")) return;

  app.use("/__sheets_proxy__", (req, res) => {
    // CORS headers so the browser never blocks us
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") { res.writeHead(200); res.end(); return; }

    // Build the target URL (preserve query string for GET reads)
    const qs   = req.url && req.url !== "/" ? req.url : "";
    const target = rawApi + qs;

    function respond(promise) {
      promise
        .then(({ body: respBody }) => {
          res.setHeader("Content-Type", "application/json");
          res.end(respBody);
        })
        .catch(err => {
          res.writeHead(500);
          res.end(JSON.stringify({ ok: false, error: err.message }));
        });
    }

    if (req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk; });
      req.on("end",  () => respond(proxyRequest("POST", target, body)));
    } else {
      respond(proxyRequest("GET", target, null));
    }
  });
};
