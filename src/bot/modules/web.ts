/* Leander is subject to the terms of the Mozilla Public License 2.0.
 * You can obtain a copy of MPL at LICENSE.md of repository root. */

import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import * as https from 'https';
import * as mime from 'mime-types';

class Web implements LNDRModule {
  public name = 'web';

  public acts = {
    getURL: (code): string => {
      let url = '';

      if (this.lndr.config.web.tls) {
        url += 'https://';
      } else {
        url += 'http://';
      }

      url += this.lndr.config.web.domain;

      if (this.lndr.config.web.port) {
        url += `:${this.lndr.config.web.port}`;
      }

      url += `/${code}`;

      return url;
    },
    register: (html, time = 3600000): string => {
      // Create random code
      let code;
      do {
        code = this.core.util.random();
      } while (this.routingTable[code]);
      code = code.toString(36).substring(0, 7);

      // Format and fill the template
      this.routingTable[code] = html;

      // Set timeout
      this.timingTable[code] = setTimeout(() => {
        this.erasePage(code);
      }, time);

      return code;
    },
    compose: (title, ...fields): string => {
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

      return this.core.util.format(this.contentTemplate, { title, style, body });
    },
  };

  public init = (core: AppCore, lndr: LNDRBase): Promise<void> => new Promise((resolve, reject) => {
    this.core = core;
    this.lndr = lndr;

    // Check is configured to use web
    let haveToExit = false;
    if (!lndr.config.web) {
      reject(new Error('web::init - 웹 서비스를 사용하도록 설정되지 않았습니다.'));
      haveToExit = true;
    } else if (!lndr.config.web.domain) {
      reject(new Error('web::init - 웹 서비스를 위한 도메인이 설정되지 않았습니다.'));
      haveToExit = true;
    }
    if (haveToExit) {
      return;
    }

    // Create Koa instance
    this.app = new Koa();
    this.router = new Router();

    // Load html files
    this.contentTemplate = fs.readFileSync(
      this.core.config.dir.res(['web', 'template.html']),
    ).toString();
    this.notFoundTemplate = fs.readFileSync(
      this.core.config.dir.res(['web', '404.html']),
    ).toString();

    // Config router
    this.router.get('/', (ctx) => {
      ctx.body = this.notFoundTemplate;
      ctx.status = 404;
      ctx.type = 'text/html';
    });
    this.router.get('/res/:file', (ctx) => {
      const { file } = ctx.params;
      const filePath = this.core.config.dir.res(['web', 'misc', file]);
      if (fs.existsSync(filePath)) {
        ctx.status = 200;
        ctx.type = mime.lookup(filePath) || 'text/plain';
        ctx.body = fs.createReadStream(filePath);
      } else {
        ctx.body = this.notFoundTemplate;
        ctx.type = 'text/html';
        ctx.status = 404;
      }
    });
    this.router.get('/:code', (ctx) => {
      const { code } = ctx.params;
      if (this.routingTable[code]) {
        ctx.body = this.routingTable[code];
        ctx.status = 200;
        ctx.type = 'text/html';
      } else {
        ctx.body = this.notFoundTemplate;
        ctx.status = 404;
        ctx.type = 'text/html';
      }
    });

    // Config Koa
    if (lndr.config.web.tls) {
      https.createServer(
        {
          key: fs.readFileSync(
            path.join('.', 'data', lndr.config.web.tls.key),
          ),
          cert: fs.readFileSync(
            path.join('.', 'data', lndr.config.web.tls.cert),
          ),
        },
        this.app.callback(),
      ).listen(lndr.config.web.port ? lndr.config.web.port : 443);

      if (!lndr.config.web.port || lndr.config.web.port === 443) {
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
      http.createServer(this.app.callback())
        .listen(lndr.config.web.port ? lndr.config.web.port : 80);
    }
    this.app.on('error', core.err.parse('Failed to process routing on Koa.'));
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    resolve();
  });

  private core: AppCore;

  private lndr: LNDRBase;

  private app: Koa;

  private router: Router;

  private routingTable: object;

  private timingTable: object;

  private contentTemplate: string;

  private notFoundTemplate: string;

  private erasePage = (code): void => {
    clearTimeout(this.timingTable[code]);
    delete this.timingTable[code];
    delete this.routingTable[code];
  };
}

export default Web;
