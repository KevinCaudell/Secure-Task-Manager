const crypto = require("crypto");

function hashPassword(password){
    const salt = crypto.randomBytes(16).toString("hex");
    const hashed = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString("hex");
    return { salt, hashed };
};

function verifyPassword(password, salt, hashedPassword){
    const hashToCompare = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString("hex");
    return hashToCompare === hashedPassword;
};