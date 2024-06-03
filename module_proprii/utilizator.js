const AccesBD = require("./accesbd.js");
const parole = require("./parole.js");
const { RolFactory } = require("./roluri.js");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * Clasa pentru utilizatori
 */
class Utilizator {
    static tipConexiune = "local";
    static tabel = "utilizatori";
    static parolaCriptare = "tehniciweb";
    static emailServer = "tw.test444@gmail.com";
    static lungimeCod = 64;
    static numeDomeniu = "localhost:8080";
    #eroare;

    /**
     * @typedef {object} ObiectUtilizator - un obiect ale carui proprietati au aceleasi nume cu cele ale instantelor clasei Utilizator
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     * @property {number} id - ID-ul utilizatorului
     * @property {string} username - Username-ul utilizatorului
     * @param {string} nume - Numele utilizatorului
     * @param {string} prenume - Prenumele utilizatorului
     * @param {string} email - Email-ul utilizatorului
     * @param {string} parola - Parola utilizatorului
     * @param {string} rol - Rolul utilizatorului
     * @param {string} culoare_chat - Culoarea chatului utilizatorului
     * @param {string} poza - Poza utilizatorului
     */
    /**
     * Creeaza o instanta a clasei Utilizator
     * @param {ObiectUtilizator} obj - un obiect ale carui proprietati au aceleasi nume cu cele ale instantelor clasei Utilizator
     */
    constructor({
        id,
        username,
        nume,
        prenume,
        email,
        parola,
        rol,
        culoare_chat = "black",
        poza,
    } = {}) {
        this.id = id;

        try {
            if (this.checkUsername(username)) this.username = username;
            else throw new Error("Username incorect");
        } catch (e) {
            this.#eroare = e.message;
        }

        for (let prop in arguments[0]) {
            this[prop] = arguments[0][prop];
        }
        if (this.rol)
            this.rol = this.rol.cod
                ? RolFactory.creeazaRol(this.rol.cod)
                : RolFactory.creeazaRol(this.rol);

        this.#eroare = "";
    }

    /**
     * Verifica daca numele este valid
     * @param {string} nume - Numele de verificat
     * @returns {boolean} True daca numele este valid, false in caz contrar
     */
    checkName(nume) {
        return nume != "" && nume.match(new RegExp("^[A-Z][a-z]+$"));
    }

    /**
     * Seteaza numele utilizatorului
     * @param {string} nume - Numele de setat
     */
    set setareNume(nume) {
        if (this.checkName(nume)) this.nume = nume;
        else {
            throw new Error("Nume gresit");
        }
    }

    /**
     * Seteaza username-ul utilizatorului
     * @param {string} username - Username-ul de setat
     */
    set setareUsername(username) {
        if (this.checkUsername(username)) this.username = username;
        else {
            throw new Error("Username gresit");
        }
    }

    /**
     * Verifica daca username-ul este valid
     * @param {string} username - Username-ul de verificat
     * @returns {boolean} True daca username-ul este valid, false in caz contrar
     */
    checkUsername(username) {
        return (
            username != "" && username.match(new RegExp("^[A-Za-z0-9#_./]+$"))
        );
    }

    /**
     * Cripteaza parola utilizatorului
     * @param {string} parola - Parola de criptat
     * @returns {string} Parola criptata
     */
    static criptareParola(parola) {
        return crypto
            .scryptSync(
                parola,
                Utilizator.parolaCriptare,
                Utilizator.lungimeCod
            )
            .toString("hex");
    }

    /**
     * Salveaza utilizatorul in baza de date
     */
    salvareUtilizator() {
        let parolaCriptata = Utilizator.criptareParola(this.parola);
        let utiliz = this;
        let token = parole.genereazaToken(100);
        AccesBD.getInstanta(Utilizator.tipConexiune).insert(
            {
                tabel: Utilizator.tabel,
                campuri: {
                    username: this.username,
                    nume: this.nume,
                    prenume: this.prenume,
                    parola: parolaCriptata,
                    email: this.email,
                    culoare_chat: this.culoare_chat,
                    cod: token,
                    poza: this.poza,
                },
            },
            function (err, rez) {
                if (err) console.log(err);
                else
                    utiliz.trimiteMail(
                        "Te-ai inregistrat cu succes",
                        "Username-ul tau este " + utiliz.username,
                        `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${utiliz.username}</p> <p><a href='http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>`
                    );
            }
        );
    }

