// LICENSE_CODE ZON ISC
'use strict'; /*jslint react:true, es6:true*/
import regeneratorRuntime from 'regenerator-runtime';
import React from 'react';
import classnames from 'classnames';
import $ from 'jquery';
import etask from 'hutil/util/etask';
import ajax from 'hutil/util/ajax';
import {presets} from './common.js';

const tabs = {
    target: {
        label: 'Targeting',
        tooltip: 'Select specific targeting for your proxy exit node',
        fields: {
            country: {
                label: 'Country',
                tooltip: 'Choose your exit country for your requests',
            },
            state: {
                label: 'State',
                tooltip: 'The city from which IP will be allocated',
            },
            city: {
                label: 'City',
                tooltip: 'Specifc ASN provider',
            },
            asn: {
                label: 'ASN',
                tooltip: 'Specific state in a given country',
            },
        },
    },
    speed: {
        label: 'Request Speed',
        tooltip: 'Control the speed of your request to improve performance',
        fields: {
            dns_lookup: {
                label: 'DNS Lookup',
                tooltip: 'Location of DNS resolve',
            },
            timeout_super_proxy: {
                label: 'Timeout for requests on the super proxy',
                tooltip: `Kill requests to super proxy and try new one if
                    timeout is exceeded`,
            },
            session_timeout: {
                label: 'Session establish timeout',
                tooltip: 'session establish == search + connect to peer',
            },
            min_number_super_proxy: {
                label: 'Minimum number of super proxies to use',
                tooltip: `min number of failed attempts before switching
                    proxy`,
            },
            auto_switch_super_proxy: {
                label: 'Automatically switch super proxy on failure',
                tooltip: `if request failed (status 4XX) use a differen zagent
                    next time`,
            },
            throttle_req: {
                label: 'Throttle requests above given number',
                tooltip: 'allow maximum number of requests per unit of time',
            },
        },
    },
    zero: {
        label: 'Zero fail',
        tooltip: 'Configure rules to handle failed requests',
        fields: {},
    },
    rotation: {
        label: 'IP Control',
        tooltip: 'Set the conditions for which your IPs will change',
        fields: {
            datacenter_ip: {
                label: 'Data center IP',
                tooltip: `choose specific data center IP (when datacenter
                    zone`,
            },
            pool_size: {
                label: 'Pool size',
                tooltip: `maintain number of IPs that will be pinged constantly
                    - must have keep_allive to work properly`,
            },
            pool_type: {
                label: 'Pool type',
                tooltip: `How to pull the IPs - roundrobin / sequential`,
            },
            keep_alive: {
                label: 'Keep-alive',
                tooltip: `chosen number of sec to ping ip and keep it
                    connected`,
            },
            whitelist_ip_access: {
                label: 'Whitelist IP access',
                tooltip: `Grant proxy access to specific IPs. only those
                    IPs will be able to send requests to Port`,
            },
            random_session: {
                label: 'Random Session',
                tooltip: `switch session ID on each request`,
            },
            explicit_session: {
                label: 'Explicit Session',
                tooltip: `insert session ID to maintain the same session`,
            },
            sticky_ip: {
                label: 'Sticky IP',
                tooltip: `when connecting to lpm server from different servers
                    stick sessions to client ips`,
            },
            max_requests: {
                label: 'Max Requests',
                tooltip: `change session based on number of requests can be a
                    range or a fixed number`,
            },
            session_duration: {
                label: 'Session Duration',
                tooltip: `change session after fixed number of seconds`,
            },
            session_id_seed: {
                label: 'Session ID Seed',
                tooltip: `seed used for random number generator in random
                    sessions`,
            },
            allow_req_auth: {
                label: 'Allow request authentication',
                tooltip: `allow passing auth data per request (use lpm like
                    api)`,
            },
        },
    },
    debug: {
        label: 'Debugging',
        tooltip: 'Improve the info you receive from the Proxy Manager',
        fields: {
            log_req_history: {
                label: 'Log request history',
                tooltip: `keep track of requests made through LPM, view
                    through UI or download from UI. This feature is
                    disabled by default.`,
            },
            ssl_analyzing: {
                label: 'Enable SSL analyzing',
                tooltip: `allow the proxy manager to read HTTPS requests`,
            },
            log_level: {
                label: 'Log level',
                tooltip: `which data to show in logs`,
            },
            lum_req_debug_info: {
                label: 'Luminati request debug info',
                tooltip: `send debug info on every request`,
            },
        },
    },
    general: {
        label: 'General',
        tooltip: '',
        fields: {
            interface: {
                label: 'Interface',
                tooltip: `network interface on the machine to use`,
            },
            multiply: {
                label: 'Multiply',
                tooltip: `create multiple identical ports`,
            },
            socks_5_port: {
                label: 'SOCKS 5 port',
                tooltip: `in addition to current port, creates a separate port
                    with a socks5 server (here provide the port)`,
            },
            ssl_to_super_proxy: {
                label: 'SSL to super proxy',
                tooltip: `encrypt requests sent to super proxy to avoid
                    detection on DNS`,
            },
            url_regex_null_resp: {
                label: 'URL regex pattern for null response',
                tooltip: `on this url pattern, lpm will return a "null
                    response" without proxying (usefull when users don't want
                    to make a request, but a browser expects 200 response)`,
            },
            url_regex_bypassing: {
                label: `URL regex for bypassing the proxy manager and send
                    directly to host`,
                tooltip: `requests with this pattern will be passed directly,
                    without any proxy (super proxy or peer)`,
            },
            url_regex_sent_directly: {
                label: `URL regex for requests to be sent directly from super
                    proxy`,
                tooltip: `urls with this pattern will not be sent trough peers
                    but throug super proxy directly`,
            },
            url_regex_not_sent_directly: {
                label: `URL regex for requests to not be sent directly from
                    super proxy`,
                tooltip: `negation of the abow (to exlude from a set)`,
            },
        },
    },
};

