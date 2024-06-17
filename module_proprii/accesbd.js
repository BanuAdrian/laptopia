/*

ATENTIE!
inca nu am implementat protectia contra SQL injection
*/

const { Client, Pool } = require("pg");

/**
 * Clasa Singleton pentru accesarea bazei de date
 *
 */
class AccesBD {
    static #instanta = null;
    static #initializat = false;

    /**
     * Constructor care va arunca o eroare daca clasa a fost deja instantiata
     */
    constructor() {
        if (AccesBD.#instanta) {
            throw new Error("Deja a fost instantiat");
        } else if (!AccesBD.#initializat) {
            throw new Error(
                "Trebuie apelat doar din getInstanta; fara sa fi aruncat vreo eroare"
            );
        }
    }

    /**
     * Initializează conexiunea locală la baza de date.
     */
    initLocal() {
        this.client = new Client({
            database: "cti_2024",
            user: "adrian",
            password: "adrian",
            host: "localhost",
            port: 5432,
        });
        this.client.connect();
    }

    /**
     * Returneaza clientul pentru baza de date
     *
     * @returns {Client} - clientul pentru baza de date
     * @throws {Error} - daca clasa nu a fost instantiata
     */
    getClient() {
        if (!AccesBD.#instanta) {
            throw new Error("Nu a fost instantiata clasa");
        }
        return this.client;
    }

    /**
     * @typedef {object} ObiectConexiune - obiect primit de functiile care realizeaza un query
     * @property {string} init - tipul de conexiune ("init", "render" etc.)
     * 
     * /

    /**
     * Returneaza instanta unica a clasei
     *
     * @param {ObiectConexiune} init - un obiect cu datele pentru query
     * @returns {AccesBD}
     */
    static getInstanta({ init = "local" } = {}) {
        // console.log(this); //this-ul e clasa nu instanta pt ca metoda statica
        if (!this.#instanta) {
            this.#initializat = true;
            this.#instanta = new AccesBD();

            //initializarea poate arunca erori
            //vom adauga aici cazurile de initializare
            //pentru baza de date cu care vrem sa lucram
            try {
                switch (init) {
                    case "local":
                        this.#instanta.initLocal();
                }
                //daca ajunge aici inseamna ca nu s-a produs eroare la initializare
            } catch (e) {
                console.error("Eroare la initializarea bazei de date!");
            }
        }
        return this.#instanta;
    }

