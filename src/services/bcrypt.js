
const bcrypt = require('bcrypt');

async function passwordWithHash(user_senha) {
    const senhaHash = await bcrypt.hash(user_senha, 10);
    return senhaHash;
}

async function bcryptCompare(user_senha, senhaHash) {
    const verify = await bcrypt.compare(user_senha, senhaHash);
    return verify;
}

module.exports = { passwordWithHash, bcryptCompare };