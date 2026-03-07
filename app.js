const express = require('express');
const cors = require('cors');
const userRoutes = require('./src/routes/user.routes');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/produtos', require('./src/routes/product.routes'));
app.use('/database', require('./src/routes/database.routes'));
app.use('/usuarios', userRoutes); // Rota para usuários

module.exports = app;