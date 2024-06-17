const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const sass = require("sass");
const ejs = require("ejs");

const AccesBD = require("./module_proprii/accesbd.js");

const formidable = require("formidable");
const { Utilizator } = require("./module_proprii/utilizator.js");
const session = require("express-session");
const Drepturi = require("./module_proprii/drepturi.js");

const Client = require("pg").Client;

const QRCode = require("qrcode");
const puppeteer = require("puppeteer");

var client = new Client({
    database: "cti_2024",
    user: "adrian",
    password: "adrian",
    host: "localhost",
    port: 5432,
});
client.connect();

// client.query(
//     "select * from unnest(enum_range(null::categorie_laptopuri))",
//     function (err, rez) {
//         console.log(rez.rows);
//     }
// );

obGlobal = {
    obErori: null,
    obImagini: null,
    linkAtribuireImagini: null,
    folderCss: path.join(__dirname, "resurse/css"),
    folderScss: path.join(__dirname, "resurse/scss"),
    folderBackup: path.join(__dirname, "backup"),
    protocol: "http://",
    numeDomeniu: "localhost:8080",
};

app = express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.use(
    session({
        // aici se creeaza proprietatea session a requestului (pot folosi req.session)
        secret: "abcdefg", //folosit de express session pentru criptarea id-ului de sesiune
        resave: true,
        saveUninitialized: false,
    })
);

// /* este redundant - poate sa fie si fara

app.use("/*", function (req, res, next) {
    res.locals.optiuniMeniu = obGlobal.optiuniMeniu;
    res.locals.Drepturi = Drepturi;
    if (req.session.utilizator) {
        req.utilizator = res.locals.utilizator = new Utilizator(
            req.session.utilizator
        );
    }
    next();
});

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"));
app.use("/poze_uploadate", express.static(__dirname + "/poze_uploadate"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));

app.use(function (req, res, next) {
    client.query(
        "select * from unnest(enum_range(null::categorie_laptopuri))",
        function (err, rezOptiuni) {
            res.locals.optiuniMeniu = rezOptiuni.rows;
            next();
        }
    );
});

client.query(
    "select * from unnest(enum_range(null::tipuri_produse))",
    function (err, rezCategorie) {
        if (err) {
            console.log(err);
        } else {
            obGlobal.optiuniMeniu = rezCategorie.rows;
        }
    }
);

app.get(["/", "/index", "/home"], async function (req, res) {
    // res.sendFile(__dirname + "/index.html");
    res.render("pagini/index.ejs", {
        ip: req.ip,
        imagini: obGlobal.obImagini.imagini,
        link_atribuire: obGlobal.linkAtribuireImagini.link_freepik,
        useriOnline: await obtineUtilizatoriOnline(),
    });
});

app.get("/galerie-statica", async function (req, res) {
    res.render("pagini/galerie_statica.ejs", {
        imagini: obGlobal.obImagini.imagini,
        link_atribuire: obGlobal.linkAtribuireImagini.link_freepik,
    });
});

app.get("*/galerie-animata.css", function (req, res) {
    var sirScss = fs
        .readFileSync(
            path.join(__dirname, "resurse/scss-ejs/galerie_animata.scss")
        )
        .toString("utf8");
    // (0:5) + 6 = (6:11)/2 = (3 : 5) * 2 = (6 : 10)
    var numarImagini = Math.floor((Math.floor(Math.random() * 5) + 6) / 2) * 2;
    console.log("Numarul de poze: " + numarImagini);
    rezScss = ejs.render(sirScss, { nrimag: numarImagini });
    // console.log(rezScss);
    var caleScss = path.join(__dirname, "temp/galerie_animata.scss");
    fs.writeFileSync(caleScss, rezScss);
    try {
        rezCompilare = sass.compile(caleScss, { sourceMap: true });

        var caleCss = path.join(__dirname, "temp/galerie_animata.css");
        fs.writeFileSync(caleCss, rezCompilare.css);
        res.setHeader("Content-Type", "text/css");
        res.sendFile(caleCss);
    } catch (err) {
        console.log(err);
        res.send("Eroare");
    }
});

