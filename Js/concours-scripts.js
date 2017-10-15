/**
 * @projectDescription scripts.js
 * Javascript serris petanque app.
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
/*global window: true */
/*global location: true */


"use strict";

(function () {
    var windowLoaded = false;

    jQuery(window).on("load", function () {
        windowLoaded = true;
    });

    jQuery(function ($) {

        // --------------------------------------------------------------------
        // Init
        var vars = {};
        var query = location.search.split("?");
        for (var i = 0; i < query.length; i++) {
            if (!query[i])
                continue;
            var hash = query[i].split("=");
            vars[hash[0]] = hash[1];
        }
        if (!vars.concoursId)
            return;
        var concours = $.henka.storage.loadStorage($.henka.keys.concours);
        vars.concours = concours[vars.concoursId];

        // Text du header
        $("#header").text(
            $.henka.storage.formatedDate(vars.concours.date)
            + " - "
            + vars.concours.name 
            + " / "
            + $.henka.concoursType[vars.concours.type]
            + " (" 
            + $.henka.concoursStatus[vars.concours.status] 
            + ")");

        // Gestion des boutons
        if (vars.concours.status === 0) {
            $(".bBegin").removeClass("hidden");
        } else { 
            if (vars.concours.status === 1) {
                $(".bNewEquipe").addClass("hidden");
                $(".bFinish").removeClass("hidden");
            } else {
                $(".bNewEquipe").addClass("hidden");
            }
            loadParties();
        }

        // Chargement des equipes
        loadClassement();

        // --------------------------------------------------------------------
        // Events

        // Accueil
        var $bAccueil = $(".bAccueil");
        $bAccueil.on("click", function() {
            window.location = "index.html";
        });

        // Add/Modify equipe
        $(".bNewEquipe").on("click", function() {
            onNewEquipe();
        });
        $(".bAddEquipe").on("click", function() {
            onAddEquipe();
        });
        $(".bModifyEquipe").on("click", function() {
            onModifyEquipe();
        });
        $(".bCancelAddEquipe").on("click", function() {
            onCloseDialogNewEquipe();
        });

        // Add/Modify score
        $(".bCancelAddScore").on("click", function() {
            onCloseDialogNewScore();
        });
        $(".bAddScore").on("click", function() {
            onAddScore();
        });
        $(".bModifyScore").on("click", function() {
            onModifyScore();
        });

        // Commencer
        $(".bBegin").on("click", function() {
            onConfirm("Commencer le concours", onBeginConcours);
        });

        // Terminer
        $(".bFinish").on("click", function() {
            onConfirm("Terminer le concours", onFinishConcours);
        });

        // --------------------------------------------------------------------
        // Init Functions

        /**
         * Chargement et classement des equipes.
         */
        function loadClassement() {
            var $tbClassement = $("#classement");
            var concours_equipes = $.henka.storage.loadStorage($.henka.keys.concours_equipes);
            if (!concours_equipes)
                return;
            var equipes = concours_equipes[vars.concoursId];
            if (!equipes)
                return;

            // Chargement des equipes
            var equipeIds = Object.keys(equipes).sort();
            var classement = [];
            for(var i = 0; i < equipeIds.length; i++) {
                var equipeId = equipeIds[i];
                var res = createClassementEquipeRow(equipeId, equipes[equipeId]);
                classement.push(res);
            }

            // Trie des equipes par leur classement
            classement.sort( function(a, b) {
                if (a.points === b.points) {
                    if (a.diff === b.diff) {
                        return a.name < b.name ? 1 : -1;
                    }
                    return a.diff > b.diff ? 1 : -1;
                }
                return a.points > b.points ? 1 : -1;
            });
            classement.reverse();

            for (var i = 0; i < classement.length; i++)
                $tbClassement.append(classement[i].tr);

            // Events Modfiy Equipes 
            if (vars.concours.status !== 0)
                return;
            $("#classement tr").off("click");
            $("#classement tr").on("click", function() {
                var $tr = $(this);
                if ($tr.find("th").length > 0)
                    return;
                onEditEquipe($tr.data("equipeId"));
            });
        }

        /**
         * Mise a jour de la table contenant les equipes du concours.
         */
        function updateEquipes() {
            var $tbClassement = $("#classement");
            var concours_equipes = $.henka.storage.loadStorage($.henka.keys.concours_equipes);
            var equipes = concours_equipes[vars.concoursId];
            var equipeIds = Object.keys(equipes).sort();
            var equipeId = equipeIds.length - 1;
            var res = createClassementEquipeRow(equipeId, equipes[equipeId]);
            $tbClassement.append(res.tr);

            // Events Modfiy Equipes 
            $("#classement tr").off("click");
            $("#classement tr").on("click", function() {
                if (vars.concours.status !== 0)
                    return;
                var $tr = $(this);
                onEditEquipe($tr.data("equipeId"));
            });
        }

        /**
         * Creation d'une ligne representant le classement d'une equipe.
         */
        function createClassementEquipeRow(id, values) {
            var $tr = $("<tr>").data("equipeId", id);
            $tr.append($("<td class='equipeName'>").text(values.name));

            var points = 0, gagner = 0, perdu = 0, diff = 0;
            var data = $.henka.storage.loadStorage($.henka.keys.concours_parties);
            if (data && data[vars.concoursId]) {
                var parties = data[vars.concoursId];
                var partieIds = Object.keys(parties);
                for (var i = 0; i < partieIds.length; i++) {
                    var rows = parties[partieIds[i]];
                    var rowIds = Object.keys(rows);
                    for (var j = 0; j < rowIds.length; j++) {
                        var equipeA = rows[j].equipeA;
                        var equipeB = rows[j].equipeB;
                        if (!equipeB && equipeA.equipeId === id ) {
                            points += 1;
                            gagner += 1;
                            diff += 6;
                        } else if (equipeA.equipeId === id && equipeA.score) {
                            if (parseInt(equipeA.score,10) > parseInt(equipeB.score,10)) {
                                points += 1;
                                gagner += 1;
                            } else if (parseInt(equipeA.score,10) < parseInt(equipeB.score,10)) {
                                perdu += 1;
                            }
                            diff += parseInt(equipeA.score,10) - parseInt(equipeB.score,10);
                        } else if (equipeB && equipeB.equipeId === id && equipeB.score) {
                            if (parseInt(equipeB.score,10) > parseInt(equipeA.score,10)) {
                                points += 1;
                                gagner += 1;
                            } else if (parseInt(equipeB.score,10) < parseInt(equipeA.score,10)) {
                                perdu += 1;
                            }
                            diff += parseInt(equipeB.score,10) - parseInt(equipeA.score,10);
                        }
                    }
                }
            }
            $tr.append($("<td class='equipePts'>").addClass("txtCenter").text(points));
            $tr.append($("<td class='equipeG'>").addClass("txtCenter").text(gagner));
            $tr.append($("<td class='equipeP'>").addClass("txtCenter").text(perdu));
            if (diff > 0)
                $tr.append($("<td class='equipeDiff'>").addClass("txtCenter").text("+" + diff));
            else 
                $tr.append($("<td class='equipeDiff'>").addClass("txtCenter").text(diff));

            return {"tr": $tr, "name": values.name, "points":points, "diff":diff};
        }

        function loadParties() {
            var data = $.henka.storage.loadStorage($.henka.keys.concours_parties);
            if (!data)
                return;
            var parties = data[vars.concoursId];
            createPartiesRow(parties);
        }

        function createPartiesRow(parties) {
            var $parties = $("#parties");
            var keys = Object.keys(parties).sort();
            for(var i = 0; i < keys.length; i++) {
                var $partie = $("<div>").addClass("partie roundBlock");
                $partie.append($("<h2>").text("Partie " + (i+1)));
                var $table = $("<table>").addClass("tbPartie").data("partieId", keys[i]);
                var $trHeader = $("<tr>");
                $trHeader.append($("<th class='thEquipeA'>").text("Equipe A"));
                $trHeader.append($("<th class='thEquipeB'>").text("Equipe B"));
                $trHeader.append($("<th class='thScore'>").text("Score"));
                $table.append($trHeader);
                var k = Object.keys(parties[keys[i]]).sort();
                for (var j = 0; j < k.length; j++) {
                    var versus = parties[keys[i]][k[j]];
                    var equipeA = versus.equipeA; 
                    var equipeB = versus.equipeB;
                    var $tr = $("<tr>").data("rowId", j);
                    $tr.append($("<td>").data("equipe", "equipeA").text(equipeA.name));
                    if (equipeB) {
                        $tr.append($("<td>").data("equipe", "equipeB").text(equipeB.name));
                    } else {
                        $tr.append($("<td>").text("--"));
                        $tr.append($("<td class='score txtCenter'>").text("13 - 7"));
                    }
                    if (equipeA.score) {
                        $tr.append($("<td class='score txtCenter'>").text(equipeA.score + " - " + equipeB.score));
                    } else if (equipeB) {
                        $tr.append($("<td class='score txtCenter'>"));
                    } 
                    $table.append($tr);
                }
                $partie.append($table);
                $parties.append($partie);
            }

            // Events Partie - Add score 
            if (vars.concours.status === 2)
                return;
            $(".tbPartie tr").on("click", function() {
                var $this = $(this);
                if ($this.find("th").length > 0)
                    return;
                var partieId = $this.parent().data("partieId");
                var rowId = $this.data("rowId");
                onNewScore(partieId, rowId);
            });
        }

        // --------------------------------------------------------------------
        // Call Functions

        //onConfirm - confirm before execute func.
        function onConfirm(action, func) {
            var $dialog = $(".confirmDialog");

            // Events
            $(".bConfirmOk").off("click");
            $(".bConfirmKo").off("click");

            $(".bConfirmOk").on("click", function() {
                $dialog.addClass("hidden");
                func();
            });
            $(".bConfirmKo").on("click", function() {
                $dialog.addClass("hidden");
            });

            $dialog.removeClass("hidden");
            $dialog.find(".doAction").text("\""+action+"\"");
        }

        // onCloseDialogNewEquipe - Close dialog add new equipe.
        function onCloseDialogNewEquipe() {
            var $dialog = $(".newEquipeDialog"); 
            $dialog.addClass("hidden");
            $dialog.find("input[name='equipeName']").val('');
            $dialog.find(".bAddEquipe").removeClass("hidden");
            $dialog.find(".bModifyEquipe").addClass("hidden");
        }

        // onNewEquipe - Open dialog add new equipe.
        function onNewEquipe() {
            var $dialog = $(".newEquipeDialog");
            $dialog.removeClass("hidden");
            $dialog.find("input[name='equipeName']").focus();
        }

        // onEditEquipe - Open dialog add edit equipe.
        function onEditEquipe(equipeId) {
            var $dialog = $(".newEquipeDialog");
            $dialog.data("modify", equipeId);
            $dialog.removeClass("hidden");

            var concours_equipes = $.henka.storage.loadStorage($.henka.keys.concours_equipes);
            var equipes = concours_equipes[vars.concoursId];
            var data = equipes[equipeId];

            $dialog.find("input[name='equipeName']").val(data.name).focus();
            $dialog.find(".bAddEquipe").addClass("hidden");
            $dialog.find(".bModifyEquipe").removeClass("hidden");
        }

        // onModifyEquipe - Modify a equipe.
        function onModifyEquipe() {
            var $dialog = $(".newEquipeDialog");
            var equipeId = $dialog.data("modify");

            var concours_equipes = $.henka.storage.loadStorage($.henka.keys.concours_equipes);
            var equipes = concours_equipes[vars.concoursId];
            var data = equipes[equipeId];

            data.name = $dialog.find("input[name='equipeName']").val();
            if (!data.name) {
                $dialog.find("input[name='equipeName']").focus();
                return;
            }

            if ($.henka.storage.modifyConcoursEquipe(vars.concoursId, equipeId, data)) {
                onCloseDialogNewEquipe();
                $("#classement tr").each(function() {
                    var $tr = $(this);
                    if ($tr.data("equipeId") !== equipeId)
                        return true;
                    $tr.find(".equipeName").text(data.name);
                    return false;
                });
            }
        }

        // onAddEquipe - Add a new equipe.
        function onAddEquipe() {
            var data = {};
            var $dialog = $(".newEquipeDialog");
            data.name = $dialog.find("input[name='equipeName']").val();
            if (!data.name) {
                $dialog.find("input[name='equipeName']").focus();
                return;
            }

            if ($.henka.storage.addConcoursEquipe(vars.concoursId, data)) {
                onCloseDialogNewEquipe();
                updateEquipes();
            }
        }

        // onBeginConcours - Begin the concours.
        function onBeginConcours() {
            var parties = $.henka.storage.generateParties(vars.concoursId, vars.concours);
            $.henka.storage.addConcoursParties(vars.concoursId, parties);
            createPartiesRow(parties);

            //
            $(".bNewEquipe").addClass("hidden");
            $(".bBegin").addClass("hidden");
            $(".bFinish").removeClass("hidden");

            //
            vars.concours.status = 1;
            $.henka.storage.modifyConcours(vars.concoursId, vars.concours);
        }

        // onFinishConcours - Finish concours.
        function onFinishConcours() {
            $(".bFinish").addClass("hidden");
            $(".tbPartie tr").off("click");

            // Update concours
            vars.concours.status = 2;
            $.henka.storage.modifyConcours(vars.concoursId, vars.concours);
        }

        // onCloseDialogNewScore - Close dialog add new score.
        function onCloseDialogNewScore() {
            var $dialog = $(".newScoreDialog"); 
            $dialog.addClass("hidden");
            $dialog.find("input[name='scoreEquipeA']").val('0');
            $dialog.find("input[name='scoreEquipeB']").val('0');
            $dialog.find(".bAddScore").removeClass("hidden");
            $dialog.find(".bModifyScore").addClass("hidden");
        }

        // onNewScore - Add a new score
        function onNewScore(partieId, rowId) {
            var data = $.henka.storage.loadStorage($.henka.keys.concours_parties);
            if (!data)
                return;
            var parties = data[vars.concoursId];
            var partie = parties[partieId];
            var versus = partie[rowId];
            if (!versus.equipeB)
                return;

            var $dialog = $(".newScoreDialog")
                .data("partieId", partieId)
                .data("rowId", rowId);
            $dialog.find(".equipeA").text("(Equipe A) " + versus.equipeA.name + " :");
            $dialog.find(".equipeB").text("(Equipe B) " + versus.equipeB.name + " :");
            if (versus.equipeA.score) {
                $dialog.find("input[name='scoreEquipeA']").val(versus.equipeA.score);
                $dialog.find("input[name='scoreEquipeB']").val(versus.equipeB.score);
                $dialog.find(".bAddScore").addClass("hidden");
                $dialog.find(".bModifyScore").removeClass("hidden");
            }
            $dialog.removeClass("hidden");
        }

        // onAddScore - Add a score to versus.
        function onAddScore() {
            var data = {};
            var $dialog = $(".newScoreDialog");
            data.equipeA = $dialog.find("input[name='scoreEquipeA']").val();
            data.equipeB = $dialog.find("input[name='scoreEquipeB']").val();

            if ($.henka.storage.addConcoursPartieScore(
                    vars.concoursId, $dialog.data("partieId"), $dialog.data("rowId") , data)) {

                onCloseDialogNewScore();
                updateScore($dialog.data("partieId"), $dialog.data("rowId"), data);
            }
        }

        function updateScore(partieId, rowId, data) {
            $(".tbPartie").each( function() {
                var $this = $(this);
                if ($this.data("partieId") !== partieId)
                    return true;

                $this.find("tr").each( function() {
                    var $tr = $(this);
                    if ($tr.data("rowId") !== rowId)
                        return true;

                    $tr.find(".score").text(data.equipeA + " - " + data.equipeB);
                    return false;
                });
                return false;
            }); 

            // Reload Classement
            $("#classement tr").filter("tr:gt(0)").remove();
            loadClassement();
        }

        // onModifyScore - Modify a score.
        function onModifyScore() {
            var data = {};
            var $dialog = $(".newScoreDialog");
            data.equipeA = $dialog.find("input[name='scoreEquipeA']").val();
            data.equipeB = $dialog.find("input[name='scoreEquipeB']").val();

            if ($.henka.storage.modifyConcoursPartieScore(
                    vars.concoursId, $dialog.data("partieId"), $dialog.data("rowId") , data)) {

                onCloseDialogNewScore();
                updateScore($dialog.data("partieId"), $dialog.data("rowId"), data);
            }
        }

        /*// onNewEquipe - Open dialog add new equipe.*/
        /*function onNewEquipe() {*/
        /*var $dialog = $(".newEquipeDialog");*/
        /*var count = 0;*/
        /*if (vars.concours.type === 0)*/
        /*count = 2;*/
        /*else if (vars.concours.type === 1)*/
        /*count = 3;*/
        /*var $content = $dialog.find(".content");*/
        /*var $divName = $("<div>").addClass("fields equipeFields");*/
        /*var $spanName = $("<span>").addClass("label").text("Nom : ");*/
        /*var $inputName = $("<input>").prop("type", "text").prop("name", "equipeName");*/
        /*$divName.append($spanName);*/
        /*$divName.append($inputName);*/
        /*$content.append($divName);*/

        /*for (var i = 0; i < count; i++) {*/
        /*var $div = $("<div>").addClass("fields equipeFields");*/
        /*var $span = $("<span>").addClass("label").text("Joueur " + (i+1)+ " :");*/
        /*var $input = $("<input>").prop("type", "text").prop("name", "player"+i);*/
        /*var $choose = $("<a>").addClass("hkButton bChoosePlayer"+i).text("Choose Player");*/
        /*var $add = $("<a>").addClass("hkButton bNewPlayer"+i).text("+Player").data("player", i);*/
        /*$div.append($span);*/
        /*$div.append($input);*/
        /*$div.append($choose);*/
        /*$div.append($add);*/
        /*$content.append($div);*/

        /*// Events*/
        /*$(".bNewPlayer"+i).on("click", function() {*/
        /*var $this = $(this);*/
        /*var $dialog = $(".newPlayerDialog");*/
        /*$dialog.data("player", $this.data("player"));*/
        /*$dialog.removeClass("hidden");*/
        /*$dialog.find("input[name='playerLastName']").focus();*/
        /*});*/
        /*}*/

        /*$dialog.removeClass("hidden");*/
        /*$inputName.focus();*/
        /*}*/

        /*// onCloseDialogNewPlayer - Close dialog add new player.*/
        /*function onCloseDialogNewPlayer() {*/
        /*var $dialog = $(".newPlayerDialog"); */
        /*$dialog.addClass("hidden");*/
        /*$dialog.find("input[name='playerLastName']").val('');*/
        /*$dialog.find("input[name='playerName']").val('');*/
        /*$dialog.find("input[name='playerAddress']").val('');*/
        /*$dialog.find("input[name='playerZip']").val('');*/
        /*$dialog.find("input[name='playerCity']").val('');*/
        /*$dialog.find("input[name='playerTel']").val('');*/
        /*}*/

        /*// onAddPlayer - Add a new player.*/
        /*function onAddPlayer() {*/
        /*var data = {};*/
        /*var $dialog = $(".newPlayerDialog"); */
        /*data.lastname = $dialog.find("input[name='playerLastName']").val();*/
        /*data.name = $dialog.find("input[name='playerName']").val();*/
        /*data.address = $dialog.find("input[name='playerAddress']").val();*/
        /*data.zip = $dialog.find("input[name='playerZip']").val();*/
        /*data.city = $dialog.find("input[name='playerCity']").val();*/
        /*data.tel = $dialog.find("input[name='playerTel']").val();*/

        /*var playerId = $.henka.storage.addPlayer(data);*/
        /*if (playerId !== -1) {*/
        /*var $equipeDialog = $(".newEquipeDialog");*/
        /*var $content = $equipeDialog.find(".content");*/
        /*var $input = $content.find("input[name='player"+$dialog.data("player")+"']");*/
        /*$input.val(data.name + " " + data.lastname);*/
        /*$equipeDialog.data("player"+$dialog.data("player"), playerId);*/
        /*onCloseDialogNewPlayer();*/
        /*}*/
        /*}*/

    });
})();
