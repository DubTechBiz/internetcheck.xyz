"use strict";
// Config
const prefix = 'bcdfhklmnrstvwxz';
const approved_domains = ['internetcheck.xyz', 'internettest.xyz', 'networkcheck.xyz', 'networktest.xyz', 'http.rocks'];

// Dynamic constants
const root_domain = window.location.host.replace(/^.*?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2');
const domain = window.location.host.replace(/^.*?((?:dev|lo|local)\.)?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2$3');
const subdomain = window.location.host.replace(/^(.*?)\.(?:(?:dev|lo|local)\.)?[0-9a-z\-]+\.[0-9a-z\-]+$/, '$1');

// Functions
const redirect = () => {
    let sub = prefix.split('').sort(function(){return 0.5-Math.random()}).join('')
	// Only allow this to redirect to approved domains. Otherwise, default to internetcheck.xyz
    if(approved_domains.indexOf(window.location.host.replace(/^.*?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2'))===-1) {
	    window.location.href = 'http://' + sub + '.internetcheck.xyz/online'; 
    }
    else {
	    window.location.href = 'http://' + sub + '.' + window.location.hostname.replace(/^.*?((?:dev|lo|local)\.)?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2$3') + '/online'; 
    }
}
const secure_page = () => {
    let sub = subdomain || prefix.split('').sort(function(){return 0.5-Math.random()}).join('')
    if(approved_domains.indexOf(window.location.host.replace(/^.*?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2'))===-1) {
		window.location.href = 'https://secure.internetcheck.xyz' + window.location.pathname;
	}
	else {
		window.location.href = 'https://secure.' + root_domain + window.location.pathname;
	}
}
const replace = () => {
    document.title = document.location.hostname.replace(/^.*?((?:dev|lo|local)\.)?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2$3') + ' - ' + document.title;
    let t = document.getElementsByTagName('domain');
    for(let i = 0; i < t.length; i++) {
        t[i].innerHTML=window.location.hostname.replace(/^.*?((?:dev|lo|local)\.)?([0-9a-z\-]+\.)([0-9a-z\-]+)$/, '$1$2$3');
    }
}

// Hooks
$(document).on("click", "#btnRecheck", redirect);
$(document).on("click", "#btnSecurePage", secure_page);

// Init
(function() {
    replace();
    if(window.location.pathname!=='/online' && (!window.location.pathname.match(/\/(index|online)\.html$/i))) {
    	redirect();
    }
}())