app.get("*/galerie-animata.css.map", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/galerie-animata.css.map"));
});

// --------------------------utilizatori online ------------------------------------------

function getIp(req) {
    //pentru Heroku/Render
    var ip = req.headers["x-forwarded-for"]; //ip-ul userului pentru care este forwardat mesajul
    if (ip) {
        let vect = ip.split(",");
        return vect[vect.length - 1];
    } else if (req.ip) {
        return req.ip;
    } else {
        return req.connection.remoteAddress;
    }
}

app.all("/*", function (req, res, next) {
    let ipReq = getIp(req);
    if (ipReq) {
        var id_utiliz = req?.session?.utilizator?.id;
        id_utiliz = id_utiliz ? id_utiliz : null;
        console.log("id_utiliz", id_utiliz);
        // TO DO comanda insert (folosind AccesBD) cu  ip, user_id, pagina(url  din request)
        var obiectInsert = {
            ip: ipReq,
            pagina: req.url,
        };
        if (id_utiliz) obiectInsert.user_id = id_utiliz;
        AccesBD.getInstanta().insert({
            tabel: "accesari",
            campuri: obiectInsert,
        });
    }
    next();
});

function stergeAccesariVechi() {
    AccesBD.getInstanta().delete(
        {
            tabel: "accesari",
            conditiiAnd: ["now() - data_accesare >= interval '10 minutes' "],
        },
        function (err, rez) {
            console.log(err);
        }
    );
}
stergeAccesariVechi();
setInterval(stergeAccesariVechi, 10 * 60 * 1000);

async function obtineUtilizatoriOnline() {
    try {
        var rez = await client.query(
            "select username, nume, prenume from utilizatori where id in (select distinct user_id from accesari where now()-data_accesare <= interval '5 minutes')"
        );
        // console.log(rez.rows);
        return rez.rows;
    } catch (err) {
        console.error(err);
        return [];
    }
}

// ------------------------------------------ Produse -----------------------------------------

app.get("/produse", function (req, res) {
    console.log(req.query);
    var conditieQuery = "";
    if (req.query.tip) {
        conditieQuery = ` where categorie='${req.query.tip}'`;
    }
    client.query(
        // "select * from unnest(enum_range(null::categorie_laptopuri))",
        "select distinct categorie from laptopuri order by categorie asc",
        function (err, rezOptiuni) {
            client.query(
                `select * from laptopuri ${conditieQuery}`,
                function (err, rez) {
                    if (err) {
                        console.log(err);
                        afisareEroare(res, 2);
                    } else {
                        client.query(
                            "select distinct culoare from laptopuri order by culoare asc",
                            function (err, rezCulori) {
                                client.query(
                                    "select distinct brand from laptopuri order by brand asc",
                                    function (err, rezBranduri) {
                                        client.query(
                                            "select distinct resigilat from laptopuri order by resigilat desc",
                                            function (err, rezResigilat) {
                                                client.query(
                                                    "select min(pret), max(pret) from laptopuri",
                                                    function (err, rezPreturi) {
                                                        client.query(
                                                            "select distinct unnest(specificatii) specs from laptopuri order by specs asc",
                                                            function (
                                                                err,
                                                                rezSpecs
                                                            ) {
                                                                res.render(
                                                                    "pagini/produse",
                                                                    {
                                                                        produse:
                                                                            rez.rows,
                                                                        optiuni:
                                                                            rezOptiuni.rows,
                                                                        culori: rezCulori.rows,
                                                                        branduri:
                                                                            rezBranduri.rows,
                                                                        resigilat:
                                                                            rezResigilat.rows,
                                                                        preturi:
                                                                            rezPreturi.rows,
                                                                        specs: rezSpecs.rows,
                                                                    }
                                                                );
                                                            }
                                                        );
                                                    }
                                                );
                                            }
                                        );
                                    }
                                );
                            }
                        );
                    }
                }
            );
        }
    );
});

