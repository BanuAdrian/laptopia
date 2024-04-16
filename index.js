const express = require("express");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const sass = require("sass");
const ejs = require("ejs");

const Client = require("pg").Client;

var client = new Client({
    database: "cti_2024",
    user: "adrian",
    password: "adrian",
    host: "localhost",
    port: 5432,
});
client.connect();

obGlobal = {
    obErori: null,
    obImagini: null,
    linkAtribuireImagini: null,
    folderCss: path.join(__dirname, "resurse/css"),
    folderScss: path.join(__dirname, "resurse/scss"),
    folderBackup: path.join(__dirname, "backup"),
};

app = express();
console.log("Folder proiect", __dirname);
console.log("Cale fisier", __filename);
console.log("Director de lucru", process.cwd());

app.set("view engine", "ejs");

app.use("/resurse", express.static(__dirname + "/resurse"));
app.use("/node_modules", express.static(__dirname + "/node_modules"));

app.get(["/", "/index", "/home"], function (req, res) {
    // res.sendFile(__dirname + "/index.html");
    res.render("pagini/index.ejs", {
        ip: req.ip,
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

app.get("/produse", function (req, res) {
    client.query("select * from prajituri", function (err, rez) {
        if (err) {
            console.log(err);
            afisareEroare(res, 2);
        } else {
            res.render("pagini/produse", { produse: rez.rows, optiuni: [] });
        }
    });
});

app.get("/produs/:id", function (req, res) {
    client.query(
        `select * from prajituri where id=${req.params.id}`,
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

vect_foldere = ["temp", "temp1", "backup"];
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
                obGlobal.folderBackup,
                "resurse/css",
                numeFisCssBackup +
                    "_" +
                    new Date().getTime() +
                    "." +
                    numeFisCss.split(".")[1]
            )
        ); // +(new Date()).getTime()
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
    }
}

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