    /**
     * Trimite un email utilizatorului
     * @param {string} subiect - Subiectul emailului
     * @param {string} mesajText - Mesajul text al emailului
     * @param {string} mesajHtml - Mesajul HTML al emailului
     * @param {Array} [atasamente=[]] - Atasamentele emailului
     */
    async trimiteMail(subiect, mesajText, mesajHtml, atasamente = []) {
        var transp = nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth: {
                user: Utilizator.emailServer,
                pass: "awwvixuosofmbqbc",
            },
            tls: {
                rejectUnauthorized: false,
            },
        });

        await transp.sendMail({
            from: Utilizator.emailServer,
            to: this.email,
            subject: subiect,
            text: mesajText,
            html: mesajHtml,
            attachments: atasamente,
        });
        console.log("trimis mail");
    }

    /**
     * Obtine un utilizator dupa username in mod asincron
     * @param {string} username - Username-ul utilizatorului
     * @returns {Promise<Utilizator|null>} Promisiune cu utilizatorul gasit sau null
     */
    static async getUtilizDupaUsernameAsync(username) {
        if (!username) return null;
        try {
            let rezSelect = await AccesBD.getInstanta(
                Utilizator.tipConexiune
            ).selectAsync({
                tabel: "utilizatori",
                campuri: ["*"],
                conditiiAnd: [`username='${username}'`],
            });
            if (rezSelect.rowCount != 0) {
                return new Utilizator(rezSelect.rows[0]);
            } else {
                console.log(
                    "getUtilizDupaUsernameAsync: Nu am gasit utilizatorul"
                );
                return null;
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /**
     * Obtine un utilizator dupa username
     * @param {string} username - Username-ul utilizatorului
     * @param {Object} obparam - Parametri suplimentari
     * @param {function} proceseazaUtiliz - Callback pentru procesarea utilizatorului
     * @returns {Utilizator|null} Utilizatorul gasit sau null
     */
    static getUtilizDupaUsername(username, obparam, proceseazaUtiliz) {
        if (!username) return null;
        let eroare = null;
        AccesBD.getInstanta(Utilizator.tipConexiune).select(
            {
                tabel: "utilizatori",
                campuri: ["*"],
                conditiiAnd: [`username='${username}'`],
            },
            function (err, rezSelect) {
                if (err) {
                    console.error("Utilizator:", err);
                    eroare = -2;
                } else if (rezSelect.rowCount == 0) {
                    eroare = -1;
                }
                let u = new Utilizator(rezSelect.rows[0]);
                proceseazaUtiliz(u, obparam, eroare);
            }
        );
    }

    /**
     * @typedef {object} ObiectUtilizator - un obiect ale carui proprietati au aceleasi nume cu cele ale instantelor clasei Utilizator
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     * @property {number} id - ID-ul utilizatorului
     * @property {string} username - Username-ul utilizatorului
     * @param {string} nume - Numele utilizatorului
     * @param {string} prenume - Prenumele utilizatorului
     * @param {string} email - Email-ul utilizatorului
     * @param {string} parola - Parola utilizatorului
     * @param {string} rol - Rolul utilizatorului
     * @param {string} culoare_chat - Culoarea chatului utilizatorului
     * @param {string} poza - Poza utilizatorului
     */
    /**
     * Cauta utilizatori dupa criterii specifice
     * @param {ObiectUtilizator} obj - un obiect ale carui proprietati au aceleasi nume cu cele ale instantelor clasei Utilizator
     * @param {function} proceseazaUtiliz - Callback pentru procesarea utilizatorilor
     */
    static cauta(
        {
            id,
            username,
            nume,
            prenume,
            email,
            parola,
            rol,
            culoare_chat,
            poza,
        } = {},
        obparam,
        proceseazaUtiliz
    ) {
        let eroare = null;
        if (!arguments[0]) return null;

        let conditii = [];
        if (id) conditii.push(`id='${id}'`);
        if (username) conditii.push(`username='${username}'`);
        if (nume) conditii.push(`nume='${nume}'`);
        if (prenume) conditii.push(`prenume='${prenume}'`);
        if (email) conditii.push(`email='${email}'`);
        if (parola) conditii.push(`parola='${parola}'`);
        if (rol) conditii.push(`rol='${rol}'`);
        if (culoare_chat) conditii.push(`culoare_chat='${culoare_chat}'`);
        if (poza) conditii.push(`poza='${poza}'`);

        AccesBD.getInstanta(Utilizator.tipConexiune).select(
            {
                tabel: "utilizatori",
                campuri: ["*"],
                conditiiAnd: conditii,
            },
            function (err, rezSelect) {
                if (err) {
                    console.error("Utilizator:", err);
                    eroare = -2;
                } else if (rezSelect.rowCount == 0) {
                    eroare = -1;
                }
                let listaUtiliz = rezSelect.rows.map(
                    (row) => new Utilizator(row)
                );
                proceseazaUtiliz(listaUtiliz, obparam, eroare);
            }
        );
    }

    /**
     * @typedef {object} ObiectUtilizator - un obiect ale carui proprietati au aceleasi nume cu cele ale instantelor clasei Utilizator
     * @property {string []} campuri - o lista de stringuri cu numele coloanelor afectate de query; poate cuprinde si elementul "*"
     * @property {string[]} conditiiAnd - lista de stringuri cu conditii pentru where
     * @property {number} id - ID-ul utilizatorului
     * @property {string} username - Username-ul utilizatorului
     * @param {string} nume - Numele utilizatorului
     * @param {string} prenume - Prenumele utilizatorului
     * @param {string} email - Email-ul utilizatorului
     * @param {string} parola - Parola utilizatorului
     * @param {string} rol - Rolul utilizatorului
     * @param {string} culoare_chat - Culoarea chatului utilizatorului
     * @param {string} poza - Poza utilizatorului
     */
    /**
     * Cauta utilizatori dupa criterii specifice in mod asincron
     * @param {ObiectUtilizator} obj - un obiect ale carui proprietati au aceleasi nume cu cele ale instantelor clasei Utilizator
     * @param {function} proceseazaUtiliz - Callback pentru procesarea utilizatorilor
     */
    static async cautaAsync({
        id,
        username,
        nume,
        prenume,
        email,
        parola,
        rol,
        culoare_chat,
        poza,
    } = {}) {
        if (!arguments[0]) return null;

        let conditii = [];
        if (id) conditii.push(`id='${id}'`);
        if (username) conditii.push(`username='${username}'`);
        if (nume) conditii.push(`nume='${nume}'`);
        if (prenume) conditii.push(`prenume='${prenume}'`);
        if (email) conditii.push(`email='${email}'`);
        if (parola) conditii.push(`parola='${parola}'`);
        if (rol) conditii.push(`rol='${rol}'`);
        if (culoare_chat) conditii.push(`culoare_chat='${culoare_chat}'`);
        if (poza) conditii.push(`poza='${poza}'`);

        try {
            let rezSelect = await AccesBD.getInstanta(
                Utilizator.tipConexiune
            ).selectAsync({
                tabel: "utilizatori",
                campuri: ["*"],
                conditiiAnd: conditii,
            });
            if (rezSelect.rowCount != 0) {
                listaUtiliz = rezSelect.rows.map((row) => new Utilizator(row));
                return listaUtiliz;
            } else {
                console.log("cautaAsync: Nu am gasit utilizatorul");
                return null;
            }
        } catch (e) {
            console.log(e);
            return null;
        }
    }

    /**
     * Sterge utilizatorul din baza de date
     */
    static sterge() {
        var obiectComanda = {
            tabel: "utilizatori",
            conditiiAnd: [`id = ${this.id}`],
        };
        AccesBD.getInstanta().delete(obiectComanda, function (err, rezQuery) {
            console.log(err);
        });
    }

    /**
     * Verifica daca utilizatorul are un anumit drept
     * @param {Symbol} drept - Dreptul de verificat
     * @returns {boolean} True daca utilizatorul are dreptul specificat, false in caz contrar
     */
    areDreptul(drept) {
        return this.rol.areDreptul(drept);
    }
}

module.exports = { Utilizator: Utilizator };
