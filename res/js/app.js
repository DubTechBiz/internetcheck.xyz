"use strict";
// Config
const prefix = 'bcdfhklmnrstvwxz';
const approved_domains = ['internetcheck.xyz', 'internettest.xyz', 'networkcheck.xyz', 'networktest.xyz', 'http.rocks'];
const dev_domains = ['networkstest.xyz', 'internetcheck.dubtech.dev'];
let domain = !1,
    rootdomain = !1,
    subdomain = !1,
    devdomain = !1;


const is_https = location.protocol=='https:';
const is_file = location.protocol=='file:';

// This will return domain[:port]

// Engage jQuery tooltips on page
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

// Functions
const redirect = (path) => {
};
const InternetCheck = {
    results: $("#app_tests>div").clone(),

    reachability_test: [
        {name: "Amazon", url: "https://amazon.com", testpoint: "https://www.amazon.com/favicon.ico"},
        {name: "Cloudflare", url: "https://cloudflare.com", testpoint: "https://www.cloudflare.com/favicon.ico"},
        {name: "Fast", url: "https://fast.com", testpoint: "https://fast.com/assets/favicons/favicon.ico"},
        // {name: "Facebook", url: "https://facebook.com", testpoint: "https://www.facebook.com/favicon.ico"},
        {name: "Google", url: "https://google.com", testpoint: "https://www.google.com/favicon.ico"},
        {name: "YouTube", url: "https://youtube.com", testpoint: "https://www.youtube.com/favicon.ico"},
        {name: "Microsoft", url: "https://microsoft.com", testpoint: "https://www.microsoft.com/favicon.ico"},
        {name: "Outlook", url: "https://outlook.com", testpoint: "https://www.outlook.com/owa/favicon.ico"},
    ],

    securedns: {
        iscf: null,
        isdoh: null,
        isdot: null,
        iswarp: null
    },
    dnssec: null,

    randomstr: '',

    esni: {},

    init: function() {
        // Hooks
        // $(document).on("click", "#btnRecheck", () => {window.location.href='http://'+domain;});
        $(document).on("click", "#btnRecheck", InternetCheck.redirect);
        // $(document).on("click", "#btnSecurePage", InternetCheck.secure_page);

        // List approved/dev domains, flag the one we're visiting
        for(let i in approved_domains) {
            let d = approved_domains[i];
            let h = '<li><a target="_blank" href="http://' + d + '">' + d + '</a>'
            if(window.location.host.endsWith(d)) {
                domain = window.location.host;
                rootdomain = d;
                subdomain = domain!=rootdomain ? domain.replace(rootdomain, '').substr(0, (domain.length-rootdomain.length)-1) : !1;
                h += ' &lt;-- You are here!';
            }
            $("#approvedDomains").append(h + '</li>');
        }
        for(let i in dev_domains) {
            let d = dev_domains[i];
            if(window.location.host.endsWith(d)) {
                domain = window.location.host;
                rootdomain = d;
                subdomain = domain!=rootdomain ? domain.replace(rootdomain, '').substr(0, (domain.length-rootdomain.length)-1) : !1;
                devdomain=!0
                $("#approvedDomains").append('<li><a target="_blank" href="http://' + rootdomain + '">' + rootdomain + '</a> &lt;-- You are <i>developing</i> here!</li>');
            }
        }

        // Lock access to our approved/dev domains only
        if(!domain)
            window.location.href = 'http://' + approved_domains[0];

        // Online test
        if(window.location.pathname != '/online')
            InternetCheck.redirect('online');

        // Upgrade to HTTPS
        if(!is_https)
            window.location.href = window.location.href.replace('http://', 'https://');

        // Update HTML <domain> tags to show the root domain we're on
        InternetCheck.replace_domain();

        InternetCheck.updatestatus();
        // This is a potential development path, but conflicts with the core function since they only run on HTTPS pages.
        // InternetCheck.serviceWorker.init();
        InternetCheck.test();
    },
    genrand: function() {
        return typeof crypto != 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
    },
    redirect: function(p) {
        p = p || '';
        let sub = InternetCheck.genrand();
        // Only allow this to redirect to approved domains. Otherwise, default to internetcheck.xyz
        if(!domain) {
            window.location.href = 'http://' + sub + '.internetcheck.xyz/' + p;
        }
        else {
            window.location.href = 'http://' + sub + '.' + rootdomain + '/' + p;
        }
    },
    test: async function() {
        InternetCheck.randomstr = InternetCheck.genrand();
        $("#btnRecheck").prop('disabled', true);
        // Reset results
        InternetCheck.dnssec = null;
        for(let k in InternetCheck.securedns)
            InternetCheck.securedns[k] = null;
        InternetCheck.esni = {};
        $("span[data-status]").not("#status_https>span, #status_app>span").addClass('d-none');
        $("span[data-status=checking]").not("#status_https>span, #status_app>span").removeClass('d-none');
        InternetCheck.test_esni();
        InternetCheck.test_secure_dns();
        InternetCheck.test_dnssec();
        InternetCheck.test_connectivity();
    },
    updatestatus: function() {
        $("#status_https").children("span[data-status]").addClass("d-none");
        if(is_https)
            $("#status_https").find("span[data-status=yes]").removeClass("d-none");
        else if(is_file)
            $("#status_https").find("span[data-status=dev]").removeClass("d-none");
        else
            $("#status_https").find("span[data-status=no]").removeClass("d-none");
    },
    // use this to replace the title and <domain> tags with the current domain
    replace_domain: function() {
        document.title = domain + ' - ' + document.title;
        let t = document.getElementsByTagName('domain');
        for(let i = 0; i < t.length; i++) {
            t[i].innerHTML=rootdomain;
        }
    },
    test_esni: function() {
        let t = "https://" + InternetCheck.randomstr + "-" + rootdomain.replaceAll('.', '_') + ".encryptedsni.com/cdn-cgi/trace"
        $.get(t).done((res) => {
            // Parse data to dict for easy access
            let data = {}
            for(let [i, line] of Object.entries(res.split("\n"))) {
                let [k, v] = line.split('=', 2);
                data[k] = v;
            }
            InternetCheck.esni = data;
            InternetCheck.securedns.iswarp = ['on', 'plus'].indexOf(data.warp) !== -1;
            InternetCheck.checktest_secure_dns();
        });
    },
    test_secure_dns: function() {
        let targets = {
            iscf: "https://"  + InternetCheck.randomstr + "-" + rootdomain.replaceAll('.', '_') + ".is-cf.help.every1dns.net/resolvertest",
            isdoh: "https://" + InternetCheck.randomstr + "-" + rootdomain.replaceAll('.', '_') + ".is-doh.help.every1dns.net/resolvertest",
            isdot: "https://" + InternetCheck.randomstr + "-" + rootdomain.replaceAll('.', '_') + ".is-dot.help.every1dns.net/resolvertest",
        };
        for(const [k, t] of Object.entries(targets)) {
            $.get(t)
                .done(() => {InternetCheck.securedns[k] = true})
                .fail(() => {InternetCheck.securedns[k] = false})
                .always(InternetCheck.checktest_secure_dns)
        }
    },
    checktest_secure_dns: function() {
        for(const [k, v] of Object.entries(InternetCheck.securedns)) {
            if(v===null)
                return;
        }
        console.log("Secure DNS tests completed!");
        console.log(InternetCheck.securedns);
        InternetCheck.can_recheck();
        // Secure DNS
        $("#status_secure_dns").children('span[data-status]').addClass('d-none');
        // If WARP
        if(InternetCheck.securedns.iswarp)
            $("#status_secure_dns").find('span[data-status=pass]').removeClass('d-none').text('Cloudflare WARP' + (InternetCheck.esni.warp == 'plus' ? '+' : ''));
        // If Cf + DoH/DoT
        else if(InternetCheck.securedns.iscf && (InternetCheck.securedns.isdoh || InternetCheck.securedns.isdot))
            $("#status_secure_dns").find('span[data-status=pass]').removeClass('d-none').text('Cloudflare' + (InternetCheck.securedns.isdoh ? ' + DoH' : '') + (InternetCheck.securedns.isdot ? ' + DoT': ''));
        // If NOT Cf and NOT WARP (some other provider, could have DoH/DoT)
        else if(!InternetCheck.securedns.iscf && !InternetCheck.securedns.iswarp)
            $("#status_secure_dns").find('span[data-status=unknown]').removeClass('d-none').text('Unknown' + (InternetCheck.securedns.isdoh ? ' + DoH' : '') + (InternetCheck.securedns.isdot ? ' + DoT': ''));
        // If it is Cf and NOT DoH/Dot (we can confirm not secure)
        else
            $("#status_secure_dns").find('span[data-status=fail]').removeClass('d-none').text('Cloudflare');
        // TLS v1.3?
        $("#status_tlsv13").children('span[data-status]').addClass('d-none');
        if(InternetCheck.esni.tls=="TLSv1.3")
            $("#status_tlsv13").find('span[data-status=pass]').removeClass('d-none');
        else
            $("#status_tlsv13").find('span[data-status=fail]').removeClass('d-none');
        // SNI = Encrypted/TLSv1.3 OR not none/plaintext
        $("#status_secure_sni").children('span[data-status]').addClass('d-none');
        if(["encrypted", "TLSv1.3"].indexOf(InternetCheck.esni.sni) !== -1 && ["none", "plaintext"].indexOf(InternetCheck.esni.sni) === -1)
            $("#status_secure_sni").find('span[data-status=pass]').removeClass('d-none').text(InternetCheck.esni.sni);
        else
            $("#status_secure_sni").find('span[data-status=fail]').removeClass('d-none').text(InternetCheck.esni.sni);
    },
    test_dnssec: function() {
        let t = "https://" + InternetCheck.randomstr + "-" + rootdomain.replaceAll('.', '_') + ".brokendnssec.net/check"
        $.get(t)
            .done(() => {
                InternetCheck.dnssec=false;
                $("#status_dnssec").children('span[data-status]').addClass('d-none');
                $("#status_dnssec").find('span[data-status=fail]').removeClass('d-none');
            })
            .fail(() => {
                InternetCheck.dnssec=true;
                $("#status_dnssec").children('span[data-status]').addClass('d-none');
                $("#status_dnssec").find('span[data-status=pass]').removeClass('d-none');
            })
            .always(InternetCheck.can_recheck)
    },
    can_recheck: async function() {
        if(InternetCheck.dnssec === null)
            return false;
        for(const [k, v] of Object.entries(InternetCheck.securedns)) {
            if(v===null)
                return false;
        }
        $("#btnRecheck").prop('disabled', false);
    },
    test_connectivity: function() {
        const d = $("#app_tests");
        d.html('');

        // Randomized subdomain test (bypass DNS caching)
        let r = InternetCheck.results.clone();
        r.attr('data-target', "Internet")
        r.find('div:nth-child(1)').text("Internet");
        r = d.append(r).find('div.row[data-target="Internet"]')
        const startTime = Date.now();
        // Temporarily hard-coded until rolled out everywhere
        $.get("https://" + InternetCheck.randomstr + ".networkstest.xyz/ping")
        // $.get("https://" + InternetCheck.randomstr + "." + domain + "/ping")
            .done(() => {
                const stopTime = Date.now()
                $("#app_tests").find('div.row[data-target="Internet"]>div:nth-child(2)').children('span[data-status]').addClass('d-none')
                $("#app_tests").find('div.row[data-target="Internet"]>div:nth-child(2)').find("span[data-status=success]").removeClass('d-none')
                $("#app_tests").find('div.row[data-target="Internet"]>div:nth-child(3)').text((stopTime-startTime) + 'ms')
            })
            .fail(() => {
                $("#app_tests").find('div.row[data-target="Internet"]>div:nth-child(2)').children('span[data-status]').addClass('d-none')
                $("#app_tests").find('div.row[data-target="Internet"]>div:nth-child(2)').find("span[data-status=fail]").removeClass('d-none')
            })
        // InternetCheck.test_site({name: "Internet", url: false, testpoint: });

        // Third-party site tests for end user reachability
        for(const s of InternetCheck.reachability_test) {
            InternetCheck.test_site(s);
        }
    },
    test_site: async function(s) {
        const d = $("#app_tests");
        // Add the row to the list
        let r = InternetCheck.results.clone();
        r.attr('data-target', s.name)
        if(s.url)
            r.find('div:nth-child(1)').html('<a href="' + s.url + '" target="_blank">' + s.name + '</a>');
        else
            r.find('div:nth-child(1)').text(s.name);
        r = d.append(r).find('div.row[data-target="' + s.name + '"]')
        // Now test and update
        try {
            const res = await InternetCheck._testSiteAccessibility(s);
            console.log(res);
            if(res.accessible) {
                r.find('div:nth-child(2)').children('span[data-status]').addClass('d-none')
                r.find('div:nth-child(2)').find("span[data-status=success]").removeClass('d-none')
                r.find('div:nth-child(3)').text(res.time+'ms')
            }
            else {
                r.find('div:nth-child(2)').children('span[data-status]').addClass('d-none')
                r.find('div:nth-child(2)').find("span[data-status=fail]").removeClass('d-none')
            }
        }
        catch (err) {
            r.find('div:nth-child(2)').children('span[data-status]').addClass('d-none')
            r.find('div:nth-child(2)').find("span[data-status=error]").removeClass('d-none')
            console.error(err);
        }
    },
    _testSiteAccessibility: function(s) {
        return new Promise((resolve) => {
            const img = new Image();
            const status = {name: s.name, url: s.url, accessible: false, time: null};
            let startTime, endTime;
            // Set a timeout in case the image never loads (e.g., blocked)
            const timeout = setTimeout(() => {
                // Cancel the image load and resolve as inaccessible
                img.src = "";
                resolve(status);
            }, 5000); // 5 seconds timeout
            img.onload = function() {
                endTime = Date.now();
                clearTimeout(timeout);
                status.accessible = true;
                status.time = endTime - startTime;
                resolve(status);
            };
            img.onerror = function() {
                clearTimeout(timeout);
                status.accessible = false;
                resolve(status);
            };
            // Time request as well
            startTime = Date.now();
            // Append a cache-busting query parameter to prevent caching
            img.src = s.testpoint + "?r" + Date.now();
        });
    },
    serviceWorker: {
        init: function() {
            if(!is_https) {
                console.warn("Not served over HTTPS so service worker will not be registered.");
                return false;
            }
            if('serviceWorker' in navigator) {
                InternetCheck.serviceWorker.register();
            }
            else {
                InternetCheck.serviceWorker.status("unsupported")
            }
        },
        register: function() {
            navigator.serviceWorker.register('/service-worker.js')
                .then(InternetCheck.serviceWorker.registered)
                .catch(InternetCheck.serviceWorker.register_error);
        },
        registered: function(reg) {
            console.log('Service Worker registered:', reg);
        },
        register_error: function(err) {
            console.error('Service Worker registration failed: ${err}')
        },
        status: function(s) {
            $("#status_app").children("span.badge").addClass("d-none");
            $("#status_app").find("span[data-status="+s+"]").removeClass("d-none");
        },
    }
};


// Init
(function() {
    InternetCheck.init();
}())
