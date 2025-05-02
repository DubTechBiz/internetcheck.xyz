"use strict";
// Config
const prefix = 'bcdfhklmnrstvwxz';
const approved_domains = ['internetcheck.xyz', 'internettest.xyz', 'networkcheck.xyz', 'networktest.xyz', 'http.rocks'];
const dev_domains = ['networkstest.xyz'];

// Dynamic constants
const root_domain = window.location.host.replace(/^.*?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2');
const domain = window.location.host.replace(/^.*?((?:dev|lo|local)\.)?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2$3');
const subdomain = window.location.host.replace(/^(.*?)\.(?:(?:dev|lo|local)\.)?[0-9a-z\-]+\.[0-9a-z\-]+$/, '$1');

// Functions
const redirect = (path) => {
    path = path || '';
    let sub = prefix.split('').sort(function(){return 0.5-Math.random()}).join('')
    // Only allow this to redirect to approved domains. Otherwise, default to internetcheck.xyz
    if(approved_domains.indexOf(root_domain)===-1 && dev_domains.indexOf(root_domain)===-1) {
        window.location.href = 'http://' + sub + '.internetcheck.xyz/' + path; 
    }
    else {
        window.location.href = 'http://' + sub + '.' + domain + '/' + path;
    }
}
const secure_page = () => {
    let sub = subdomain || prefix.split('').sort(function(){return 0.5-Math.random()}).join('')
    if(approved_domains.indexOf(root_domain)===-1 && dev_domains.indexOf(root_domain)===-1) {
        window.location.href = 'https://secure.internetcheck.xyz' + window.location.pathname;
    }
    else {
        window.location.href = 'https://secure.' + root_domain + window.location.pathname;
    }
}
const replace = () => {
    document.title = domain + ' - ' + document.title;
    let t = document.getElementsByTagName('domain');
    for(let i = 0; i < t.length; i++) {
        t[i].innerHTML=domain;
    }
}

// Hooks
// Update the manifest cache locally when updates are downloaded
window.applicationCache.addEventListener('updateready', window.applicationCache.swapCache);
// Page buttons
$(document).on("click", "#btnRecheck", () => {window.location.href='http://'+domain;});
$(document).on("click", "#btnSecurePage", () => {secure_page()});

// Init
(function() {
    if(domain) {
        replace();
    }
    // No sense in redirecting if we're already where we want to be
    // Also disabled for local files, so development is easier
    if(window.location.pathname!=='/online' && window.location.protocol!=='file:') {
        redirect('online');
    }
    for(let i = 0; i < approved_domains.length; i++) {
        if(approved_domains[i]===root_domain) {
            $("#approvedDomains").append('<li><a target="_blank" href="http://' + approved_domains[i] + '">' + approved_domains[i] + '</a> &lt;-- You are here!</li>');
        }
        else {
            $("#approvedDomains").append('<li><a target="_blank" href="http://' + approved_domains[i] + '">' + approved_domains[i] + '</a></li>');
        }
    }
}())