app.get("/produs/:id", function (req, res) {
    client.query(
        `select * from laptopuri where id=${req.params.id}`,
        function (err, rez) {
            if (err) {
                console.log(err);
                afisareEroare(res, 2);
            } else {
                res.render("pagini/produs", { prod: rez.rows[0] });
            }
        }
    );
});

// ---------------------------------  cos virtual --------------------------------------

app.use(["/produse_cos", "/cumpara"], express.json({ limit: "2mb" })); //obligatoriu de setat pt request body de tip json

app.post("/produse_cos", function (req, res) {
    console.log(req.body);
    if (req.body.ids_prod.length != 0) {
        //TO DO : cerere catre AccesBD astfel incat query-ul sa fie `select nume, descriere, pret, gramaj, imagine from prajituri where id in (lista de id-uri)`
        AccesBD.getInstanta().select(
            {
                tabel: "prajituri",
                campuri: "nume,descriere,pret,gramaj,imagine".split(","),
                conditiiAnd: [`id in (${req.body.ids_prod})`],
            },
            function (err, rez) {
                if (err) res.send([]);
                else res.send(rez.rows);
            }
        );
    } else {
        res.send([]);
    }
});

cale_qr = __dirname + "/resurse/imagini/qrcode";
if (fs.existsSync(cale_qr))
    fs.rmSync(cale_qr, { force: true, recursive: true });
fs.mkdirSync(cale_qr);
client.query("select id from prajituri", function (err, rez) {
    for (let prod of rez.rows) {
        let cale_prod =
            obGlobal.protocol + obGlobal.numeDomeniu + "/produs/" + prod.id;
        //console.log(cale_prod);
        QRCode.toFile(cale_qr + "/" + prod.id + ".png", cale_prod);
    }
});

async function genereazaPdf(stringHTML, numeFis, callback) {
    const chrome = await puppeteer.launch();
    const document = await chrome.newPage();
    console.log("inainte load");
    //await document.setContent(stringHTML, {waitUntil:"load"});
    await document.setContent(stringHTML, { waitUntil: "load" });

    console.log("dupa load");
    await document.pdf({ path: numeFis, format: "A4" });

    console.log("dupa pdf");
    await chrome.close();

    console.log("dupa inchidere");
    if (callback) callback(numeFis);
}

app.post("/cumpara", function (req, res) {
    console.log(req.body);

    if (req?.utilizator?.areDreptul?.(Drepturi.cumparareProduse)) {
        AccesBD.getInstanta().select(
            {
                tabel: "prajituri",
                campuri: ["*"],
                conditiiAnd: [`id in (${req.body.ids_prod})`],
            },
            function (err, rez) {
                if (!err && rez.rowCount > 0) {
                    console.log("produse:", rez.rows);
                    let rezFactura = ejs.render(
                        fs
                            .readFileSync("./views/pagini/factura.ejs")
                            .toString("utf-8"),
                        {
                            protocol: obGlobal.protocol,
                            domeniu: obGlobal.numeDomeniu,
                            utilizator: req.session.utilizator,
                            produse: rez.rows,
                        }
                    );
                    console.log(rezFactura);
                    let numeFis = `./temp/factura${new Date().getTime()}.pdf`;
                    genereazaPdf(rezFactura, numeFis, function (numeFis) {
                        mesajText = `Stimate ${req.session.utilizator.username} aveti mai jos factura.`;
                        mesajHTML = `<h2>Stimate ${req.session.utilizator.username},</h2> aveti mai jos factura.`;
                        req.utilizator.trimiteMail(
                            "Factura",
                            mesajText,
                            mesajHTML,
                            [
                                {
                                    filename: "factura.pdf",
                                    content: fs.readFileSync(numeFis),
                                },
                            ]
                        );
                        res.send("Totul e bine!");
                    });
                }
            }
        );
    } else {
        res.send(
            "Nu puteti cumpara daca nu sunteti logat sau nu aveti dreptul!"
        );
    }
});

// ------------------------------------------ Utilizatori -----------------------------------------