    /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */

    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Selecteaza inregistrari din baza de date
     *
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    select(
        { tabel = "", campuri = [], conditiiAnd = [] } = {},
        callback,
        parametriQuery = []
    ) {
        let conditieWhere = "";
        let esteListaDeListe =
            Array.isArray(conditiiAnd) &&
            conditiiAnd.every((el) => Array.isArray(el));

        if (esteListaDeListe) {
            for (let i = 0; i < conditiiAnd.length; ++i) {
                conditiiAnd[i] = conditiiAnd[i].join(" and ");
            }
            if (conditiiAnd.length > 0)
                conditieWhere = `where ${conditiiAnd.join(" or ")}`;
        } else if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        }
        let comanda = `select ${campuri.join(
            ","
        )} from ${tabel} ${conditieWhere}`;
        console.error("Comanda select este: " + comanda);
        // console.log("Comanda select este: " + comanda);
        /*
        comanda=`select id, camp1, camp2 from tabel where camp1=$1 and camp2=$2;
        this.client.query(comanda,[val1, val2],callback)

        */
        this.client.query(comanda, parametriQuery, callback);
    }
    /**
     * @typedef {object} ObiectQuerySelect - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */

    /**
     * Selecteaza asincron inregistrari din baza de date
     *
     * @param {ObiectQuerySelect} obj - un obiect cu datele pentru query
     */
    async selectAsync({ tabel = "", campuri = [], conditiiAnd = [] } = {}) {
        let conditieWhere = "";
        let esteListaDeListe =
            Array.isArray(conditiiAnd) &&
            conditiiAnd.every((el) => Array.isArray(el));

        if (esteListaDeListe) {
            for (let i = 0; i < conditiiAnd.length; ++i) {
                conditiiAnd[i] = conditiiAnd[i].join(" and ");
            }
            if (conditiiAnd.length > 0)
                conditieWhere = `where ${conditiiAnd.join(" or ")}`;
        } else if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        }
        let comanda = `select ${campuri.join(
            ","
        )} from ${tabel} ${conditieWhere}`;
        console.error("selectAsync:", comanda);
        try {
            let rez = await this.client.query(comanda);
            // console.log("selectasync: ", rez);
            return rez;
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /**
     * @typedef {object} ObiectQueryInsert - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     */

    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Insereaza inregistrari in baza de date
     *
     * @param {ObiectQueryInsert} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    insert({ tabel = "", campuri = {} } = {}, callback) {
        /*
        campuri={
            nume:"savarina",
            pret: 10,
            calorii:500
        }
        */
        // console.log("-------------------------------------------");
        // console.log(Object.keys(campuri).join(","));
        // console.log(Object.values(campuri).join(","));
        let comanda = `insert into ${tabel}(${Object.keys(campuri).join(
            ","
        )}) values ( ${Object.values(campuri)
            .map((x) => `'${x}'`)
            .join(",")})`;
        // console.log(comanda);
        this.client.query(comanda, callback);
    }

    /**
     * @typedef {object} ObiectQueryUpdate - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */

    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Actualizeaza inregistrari din baza de date
     *
     * @param {ObiectQueryUpdate} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    update(
        { tabel = "", campuri = {}, conditiiAnd = [] } = {},
        callback,
        parametriQuery
    ) {
        let campuriActualizate = [];
        for (let prop in campuri)
            campuriActualizate.push(`${prop}='${campuri[prop]}'`);
        let conditieWhere = "";
        let esteListaDeListe =
            Array.isArray(conditiiAnd) &&
            conditiiAnd.every((el) => Array.isArray(el));

        if (esteListaDeListe) {
            for (let i = 0; i < conditiiAnd.length; ++i) {
                conditiiAnd[i] = conditiiAnd[i].join(" and ");
            }
            if (conditiiAnd.length > 0)
                conditieWhere = `where ${conditiiAnd.join(" or ")}`;
        } else if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        }
        let comanda = `update ${tabel} set ${campuriActualizate.join(
            ", "
        )}  ${conditieWhere}`;
        // console.log(comanda);
        this.client.query(comanda, callback);
    }

    /**
     * @typedef {object} ObiectQueryUpdate - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string []} valori - o lista de stringuri cu valorile campurilor
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */

    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Actualizeaza inregistrari din baza de date cu valori date separat
     *
     * @param {ObiectQueryUpdate} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    updateParametrizat(
        { tabel = "", campuri = [], valori = [], conditiiAnd = [] } = {},
        callback,
        parametriQuery
    ) {
        if (campuri.length != valori.length)
            throw new Error("Numarul de campuri difera de nr de valori");
        let campuriActualizate = [];
        for (let i = 0; i < campuri.length; i++)
            campuriActualizate.push(`${campuri[i]}=$${i + 1}`);
        let conditieWhere = "";
        let esteListaDeListe =
            Array.isArray(conditiiAnd) &&
            conditiiAnd.every((el) => Array.isArray(el));

        if (esteListaDeListe) {
            for (let i = 0; i < conditiiAnd.length; ++i) {
                conditiiAnd[i] = conditiiAnd[i].join(" and ");
            }
            if (conditiiAnd.length > 0)
                conditieWhere = `where ${conditiiAnd.join(" or ")}`;
        } else if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        }
        let comanda = `update ${tabel} set ${campuriActualizate.join(
            ", "
        )}  ${conditieWhere}`;
        // console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1111", comanda);
        this.client.query(comanda, valori, callback);
    }

    /**
     * @typedef {object} ObiectQueryDelete - obiect primit de functiile care realizeaza un query
     * @property {string} tabel - numele tabelului
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     */

    /**
     * callback pentru queryuri.
     * @callback QueryCallBack
     * @param {Error} err Eventuala eroare in urma queryului
     * @param {Object} rez Rezultatul query-ului
     */
    /**
     * Sterge inregistrari din baza de date
     *
     * @param {ObiectQueryDelete} obj - un obiect cu datele pentru query
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    delete({ tabel = "", conditiiAnd = [] } = {}, callback) {
        let conditieWhere = "";
        let esteListaDeListe =
            Array.isArray(conditiiAnd) &&
            conditiiAnd.every((el) => Array.isArray(el));

        if (esteListaDeListe) {
            for (let i = 0; i < conditiiAnd.length; ++i) {
                conditiiAnd[i] = conditiiAnd[i].join(" and ");
            }
            if (conditiiAnd.length > 0)
                conditieWhere = `where ${conditiiAnd.join(" or ")}`;
        } else if (conditiiAnd.length > 0) {
            conditieWhere = `where ${conditiiAnd.join(" and ")}`;
        }

        let comanda = `delete from ${tabel} ${conditieWhere}`;
        // console.log(comanda);
        this.client.query(comanda, callback);
    }

    /**
     * Apeleaza functia query a obiectului client
     *
     * @param {string} comanda - queryul de facut pe baza de date
     * @param {function} callback - o functie callback cu 2 parametri: eroare si rezultatul queryului
     */
    query(comanda, callback) {
        this.client.query(comanda, callback);
    }
}

module.exports = AccesBD;
