// import * as cookies from "./cookies.js";

function filtrare() {
    var inpSpec = document
        .getElementById("inp-spec")
        .value.trim()
        .toLowerCase();

    var inpPret = parseInt(document.getElementById("inp-pret").value);

    var vRadio = document.getElementsByName("gr_rad");
    var inpResigilat;

    for (let r of vRadio) {
        if (r.checked) {
            inpResigilat = r.value;
            break;
        }
    }

    var vCheck = document.getElementsByName("gr_check");
    var inpBrand = [];

    for (let c of vCheck) {
        if (c.checked) inpBrand.push(c.value);
    }

    var inpCuloare = document
        .getElementsByName("inp-culoare")[0]
        .value.trim()
        .toLowerCase();

    if (!inpCuloare.match(new RegExp("^[A-Za-z]*$"))) {
        alert("Culoarea trebuie sa contina doar litere!");
        // document.getElementsByName("inp-culoare")[0].value = "";
        // inpCuloare = "";
        document.getElementById("inp-culoare").classList.add("is-invalid");
        document.getElementById("label-culoare-invalida").innerHTML =
            "Culoare invalida!";
        document.getElementById("container-inputuri").focus();
        return;
    }

    document.getElementById("inp-culoare").classList.remove("is-invalid");
    document.getElementById("label-culoare-invalida").innerHTML = "";
    var inpDescriere = document
        .getElementById("inp-descriere")
        .value.trim()
        .toLowerCase();

    var inpCateg = document
        .getElementById("inp-categorie")
        .value.trim()
        .toLowerCase();

    var arrayValNedorite = document.getElementById(
        "inp-valori-nedorite"
    ).options;

    var inpNedorite = [];

    for (let valoareNedorita of arrayValNedorite) {
        if (valoareNedorita.selected) {
            // if (
            //     (inpSpec != "" &&
            //         inpSpec.match(valoareNedorita.value.toLowerCase())) ||
            //     valoareNedorita.value.toLowerCase().match(inpSpec)
            // )
            if (
                inpSpec.length != 0 &&
                (valoareNedorita.value.toLowerCase().includes(inpSpec) ||
                    inpSpec.includes(valoareNedorita.value.toLowerCase()))
            ) {
                alert(
                    "Combinatia de specificatii si valori nedorite nu este permisa!"
                );
                document.getElementById("inp-spec").classList.add("is-invalid");
                document.getElementById("label-spec-invalida").innerHTML =
                    "Combinatie invalida!";
                // document.getElementById("inp-spec").value = "";
                // inpSpec = "";
                // valoareNedorita.selected = false;
                document.getElementById("container-inputuri").focus();
                return;
            }
            inpNedorite.push(valoareNedorita.value.toLowerCase());
        }
    }
    document.getElementById("inp-spec").classList.remove("is-invalid");
    document.getElementById("label-spec-invalida").innerHTML = "";

    setCookie("inpSpec", document.getElementById("inp-spec").value, 60000);
    setCookie("inpPret", document.getElementById("inp-pret").value, 60000);
    setCookie("inpResigilat", inpResigilat, 60000);
    setCookie("inpBrand", inpBrand, 60000);
    setCookie(
        "inpCuloare",
        document.getElementsByName("inp-culoare")[0].value,
        60000
    );
    setCookie(
        "inpDescriere",
        document.getElementById("inp-descriere").value,
        60000
    );
    setCookie(
        "inpCateg",
        document.getElementById("inp-categorie").value,
        60000
    );
    setCookie("inpNedorite", inpNedorite, 60000);

    var produse = document.getElementsByClassName("produs");

    for (let produs of produse) {
        let cond1 = false;
        let valSpec = produs
            .getElementsByClassName("val-specificatii")[0]
            .innerHTML.trim()
            .toLowerCase();
        let arraySpec = valSpec.split(",");
        for (let spec of arraySpec) {
            if (spec.includes(inpSpec)) {
                cond1 = true;
                break;
            }
        }

        let valPret = parseInt(
            produs.getElementsByClassName("val-pret")[0].innerHTML
        );
        let cond2 = valPret >= inpPret;

        let valCuloare =
            produs.getElementsByClassName("val-culoare")[0].innerHTML;
        let cond3 = inpCuloare == valCuloare || inpCuloare == "";

        let valResigilat =
            produs.getElementsByClassName("val-resigilat")[0].innerHTML;
        let cond4 = inpResigilat == "toate" || inpResigilat == valResigilat;

        let valBrand = produs.getElementsByClassName("val-brand")[0].innerHTML;
        let cond5 = false;

        for (let brand of inpBrand) {
            if (brand == valBrand) {
                cond5 = true;
                break;
            }
        }

        let valDescriere =
            produs.getElementsByClassName("val-descriere")[0].innerHTML;
        let cond6 = valDescriere.toLowerCase().includes(inpDescriere);

        let valCategorie = produs
            .getElementsByClassName("val-categorie")[0]
            .innerHTML.trim()
            .toLowerCase();
        let cond7 = inpCateg == "toate" || inpCateg == valCategorie;

        let cond8 = true;
        for (let specNedorita of inpNedorite) {
            for (let spec of arraySpec) {
                if (spec.includes(specNedorita)) {
                    cond8 = false;
                    break;
                }
            }
            if (!cond8) break;
        }

        if (
            cond1 &&
            cond2 &&
            cond3 &&
            cond4 &&
            cond5 &&
            cond6 &&
            cond7 &&
            cond8
        ) {
            produs.style.display = "block";
        } else {
            produs.style.display = "none";
        }
    }

    let niciunProdusAfisat = true;

    for (let produs of produse) {
        if (produs.style.display == "block") {
            niciunProdusAfisat = false;
        }
    }

    if (niciunProdusAfisat) {
        document.getElementById("msg-produse").style.display = "block";
    } else {
        document.getElementById("msg-produse").style.display = "none";
    }
}

