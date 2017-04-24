import routes from './routes';

const express = require('express');
const lusca = require('lusca');
const bodyParser = require('body-parser');
const cors = require('cors');


const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.disable('etag');
app.use(cors());
app.use('/', routes);

export default app;
