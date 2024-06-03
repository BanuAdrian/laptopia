const Drepturi = require("./drepturi.js");

/**
 * Clasa de baza pentru roluri
 */
class Rol {
    /**
     * Returneaza tipul rolului
     * @returns {string} Tipul rolului
     */
    static get tip() {
        return "generic";
    }

    /**
     * Returneaza drepturile asociate rolului
     * @returns {Symbol[]} Drepturile rolului
     */
    static get drepturi() {
        return [];
    }

    /**
     * Creeaza o instanta a clasei Rol
     */
    constructor() {
        this.cod = this.constructor.tip;
    }

    /**
     * Verifica daca rolul are un anumit drept
     * @param {Symbol} drept - Dreptul de verificat
     * @returns {boolean} True daca rolul are dreptul specificat, false in caz contrar
     */
    areDreptul(drept) {
        // drept trebuie sa fie tot Symbol
        return this.constructor.drepturi.includes(drept);
    }
}

/**
 * Clasa pentru rolul de admin
 * @extends Rol
 */
class RolAdmin extends Rol {
    /**
     * Returneaza tipul rolului de admin
     * @returns {string} Tipul rolului de admin
     */
    static get tip() {
        return "admin";
    }

    /**
     * Creeaza o instanta a clasei RolAdmin
     */
    constructor() {
        super();
    }

    /**
     * Verifica daca rolul de admin are un anumit drept (intotdeauna true pentru admin)
     * @returns {boolean} True (adminul are toate drepturile)
     */
    areDreptul() {
        return true; // pentru ca e admin
    }
}

/**
 * Clasa pentru rolul de moderator
 * @extends Rol
 */
class RolModerator extends Rol {
    /**
     * Returneaza tipul rolului de moderator
     * @returns {string} Tipul rolului de moderator
     */
    static get tip() {
        return "moderator";
    }

    /**
     * Returneaza drepturile asociate rolului de moderator
     * @returns {Symbol[]} Drepturile rolului de moderator
     */
    static get drepturi() {
        return [Drepturi.vizualizareUtilizatori, Drepturi.stergereUtilizatori];
    }

    /**
     * Creeaza o instanta a clasei RolModerator
     */
    constructor() {
        super();
    }
}

/**
 * Clasa pentru rolul de client
 * @extends Rol
 */
class RolClient extends Rol {
    /**
     * Returneaza tipul rolului de client
     * @returns {string} Tipul rolului de client
     */
    static get tip() {
        return "comun";
    }

    /**
     * Returneaza drepturile asociate rolului de client
     * @returns {Symbol[]} Drepturile rolului de client
     */
    static get drepturi() {
        return [Drepturi.cumparareProduse];
    }

    /**
     * Creeaza o instanta a clasei RolClient
     */
    constructor() {
        super();
    }
}

/**
 * Design pattern factory pentru crearea de roluri
 */
class RolFactory {
    /**
     * Creeaza un rol in functie de tipul specificat
     * @param {string} tip - Tipul de rol (admin, moderator, comun)
     * @returns {Rol} O instanta a rolului corespunzator
     */
    static creeazaRol(tip) {
        switch (tip) {
            case RolAdmin.tip:
                return new RolAdmin();
            case RolModerator.tip:
                return new RolModerator();
            case RolClient.tip:
                return new RolClient();
        }
    }
}

module.exports = {
    RolFactory: RolFactory,
    RolAdmin: RolAdmin,
};
