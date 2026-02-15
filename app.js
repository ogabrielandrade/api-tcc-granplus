const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/teste', require('./src/routes/produto.routes'))

module.exports = app;