app.post("/inregistrare", function (req, res) {
    var username;
    var poza;
    var formular = new formidable.IncomingForm();
    formular.parse(req, function (err, campuriText, campuriFisier) {
        //4
        console.log("Inregistrare:", campuriText);

        console.log(campuriFisier);
        console.log(poza, username);
        var eroare = "";

        // TO DO var utilizNou = creare utilizator
        var utilizNou = new Utilizator();
        try {
            utilizNou.setareNume = campuriText.nume[0];
            utilizNou.setareUsername = campuriText.username[0];
            utilizNou.email = campuriText.email[0];
            utilizNou.prenume = campuriText.prenume[0];

            utilizNou.parola = campuriText.parola[0];
            utilizNou.culoare_chat = campuriText.culoare_chat[0];
            utilizNou.poza = poza;
            Utilizator.getUtilizDupaUsername(
                campuriText.username[0],
                {},
                function (u, parametru, eroareUser) {
                    if (eroareUser == -1) {
                        //nu exista username-ul in BD
                        //TO DO salveaza utilizator
                        utilizNou.salvareUtilizator();
                    } else {
                        eroare += "Mai exista username-ul";
                    }

                    if (!eroare) {
                        res.render("pagini/inregistrare", {
                            raspuns: "Inregistrare cu succes!",
                        });
                    } else
                        res.render("pagini/inregistrare", {
                            err: "Eroare: " + eroare,
                        });
                }
            );
        } catch (e) {
            console.log(e);
            eroare += "Eroare site; reveniti mai tarziu";
            console.log(eroare);
            res.render("pagini/inregistrare", { err: "Eroare: " + eroare });
        }
    });
    formular.on("field", function (nume, val) {
        // 1

        console.log(`--- ${nume}=${val}`);

        if (nume == "username") username = val;
    });
    formular.on("fileBegin", function (nume, fisier) {
        //2
        console.log("fileBegin");

        console.log(nume, fisier);
        //TO DO adaugam folderul poze_uploadate ca static si sa fie creat de aplicatie
        //TO DO in folderul poze_uploadate facem folder cu numele utilizatorului (variabila folderUser)
        var folderUser = path.join(__dirname, "poze_uploadate", username);
        console.log("folderUser: " + folderUser);
        if (!fs.existsSync(folderUser)) fs.mkdirSync(folderUser);

        fisier.filepath = path.join(folderUser, fisier.originalFilename);
        poza = fisier.originalFilename;
        console.log("fisier: " + fisier);

        //fisier.filepath=folderUser+"/"+fisier.originalFilename
        console.log("fileBegin:", poza);
        console.log("fileBegin, fisier:", fisier);
    });
    formular.on("file", function (nume, fisier) {
        //3
        console.log("file");
        console.log(nume, fisier);
    });
});

app.post("/login", function (req, res) {
    /*TO DO parametriCallback: cu proprietatile: request(req), response(res) si parola
        testam daca parola trimisa e cea din baza de date
        testam daca a confirmat mailul
    */
    var username;
    // console.log("ceva");
    var formular = new formidable.IncomingForm();

    formular.parse(req, function (err, campuriText, campuriFisier) {
        var parametriCallback = {
            req: req,
            res: res,
            parola: campuriText.parola[0],
        };
        Utilizator.getUtilizDupaUsername(
            campuriText.username[0],
            parametriCallback,
            function (u, obparam, eroare) {
                let parolaCriptata = Utilizator.criptareParola(obparam.parola);
                if (u.parola == parolaCriptata && u.confirmat_mail) {
                    u.poza = u.poza
                        ? path.join("poze_uploadate", u.username, u.poza)
                        : "";
                    obparam.req.session.utilizator = u;
                    obparam.req.session.mesajLogin = "Bravo! Te-ai logat!";
                    obparam.res.redirect("/index");
                } else {
                    console.log("Eroare logare");
                    obparam.req.session.mesajLogin =
                        "Date logare incorecte sau nu a fost confirmat mailul!";
                    obparam.res.redirect("/index");
                }
            }
        );
    });
});

