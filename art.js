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
  function tileArt(tile, groups, live, index) {
    let art = '';
    if (tile.kind === 'garden') {
      art = index % 3 === 0 ? '<ellipse cx="51" cy="73" rx="17" ry="5" fill="#d5dbcd"/><path d="M50 68V42" stroke="#87937b" stroke-width="3"/><ellipse cx="43" cy="47" rx="9" ry="16" transform="rotate(-30 43 47)" fill="#a4b49b"/><ellipse cx="58" cy="39" rx="9" ry="17" transform="rotate(25 58 39)" fill="#b8c8ae"/>' : '<circle cx="44" cy="51" r="2" fill="#c5cbbb"/><circle cx="54" cy="45" r="1.5" fill="#c5cbbb"/><circle cx="57" cy="58" r="2" fill="#c5cbbb"/>';
    } else {
      groups.forEach((mask, g) => {
        art += `<path d="${line(mask)}" class="conduit-outline"/><path d="${line(mask)}" class="conduit ${live[g] ? 'live' : ''}"/>`;
      });
      if (tile.kind === 'source') {
        art += '<rect x="23" y="19" width="54" height="62" rx="14" fill="#3f6153"/><rect x="27" y="23" width="46" height="54" rx="11" fill="#527563"/><path d="m53 31-14 22h12l-4 17 16-25H51z" fill="#ffe6a2"/><circle cx="32" cy="29" r="2" fill="#9cb6a1"/><circle cx="68" cy="71" r="2" fill="#9cb6a1"/>';
      } else if (tile.kind === 'home') {
        const on = live.some(Boolean);
        art += `<path d="M23 46 50 24 77 46v35H23Z" fill="${on ? '#ead3ad' : '#d3d2c5'}"/><path d="m17 46 33-27 33 27-6 6-27-22-27 22z" fill="${on ? '#bd6a4e' : '#9da394'}"/><rect x="32" y="49" width="14" height="16" rx="2" fill="${on ? '#ffd16d' : '#899889'}" class="${on ? 'window-lit' : ''}"/><path d="M39 50v14m-6-7h12" stroke="${on ? '#b58148' : '#cad0bd'}" stroke-width="2"/><rect x="55" y="58" width="12" height="23" rx="2" fill="${on ? '#926a50' : '#a7ae9e'}"/><circle cx="63" cy="71" r="1" fill="#e9ddba"/>`;
      } else if (tile.fixed) {
        art += '<circle cx="79" cy="80" r="6" fill="#dce1d3" stroke="#a1ae99"/><path d="m77 78 4 4m0-4-4 4" stroke="#798774" stroke-width="1.5"/>';
      }
    }
    return `<svg viewBox="0 0 100 100" aria-hidden="true" class="tile-drawing">${art}</svg>`;
  }
  function town(count, decor) {
    const glow = count > 0, bakery = count >= 6, park = count >= 8, all = count >= 12;
    const lit = '#ffda83', dark = '#6b7974';
    const win = (x,y,on,w=9,h=14) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.5" fill="${on ? lit : dark}" class="${on ? 'town-window' : ''}"/>`;
    let s = '<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#b9caca"/><stop offset="1" stop-color="#e8ddc7"/></linearGradient><linearGradient id="street" x2="0" y2="1"><stop stop-color="#748775"/><stop offset="1" stop-color="#586d5b"/></linearGradient></defs><rect width="420" height="300" fill="url(#sky)"/><circle cx="333" cy="48" r="23" fill="#fff0c4"/><path d="M50 53h40m-22-7h43M238 86h43" stroke="#d6dfd8" stroke-width="3" stroke-linecap="round"/><path d="M0 159 50 139l44 13 36-26 62 19 45-26 47 26 62-28 74 30v95H0Z" fill="#95aaa0" opacity=".55"/><path d="M0 239Q210 206 420 238v62H0Z" fill="url(#street)"/><path d="M0 269q230-31 420-5" stroke="#b2b19b" stroke-width="22" fill="none"/>';
    s += '<path d="M27 146h88v91H27Z" fill="#d9ba99"/><path d="m17 148 54-44 54 44Z" fill="#916c59"/><rect x="90" y="105" width="10" height="29" fill="#ac8469"/>';
    s += win(42,161,glow)+win(77,161,count>=2)+win(42,190,count>=3)+win(77,190,count>=4);
    s += '<rect x="58" y="216" width="17" height="25" rx="2" fill="#786e59"/><path d="M146 136h97v104h-97Z" fill="#e6d5b7"/><path d="m136 137 59-46 59 46Z" fill="#b97454"/><rect x="225" y="102" width="9" height="24" fill="#d0ac88"/>';
    s += win(162,151,count>=5)+win(198,151,bakery)+win(164,190,bakery,25,27)+win(208,190,bakery,18,48);
    s += '<path d="M153 184h81l-5 11h-72Z" fill="#cf7b54"/><path d="M166 184h11l-1 11h-11m22-11h11l1 11h-12m22-11h11l3 11h-12" fill="#f1d7a7"/><rect x="162" y="172" width="65" height="9" rx="2" fill="#917153"/><text x="194" y="179" text-anchor="middle" fill="#f6e9cd" font-size="6" font-family="sans-serif" letter-spacing="1">ПЕКАРНЯ</text>';
    s += '<rect x="292" y="138" width="91" height="104" fill="#adc1b3"/><path d="m283 139 55-37 55 37Z" fill="#57796d"/><rect x="298" y="106" width="11" height="20" fill="#8aa393"/>';
    s += win(306,155,count>=7)+win(345,155,park)+win(306,184,count>=9)+win(345,184,count>=10)+win(346,214,count>=11);
    s += '<rect x="316" y="218" width="15" height="25" fill="#5b786b"/><path d="M262 251v-89" stroke="#68715d" stroke-width="4"/><path d="M251 160h23l-4 17h-15Z" fill="'+(park?lit:'#8c9783')+'"/><path d="m248 161 14-11 15 11Z" fill="#596b5c"/>';
    if(park) s += '<circle cx="262" cy="168" r="27" fill="#ffdf92" opacity=".12"/>';
    s += '<path d="M10 242v-57m391 63v-68" stroke="#617258" stroke-width="5"/><ellipse cx="11" cy="184" rx="21" ry="38" fill="#738c67"/><ellipse cx="392" cy="182" rx="25" ry="40" fill="#6b8660"/><path d="M96 253h29m-25 0v8m21-8v8" stroke="#726750" stroke-width="4" stroke-linecap="round"/>';
    if(bakery) s += '<path d="M215 96q-8-8 0-15t0-13" fill="none" stroke="#f3efdb" stroke-width="3" opacity=".7" class="chimney"/>';
    if(all && decor==='garland') s += '<path d="M26 113q174 90 358 10" fill="none" stroke="#667761" stroke-width="1.5"/>' + [50,90,130,170,210,250,290,330,370].map((x,i)=>`<circle cx="${x}" cy="${126+Math.sin(i/8*Math.PI)*28}" r="3.5" fill="${i%2?lit:'#eaa07e'}" class="town-window"/>`).join('');
    if(all && decor==='flowers') s += [40,140,246,285,370].map((x,i)=>`<path d="M${x} 249v-13" stroke="#476b45" stroke-width="2"/><circle cx="${x}" cy="235" r="5" fill="${i%2?'#f3c672':'#df977d'}"/><circle cx="${x}" cy="235" r="1.5" fill="#f5dfa2"/>`).join('');
    s += '<path d="M125 256q3-9 9-4l2 7h-11m3-7-1-4m5 3 1-4m2 9q8-7 9-2" stroke="#515e4b" stroke-width="2" fill="#515e4b" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 420 300" role="img" aria-label="Вечерний квартал: ${count} из 12 огоньков зажжено">${s}</svg>`;
  }
  root.BlockArt = Object.freeze({ icon, tileArt, town });
})(globalThis);
