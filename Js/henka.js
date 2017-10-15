/**
 * @projectDescription henka.js
 * Define namespace henka.
 *
 * @author HenkaDev, tienhai.nguyen@gmail.com
 *         https://github.com/TienHai/HenkaPetanque
 * @version 0.2
 *
 *
 * 0.2 (15/10/2014):
 *  - Gestion d'un nombre d'equipes impair. 
 *  - Gestion des boutons d'action.
 *  - Ajout d'un dialogue de confirmation d'action.
 * 0.1 (10/10/2017):
 *  - Initial release.
 */

/**
 *
 * Copyright (C) HenkaDev, Noisiel, 2017. All rights reserved.
 *
 */


/*jshint globalstrict: true*/
/*global jQuery: true */
/*global localStorage: true */
/*global document: true */


"use strict";

(function ($) {

    if (!$.henka)
        $.henka = {};

    $.henka.keys = {
        sequence: "hk_sequence",
        player: "hk_players",
        concours: "hk_concours",
        concours_equipes: "hk_concours_equipes",
        concours_parties: "hk_concours_parties"
    };

    $.henka.concoursStatus = {
        0: "En préparation",
        1: "En cours",
        2: "Terminer"
    };

    $.henka.concoursType = {
        0: "doublette",
        1: "triplette"
    };

    $.henka.storage = {

        addPlayer: function(data) {
            var key = $.henka.keys.player;
            var res = this.loadStorage(key);
            if (!res) {
                res = [];
            } else {
                // FIXME : Verifier que le player n'est pas present.
            }
            res.push(data);
            this.saveStorage(key, res);
            return res.length - 1;
        },

        addConcours: function(data) {
            var key = $.henka.keys.concours;
            var nextId = this.getNextId(key);

            var res = this.loadStorage(key);
            if (!res)
                res = {};
            res[nextId] = data;
            this.saveStorage(key, res);
            return true;
        },

        addConcoursEquipe: function(concoursId, data) {
            var key = $.henka.keys.concours_equipes;
            var res = this.loadStorage(key);
            if (!res) {
                res = {};
                res[concoursId] = {0: data};
            } else {
                if (!res[concoursId]) {
                    res[concoursId] = {0: data};
                } else {
                    var keys = Object.keys(res[concoursId]).sort();
                    res[concoursId][keys.length] = data;
                }
            }
            this.saveStorage(key, res);
            return true;
        },

        addConcoursParties: function(concoursId, data) {
            var key = $.henka.keys.concours_parties;
            var res = this.loadStorage(key);
            if (!res)
                res = {};
            res[concoursId] = data;
            this.saveStorage(key, res);
            return true;
        },

        addConcoursPartieScore: function(concoursId, partieId, rowId, data) {
            var key = $.henka.keys.concours_parties;
            var res = this.loadStorage(key);
            if (!res)
                return;
            var parties = res[concoursId];
            var partie = parties[partieId];
            var versus = partie[rowId];

            //
            versus.equipeA.score = data.equipeA;
            versus.equipeB.score = data.equipeB;

            //
            partie[rowId] = versus;
            this.saveStorage(key, res);
            return true;
        },

        modifyConcoursPartieScore: function(concoursId, partieId, rowId, data) {
            var key = $.henka.keys.concours_parties;
            var res = this.loadStorage(key);
            var parties = res[concoursId];
            var partie = parties[partieId];
            var versus = partie[rowId];

            //
            versus.equipeA.score = data.equipeA;
            versus.equipeB.score = data.equipeB;

            //
            partie[rowId] = versus;
            this.saveStorage(key, res);
            return true;
        },

        modifyConcours: function(concoursId, data) {
            var key = $.henka.keys.concours;
            var res = this.loadStorage(key);
            res[concoursId] = data;
            this.saveStorage(key, res);
            return true;
        },

        modifyConcoursEquipe: function(concoursId, equipeId, data) {
            var key = $.henka.keys.concours_equipes;
            var res = this.loadStorage(key);
            if (!res)
                return;
            var equipes = res[concoursId];
            if (!equipes)
                return;
            equipes[equipeId] = data;
            res[concoursId] = equipes;
            this.saveStorage(key, res);
            return true;
        },

        loadStorage: function(key) {
            var data = null;
            if (this.isLocalStorageEnable()) {
                data = localStorage.getItem(key);
            } else {
                data = this.readCookie(key);
            }
            return JSON.parse(data);
        },

        saveStorage: function(key, data) {
            if (this.isLocalStorageEnable()) {
                localStorage.setItem(key, JSON.stringify(data));
            } else {
                this.writeCookie(key, JSON.stringify(data), null);
            }
        },

        clearStorage: function() {
        },

        getNextId: function(key) {
            var nextId = 0;
            var sequence = this.loadStorage($.henka.keys.sequence);
            if (sequence) {
                if (sequence[key])
                    nextId = sequence[key];
            } else {
                sequence = {}
            }
            sequence[key] = nextId + 1;
            this.saveStorage($.henka.keys.sequence, sequence);
            return nextId;
        },

        /**
         * Define if we have localStorage.
         */
        isLocalStorageEnable: function() {
            if (typeof localStorage !== "undefined" && localStorage !== null)
                return true;
            return false;
        },

        /**
         * Write a cookie
         *
         * @param {String} name: Data name.
         * @param {String} value: Data value.
         * @param {Date} dt: Date value.
         */
        writeCookie: function(name, value, dt) {
            var date = dt;
            if (date === null) {
                date = new Date();
                date.setTime(date.getTime()+(365*24*3600));
            }
            var expires = "; expires="+date.toGMTString();
            document.cookie = name+"="+value+expires+"; path=/";
        },

        /**
         * Read a cookie
         * 
         * @param {String} name: Data name.
         * @return String
         */
        readCookie: function(name) {
            var nameEQ = name + "=";
            var ca = document.cookie.split(';');
            for(var i=0;i < ca.length;i++) {
                var c = ca[i];
                while (c.charAt(0)==' ') c = c.substring(1,c.length);
                if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length,c.length);
            }
            return null;
        },

        formatedDate: function(dt) {
            var d = new Date(dt);
            var day = d.getDate();
            var month = d.getMonth() + 1;
            var year = d.getFullYear();
            if (day < 10) {
                day = "0" + day;
            }
            if (month < 10) {
                month = "0" + month;
            }
            var date = day + "/" + month + "/" + year;

            return date;
        },

        generateParties: function(concoursId, concours) {
            var res = this.makeParties(concoursId, concours);
            var count = 0;
            while (!res.valid) {
                res = this.makeParties(concoursId, concours);
                if (count > 100)
                    break;
                count += 1;
            }
            return res.parties;
        },

        makeParties: function(concoursId, concours) {
            var valid = true;
            var parties = {};
            var concours_equipes = $.henka.storage.loadStorage($.henka.keys.concours_equipes);
            var equipes = concours_equipes[concoursId];
            for(var i = 0; i < concours.partie; i++) {
                var partie = {};
                var keys = Object.keys(equipes).slice();
                for (var j = 0; j < Object.keys(equipes).length/2; j++) {
                    $.shuffle(keys);
                    var pos = 1;
                    var equipeA = equipes[keys[0]];
                    equipeA.equipeId = keys[0];
                    var equipeB = equipes[keys[pos]];
                    if (equipeB)
                        equipeB.equipeId = keys[pos];
                    var validate = this.validateVersus(parties, equipeA, equipeB);
                    while (!validate) {
                        pos += 1;
                        if (pos > keys.length -1) {
                            valid = false;
                            pos -= 1;
                            break;
                        }
                        equipeA = equipes[keys[0]]; 
                        equipeA.equipeId = keys[0];
                        equipeB = equipes[keys[pos]]; 
                        equipeB.equipeId = keys[pos];
                        validate = this.validateVersus(parties, equipeA, equipeB);
                    }
                    if (equipeB !== undefined) {
                        partie[j] = {"equipeA": equipeA, "equipeB": equipeB};
                        keys.splice(pos, 1);
                        keys.splice(0, 1);
                    }
                }
                // Si le nombre d'equipes est impair, on ajoute l'equipe restante avec 
                // comme score 13-7
                if (keys.length > 0) {
                    partie[Object.keys(partie).length] = {"equipeA": equipes[keys[0]], "equipeB": null};
                }

                parties[i] = partie;
            }
            return {"valid": valid, "parties":parties};
        },

        validateVersus: function(parties, equipeA, equipeB) {
            var versus = [equipeA, equipeB];
            $(parties).each( function(key, partie) {
                $(partie).each( function(k, v) {
                    if (v.equipeA)
                    if ($.inArray(v.equipeA, versus) !== -1 && 
                        $.inArray(v.equipeB, versus) !== -1) {
                            return false;
                    }
                });
            });
            return true;
        }

    };

}(jQuery));


/* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ shuffle ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
(function ($) {

"use strict";

/**
 * To shuffle all <li> elements within each '.member' <div>:
 * $(".member").shuffle("li");
 *
 * To shuffle all children of each <ul>:
 * $("ul").shuffle();
*/
$.fn.shuffle = function(selector) {
    var $elems = selector ? $(this).find(selector) : $(this).children(),
        $parents = $elems.parent();

    $parents.each(function(){
        $(this).children(selector).sort(function() {
            return Math.round(Math.random()) - 0.5;
        }).detach().appendTo(this);
    });

    return this;
};

/**
 * To shuffle an array
 */
$.shuffle = function(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
};

})(jQuery);
