/**
 @typedef Drepturi
 @type {Object}
 @property {Symbol} vizualizareUtilizatori Dreptul de a intra pe pagina cu tabelul de utilizatori.
 @property {Symbol} stergereUtilizatori Dreptul de a sterge un utilizator.
 @property {Symbol} cumparareProduse Dreptul de a cumpara.
 @property {Symbol} vizualizareGrafice Dreptul de a vizualiza graficele de vanzari.
 @property {Symbol} adaugareProduse Dreptul de a adauga produse.
 @property {Symbol} modificareProduse Dreptul de a modifica produse.
 @property {Symbol} vizualizareComenzi Dreptul de a vizualiza comenzile.
 */

/**
 * @name module.exports.Drepturi
 * @type Drepturi
 */
const Drepturi = {
    vizualizareUtilizatori: Symbol("vizualizareUtilizatori"),
    stergereUtilizatori: Symbol("stergereUtilizatori"),
    cumparareProduse: Symbol("cumparareProduse"),
    vizualizareGrafice: Symbol("vizualizareGrafice"),
    adaugareProduse: Symbol("adaugareProduse"),
    modificareProduse: Symbol("modificareProduse"),
    vizualizareComenzi: Symbol("vizualizareComenzi"),
};

module.exports = Drepturi;
