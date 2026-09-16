"use strict";
try {
    Sentry.onLoad(function() {
        Sentry.init();
    });
}
catch (e) {
    console.error("Sentry failed to load, unable to capture page errors for reporting.");
    console.error(e);
}

// Config
const prefix = 'bcdfhklmnrstvwxz';
const approved_domains = ['internetcheck.xyz', 'internettest.xyz', 'networkcheck.xyz', 'networktest.xyz', 'http.rocks'];
const beta_domains = ['networkstest.xyz'];
const dev_domains = ['internetcheck.dubtech.dev'];
let domain = !1,
    rootdomain = !1,
    subdomain = !1,
    betadomain = !1,
    devdomain = !1;


const is_https = location.protocol=='https:';
const is_file = location.protocol=='file:';

// This will return domain[:port]

// Engage jQuery tooltips on page
const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

const updateTooltip = function(e, t) {
    e.attr("data-bs-title", t);

    const tt = bootstrap.Tooltip.getInstance(e[0]);
    if(tt) {
        tt.setContent({
            ".tooltip-inner": t
        });
    }
};

// Functions
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

    trace: {},

    internetTime: {
        // Re-sync time with the internet every 15 minutes
        resync: 900 * 1e3,
        time: null,
        perf: null,
        syncing: !1
    },

    httpsTestFailed: null,

    init: function() {
        // Run this first to show near immediately
        this.updatestatus();
        // Trigger time
        this.fetch_trace();
        this.ticktock();
        
        // Hooks
        // $(document).on("click", "#btnRecheck", () => {window.location.href='http://'+domain;});
        $(document).on("click", "#btnRecheck", () => {this.redirect();});
        // Upgrade to HTTPS
        $("#status_https>span[data-status=no]").on('click', () => {
            window.location.href = window.location.href.replace('http://', 'https://');
        })
        // $(document).on("click", "#btnSecurePage", this.secure_page);

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
        for(let i in beta_domains) {
            let d = beta_domains[i];
            if(window.location.host.endsWith(d)) {
                domain = window.location.host;
                rootdomain = d;
                subdomain = domain!=rootdomain ? domain.replace(rootdomain, '').substr(0, (domain.length-rootdomain.length)-1) : !1;
                betadomain=!0
                $("#approvedDomains").append('<li><a target="_blank" href="http://' + rootdomain + '">' + rootdomain + '</a> &lt;-- You are <i>testing</i> here!</li>');
            }
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
            return window.location.href = 'http://' + approved_domains[0];

        // Online test
        console.log(window.location.pathname);
        // We don't actually need this since the button regenerates the subdomain to redirect to
        // if(window.location.pathname != '/online')
        //     return this.redirect('online');

        // Upgrade to HTTPS
        // Automatic upgrade disabled to prevent page flicker
        // if(!is_https)
        //     return window.location.href = window.location.href.replace('http://', 'https://');

        // Update HTML <domain> tags to show the root domain we're on
        this.replace_domain();

        // This is a potential development path, but conflicts with the core function since they only run on HTTPS pages.
        // this.serviceWorker.init();
        this.test();
    },
    badgeClasses: function(i, c) {
        return c.match(/\b(?:bg|border)-(?:danger|info|success|warning)-subtle\b|\btext-(?:danger|info|success|warning)-emphasis\b/g) ?? [];
    },
    ticktock: function() {
        const system = () => {
            const now = Date.now();

            $("[data-m-format]").each((i, e) => {
                e = $(e);
                const f = e.attr("data-m-format");
                e.html(moment(now).format(f))
            });
            setTimeout(() => system(), 1e3 - (now % 1e3) + 5);
        };

        const internet = () => {
            const now = this.internet_now();
            if(now !== null) {
                $("#status_internet_time>span").text(moment(now).format("YYYY-MM-DD HH:mm:ss"));
                setTimeout(() => internet(), 1e3 - (now % 1e3) + 5);
            }
            else {
                setTimeout(() => internet(), 1e2);
            }
        };

        system();
        internet();
    },
    is_time_correct: function() {
        // Get the difference first
        const internet_now = parseFloat(this.internet_now());
        const system_now = Date.now();
        const diff = Math.abs(internet_now - system_now);
        const e = $("#status_system_time>span");
        let s, t;
        // Unknown/unavailable = Blue
        if(isNaN(internet_now)) {
            s = "info"
            t = "Ensure this is correct to avoid time-based HTTPS errors.";
        }
        // Within 10 seconds = Green
        else if(diff <= 1e4) {
            s = "success"
            t = "Time is synced within 10 seconds. Great!";
        }
        // Within 7 days = Yellow
        else if(diff <= 6048e5) {
            s = "warning"
            t = "Time is out of sync between 10 seconds and 7 days. This can cause issues.";
        }
        // 7+ days = Red
        else {
            s = "danger"
            t = "Time is out of sync by more than 7 days! This can break many services.";
        }
        e.removeClass(this.badgeClasses).addClass(`bg-${s}-subtle border-${s}-subtle text-${s}-emphasis`);
        updateTooltip(e, t);
    },
    fetch_trace: async function(force=false) {
        if(this.internetTime.syncing)
            return;

        if(!force && this.internetTime.perf !== null &&
            performance.now() - this.internetTime.perf < this.internetTime.resync)
            return;

        this.internetTime.syncing = !0;

        const start = performance.now();

        try {
            const res = await fetch("/cdn-cgi/trace", {
                cache: "no-store"
            });
            const end = performance.now();

            if(!res.ok)
                throw new Error("Cloudflare trace request failed: HTTP " + res.status);

            const text = await res.text();

            this.trace = Object.fromEntries(
                text.trim().split("\n").map(l => l.split("=", 2))
            );

            this.securedns.iswarp = ['on', 'plus'].indexOf(this.trace.warp) !== -1;
            this.checktest_secure_dns();

            if(!this.trace.ts)
                throw new Error("Cloudflare trace response did not contain a timestamp.");

            // Approximate one-way network latency
            const latency = (end - start) / 2;

            this.internetTime.time = (parseFloat(this.trace.ts) * 1e3) + latency;
            this.internetTime.perf = end;
            $("#status_internet_time>span")
                .removeClass(this.badgeClasses)
                .addClass("bg-success-subtle border-success-subtle text-success-emphasis");
            // Check if time is correct
            this.is_time_correct();
            // Re-sync
            setTimeout(() => this.fetch_trace(true), this.internetTime.resync);
        }
        catch(err) {
            console.error("Unable to synchronize Internet time.");
            console.error(err);

            $("#status_internet_time>span")
                .removeClass(this.badgeClasses)
                .addClass("bg-danger-subtle border-danger-subtle text-danger-emphasis")
                .text("Unavailable");
            // Try again in 30 seconds
            setTimeout(() => this.fetch_trace(true), 3e4);
        }
        finally {
            this.internetTime.syncing = !1;
        }
    },
    internet_now: function() {
        if(this.internetTime.time === null)
            return null;

        return this.internetTime.time +
            (performance.now() - this.internetTime.perf);
    },
    genrand: function() {
        // crypto.randomUUID() is only available when served over HTTPS. I don't know why, I don't make the rules.
        return is_https && typeof crypto != 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)
    },
    redirect: function(p) {
        p = p || '';
        let sub = this.genrand();
        // Only allow this to redirect to approved domains. Otherwise, default to internetcheck.xyz
        if(!domain) {
            console.log('Redirecting to: http://' + sub + '.internetcheck.xyz/' + p);
            window.location.href = 'http://' + sub + '.internetcheck.xyz/' + p;
        }
        else if(devdomain) {
            console.log('Redirecting to: http://' + sub + '.' + rootdomain + '/' + p);
            window.location.href = 'http://' + sub + '-' + rootdomain + '/' + p;
        }
        else {
            console.log('Redirecting to: http://' + sub + '.' + rootdomain + '/' + p);
            window.location.href = 'http://' + sub + '.' + rootdomain + '/' + p;
        }
    },
    test: async function() {
        this.randomstr = this.genrand();
        $("#btnRecheck").prop('disabled', !0);
        // Reset results
        this.dnssec = null;
        for(let k in this.securedns)
            this.securedns[k] = null;
        $("span[data-status]").not("#status_https>span, #status_app>span").addClass('d-none');
        $("span[data-status=checking]").not("#status_https>span, #status_app>span").removeClass('d-none');
        this.test_secure_dns();
        this.test_dnssec();
        this.test_connectivity();
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
        document.title = rootdomain + ' - ' + document.title;
        let t = document.getElementsByTagName('domain');
        for(let i = 0; i < t.length; i++) {
            t[i].innerHTML=rootdomain;
        }
    },
    test_secure_dns: function() {
        let targets = {
            iscf: "https://"  + this.randomstr + "_" + rootdomain.replaceAll('.', '_') + ".is-cf.help.every1dns.net/resolvertest",
            isdoh: "https://" + this.randomstr + "_" + rootdomain.replaceAll('.', '_') + ".is-doh.help.every1dns.net/resolvertest",
            isdot: "https://" + this.randomstr + "_" + rootdomain.replaceAll('.', '_') + ".is-dot.help.every1dns.net/resolvertest",
        };
        for(const [k, t] of Object.entries(targets)) {
            $.get(t)
                .done(() => {this.securedns[k] = !0})
                .fail(() => {this.securedns[k] = !1})
                .always(() => this.checktest_secure_dns())
        }
    },
    checktest_secure_dns: function() {
        for(const [k, v] of Object.entries(this.securedns)) {
            if(v===null)
                return;
        }
        console.log("Secure DNS tests completed!");
        console.log(this.securedns);
        this.can_recheck();
        // Secure DNS
        $("#status_secure_dns").children('span[data-status]').addClass('d-none');
        // If WARP
        if(this.securedns.iswarp)
            $("#status_secure_dns").find('span[data-status=pass]').removeClass('d-none').text('Cloudflare WARP' + (this.trace.warp == 'plus' ? '+' : ''));
        // If Cf + DoH/DoT
        else if(this.securedns.iscf && (this.securedns.isdoh || this.securedns.isdot))
            $("#status_secure_dns").find('span[data-status=pass]').removeClass('d-none').text('Cloudflare' + (this.securedns.isdoh ? ' + DoH' : '') + (this.securedns.isdot ? ' + DoT': ''));
        // If NOT Cf and NOT WARP (some other provider, could have DoH/DoT)
        else if(!this.securedns.iscf && !this.securedns.iswarp)
            $("#status_secure_dns").find('span[data-status=unknown]').removeClass('d-none').text('Unknown' + (this.securedns.isdoh ? ' + DoH' : '') + (this.securedns.isdot ? ' + DoT': ''));
        // If it is Cf and NOT DoH/Dot (we can confirm not secure)
        else
            $("#status_secure_dns").find('span[data-status=fail]').removeClass('d-none').text('Cloudflare');
        // TLS v1.3?
        $("#status_tlsv13").children('span[data-status]').addClass('d-none');
        if(this.trace.tls === "TLSv1.3")
            $("#status_tlsv13").find('span[data-status=pass]').removeClass('d-none');
        else
            $("#status_tlsv13").find('span[data-status=fail]').removeClass('d-none');
        // SNI = Encrypted/TLSv1.3 OR not none/plaintext
        $("#status_secure_sni").children('span[data-status]').addClass('d-none');
        if(["encrypted", "TLSv1.3"].indexOf(this.trace.sni) !== -1 && ["none", "plaintext"].indexOf(this.trace.sni) === -1)
            $("#status_secure_sni").find('span[data-status=pass]').removeClass('d-none').text(this.trace.sni);
        else
            $("#status_secure_sni").find('span[data-status=fail]').removeClass('d-none').text(this.trace.sni);
    },
    test_dnssec: function() {
        let t = "https://" + this.randomstr + "_" + rootdomain.replaceAll('.', '_') + ".brokendnssec.net/check"
        $.get(t)
            .done(() => {
                this.dnssec=!1;
                $("#status_dnssec").children('span[data-status]').addClass('d-none');
                $("#status_dnssec").find('span[data-status=fail]').removeClass('d-none');
            })
            .fail(() => {
                this.dnssec=!0;
                $("#status_dnssec").children('span[data-status]').addClass('d-none');
                $("#status_dnssec").find('span[data-status=pass]').removeClass('d-none');
            })
            .always(() => this.can_recheck())
    },
    can_recheck: async function() {
        if(this.dnssec === null)
            return !1;
        for(const [k, v] of Object.entries(this.securedns)) {
            if(v===null)
                return !1;
        }
        $("#btnRecheck").prop('disabled', !1);
    },
    test_connectivity: function() {
        const d = $("#app_tests");
        d.html('');

        // Randomized subdomain test (bypass DNS caching)
        let r = this.results.clone();
        r.attr('data-target', "Internet")
        r.find('div:nth-child(1)').text("Internet");
        r = d.append(r).find('div.row[data-target="Internet"]')
        const startTime = Date.now();
        // Temporarily hard-coded until rolled out everywhere
        $.get("https://" + this.randomstr + ".networkstest.xyz/ping")
        // $.get("https://" + this.randomstr + "." + domain + "/ping")
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
        // this.test_site({name: "Internet", url: !1, testpoint: });

        // Third-party site tests for end user reachability
        for(const s of this.reachability_test) {
            this.test_site(s);
        }
    },
    test_site: async function(s) {
        const d = $("#app_tests");
        // Add the row to the list
        let r = this.results.clone();
        r.attr('data-target', s.name)
        if(s.url)
            r.find('div:nth-child(1)').html('<a href="' + s.url + '" target="_blank">' + s.name + '</a>');
        else
            r.find('div:nth-child(1)').text(s.name);
        r = d.append(r).find('div.row[data-target="' + s.name + '"]')
        // Now test and update
        try {
            const res = await this._testSiteAccessibility(s);
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
            const status = {name: s.name, url: s.url, accessible: !1, time: null};
            let startTime, endTime;
            // Add some anti-tracking
            img.referrerPolicy = 'same-origin';
            img.onload = function() {
                endTime = Date.now();
                clearTimeout(timeout);
                status.accessible = !0;
                status.time = endTime - startTime;
                resolve(status);
            };
            img.onerror = function() {
                clearTimeout(timeout);
                status.accessible = !1;
                resolve(status);
            };
            // Time request as well
            startTime = Date.now();
            // Append a cache-busting query parameter to prevent caching
            img.src = s.testpoint + "?r" + Date.now();
            // Set a timeout in case the image never loads (e.g., blocked)
            const timeout = setTimeout(() => {
                // Cancel the image load and resolve as inaccessible
                img.src = "";
                resolve(status);
            }, 5000); // 5 seconds timeout
        });
    },
    serviceWorker: {
        init: function() {
            if(!is_https) {
                console.warn("Not served over HTTPS so service worker will not be registered.");
                return !1;
            }
            if('serviceWorker' in navigator) {
                this.serviceWorker.register();
            }
            else {
                this.serviceWorker.status("unsupported")
            }
        },
        register: function() {
            navigator.serviceWorker.register('/service-worker.js')
                .then(this.serviceWorker.registered)
                .catch(this.serviceWorker.register_error);
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