class Index extends React.Component {
    constructor(props){
        super(props);
        this.state = {tab: 'target', cities: {}, fields: {}};
        if (!props.extra)
        {
            window.location.href='/';
            this.proxy = {zones: {}};
        }
        else
            this.proxy = props.extra;
    }
    componentWillMount(){
        const _this = this;
        etask(function*(){
            const consts = yield ajax.json({url: '/api/consts'});
            _this.setState({consts});
        });
    }
    componentDidMount(){ $('[data-toggle="tooltip"]').tooltip(); }
    click_tab(tab){ this.setState({tab}); }
    update_states_and_cities(country, states, cities){
        this.setState(prev_state=>({
            states: Object.assign({}, prev_state.states, {[country]: states}),
            cities: Object.assign({}, prev_state.cities, {[country]: cities}),
        }));
    }
    field_changed(field_name, value){
        this.setState(prev_state=>({fields:
            Object.assign({}, prev_state.fields, {[field_name]: value})}));
    }
    render(){
        let Main_window;
        switch (this.state.tab)
        {
        case 'target': Main_window = Target; break;
        case 'speed': Main_window = Speed; break;
        case 'zero': Main_window = To_implement; break;
        case 'rotation': Main_window = Rotation; break;
        case 'debug': Main_window = Debug; break;
        case 'general': Main_window = General; break;
        }
        return (
            <div className="lpm edit_proxy">
              <h3>Edit port {this.props.port}</h3>
              <Nav zones={Object.keys(this.proxy.zones)}/>
              <Nav_tabs curr_tab={this.state.tab} fields={this.state.fields}
                on_tab_click={this.click_tab.bind(this)}/>
              <Main_window {...this.state.consts} cities={this.state.cities}
                states={this.state.states}
                update_states_and_cities={this.update_states_and_cities.bind(this)}
                on_change_field={this.field_changed.bind(this)}
                fields={this.state.fields}/>
            </div>
        );
    }
}

const Nav = props=>{
    return (
        <div className="nav">
          <Field options={props.zones} label="Zone"/>
          <Field options={presets.map(p=>p.title)} label="Preset"/>
          <Action_buttons/>
        </div>
    );
};

const Field = props=>{
    const options = props.options||[];
    return (
        <div className="field">
          <div className="title">{props.label}</div>
          <select>
            {options.map(o=>(
              <option key={o} value="">{o}</option>
            ))}
          </select>
        </div>
    );
};

const Action_buttons = ()=>(
    <div className="action_buttons">
      <button className="btn btn_lpm btn_lpm_normal btn_cancel">Cancel</button>
      <button className="btn btn_lpm btn_save">Save</button>
    </div>
);