app.post("/profil", function (req, res) {
    // console.log("profil");
    if (!req.session.utilizator) {
        afisareEroare(res, 403);
        return;
    }
    var formular = new formidable.IncomingForm();

    formular.parse(req, function (err, campuriText, campuriFile) {
        var parolaCriptata = Utilizator.criptareParola(campuriText.parola[0]);

        AccesBD.getInstanta().updateParametrizat(
            {
                tabel: "utilizatori",
                campuri: ["nume", "prenume", "email", "culoare_chat"],
                valori: [
                    `${campuriText.nume[0]}`,
                    `${campuriText.prenume[0]}`,
                    `${campuriText.email[0]}`,
                    `${campuriText.culoare_chat[0]}`,
                ],
                conditiiAnd: [
                    `parola='${parolaCriptata}'`,
                    `username='${campuriText.username[0]}'`,
                ],
            },
            function (err, rez) {
                if (err) {
                    console.log(err);
                    afisareEroare(res, 2);
                    return;
                }
                // console.log(rez.rowCount);
                if (rez.rowCount == 0) {
                    res.render("pagini/profil", {
                        mesaj: "Update-ul nu s-a realizat. Verificati parola introdusa.",
                    });
                    return;
                } else {
                    //actualizare sesiune
                    // console.log("ceva");
                    req.session.utilizator.nume = campuriText.nume[0];
                    req.session.utilizator.prenume = campuriText.prenume[0];
                    req.session.utilizator.email = campuriText.email[0];
                    req.session.utilizator.culoare_chat =
                        campuriText.culoare_chat[0];
                    res.locals.utilizator = req.session.utilizator;
                }

                res.render("pagini/profil", {
                    mesaj: "Update-ul s-a realizat cu succes.",
                });
            }
        );
    });
});

app.get("/useri", function (req, res) {
    /* TO DO
     * in if testam daca utilizatorul din sesiune are dreptul sa vizualizeze utilizatori
     * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii
     *
     * */
    if (req?.utilizator?.areDreptul(Drepturi.vizualizareUtilizatori)) {
        var obiectComanda = {
            tabel: "utilizatori",
            campuri: ["*"],
            conditiiAnd: [],
        };
        AccesBD.getInstanta().select(obiectComanda, function (err, rezQuery) {
            console.log(err);
            res.render("pagini/useri", { useri: rezQuery.rows });
        });
        // var obiectComanda2 = {
        //     tabel: "utilizatori",
        //     campuri: ["*"],
        //     conditiiAnd: [
        //         // "id = 2",
        //         // "nume = 'Nimeni'",
        //         // ["id = 2", "nume = 'Nimeni'"],
        //         // ["username = 'nimeni_altu'"],
        //     ],
        // };
        // AccesBD.getInstanta().select(obiectComanda2, function (err, rezQuery) {
        //     console.log(err);
        //     res.render("pagini/useri", { useri: rezQuery.rows });
        // });
        Utilizator.cauta(
            { id: "2", username: "nimeni_altu" },
            {},
            function (listaUtiliz, obparam, eroare) {
                if (eroare == -1) {
                    console.log("Nu a fost gasit niciun utilizator!");
                } else
                    console.log(
                        "Utilizatorul cautat: " + listaUtiliz[0].username
                    );
            }
        );
    } else {
        afisareEroare(res, 403);
    }
});

app.post("/sterge_utiliz", function (req, res) {
    /* TO DO
     * in if testam daca utilizatorul din sesiune are dreptul sa stearga utilizatori
     * completam obiectComanda cu parametrii comenzii select pentru a prelua toti utilizatorii
     */
    if (req.utilizator.areDreptul(Drepturi.stergereUtilizatori)) {
        var formular = new formidable.IncomingForm();

        formular.parse(req, function (err, campuriText, campuriFile) {
            var obiectComanda = {
                tabel: "utilizatori",
                conditiiAnd: [`id = ${campuriText.id_utiliz[0]}`],
            };
            AccesBD.getInstanta().delete(
                obiectComanda,
                function (err, rezQuery) {
                    console.log(err);
                    res.redirect("/useri");
                }
            );
        });
    } else {
        afisareEroare(res, 403);
    }
});

