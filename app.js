const express       = require('express');
const cors          = require('cors');
const productRoutes = require('./src/routes/product.routes');
const stockRoutes   = require('./src/routes/stock.routes');
const inputRoutes   = require('./src/routes/input.routes');
const exitRoutes    = require('./src/routes/exit.routes');
const authRoutes    = require('./src/routes/auth.routes')

const app = express();

app.use(cors());
app.use(express.json());

app.use('/produtos', productRoutes);
app.use('/estoque', stockRoutes);
app.use('/', inputRoutes);
app.use('/', exitRoutes);

app.use("/", authRoutes);

app.use('/database', require('./src/routes/database.routes'));

module.exports = app;