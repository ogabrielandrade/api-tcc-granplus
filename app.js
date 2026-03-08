const express = require("express");
const cors = require("cors");
const productRoutes = require("./src/routes/product.routes");
const stockRoutes = require("./src/routes/stock.routes");
const inputRoutes = require("./src/routes/input.routes");
const exitRoutes = require("./src/routes/exit.routes");
const userRoutes = require("./src/routes/user.routes");
const fornecedorRoutes = require("./src/routes/fornecedorRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");

const dataBase = require("./src/routes/database.routes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/produtos", productRoutes);
app.use("/estoque", stockRoutes);
app.use("/", inputRoutes);
app.use("/", exitRoutes);
app.use("/usuarios", userRoutes); // Rota para usuários
app.use("/fornecedores", fornecedorRoutes);
app.use("/categorias", categoriasRoutes);
app.use("/database", dataBase);

module.exports = app;
