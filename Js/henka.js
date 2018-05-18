/**
 * @projectDescription henka.js
 * Define namespace henka.
 *
 * @author HenkaDev, tienhai.nguyen@gmail.com
 *         https://github.com/TienHai/HenkaPetanque
 * @version 0.4
 *
 *
 * 0.4 (18/05/2018):
 *  - Refonte complete du tirage des matches pour doublette et triplette.
 * 0.3 (22/03/2018):
 *  - commencement de la gestion du type de partie doublette tournante. 
 * 0.2 (15/10/2017):
 *  - Gestion d'un nombre d'equipes impair. 
 *  - Gestion des boutons d'action.
 *  - Ajout d'un dialogue de confirmation d'action.
 * 0.1 (10/10/2017):
 *  - Initial release.
 */

/**
 *
 * Copyright (C) HenkaDev, Noisiel, 2018. All rights reserved.
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
        0: "En preparation",
        1: "En cours",
        2: "Terminer"
    };

    $.henka.concoursType = {
        0: "Doublette",
        1: "Triplette",
        2: "Tournante"
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

        /**
	 *
	 */
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

        /**
	 *
	 */
        generateParties: function(concoursId, concours) {
            if (concours.type == 2) {
                return this.makePartiesForTournante(concoursId, concours).parties;
            }
           
            return this.makeParties(concoursId, concours);
        },

	/**
	 *
	 */
        makePartiesForTournante: function(concoursId, concours) {
            var valid = true;
	    var parties = {};
            var concours_equipes = $.henka.storage.loadStorage($.henka.keys.concours_equipes);
            var equipes = concours_equipes[concoursId];

            for (var i = 0; i < concours.partie; i++) {
                var partie = {};
                var keys = Object.keys(equipes).slice();
                for (var j = 0; j < Object.keys(equipes).length/4; j++) {
                    $.shuffle(keys);
		    var res = this.makeEquipeTournante(parties, equipes, keys);
		    var equipeA = res.equipe; 
		    keys = res.keys;
		    res = this.makeEquipeTournante(parties, equipes, keys);
	            var equipeB = res.equipe;
		    keys = res.keys;
                    partie[j] = {"equipeA": equipeA, "equipeB": equipeB};

            	}
                parties[i] = partie;
            }

            return {"valid": valid, "parties":parties};
	},

	/**
 	*
	*/
	makeEquipeTournante: function(parties, equipes, keys) {
	    var pos = 1;
	    var equipe = $.extend(true, {}, equipes[keys[0]]);
	    equipe.firstId = keys[0];
	    if (equipes[keys[pos]]) {
		equipe.secondId = keys[pos];
		equipe.name = equipe.name + " / " + equipes[keys[pos]].name;
	    }
	    var validate = this.validateEquipeTournante(parties, equipe);
	    while (!validate) {
		pos += 1;
		if (pos > keys.length -1) {
		    pos -= 1;
		    break;
		}
		equipe.secondId = keys[pos];
		equipe.name = equipes[keys[0]].name + " / " + equipes[keys[pos]].name; 
		validate = this.validateEquipeTournante(parties, equipe);
	    }
		
	    keys.splice(pos, 1);
	    keys.splice(0, 1);
	
	    return {"equipe": equipe, "keys": keys};
	},

	/**
 	*
	*/
	validateEquipeTournante: function(parties, equipe) {
	    var pair = [equipe.firstId, equipe.secondId];
            $(parties).each( function(key, partie) {
                $(partie).each( function(k, v) {
		    if (v.equipeA) {
                        if (($.inArray(v.equipeA.firstId, versus) !== -1 && 
                            $.inArray(v.equipeA.secondId, versus) !== -1) ||
		   	    ($.inArray(v.equipeB.firstId, versus) !== -1 && 
			    $.inArray(v.equipeB.secondId, versus) !== -1)) {
                          
		            return false;
                        }
		    }
                });
            });
            return true;
	},

        /**
	 *  {
	 *    "parti_index": {
	 *       "match_index": {
	 *         "equipeA": {"name": "equipe_name", "equipeId": "equipe_index"},
	 *         "equipeB": {"name": "equipe_name", "equipeId": "equipe_index"}
	 *       }
	 *
	 *       "match_index + 1": {...}
	 *    }
	 *    
	 *    "parti_index +1 ": {...}
	 *  }
	 *
	 */
        makeParties: function(concoursId, concours) {
            var parties = {};
            var concours_equipes = $.henka.storage.loadStorage($.henka.keys.concours_equipes);
	    var equipes = $.map(concours_equipes[concoursId], function(value, index) {
       	        return {"name": value.name, "equipeId": index};
            });
	    var matrice = this.createMatrice(equipes);
            var matches = this.createMatches(matrice);
            for (var i = 0; i < concours.partie; i++) {
                var partie = {};
		for (var j = 0; j < matches[i].length; j++) {
		    if (matches[i][j][0] === null)
		       partie[j] = {"equipeA": matches[i][j][1], "equipeB": matches[i][j][0]};
		    else
		       partie[j] = {"equipeA": matches[i][j][0], "equipeB": matches[i][j][1]};
		}
                parties[i] = partie;
	    }

            return parties;
        },

	createMatrice: function(equipes) {
	    if (equipes.length%2 != 0)
	        equipes.push(null);
            equipes = $.shuffle(equipes);
            var array = Array();
	    for (var i = 1; i < equipes.length; i++) {
		if (array.length === 0)
		    array.push(this.row(equipes));
		else
		    array.push(this.row(array[array.length-1]));
	    }

	    return array;
	},
 
	row: function(array) {
            var tmp = Array();
            tmp.push(array[0]);
            for (var i = 2; i < array.length; i++) {
                tmp.push(array[i]);
	    }
            tmp.push(array[1]);

            return tmp;
       },

       createMatches: function(matrice) {
           var matches = Array();
           for (var i = 0; i < matrice.length; i++) {
              var match = Array();
              for (var j = 0; j < matrice[i].length/2; j++) {
                 var tmp = Array();
                 tmp.push(matrice[i][j]);
                 tmp.push(matrice[i][(matrice[i].length - 1) - j]);
                 match.push(tmp);
              }
    
              matches.push($.shuffle(match));
          }

          return $.shuffle(matches);
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