app.get("/logout", function (req, res) {
    req.session.destroy();
    res.locals.utilizator = null;
    res.render("pagini/logout");
});

//http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}
app.get("/cod/:username/:token", function (req, res) {
    /*TO DO parametriCallback: cu proprietatile: request (req) si token (luat din parametrii cererii)
        setat parametriCerere pentru a verifica daca tokenul corespunde userului
    */
    console.log(req.params);

    try {
        var parametriCallback = {
            req: req,
            token: req.params.token,
        };
        Utilizator.getUtilizDupaUsername(
            req.params.username,
            parametriCallback,
            function (u, obparam) {
                let parametriCerere = {
                    tabel: "utilizatori",
                    campuri: { confirmat_mail: true },
                    conditiiAnd: [`cod = '${obparam.token}'`],
                };
                AccesBD.getInstanta().update(
                    parametriCerere,
                    function (err, rezUpdate) {
                        if (err || rezUpdate.rowCount == 0) {
                            console.log("Cod:", err);
                            afisareEroare(res, 3);
                        } else {
                            res.render("pagini/confirmare.ejs");
                        }
                    }
                );
            }
        );
    } catch (e) {
        console.log(e);
        afisareEroare(res, 2);
    }
});

// -----------------------------------------------------------------------------------------------------
app.get("/cerere", function (req, res) {
    res.send("<b>Hello!</b> <span style = 'color:red'>world!</span>");
});

// app.get("/data", function (req, res) {
//     res.send(new Date());
// });

app.get("/suma/:a/:b", function (req, res) {
    var suma = parseInt(req.params.a) + parseInt(req.params.b);
    res.send("" + suma);
});

//trimiterea unui mesaj dinamic

app.get("/data", function (req, res, next) {
    res.write("Data: ");
    next();
});

app.get("/data", function (req, res) {
    res.write("" + new Date());
    res.end();
});

// app.get("/resurse/*", function (req, res) {
//     afisareEroare(res, "403");
// });

app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/ico/favicon.ico"));
});

app.get("/*.ejs", function (req, res) {
    afisareEroare(res, "400");
});

app.get(new RegExp("^/[a-z0-9A-Z/]*/"), function (req, res) {
    afisareEroare(res, 403);
});

function initErori() {
    // const erori = require("./erori.json");
    // obGlobal.obErori = erori;
    var erori = fs.readFileSync(
        path.join(__dirname, "resurse/json/erori.json")
    );
    obGlobal.obErori = JSON.parse(erori);
    for (let eroare of obGlobal.obErori.info_erori)
        eroare.imagine = path.join(obGlobal.obErori.cale_baza, eroare.imagine);
    obGlobal.obErori.eroare_default.imagine = path.join(
        obGlobal.obErori.cale_baza,
        obGlobal.obErori.eroare_default.imagine
    );
}

initErori();

function afisareEroare(
    res,
    localIdentificator,
    localTitlu,
    localText,
    localImagine
) {
    let eroare = obGlobal.obErori.info_erori.find(function (elem) {
        return elem.identificator == localIdentificator;
    });
    if (!eroare) {
        let eroareDefault = obGlobal.obErori.eroare_default;
        res.render("pagini/eroare", {
            titlu: localTitlu || eroareDefault.titlu,
            text: localText || eroareDefault.text,
            imagine: localImagine || eroareDefault.imagine,
        });
    } else {
        if (eroare.status) res.status(eroare.identificator);
        res.render("pagini/eroare", {
            titlu: localTitlu || eroare.titlu,
            text: localText || eroare.text,
            imagine: localImagine || eroare.imagine,
        });
    }
}

