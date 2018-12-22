#!/usr/bin/env node
// LICENSE_CODE ZON ISC
'use strict'; /*jslint node:true, esnext:true*/
const semver = require('semver');
const zerr = require('../util/zerr.js');
const pkg = require('../package.json');

const all_migrations = {
    '1.116.387': conf=>{
        conf.proxies = conf.proxies||[];
        const proxies = conf.proxies.map(p=>{
            p = Object.assign({}, p);
            if (p.socks)
                delete p.socks;
            ['null_response', 'bypass_proxy', 'direct_include']
            .forEach(option=>{
                const _option = option=='direct_include' ? 'direct' : option;
                if (p[option])
                {
                    p.rules = p.rules||{};
                    p.rules.pre = p.rules.pre||[];
                    p.rules.pre.push({trigger_type: 'url', url: p[option],
                        action: _option});
                    delete p[option];
                }
            });
            if (['session', 'sequential'].includes(p.last_preset_applied))
            {
                const opt = {session: 'session_long',
                    sequential: 'session_long'};
                p.last_preset_applied = opt[p.last_preset_applied];
            }
            if (p.session_duration)
                p.session_duration = +(''+p.session_duration).split(':')[0];
            return p;
        });
        return Object.assign({}, conf, {proxies});
    },
    '1.116.548': conf=>{
        conf.proxies = conf.proxies||[];
        const proxies = conf.proxies.map(p=>{
            // XXX bruno/krzysztof: check why rest operator crashes in this
            // file for win installation
            const proxy = Object.assign({}, p);
            if (proxy.keep_alive)
                proxy.keep_alive = true;
            else
                delete proxy.keep_alive;
            return proxy;
        });
        return Object.assign({}, conf, {proxies});
    },
};

const migrate = (conf, migrations=all_migrations)=>{
    conf = Object.assign({_defaults: {}, proxies: []}, conf);
    const version = conf._defaults.version||'0.0.0';
    for (let v in migrations)
    {
        if (semver.lt(v, version))
            continue;
        zerr.notice(`Migrating config file ${v}`);
        conf = migrations[v](conf);
    }
    conf._defaults.version = pkg.version;
    return conf;
};

const E = module.exports = migrate;
E.migrations = all_migrations;