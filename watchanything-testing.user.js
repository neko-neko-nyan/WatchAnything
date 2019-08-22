// ==UserScript==
// @name         WatchAnything (testing)
// @namespace    https://openuserjs.org/users/Pasha13666
// @version      1.1.2
// @description  [shikimori.one] Кнопка открытия случайного аниме из списка
// @author       NekoNekoNyan
// @match        http://shikimori.one/*
// @match        https://shikimori.one/*
// @match        http://shikimori.org/*
// @match        https://shikimori.org/*
// @updateURL    https://github.com/Pasha13666/WatchAnything/raw/master/watchanything-testing.user.js
// @homepageURL  https://github.com/Pasha13666/WatchAnything
// @run-at       document-body
// @license      MIT
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_log
// @copyright    2018, Pasha__kun (https://github.com/Pasha13666)
// ==/UserScript==

const LIST_NAMES = ['planned', 'watching', 'completed', 'on_hold', 'dropped'];

function WatchAnything(){
    this.onRandomClicked = this.onRandomClicked.bind(this);
    this.triggerChange = this.triggerChange.bind(this);
}

WatchAnything.prototype.triggerChange = function(){
    if (!document.body || !document.body.classList.contains("p-user_rates"))
        return;

    GM_log("[WatchAnything] Starting / loading...");
    if (location.href !== this.prevUrl) {
        this.prevUrl = location.href;
        this.onUrlChanged();
    }
    this.bindToLists();
}

WatchAnything.prototype.onUrlChanged = function (){
    const url = window.location.pathname.split('/');
    this.data = {};
    this.kind = url[3];
    for (let i = 4; i < url.length; i+=2) {
        const k = url[i], v = url[i + 1];
        if (k !== 'order-by')
            this.data[k] = v;
    }

    this.data.censored = false;
    this.data.limit = 50;

    this.csrf = document.querySelector('meta[name=csrf-token]').content;

    document.removeEventListener('click', this.onRandomClicked);
    document.addEventListener('click', this.onRandomClicked);
    document.removeEventListener('auxclick', this.onRandomClicked);
    document.addEventListener('auxclick', this.onRandomClicked);
}

WatchAnything.prototype.bindToLists = function (){
    for (let i = 0; i < 5; i++){
        const $header = document.querySelector('.status-' + i);
        if (!$header || $header.children[1].classList.contains('wa-link'))
            continue;

        const $link = document.createElement('div');

        $link.classList = "b-options-floated wa-link";
        $link.innerHTML = '<span class="action">Рандом</span>';
        $link.dataset.listName = LIST_NAMES[i];

        $header.children[1].before($link);
    }
}

WatchAnything.prototype.onRandomClicked = function(e) {
    if(e.path.length >= 2 && e.path[1].classList.contains('wa-link')) {
        var newTab = e.which !== 1;
        const $link = e.path[1];

        this.loadList(1, $link.dataset.listName, function(c){
            c = c[Math.floor(Math.random() * c.length)];
            GM_log("[WatchAnything] Opening random selected:", c.russian || c.name);

            if (newTab) window.open(location.origin + c.url, '_blank', '');
            else window.location.pathname = c.url;
        });

        if (newTab) e.stopImmediatePropagation();
    }
}

WatchAnything.prototype.loadList = function(page, mylist, fn){
    var ajax = new XMLHttpRequest();
    var data = new Object(this.data);
    data.page = page;
    data.mylist = mylist;

    ajax.open("GET", location.origin + '/api/' + this.kind + 's?' + Object.keys(data).map(key => key + '=' + data[key]).join('&'), true);
    ajax.setRequestHeader('X-CSRF-Token', this.csrf);
    ajax.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    ajax.setRequestHeader('X-Userscript', 'WatchAnything');

    ajax.onreadystatechange = () => {
        if (ajax.readyState != 4 || ajax.status != 200)
            return;

        const cnt = JSON.parse(ajax.responseText);
        if (cnt.length === 50) {
            if (page % 5 === 0) setTimeout(() => this.loadList(page + 1, mylist, function(c){
                fn(cnt.concat(c));
            }), 1000);
            else this.loadList(page + 1, mylist, function(c){
                fn(cnt.concat(c));
            });
        } else fn(cnt);
    }

    ajax.send();
}

document.head.append(GM_addStyle("header>.b-options-floated { position: inherit; float: right; margin: auto 10px; }"));
const wa = new WatchAnything;

document.addEventListener('ready', wa.triggerChange);
document.addEventListener('page:load', wa.triggerChange);
document.addEventListener('turbolinks:load', wa.triggerChange);
wa.triggerChange();
