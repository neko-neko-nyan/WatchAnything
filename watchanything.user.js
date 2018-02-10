// ==UserScript==
// @name         WatchAnything
// @namespace    https://github.com/Pasha13666
// @version      1.0.0
// @description  [shikimori.org] Кнопка открытия случайного аниме из списка
// @author       Pasha13666
// @homepageURL  https://github.com/Pasha13666/WatchAnything
// @updateURL    https://openuserjs.org/meta/Pasha13666/WatchAnything.meta.js
// @match        https://shikimori.org/*
// @match        http://shikimori.org/*
// @require      https://code.jquery.com/jquery-3.3.1.min.js
// @grant        none
// @license      MIT
// @copyright    2018, Pasha__kun (https://github.com/Pasha13666)
// ==/UserScript==

var $ = jQuery.noConflict(true),
    lUrl, lData, lKind;


function parseUrl(){
    if (lUrl === window.location.pathname)
        return lData;

    var url = window.location.pathname.split('/');
    if (url.length < 4 || url[2] != 'list' || (url[3] != 'anime' && url[3] != 'manga' && url[3] != 'ranobe'))
        return undefined;

    lUrl = window.location.pathname;
    lData = {};
    lKind = url[3];
    for (var i = 4; i < url.length; i+=2) {
        var k = url[i], v = url[i + 1];
        if (k === 'order-by')
            continue;

        lData[k] = v;
    }

    lData.censored = false;
    lData.limit = 50;
    return lData;
}

function getAll(kind, data, page, csrf, mylist, fn){
    var data2 = new Object(data);
    data2.page = page;
    data2.mylist = mylist;

    $.ajax('https://shikimori.org/api/' + kind + 's', {
        dataType: 'json',
        data: data2,
        headers: {
            'X-CSRF-Token': csrf,
            'X-Requested-With': 'XMLHttpRequest',
        },
        success: function(cnt){
            if (cnt.length === 50)
                getAll(kind, data, page + 1, csrf, mylist, function(c){
                    fn(cnt.concat(c));
                });
            else fn(cnt);
        }
    });
}

function nameOf(i){
    switch(i){
        case 0: return 'planned';
        case 1: return 'watching';
        case 2: return 'completed';
        case 3: return 'on_hold';
        case 4: return 'dropped';
    }
}

function onCollapseClicked(){
    var parent = $(this).parent(),
        placeholder = parent.next().next(),
        element = parent.parent().next(),
        shown = !!$(this).html().match(/\u0441\u0432\u0435\u0440\u043d\u0443\u0442\u044c|\u0441\u043f\u0440\u044f\u0442\u0430\u0442\u044c|collapse|hide/);

    $(this).toggleClass("triggered", shown);

    while (element.last().next().hasClass("collapse-merged"))
        element = element.add(n.last().next());

    if (element.length > 1)
        element = element.filter(":not(.collapse-ignored)");

    if (shown){
        placeholder.show();
        element.hide();
    } else {
        element.show();
        placeholder.hide();
    }

    $(this).html(function() {
        var e = $(this);

        return shown ? e.html().replace("\u0441\u0432\u0435\u0440\u043d\u0443\u0442\u044c", "\u0440\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c")
            .replace("\u0441\u043f\u0440\u044f\u0442\u0430\u0442\u044c", "\u043f\u043e\u043a\u0430\u0437\u0430\u0442\u044c")
            .replace("hide", "show")
            .replace("collapse", "expand")
        : e.html()
            .replace("\u0440\u0430\u0437\u0432\u0435\u0440\u043d\u0443\u0442\u044c", "\u0441\u0432\u0435\u0440\u043d\u0443\u0442\u044c")
            .replace("\u043f\u043e\u043a\u0430\u0437\u0430\u0442\u044c", "\u0441\u043f\u0440\u044f\u0442\u0430\u0442\u044c")
            .replace("show", "hide")
            .replace("expand", "collapse");
    });

    var s = $(this).data("collapse-name") + ";",
        i = jQuery.cookie("collapses") || "";
    if ((i.indexOf(s) === -1) === shown)
        jQuery.cookie("collapses", shown? i + s: i.replace(s, ""), {
            expires: 730,
            path: "/"
        });

    return placeholder.next().trigger("show");
}

function onRandomClicked(e){
    var newTab = e.which === 2;

    parseUrl();
    getAll(lKind, lData, 1, $('[name=csrf-token]').attr('content'), $(this).data('list-name'), function(c){
        c = c[Math.floor(Math.random() * c.length)];
        console.log(c);

        if (newTab) window.open('//shikimori.org' + c.url, '_blank', '');
        else window.location.pathname = c.url;
    });

    if (newTab) return false;
}

function start(){
    if (parseUrl() === undefined)
        return;

    for (var i = 0; i < 5; i++){
        var it = $('.status-' + i + ' .b-options-floated');

        it.parent().children(":last").click(function(){
            $(this).prev().prev().children(":last").click();
        });

        $('<div/>').addClass('b-options-floated').append(
            $('<a/>').text('Рандомное аниме').data('list-name', nameOf(i)).on('click auxclick', onRandomClicked)
        ).append(
            $('<a/>').text(it.children(":first").text()).data('list-name', i).data("collapse-name", i).click(onCollapseClicked)
        ).replaceAll(it);
    }
}

$(document).ready(start);
$(document).on('page:load', start);
$(document).on('turbolinks:load', start);
