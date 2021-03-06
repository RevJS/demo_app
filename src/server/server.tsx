
import * as path from 'path';

import * as Koa from 'koa';
import * as KoaRouter from 'koa-router';
import * as KoaMount from 'koa-mount';
import * as KoaServe from 'koa-static';
import * as KoaBody from 'koa-bodyparser';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BasePage } from './BasePage';

import { jsonLog } from 'koa-json-log';
import { config } from './config';
import { config as clientConfig } from '../client/config';

import { graphqlKoa, graphiqlKoa } from 'apollo-server-koa';
import { api, serverModels } from './models/api';
import { createData } from '../common/testdata';

const staticPath = path.join(__dirname, '..', '..', 'dist', 'static');

const app = new Koa();
const router = new KoaRouter();

app.use(jsonLog());
app.use(KoaMount('/static', KoaServe(staticPath)));
app.use(KoaBody());

const schema = api.getGraphQLSchema();
router.post('/api', graphqlKoa({ schema: schema }));
router.get('/api', graphqlKoa({ schema: schema }));
router.get('/graphiql', graphiqlKoa({ endpointURL: '/api' }));

router.get('/*', async (ctx) => {
    if (ctx.path.startsWith('/static')) {
        ctx.status = 404;
        return;
    }
    else {
        ctx.body = '<!DOCTYPE html>' + renderToStaticMarkup(
            <BasePage />
        );
    }
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(config.port);

console.log(`RevJS Demo App running at http://localhost:${config.port}${clientConfig.basePath}/`);
console.log(`Graphiql running at http://localhost:${config.port}/graphiql`);

createData(serverModels)
    .then(() => {
        console.log('Demo Data Loaded.');
    })
    .catch((e) => {
        console.error(e);
    });