window.addEventListener("load", function () {
    // console.log(document.getElementById("produse").innerHTML);
    // this.document.getElementById("filtrare").onclick = function(){}

    document.getElementById("ckbox-filtre").onchange = function () {
        // console.log("Checkbox-ul a fost apasat!");
        if (!document.getElementById("ckbox-filtre").checked) {
            deleteCookie("salveaza-filtre");
            deleteCookie("inpSpec");
            deleteCookie("inpPret");
            deleteCookie("inpResigilat");
            deleteCookie("inpBrand");
            deleteCookie("inpCuloare");
            deleteCookie("inpDescriere");
            deleteCookie("inpCateg");
            deleteCookie("inpNedorite");
        } else setCookie("salveaza-filtre", true, 60000);
    };

    if (getCookie("salveaza-filtre")) {
        // console.log("Salveaza filtre!!!!");
        document.getElementById("ckbox-filtre").checked = true;
        document.getElementById("inp-spec").value = getCookie("inpSpec");
        document.getElementById("inp-pret").value = getCookie("inpPret")
            ? getCookie("inpPret")
            : 0;
        document.getElementById("infoRange").innerHTML = getCookie("inpPret")
            ? "(" + getCookie("inpPret") + ")"
            : document.getElementById("infoRange").innerHTML;
        var vRadio = document.getElementsByName("gr_rad");
        for (let r of vRadio) {
            if (r.value == getCookie("inpResigilat")) {
                r.checked = true;
                break;
            }
        }

        var vCheck = document.getElementsByName("gr_check");

        for (let c of vCheck) {
            if (!getCookie("inpBrand").includes(c.value)) c.checked = false;
        }

        document.getElementsByName("inp-culoare")[0].value =
            getCookie("inpCuloare");

        document.getElementById("inp-descriere").value =
            getCookie("inpDescriere");

        document.getElementById("inp-categorie").value = getCookie("inpCateg");

        var arrayValNedorite = document.getElementById(
            "inp-valori-nedorite"
        ).options;

        for (let valNedorita of arrayValNedorite) {
            if (
                getCookie("inpNedorite").includes(
                    valNedorita.value.toLowerCase()
                )
            )
                valNedorita.selected = true;
        }

        filtrare();
    }

    document.getElementById("inp-spec").onchange = function () {
        filtrare();
    };

    document.getElementById("inp-pret").onchange = function () {
        document.getElementById("infoRange").innerHTML = `(${this.value})`;
        filtrare();
    };

    for (let i = 0; i <= 2; ++i)
        document.getElementsByName("gr_rad")[i].onchange = function () {
            filtrare();
        };

    for (let i = 0; i <= 7; ++i) {
        document.getElementsByName("gr_check")[i].onchange = function () {
            filtrare();
        };
    }

    document.getElementsByName("inp-culoare")[0].onchange = function () {
        filtrare();
    };

    document.getElementById("inp-descriere").onchange = function () {
        filtrare();
    };

    document.getElementById("inp-categorie").onchange = function () {
        filtrare();
    };

    document.getElementById("inp-valori-nedorite").onchange = function () {
        filtrare();
    };

    document.getElementById("filtrare").addEventListener("click", filtrare);

    document.getElementById("resetare").onclick = function () {
        var afirmativ = confirm("Esti sigur ca vrei sa resetezi filtrele?");
        if (afirmativ) {
            document.getElementById("msg-produse").style.display = "none";
            document.getElementById("ckbox-filtre").checked = false;

            deleteCookie("salveaza-filtre");
            deleteCookie("inpSpec");
            deleteCookie("inpPret");
            deleteCookie("inpResigilat");
            deleteCookie("inpBrand");
            deleteCookie("inpCuloare");
            deleteCookie("inpDescriere");
            deleteCookie("inpCateg");
            deleteCookie("inpNedorite");

            document.getElementById("inp-spec").value = "";

            document.getElementById("inp-pret").value =
                document.getElementById("inp-pret").min;
            document.getElementById("infoRange").innerHTML =
                "(" + document.getElementById("inp-pret").min + ")";

            document.getElementById("inp-culoare").value = "";
            document
                .getElementById("inp-culoare")
                .classList.remove("is-invalid");
            document.getElementById("label-culoare-invalida").innerHTML = "";

            document.getElementById("i_rad3").checked = true;

            for (let i = 1; i <= 8; ++i) {
                document.getElementById("i_check" + i).checked = true;
            }

            document.getElementById("inp-descriere").value = "";

            document.getElementById("inp-categorie").value = "toate";

            var arrayValNedorite = document.getElementById(
                "inp-valori-nedorite"
            ).options;

            for (let valoareNedorita of arrayValNedorite) {
                valoareNedorita.selected = false;
            }

            var produse = document.getElementsByClassName("produs");
            for (let prod of produse) {
                prod.style.display = "block";
            }
        }
    };

    function sorteaza(semn) {
        var produse = document.getElementsByClassName("produs");
        var v_produse = Array.from(produse);
        v_produse.sort(function (a, b) {
            let brand_a = a.getElementsByClassName("val-brand")[0].innerHTML;
            let brand_b = b.getElementsByClassName("val-brand")[0].innerHTML;
            if (brand_a == brand_b) {
                let pret_a = parseInt(
                    a.getElementsByClassName("val-pret")[0].innerHTML
                );
                let pret_b = parseInt(
                    b.getElementsByClassName("val-pret")[0].innerHTML
                );
                // console.log(pret_a + " vs. " + pret_b);
                return semn * (pret_a - pret_b);
            }
            return semn * brand_a.localeCompare(brand_b);
        });
        for (let prod of v_produse) {
            prod.parentNode.appendChild(prod);
        }
    }

    document.getElementById("sortCrescBrand").onclick = function () {
        sorteaza(1);
    };

    document.getElementById("sortDescrescBrand").onclick = function () {
        sorteaza(-1);
    };

    document.getElementById("calculeazaMaxim").onclick = function () {
        var maxim = 0;
        var produse = document.getElementsByClassName("produs");
        for (let produs of produse) {
            var stil = getComputedStyle(produs);
            if (stil.display != "none") {
                maxim = Math.max(
                    parseFloat(
                        produs.getElementsByClassName("val-pret")[0].innerHTML
                    ),
                    maxim
                );
            }
        }
        if (!document.getElementById("par_maxim")) {
            let p = document.createElement("p");
            p.innerHTML = maxim + " RON";
            p.id = "par_maxim";
            let container = document.getElementById("produse");
            container.insertBefore(p, container.children[0]);
            setTimeout(function () {
                let par = document.getElementById("par_maxim");
                if (par) par.remove();
            }, 2000);
        }
    };
});
