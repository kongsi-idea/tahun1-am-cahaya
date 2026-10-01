// 物件图示（同一套笔触：深墨描边 + 暖色填色）。不用 emoji。
const S = 'stroke="#2b2540" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
const wrap = (inner) => `<svg viewBox="0 0 48 48" aria-hidden="true">${inner}</svg>`;

export const ICON = {
  candle: wrap(`<ellipse cx="24" cy="42" rx="12" ry="3" fill="#c9ced3" ${S}/><rect x="18" y="20" width="12" height="21" rx="2" fill="#fbf6ea" ${S}/><path d="M24 6c4 5 5 8 0 12-5-4-4-7 0-12z" fill="#ffc24d" ${S}/><path d="M24 11c2 3 2 4 0 6-2-2-2-3 0-6z" fill="#fff6dc"/>`),
  fire: wrap(`<rect x="8" y="34" width="32" height="7" rx="2" fill="#3a3a3a" ${S}/><path d="M14 33c0-6 3-8 4-12 2 4 3 5 3 8 1-3 2-5 3-9 3 5 5 8 5 13 1-2 2-3 3-5 2 3 2 4 2 5z" fill="#6fb3ff" ${S}/><path d="M20 33c0-3 2-4 3-6 1 2 3 4 3 6z" fill="#dff0ff"/>`),
  torch2: wrap(`<rect x="6" y="19" width="24" height="10" rx="3" fill="#d0452f" ${S}/><path d="M30 17h6l4-3v20l-4-3h-6z" fill="#3a3a3a" ${S}/><path d="M41 18l5-3M41 24h6M41 30l5 3" stroke="#ffbf3d" stroke-width="2.4" stroke-linecap="round"/>`),
  pelita: wrap(`<rect x="15" y="22" width="18" height="20" rx="4" fill="#9aa3a8" ${S}/><rect x="21" y="16" width="6" height="7" fill="#7d6b52" ${S}/><path d="M24 4c4 5 4 8 0 11-4-3-4-6 0-11z" fill="#ffb84d" ${S}/>`),
  mirror: wrap(`<rect x="13" y="4" width="22" height="38" rx="5" fill="#c7a36a" ${S}/><rect x="17" y="8" width="14" height="30" rx="3" fill="#cfe0ea" ${S}/><path d="M20 14l6-4M20 20l8-6" stroke="#fff" stroke-width="2" stroke-linecap="round"/><path d="M18 42h12" ${S}/>`),
  spoon: wrap(`<ellipse cx="17" cy="16" rx="8" ry="11" transform="rotate(-35 17 16)" fill="#d7dde2" ${S}/><path d="M22 23l17 17" stroke="#2b2540" stroke-width="5.5" stroke-linecap="round"/><path d="M22 23l17 17" stroke="#d7dde2" stroke-width="2" stroke-linecap="round"/><path d="M13 12l3-3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`),
  bag: wrap(`<path d="M17 12a7 7 0 0114 0" fill="none" ${S}/><rect x="9" y="12" width="30" height="31" rx="7" fill="#2f5fa8" ${S}/><rect x="14" y="27" width="20" height="12" rx="4" fill="#24508f" ${S}/><rect x="12" y="20" width="24" height="4" rx="1.5" fill="#e9f2ff" ${S}/>`),
  cat: wrap(`<path d="M10 20l3-12 7 7h8l7-7 3 12v8c0 9-6 14-14 14S10 37 10 28z" fill="#3a3330" ${S}/><ellipse cx="18" cy="25" rx="3" ry="2.6" fill="#a7ff6e"/><ellipse cx="30" cy="25" rx="3" ry="2.6" fill="#a7ff6e"/><path d="M24 30l-2 2h4z" fill="#e8a0a0"/>`),
  moon: wrap(`<circle cx="24" cy="24" r="16" fill="#f3f1e4" ${S}/><circle cx="18" cy="19" r="3.5" fill="#d8d6c8"/><circle cx="29" cy="29" r="5" fill="#d8d6c8"/><circle cx="30" cy="16" r="2" fill="#d8d6c8"/>`),
  sun: wrap(`<circle cx="24" cy="24" r="9" fill="#ffc94a" ${S}/><g stroke="#f29b26" stroke-width="3" stroke-linecap="round"><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.5 10.5l4 4M33.5 33.5l4 4M10.5 37.5l4-4M33.5 14.5l4-4"/></g>`),
  book: wrap(`<path d="M6 12c6-2 12-2 18 2 6-4 12-4 18-2v26c-6-2-12-2-18 2-6-4-12-4-18-2z" fill="#fbf5e6" ${S}/><path d="M24 14v26" ${S}/>`),
  door: wrap(`<rect x="12" y="5" width="24" height="38" rx="2" fill="#7a4a2b" ${S}/><circle cx="30" cy="25" r="2" fill="#e8d9a8"/>`),
  stairs: wrap(`<path d="M6 42h8v-8h8v-8h8v-8h8v-8h4v32z" fill="#c08a58" ${S}/>`),
  toys: wrap(`<rect x="6" y="26" width="20" height="10" rx="3" fill="#e0473a" ${S}/><circle cx="11" cy="37" r="3" fill="#333"/><circle cx="21" cy="37" r="3" fill="#333"/><circle cx="35" cy="30" r="8" fill="#f2c14e" ${S}/><path d="M28 30h14" stroke="#3d8fd1" stroke-width="2.5"/>`),
  torch: wrap(`<rect x="4" y="19" width="22" height="10" rx="3" fill="#ffb547" ${S}/><path d="M26 17h6l4-3v20l-4-3h-6z" fill="#3a3a3a" ${S}/><path d="M38 16l8-5v26l-8-5z" fill="#ffe9a8" opacity=".9"/>`),
  eye: wrap(`<path d="M4 24c5-9 12-13 20-13s15 4 20 13c-5 9-12 13-20 13S9 33 4 24z" fill="#fff" ${S}/><circle cx="24" cy="24" r="7" fill="#5a8fd6" ${S}/><circle cx="24" cy="24" r="3" fill="#1d1a2a"/>`),
  sound: wrap(`<path d="M8 19h7l9-7v24l-9-7H8z" fill="#fff6e5" ${S}/><path d="M30 18c3 3 3 9 0 12M34 14c5 5 5 15 0 20" fill="none" ${S}/>`),
  mute: wrap(`<path d="M8 19h7l9-7v24l-9-7H8z" fill="#fff6e5" ${S}/><path d="M31 19l10 10M41 19L31 29" ${S}/>`),
};
