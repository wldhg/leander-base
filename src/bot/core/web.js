import Koa from 'koa';
import Router from 'koa-router';
import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import mime from 'mime-types';

const app = new Koa();
const router = new Router();
const routingTable = {};
const timingTable = {};

let template;
let notFound;

let kernel;
let lndr;

export const getURL = (code) => {
  let url = '';

  if (lndr.domain.tls) {
    url += 'https://';
  } else {
    url += 'http://';
  }

  url += lndr.domain.name;

  if (lndr.domain.port) {
    url += `:${lndr.domain.port}`;
  }

  url += `/${code}`;

  return url;
};

export const erasePage = (code) => {
  clearTimeout(timingTable[code]);
  delete timingTable[code];
  delete routingTable[code];
};

export const registerPage = (html, time = 3600000) => {
  // Create random code
  let code;
  do {
    code = kernel.util.random();
  } while (routingTable[code]);
  code = code.toString(36);

  // Format and fill the template
  routingTable[code] = html;

  // Set timeout
  timingTable[code] = setTimeout(() => {
    erasePage(code);
  }, time);

  return code;
};

export const composeHTML = (title, ...fields) => {
  let body = '';
  let style = '';

  fields.forEach((field) => {
    body += '<div>';
    switch (field.type) {
      default:
      case 'text': {
        body += `<p>${field.data}</p>`;
        break;
      }

      case 'table': {
        // Start table
        body += '<table>';

        // Add label <th>s
        if (field.data.label) {
          let trh = '';
          field.data.label.forEach((label) => {
            trh += `<th>${label}</th>`;
          });
          body += `<tr>${trh}</tr>`;
        }

        // Add data <td>s
        field.data.content.forEach((data) => {
          let tr = '';
          data.forEach((col) => {
            tr += `<td>${col}</td>`;
          });
          body += `<tr>${tr}</tr>`;
        });

        // Close table
        body += '</table>';
        break;
      }

      case 'padding': {
        body += `<div style="padding-top: ${field.data}"></div>`;
        break;
      }

      case 'style': {
        style += field.data;
        break;
      }
    }
    body += '</div>';
  });

  return kernel.util.format(template, { title, style, body });
};

export const init = (_kernel, _lndr) => {
  kernel = _kernel;
  lndr = _lndr;

  // Load html files
  template = fs.readFileSync(
    path.join(
      kernel.config.dir.baseR,
      'template.html',
    ),
  ).toString();
  notFound = fs.readFileSync(
    path.join(
      kernel.config.dir.baseR,
      '404.html',
    ),
  ).toString();

  // Config router
  router.get('/', (ctx) => {
    ctx.body = notFound;
    ctx.status = 404;
    ctx.type = 'text/html';
  });
  router.get('/res/:file', (ctx) => {
    const { file } = ctx.params;
    const filePath = path.join(
      kernel.config.dir.baseR,
      file,
    );
    if (fs.existsSync(filePath)) {
      ctx.status = 200;
      ctx.type = mime.lookup(filePath) || 'text/plain';
      ctx.body = fs.createReadStream(filePath);
    } else {
      ctx.body = notFound;
      ctx.type = 'text/html';
      ctx.status = 404;
    }
  });
  router.get('/:code', (ctx) => {
    const { code } = ctx.params;
    if (routingTable[code]) {
      ctx.body = routingTable[code];
      ctx.status = 200;
      ctx.type = 'text/html';
    } else {
      ctx.body = notFound;
      ctx.status = 404;
      ctx.type = 'text/html';
    }
  });

  // Config Koa
  if (lndr.domain.tls) {
    https.createServer(
      {
        key: fs.readFileSync(
          path.join('.', 'data', lndr.domain.tls.key),
        ),
        cert: fs.readFileSync(
          path.join('.', 'data', lndr.domain.tls.cert),
        ),
      },
      app.callback(),
    ).listen(lndr.domain.port ? lndr.domain.port : 443);

    if (!lndr.domain.port || lndr.domain.port === 443) {
      const redirectApp = new Koa();
      const redirectRouter = new Router();
      redirectRouter.all(':', (ctx) => {
        ctx.status = 301;
        ctx.redirect(ctx.originalUrl.replace('http:', 'https:'));
      });
      redirectApp.use(redirectRouter.routes());
      http.createServer(redirectApp.callback())
        .listen(80);
    }
  } else {
    http.createServer(app.callback())
      .listen(lndr.domain.port ? lndr.domain.port : 80);
  }
  app.on('error', kernel.err.parse('Failed to process routing on Koa.'));
  app.use(router.routes());
  app.use(router.allowedMethods());

  // Export functions
  lndr.registerWebPage = registerPage;
  lndr.getWebPageURL = getURL;
  lndr.composeHTML = composeHTML;

  return lndr;
};
