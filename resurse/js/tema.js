if (localStorage.getItem("tema")) {
    document.body.classList.add("dark");
    document.getElementById("icon-tema").classList.add("bi-moon-fill");
    document.getElementById("icon-tema").classList.remove("bi-sun-fill");
    document.getElementById("switch-tema").checked = true;
} else {
    document.body.classList.remove("dark");
    document.getElementById("icon-tema").classList.remove("bi-moon-fill");
    document.getElementById("icon-tema").classList.add("bi-sun-fill");
    document.getElementById("switch-tema").checked = false;
}

window.addEventListener("DOMContentLoaded", function () {
    document.getElementById("schimba_tema").onclick = function () {
        if (document.body.classList.contains("dark")) {
            document.body.classList.remove("dark");
            localStorage.removeItem("tema");
            document
                .getElementById("icon-tema")
                .classList.remove("bi-moon-fill");
            document.getElementById("icon-tema").classList.add("bi-sun-fill");
            document.getElementById("switch-tema").checked = false;
        } else {
            document.body.classList.add("dark");
            localStorage.setItem("tema", "dark");
            document.getElementById("icon-tema").classList.add("bi-moon-fill");
            document
                .getElementById("icon-tema")
                .classList.remove("bi-sun-fill");
            document.getElementById("switch-tema").checked = true;
        }
    };
});

window.addEventListener("DOMContentLoaded", function () {
    document.getElementById("switch-tema").onclick = function () {
        if (document.body.classList.contains("dark")) {
            document.body.classList.remove("dark");
            localStorage.removeItem("tema");
            document
                .getElementById("icon-tema")
                .classList.remove("bi-moon-fill");
            document.getElementById("icon-tema").classList.add("bi-sun-fill");
            document.getElementById("switch-tema").checked = false;
        } else {
            document.body.classList.add("dark");
            localStorage.setItem("tema", "dark");
            document.getElementById("icon-tema").classList.add("bi-moon-fill");
            document
                .getElementById("icon-tema")
                .classList.remove("bi-sun-fill");
            document.getElementById("switch-tema").checked = true;
        }
    };
});
