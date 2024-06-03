//setCookie("a",10, 1000)
function setCookie(nume, val, timpExpirare) {
    //timpExpirare in milisecunde
    d = new Date();
    d.setTime(d.getTime() + timpExpirare);
    document.cookie = `${nume}=${val}; expires=${d.toUTCString()}`;
}

function getCookie(nume) {
    vectorParametri = document.cookie.split(";"); // ["a=10","b=ceva"]
    for (let param of vectorParametri) {
        if (param.trim().startsWith(nume + "=")) return param.split("=")[1];
    }
    return null;
}

function deleteCookie(nume) {
    console.log(`${nume}; expires=${new Date().toUTCString()}`);
    document.cookie = `${nume}=0; expires=${new Date().toUTCString()}`;
}

function deleteAllCookies() {
    vectorParametri = document.cookie.split(";");
    for (let param of vectorParametri) {
        numeCookie = param.split("=")[0];
        console.log(`${numeCookie}; expires=${new Date().toUTCString()}`);
        document.cookie = `${numeCookie}=0; expires=${new Date().toUTCString()}`;
    }
}

window.addEventListener("load", function () {
    setCookie("ultima_pagina_accesata", document.URL.split("/").pop(), 60000);
    if (getCookie("acceptat_banner")) {
        document.getElementById("banner").style.display = "none";
    }

    this.document.getElementById("ok_cookies").onclick = function () {
        setCookie("acceptat_banner", true, 60000);
        document.getElementById("banner").style.display = "none";
    };

    for (let i = 1; i <= 18; i++) {
        if (getCookie("acordeon" + i)) {
            document
                .getElementById("container-accordion-body" + i)
                .classList.remove("collapse");
            document
                .getElementById("afiseaza-detalii" + i)
                .classList.remove("collapsed");
            document
                .getElementById("afiseaza-detalii" + i)
                .setAttribute("aria-expanded", "true");
            document.getElementById(
                "container-accordion-body" + i
            ).style.display = "block";
        }

        this.document.getElementById("afiseaza-detalii" + i).onclick =
            function () {
                if (!getCookie("acordeon" + i)) {
                    setCookie("acordeon" + i, true, 60000);
                    document
                        .getElementById("container-accordion-body" + i)
                        .classList.remove("collapse");
                    document
                        .getElementById("afiseaza-detalii" + i)
                        .classList.remove("collapsed");
                    document
                        .getElementById("afiseaza-detalii" + i)
                        .setAttribute("aria-expanded", "true");
                    document.getElementById(
                        "container-accordion-body" + i
                    ).style.display = "block";
                } else {
                    deleteCookie("acordeon" + i);
                    document
                        .getElementById("container-accordion-body" + i)
                        .classList.add("collapse");
                    document
                        .getElementById("afiseaza-detalii" + i)
                        .classList.add("collapsed");
                    document
                        .getElementById("afiseaza-detalii" + i)
                        .setAttribute("aria-expanded", "false");
                    document.getElementById(
                        "container-accordion-body" + i
                    ).style.display = "none";
                }
            };
    }
});

window.addEventListener("DOMContentLoaded", function () {
    document.getElementById("ultima-pagina-accesata").innerHTML = getCookie(
        "ultima_pagina_accesata"
    );
});
