/* Three vector district panoramas. Load after art.js; no network or bitmap assets. */
(function districtInstaller(root) {
  'use strict';
  const colors = { warm:'#ffe2a0', off:'#355652', trim:'#526d5d' };
  const names = {
    ru:['Старый двор','Набережная','Сады на холме'],
    en:['Old Courtyard','Riverside','Hilltop Gardens']
  };
  const shade = (a,b,t) => '#' + [1,3,5].map(i=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0')).join('');
  function uniqueIds(svg, prefix) {
    return svg.replace(/\bid="([^"]+)"/g, (_,id)=>`id="${prefix}${id}"`)
      .replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}${id})`)
      .replace(/\bhref="#([^"]+)"/g,(_,id)=>`href="#${prefix}${id}"`);
  }
  function decoration(kind, district) {
    if (kind === 'garland') {
      const points = district === 2 ? [[48,115],[86,137],[124,154],[162,166],[200,171],[238,168],[276,158],[314,143],[352,123]]
        : [[44,122],[84,141],[124,155],[164,163],[204,165],[244,162],[284,153],[324,139],[364,120]];
      return `<g class="town-decor" data-decoration="garland"><path d="${district===2?'M27 98Q207 245 378 100':'M25 108Q206 222 384 104'}" fill="none" stroke="#748b75" stroke-width="1.5"/>${points.map(([x,y],i)=>`<circle cx="${x}" cy="${y}" r="5" fill="${i%2?colors.warm:'#efa786'}" class="town-window"/>`).join('')}</g>`;
    }
    if (kind === 'flowers') {
      const positions = district===2 ? [[38,251],[113,244],[197,267],[310,256],[378,238]]
        : district===1 ? [[26,221],[78,223],[343,221],[381,220]]
          : [[40,249],[140,249],[246,249],[285,249],[370,249]];
      return `<g class="town-decor" data-decoration="flowers">${positions.map(([x,y],i)=>`<path d="M${x-8} ${y-1}h16l-3 12h-10Z" fill="#b8795f"/><path d="M${x} ${y}v-16m0 9-6-5m6 2 6-5" fill="none" stroke="#88a477" stroke-width="2"/><circle cx="${x}" cy="${y-17}" r="6" fill="${i%2?'#f1c879':'#e8a28d'}"/><circle cx="${x}" cy="${y-17}" r="2" fill="#fbe5ae"/>`).join('')}</g>`;
    }
    return '';
  }
  function town(completed, decor, district=0, language='ru', decorUnlocked=false, uniqueToken='aside') {
    const count = Number.isFinite(completed) ? Math.max(0,Math.min(20,Math.floor(completed))) : 0;
    district = Number.isInteger(district) ? Math.max(0,Math.min(2,district)) : 0;
    const lang = language === 'en' ? 'en' : 'ru';
    const chosenDecor = decor === 'flowers' || decor === 'garland' ? decor : '';
    const showDecor = decorUnlocked === true || count >= 20;
    // Encode the entire caller token, avoiding collisions introduced by stripping punctuation.
    const prefix = 'district-' + Array.from(String(uniqueToken || 'aside')).map(c=>c.codePointAt(0).toString(16)).join('-') + '-' + district + '-';
    const label = lang === 'en' ? `${names.en[district]}: ${count} of 20 levels completed` : `${names.ru[district]}: пройдено ${count} из 20 уровней`;
    if (district === 0) {
      let svg = root.BlockArt.town(Math.round(count/20*12), count>=20 ? chosenDecor : '');
      // Previously earned decorations remain visible when legacy progress is below 20.
      if (showDecor && count < 20) svg = svg.replace('</svg>',decoration(chosenDecor,0)+'</svg>');
      svg = svg.replace('role="img"',`role="img" class="district-panorama district-0" data-district="0" data-completed="${count}"`)
        .replace(/aria-label="[^"]*"/,`aria-label="${label}"`)
        .replace('ПЕКАРНЯ',lang==='en'?'BAKERY':'ПЕКАРНЯ');
      return uniqueIds(svg,prefix);
    }
    const dusk = count/20;
    const mix = (day,night) => shade(day,night,dusk);
    const reward = (level,art) => `<g class="town-reward" data-reward-level="${level}">${art}</g>`;
    const glow = (x,y,on,rx=18,ry=18) => on ? `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ffd98c" opacity=".16"/>` : '';
    const window = (x,y,level,w=12,h=17) => reward(level,
      glow(x+w/2,y+h/2,count>=level,w*.9,h*.8) +
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.7" fill="${count>=level?colors.warm:colors.off}" class="${count>=level?'town-window':''}"/><path d="M${x+w/2} ${y+1}v${h-2}m${1-w/2} ${1-h/2}h${w-2}" fill="none" stroke="${count>=level?'#b28c53':'#79907b'}" stroke-width="1"/>`);
    const lantern = (x,y,level,bottom=y+46) => reward(level,
      `<path d="M${x} ${bottom}V${y-5}" stroke="${mix('#64765b','#466b59')}" stroke-width="3.3"/>` +
      glow(x,y,count>=level,23,27) +
      (count>=level?`<ellipse cx="${x}" cy="${bottom+3}" rx="18" ry="5" fill="#f2c979" opacity=".22"/>`:'') +
      `<path d="M${x-6} ${y-5}h12l-2 13h-8Z" fill="${count>=level?colors.warm:colors.off}" class="${count>=level?'town-window':''}"/><path d="m${x-9} ${y-4} 9-9 9 9Z" fill="${mix('#5d765f','#355c53')}"/>`);
    let art = `<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="${mix('#7499a9','#19334f')}"/><stop offset="1" stop-color="${mix('#d7c6ae','#70758a')}"/></linearGradient><linearGradient id="river" x2="0" y2="1"><stop stop-color="${mix('#91b9b5','#426979')}"/><stop offset="1" stop-color="${mix('#739d9e','#24495d')}"/></linearGradient><linearGradient id="garden" x2="0" y2="1"><stop stop-color="${mix('#8da878','#45674f')}"/><stop offset="1" stop-color="${mix('#607f5d','#23473c')}"/></linearGradient></defs><rect width="420" height="300" fill="url(#sky)"/><circle cx="349" cy="${65+dusk*65}" r="22" fill="#ffe2a5" opacity="${Math.max(0,1-dusk*2)}"/><g opacity="${Math.max(0,(dusk-.25)/.75)}"><path d="M355 26a18 18 0 1 0 12 27 19 19 0 0 1-12-27Z" fill="#f4e7c4"/><path d="M52 48v5m-2.5-2.5h5M269 44v4m-2-2h4M117 69v4m-2-2h4M205 27v4m-2-2h4" stroke="#e2ddc8" stroke-width="1.4" stroke-linecap="round"/></g><path d="M53 80h44m-23-7h35M232 95h38" stroke="${mix('#dbe2d6','#6c8190')}" stroke-width="3" stroke-linecap="round"/>`;
    if (district === 1) {
      art += `<g class="district-river"><path d="M0 157 31 139l29 10 31-30 45 21 28-24 39 23 33-31 45 33 37-18 42 21 31-11 29 28v66H0Z" fill="${mix('#9bafa1','#405e64')}" opacity=".8"/><path d="M0 196Q194 178 420 201v99H0Z" fill="url(#river)"/><path d="M0 204q65-17 111 10l13 22H0ZM304 216q62-25 116-14v35H298Z" fill="${mix('#acaa8b','#686f63')}"/><path d="M0 234h118m186 1h116" stroke="${mix('#dbcfac','#94917b')}" stroke-width="5"/><path d="M2 252h61m243 13h53M85 282h64m22-28h35m134 29h71" stroke="${mix('#d0d6bd','#668792')}" stroke-width="2" stroke-linecap="round" opacity=".55"/>`;
      art += `<rect x="24" y="137" width="77" height="76" fill="${mix('#dec29e','#928878')}"/><path d="m15 139 47-39 48 39Z" fill="${mix('#aa745c','#6c5755')}"/><rect x="79" y="110" width="9" height="21" fill="${mix('#c7a17e','#8b7462')}"/>`;
      art += window(37,150,1)+window(70,150,2)+window(37,179,3)+window(70,179,4);
      art += `<rect x="53" y="188" width="16" height="27" fill="${mix('#89785c','#566457')}"/><rect x="130" y="127" width="65" height="81" fill="${mix('#e6d4ae','#a39b80')}"/><path d="m121 129 41-35 42 35Z" fill="${mix('#be805f','#805c55')}"/>`;
      art += window(140,138,5)+window(137,176,6,22,27)+window(169,138,7)+window(166,176,8,20,27);
      art += `<rect x="136" y="161" width="52" height="10" rx="2" fill="${mix('#987a55','#655f4c')}"/><text x="162" y="168.6" text-anchor="middle" fill="#f5e8c8" font-size="6" font-family="sans-serif" letter-spacing=".8">${lang==='en'?'BAKERY':'ПЕКАРНЯ'}</text><path d="M130 171h65l-3 8h-59Z" fill="${mix('#d7976d','#ac765d')}"/><path d="M141 171h10v8h-10m20-8h10v8h-10m13-8h8v8h-8" fill="${mix('#f1d9af','#cbbf93')}"/>`;
      art += `<rect x="298" y="134" width="80" height="77" fill="${mix('#aac1af','#648b80')}"/><path d="m289 136 49-42 49 42Z" fill="${mix('#648b78','#355f5c')}"/><path d="M303 128h10v-18h-10Z" fill="${mix('#9bb39d','#5c8170')}"/>`;
      art += window(311,146,9)+window(346,146,10)+window(311,176,11)+window(346,176,12);
      art += `<rect x="329" y="183" width="16" height="30" fill="${mix('#708d72','#3d6555')}"/><path d="M97 244v-25Q210 140 323 219v25h-29v-24Q210 171 126 220v24Z" fill="${mix('#d2c1a1','#978d7d')}"/><path d="M100 219Q210 141 320 219" fill="none" stroke="${mix('#e7d7b8','#b6a894')}" stroke-width="6"/><path d="M100 204Q210 133 320 204" fill="none" stroke="${mix('#728271','#466862')}" stroke-width="3"/>`;
      art += [0,.2,.4,.6,.8,1].map(t=>{const x=100+220*t,y=204-142*t*(1-t);return `<path d="M${x} ${y}v14" stroke="${mix('#728271','#466862')}" stroke-width="3"/>`;}).join('');
      art += lantern(211,137,13,181)+lantern(13,171,14,230)+lantern(397,170,15,230)+window(333,116,16,11,13);
      art += `<g class="district-boat"><path d="M48 263q32 14 61 0l-9 11H59Z" fill="${mix('#a47658','#645746')}"/><path d="M76 264v-26m0 0 22 23H76Z" fill="${mix('#e6d6ac','#a6aa99')}" stroke="${mix('#96876e','#647a73')}" stroke-width="1.5"/>${reward(17,glow(72,259,count>=17,17,13)+`<rect x="68" y="254" width="8" height="9" rx="2" fill="${count>=17?colors.warm:colors.off}" class="${count>=17?'town-window':''}"/>`)}</g>`;
      art += reward(18,`${glow(141,201,count>=18,15,18)+glow(278,201,count>=18,15,18)}<circle cx="141" cy="201" r="4" fill="${count>=18?colors.warm:colors.off}" class="${count>=18?'town-window':''}"/><circle cx="278" cy="201" r="4" fill="${count>=18?colors.warm:colors.off}" class="${count>=18?'town-window':''}"/>`);
      art += window(157,116,19,10,10);
      art += reward(20,`<path d="M107 218q105-54 207 0" fill="none" stroke="#758a78" stroke-width="1.2"/>${[123,151,179,207,235,263,291].map((x,i)=>`<circle cx="${x}" cy="${215-Math.sin(i/6*Math.PI)*24}" r="3" fill="${count>=20?colors.warm:colors.off}" class="${count>=20?'town-window':''}"/>`).join('')}`);
      if(count>=13) art += `<g class="district-reflections" stroke="#e4c084" stroke-linecap="round" opacity="${.2+dusk*.25}"><path d="M204 246h14m-21 7h25m-14 7h11m-25 7h31M13 249h13m-20 7h26m362-7h13m-18 7h24" stroke-width="2.4"/>${count>=20?'<path d="M143 239h13m125 2h15m-102 39h32m-21 8h19" stroke-width="2"/>':''}</g>`;
      art += `<path d="M112 225v-38m182 40v-40" stroke="${mix('#62775f','#3e6153')}" stroke-width="3"/><ellipse cx="111" cy="181" rx="11" ry="23" fill="${mix('#7e9d76','#476f59')}"/><ellipse cx="290" cy="181" rx="12" ry="21" fill="${mix('#819f77','#426954')}"/></g>`;
    } else {
      art += `<g class="district-gardens"><path d="M0 186Q49 80 139 129T284 123T420 146v154H0Z" fill="${mix('#9fb387','#5e7d68')}"/><path d="M0 195Q89 143 174 169T325 151T420 184v116H0Z" fill="${mix('#829e73','#3b6554')}"/><path d="M0 221Q65 180 131 208T259 205T420 207v93H0Z" fill="url(#garden)"/><path d="M-10 288Q95 214 160 254T322 266Q357 241 426 245" fill="none" stroke="${mix('#c4bd96','#8d977b')}" stroke-width="24"/><path d="m101 240 9 13m9-20 9 12m10-18 9 11m13-15 5 12m142 27-7-13m24 3-9-12m20 0-10-10" stroke="${mix('#a3a17f','#6c8067')}" stroke-width="2.5"/>`;
      art += `<path d="M34 219v-67m-23 57v-49m394 65v-66" stroke="${mix('#786e51','#52684e')}" stroke-width="5"/><ellipse cx="15" cy="163" rx="23" ry="42" fill="${mix('#8ca679','#527950')}"/><ellipse cx="404" cy="157" rx="26" ry="48" fill="${mix('#74976b','#37684c')}"/><rect x="39" y="128" width="72" height="89" fill="${mix('#e0cba4','#9a9580')}"/><path d="m30 130 45-41 46 41Z" fill="${mix('#af8167','#765e59')}"/><rect x="94" y="102" width="9" height="23" fill="${mix('#cbaa86','#8e7c67')}"/>`;
      art += window(50,142,1)+window(85,142,2)+window(50,171,3)+window(85,171,4)+window(66,110,5,12,12)+window(71,195,6,13,20);
      art += `<g class="district-greenhouse"><path d="M144 216v-45l39-28 39 28v45Z" fill="${mix('#b0c4a0','#688f79')}" stroke="${mix('#e2d9b3','#a8b39a')}" stroke-width="4"/><path d="m144 171 39-28 39 28m-39-28v73m-38-45h76" fill="none" stroke="${mix('#e2d9b3','#a8b39a')}" stroke-width="3"/>`;
      art += window(152,179,7,12,26)+window(170,179,8,10,26)+window(187,179,9,10,26)+window(204,179,10,10,26)+window(169,160,11,11,11)+window(187,160,12,11,11);
      art += `<path d="M151 214q9-17 14 0m6 0q8-23 15 0m7 0q10-19 19 0" fill="${mix('#678d62','#3e6d50')}"/></g>`;
      art += `<g class="district-gazebo"><ellipse cx="315" cy="224" rx="51" ry="12" fill="${mix('#607b54','#254e3d')}" opacity=".65"/><path d="M273 211h82l8 11h-97Z" fill="${mix('#c7bb91','#929c7b')}"/><path d="M274 157h80v57h-80Z" fill="${mix('#758f67','#365e49')}" opacity=".7"/>`;
      art += reward(13,(count>=13?'<ellipse cx="314" cy="186" rx="39" ry="33" fill="#ffdc91" opacity=".19"/>':'')+`<path d="M302 160h25l-5 12h-15Z" fill="${count>=13?colors.warm:colors.off}" class="${count>=13?'town-window':''}"/><path d="M314 150v10" stroke="#c9c8a0" stroke-width="2"/>`);
      art += window(281,181,14,12,25)+window(336,181,15,12,25);
      art += `<path d="M270 159h87m-81 0v56m77-56v56m-56-56v56m35-56v56" fill="none" stroke="${mix('#ded5ae','#aeb99b')}" stroke-width="5"/><path d="m262 159 52-36 52 36Z" fill="${mix('#759779','#426d58')}"/><path d="m269 153 45-30 45 30" fill="none" stroke="${mix('#92ad85','#61846a')}" stroke-width="3"/><path d="M291 202h49m-47 0v11m44-11v11" stroke="${mix('#a68e63','#7d8b68')}" stroke-width="4" stroke-linecap="round"/></g>`;
      art += lantern(125,192,16,244)+lantern(250,187,17,240);
      art += reward(18,`${glow(392,159,count>=18,23,27)}<path d="M392 132v20" stroke="#a5b18b" stroke-width="1.5"/><path d="M386 152h12l-1 13h-10Z" fill="${count>=18?colors.warm:colors.off}" class="${count>=18?'town-window':''}"/>`);
      art += reward(19,[[46,270],[173,266],[230,280],[354,253]].map(([x,y])=>`${glow(x,y,count>=19,13,9)}<path d="M${x-4} ${y+4}h8v-7h-8Z" fill="${count>=19?colors.warm:colors.off}" class="${count>=19?'town-window':''}"/>`).join(''));
      art += reward(20,`<path d="M273 159q41 20 81 0" fill="none" stroke="#9cab87" stroke-width="1"/>${[282,298,314,330,346].map((x,i)=>`<circle cx="${x}" cy="${163+Math.sin(i/4*Math.PI)*7}" r="3.8" fill="${count>=20?colors.warm:colors.off}" class="${count>=20?'town-window':''}"/>`).join('')}`);
      art += `<ellipse cx="57" cy="243" rx="24" ry="8" fill="${mix('#506e47','#1d4837')}"/><ellipse cx="356" cy="242" rx="26" ry="9" fill="${mix('#526f46','#234b37')}"/>${[[45,240],[54,236],[65,242],[343,239],[354,235],[366,240]].map(([x,y],i)=>`<path d="M${x} ${y+3}v-8" stroke="#94aa79" stroke-width="2"/><circle cx="${x}" cy="${y-7}" r="4" fill="${i%2?'#d4bb78':'#bfaa8c'}"/>`).join('')}<path d="M20 285q5-9 13-1l4 2h-17m3-3-1-4m6 2 1-4m7 7q6-8 10-1" fill="#355142" stroke="#355142" stroke-width="2" stroke-linecap="round"/></g>`;
    }
    if(showDecor) art += decoration(chosenDecor,district);
    return uniqueIds(`<svg viewBox="0 0 420 300" role="img" aria-label="${label}" class="district-panorama district-${district}" data-district="${district}" data-completed="${count}">${art}</svg>`,prefix);
  }
  root.BlockDistrictArt = Object.freeze({ town });
})(globalThis);
