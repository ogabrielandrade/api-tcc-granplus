const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/produtos', require('./src/routes/product.routes'))

module.exports = app;