const Nav_tabs = props=>{
    return (
        <div className="nav_tabs">
          <Tab_btn {...props} id="target"/>
          <Tab_btn {...props} id="speed"/>
          <Tab_btn {...props} id="zero"/>
          <Tab_btn {...props} id="rotation"/>
          <Tab_btn {...props} id="debug"/>
          <Tab_btn {...props} id="general"/>
        </div>
    );
};

const Tab_btn = props=>{
    const btn_class = classnames('btn_tab',
        {active: props.curr_tab==props.id});
    const changes = Object.keys(props.fields).filter(f=>{
        const val = props.fields[f];
        const tab_fields = Object.keys(tabs[props.id].fields);
        return tab_fields.includes(f) && val && val!='*';
    }).length;
    return (
        <div onClick={()=>props.on_tab_click(props.id)}
          className={btn_class}>
          <Tab_icon id={props.id} error={props.error} changes={changes}/>
          <div className="title">{tabs[props.id].label}</div>
          <div className="arrow"/>
          <Tooltip_icon title={tabs[props.id].tooltip}/>
        </div>
    );
};

const Tab_icon = props=>{
    const circle_class = classnames('circle_wrapper', {
        active: props.error||props.changes, error: props.error});
    const content = props.error ? '!' : props.changes;
    return (
        <div className={classnames('icon', props.id)}>
          <div className={circle_class}>
            <div className="circle">{content}</div>
          </div>
        </div>
    );
};

const Tooltip_icon = props=>props.title ? (
    <div className="info" data-toggle="tooltip"
      data-placement="bottom" title={props.title}/>) : null;

class Section extends React.Component {
    constructor(props){
        super(props);
        this.state = {focused: false};
    }
    on_focus(){ this.setState({focused: true}); }
    on_blur(){ this.setState({focused: false}); }
    render(){
        const dynamic_class = {
            error: this.props.error,
            correct: this.props.correct,
            active: this.props.active||this.state.focused,
        };
        return (
            <div tabIndex="0" onFocus={this.on_focus.bind(this)}
              onBlur={this.on_blur.bind(this)} className="section_wrapper">
              <div className={classnames('section', dynamic_class)}>
                {this.props.children}
                <div className="icon"/>
                <div className="arrow"/>
              </div>
              <div className="message_wrapper">
                <div className={classnames('message', dynamic_class)}>
                  {tabs[this.props.tab_id].fields[this.props.id].tooltip}
                </div>
              </div>
            </div>
        );
    }
}

const Select = props=>(
    <select value={props.fields[props.id]} onChange={props.on_change_wrapper}>
      {(props.data||[]).map((c, i)=>(
        <option key={i} value={c.value}>{c.key}</option>
      ))}
    </select>
);

const Input = props=>(
    <input type={props.type} value={props.fields[props.id]||''}
      onChange={props.on_change_wrapper}/>
);

const Input_boolean = props=>(
    <div>
      <input type="radio" checked={props.fields[props.id]=='1'}
        onChange={props.on_change_wrapper} id="enable"
        name={props.id} value="1"/>
      <label htmlFor="enable">Enabled</label>
      <input type="radio" checked={props.fields[props.id]=='0'}
        onChange={props.on_change_wrapper} id="disable"
        name={props.id} value="0"/>
      <label htmlFor="disable">Disabled</label>
    </div>
);

const Section_field = props=>{
    const {id, fields, on_change, on_change_field, data, type, tab_id} = props;
    const on_change_wrapper = e=>{
        if (on_change)
            on_change(e);
        on_change_field(id, e.target.value);
    };
    let Comp;
    switch (type)
    {
    case 'select': Comp = Select; break;
    case 'text':
    case 'number': Comp = Input; break;
    case 'boolean': Comp = Input_boolean; break;
    case 'double_select': Comp = To_implement; break;
    }
    return (
        <Section correct={fields[id] && fields[id]!='*'} id={id}
          tab_id={tab_id}>
          <div className="desc">{tabs[tab_id].fields[id].label}</div>
          <Comp fields={fields} id={id} data={data} type={type}
            on_change_wrapper={on_change_wrapper}/>
        </Section>
    );
};

class With_data extends React.Component {
    wrapped_children(){
        return React.Children.map(this.props.children, child=>{
            return React.cloneElement(child, this.props); });
    }
    render(){ return <div>{this.wrapped_children()}</div>; }
}

