import routes from './routes';

const express = require('express');

const app = express();

app.use('/', routes);

export default app;
