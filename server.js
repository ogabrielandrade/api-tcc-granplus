const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const porta = process.env.PORT || 3333;

app.listen(porta, () => {
    console.log('API rodando na porta 3333')
});

app.get('/teste', (req, res) => {
    const agora = new Date().toLocaleString('pt-BR');
    res.status(200).json({
        sucesso: true,
        mensagem: 'Teste de rota GET',
        data: agora
    });
})