class Target extends React.Component {
    allowed_countries(){
        let countries = this.props.proxy && this.props.proxy.country.values
            || [];
        if (this.props.zone=='static')
        {
            countries = this.props.proxy.countries.filter(c=>
                ['', 'au', 'br', 'de', 'gb', 'us'].includes(c.value));
        }
        return countries;
    }
    country_changed(e){
        const country = e.target.value;
        if (this.props.cities[country])
            return;
        const _this = this;
        etask(function*(){
            const cities = yield ajax.json({url: '/api/cities/'+country});
            const states = yield ajax.json({url: '/api/regions/'+country});
            _this.props.update_states_and_cities(country, states, cities);
        });
        this.props.on_change_field('city', '');
        this.props.on_change_field('state', '');
    }
    states(){
        const country = this.props.fields.country;
        return country&&this.props.states&&this.props.states[country]||[];
    }
    state_changed(e){ this.props.on_change_field('city', ''); }
    cities(){
        const country = this.props.fields.country;
        const state = this.props.fields.state;
        const cities = country&&this.props.cities[country]||[];
        if (state)
            return cities.filter(c=>c.region==state||!c.region||c.region=='*');
        else
            return cities;
    }
    render(){
        return (
            <With_data fields={this.props.fields} tab_id="target"
              on_change_field={this.props.on_change_field}>
              <Section_field type="select" id="country"
                data={this.allowed_countries()}
                on_change={this.country_changed.bind(this)}/>
              <Section_field type="select" id="state" data={this.states()}
                on_change={this.state_changed.bind(this)} />
              <Section_field type="select" id="city" data={this.cities()}/>
              <Section_field type="number" id="asn"/>
            </With_data>
        );
    }
}


class Speed extends React.Component {
    render(){
        return (
            <With_data fields={this.props.fields} tab_id="speed"
              on_change_field={this.props.on_change_field}>
              <Section_field type="select" id="dns_lookup"/>
              <Section_field type="number" id="timeout_super_proxy"/>
              <Section_field type="number" id="session_timeout"/>
              <Section_field type="select" id="min_number_super_proxy"/>
              <Section_field type="select" id="auto_switch_super_proxy"/>
              <Section_field type="number" id="throttle_req"/>
            </With_data>
        );
    }
}

class Rotation extends React.Component {
    render() {
        return (
            <With_data fields={this.props.fields} tab_id="rotation"
              on_change_field={this.props.on_change_field}>
              <Section_field type="text" id="datacenter_ip"/>
              <Section_field type="number" id="pool_size"/>
              <Section_field type="select" id="pool_type"/>
              <Section_field type="number" id="keep_alive"/>
              <Section_field type="select" id="whitelist_ip_access"/>
              <Section_field type="boolean" id="random_session"/>
              <Section_field type="text" id="explicit_session"/>
              <Section_field type="select" id="sticky_ip"/>
              <Section_field type="double_select" id="max_requests"/>
              <Section_field type="double_select" id="session_duration"/>
              <Section_field type="text" id="session_id_seed"/>
              <Section_field type="select" id="allow_req_auth"/>
            </With_data>
        );
    }
}

class Debug extends React.Component {
    render(){
        return (
            <With_data fields={this.props.fields} tab_id="debug"
              on_change_field={this.props.on_change_field}>
              <Section_field type="select" id="log_req_history"/>
              <Section_field type="select" id="ssl_analyzing"/>
              <Section_field type="select" id="log_level"/>
              <Section_field type="select" id="lum_req_debug_info"/>
            </With_data>
        );
    }
}

class General extends React.Component {
    render(){
        return (
            <With_data fields={this.props.fields} tab_id="general"
              on_change_field={this.props.on_change_field}>
              <Section_field type="select" id="interface"/>
              <Section_field type="number" id="multiply"/>
              <Section_field type="select" id="socks_5_port"/>
              <Section_field type="select" id="ssl_to_super_proxy"/>
              <Section_field type="text" id="url_regex_null_resp"/>
              <Section_field type="text" id="url_regex_bypassing"/>
              <Section_field type="text" id="url_regex_sent_directly"/>
              <Section_field type="text" id="url_regex_not_sent_directly"/>
            </With_data>
        );
    }
}

const To_implement = ()=>(
    <div>To implement</div>
);

export default Index;