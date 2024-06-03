/**
 * String care contine toate caracterele alfanumerice
 * @type {string}
 */
let sirAlphaNum = "";

/**
 * Intervalele de coduri ASCII pentru cifre si litere
 * @type {number[][]}
 */
const v_intervale = [
    [48, 57], // cifre
    [65, 90], // litere mari
    [97, 122], // litere mici
];

/**
 * Construieste un sir de caractere alfanumerice
 */
for (let interval of v_intervale) {
    for (let i = interval[0]; i <= interval[1]; i++)
        sirAlphaNum += String.fromCharCode(i);
}

console.log(sirAlphaNum);

/**
 * Genereaza un token alfanumeric de lungime n
 *
 * @param {number} n - Lungimea token-ului de generat
 * @returns {string} - Token-ul generat
 */
function genereazaToken(n) {
    let token = "";
    for (let i = 0; i < n; i++) {
        token += sirAlphaNum[Math.floor(Math.random() * sirAlphaNum.length)];
    }
    return token;
}

module.exports.genereazaToken = genereazaToken;