app.get("/*", function (req, res) {
    console.log(req.url);
    // res.send("ceva");
    try {
        res.render("pagini" + req.url, function (err, rezHtml) {
            if (err) {
                if (err.message.startsWith("Failed to lookup view"))
                    afisareEroare(res, "404");
            } else {
                res.send(rezHtml + "");
            }
        });
    } catch (err1) {
        if (err1) {
            if (err1.message.startsWith("Cannot find module")) {
                afisareEroare(res, "404");
                console.log("Nu a gasit resursa: ", req.url);
            } else {
                afisareEroare(res);
                console.log("Eroare:" + err1);
            }
        }
    }
});

vect_foldere = ["temp", "temp1", "backup", "poze_uploadate"];
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) fs.mkdirSync(caleFolder);
}

function initImagini() {
    var continut = fs
        .readFileSync(path.join(__dirname, "resurse/json/galerie.json"))
        .toString("utf-8");

    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;

    let caleAbs = path.join(__dirname, obGlobal.obImagini.cale_galerie);
    let caleAbsMediu = path.join(
        __dirname,
        obGlobal.obImagini.cale_galerie,
        "mediu"
    );
    if (!fs.existsSync(caleAbsMediu)) fs.mkdirSync(caleAbsMediu);

    //for (let i=0; i< vErori.length; i++ )
    for (let imag of vImagini) {
        [numeFis, ext] = imag.cale_relativa.split(".");
        let caleFisAbs = path.join(caleAbs, imag.cale_relativa);
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.fisier_mediu = path.join(
            "/",
            obGlobal.obImagini.cale_galerie,
            "mediu",
            numeFis + ".webp"
        );
        imag.fisier = path.join(
            "/",
            obGlobal.obImagini.cale_galerie,
            imag.cale_relativa
        );
    }

    var continut_atribuire = fs
        .readFileSync(path.join(__dirname, "resurse/json/atribuire.json"))
        .toString("utf-8");

    obGlobal.linkAtribuireImagini = JSON.parse(continut_atribuire);
}
initImagini();

function compileazaScss(caleScss, caleCss) {
    // console.log("cale:", caleCss);
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0]; /// "a.scss"  -> ["a","scss"]
        caleCss = numeFis + ".css";
    }

    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss);

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }

    // la acest punct avem cai absolute in caleScss si  caleCss
    //TO DO
    let numeFisCss = path.basename(caleCss);
    let numeFisCssBackup = numeFisCss.split(".")[0];
    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(
            caleCss,
            path.join(
                caleBackup,
                numeFisCssBackup +
                    "_" +
                    new Date().getTime() +
                    "." +
                    numeFisCss.split(".")[1]
            )
        );
    }
    rez = sass.compile(caleScss, { sourceMap: true });
    fs.writeFileSync(caleCss, rez.css);
    //console.log("Compilare SCSS",rez);
}
//compileazaScss("a.scss");
vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
        // setInterval();
        stergeFisiereBackup();
    }
}

function stergeFisiereBackup() {
    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    fs.readdir(caleBackup, function (err, files) {
        if (err) {
            console.error(
                "Nu s-au putut sterge fisiere vechi din backup!",
                err
            );
        } else {
            files.forEach(function (file, index) {
                var fisierDeSters = path.join(caleBackup, file);
                fs.stat(fisierDeSters, function (error, stat) {
                    if (error) {
                        console.error(
                            "Nu s-au putut citi date despre fisier!",
                            error
                        );
                        return;
                    }
                    var numarDeMinuteTrecute =
                        (new Date() - stat.birthtime) / (1000 * 60);
                    if (numarDeMinuteTrecute >= 30) {
                        fs.unlink(fisierDeSters, function (deleteError) {
                            if (deleteError && deleteError.code == "ENOENT") {
                                console.info("Fisierul nu exista.");
                            } else if (deleteError) {
                                console.error(
                                    "O eroare a intervenit la stergerea fisierului."
                                );
                            } else {
                                console.info("Fisier sters.");
                            }
                        });
                    }
                });
            });
        }
    });
}

setInterval(stergeFisiereBackup, 30 * 60 * 1000);

fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    console.log(eveniment, numeFis);
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
});

app.listen(8080);
console.log("Serverul a pornit");
