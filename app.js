const express          = require("express");
const cors             = require("cors");
const productRoutes    = require("./src/routes/product.routes");
const stockRoutes      = require("./src/routes/stock.routes");
const inputRoutes      = require("./src/routes/input.routes");
const exitRoutes       = require("./src/routes/exit.routes");
const userRoutes       = require("./src/routes/user.routes");
const fornecedorRoutes = require("./src/routes/fornecedorRoutes");
const categoriasRoutes = require("./src/routes/categoriasRoutes");
const relatorios       = require("./src/routes/report.routes");

const dataBase         = require("./src/routes/database.routes");

const app              = express();

app.use(cors());
app.use(express.json());

app.use("/produtos", productRoutes); // Rota de Produtos
app.use("/estoque", stockRoutes); // Rota de estoque
app.use("/entradas", inputRoutes); // Rota de entradas
app.use("/saidas", exitRoutes); // Rota de saídas
app.use("/usuarios", userRoutes); // Rota para usuários
app.use("/fornecedores", fornecedorRoutes); // Rota de fornecedores
app.use("/categorias", categoriasRoutes); // Rota de categorias
app.use("/relatorios", relatorios);
app.use("/database", dataBase);

module.exports = app;
