(function (root) {
  'use strict';
  const icons = {
    bolt: '<path d="m14 2-9 12h6l-1 8 9-12h-6z"/>',
    sound: '<path d="M11 5 6 9H3v6h3l5 4zM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14"/>',
    mute: '<path d="M11 5 6 9H3v6h3l5 4zM16 9l6 6m0-6-6 6"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-1 1-2 1-2 3m0 3v.1"/>',
    undo: '<path d="m8 4-5 5 5 5M3 9h10a7 7 0 0 1 0 14" transform="translate(0 -2)"/>',
    reset: '<path d="M4 11a8 8 0 1 1 2 7M4 4v7h7"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    leaf: '<path d="M4 20c0-10 2-15 16-16 0 14-6 17-13 13m-3 3L15 9"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
    moon: '<path d="M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z"/>',
    home: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>'
  };
  const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name] || icons.bolt}</svg>`;
  function line(mask) {
    const points = [[50,0],[100,50],[50,100],[0,50]].filter((_, d) => mask & (1 << d));
    if (points.length === 2) return `M${points[0]} Q50,50 ${points[1]}`;
    return points.map(p => `M50,50 L${p}`).join(' ');
  }
  function tileArt(tile, groups, live, index, delays = []) {
    const delay = g => Number.isFinite(delays[g]) ? Math.max(0, delays[g]) : 0;
    let art = '';
    if (tile.kind === 'garden') {
      art = index % 3 === 0 ? '<ellipse cx="51" cy="73" rx="17" ry="5" fill="#1c3c39"/><path d="M50 68V42" stroke="#647f69" stroke-width="3"/><ellipse cx="43" cy="47" rx="9" ry="16" transform="rotate(-30 43 47)" fill="#587b65"/><ellipse cx="58" cy="39" rx="9" ry="17" transform="rotate(25 58 39)" fill="#74947a"/>' : '<circle cx="44" cy="51" r="2" fill="#4e7066"/><circle cx="54" cy="45" r="1.5" fill="#4e7066"/><circle cx="57" cy="58" r="2" fill="#4e7066"/>';
    } else {
      groups.forEach((mask, g) => {
        art += `<path d="${line(mask)}" class="conduit-outline"/><path d="${line(mask)}" class="conduit ${live[g] ? 'live' : ''}"${live[g] ? ` style="--power-delay:${delay(g)}ms"` : ''}/>`;
      });
      if (tile.kind === 'source') {
        art += '<rect x="23" y="19" width="54" height="62" rx="14" fill="#3f6153"/><rect x="27" y="23" width="46" height="54" rx="11" fill="#527563"/><path d="m53 31-14 22h12l-4 17 16-25H51z" fill="#ffe6a2"/><circle cx="32" cy="29" r="2" fill="#9cb6a1"/><circle cx="68" cy="71" r="2" fill="#9cb6a1"/>';
      } else if (tile.kind === 'home') {
        const on = live.some(Boolean);
        const homeDelay = on ? Math.min(...live.map((powered, g) => powered ? delay(g) : Infinity)) : 0;
        art += `<path d="M23 46 50 24 77 46v35H23Z" fill="${on ? '#b7ab8c' : '#7c9181'}"/><path d="m17 46 33-27 33 27-6 6-27-22-27 22z" fill="${on ? '#bb7459' : '#607c70'}"/><rect x="32" y="49" width="14" height="16" rx="2" fill="${on ? '#ffe29a' : '#284b46'}" class="${on ? 'window-lit' : ''}"${on ? ` style="--power-delay:${homeDelay}ms"` : ''}/><path d="M39 50v14m-6-7h12" stroke="${on ? '#a77842' : '#6f8c7b'}" stroke-width="2"/><rect x="55" y="58" width="12" height="23" rx="2" fill="${on ? '#786e54' : '#4d6f61'}"/><circle cx="63" cy="71" r="1.5" fill="#d5c59b"/>`;
      } else if (tile.fixed) {
        art += '<g class="fixed-mount"><rect x="67" y="66" width="27" height="27" rx="6" fill="#173d38" stroke="#93aa91" stroke-width="2"/><path d="M70 77v-7h7m7 20h7v-7" fill="none" stroke="#b9c5a5" stroke-width="2"/><circle cx="80.5" cy="79.5" r="7" fill="#a8b49a" stroke="#d7dcc1" stroke-width="1.5"/><path d="m77 76 7 7m0-7-7 7" stroke="#36534a" stroke-width="2.5" stroke-linecap="round"/></g>';
      }
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true" class="tile-drawing">${art}</svg>`;
  }
  function town(count, decor, highlightLevel = 0) {
    count = Number.isFinite(count) ? Math.max(0, Math.min(12, Math.floor(count))) : 0;
    const dusk = count / 12, bakery = count >= 6, all = count >= 12;
    const lit = '#ffe3a0', dark = '#344e50';
    const shade = (day, night) => '#' + [1,3,5].map(i => Math.round(parseInt(day.slice(i,i+2),16) * (1-dusk) + parseInt(night.slice(i,i+2),16) * dusk).toString(16).padStart(2,'0')).join('');
    // One reward group per main level; neither decoration nor bonus levels add a reward.
    const reward = (level, art) => `<g class="town-reward${level <= count && level === highlightLevel ? ' town-new' : ''}" data-reward-level="${level}">${art}</g>`;
    const win = (x,y,on,w=9,h=14) => `${on ? `<rect x="${x-3}" y="${y-3}" width="${w+6}" height="${h+6}" rx="4" fill="#ffc976" opacity=".15"/>` : ''}<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${on ? lit : dark}" class="${on ? 'town-window' : ''}"/><path d="M${x+w/2} ${y+1}v${h-2}M${x+1} ${y+h/2}h${w-2}" stroke="${on ? '#bc925a' : '#75847b'}" stroke-width="1"/>`;
    const lamp = (x,y,on) => `<path d="M${x} 251V${y-8}" stroke="${shade('#68715d','#526761')}" stroke-width="4"/>${on ? `<ellipse cx="${x}" cy="257" rx="24" ry="7" fill="#f5cc7b" opacity=".22"/><circle cx="${x}" cy="${y}" r="27" fill="#ffdc8e" opacity=".13"/><circle cx="${x}" cy="${y}" r="16" fill="#ffe7a4" opacity=".13"/>` : ''}<path d="M${x-11} ${y-8}h23l-4 17h-15Z" fill="${on ? lit : dark}" class="${on ? 'town-window' : ''}"/><path d="m${x-14} ${y-7} 14-11 15 11Z" fill="${shade('#596b5c','#344e48')}"/>`;
    let s = `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${shade('#678598','#192e48')}"/><stop offset="1" stop-color="${shade('#b7a6a0','#5c647c')}"/></linearGradient><linearGradient id="street" x2="0" y2="1"><stop stop-color="${shade('#748775','#334c48')}"/><stop offset="1" stop-color="${shade('#586d5b','#203c39')}"/></linearGradient></defs><rect width="420" height="300" fill="url(#sky)"/><circle cx="333" cy="${88+dusk*55}" r="23" fill="#ffe1a2" opacity="${Math.max(0,1-dusk*2)}"/><g opacity="${Math.max(0,(dusk-.33)/.67)}"><path d="M351 28a17 17 0 1 0 12 27 18 18 0 0 1-12-27Z" fill="#f4e9c7"/><path d="M51 42v5m-2.5-2.5h5M270 49v4m-2-2h4M123 72v4m-2-2h4M206 31v4m-2-2h4" stroke="#ded7bd" stroke-width="1.4" stroke-linecap="round"/></g><path d="M50 53h40m-22-7h43M238 86h43" stroke="${shade('#d6dfd8','#63788a')}" stroke-width="3" stroke-linecap="round"/><path d="M0 159 50 139l44 13 36-26 62 19 45-26 47 26 62-28 74 30v95H0Z" fill="${shade('#95aaa0','#344f58')}" opacity=".55"/><path d="M0 239Q210 206 420 238v62H0Z" fill="url(#street)"/><path d="M0 269q230-31 420-5" stroke="${shade('#b2b19b','#64716e')}" stroke-width="22" fill="none"/>`;
    s += `<path d="M27 146h88v91H27Z" fill="${shade('#d9ba99','#8d806e')}"/><path d="m17 148 54-44 54 44Z" fill="${shade('#916c59','#5a5351')}"/><rect x="90" y="105" width="10" height="29" fill="${shade('#ac8469','#776453')}"/>`;
    s += reward(1,win(42,161,count>=1))+reward(2,win(77,161,count>=2))+reward(3,win(42,190,count>=3))+reward(4,win(77,190,count>=4));
    s += `<rect x="58" y="216" width="17" height="25" rx="2" fill="${shade('#786e59','#4a5450')}"/><path d="M146 136h97v104h-97Z" fill="${shade('#e6d5b7','#9a9481')}"/><path d="m136 137 59-46 59 46Z" fill="${shade('#b97454','#805c50')}"/><rect x="225" y="102" width="9" height="24" fill="${shade('#d0ac88','#8e7d68')}"/>`;
    s += reward(5,win(162,151,count>=5));
    s += reward(6,win(198,151,bakery)+win(164,190,bakery,25,27)+win(208,190,bakery,18,48)+(bakery ? '<path d="M215 96q-8-8 0-15t0-13" fill="none" stroke="#ded9c6" stroke-width="3" opacity=".65" class="chimney"/>' : ''));
    s += `<path d="M153 184h81l-5 11h-72Z" fill="${shade('#cf7b54','#a36850')}"/><path d="M166 184h11l-1 11h-11m22-11h11l1 11h-12m22-11h11l3 11h-12" fill="${shade('#f1d7a7','#c5b891')}"/><rect x="162" y="172" width="65" height="9" rx="2" fill="${shade('#917153','#655b4a')}"/><text x="194" y="179" text-anchor="middle" fill="#f6e9cd" font-size="6" font-family="sans-serif" letter-spacing="1">ПЕКАРНЯ</text>`;
    s += `<rect x="292" y="138" width="91" height="104" fill="${shade('#adc1b3','#6f9186')}"/><path d="m283 139 55-37 55 37Z" fill="${shade('#57796d','#335b58')}"/><rect x="298" y="106" width="11" height="20" fill="${shade('#8aa393','#56776b')}"/>`;
    s += reward(7,win(306,155,count>=7))+reward(8,win(345,155,count>=8)+lamp(262,168,count>=8))+reward(9,win(306,184,count>=9))+reward(10,win(345,184,count>=10))+reward(11,win(346,214,count>=11));
    s += `<rect x="316" y="218" width="15" height="25" fill="${shade('#5b786b','#385c53')}"/>`;
    s += reward(12,lamp(128,205,all));
    s += `<path d="M10 242v-57m391 63v-68" stroke="${shade('#617258','#3c5a4b')}" stroke-width="5"/><ellipse cx="11" cy="184" rx="21" ry="38" fill="${shade('#738c67','#426953')}"/><ellipse cx="392" cy="182" rx="25" ry="40" fill="${shade('#6b8660','#375e4c')}"/><path d="M96 253h29m-25 0v8m21-8v8" stroke="${shade('#726750','#4b5348')}" stroke-width="4" stroke-linecap="round"/>`;
    if(all && decor==='garland') s += '<g class="town-decor"><path d="M26 113q174 90 358 10" fill="none" stroke="#738675" stroke-width="1.5"/>' + [50,90,130,170,210,250,290,330,370].map((x,i)=>`<circle cx="${x}" cy="${126+Math.sin(i/8*Math.PI)*28}" r="3.5" fill="${i%2?lit:'#eaa07e'}" class="town-window"/>`).join('') + '</g>';
    if(all && decor==='flowers') s += '<g class="town-decor">' + [40,140,246,285,370].map((x,i)=>`<path d="M${x} 249v-13" stroke="#66815b" stroke-width="2"/><circle cx="${x}" cy="235" r="5" fill="${i%2?'#f3c672':'#df977d'}"/><circle cx="${x}" cy="235" r="1.5" fill="#f5dfa2"/>`).join('') + '</g>';
    s += '<path d="M125 256q3-9 9-4l2 7h-11m3-7-1-4m5 3 1-4m2 9q8-7 9-2" stroke="#33473e" stroke-width="2" fill="#33473e" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 420 300" role="img" aria-label="Вечерний квартал: ${count} из 12 огоньков зажжено">${s}</svg>`;
  }
  root.BlockArt = Object.freeze({ icon, tileArt, town });
})(globalThis);
