/**
 * @projectDescription scripts.js
 * Javascript serris petanque app.
 *
 * @author HenkaDev, tienhai.nguyen@gmail.com
 *         https://github.com/TienHai/HenkaPetanque
 * @version 0.1
 *
 *
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


"use strict";

(function () {
    var windowLoaded = false;

    jQuery(window).on("load", function () {
        windowLoaded = true;
    });

    jQuery(function ($) {

        // --------------------------------------------------------------------
        // Init
        loadConcours();

        // --------------------------------------------------------------------
        // Events
        
        // New concours
        var $bNewConcours = $(".bNewConcours");
        $bNewConcours.on("click", function() {
            var $dialog = $(".newConcoursDialog"); 
            $dialog.removeClass("hidden");
            var $name = $dialog.find("input[name='concoursName']");
            $name.focus();
            var concours = $.henka.storage.loadStorage($.henka.keys.concours);
            if (concours) {
                var keys = Object.keys(concours).sort();
                $name.val("Concours " + (keys.length+1));
            } else {
                $name.val("Concours 1");
            }
            var now = new Date();
            var day = ("0" + now.getDate()).slice(-2);
            var month = ("0" + (now.getMonth() + 1)).slice(-2);
            var today = now.getFullYear()+"-"+(month)+"-"+(day) ;
            $dialog.find("input[name='concoursDate']").val(today);
        });
        $(".bAddConcours").on("click", function() {
            onAddConcours();
        });
        $(".bCancelAddConcours").on("click", function() {
            onCloseDialogNewConcours();
        });

        // Table concours
        $(".tbConcours tr").on("click", function() {
            var $tr = $(this);
            if ($tr.find("th").length > 0)
                return;
            window.location = "concours.html?concoursId="+$tr.data("concoursId");
        });

        // --------------------------------------------------------------------
        // Init Functions
        
        function loadConcours() {
            var $tbConcours = $("#concours");
            var concours = $.henka.storage.loadStorage($.henka.keys.concours);
            if (!concours)
                return;
            var keys = Object.keys(concours).sort();
            for(var i = 0; i < keys.length; i++) {
                $tbConcours.append(createNewConcoursRow(keys[i], concours[keys[i]]));
            }
        }

        function updateConcours() {
            var $tbConcours = $("#concours");
            var concours = $.henka.storage.loadStorage($.henka.keys.concours);
            var keys = Object.keys(concours).sort();
            var concoursId = keys[keys.length -1];
            var data = concours[concoursId];
            var $tr = createNewConcoursRow(concoursId, data);
            $tbConcours.append($tr);
            
            $tr.on("click", function() {
                var $tr = $(this);
                window.location = "concours.html?concoursId="+$tr.data("concoursId");
            });
        }

        function createNewConcoursRow(id, values) {
            var count = 0;
            var concours_equipes = $.henka.storage.loadStorage($.henka.keys.concours_equipes);
            if (concours_equipes) {
                var equipes = concours_equipes[id];
                if (equipes)
                    count = Object.keys(equipes).length;
            }
            var $tr = $("<tr>").data("concoursId", id);
            $tr.append($("<td>").text($.henka.storage.formatedDate(values.date)));
            $tr.append($("<td>").text(values.name));
            $tr.append($("<td>").text(count));
            $tr.append($("<td>").text(values.partie));
            $tr.append($("<td>").text($.henka.concoursType[values.type]));
            $tr.append($("<td>").text($.henka.concoursStatus[values.status]));
            return $tr;
        }
        
        // --------------------------------------------------------------------
        // Call Functions

        // onCloseDialogNewConcours - Close dialog add new concours.
        function onCloseDialogNewConcours() {
            var $dialog = $(".newConcoursDialog"); 
            $dialog.addClass("hidden");
            $dialog.find("input[name='concoursName']").val('');
            $dialog.find("#concoursType option[value='0']").prop("selected", true);
            $dialog.find("#concoursPartie option[value='4']").prop("selected", true);
        }

        // onAddConcours - Add a new concours.
        function onAddConcours() {
            var data = {};
            var $dialog = $(".newConcoursDialog"); 
            data.name = $dialog.find("input[name='concoursName']").val();
            data.type = parseInt($dialog.find("#concoursType").val(), 10);
            data.date = $dialog.find("input[name='concoursDate']").val();
            data.partie = $dialog.find("#concoursPartie").val();
            data.status = 0;

            if ($.henka.storage.addConcours(data)) {
                onCloseDialogNewConcours();
                updateConcours();
            }
        }

    });

})();
