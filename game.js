'use strict';
/* ===== チャッピースタリオン v0 ===== */
const $ = (id) => document.getElementById(id);
const rand = (a, b) => a + Math.random() * (b - a);
const randi = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (oku) => {
  if (Math.abs(oku) >= 10000) return (oku / 10000).toFixed(2) + '兆円';
  if (Math.abs(oku) >= 1) return oku.toFixed(1) + '億円';
  return Math.round(oku * 10000) + '万円';
};

const AP_PER_TURN = 3;
const MAX_TURNS = 40; // 10年
const START_YEAR = 2027;

const ROLES = {
  researcher: { name: '研究者', cost: 0.3, salary: 0.12, desc: '学習の効果UP・チーム疲弊の回復UP・論文採択率UP' },
  engineer:   { name: 'エンジニア', cost: 0.2, salary: 0.08, desc: 'プロダクト収益UP・技術的負債がたまりにくい' },
  sales:      { name: '営業', cost: 0.1, salary: 0.06, desc: 'プロダクト収益UP・エンタープライズ解禁' },
};

const PRODUCTS = [
  { id: 'chat', name: 'チャットアプリ「Chappy」', req: 15, cost: 0.8, base: 0.6, needSales: 0 },
  { id: 'api', name: '開発者向けAPI', req: 30, cost: 2, base: 1.5, needSales: 0 },
  { id: 'code', name: 'コーディング支援「Stallion Code」', req: 45, cost: 4, base: 3, needSales: 1 },
  { id: 'ent', name: 'エンタープライズAI', req: 55, cost: 8, base: 6, needSales: 4 },
  { id: 'agent', name: '自律AIエージェント', req: 70, cost: 18, base: 14, needSales: 6 },
  { id: 'agi', name: '汎用AI「グランドスタリオン」', req: 88, cost: 50, base: 40, needSales: 10 },
];

const ROUNDS = [
  { name: 'シード追加', minVal: 0, dil: [0.15, 0.22] },
  { name: 'シリーズA', minVal: 40, dil: [0.18, 0.25] },
  { name: 'シリーズB', minVal: 120, dil: [0.12, 0.20] },
  { name: 'シリーズC', minVal: 400, dil: [0.10, 0.16] },
  { name: 'シリーズD', minVal: 1200, dil: [0.08, 0.12] },
  { name: 'レイトステージ', minVal: 3000, dil: [0.05, 0.10] },
];

/* ===== ライバル ===== */
// likes: 各ライバルが好む「次の一手」の重み
const RIVALS = [
  { name: 'オープンブレイン', tag: 'OB', col: '#f2c94c', style: '拡大至上主義', model: 'OB',
    likes: { raise: 3, launch: 3, model: 2, press: 1, poach: 1, price: 0.5, bid: 2, ipo: 3 },
    lines: { taunt: '「AGIを作るのは我々だ。君たちは観客席でどうぞ」', lose: '「…今回は譲ろう。次のモデルで取り返す」', win: '「予想通りの結果だね」',
      poach: '「優秀な人材は、より大きな使命に惹かれるものさ」', press: '「彼らのモデルは我々の劣化コピーにすぎない」', bid: '「一緒になろう。断る理由はないはずだ」', pass: '「抜かれた？ 一時的な誤差だよ」' } },
  { name: 'ジェミニー', tag: 'GM', col: '#6fa8ff', style: '物量の巨人', model: 'Gem',
    likes: { raise: 1, launch: 3, model: 3, press: 1, poach: 2, price: 1, bid: 2.5, ipo: 1 },
    lines: { taunt: '「我々のデータセンターは、君の会社の評価額より大きい」', lose: '「…想定外だ。予算を倍にしろ」', win: '「規模の差は、努力では埋まらない」',
      poach: '「年収3倍。悪い話じゃないだろう？」', press: '「スタートアップのAIに企業の機密を預けますか？」', bid: '「買収提案だ。サインは一度で済む」', pass: '「我々の本気はこれからだ」' } },
  { name: 'アンソロポス', tag: 'AN', col: '#e39a6a', style: '安全性の旗手', model: 'Opus',
    likes: { raise: 2, launch: 2, model: 2, press: 3, poach: 2, price: 0.3, bid: 0.3, ipo: 1 },
    lines: { taunt: '「速さより安全を。彼らにはそれが分かっていない」', lose: '「数字だけがAIの価値ではありません」', win: '「誠実なモデルは、強いモデルでもある」',
      poach: '「安全な研究環境で働きませんか、と声をかけただけです」', press: '「あのラボの安全対策は不十分だと言わざるを得ません」', bid: '「責任あるAIのために、統合を提案します」', pass: '「順位より大切なものがあります」' } },
  { name: 'ディープシーカー', tag: 'DS', col: '#5fd0b0', style: '低コストの刺客', model: 'DS',
    likes: { raise: 0.6, launch: 2, model: 3, press: 1, poach: 1, price: 3, bid: 0.5, ipo: 0.5 },
    lines: { taunt: '「同じ性能を1/10の値段で。それだけの話です」', lose: '「次はもっと安く、もっと速く」', win: '「高いGPUはいらなかったようですね」',
      poach: '「うちは自由ですよ。論文も好きに書けます」', press: '「彼らのAPI価格はぼったくりです」', bid: '「…買えるなら、買いますよ」', pass: '「まだ本気の値下げはしていません」' } },
  { name: 'メタルAI', tag: 'MT', col: '#b48cff', style: '札束とオープン戦略', model: 'Metal',
    likes: { raise: 1, launch: 2, model: 2, press: 1, poach: 3, price: 2, bid: 1.5, ipo: 0.5 },
    lines: { taunt: '「重みは全部オープンにする。君たちの商売はおしまいだ」', lose: '「次は研究者ごと買い取る」', win: '「オープンは勝つ。いつだってね」',
      poach: '「契約金は好きな額を書いてくれ」', press: '「クローズドなAIは時代遅れだ」', bid: '「君たちのチームが欲しい。会社ごとね」', pass: '「チームを総入れ替えするだけさ」' } },
];
const COMP_NAMES = RIVALS.map(r => r.name);

const TARGET_NAMES = ['ニューラル工房', 'トークン屋', 'ベクトル堂', 'プロンプト社', 'データ農園', 'GPU長屋', 'ロボ工房', 'エンベッド商会'];


/* ===== SVGアイコン ===== */
const SV = (inner, vb = 24) => `<svg viewBox="0 0 ${vb} ${vb}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICONS = {
  hire: SV('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6.5 6.5-6.5s6.5 2.9 6.5 6.5"/><path d="M18.5 7.5v6M15.5 10.5h6"/>'),
  compute: SV('<rect x="6" y="6" width="12" height="12" rx="1"/><rect x="9.5" y="9.5" width="5" height="5"/><path d="M9 2.5v3.5M15 2.5v3.5M9 18v3.5M15 18v3.5M2.5 9h3.5M2.5 15h3.5M18 9h3.5M18 15h3.5"/>'),
  train: SV('<path d="M4.5 6.5L12 4M4.5 6.5L12 12M4.5 6.5L12 20M4.5 17.5L12 4M4.5 17.5L12 12M4.5 17.5L12 20M12 4l7.5 5M12 12l7.5-3M12 12l7.5 3M12 20l7.5-5M12 4l7.5 11M12 20l7.5-11" stroke-width=".7" opacity=".7"/><circle cx="4.5" cy="6.5" r="1.8"/><circle cx="4.5" cy="17.5" r="1.8"/><circle cx="12" cy="4" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="20" r="1.8"/><circle cx="19.5" cy="9" r="1.8"/><circle cx="19.5" cy="15" r="1.8"/>'),
  launch: SV('<path d="M12 2.5c3 2.5 4.5 6 4.5 10l-2 3.5h-5l-2-3.5C7.5 8.5 9 5 12 2.5z"/><circle cx="12" cy="9.5" r="1.7"/><path d="M9.5 16l-2.5 4.5M14.5 16l2.5 4.5M12 17v4.5"/>'),
  bench: SV('<path d="M3 21h18"/><rect x="5" y="13" width="3" height="8"/><rect x="10.5" y="8" width="3" height="13"/><rect x="16" y="3.5" width="3" height="17.5"/>'),
  raise: SV('<circle cx="12" cy="12" r="9"/><path d="M8.5 7l3.5 4.5L15.5 7M12 11.5V18M9 13h6M9 15.8h6"/>'),
  ma: SV('<circle cx="9" cy="12" r="6"/><circle cx="15" cy="12" r="6"/><path d="M12 7.2v9.6" stroke-dasharray="1.5 1.5"/>'),
  gig: SV('<rect x="3" y="7" width="18" height="13" rx="1"/><path d="M9 7V4.5h6V7M3 12.5h18M11 12.5v2h2v-2"/>'),
  pr: SV('<path d="M4 10v4h3l6 4V6L7 10H4z"/><path d="M16.5 9a4 4 0 010 6M19 6.5a7.5 7.5 0 010 11"/>'),
  rival: SV('<path d="M4 4l11 11M4 4h3.5M4 4v3.5M12.5 17.5l5-5M15.5 15.5l4 4"/><path d="M20 4L9 15M20 4h-3.5M20 4v3.5M11.5 17.5l-5-5M8.5 15.5l-4 4"/>'),
  ipo: SV('<path d="M3 20.5h18"/><path d="M4 16l5-5 4 3 7-8"/><path d="M15 6h5v5"/>'),
};
// ニューラルコア・エンブレム（六角形＋ネットワーク）
function coreSVG(state = '') {
  const L = [[26, [34, 50, 66]], [50, [26, 42, 58, 74]], [74, [38, 62]]];
  let lines = '', dots = '';
  for (let i = 0; i < L.length - 1; i++) for (const y1 of L[i][1]) for (const y2 of L[i + 1][1]) lines += `M${L[i][0]} ${y1}L${L[i + 1][0]} ${y2}`;
  L.forEach(([x, ys]) => ys.forEach(y => { dots += `<circle class="n" cx="${x}" cy="${y}" r="3.2"/>`; }));
  return `<svg class="core ${state}" viewBox="0 0 100 100" fill="none">
    <polygon class="hex" points="50,4 90,27 90,73 50,96 10,73 10,27" stroke="url(#gold-g)" stroke-width="1.6"/>
    <polygon class="hex2" points="50,12 83,31 83,69 50,88 17,69 17,31" stroke="url(#gold-g)" stroke-width=".6" opacity=".5"/>
    <circle cx="50" cy="50" r="30" fill="url(#core-g)" opacity=".18"/>
    <path class="syn" d="${lines}" stroke="url(#gold-g)" stroke-width=".7" opacity=".55"/>
    <g fill="url(#gold-g)">${dots}</g>
  </svg>`;
}
function initEmblems() { document.querySelectorAll('.core-emblem').forEach(el => { el.innerHTML = coreSVG(); }); }

/* ===== 背景ニューラルネット ===== */
// スマホ：アニメーションは一切回さず静止画を1枚だけ描く（発熱・カクつき・操作不能の原因だったため）
// PC：1本の rAF ループを30fpsに間引き、タブ非表示・プレイ画面・モーダル表示中は完全停止
const IS_TOUCH = matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
if (IS_TOUCH) document.documentElement.classList.add('touch');
let bgWake = () => {};
function initNeuralBg() {
  const cv = $('neural-bg'); if (!cv) return;
  const ctx = cv.getContext('2d', { alpha: true });
  const DPR = IS_TOUCH ? 1 : Math.min(devicePixelRatio || 1, 1.5);
  let W, H, lastW = 0, nodes = [], pulses = [];
  const R = 170 * DPR;
  const build = () => {
    if (innerWidth === lastW && nodes.length) return false;
    lastW = innerWidth;
    const vh = innerHeight;
    W = cv.width = Math.round(innerWidth * DPR); H = cv.height = Math.round(vh * DPR);
    cv.style.width = innerWidth + 'px'; cv.style.height = vh + 'px';
    const n = Math.round(Math.min(IS_TOUCH ? 28 : 70, innerWidth * vh / 18000));
    nodes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: rand(-.15, .15) * DPR, vy: rand(-.15, .15) * DPR }));
    return true;
  };
  const draw = (move) => {
    ctx.clearRect(0, 0, W, H);
    if (move) for (const p of nodes) { p.x += p.vx * 2; p.y += p.vy * 2; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
    ctx.lineWidth = DPR * .6;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(212,175,55,.16)';
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy < R * R) { ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); }
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(245,215,122,.75)';
    for (const p of nodes) ctx.fillRect(p.x - DPR, p.y - DPR, 2 * DPR, 2 * DPR);
    if (!move) return;
    if (Math.random() < .08 && nodes.length > 1) { const a = pick(nodes), b = pick(nodes); if (a !== b && Math.hypot(a.x - b.x, a.y - b.y) < R) pulses.push({ a, b, t: 0 }); }
    pulses = pulses.filter(p => (p.t += .05) < 1);
    ctx.fillStyle = 'rgba(255,240,180,.85)';
    for (const p of pulses) { const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t; ctx.beginPath(); ctx.arc(x, y, 2.5 * DPR, 0, 7); ctx.fill(); }
  };
  build(); draw(false);
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (build()) draw(false); }, 200); }, { passive: true });
  if (IS_TOUCH) return; // スマホは静止画のみ
  let raf = 0, last = 0;
  const shouldRun = () => !document.hidden && !$('game-screen').classList.contains('active') && $('modal').classList.contains('hidden');
  const loop = (t) => {
    raf = 0;
    if (!shouldRun()) return;
    if (t - last >= 33) { last = t; draw(true); }
    raf = requestAnimationFrame(loop);
  };
  bgWake = () => { if (!raf && shouldRun()) raf = requestAnimationFrame(loop); };
  document.addEventListener('visibilitychange', bgWake);
  bgWake();
}

let S = null;

/* ===== 創業期支援（序盤の難易度緩和） ===== */
// Q1〜Q4：採用・GPU・学習・広報・新規ローンチが4割引、人件費3割引
// Q5〜Q8：同2割引、人件費15%引き。Q9以降は通常（終盤の難しさは据え置き）
const EARLY_END = 8;
function earlyF() { return S.turn <= 4 ? 0.6 : S.turn <= EARLY_END ? 0.8 : 1; }
function earlyWage() { return S.turn <= 4 ? 0.7 : S.turn <= EARLY_END ? 0.85 : 1; }
const earlyTag = () => S.turn <= EARLY_END ? '・創業期割引' : '';

function newGame(name, diff) {
  const cash = { easy: 10, normal: 7, hard: 4.5 }[diff];
  const compBoost = diff === 'hard' ? 1.3 : diff === 'easy' ? 0.8 : 1;
  S = {
    name, diff, turn: 1, ap: AP_PER_TURN,
    cash, reputation: 30, compute: 10, modelScore: 10,
    staff: { researcher: 2, engineer: 2, sales: 0 },
    products: [], ownership: 1.0, roundIdx: 0, lastRaiseTurn: -9,
    sentiment: 1.0, computePrice: 1.0,
    revenue: 0, prev: {}, valuation: 0,
    competitors: RIVALS.map((R, i) => ({
      name: R.name, tag: R.tag, col: R.col, style: R.style, R, score: rand(10, 22) + (4 - i) * 2.2, speed: rand(0.9, 1.9) * compBoost, alive: true,
      cash: (R.tag === 'GM' ? 14 : rand(4, 8)) * (diff === 'hard' ? 1.3 : 1), rep: randi(28, 45), roundIdx: 0, products: [], heat: randi(5, 15),
      truce: 0, intent: null, ver: 1, ipo: false, w: 0, l: 0, rank: 0, prevRank: 0,
    })),
    roundFirst: {}, segFirst: {}, ipoFirst: null, qAct: { seg: [], pr: false }, everTop: false, beaten: [], lastMoves: [],
    target: null, buyoutOffer: null, ipoCooldown: 0, trainedThisTurn: 0, benchThisTurn: false,
    cond: 55, load: 0, debt: 5, strain: 0,
    crew: [], lineage: [{ gen: 1, name: 'Chappy-1', trait: 'know', lv: 1, score: 10, turn: 1, from: null, wins: 0, papers: 0 }],
    papers: 0, yPapers: 0, paperSub: null, hot: {}, poachTarget: null,
    flags: {}, history: [],
  };
  genTarget();
  const nem = pick(S.competitors); nem.heat = 40;
  S.valuation = calcValuation();
  updateRanks(true);
  planIntents();
  snapshot();
  { const [cn, cp] = pick(CREW_POOL.filter(x => x[1] === 'careful' || x[1] === 'genius')); S.crew.push({ n: cn, p: cp, chief: true, turn: 1 });
    const pool2 = CREW_POOL.filter(x => x[0] !== cn && x[1] !== cp); const [n2, p2] = pick(pool2); S.crew.push({ n: n2, p: p2, turn: 1 });
    S.lineage[0].trait = pick(Object.keys(TRAITS)); }
  log(`${S.name} 設立。資金 ${fmt(S.cash)}、研究者2名・エンジニア2名でスタート。創業モデル Chappy-1「${genLabel()}」`, 'q');
  S.crew.forEach(c => log(`${crewNameOf(c)}「${PERSONAS[c.p].hello}」 ${PERSONAS[c.p].eff}`, 'good'));
  log('目標：AIモデルを鍛え、プロダクトで稼ぎ、IPOを成功させよう（評価額1,000億円以上）。');
  const nm = nemesis();
  log(`宿敵：${nm.name}（${nm.style}）${nm.R.lines.taunt}`, 'rival');
  log(`創業期支援：Q1〜Q${EARLY_END}は採用・GPU・学習・広報・新規ローンチが割安、人件費も軽減。序盤の悪いニュースも控えめです。`, 'good');
}

/* ===== 計算 ===== */
function headcount() { return S.staff.researcher + S.staff.engineer + S.staff.sales; }
function burn() {
  let b = 0;
  for (const r in ROLES) b += S.staff[r] * ROLES[r].salary * earlyWage();
  b += S.compute * 0.025 * S.computePrice * (traitLv('eff') ? 0.9 : 1) * (S.load >= 85 ? 1.1 : 1);
  b += 0.1 + headcount() * 0.01; // オフィス等
  if (S.products.length) b += calcRevenue() * 0.25 * S.computePrice; // 推論コスト
  return b;
}
function topCompScore() { return Math.max(0, ...S.competitors.filter(c => c.alive).map(c => c.score)); }
function productRevenue(p) {
  const scoreF = S.modelScore / Math.max(p.req, 10);
  const lag = Math.max(0, topCompScore() - S.modelScore);
  const compF = clamp(1 - lag / 60, 0.3, 1.2);
  const salesF = 1 + S.staff.sales * 0.06;
  const engF = 1 + S.staff.engineer * 0.03;
  const repF = 0.5 + S.reputation / 100;
  return p.base * scoreF * compF * salesF * engF * repF * p.growth * segShare(p) * traitRevF(p.id);
}
function calcRevenue() { return S.products.reduce((s, p) => s + productRevenue(p), 0); }
function calcValuation() {
  const annual = calcRevenue() * 4;
  const tech = Math.pow(S.modelScore, 2.2) * 0.05;
  const team = headcount() * 0.8;
  const rep = S.reputation * 0.3;
  return Math.max(1, (annual * 12 + tech + team + rep + S.compute * 0.2) * S.sentiment);
}
function snapshot() { S.prev = { cash: S.cash, valuation: S.valuation, modelScore: S.modelScore, revenue: S.revenue, reputation: S.reputation }; }
function dateLabel(t = S.turn) { return `${START_YEAR + Math.floor((t - 1) / 4)}年 Q${((t - 1) % 4) + 1}`; }

/* ===== ログ ===== */
const clean = (t) => String(t).replace(/🔒\s?/gu, '\u0000').replace(/\p{Extended_Pictographic}\uFE0F?\s?/gu, '').replace(/^\s+/, '').replace(/\u0000/g, '◇ ');
function log(msg, cls = '') {
  const p = document.createElement('p');
  p.textContent = clean(msg); if (cls) p.className = cls;
  const el = $('log'); el.appendChild(p);
  while (el.childElementCount > 120) el.firstElementChild.remove();
  el.scrollTop = el.scrollHeight;
}

/* ===== モーダル ===== */
let modalLocked = false;
function openModal(title, nodes, locked = false) {
  modalLocked = locked; $('modal-close').hidden = locked;
  $('modal-title').textContent = title;
  const body = $('modal-body'); body.innerHTML = '';
  nodes.forEach(n => body.appendChild(n));
  $('modal').classList.remove('hidden');
  document.documentElement.classList.add('modal-open');
  const mb = document.querySelector('.modal-box'); if (mb) mb.scrollTop = 0;
}
function closeModal() { $('modal').classList.add('hidden'); unlockScroll(); bgWake(); }
// モーダルが閉じているのに背面スクロールのロックが残る事故を防ぐ
function unlockScroll() { document.documentElement.classList.remove('modal-open'); document.body.style.overflow = ''; document.documentElement.style.overflow = ''; }
function optBtn(label, sub, onClick, disabled = false) {
  const b = document.createElement('button');
  b.className = 'btn opt'; b.disabled = disabled;
  b.innerHTML = `<span class="ol">${clean(label)}</span><small>${clean(sub)}</small>`;
  // 連打で二重実行されないよう、1回押したらそのモーダル内の選択肢をまとめて止める
  b.onclick = () => { if (b.dataset.busy) return; document.querySelectorAll('#modal-body .opt').forEach(o => { o.dataset.busy = 1; }); onClick();
    if (!$('modal').classList.contains('hidden') && $('modal-body').contains(b)) document.querySelectorAll('#modal-body .opt').forEach(o => { delete o.dataset.busy; }); };
  return b;
}
function para(html) { const d = document.createElement('p'); d.innerHTML = html; return d; }

function useAP(n = 1) {
  if (S.ap < n) { log('行動力が足りません。四半期を終えてください。', 'bad'); return false; }
  S.ap -= n; return true;
}
function spend(x) {
  if (S.cash < x) { log(`資金不足（必要 ${fmt(x)}）`, 'bad'); return false; }
  S.cash -= x; return true;
}

/* ===== アクション ===== */
const ACTIONS = [
  { id: 'hire', label: '採用', sub: 'チーム増強・個性派研究者', fn: actHire },
  { id: 'compute', label: '計算資源', sub: 'GPU増強・計算負荷を下げる', fn: actCompute },
  { id: 'train', label: 'トレーニング', sub: '学習・次世代モデル', fn: actTrain },
  { id: 'launch', label: 'プロダクト', sub: '市場へ投入・強化', fn: actLaunch },
  { id: 'bench', label: 'ベンチマーク', sub: 'モデル同士のレース', fn: actBench },
  { id: 'paper', label: '論文投稿', sub: '学会カレンダー・論文レース', fn: actPaper },
  { id: 'raise', label: '資金調達', sub: '投資家と交渉', fn: actRaise },
  { id: 'ma', label: 'M&A', sub: '買収・売却', fn: actMA },
  { id: 'pr', label: '広報', sub: '講演・取材で評判UP', fn: actPR },
  { id: 'rival', label: 'ライバル工作', sub: '引き抜き・舌戦・休戦', fn: actRival },
  { id: 'ipo', label: 'IPO', sub: '上場に挑戦', fn: actIPO },
  { id: 'gig', label: '受託開発', sub: '現金を稼ぐ（無料）', fn: actGig },
];

// 受託開発：お金がなくても必ず打てる「逃げ道」アクション
function gigPay() { return 0.35 + S.staff.engineer * 0.12 + S.staff.researcher * 0.05 + S.modelScore * 0.012 + (S.turn <= EARLY_END ? 0.3 : 0); }
function actGig() {
  const pay = gigPay();
  openModal('受託開発', [
    para(`大手企業のAI導入案件で<b>現金を稼ぎます</b>。急ぎの案件なので<b>チーム疲弊 +6・技術的負債 +2</b>。資金が尽きそうなときの命綱。<br>エンジニアが多いほど報酬UP。ただし評判は少し下がります。`),
    optBtn(`案件を受ける（+${fmt(pay)}）`, '行動力1／評判 -1・疲弊 +6・負債 +2', () => {
      if (!useAP()) return;
      S.cash += pay; S.reputation = clamp(S.reputation - 1, 0, 100); addLoad({ strain: 6, debt: 2 });
      log(`受託案件を納品。+${fmt(pay)}`, 'good');
      closeModal(); render();
    }, S.ap < 1),
  ]);
}

function actHire() {
  const nodes = [para(`行動力1で、選んだ職種を<b>まとめて採用</b>します。<br>研究者（学習・論文・疲弊の回復）、エンジニア（プロダクト・負債の抑制）、営業（売上・大口顧客）。<br>研究者を3名以上まとめて採ると<b>個性派の名物研究者</b>が必ず1人加わります（1名でも35%）。現在：${S.crew.map(c => c.n).join('・')}`)];
  for (const r in ROLES) {
    const R = ROLES[r];
    [1, 3, 5].forEach(n => {
      const cost = R.cost * n * (1 + S.turn * 0.01) * earlyF();
      nodes.push(optBtn(`${R.name} ×${n}（${fmt(cost)}）`, `${R.desc}／人件費 ${fmt(R.salary * earlyWage())}/四半期・人${earlyTag()}`, () => {
        if (S.ap < 1) return log('行動力が足りません。', 'bad');
        if (!spend(cost)) return;
        S.ap--; S.staff[r] += n;
        log(`${R.name}${n}名を採用（${fmt(cost)}）。${r === 'researcher' ? '研究室に活気が出た（調子+3）。' : ''}`, 'good'); if (r === 'researcher') { addCond(3); if (n >= 3 || Math.random() < 0.35) joinCrew(); }
        closeModal(); render();
      }, S.cash < cost || S.ap < 1));
    });
  }
  openModal('採用', nodes);
}

function actCompute() {
  const nodes = [para(`<b>GPUクラスタ</b>を拡張します。計算資源が多いほど学習の効果が上がり、拡張直後は混雑が解消して<b>計算負荷 -15</b>。<br>現在の計算資源：<b>${S.compute} PF</b>（維持費 ${fmt(S.compute * 0.025 * S.computePrice)}/四半期）<br>GPU価格係数：×${S.computePrice.toFixed(2)}`)];
  [10, 30, 100].forEach(n => {
    const cost = n * 0.12 * S.computePrice * earlyF();
    nodes.push(optBtn(`+${n} PF を導入（${fmt(cost)}）`, '学習効率が上がる。維持費も増える' + earlyTag(), () => {
      if (S.ap < 1) return log('行動力が足りません。', 'bad');
      if (!spend(cost)) return;
      S.ap--; S.compute += n; addLoad({ load: -15 });
      log(`GPUクラスタを +${n} PF 拡張。計算負荷 -15`, 'good');
      closeModal(); render();
    }, S.cash < cost || S.ap < 1));
  });
  openModal('計算資源（GPUクラスタ）', nodes);
}

/* ===== トレーニング（モデル学習）・3つの負荷・研究者・モデル世代・学会 ===== */
// 調子（0-100）＝モデルとチームの勢い
const COND_LV = [
  { min: 85, n: '絶好調', a: '↑', f: 1.2, cls: 'c5' },
  { min: 65, n: '好調', a: '↗', f: 1.1, cls: 'c4' },
  { min: 40, n: '普通', a: '→', f: 1.0, cls: 'c3' },
  { min: 20, n: '不調', a: '↘', f: 0.88, cls: 'c2' },
  { min: 0, n: '絶不調', a: '↓', f: 0.75, cls: 'c1' },
];
function condLv(v = S.cond) { return COND_LV.find(l => v >= l.min); }
function addCond(d) { S.cond = clamp(S.cond + d, 0, 100); }

/* --- 3つの負荷ゲージ ---
   計算負荷 load   ：GPUクラスタの稼働率。高いと学習スループット（伸び）が落ちる。毎期よく回復
   技術的負債 debt ：継ぎはぎのコード・データ。高いと学習の伸びとプロダクトの成長速度が落ちる。自然には抜けにくい
   チーム疲弊 strain：追い込みの度合い。高いほど短期的には速いが、ミス（学習失敗）が増える */
const GAUGES = [
  { k: 'load', n: '計算負荷', en: 'LOAD', cls: 'g-load' },
  { k: 'debt', n: '技術的負債', en: 'DEBT', cls: 'g-debt' },
  { k: 'strain', n: 'チーム疲弊', en: 'STRAIN', cls: 'g-strain' },
];
function addLoad(o) { for (const g of GAUGES) if (o[g.k]) S[g.k] = clamp(S[g.k] + o[g.k], 0, 100); }
function loadF() { return clamp(1 - Math.max(0, S.load - 45) / 110, 0.5, 1); }
function debtF() { return clamp(1 - S.debt / 180, 0.45, 1); }
function strainSpeed() { return 1 + Math.min(S.strain, 80) / 400; }
function riskF() { return (1 + Math.max(0, S.strain - 30) / 35 + Math.max(0, S.load - 85) / 50) * (hasCrew('careful') ? 0.8 : 1) * (traitLv('safe') ? 0.85 : 1); }
function gaugeLabel(k, v = S[k]) {
  if (k === 'load') return v >= 85 ? '過熱' : v >= 60 ? '高負荷' : v >= 30 ? '稼働中' : '余裕';
  if (k === 'debt') return v >= 70 ? '崩壊寸前' : v >= 45 ? '重い' : v >= 20 ? 'ややあり' : 'クリーン';
  return v >= 80 ? '限界' : v >= 55 ? '修羅場' : v >= 30 ? '追い込み' : '健全';
}
function gaugeEffect(k) {
  if (k === 'load') return `学習スループット ×${loadF().toFixed(2)}`;
  if (k === 'debt') return `学習・開発の効率 ×${debtF().toFixed(2)}`;
  return `スピード ×${strainSpeed().toFixed(2)}／失敗率 ×${riskF().toFixed(2)}`;
}
function loadWorst() { return Math.max(S.load, S.debt, S.strain); }
const sg = (v) => (v >= 0 ? '+' : '') + Math.round(v);
const loadTxt = (o) => `負荷${sg(o.load || 0)}・負債${sg(o.debt || 0)}・疲弊${sg(o.strain || 0)}`;

/* --- 研究者の個性とセリフ --- */
const PERSONAS = {
  genius: { t: '天才肌', eff: 'フロンティア学習の失敗率-30%・全開で伸び+10%',
    hello: 'スケールすれば全部解決する。たぶんね。', ok: '今ならでかい学習ランに賭けてもいい。', low: '退屈だな。何か面白い問題ない？',
    strain: '寝なくても平気だよ。アイデアが止まらないんだ。', debt: 'コードが汚い？ 動けばいいでしょ。', load: 'GPUが足りない。もっとちょうだい。',
    good: 'ほらね、言ったとおりでしょ。次はもっとデカいのを回そう。', mid: '悪くない。でも僕の予想よりは遅い。', bad: '…データが悪い。僕じゃない。', fail: '発散した。でも今ので何かわかった気がする。',
    paperOk: 'ほらね。査読者もわかってるじゃない。', paperNg: '査読者2がわかってない。次で見返す。', poach: '年収3倍？…ちょっと考えさせて。', gen: '新世代の名前、僕に決めさせてよ。' },
  careful: { t: '慎重派', eff: '学習の失敗率-20%',
    hello: '基本に忠実に。評価を回してから次へ進みましょう。', ok: '状態は良好です。標準設定でも十分伸びます。', low: '数字が鈍いですね。RLHFで丁寧に詰めましょう。',
    strain: 'みんな顔色が悪いです。今期はクールダウンを入れましょう。', debt: '評価パイプラインが継ぎはぎです。リファクタリングを提案します。', load: 'クラスタが過熱気味です。この状態では学習効率が落ちます。',
    good: '想定どおりの改善です。評価もクリーンでした。', mid: '予定の範囲内です。次のチェックポイントで確認しましょう。', bad: '伸びが鈍いです。データ品質を見直します。', fail: 'だから言ったんです…チェックポイントから戻します。',
    paperOk: 'アブレーションを丁寧にやった甲斐がありました。', paperNg: '再現実験が足りないと言われました。次は詰めます。', poach: '条件は良いですが、ここの安全文化が好きなので。', gen: '安全評価は完了しています。リリースして大丈夫です。' },
  crafter: { t: '職人気質', eff: '技術的負債の蓄積-30%・リファクタ効果UP',
    hello: 'コードは嘘をつかねえ。きれいに書けば、モデルも素直に育つ。', ok: '基盤は整ってる。思い切り回していいぞ。', low: 'なんか重てえな。一回、配管を見直すか。',
    strain: '若いのが寝てねえ。今日は帰らせろ。', debt: 'この学習コード、継ぎはぎだらけだ。リファクタさせろ。', load: 'GPUが悲鳴あげてる。スケジューラ組み直すぞ。',
    good: 'いい仕事だ。コードも結果も、きれいなもんだ。', mid: 'まあ、及第点だな。', bad: '雑に回した分だけ、雑な結果だ。', fail: '言わんこっちゃねえ。負債が利子つけて返ってきたんだ。',
    paperOk: '実装が丁寧だって褒められたぞ。当然だ。', paperNg: '理屈ばっかりの論文は苦手でな…。', poach: '金じゃねえ。ここのコードは俺が育てたんだ。', gen: '新しい土台はピカピカだ。負債は置いてくぞ。' },
  writer: { t: '論文マシン', eff: '論文採択率+12%・Best Paperの確率UP',
    hello: '締切が近いと燃えるタイプです。次の学会、狙いましょう！', ok: 'この結果、そのまま論文になりますよ！', low: 'ネタが足りない…何か新しい実験しません？',
    strain: '徹夜明けの文章は査読者にバレます…休みましょう。', debt: '実験コードが散らかってて再現できません！', load: 'GPU待ちで実験が回りません…。',
    good: '最高のアブレーションが取れました！ 図にします！', mid: 'ワークショップ論文くらいにはなりそう。', bad: 'うーん、ネガティブ・リザルトですね…。', fail: '失敗も論文になります…たぶん。',
    paperOk: '採択です！ カメラレディ書きます！', paperNg: 'Reviewer 2…！ 次の締切で殴り返します。', poach: '向こうのラボ、論文数すごいんですよね…。', gen: '新世代のテクニカルレポート、もう書き始めてます！' },
  mood: { t: 'ムードメーカー', eff: 'チーム疲弊の回復+8/期',
    hello: 'みんなー！ 今期も楽しくいこう！', ok: 'チームの空気、最高っす！ 今ならいける！', low: 'ちょっと元気ないっすね。ピザ頼みます？',
    strain: 'みんな限界っす！ 一回ぜんぶ止めて、休みましょう！', debt: 'ゲンさん系の人がずっと怒ってるっす…負債返しましょ。', load: 'サーバ室、サウナみたいっす！',
    good: 'やったー！ 今夜は打ち上げっす！', mid: 'まあまあっすね！ 次いきましょ！', bad: 'ドンマイっす！ 切り替えていきましょう！', fail: 'やっちゃいましたね…でも誰も責めないっすよ！',
    paperOk: 'うおお、採択！ みんなでお祝いっす！', paperNg: '次がありますって！', poach: 'え、オレ？ いやいや、このチームが好きなんで！', gen: '新世代のお披露目会、企画しときます！' },
  infra: { t: 'インフラ番長', eff: '計算負荷の回復+10/期',
    hello: 'クラスタは俺が見る。お前らは研究しろ。', ok: '稼働率は健全。でかいジョブもさばける。', low: 'ジョブの回し方を変えるか。',
    strain: 'オンコールが続いてる。人間もスループットが落ちる。', debt: 'デプロイスクリプトが三重に分岐してる。片付けろ。', load: '熱がやばい。ここで回しても効率は半分だ。クールダウン入れろ。',
    good: 'スループット最高記録。ノード一台も落ちなかった。', mid: '平常運転。', bad: 'I/Oがボトルネックだった。直しておく。', fail: 'ノードが三台落ちた。原因はわかってる。',
    paperOk: 'インフラ論文？…悪くないな。', paperNg: '学会よりSLAのほうが大事だ。', poach: '向こうのデータセンターはでかいが…ここのほうが面白い。', gen: '新世代の推論サーバは準備済みだ。' },
  rival: { t: '野心家', eff: '対抗蒸留の勝率+10%・引き抜き工作+10%',
    hello: 'ライバルの最新モデル、もう解析しました。勝てますよ。', ok: '今なら宿敵を叩けます。仕掛けましょう。', low: '負けっぱなしは性に合わないんですよね。',
    strain: 'まだいけます。…まあ、みんなはそうでもないか。', debt: '勝つためなら多少の負債は…いや、さすがに多すぎか。', load: 'GPUの差で負けるのはごめんです。増強を。',
    good: '見ました？ もう追いつかれる気がしない。', mid: '次は確実に抜きます。', bad: 'このままじゃ笑われる。', fail: '…今のは見なかったことに。',
    paperOk: '向こうのラボより先に出せた。それが大事。', paperNg: 'ライバルのほうが先に採択？…許せない。', poach: '向こうの条件、悪くない。でも今は、ここで勝ちたい。', gen: '新世代で順位をひっくり返しましょう。' },
};
const CREW_POOL = [['真壁ミナト', 'genius'], ['早瀬サクラ', 'careful'], ['鉄村ゲン', 'crafter'], ['白石ユイ', 'writer'], ['陽向ケンタ', 'mood'], ['黒田ジン', 'infra'], ['九条レン', 'rival'], ['アリア・チェン', 'genius'], ['森永ハル', 'careful'], ['リー・ウェイ', 'writer']];
const CREW_MAX = 6;
function hasCrew(p) { return !!(S && S.crew && S.crew.some(c => c.p === p)); }
function crewNameOf(c) { return `${c.n}（${PERSONAS[c.p].t}${c.chief ? '・チーフ' : ''}）`; }
function chief() { return S.crew.find(c => c.chief) || S.crew[0]; }
function crewLine(sit, pref) {
  const c = (pref && S.crew.find(x => x.p === pref)) || chief();
  if (!c) return { who: 'チーム', text: '……' };
  const L = PERSONAS[c.p]; return { who: crewNameOf(c), text: L[sit] || L.ok };
}
function advice() {
  if (S.strain >= 65) return crewLine('strain', 'mood');
  if (S.debt >= 50) return crewLine('debt', 'crafter');
  if (S.load >= 70) return crewLine('load', 'infra');
  const f = condLv().f; return crewLine(f >= 1.1 ? 'ok' : f >= 1.0 ? 'hello' : 'low');
}
const talkHtml = (l) => `<div class="tr-talk"><em>${l.who}</em>「${l.text}」</div>`;
function joinCrew(forced) {
  if (S.crew.length >= CREW_MAX) return null;
  const pool = CREW_POOL.filter(([n]) => !S.crew.some(c => c.n === n));
  if (!pool.length) return null;
  const [n, p] = forced ? (pool.find(x => x[1] === forced) || pick(pool)) : pick(pool);
  const m = { n, p, turn: S.turn }; S.crew.push(m);
  log(`${crewNameOf(m)} がチームに加入。「${PERSONAS[p].hello}」 効果：${PERSONAS[p].eff}`, 'good');
  return m;
}
// 研究者が減ったとき、名前のある研究者も去ることがある（チーフは残る）
function crewLoss(by) {
  while (S.crew.length > 1 && S.crew.length > S.staff.researcher + 1) {
    const cand = S.crew.filter(c => !c.chief);
    const m = (S.poachTarget && cand.find(c => c === S.poachTarget)) || pick(cand);
    S.crew = S.crew.filter(c => c !== m);
    log(`${crewNameOf(m)} が${by || 'ライバル'}へ去った…「${PERSONAS[m.p].poach}」`, 'bad');
  }
  S.poachTarget = null;
}

/* --- モデル世代（系譜） --- */
const TRAITS = {
  know: { n: '博識型', d: '広報の評判+2・ベンチ「知識」区間に強い', sec: 0 },
  math: { n: '推論型', d: 'ベンチ勝率+4%・「数学」区間に強い', sec: 1 },
  code: { n: 'コード型', d: 'API・コーディング支援の売上+15%・「コード」区間に強い', sec: 2 },
  agent: { n: 'エージェント型', d: 'エンタープライズ／エージェント／汎用AIの売上+15%・「エージェント」区間に強い', sec: 3 },
  eff: { n: '省電力型', d: '計算負荷の回復+10/期・GPU維持費-10%' },
  safe: { n: '安全志向型', d: '学習の失敗率-15%・RLHFで評判+1追加' },
};
function curGen() { return S.lineage[S.lineage.length - 1]; }
function traitLv(k) { const g = S && S.lineage && curGen(); return g && g.trait === k ? g.lv : 0; }
function tb(k) { const lv = traitLv(k); return lv ? 1 + 0.5 * (lv - 1) : 0; }   // 系統Lvで効果が強まる
function traitRevF(id) {
  if (traitLv('code') && (id === 'api' || id === 'code')) return 1 + 0.15 * tb('code');
  if (traitLv('agent') && (id === 'ent' || id === 'agent' || id === 'agi')) return 1 + 0.15 * tb('agent');
  return 1;
}
function myModelName() { return `Chappy-${S.lineage ? curGen().gen : 1}`; }
function genLabel(g = curGen()) { return `${TRAITS[g.trait].n}${g.lv > 1 ? ` Lv${g.lv}` : ''}`; }
function nextGenReq() { return curGen().score + 8; }
function canRelease() { return S.modelScore >= nextGenReq(); }
function releaseCost() { return (0.5 + curGen().gen * 0.4) * earlyF(); }
function actRelease() {
  const cur = curGen(), cost = releaseCost();
  const others = Object.keys(TRAITS).filter(k => k !== cur.trait).sort(() => Math.random() - 0.5).slice(0, 2);
  const cands = [{ k: cur.trait, lv: Math.min(3, cur.lv + 1), inherit: true }].concat(others.map(k => ({ k, lv: 1 })));
  const L = crewLine('gen');
  const nodes = [para(`<b>Chappy-${cur.gen + 1}</b> をリリースします（行動力1・${fmt(cost)}）。親モデル <b>${cur.name}</b>（${genLabel(cur)}）の特性を<b>継承</b>して系統Lvを上げるか、<b>新しい系統</b>に乗り換えるかを選びます。<br>リリース効果：評判アップ・プロダクト成長×1.08・調子+8・新アーキテクチャで<b>技術的負債 -25</b>（チーム疲弊 +8）`), para(talkHtml(L))];
  cands.forEach(c => nodes.push(optBtn(`${c.inherit ? '【継承】' : '【新系統】'}${TRAITS[c.k].n}${c.lv > 1 ? ` Lv${c.lv}` : ''}`, `${TRAITS[c.k].d}${c.lv > 1 ? `（効果×${(1 + 0.5 * (c.lv - 1)).toFixed(1)}）` : ''}`, () => {
    if (S.ap < 1) return log('行動力が足りません。', 'bad');
    if (!spend(cost)) return;
    S.ap--;
    const g = { gen: cur.gen + 1, name: `Chappy-${cur.gen + 1}`, trait: c.k, lv: c.lv, score: S.modelScore, turn: S.turn, from: cur.name, inherit: !!c.inherit, wins: 0, papers: 0 };
    S.lineage.push(g);
    const rep = 3 + Math.min(6, g.gen);
    S.reputation = clamp(S.reputation + rep, 0, 100); S.products.forEach(p => p.growth *= 1.08); addCond(8); addLoad({ debt: -25, strain: 8 });
    log(`新世代 ${g.name}「${genLabel(g)}」をリリース！（${cur.name}から${c.inherit ? '継承' : '新系統へ'}）評判 +${rep}・技術的負債 -25｜${L.who}「${L.text}」`, 'good');
    aliveRivals().forEach(r => { r.heat = Math.min(100, r.heat + 3); });
    closeModal(); render();
  }, S.cash < cost || S.ap < 1)));
  const back = document.createElement('button'); back.className = 'btn ghost'; back.textContent = '◀ トレーニングに戻る'; back.onclick = actTrain;
  nodes.push(back);
  openModal('次世代モデルのリリース', nodes);
}
function renderCrew() {
  const el = $('crew'); if (!el) return;
  const others = Math.max(0, S.staff.researcher - S.crew.length + 1);
  el.innerHTML = S.crew.map(c => `<div class="cw-row"><div class="cw-top"><b>${c.n}</b><i>${PERSONAS[c.p].t}${c.chief ? '・チーフ' : ''}</i></div><div class="cw-eff">${PERSONAS[c.p].eff}</div></div>`).join('') +
    `<div class="cw-foot">ほか研究者 ${others}名${S.crew.length < CREW_MAX ? '／研究者をまとめて採用すると個性派が加入' : ''}</div>${talkHtml(advice())}`;
}
function renderConfCal() {
  const el = $('confcal'); if (!el) return;
  el.innerHTML = [0, 1, 2, 3].map(i => { const c = confAt(S.turn + i); const m = c.hot === curGen().trait;
    return `<div class="cf-row${i === 0 ? ' now' : ''}"><span class="cf-q">${dateLabel(S.turn + i)}</span><b>${c.n}</b><span class="cf-hot${m ? ' m' : ''}">注目：${TRAITS[c.hot].n}${m ? '◆' : ''}</span><span class="cf-st">${i === 0 ? (S.paperSub ? '投稿済' : '締切') : ''}</span></div>`; }).join('') +
    `<div class="cw-foot">採択 通算${S.papers}本・今年${S.yPapers}本／◆＝自社モデルの特性と一致（採択率UP）</div>`;
}
function renderLineage() {
  const el = $('lineage'); if (!el) return;
  const rows = S.lineage.slice(-4).map((g, i, a) => `<div class="ln-row${i === a.length - 1 ? ' cur' : ''}"><span class="ln-gen">${g.name}</span><span class="ln-tr">${genLabel(g)}</span><span class="ln-meta">${g.from ? (g.inherit ? '継承' : '新系統') : '創業'}・${dateLabel(g.turn)}・誕生時${g.score.toFixed(1)}｜ベンチ${g.wins}勝・論文${g.papers}</span></div>`).join('<div class="ln-arrow">↓</div>');
  const need = nextGenReq() - S.modelScore;
  el.innerHTML = (S.lineage.length > 4 ? `<div class="ln-more">…ほか${S.lineage.length - 4}世代</div>` : '') + rows +
    `<div class="ln-next">${canRelease() ? '<b>次世代をリリースできます</b>（トレーニングから）' : `次世代リリースまで モデルスコア あと${need.toFixed(1)}`}</div>`;
}

/* --- 学会カレンダー（論文レース） --- */
const CONFS = [
  { n: 'ICLR', full: '表現学習の国際会議', tier: 1.0 },
  { n: 'ICML', full: '機械学習の国際会議', tier: 1.0 },
  { n: 'ACL', full: '自然言語処理のトップ会議', tier: 0.9 },
  { n: 'NeurIPS', full: '年末最大のAI学会', tier: 1.25 },
];
function confAt(t = S.turn) {
  if (!S.hot[t]) S.hot[t] = pick(Object.keys(TRAITS));
  return { ...CONFS[(t - 1) % 4], hot: S.hot[t], t };
}
function avgRivalScore() { const a = aliveRivals(); return a.length ? a.reduce((s, c) => s + c.score, 0) / a.length : S.modelScore; }
function paperP(crunch) {
  const cf = confAt();
  return clamp(0.25 + Math.min(12, S.staff.researcher) * 0.025 + (S.modelScore - avgRivalScore()) / 100 + (hasCrew('writer') ? 0.12 : 0)
    + (cf.hot === curGen().trait ? 0.1 : 0) - S.debt / 400 - Math.max(0, S.strain - 60) / 200 + (crunch ? 0.15 : 0) - (cf.tier - 1) * 0.3, 0.08, 0.88);
}
function actPaper() {
  const cf = confAt();
  const cal = [0, 1, 2, 3].map(i => { const c = confAt(S.turn + i); const m = c.hot === curGen().trait;
    return `<div class="cf-row${i === 0 ? ' now' : ''}"><span class="cf-q">${dateLabel(S.turn + i)}</span><b>${c.n}</b><span class="cf-hot${m ? ' m' : ''}">注目：${TRAITS[c.hot].n}${m ? '◆一致' : ''}</span><span class="cf-st">${i === 0 ? (S.paperSub ? '投稿済' : '今期締切') : ''}</span></div>`; }).join('');
  const top = aliveRivals().reduce((m, c) => (c.yPapers || 0) > (m ? m.yPapers || 0 : -1) ? c : m, null);
  const nodes = [para(`学会は<b>四半期ごと</b>に開かれます。今期の <b>${cf.n}</b>（${cf.full}）に投稿すると、四半期末に査読結果が出ます。<br>注目テーマが<b>現行モデルの特性と一致</b>すると採択率UP。研究者の数・モデルの強さで有利、<b>技術的負債</b>と<b>チーム疲弊</b>が高いと不利。`),
    para(`<div class="cf-cal">${cal}</div>今年の採択：自社 <b>${S.yPapers}本</b>${top ? `／トップのライバル ${top.name} ${top.yPapers || 0}本` : ''}（NeurIPSの後に年間ランキング）`)];
  if (S.paperSub) { nodes.push(para(`今期はすでに投稿済み（採択見込み 約${Math.round(S.paperSub.p * 100)}%）。結果は四半期末に届きます。`)); return openModal(`学会・論文レース：${cf.n}`, nodes); }
  const L = crewLine(hasCrew('writer') ? 'hello' : 'ok', 'writer');
  nodes.push(para(talkHtml(L)));
  const cost = (0.2 + S.turn * 0.01) * earlyF();
  [[false, `通常投稿（無料）`, `採択見込み 約${Math.round(paperP(false) * 100)}%・チーム疲弊 +6`],
   [true, `締切前の総力戦（${fmt(cost)}）`, `採択見込み 約${Math.round(paperP(true) * 100)}%・Oral/Best Paperが出やすい・チーム疲弊 +16`]].forEach(([crunch, l, s]) => {
    nodes.push(optBtn(l, s, () => {
      if (S.ap < 1) return log('行動力が足りません。', 'bad');
      if (crunch && !spend(cost)) return;
      S.ap--; S.paperSub = { p: paperP(crunch), crunch, conf: cf.n };
      addLoad({ strain: crunch ? 16 : 6 });
      log(`${cf.n}に論文を投稿（採択見込み 約${Math.round(S.paperSub.p * 100)}%${crunch ? '・総力戦' : ''}）`, 'good');
      closeModal(); render();
    }, S.ap < 1 || (crunch && S.cash < cost)));
  });
  openModal(`学会・論文レース：${cf.n}`, nodes);
}
function reviewScores(tier) {
  const b = { best: [8, 10], oral: [7, 9], poster: [5, 7], reject: [2, 5] }[tier];
  const r = [randi(b[0], b[1]), randi(b[0], b[1]), randi(b[0], b[1])];
  r[1] = Math.max(1, r[1] - randi(0, 2)); // Reviewer 2 はいつも辛口
  return r;
}
function resolvePapers() {
  const cf = confAt(), out = [], sub = S.paperSub; S.paperSub = null;
  let myBest = false;
  if (sub) {
    const acc = Math.random() < sub.p;
    let tier = 'reject';
    if (acc) { const r = Math.random(); tier = r < 0.1 + (sub.crunch ? 0.06 : 0) + (hasCrew('writer') ? 0.05 : 0) ? 'best' : r < 0.4 ? 'oral' : 'poster'; }
    const L = crewLine(acc ? 'paperOk' : 'paperNg', 'writer');
    let f;
    if (tier === 'best') { myBest = true; f = fx({ rep: Math.round(10 * cf.tier), cond: 8, mood: 1.03 }); }
    else if (tier === 'oral') f = fx({ rep: Math.round(6 * cf.tier), cond: 5, researcher: 1 });
    else if (tier === 'poster') f = fx({ rep: Math.round(3 * cf.tier), cond: 2 });
    else f = fx({ rep: -1, cond: -3 });
    if (acc) { S.papers++; S.yPapers++; curGen().papers++; }
    out.push({ me: true, good: acc, h: `${cf.n}：${{ best: 'Best Paper賞を受賞！', oral: '口頭発表（Oral）に採択', poster: 'ポスター発表に採択', reject: '不採択（Reject）' }[tier]}`,
      d: `査読スコア ${reviewScores(tier).join(' / ')}｜${L.who}「${L.text}」`, fx: f });
    if (tier === 'best') { const j = joinCrew(); if (j) out.push({ me: true, good: true, h: `受賞を見て ${j.n} が合流`, d: `「${PERSONAS[j.p].hello}」 ${PERSONAS[j.p].eff}`, fx: [] }); }
  }
  const accs = [];
  aliveRivals().forEach(c => { if (Math.random() < clamp(0.12 + c.score / 300, 0.12, 0.45)) { c.papers = (c.papers || 0) + 1; c.yPapers = (c.yPapers || 0) + 1; accs.push(c); } });
  if (!myBest && accs.length && Math.random() < 0.3 * cf.tier) {
    const c = pick(accs); c.rep = clamp(c.rep + 4, 0, 100); c.heat = Math.min(100, c.heat + 3);
    out.push({ c, good: false, h: `${cf.n}のBest Paperは${c.name}`, d: `${c.name}：${c.R.lines.win}`, fx: [] });
  } else if (!sub && accs.length) out.push({ c: null, good: null, h: `${cf.n}閉幕：ライバル${accs.length}社が採択`, d: '自社は今回投稿していない。学会は四半期ごとに開催。', fx: [] });
  if ((S.turn - 1) % 4 === 3) {
    const rows = aliveRivals().map(c => ({ n: c.name, v: c.yPapers || 0, c })).concat([{ n: S.name, v: S.yPapers, me: true }]).sort((a, b) => b.v - a.v || (a.me ? -1 : 1));
    const me = rows.findIndex(r => r.me) + 1, top = rows[0];
    out.push({ me: top.me, c: top.me ? null : top.c, good: top.me && top.v > 0 ? true : me <= 2 ? null : false, h: top.me && top.v > 0 ? `年間論文ランキング1位！最優秀AIラボに` : `年間論文ランキング：1位は${top.n}（${top.v}本）`,
      d: rows.map((r, i) => `${i + 1}.${r.me ? '自社' : r.n} ${r.v}本`).join('／'), fx: top.me && top.v > 0 ? fx({ rep: 5, researcher: 1 }) : [] });
    S.yPapers = 0; S.competitors.forEach(c => { c.yPapers = 0; });
  }
  return out;
}

/* --- トレーニングメニュー --- */
const TRAIN_COURSES = [
  { id: 'sft', name: 'スプリントFT', ai: '短期ファインチューニング', mult: 0.6, cost: () => 0.3, risk: 0.02, ld: 8, db: 4, st: 8, cond: 6, steps: 4, desc: '短く鋭く。安くて安全、調子も上向く' },
  { id: 'cpt', name: '継続事前学習', ai: '大規模データで地力強化', mult: 1.0, cost: () => 1 + S.compute * 0.02, risk: 0.08, ld: 20, db: 8, st: 14, cond: 2, steps: 5, desc: '王道。しっかり地力をつける' },
  { id: 'duel', name: '対抗蒸留', ai: 'ライバルを仮想敵に対戦学習', mult: 1.2, cost: () => 1.5 + S.compute * 0.03, risk: 0.1, ld: 22, db: 12, st: 16, cond: 4, steps: 5, pair: true, desc: '近いライバルと競り合う。上回れば+15%' },
  { id: 'frontier', name: 'フロンティア学習ラン', ai: '社運を賭けた巨大学習', mult: 1.8, cost: () => 3 + S.compute * 0.05, risk: 0.2, ld: 38, db: 18, st: 24, cond: -4, steps: 6, desc: '最大の伸び。負荷と失敗リスク大' },
  { id: 'rlhf', name: 'RLHF・安全性調整', ai: '人間のフィードバックで磨く', mult: 0.35, cost: () => 0.4, risk: 0, ld: 4, db: -6, st: -4, cond: 8, rep: 1, easy: true, desc: '軽めの改善＋評判+1。負債と疲弊が少し抜ける' },
  { id: 'refactor', name: 'リファクタリング', ai: '学習基盤・コードの負債返済', mult: 0, cost: () => 0.3 + S.turn * 0.01, risk: 0, ld: -5, db: -32, st: 4, cond: 2, easy: true, desc: '技術的負債を大きく返済（エンジニアが多いほど効果UP）' },
  { id: 'cool', name: 'クールダウン', ai: '休養・クラスタ整備', mult: 0, cost: () => 0, risk: 0, ld: -35, db: 0, st: -40, cond: 12, easy: true, desc: '資金不要。計算負荷とチーム疲弊を大きく下げる' },
];
const EFFORTS = [
  { id: 'low', name: '控えめ', ai: '学習率ひかえめ', g: 0.75, load: 0.5, risk: 0.6 },
  { id: 'std', name: '標準', ai: '標準設定', g: 1.0, load: 1.0, risk: 1.0 },
  { id: 'max', name: '全開', ai: '学習率MAX・夜通し回す', g: 1.3, load: 1.6, risk: 1.4 },
];
function loadsFor(co, ef) {
  const m = ef ? ef.load : 1;
  const dm = (S.turn <= EARLY_END ? 0.6 : 1) * (hasCrew('crafter') ? 0.7 : 1) * (1 - Math.min(0.3, S.staff.engineer * 0.03));
  const pos = (v, k) => (v > 0 ? v * k : v);
  let db = pos(co.db, m * dm);
  if (co.id === 'refactor') db = co.db * (1 + Math.min(0.6, S.staff.engineer * 0.06)) * (hasCrew('crafter') ? 1.3 : 1);
  return { load: Math.round(pos(co.ld, m)), debt: Math.round(db), strain: Math.round(pos(co.st, m) + (ef && ef.id === 'max' ? 6 : 0)) };
}
function riskFor(co, ef) { return Math.min(0.6, co.risk * (ef ? ef.risk : 1) * riskF() * (co.id === 'frontier' && hasCrew('genius') ? 0.7 : 1)); }
function gainMult(ef) { return condLv().f * loadF() * debtF() * strainSpeed() * (ef ? ef.g : 1) * (ef && ef.id === 'max' && hasCrew('genius') ? 1.1 : 1); }
function pairRival() { const a = aliveRivals(); if (!a.length) return null; return a.reduce((m, c) => (Math.abs(c.score - S.modelScore - 4) < Math.abs(m.score - S.modelScore - 4) ? c : m)); }
function gaugeRows() {
  return GAUGES.map(g => `<div class="tr-g"><span>${g.n}</span><div class="tr-bar ${g.cls}"><i style="width:${S[g.k]}%"></i></div><b class="${S[g.k] >= 60 ? 'tr-warn' : ''}">${gaugeLabel(g.k)}</b></div><div class="tr-gfx">${gaugeEffect(g.k)}</div>`).join('');
}
function condPanel() {
  const l = condLv();
  const d = document.createElement('div'); d.className = 'tr-stable';
  d.innerHTML = `<div class="tr-horse"><b>${myModelName()}<span class="tr-trait">${genLabel()}</span></b><small>${esc(S.name)}・モデルスコア ${S.modelScore.toFixed(1)}</small></div>
    <div class="tr-gauges">
      <div class="tr-g"><span>調子</span><div class="tr-bar cond"><i style="width:${S.cond}%"></i></div><b class="tr-cond ${l.cls}">${l.n} ${l.a}</b></div>
      ${gaugeRows()}
    </div>
    ${talkHtml(advice())}
    <div class="tr-staff">研究チーム：${S.crew.map(c => `${c.n}<i>${PERSONAS[c.p].t}</i>`).join('・')}（研究者 計${S.staff.researcher}名）／GPU ${S.compute} PF／今期の学習 ${S.trainedThisTurn}本目${S.trainedThisTurn ? '（同期内の追加学習は効果逓減）' : ''}</div>`;
  return d;
}
function actTrain() {
  const nodes = [condPanel()];
  const rc = releaseCost();
  nodes.push(optBtn(`次世代モデル Chappy-${curGen().gen + 1} をリリース（${fmt(rc)}）`, canRelease() ? `特性を継承するか新系統を選ぶ｜技術的負債 -25・評判UP` : `◇ モデルスコア ${nextGenReq().toFixed(1)} 以上で解禁（あと ${(nextGenReq() - S.modelScore).toFixed(1)}）`, actRelease, !canRelease() || S.ap < 1 || S.cash < rc));
  nodes.push(para('<b>学習メニュー</b>を選んでください（行動力1）。'));
  TRAIN_COURSES.forEach(co => {
    const cost = co.cost() * (co.id === 'cool' ? 1 : earlyF());
    const lo = loadsFor(co, co.easy ? null : EFFORTS[1]);
    let sub;
    if (co.mult === 0) sub = `${co.desc}｜${loadTxt(lo)}`;
    else {
      const exp = expectedGain() * co.mult * gainMult(EFFORTS[1]);
      sub = `期待 +${exp.toFixed(1)}${co.risk ? `・失敗率 ${(riskFor(co, EFFORTS[1]) * 100).toFixed(0)}%` : ''}・${loadTxt(lo)}｜${co.desc}`;
    }
    if (co.pair) { const pr = pairRival(); if (pr) sub += `（相手：${pr.R.model}-${pr.ver}）`; }
    nodes.push(optBtn(`${co.name}【${co.ai}】${cost ? `（${fmt(cost)}）` : '（無料）'}`, sub, () => {
      if (co.easy) return runTraining(co, null, cost);
      pickEffort(co, cost);
    }, S.cash < cost || S.ap < 1 || (co.pair && !pairRival())));
  });
  openModal('トレーニング（モデル学習）', nodes);
}
function pickEffort(co, cost) {
  const nodes = [condPanel(), para(`<b>${co.name}</b>（${co.ai}）の<b>回し方</b>を選んでください。`)];
  EFFORTS.forEach(ef => {
    const exp = expectedGain() * co.mult * gainMult(ef);
    nodes.push(optBtn(`${ef.name}（${ef.ai}）`, `期待 +${exp.toFixed(1)}・失敗率 ${(riskFor(co, ef) * 100).toFixed(0)}%・${loadTxt(loadsFor(co, ef))}${ef.id === 'max' && S.strain >= 55 ? `｜${chief().n}「本当に全開ですか…？」` : ''}`, () => runTraining(co, ef, cost)));
  });
  const back = document.createElement('button'); back.className = 'btn ghost'; back.textContent = '◀ メニュー選択に戻る'; back.onclick = actTrain;
  nodes.push(back);
  openModal(`トレーニング：${co.name}`, nodes);
}
let trainRaf = 0;
function runTraining(co, ef, cost) {
  if (S.ap < 1) return log('行動力が足りません。', 'bad');
  if (!spend(cost)) return;
  S.ap--; S.trainedThisTurn++;
  const easy = !ef; ef = ef || EFFORTS[1];
  const l = condLv();
  const risk = riskFor(co, ef);
  const fail = co.mult > 0 && Math.random() < risk;
  const before = S.modelScore;
  let g = 0, pairWin = null, pr = null;
  const dim = 1 + (S.trainedThisTurn - 1) * 0.5;
  if (!fail && co.mult > 0) {
    const roll = rand(0.6, 1.4);
    g = expectedGain() * co.mult * gainMult(ef) * roll / dim;
    if (co.pair) { pr = pairRival(); pairWin = Math.random() < clamp(0.45 + (S.modelScore - pr.score) / 40 + (l.f - 1) + (hasCrew('rival') ? 0.1 : 0), 0.15, 0.9); if (pairWin) g *= 1.15; }
  }
  const quality0 = co.mult > 0 && !fail ? clamp((g / Math.max(0.01, expectedGain() * co.mult * gainMult(ef) / dim) - 0.6) / 1.1, 0, 1) : 0.5;
  const quality = pairWin ? Math.max(quality0, 0.45) : pairWin === false ? Math.min(quality0, 0.7) : quality0;
  const lo = loadsFor(co, easy ? null : ef);
  if (fail) { lo.strain += 12; lo.debt += 5; }
  addLoad(lo);
  const condD = co.cond + (ef.id === 'max' && !easy ? -3 : ef.id === 'low' ? 2 : 0) + (fail ? -15 : 0) + (pairWin ? 3 : pairWin === false ? -2 : 0);
  addCond(condD);
  if (!fail && g) S.modelScore = Math.min(100, S.modelScore + g);
  if (co.rep) S.reputation = clamp(S.reputation + co.rep + (traitLv('safe') ? 1 : 0), 0, 100);
  if (fail) S.reputation = clamp(S.reputation - 2, 0, 100);
  if (pr) pr.heat = Math.min(100, pr.heat + 3);

  // セリフ（状況に合う研究者が話す）
  const sit = co.mult === 0 ? null : fail ? 'fail' : quality > 0.75 ? 'good' : quality > 0.4 ? 'mid' : 'bad';
  const L = co.id === 'refactor' ? { ...crewLine('good', 'crafter'), text: hasCrew('crafter') ? '配管を全部引き直した。これで素直に回る。' : '学習コードを整理しました。だいぶ見通しが良くなりました。' }
    : co.id === 'cool' ? { ...crewLine('mid', 'mood'), text: hasCrew('mood') ? 'みんなちゃんと寝たっす！ 顔色が戻ったっす！' : 'しっかり休んで、クラスタも整備しました。次はいけます。' }
    : crewLine(sit, fail ? 'careful' : co.pair ? 'rival' : co.id === 'frontier' ? 'genius' : null);
  // 学習ログ（チェックポイント評価）
  const n = co.steps || 0;
  const evals = n ? Array.from({ length: n }, (_, i) => {
    if (fail) return before + (i < n - 2 ? (i + 1) * 0.3 : -rand(0.5, 1.8)) + rand(-0.2, 0.2);
    return before + g * (i + 1) / n + (i < n - 1 ? rand(-0.25, 0.25) : 0);
  }) : null;
  const res = co.mult === 0 ? `${loadTxt(lo)}・調子 ${sg(condD)}`
    : fail ? `学習失敗！ モデルスコア ±0・評判 -2・${loadTxt(lo)}${cost ? `（${fmt(cost)}が消えた）` : ''}`
    : `モデルスコア +${g.toFixed(1)} → ${S.modelScore.toFixed(1)}${pairWin ? `（対抗蒸留で${pr.R.model}を上回った・+15%）` : pairWin === false ? `（対抗蒸留で${pr.R.model}に届かず）` : ''}${co.rep ? '・評判 +' + (co.rep + (traitLv('safe') ? 1 : 0)) : ''}・${loadTxt(lo)}`;
  log(`学習【${co.name}${easy ? '' : '・' + ef.name}】${fail ? '失敗…' : ''}${res}｜${L.who}「${L.text}」`, fail ? 'bad' : 'good');

  // 演出
  const wrap = document.createElement('div'); wrap.className = 'race train';
  const head = document.createElement('div'); head.className = 'race-head';
  head.innerHTML = `<div class="race-title"><span>${dateLabel()}・Chappy計算センター</span><b>${co.name}${easy ? '' : '・' + ef.name}</b><span>${co.ai}${easy ? '' : '／' + ef.ai}</span></div>`;
  wrap.appendChild(head);
  const track = document.createElement('div'); track.className = 'tr-track';
  const partner = pr ? `<div class="rl-lane-mini partner"><span class="tr-lbl">${pr.R.model}-${pr.ver}</span><div class="tr-run"><div class="rl-trail"></div><div class="rl-runner" style="--c:${pr.col}"><span></span></div></div></div>` : '';
  track.innerHTML = n ? `<div class="rl-lane-mini me"><span class="tr-lbl">${myModelName()}</span><div class="tr-run"><div class="rl-trail"></div><div class="rl-runner" style="--c:#f7e08a"><span></span></div></div></div>${partner}
    <div class="tr-meters"><div class="tr-m"><span>GPU出力</span><div class="tr-bar eff"><i></i></div></div><div class="tr-m"><span>loss</span><b class="tr-loss">—</b></div><div class="tr-m"><span>評価</span><b class="tr-lap">—</b></div></div>`
    : `<div class="tr-rest">${co.id === 'rlhf' ? '〰 人間のフィードバックで応答を磨いています 〰' : co.id === 'refactor' ? '{ } 学習基盤をリファクタリング中 { }' : '◇ クールダウン中（休養・クラスタ整備） ◇'}</div>`;
  wrap.appendChild(track);
  const caster = document.createElement('div'); caster.className = 'race-caster tr-caster'; caster.textContent = n ? '学習ジョブを投入しました……' : '作業を進めています……';
  wrap.appendChild(caster);
  const ctrl = document.createElement('div'); ctrl.className = 'race-ctrl';
  const skip = document.createElement('button'); skip.className = 'btn ghost'; skip.textContent = '結果までスキップ ▶▶';
  ctrl.appendChild(skip); wrap.appendChild(ctrl);
  openModal('トレーニング', [wrap], true);
  const say = (t) => { caster.textContent = t; caster.classList.remove('flash'); void caster.offsetWidth; caster.classList.add('flash'); };
  const runs = [...wrap.querySelectorAll('.rl-lane-mini')].map(x => ({ r: x.querySelector('.rl-runner'), t: x.querySelector('.rl-trail') }));
  const effEl = wrap.querySelector('.tr-bar.eff i'), lossEl = wrap.querySelector('.tr-loss'), lapEl = wrap.querySelector('.tr-lap');
  const effMax = (ef.id === 'max' ? 100 : ef.id === 'std' ? 75 : 45) * loadF();
  const loss0 = rand(2.6, 3.2), loss1 = fail ? loss0 * 1.9 : loss0 - 0.4 - quality * 0.8;
  const DUR = n ? 3200 : 1600; let t0 = 0, done = false, shown = 0;
  const finish = () => {
    if (done) return; done = true; cancelAnimationFrame(trainRaf); trainRaf = 0;
    runs.forEach((x, i) => { const p = fail && i === 0 ? 0.62 : (pairWin === false && i === 0 ? 0.96 : pairWin && i === 1 ? 0.95 : 1); x.r.style.left = `calc(${p} * (100% - 18px))`; x.t.style.width = `calc(${p} * (100% - 18px) + 9px)`; });
    if (lossEl) lossEl.textContent = loss1.toFixed(2);
    if (lapEl && evals) lapEl.textContent = evals[evals.length - 1].toFixed(1);
    say(fail ? '学習失敗！ ジョブ停止……' : n ? '学習完了。評価が出ました。' : '完了。');
    const box = document.createElement('div'); box.className = 'race-result tr-result';
    box.innerHTML = `${evals ? `<div class="rr-board"><div class="rr-cap">学 習 ロ グ</div><div class="tr-laps">ckpt評価　${evals.map((x, i) => i === evals.length - 1 ? `<b>${x.toFixed(1)}</b>` : x.toFixed(1)).join(' → ')}${fail ? '<em>（発散・ロールバック）</em>' : ''}</div><div class="tr-eval">${fail ? '評価：—' : `評価：${quality > 0.75 ? 'A　ブレイクスルー' : quality > 0.4 ? 'B　順調' : 'C　伸び悩み'}`}</div></div>` : ''}
      ${talkHtml(L)}
      <div class="rr-sum"><p>${fail ? '<b class="rr-lose">失敗</b> ' : ''}${res}</p><p>調子：<b class="tr-cond ${condLv().cls}">${condLv().n} ${condLv().a}</b>　計算負荷 ${Math.round(S.load)}（${gaugeLabel('load')}）・技術的負債 ${Math.round(S.debt)}（${gaugeLabel('debt')}）・チーム疲弊 ${Math.round(S.strain)}（${gaugeLabel('strain')}）</p></div>`;
    skip.remove();
    const btn = document.createElement('button'); btn.className = 'btn gold'; btn.textContent = 'ラボに戻る';
    btn.onclick = () => { closeModal(); render(); };
    ctrl.appendChild(btn); wrap.insertBefore(box, ctrl);
    $('modal-close').hidden = false; modalLocked = false;
    render();
    setTimeout(() => box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
  };
  skip.onclick = finish;
  const step = (now) => {
    if (done) return;
    if (!t0) t0 = now;
    const k = Math.min(1, (now - t0) / DUR);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    runs.forEach((x, i) => {
      let p = e;
      if (i === 0 && fail) p = Math.min(e, 0.62);
      if (i === 1) p = e * (pairWin ? 0.95 : 1);
      if (i === 0 && pairWin === false) p = e * 0.96;
      x.r.style.left = `calc(${p} * (100% - 18px))`; x.t.style.width = `calc(${p} * (100% - 18px) + 9px)`;
    });
    if (effEl) effEl.style.width = `${Math.min(effMax, effMax * (0.4 + 0.6 * k) + Math.sin(now / 70) * 4)}%`;
    if (lossEl) lossEl.textContent = (loss0 + (loss1 - loss0) * (fail ? Math.max(0, (k - 0.5) * 2) : e) + Math.sin(now / 50) * 0.02).toFixed(2);
    if (evals) { const li = Math.min(evals.length, Math.floor(k * evals.length)); if (li > shown) { shown = li; lapEl.textContent = evals[li - 1].toFixed(1); } }
    if (k > 0.3 && !caster.dataset.s1) { caster.dataset.s1 = 1; say(n ? (ef.id === 'max' ? 'GPU全開！ 学習率MAXで一気に押し上げる！' : ef.id === 'low' ? '控えめな学習率で、安定して進行中。' : '標準設定で順調にステップを重ねる！') + (S.load >= 70 ? '（クラスタが熱い…スループット低下）' : '') : (co.id === 'rlhf' ? '評価者のフィードバックが集まってきた。' : co.id === 'refactor' ? '古いスクリプトを次々と書き直している。' : 'チームもクラスタも、ひと息ついています……')); }
    if (k > 0.6 && !caster.dataset.s2 && n) { caster.dataset.s2 = 1; say(fail ? 'おっと、lossが跳ね上がった……！ 勾配が発散している！' : pr ? (pairWin ? `仮想敵の${pr.R.model}を上回った！` : `仮想敵の${pr.R.model}に食らいつくが……`) : '最終チェックポイント、評価はどうか！'); }
    if (k >= 1 || (fail && k > 0.7)) { finish(); return; }
    trainRaf = requestAnimationFrame(step);
  };
  trainRaf = requestAnimationFrame(step);
}
function expectedGain() {
  const r = Math.sqrt(S.staff.researcher) * 2.2;
  const c = Math.log2(S.compute + 1) * 1.4;
  return (r + c) * Math.pow(Math.max(0, 1 - S.modelScore / 108), 1.4);
}

function actLaunch() {
  const nodes = [];
  PRODUCTS.forEach(P => {
    const owned = S.products.find(p => p.id === P.id);
    if (owned) {
      const cost = P.cost * 0.4;
      const threat = aliveRivals().find(c => c.intent && c.intent.type === 'launch' && c.intent.seg === P.id);
      nodes.push(optBtn(`【強化】${P.name}（${fmt(cost)}）`, `成長係数 ×${owned.growth.toFixed(2)} → ×${(owned.growth * 1.25).toFixed(2)}${threat ? `／⚔ ${threat.name}が対抗製品を準備中：今期強化で迎撃` : ''}`, () => {
        if (S.ap < 1) return log('行動力が足りません。', 'bad');
        if (!spend(cost)) return;
        S.ap--; owned.growth *= 1.25 * (0.85 + 0.15 * debtF()); S.qAct.seg.push(P.id); addLoad({ debt: 3 });
        log(`${P.name} の大型アップデート。ユーザー体験が一変した。`, 'good');
        closeModal(); render();
      }, S.cash < cost || S.ap < 1));
    } else {
      const ok = S.modelScore >= P.req && S.staff.sales >= P.needSales;
      const why = S.modelScore < P.req ? `モデルスコア${P.req}以上が必要` : S.staff.sales < P.needSales ? `営業${P.needSales}名以上が必要` : '';
      const lc = P.cost * earlyF();
      const fb = S.segFirst[P.id], rivalsIn = aliveRivals().filter(c => c.products.includes(P.id)).length;
      const race = fb === undefined ? '／一番乗りのチャンス（成長×1.15）' : `／後発（${fb}が先行・競合${rivalsIn}社）`;
      nodes.push(optBtn(`【新規】${P.name}（${fmt(lc)}）`, ok ? `基礎売上 ${fmt(P.base)}/四半期${race}${earlyTag()}` : `🔒 ${why}`, () => {
        if (S.ap < 1) return log('行動力が足りません。', 'bad');
        if (!spend(lc)) return;
        S.ap--;
        const first = S.segFirst[P.id] === undefined;
        S.products.push({ id: P.id, name: P.name, req: P.req, base: P.base, growth: first ? 1.15 : 1.0, age: 0, first });
        S.reputation = clamp(S.reputation + (first ? 6 : 4), 0, 100); S.qAct.seg.push(P.id);
        if (first) S.segFirst[P.id] = 'me';
        log(first ? `${P.name} をローンチ！ライバルに先んじて市場一番乗り（評判 +6）` : `${P.name} をローンチ。先行する${S.segFirst[P.id]}を追撃する。`, 'good'); addLoad({ debt: 4 });
        closeModal(); render();
      }, !ok || S.cash < lc || S.ap < 1));
    }
  });
  openModal('プロダクト', [para(`モデルを<b>市場に投入</b>します。新規はローンチ、既存は大型アップデート（技術的負債が高いと効果が落ちます：×${(0.85 + 0.15 * debtF()).toFixed(2)}）。`), ...nodes]);
}

function condBenchAdj() { return (condLv().f - 1) * 0.5 - (S.strain >= 80 ? 0.06 : S.strain >= 60 ? 0.03 : 0) - (S.load >= 85 ? 0.04 : 0) - S.debt / 800 + (traitLv('math') ? 0.04 * tb('math') : 0); }
function benchP(c) { return clamp(0.5 + (S.modelScore - c.score) / 30 + condBenchAdj(), 0.05, 0.95); }
function benchTalk() { return loadWorst() >= 65 ? advice() : crewLine(condLv().f >= 1.05 ? 'ok' : condLv().f >= 1.0 ? 'mid' : 'low', 'rival'); }
function actBench() {
  if (S.benchThisTurn) { openModal('ベンチマーク', [para('この四半期はすでにベンチマークに参加しました。')]); return; }
  const alive = S.competitors.filter(c => c.alive);
  const cl = condLv(); const nodes = [para(`レース前チェック：<b>${myModelName()}「${genLabel()}」</b> は <b class="tr-cond ${cl.cls}">${cl.n} ${cl.a}</b>／負荷 ${gaugeLabel('load')}・負債 ${gaugeLabel('debt')}・疲弊 ${gaugeLabel('strain')}（勝率補正 ${condBenchAdj() >= 0 ? '+' : ''}${Math.round(condBenchAdj() * 100)}%）${talkHtml(benchTalk())}`), para('ライバルを選んで公開ベンチマーク・レースに参加。全モデルが同じ4区間（知識→数学→コード→エージェント）を走り、<b>指名したライバルより先にゴール</b>すれば勝利。モデルの特性に合う区間では伸びる。<b>総合1位</b>ならさらに評判+2。')];
  alive.forEach(c => {
    const p = benchP(c);
    nodes.push(optBtn(`${isNem(c) ? '【宿敵】' : ''}vs ${c.name}（スコア ${c.score.toFixed(1)}）`, `勝率 約${Math.round(p * 100)}%｜通算 ${c.w}勝${c.l}敗${isNem(c) ? '｜勝てば評判+3上乗せ' : ''}`, () => {
      if (!useAP()) return;
      S.benchThisTurn = true;
      render();
      benchRace(c, Math.random() < p);
    }, S.ap < 1));
  });
  openModal('ベンチマーク対決', nodes);
}

/* ===== ベンチマーク・レース（ダービー風デモ） ===== */
const RACE_SECTORS = ['知識', '数学', 'コード', 'エージェント'];
const RACE_LEN = 100;
let raceRaf = 0;
function simRace(runners) {
  const avg = runners.reduce((s, r) => s + r.score, 0) / runners.length;
  return runners.map(r => {
    const v = clamp(1 + (r.score - avg) / 55, 0.6, 1.5);
    const sec = RACE_SECTORS.map(() => rand(0.9, 1.1));
    if (r.boost !== undefined) sec[r.boost] *= 1.06 + 0.03 * ((r.boostLv || 1) - 1);
    const style = Math.random(); // 0〜1：逃げ⇔追い込み
    const pos = [0]; let x = 0, n = 0, t = 0;
    while (x < RACE_LEN && t < 600) {
      t++;
      if (t % 6 === 1) n = rand(-1, 1);
      const prog = x / RACE_LEN;
      const sIdx = Math.min(3, Math.floor(prog * 4));
      const pace = prog < 0.5 ? 1 + (0.5 - style) * 0.16 : 1 - (0.5 - style) * 0.16;
      const spurt = prog > 0.75 && Math.random() < 0.04 ? 1.5 : 1;
      x += 0.55 * v * sec[sIdx] * pace * (1 + n * 0.18) * spurt;
      pos.push(Math.min(x, RACE_LEN));
    }
    const fin = t - (x - RACE_LEN) / Math.max(x - (pos[pos.length - 2] ?? 0), 1e-3);
    return { ...r, pos, fin, best: RACE_SECTORS[sec.indexOf(Math.max(...sec))] };
  });
}
function benchRace(c, win) {
  const field = [{ key: 'me', name: S.name, model: myModelName(), score: S.modelScore, col: '#f7e08a', me: true, boost: TRAITS[curGen().trait].sec, boostLv: curGen().lv }]
    .concat(S.competitors.filter(x => x.alive).map(x => ({ key: x.name, name: x.name, model: `${x.R.model}-${x.ver}`, score: x.score, col: x.col, rival: x })));
  // 人気（スコア順）と単勝オッズ
  const byScore = [...field].sort((a, b) => b.score - a.score);
  const wsum = field.reduce((s, r) => s + Math.exp(r.score / 8), 0);
  field.forEach(r => { r.pop = byScore.indexOf(r) + 1; r.odds = Math.max(1.1, 0.8 * wsum / Math.exp(r.score / 8)); });
  // 勝敗は従来どおりの確率で先に決め、レース展開をそれに合わせる（ゲームバランス維持）
  let res = null;
  for (let i = 0; i < 400; i++) {
    const r = simRace(field);
    const me = r.find(x => x.me), tg = r.find(x => x.rival === c);
    if ((me.fin < tg.fin) === win) { res = r; break; }
  }
  if (!res) {
    res = simRace(field);
    const me = res.find(x => x.me), tg = res.find(x => x.rival === c);
    if ((me.fin < tg.fin) !== win) { [me.pos, tg.pos] = [tg.pos, me.pos]; [me.fin, tg.fin] = [tg.fin, me.fin]; }
  }
  const order = [...res].sort((a, b) => a.fin - b.fin);
  order.forEach((r, i) => { r.place = i + 1; });

  const wrap = document.createElement('div'); wrap.className = 'race';
  const head = document.createElement('div'); head.className = 'race-head';
  head.innerHTML = `<div class="race-title"><span>第${S.turn}回</span><b>${c.name}杯 ベンチマーク・グランプリ</b><span>${dateLabel()}・AIスタジアム・全${field.length}モデル</span></div>
    <div class="race-sectors">${RACE_SECTORS.map(s => `<span>${s}</span>`).join('')}</div>`;
  wrap.appendChild(head);
  const lanes = document.createElement('div'); lanes.className = 'race-lanes';
  res.forEach((r, i) => {
    const ln = document.createElement('div');
    ln.className = 'race-lane' + (r.me ? ' me' : '') + (r.rival === c ? ' target' : '');
    ln.style.setProperty('--c', r.col);
    const tagTxt = r.me ? '自社' : r.rival === c ? (isNem(c) ? '宿敵' : '対戦') : '';
    ln.innerHTML = `<div class="rl-gate">${i + 1}</div>
      <div class="rl-name"><b>${r.model}</b><small><span>${r.name}</span>${tagTxt ? `<i>${tagTxt}</i>` : ''}</small><em>前評判${r.pop}位・勝率予想${Math.min(99, Math.round(80 / r.odds))}%${r.me ? `・${genLabel()}・調子${condLv().a}` : ''}</em></div>
      <div class="rl-track"><div class="rl-trail"></div><div class="rl-runner"><span></span></div><div class="rl-place"></div></div>`;
    r.el = ln; r.runEl = ln.querySelector('.rl-runner'); r.trailEl = ln.querySelector('.rl-trail'); r.placeEl = ln.querySelector('.rl-place');
    lanes.appendChild(ln);
  });
  wrap.appendChild(lanes);
  const caster = document.createElement('div'); caster.className = 'race-caster'; caster.textContent = `スタート前：${myModelName()}「${genLabel()}」は${condLv().n}${condLv().a}、${loadWorst() >= 60 ? 'ラボの負荷が気がかり' : '準備万端'}。各モデル、評価環境にロード完了……`;
  wrap.appendChild(caster);
  const ctrl = document.createElement('div'); ctrl.className = 'race-ctrl';
  const skip = document.createElement('button'); skip.className = 'btn ghost'; skip.textContent = '結果までスキップ ▶▶';
  ctrl.appendChild(skip); wrap.appendChild(ctrl);
  openModal('ベンチマーク・レース', [wrap], true);

  const say = (t) => { caster.textContent = t; caster.classList.remove('flash'); void caster.offsetWidth; caster.classList.add('flash'); };
  const lastFin = order[order.length - 1].fin;
  const leadFin = order[0].fin;
  const DUR = 7200; // 先頭がゴールするまでのミリ秒
  const tickMs = DUR / leadFin;
  const posAt = (r, t) => { if (t >= r.fin) return RACE_LEN; const i = Math.floor(t), f = t - i; const a = r.pos[i] ?? RACE_LEN, b = r.pos[i + 1] ?? RACE_LEN; return a + (b - a) * f; };
  let t0 = 0, leader = null, sectorSaid = 0, straight = false, finished = 0, done = false, said = {};
  const draw = (t) => {
    let lead = null, lp = -1;
    res.forEach(r => {
      const p = posAt(r, t);
      r.runEl.style.left = `calc(${p / RACE_LEN} * (100% - 18px))`;
      r.trailEl.style.width = `calc(${p / RACE_LEN} * (100% - 18px) + 9px)`;
      if (p > lp) { lp = p; lead = r; }
      if (t >= r.fin && !r.placeEl.textContent) { r.placeEl.textContent = `${r.place}着`; r.el.classList.add('fin'); if (r.place <= 3) r.el.classList.add('p' + r.place); }
    });
    return { lead, lp };
  };
  const finish = () => {
    if (done) return; done = true; cancelAnimationFrame(raceRaf); raceRaf = 0;
    draw(lastFin + 1);
    say(`${order[0].model}（${order[0].name}）、1着でゴールイン！！ 結果確定。`);
    showRaceResult(c, win, order, wrap, skip);
  };
  skip.onclick = finish;
  const step = (now) => {
    if (done) return;
    if (!t0) t0 = now;
    const el = now - t0 - 900; // ゲートイン演出
    if (el < 0) { raceRaf = requestAnimationFrame(step); return; }
    if (!said.start) { said.start = 1; say('スタートしました！ 各モデル一斉に推論開始！'); }
    const t = el / tickMs;
    const { lead, lp } = draw(t);
    const sec = Math.min(3, Math.floor(lp / 25));
    if (sec > sectorSaid && lp < 99) { sectorSaid = sec; say(`${RACE_SECTORS[sec]}区間に突入！ 先頭は ${lead.model}（${lead.name}）`); leader = lead; }
    else if (leader && lead !== leader && t > 4 && lp < 99 && now - (said.lc || 0) > 900) { say(`${lead.model} が${leader.model}をかわして先頭に！`); leader = lead; said.lc = now; }
    else if (!leader && t > 6) leader = lead;
    if (!straight && lp > 80) { straight = true; const me = res.find(r => r.me); say(`最後の直線！ ${lead.model}が粘る！ ${me === lead ? '自社モデルが先頭だ！' : `${me.model}、届くか！？`}`); }
    if (t >= leadFin && !said.goal) { said.goal = 1; say(`${order[0].model}、1着でゴールイン！！`); }
    if (t >= lastFin + 2 || el > DUR * 1.7) { finish(); return; }
    raceRaf = requestAnimationFrame(step);
  };
  raceRaf = requestAnimationFrame(step);
}
function raceMargin(d) {
  if (d < 7) return `+${(d * 0.15).toFixed(2)}pt`; return '大差';
}
function showRaceResult(c, win, order, wrap, skip) {
  const me = order.find(r => r.me), tg = order.find(r => r.rival === c);
  const total = me.place === 1 && order.length >= 3;
  const lines = [];
  if (win) {
    const gain = Math.round(3 + Math.max(0, c.score - S.modelScore) * 0.5 + 3);
    const nemB = isNem(c) ? 3 : 0, topB = total ? 2 : 0;
    S.reputation = clamp(S.reputation + gain + nemB + topB, 0, 100);
    S.products.forEach(pp => pp.growth *= 1.05); addCond(6); addLoad({ load: 5, strain: 4 }); curGen().wins++;
    c.w++; c.heat = Math.min(100, c.heat + 12); c.rep = clamp(c.rep - 3, 0, 100);
    log(`ベンチマーク・レース ${me.place}着で ${c.name}（${tg.place}着）に先着！評判 +${gain + nemB + topB}${nemB ? '（宿敵ボーナス）' : ''}${topB ? '（総合1着）' : ''} ${c.name}：${c.R.lines.lose}`, 'good');
    lines.push(`<b class="rr-win">勝利！</b> ${myModelName()} は <b>${me.place}着</b>、${c.name} は ${tg.place}着。`, `評判 +${gain + nemB + topB}${nemB ? '（宿敵ボーナス+3込み）' : ''}${topB ? '（総合1着+2込み）' : ''}・プロダクト成長率UP・調子アップ`, `${c.name}：${c.R.lines.lose}`);
  } else {
    S.reputation = clamp(S.reputation - 4, 0, 100); addCond(-6); addLoad({ load: 5, strain: 4 });
    c.l++; c.rep = clamp(c.rep + 2, 0, 100);
    log(`ベンチマーク・レースで ${c.name}（${tg.place}着）に敗北…自社は${me.place}着。評判 -4 ${c.name}：${c.R.lines.win}`, 'bad');
    lines.push(`<b class="rr-lose">敗北…</b> ${myModelName()} は <b>${me.place}着</b>、${c.name} は ${tg.place}着。`, '評判 -4・調子ダウン', `${c.name}：${c.R.lines.win}`);
  }
  const tbl = document.createElement('div'); tbl.className = 'race-result';
  const t1 = order[0].fin;
  tbl.innerHTML = `<div class="rr-board"><div class="rr-cap">確 定</div>${order.map((r, i) => {
    const tm = 95 + r.fin * 0.18; const mm = Math.floor(tm / 60), ss = (tm % 60).toFixed(1).padStart(4, '0');
    const mg = i === 0 ? '' : raceMargin((r.fin - order[i - 1].fin) * 0.3);
    return `<div class="rr-row${r.me ? ' me' : ''}${r.rival === c ? ' target' : ''}" style="--c:${r.col}"><span class="rr-pl">${r.place}</span><span class="rr-nm"><b>${r.model}</b><small>${r.name}</small></span><span class="rr-tm">${mm}:${ss}</span><span class="rr-mg">${mg}</span></div>`;
  }).join('')}</div>
  <div class="rr-note">勝ちモデル ${order[0].model}：得意区間「${order[0].best}」で抜け出した。${me.place !== 1 ? `自社モデルの得意区間は「${me.best}」。` : ''}</div>
  <div class="rr-sum">${lines.map(l => `<p>${l}</p>`).join('')}</div>`;
  skip.remove();
  const btn = document.createElement('button'); btn.className = 'btn gold'; btn.textContent = '確定 — ラボに戻る';
  btn.onclick = () => { closeModal(); render(); };
  wrap.querySelector('.race-ctrl').appendChild(btn);
  wrap.insertBefore(tbl, wrap.querySelector('.race-ctrl'));
  $('modal-close').hidden = false; modalLocked = false;
  render();
  setTimeout(() => tbl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
}

function actRaise() {
  const v = calcValuation();
  const r = ROUNDS[Math.min(S.roundIdx, ROUNDS.length - 1)];
  const fb = S.roundFirst[S.roundIdx];
  const raceF = fb === undefined ? 1.1 : fb === 'me' ? 1 : (S.turn <= EARLY_END ? 0.97 : 0.9);
  const rivalsHere = aliveRivals().filter(c => c.intent && c.intent.type === 'raise' && c.roundIdx === S.roundIdx).map(c => c.name);
  const raceTxt = fb === undefined ? `まだ誰も到達していません。<b>先に調達すれば調達額+10%・評判+3</b>${rivalsHere.length ? `（${rivalsHere.join('・')}も今期狙っている！）` : ''}` : fb === 'me' ? '' : `<b>${fb}</b> に先を越された（調達額 ×${raceF}）`;
  const nodes = [para(`現在の評価額：<b>${fmt(v)}</b>　持株比率：<b>${(S.ownership * 100).toFixed(1)}%</b><br>次のラウンド：<b>${r.name}</b>（評価額 ${fmt(r.minVal)} 以上）${raceTxt ? `<br>資金調達レース：${raceTxt}` : ''}`)];
  if (S.turn - S.lastRaiseTurn < 2) {
    nodes.push(para('前回の調達から間もないため、投資家が様子見しています（2四半期あける必要あり）。'));
    return openModal('資金調達', nodes);
  }
  if (v < r.minVal) {
    nodes.push(para('評価額が足りません。プロダクトとモデルを育てましょう。'));
    return openModal('資金調達', nodes);
  }
  const investors = [
    { name: '老舗VC「黄金ノードキャピタル」', dil: r.dil[0], prem: 0.95, repReq: 0, note: '堅実。希薄化少なめ' },
    { name: 'メガテック戦略投資', dil: (r.dil[0] + r.dil[1]) / 2, prem: 1.15, repReq: 40, note: '計算資源 +20PF の特典付き', bonus: () => { S.compute += 20; } },
    { name: '政府系ファンド「オリオンSWF」', dil: r.dil[1], prem: 1.3, repReq: 55, note: '巨額だが希薄化大' },
  ];
  investors.forEach(inv => {
    const pre = v * inv.prem * S.sentiment;
    const amount = pre * inv.dil / (1 - inv.dil) * raceF;
    const ok = S.reputation >= inv.repReq;
    nodes.push(optBtn(`${inv.name}：${fmt(amount)} 調達`, ok ? `希薄化 ${(inv.dil * 100).toFixed(0)}%／${inv.note}` : `🔒 評判${inv.repReq}以上が必要`, () => {
      if (!useAP()) return;
      const success = Math.random() < clamp(0.7 + S.reputation / 200 + (S.sentiment - 1), 0.2, 0.95);
      S.lastRaiseTurn = S.turn;
      if (!success) {
        log(`${inv.name} との交渉は決裂…`, 'bad');
      } else {
        if (S.roundFirst[S.roundIdx] === undefined) { S.roundFirst[S.roundIdx] = 'me'; S.reputation = clamp(S.reputation + 3, 0, 100); log(`資金調達レース：${r.name}にライバルより先に到達！（評判 +3）`, 'good'); }
        S.cash += amount; S.ownership *= (1 - inv.dil); S.roundIdx++;
        if (inv.bonus) inv.bonus();
        log(`💰 ${r.name}：${inv.name} から ${fmt(amount)} を調達！持株 ${(S.ownership * 100).toFixed(1)}%`, 'good');
      }
      closeModal(); render();
    }, !ok || S.ap < 1));
  });
  openModal('資金調達', nodes);
}

function genTarget() {
  const kind = pick(['talent', 'tech', 'compute', 'product']);
  const size = rand(0.6, 1.6) * (1 + S.turn * 0.08);
  const t = { name: pick(TARGET_NAMES), kind, price: 0, desc: '' };
  if (kind === 'talent') { t.n = Math.round(3 * size); t.price = t.n * 0.35; t.desc = `研究者 +${t.n}名`; }
  if (kind === 'tech') { t.g = +(3 * size).toFixed(1); t.price = t.g * 0.9; t.desc = `モデルスコア +${t.g}`; }
  if (kind === 'compute') { t.n = Math.round(25 * size); t.price = t.n * 0.09; t.desc = `計算資源 +${t.n}PF`; }
  if (kind === 'product') { t.n = Math.round(2 * size); t.price = 1.5 * size; t.desc = `営業 +${t.n}名・全プロダクト成長 ×1.15`; }
  S.target = t;
}
function actMA() {
  const nodes = [];
  const t = S.target;
  if (t) {
    nodes.push(optBtn(`「${t.name}」を買収（${fmt(t.price)}）`, t.desc, () => {
      if (S.ap < 1) return log('行動力が足りません。', 'bad');
      if (!spend(t.price)) return;
      S.ap--;
      if (t.kind === 'talent') S.staff.researcher += t.n;
      if (t.kind === 'tech') S.modelScore = Math.min(100, S.modelScore + t.g);
      if (t.kind === 'compute') S.compute += t.n;
      if (t.kind === 'product') { S.staff.sales += t.n; S.products.forEach(p => p.growth *= 1.15); }
      log(`🤝 ${t.name} を買収（${t.desc}）`, 'good');
      S.target = null;
      closeModal(); render();
    }, S.cash < t.price || S.ap < 1));
  } else nodes.push(para('今期の買収候補はありません。'));
  // 弱いライバルの買収
  const weak = S.competitors.filter(c => c.alive && c.score < S.modelScore - 5);
  weak.forEach(c => {
    const price = Math.pow(c.score, 1.8) * 0.15;
    nodes.push(optBtn(`ライバル「${c.name}」を買収（${fmt(price)}）`, `市場から退場させ、スコア +${(c.score * 0.08).toFixed(1)}・研究者 +5名`, () => {
      if (S.ap < 1) return log('行動力が足りません。', 'bad');
      if (!spend(price)) return;
      S.ap--; c.alive = false; S.beaten.push(c.name);
      aliveRivals().forEach(o => { o.heat = Math.min(100, o.heat + 10); });
      S.modelScore = Math.min(100, S.modelScore + c.score * 0.08); S.staff.researcher += 5;
      S.reputation = clamp(S.reputation + 5, 0, 100);
      log(`ライバル ${c.name} を買収！業界再編の主役に。残るライバルたちが警戒を強めている。`, 'good');
      closeModal(); render();
    }, S.cash < price || S.ap < 1));
  });
  if (S.buyoutOffer) {
    const o = S.buyoutOffer;
    nodes.push(optBtn(`⚠ ${o.from} からの買収提案を受諾（${fmt(o.price)}）`, `ゲーム終了：会社を売却（あなたの取り分 ${fmt(o.price * S.ownership)}）`, () => {
      closeModal(); endGame('sold');
    }));
  }
  openModal('M&A', nodes);
}

function actPR() {
  const cost = (0.3 + S.turn * 0.02) * earlyF();
  openModal('広報', [para(`講演や取材で<b>評判</b>を集めます。注目を浴びるとチームの士気も上がり<b>調子+3</b>。${traitLv('know') ? `<br>博識型モデルの効果で評判 +${Math.round(2 * tb('know'))}上乗せ。` : ''}`),
    optBtn(`カンファレンスで基調講演（${fmt(cost)}）`, '評判 +4〜8', () => {
      if (S.ap < 1) return log('行動力が足りません。', 'bad');
      if (!spend(cost)) return;
      S.ap--; S.qAct.pr = true; const g = randi(4, 8) + Math.round(2 * tb('know'));
      S.reputation = clamp(S.reputation + g, 0, 100); addCond(3);
      log(`📣 基調講演が話題に。評判 +${g}・調子 +3`, 'good'); closeModal(); render();
    }, S.cash < cost || S.ap < 1),
    optBtn('プレプリントをオープンに公開（無料）', '評判 +3、ただしライバルのスコアも少し上がる', () => {
      if (!useAP()) return;
      S.qAct.pr = true;
      S.reputation = clamp(S.reputation + 3, 0, 100); addCond(3);
      S.competitors.forEach(c => c.score += 0.8);
      log('📄 論文を公開。研究コミュニティで評価が上がった。', 'good'); closeModal(); render();
    }, S.ap < 1),
  ]);
}

function ipoReq() {
  return [
    ['評価額 1,000億円以上', calcValuation() >= 1000],
    ['年間売上 40億円以上', calcRevenue() * 4 >= 40],
    ['評判 60以上', S.reputation >= 60],
    ['クールダウンなし', S.ipoCooldown <= 0],
  ];
}
function actIPO() {
  const reqs = ipoReq();
  const ok = reqs.every(r => r[1]);
  const nodes = [para(reqs.map(r => `<span class="req ${r[1] ? 'ok' : 'ng'}">${r[1] ? '◆' : '◇'} ${r[0]}</span>`).join(''))];
  const p = clamp(0.45 + (S.reputation - 60) / 80 + (S.sentiment - 1) + (S.modelScore >= topCompScore() ? 0.15 : 0) + (S.ipoFirst ? -0.05 : 0.08), 0.15, 0.95);
  nodes.push(para(`上場レース：${S.ipoFirst ? `<b>${S.ipoFirst}</b> が先に上場済み（成功率 -5%）` : 'まだどのライバルも上場していない。<b>一番乗りなら成功率 +8%</b>'}`));
  if (ok) nodes.push(para(`上場成功確率：約<b>${Math.round(p * 100)}%</b>（市場心理・評判・トップモデルかどうか・上場レースで変動）`));
  nodes.push(optBtn('🔔 上場申請する（行動力3）', '成功すれば勝利。失敗すると評判が下がり4四半期待つ必要あり', () => {
    if (!useAP(3)) return;
    if (Math.random() < p) { closeModal(); endGame('ipo'); return; }
    S.reputation = clamp(S.reputation - 10, 0, 100); S.ipoCooldown = 4;
    log('IPOは延期に…ロードショーで投資家の反応が鈍かった。', 'bad'); closeModal(); render();
  }, !ok || S.ap < 3));
  openModal('IPO（新規株式公開）', nodes);
}


/* ===== ライバルAI（闘争システム） ===== */
const aliveRivals = () => S.competitors.filter(c => c.alive);
function nemesis() { const a = aliveRivals(); return a.length ? a.reduce((m, c) => c.heat > m.heat ? c : m) : null; }
function isNem(c) { return c === nemesis() && c.heat >= 25; }
const prodById = (id) => PRODUCTS.find(p => p.id === id);
const badge = (c) => `<i class="rv-badge" style="--c:${c.col}">${c.tag}</i>`;
function rivalRev(c) { return c.products.reduce((s, id) => { const P = prodById(id); return s + P.base * clamp(c.score / P.req, 0.5, 1.5); }, 0) * (0.5 + c.rep / 100); }
function rivalBurn(c) { return 0.25 + c.score * 0.018 + c.products.length * 0.15; }
function rivalVal(c) { return Math.max(1, (rivalRev(c) * 4 * 12 * 0.8 + Math.pow(c.score, 2.2) * 0.05 + c.rep * 0.3 + 8 + Math.max(0, c.cash) * 0.5) * S.sentiment * (c.ipo ? 1.3 : 1)); }
const hostileOK = (c) => S.turn > 4 && c.truce < S.turn;    // Q1〜Q4はライバルから直接攻撃されない
const softF = () => S.turn <= EARLY_END ? 0.5 : 1;          // 創業期はライバルの攻撃を半減
const roundName = (i) => ROUNDS[Math.min(i, ROUNDS.length - 1)].name;
// 同じ市場にライバル製品があるほどシェアを食われる（一番乗りならボーナス）
function segShare(p) {
  let f = p.first ? 1.1 : 1;
  for (const c of S.competitors) if (c.alive && c.products.includes(p.id)) f -= (c.score >= S.modelScore - 3 ? 0.06 : 0.025) * softF();
  return clamp(f, 0.65, 1.1);
}
function boardRows() {
  return aliveRivals().map(c => ({ c, name: c.name, score: c.score, me: false }))
    .concat([{ name: S.name + '（自社）', score: S.modelScore, me: true }]).sort((a, b) => b.score - a.score);
}
// リーダーボードの順位変動 → ドラマ
function updateRanks(init) {
  const rows = boardRows(), drama = [];
  const myRank = rows.findIndex(r => r.me) + 1, top = rows[0], topKey = top.me ? '__me' : top.name;
  rows.forEach((r, i) => { if (!r.me) { r.c.prevRank = init ? i + 1 : (r.c.rank || i + 1); r.c.rank = i + 1; } });
  if (init) { S.myRank = S.myPrevRank = myRank; S.topKey = topKey; return drama; }
  S.myPrevRank = S.myRank; S.myRank = myRank;
  let n = 0;
  for (const c of aliveRivals()) {
    const wasAbove = c.prevRank < S.myPrevRank, nowAbove = c.rank < myRank;
    if (wasAbove && !nowAbove) { c.heat = Math.min(100, c.heat + 8); if (n++ < 3) drama.push({ c, good: true, h: `${c.name} を抜き去った！`, d: `${c.name}：${c.R.lines.pass}`, fx: fx({ rep: isNem(c) ? 3 : 1 }) }); }
    else if (!wasAbove && nowAbove && n++ < 3) drama.push({ c, good: false, h: `${c.name} に抜かれた`, d: `${c.name}：${c.R.lines.win}`, fx: [] });
  }
  if (topKey !== S.topKey) {
    if (top.me) { const first = !S.everTop; S.everTop = true; drama.push({ me: true, good: true, h: '王座奪取！モデル性能で業界1位に', d: first ? '初の首位。投資家の目の色が変わった。' : '首位に返り咲いた。', fx: fx(first ? { rep: 5, mood: 1.06 } : { rep: 3 }) }); }
    else if (S.topKey === '__me') drama.push({ c: top.c, good: false, h: `王座陥落…${top.name} が首位に`, d: `${top.name}：${top.c.R.lines.win}`, fx: fx({ rep: -2 }) });
    else drama.push({ c: top.c, good: null, h: `王座交代：${top.name} が首位に`, d: `${S.topKey} から首位を奪い取った。`, fx: [] });
    S.topKey = topKey;
  }
  return drama;
}
// 各ライバルの「次の一手」を決める（四半期の頭に公開＝先読みして対策できる）
function planIntents() {
  const myV = calcValuation();
  for (const c of aliveRivals()) {
    if (c.intent && c.intent.carry) { c.intent.carry = false; continue; }
    const L = c.R.likes, w = {};
    const hostM = (0.4 + c.heat / 60) * (isNem(c) ? 1.5 : 1) * softF();
    const next = PRODUCTS.find(P => !c.products.includes(P.id) && c.score >= P.req);
    if (c.roundIdx < ROUNDS.length + 2 && rivalVal(c) >= ROUNDS[Math.min(c.roundIdx, ROUNDS.length - 1)].minVal && S.turn - (c.lastRaise || -9) >= 3)
      w.raise = L.raise * (c.cash < rivalBurn(c) * 5 ? 3 : 0.5);
    if (next) w.launch = L.launch * 2;
    w.model = L.model;
    if (hostileOK(c) && S.staff.researcher > 2) w.poach = L.poach * hostM;
    if (hostileOK(c)) w.press = L.press * hostM;
    if (hostileOK(c) && S.products.length) w.price = L.price * hostM;
    if (hostileOK(c) && S.turn >= 13 && rivalVal(c) > myV * 1.8 && c.heat >= 35) w.bid = L.bid * hostM * 0.5;
    if (!c.ipo && S.turn >= 10 && rivalVal(c) >= 1200 && c.rep >= 45) w.ipo = L.ipo * 2;
    const tot = Object.values(w).reduce((a, b) => a + b, 0);
    let x = Math.random() * tot, type = 'model';
    for (const k in w) { x -= w[k]; if (x <= 0) { type = k; break; } }
    c.intent = { type, seg: type === 'launch' ? next.id : null };
  }
}
function intentInfo(c) {
  const i = c.intent; if (!i) return { t: '様子見' };
  const P = i.seg && prodById(i.seg), mine = P && S.products.some(p => p.id === P.id);
  return ({
    raise: { t: `${roundName(c.roundIdx)}の調達を準備中`, hint: S.roundFirst[c.roundIdx] === undefined ? '先に同じラウンドを調達すれば一番乗り' : '' },
    launch: { t: mine ? `あなたの${qn(P)}に対抗製品` : `${qn(P)}を開発中`, bad: mine, hint: mine ? '今期そのプロダクトを強化すれば迎撃' : (P && !S.segFirst[P.id] && S.modelScore >= P.req ? '先に出せば一番乗り' : '') },
    model: { t: `新モデル「${c.R.model}-${c.ver + 1}」を学習中`, hint: '' },
    poach: { t: 'あなたの研究者に接触中', bad: true, hint: '休戦協定か高い評判で防ぐ' },
    press: { t: 'ネガティブキャンペーンを準備中', bad: true, hint: '今期「広報」を打てば不発' },
    price: { t: '値下げ攻勢を準備中', bad: true, hint: 'モデルスコアで5以上上回れば無効' },
    bid: { t: 'あなたへの敵対的買収を検討中', bad: true, hint: '評判と持株比率が防衛力' },
    ipo: { t: '上場申請を準備中', hint: '先に上場すれば一番乗り' },
  })[i.type] || { t: '様子見' };
}
// ライバルのターン：公開していた一手を実行
function qn(P) { return !P ? '' : /「/.test(P.name) ? P.name : `「${P.name}」`; }
function rivalTurn() {
  const moves = []; let choice = null;
  const myV = calcValuation();
  for (const c of aliveRivals()) {
    c.cash += rivalRev(c) * 0.55 - rivalBurn(c);
    if (S.turn <= EARLY_END) c.cash = Math.max(0.5, c.cash);
    c.heat = Math.max(0, c.heat - 2);
    c.rep = clamp(c.rep + (c.rep < 40 ? 1 : c.rep > 70 ? -1 : 0), 0, 100);
    const i = c.intent; if (!i) continue;
    const m = { c, good: false, fx: [] };
    switch (i.type) {
      case 'raise': {
        const idx = c.roundIdx, rn = roundName(idx), r = ROUNDS[Math.min(idx, ROUNDS.length - 1)];
        if (Math.random() < clamp(0.6 + c.rep / 200 + (S.sentiment - 1), 0.25, 0.92)) {
          const amt = rivalVal(c) * rand(r.dil[0], r.dil[1]);
          c.cash += amt; c.roundIdx++; c.lastRaise = S.turn; c.speed *= 1.03; c.score = Math.min(99, c.score + 1);
          m.h = `${c.name} が${rn}で${fmt(amt)}を調達`;
          if (S.roundFirst[idx] === undefined) { S.roundFirst[idx] = c.name; m.d = `資金調達レース：${rn}に一番乗りされた。あとから同じラウンドを調達すると条件が少し悪くなる。`; m.fx = [{ label: 'レース', v: ' 先着を許した', good: false }]; }
          else m.d = '潤沢な資金でGPUを買い増している。';
        } else { m.good = true; m.h = `${c.name} の資金調達が難航`; m.d = '投資家との交渉がまとまらなかった。'; }
        break; }
      case 'launch': {
        const P = prodById(i.seg); if (!P || c.products.includes(P.id)) break;
        c.products.push(P.id); c.rep = clamp(c.rep + 3, 0, 100);
        const mine = S.products.find(p => p.id === P.id);
        if (S.segFirst[P.id] === undefined) S.segFirst[P.id] = c.name;
        const pn = /「/.test(P.name) ? P.name : `「${P.name}」`;
        m.h = mine ? `${c.name} があなたの${pn}に対抗製品` : `${c.name} が${pn}をローンチ`;
        if (mine && S.qAct.seg.includes(P.id)) { m.good = true; m.d = '今期の強化が効いて迎撃成功！ユーザーは流れなかった。'; c.heat = Math.min(100, c.heat + 8); m.fx = [{ label: '迎撃', v: ' 成功', good: true }]; }
        else if (mine) { const g = 1 - 0.1 * softF(); mine.growth *= g; m.d = `シェア争いが勃発。${c.R.lines.taunt}`; m.fx = [{ label: 'シェア', v: ' 成長×' + g.toFixed(2), good: false }]; }
        else m.d = S.segFirst[P.id] === c.name ? 'この市場の一番乗りを奪われた。' : '市場がさらに混み合ってきた。';
        break; }
      case 'model': {
        const g = rand(2.2, 4.5) * (1 - c.score / 130); c.score = Math.min(99, c.score + g); c.ver++;
        m.good = c.score < S.modelScore ? null : false;
        m.model = true; m.h = `${c.name} が新モデル「${c.R.model}-${c.ver}」を発表`; m.d = `スコア +${g.toFixed(1)} → ${c.score.toFixed(1)}（自社 ${S.modelScore.toFixed(1)}）`;
        break; }
      case 'price': {
        if (!S.products.length) break;
        if (S.modelScore >= c.score + 5) { m.good = true; m.h = `${c.name} の値下げ攻勢`; m.d = '性能差でユーザーは動かなかった。'; }
        else { const g = 1 - 0.07 * softF(); m.h = `${c.name} が大幅値下げを仕掛けてきた`; m.d = `${c.name}：${c.R.lines.press}`; m.fx = fx({ growth: g }); }
        break; }
      case 'press': {
        if (S.qAct.pr) { m.good = true; m.h = `${c.name} のネガキャンは不発`; m.d = '先手を打った広報が効いた。'; c.rep = clamp(c.rep - 2, 0, 100); break; }
        if (!choice) { choice = pressEv(c); continue; }
        m.h = `${c.name} がネガティブキャンペーン`; m.d = `${c.name}：${c.R.lines.press}`; m.fx = fx({ rep: -Math.round(3 * softF() + 1) });
        break; }
      case 'poach': {
        if (S.staff.researcher < 2) break;
        if (!choice) { choice = poachEv(c); continue; }
        c.intent = { ...i, carry: true }; continue;   // 判断は1四半期に1つ：次の四半期に持ち越し
      }
      case 'bid': {
        if (!choice) { choice = bidEv(c, myV); continue; }
        c.intent = { ...i, carry: true }; continue;
      }
      case 'ipo': {
        c.ipo = true; c.cash += rivalVal(c) * 0.15; c.rep = clamp(c.rep + 8, 0, 100);
        m.h = `${c.name} が上場！`;
        if (!S.ipoFirst) { S.ipoFirst = c.name; m.d = '上場一番乗りを奪われた。あなたのIPO成功率が少し下がる。'; m.fx = fx({ mood: 0.96 }); }
        else m.d = '巨額の資金を手にした。';
        break; }
    }
    if (m.h) moves.push(m);
  }
  // 資金が尽きたライバルは業界再編で吸収される（創業期は起きない）
  if (S.turn > EARLY_END) for (const c of aliveRivals()) if (c.cash < -2 && aliveRivals().length > 2) {
    const big = aliveRivals().filter(x => x !== c).sort((a, b) => rivalVal(b) - rivalVal(a))[0];
    c.alive = false; big.score = Math.min(99, big.score + c.score * 0.06); big.cash += 2;
    big.products = [...new Set([...big.products, ...c.products])];
    moves.push({ c: big, good: null, h: `業界再編：${big.name} が ${c.name} を吸収`, d: '資金繰りに行き詰まったライバルが飲み込まれた。', fx: [] });
  }
  // 新モデル発表は1行にまとめ、勝負に関わる動きを上に
  const models = moves.filter(m => m.model && m.good !== false);
  let out = moves.filter(m => !models.includes(m));
  if (models.length >= 2) out.push({ c: null, good: null, h: `新モデル発表ラッシュ（${models.length}社）`, d: models.map(m => `${m.c.name} ${m.c.R.model}-${m.c.ver}（${m.c.score.toFixed(1)}）`).join('／'), fx: [] });
  else out = out.concat(models);
  return { moves: out, choice: choice ? { ...choice, choice: true } : null };
}
function poachEv(c) {
  const n = Math.max(1, Math.min(S.staff.researcher - 1, S.turn <= EARLY_END ? 1 : randi(1, 3)));
  const cost = n * 0.3 * (1 + S.turn * 0.05);
  const pKeep = clamp(0.3 + S.reputation / 150, 0.3, 0.85);
  const lose = () => { c.score = Math.min(99, c.score + n * 0.6); };
  const tg = S.crew.filter(m => !m.chief); const target = tg.length ? pick(tg) : null; S.poachTarget = target;
  return { cat: 'ライバル', rival: c, t: `${c.name} が研究者の引き抜きに動いた`, d: `${c.name}：${c.R.lines.poach}　研究者${n}名が転職を検討中。${target ? `その中には <b>${crewNameOf(target)}</b> も。「${PERSONAS[target.p].poach}」` : ''}`, opts: [
    { l: `カウンターオファー（${fmt(cost)}）`, s: '全員を引き留める', dis: S.cash < cost, run: () => { S.poachTarget = null; c.heat = Math.min(100, c.heat + 5); return fx({ cash: -cost, rep: 1 }); } },
    { l: '説得する（無料）', s: `成功率 約${Math.round(pKeep * 100)}%／失敗で${n}名流出`, run: () => { if (Math.random() < pKeep) { S.poachTarget = null; c.heat = Math.min(100, c.heat + 5); return [{ label: '結果', v: ' 全員残留', good: true }].concat(fx({ rep: 2 })); } lose(); return fx({ researcher: -n }); } },
    { l: '送り出す', s: `${n}名流出・${c.name}のスコア上昇`, run: () => { lose(); return fx({ researcher: -n, rep: 1 }); } },
  ] };
}
function pressEv(c) {
  const cost = (0.3 + S.turn * 0.02) * earlyF();
  const pWin = clamp(0.5 + (S.reputation - c.rep) / 100 + (S.modelScore - c.score) / 80, 0.15, 0.9);
  const lose = Math.round(4 * softF() + 2);
  return { cat: 'ライバル', rival: c, t: `${c.name} がネガティブキャンペーンを開始`, d: `${c.name}：${c.R.lines.press}`, opts: [
    { l: `真っ向から反論（${fmt(cost)}）`, s: `勝率 約${Math.round(pWin * 100)}%／勝てば評判+5・相手の評判-6`, dis: S.cash < cost, run: () => { const ch = fx({ cash: -cost }); c.heat = Math.min(100, c.heat + 10);
        if (Math.random() < pWin) { c.rep = clamp(c.rep - 6, 0, 100); return ch.concat([{ label: '舌戦', v: ' 勝利', good: true }], fx({ rep: 5 })); }
        return ch.concat([{ label: '舌戦', v: ' 敗北', good: false }], fx({ rep: -lose })); } },
    { l: '比較ベンチマークを公開（無料）', s: S.modelScore > c.score ? '性能で上回っている：評判+4・相手-4' : `性能で負けている：逆効果（評判 -${lose + 3}）`,
      run: () => { if (S.modelScore > c.score) { c.rep = clamp(c.rep - 4, 0, 100); return fx({ rep: 4 }); } return fx({ rep: -(lose + 3) }); } },
    { l: '沈黙を貫く', s: `評判 -${lose}`, run: () => fx({ rep: -lose }) },
  ] };
}
function bidEv(c, v) {
  const price = v * 1.1, cost = 0.6 * sc();
  const pDef = clamp(0.45 + S.reputation / 200 + S.ownership * 0.3, 0.3, 0.92);
  return { cat: 'ライバル', rival: c, t: `${c.name} が敵対的TOBを仕掛けてきた`, d: `${c.name}：${c.R.lines.bid}　提示額 ${fmt(price)}（あなたの取り分 ${fmt(price * S.ownership)}）`, opts: [
    { l: `買収防衛策を発動（${fmt(cost)}）`, s: `防衛成功率 約${Math.round(pDef * 100)}%／失敗すると持株 -15%`, dis: S.cash < cost, run: () => { const ch = fx({ cash: -cost }); c.heat = Math.min(100, c.heat + 15);
        if (Math.random() < pDef) { c.truce = S.turn + 3; return ch.concat([{ label: '防衛', v: ' 成功', good: true }], fx({ rep: 4 })); }
        S.ownership *= 0.85; return ch.concat([{ label: '持株', v: ' -15%', good: false }], fx({ rep: -4 })); } },
    { l: 'ホワイトナイトに出資を仰ぐ', s: `確実に防衛／持株 -12%・資金 +${fmt(v * 0.06)}`, run: () => { S.ownership *= 0.88; c.truce = S.turn + 4; return [{ label: '持株', v: ' -12%', good: false }].concat(fx({ cash: v * 0.06, rep: 2 })); } },
    { l: `受け入れる（${fmt(price)}で売却）`, s: 'ゲーム終了：敵対的買収で会社を手放す', run: () => { S.takenBy = c.name; S.takenPrice = price; endGame('taken'); return []; } },
  ] };
}
// プレイヤーから仕掛ける「ライバル工作」
function pickRival(title, info, apply) {
  const nodes = [para(`${title}：相手を選んでください（行動力1）。`)];
  aliveRivals().forEach(c => { const o = info(c);
    nodes.push(optBtn(`${isNem(c) ? '【宿敵】' : ''}${c.name}`, o.sub, () => {
      if (S.ap < 1) return log('行動力が足りません。', 'bad');
      if (o.cost && !spend(o.cost)) return;
      S.ap--; apply(c, o); closeModal(); render();
    }, !!o.dis || S.ap < 1 || S.cash < (o.cost || 0))); });
  openModal(title, nodes);
}
function actRival() {
  if (!aliveRivals().length) return openModal('ライバル工作', [para('もう市場にライバルはいません。あなたが業界の覇者です。')]);
  const nm = nemesis();
  const poachCost = (0.5 + S.turn * 0.04) * earlyF(), adCost = (0.3 + S.turn * 0.025) * earlyF();
  openModal('ライバル工作', [
    para(`ライバルに直接仕掛けます。仕掛けるほど相手の<b>因縁</b>が深まり、反撃されやすくなります。${nm && isNem(nm) ? `<br>現在の宿敵：<b>${nm.name}</b>（次の一手：${intentInfo(nm).t}）` : ''}`),
    optBtn(`研究者を引き抜く（${fmt(poachCost)}）`, '成功で研究者+2・相手のスコア-1.5', () => pickRival('引き抜き', c => {
      const p = clamp(0.5 + (S.reputation - c.rep) / 100 + (hasCrew('rival') ? 0.1 : 0), 0.2, 0.9); return { p, cost: poachCost, sub: `成功率 約${Math.round(p * 100)}%｜相手の評判 ${c.rep}` };
    }, (c, o) => { c.heat = Math.min(100, c.heat + 12);
      if (Math.random() < o.p) { S.staff.researcher += 2; c.score = Math.max(5, c.score - 1.5); log(`${c.name} から研究者2名を引き抜いた！ ${c.name}：${c.R.lines.lose}`, 'good'); }
      else { S.reputation = clamp(S.reputation - 1, 0, 100); log(`${c.name} への引き抜きは失敗…（評判 -1）`, 'bad'); } }), S.ap < 1 || S.cash < poachCost),
    optBtn(`比較広告キャンペーン（${fmt(adCost)}）`, '勝てば評判+5・相手の評判-6・プロダクト成長×1.05', () => pickRival('比較広告', c => {
      const p = clamp(0.5 + (S.modelScore - c.score) / 40 + (S.reputation - c.rep) / 150, 0.15, 0.9); return { p, cost: adCost, sub: `勝率 約${Math.round(p * 100)}%｜相手のモデル ${c.score.toFixed(1)}` };
    }, (c, o) => { c.heat = Math.min(100, c.heat + 10); S.qAct.pr = true;
      if (Math.random() < o.p) { S.reputation = clamp(S.reputation + 5, 0, 100); c.rep = clamp(c.rep - 6, 0, 100); S.products.forEach(p => p.growth *= 1.05); log(`比較広告で ${c.name} を圧倒！評判 +5 ${c.name}：${c.R.lines.lose}`, 'good'); }
      else { S.reputation = clamp(S.reputation - 4, 0, 100); log(`比較広告が裏目に…${c.name}：${c.R.lines.win}（評判 -4）`, 'bad'); } }), S.ap < 1 || S.cash < adCost),
    optBtn('休戦協定を結ぶ', '4四半期は相手から攻撃されない・因縁リセット', () => pickRival('休戦協定', c => {
      const cost = (0.4 + rivalVal(c) * 0.004) * earlyF(); return { cost, dis: c.truce >= S.turn, sub: c.truce >= S.turn ? '休戦中' : `${fmt(cost)}｜因縁 ${Math.round(c.heat)}` };
    }, (c) => { c.truce = S.turn + 4; c.heat = Math.max(0, c.heat - 40);
      if (['poach', 'press', 'price', 'bid'].includes(c.intent && c.intent.type)) c.intent = { type: 'model' };
      log(`${c.name} と休戦協定を締結（Q${S.turn + 4}まで）。`, 'good'); }), S.ap < 1),
  ]);
}

/* ===== ターン終了 ===== */
/* ===== イベント ===== */
// 効果を適用し、表示用のチップを返す
function fx(o) {
  const chips = [];
  const add = (label, v, good) => chips.push({ label, v, good });
  if (o.cash) { S.cash += o.cash; add('資金', (o.cash > 0 ? '+' : '−') + fmt(Math.abs(o.cash)), o.cash > 0); }
  if (o.rep) { S.reputation = clamp(S.reputation + o.rep, 0, 100); add('評判', (o.rep > 0 ? '+' : '') + Math.round(o.rep), o.rep > 0); }
  if (o.score) { S.modelScore = clamp(S.modelScore + o.score, 0, 100); add('モデル', (o.score > 0 ? '+' : '') + o.score.toFixed(1), o.score > 0); }
  if (o.compute) { const d = Math.max(-S.compute + 1, Math.round(o.compute)); S.compute += d; add('計算資源', (d > 0 ? '+' : '') + d + 'PF', d > 0); }
  for (const r of ['researcher', 'engineer', 'sales']) {
    if (o[r]) { const d = Math.max(-S.staff[r], o[r]); S.staff[r] += d; if (d) add(ROLES[r].name, (d > 0 ? '+' : '') + d + '名', d > 0); if (r === 'researcher' && d < 0) crewLoss(); }
  }
  if (o.price) { S.computePrice = clamp(S.computePrice * o.price, 0.5, 3); add('GPU価格', '×' + o.price.toFixed(2), o.price < 1); }
  if (o.mood) { S.sentiment = clamp(S.sentiment * o.mood, 0.5, 1.8); add('市場心理', '×' + o.mood.toFixed(2), o.mood > 1); }
  if (o.growth && S.products.length) { S.products.forEach(p => p.growth *= o.growth); add('プロダクト成長', '×' + o.growth.toFixed(2), o.growth > 1); }
  if (o.cond) { addCond(o.cond); add('調子', (o.cond > 0 ? '+' : '') + Math.round(o.cond), o.cond > 0); }
  for (const g of GAUGES) if (o[g.k]) { addLoad({ [g.k]: o[g.k] }); add(g.n, sg(o[g.k]), o[g.k] < 0); }
  if (o.rivals) { S.competitors.forEach(c => { if (c.alive) c.score = Math.min(99, c.score + o.rivals); }); add('全ライバル', '+' + o.rivals.toFixed(1), false); }
  return chips;
}
const sc = () => 1 + S.turn * 0.15;          // 金額のスケール
const revQ = () => Math.max(0.5, calcRevenue());
const aliveRival = () => pick(S.competitors.filter(c => c.alive));

// cat: 市場 / 半導体 / 規制 / 技術 / 人材 / 事件 / 提携
const EVENTS = [
  { bad: 1, w: 3, cat: '半導体', f: () => ({ t: 'GPU不足が深刻化', d: '生成AI需要の急増で最新GPUの納期が1年待ちに。', fx: fx({ price: 1.4 }) }) },
  { w: 3, cat: '半導体', f: () => ({ t: '新世代GPUが出荷開始', d: '演算性能2倍の新アーキテクチャが市場に投入された。', fx: fx({ price: 0.75 }) }) },
  { bad: 1, w: 2, cat: '半導体', f: () => ({ t: '先端チップの輸出規制', d: '政府が先端半導体の輸出管理を強化。一部クラスタが稼働停止に。', fx: fx({ price: 1.6, compute: -S.compute * 0.15 }) }) },
  { bad: 1, w: 1, cat: '半導体', f: () => ({ t: 'データセンター大停電', d: '熱波で電力網が逼迫し、学習ジョブが全停止。復旧費用がかさんだ。', fx: fx({ cash: -0.4 * sc(), compute: -S.compute * 0.1 }) }) },
  { w: 2, cat: '提携', f: () => ({ t: 'クラウド大手から計算クレジット', d: 'スタートアップ支援プログラムに採択された。', fx: fx({ compute: 15 + S.turn * 2 }) }) },
  { w: 3, cat: '市場', f: () => ({ t: 'AIバブル到来', d: '「AGIは近い」——投資家が熱狂し、評価額が跳ね上がる。', fx: fx({ mood: 1.2 }) }) },
  { bad: 1, w: 2, cat: '市場', f: () => ({ t: '資金調達の冬', d: 'AI銘柄が急落。VCは財布の紐を締め始めた。', fx: fx({ mood: 0.72 }) }) },
  { bad: 1, w: 2, cat: '市場', need: () => aliveRivals().length > 0, f: () => { const c = aliveRivals().find(x => x.tag === 'MT' || x.tag === 'DS') || aliveRival(); c.score = Math.min(99, c.score + 2); return { rival: c, t: `${c.name} が高性能モデルを無料公開`, d: `${c.name}：${c.R.lines.taunt}　APIの価格競争が激化。`, fx: fx({ growth: 0.9, rivals: 1 }) }; } },
  { bad: 1, w: 2, cat: '規制', f: () => ({ t: 'AI規制法が成立', d: '大規模モデルに安全評価と報告義務。コンプライアンス対応が必要に。', fx: fx({ cash: -0.3 * sc(), rep: -4 }) }) },
  { w: 1, cat: '規制', f: () => ({ t: '政府のAI補助金に採択', d: '国産AI基盤モデル開発プロジェクトに選ばれた。', fx: fx({ cash: 1.2 * sc(), rep: 3 }) }) },
  { bad: 1, w: 2, cat: '技術', need: () => S.competitors.some(c => c.alive), f: () => { const c = aliveRival(); c.score = Math.min(99, c.score + rand(3, 6)); c.ver++; return { rival: c, t: `${c.name} が「${c.R.model}-${c.ver}」でSOTA更新`, d: `${c.name}：${c.R.lines.win}`, fx: [{ label: c.name, v: ' スコア' + c.score.toFixed(1), good: false }] }; } },
  // ---- ライバル名指しイベント ----
  { w: 2, cat: 'ライバル', need: () => aliveRivals().length > 0, f: () => { const c = nemesis(); c.heat = Math.min(100, c.heat + 10); return { rival: c, t: `${c.name} のCEOが名指しで挑発`, d: `${c.name}：${c.R.lines.taunt}`, fx: fx({ rep: 1 }).concat([{ label: '因縁', v: ' +10', good: false }]) }; } },
  { w: 1, cat: 'ライバル', need: () => aliveRivals().length > 0, f: () => { const c = aliveRival(); c.rep = clamp(c.rep - 10, 0, 100); c.score = Math.max(5, c.score - 2);
      return { rival: c, t: `${c.name} で安全性スキャンダル`, d: 'モデルの不適切な出力が大きく報じられ、ユーザーが流出している。', fx: (S.products.length ? fx({ growth: 1.06 }) : fx({ rep: 2 })).concat([{ label: c.name, v: ' 評判-10', good: true }]) }; } },
  { bad: 1, w: 1, cat: 'ライバル', need: () => aliveRivals().length >= 2, f: () => { const [a, b] = aliveRivals().sort(() => Math.random() - 0.5); a.score = Math.min(99, a.score + 2.5); b.score = Math.min(99, b.score + 2.5);
      return { rival: a, t: `${a.name} と ${b.name} が提携を発表`, d: '計算資源と研究成果を共有する包括提携。業界の勢力図が動いた。', fx: [{ label: '2社', v: ' スコア+2.5', good: false }] }; } },
  { bad: 1, w: 1, cat: '半導体', need: () => aliveRivals().length > 0, f: () => { const c = aliveRivals().find(x => x.tag === 'GM') || aliveRival(); c.score = Math.min(99, c.score + 1.5);
      return { rival: c, t: `${c.name} が最新GPUを買い占め`, d: '数十万枚規模の発注で市場から在庫が消えた。', fx: fx({ price: 1.2 }) }; } },
  { w: 1, cat: 'ライバル', choice: true, need: () => S.turn >= 3 && aliveRivals().length > 0, f: () => { const c = nemesis();
      const p = clamp(0.5 + (S.reputation - c.rep) / 120 + (S.modelScore - c.score) / 60, 0.15, 0.9), lose = S.turn <= EARLY_END ? 3 : 5;
      return { rival: c, t: `${c.name} のCEOが公開討論を挑んできた`, d: `${c.name}：${c.R.lines.taunt}　テーマは「次のAIの覇者は誰か」。`, opts: [
        { l: '受けて立つ', s: `勝率 約${Math.round(p * 100)}%／勝てば評判+6・相手-6、負ければ評判-${lose}`, run: () => { c.heat = Math.min(100, c.heat + 10);
            if (Math.random() < p) { c.rep = clamp(c.rep - 6, 0, 100); return [{ label: '討論', v: ' 完勝', good: true }].concat(fx({ rep: 6 })); }
            return [{ label: '討論', v: ' 完敗', good: false }].concat(fx({ rep: -lose })); } },
        { l: '辞退する', s: '評判 -1（逃げたと言われる）', run: () => fx({ rep: -1 }) },
      ] }; } },
  { w: 1, cat: 'ライバル', choice: true, need: () => aliveRivals().length > 0, f: () => { const c = aliveRival(), cost = 0.4 * sc(), n = randi(2, 4);
      return { rival: c, t: `${c.name} で内紛、研究者が大量離脱`, d: '経営陣と研究チームが対立。優秀な研究者たちが次の職場を探している。', opts: [
        { l: `まとめて迎え入れる（${fmt(cost)}）`, s: `研究者 +${n}名・${c.name}のスコア -2`, dis: S.cash < cost, run: () => { c.score = Math.max(5, c.score - 2); c.heat = Math.min(100, c.heat + 10); return fx({ cash: -cost, researcher: n }); } },
        { l: '見送る', s: '何も起きない', run: () => { c.score = Math.max(5, c.score - 1); return []; } },
      ] }; } },
  { w: 1, cat: '研究', f: () => ({ t: '夏の集中研究合宿', d: '研究チームが避暑地のデータセンターで合宿。空気が変わり、チームも息を吹き返した。', fx: fx({ cond: 15, strain: -12 }) }) },
  { bad: 1, w: 1, cat: '研究', need: () => S.load >= 55, f: () => ({ t: '学習クラスタが熱暴走', d: '使い詰めのGPUノードが過熱。学習ジョブがいくつか飛んだ。', fx: fx({ cond: -10, load: 10, score: -0.5 }) }) },
  { bad: 1, w: 2, cat: '研究', need: () => S.debt >= 45, f: () => ({ t: 'レガシーコードの地雷を踏んだ', d: '継ぎはぎの前処理スクリプトが静かにデータを壊していた。評価をやり直し。', fx: fx({ score: -1, cond: -6, debt: 5 }) }) },
  { bad: 1, w: 2, cat: '研究', need: () => S.strain >= 65, f: () => { const L = crewLine('strain', 'mood'); return { t: 'チームが燃え尽き寸前', d: `深夜のSlackが止まらない。${L.who}「${L.text}」`, fx: fx({ researcher: -1, cond: -8, strain: -15 }) }; } },
  { w: 1, cat: '研究', f: () => ({ t: 'GPU冷却設備を大改修', d: '液冷システムの導入でクラスタに余裕ができた。', fx: fx({ load: -25 }) }) },
  { w: 1, cat: '研究', f: () => { const j = joinCrew(); return j ? { t: `伝説の研究者 ${j.n} が合流`, d: `「${PERSONAS[j.p].hello}」 ${PERSONAS[j.p].t}：${PERSONAS[j.p].eff}`, fx: fx({ cond: 10, researcher: 1 }) } : { t: '伝説の研究者が技術顧問に', d: '「このチームは伸びる」と太鼓判。', fx: fx({ cond: 10 }) }; } },
  { w: 1, cat: '研究', f: () => ({ t: '新しい評価データセットを導入', d: '汚染のないクリーンな評価セットが完成。改善点がはっきり見えた。', fx: fx({ cond: 8, score: 0.8 }) }) },
  { w: 1, cat: '技術', f: () => ({ t: '社内ハッカソンで新手法', d: '若手が考案した学習トリックで効率が大幅改善。', fx: fx({ score: rand(1.5, 3.5) }) }) },
  { w: 1, cat: '技術', f: () => ({ t: '業界を変える論文が登場', d: '新しいアーキテクチャ論文に全社が飛びついた。', fx: fx({ score: 2, rivals: 2 }) }) },
  { bad: 1, w: 2, cat: '人材', need: () => aliveRivals().length > 0, f: () => { const c = aliveRival(); return S.staff.researcher > 2
      ? ({ rival: c, t: `${c.name} がトップ研究者を引き抜き`, d: `${c.name}：${c.R.lines.poach}`, fx: fx({ researcher: -randi(1, Math.min(S.turn <= EARLY_END ? 1 : 3, S.staff.researcher - 1)) }) })
      : ({ rival: c, t: `${c.name} のヘッドハンターが接触`, d: '社員に声がかかったが、全員残ってくれた。', fx: fx({ rep: 1 }) }); } },
  { w: 1, cat: '人材', f: () => ({ t: '大学研究室と共同研究', d: '有名研究室の博士課程メンバーが合流した。', fx: fx({ researcher: 2 }) }) },
  { bad: 1, w: 1, cat: '人材', need: () => S.strain >= 35, f: () => ({ t: 'エンジニアの燃え尽き', d: '連続リリースの無理がたたり、離職者が出た。', fx: fx({ engineer: -randi(1, 2), strain: -8 }) }) },
  { w: 2, cat: '市場', f: () => S.products.length
      ? ({ t: 'デモ動画がバイラルに', d: 'SNSで新機能のデモが1億回再生された。', fx: fx({ growth: 1.2, rep: 3 }) })
      : ({ t: '研究デモが話題に', d: '技術ブログが海外でトレンド入り。', fx: fx({ rep: 5 }) }) },
  { w: 1, cat: '市場', f: () => ({ t: '著名研究者がSNSで絶賛', d: '「今いちばん面白いAIラボ」と紹介された。', fx: fx({ rep: 6 }) }) },
  { bad: 1, w: 2, cat: '事件', need: () => S.products.length > 0, f: () => ({ t: 'ハルシネーション炎上', d: 'AIが存在しない判例を自信満々に回答し、ニュースに。', fx: fx({ rep: -9, growth: 0.92 }) }) },
  { bad: 1, w: 1, cat: '事件', f: () => ({ t: 'モデルの重みが流出', d: '内部の学習済みモデルがネットに流出。ライバルにも解析された。', fx: fx({ rep: -4, rivals: 3 }) }) },
  { bad: 1, w: 1, cat: '事件', f: () => ({ t: 'ベンチマーク汚染疑惑', d: 'テストデータが学習に混入していた疑いが指摘された。', fx: fx({ rep: -5, score: -1.5 }) }) },
  { bad: 1, w: 1, cat: '事件', f: () => ({ t: 'データ漏洩の報道', d: 'ユーザーの会話ログが一部閲覧可能になっていた。', fx: fx({ rep: -8, cash: -0.2 * sc() }) }) },
  // ---- 選択型イベント ----
  { bad: 1, w: 2, cat: '事件', choice: true, f: () => ({
      t: 'AI安全性インシデント', d: 'レッドチームがモデルの危険な挙動を発見。どう対応する？',
      opts: [
        { l: '公表して全面改修', s: '資金を使うが信頼は守れる', run: () => fx({ cash: -0.5 * sc(), rep: -2, score: -1 }) },
        { l: '社内で静かに修正', s: '50%で何も起きない／50%で大炎上（評判 -15）', run: () => Math.random() < 0.5 ? [{ label: '結果', v: '発覚せず', good: true }] : fx({ rep: -15 }) },
      ] }) },
  { w: 2, cat: '提携', choice: true, f: () => { const cost = 0.8 * sc(); return {
      t: '大手出版社からデータ提携の打診', d: '高品質な書籍・記事データのライセンス契約を持ちかけられた。',
      opts: [
        { l: `契約する（${fmt(cost)}）`, s: 'モデルスコア +3〜5・評判 +2', dis: S.cash < cost, run: () => fx({ cash: -cost, score: rand(3, 5), rep: 2 }) },
        { l: '見送る', s: '何も起きない', run: () => [] },
      ] }; } },
  { bad: 1, w: 1, cat: '規制', choice: true, f: () => { const amt = 0.6 * sc(); return {
      t: '著作権侵害で提訴された', d: 'クリエイター団体が学習データの無断利用で訴訟を起こした。',
      opts: [
        { l: `和解する（${fmt(amt)}）`, s: '確実に収束', run: () => fx({ cash: -amt, rep: -1 }) },
        { l: '徹底抗戦', s: '勝てば評判 +5／負ければ 2倍の賠償と評判 -6', run: () => Math.random() < 0.5 ? fx({ rep: 5 }) : fx({ cash: -amt * 2, rep: -6 }) },
      ] }; } },
  { w: 1, cat: '提携', choice: true, need: () => S.modelScore >= 30, f: () => { const amt = revQ() * 2 + sc(); return {
      t: 'メガテックから独占ライセンスの提案', d: 'モデルを独占提供すれば前払い金を払うという。ただし自社プロダクトの伸びは鈍る。',
      opts: [
        { l: `受ける（+${fmt(amt)}）`, s: 'プロダクト成長 ×0.85', run: () => fx({ cash: amt, growth: 0.85 }) },
        { l: '断る', s: '独立路線を貫く（評判 +2）', run: () => fx({ rep: 2 }) },
      ] }; } },
  { w: 2, cat: '平穏', f: () => null },
];
// 序盤は悪いニュースが出にくい（Q1〜4：1/3、Q5〜8：2/3）
function evW(e) { return e.bad ? e.w * (S.turn <= 4 ? 0.33 : S.turn <= EARLY_END ? 0.67 : 1) : e.w; }
function randomEvent() {
  const pool = EVENTS.filter(e => !e.need || e.need());
  const total = pool.reduce((s, e) => s + evW(e), 0);
  let r = Math.random() * total;
  for (const e of pool) { r -= evW(e); if (r <= 0) { const res = e.f(); return res ? { ...res, cat: e.cat, choice: !!e.choice } : null; } }
  return null;
}
const chipsText = (fxs) => fxs.map(c => `${c.label}${c.v}`).join('・');
function chipsHtml(fxs) {
  return fxs.length ? `<div class="chips">${fxs.map(c => `<span class="chip ${c.good ? 'g' : 'b'}">${c.label} <b>${c.v}</b></span>`).join('')}</div>` : '';
}
function movesNode() {
  const moves = S.lastMoves || [];
  const d = document.createElement('div'); d.className = 'rv-moves';
  d.innerHTML = `<div class="rv-moves-h">ライバルの動き<em>RIVAL WATCH</em></div>` + moves.map(m =>
    `<div class="rv-move ${m.good === true ? 'g' : m.good === false ? 'b' : ''}">${m.me ? '<i class="rv-badge me">◆</i>' : m.c ? badge(m.c) : '<i class="rv-badge">NEW</i>'}<div><b>${clean(m.h)}</b>${m.d ? `<span>${clean(m.d)}</span>` : ''}${m.fx && m.fx.length ? chipsHtml(m.fx) : ''}</div></div>`).join('');
  return d;
}
function showNews(ev) {
  const hasMoves = (S.lastMoves || []).length > 0;
  const pre = () => hasMoves ? [movesNode()] : [];
  if (!ev) { if (hasMoves) openModal(`${dateLabel(S.turn - 1)}｜ライバル動向`, pre()); return; }
  const head = para(`<span class="news-cat${ev.cat === 'ライバル' ? ' rv' : ''}">${ev.cat}</span>${ev.rival ? `<span class="news-rv">${badge(ev.rival)}${ev.rival.name}${isNem(ev.rival) ? '<em>宿敵</em>' : ''}</span>` : ''}<span class="news-h">${ev.t}</span><span class="news-d">${ev.d}</span>`);
  head.className = 'news';
  if (!ev.choice) {
    const box = document.createElement('div'); box.innerHTML = chipsHtml(ev.fx);
    openModal('AI業界速報', [...pre(), head, box]);
    return;
  }
  const nodes = [head];
  ev.opts.forEach(o => nodes.push(optBtn(o.l, o.s, () => {
    const r = o.run();
    if (S.ended) return;
    log(`→ ${o.l}${r.length ? '：' + chipsText(r) : ''}`, r.some(c => !c.good) ? 'bad' : 'good');
    S.pendingChoice = false;
    const box = document.createElement('div'); box.innerHTML = `<p class="news-res">決定：${clean(o.l)}</p>` + chipsHtml(r);
    openModal('AI業界速報', [head, box, ...pre()]);
    render();
  }, !!o.dis)));
  S.pendingChoice = true;
  nodes.push(para('<small style="color:var(--muted)">どれか1つを選ぶと先へ進めます。</small>'));
  openModal(ev.cat === 'ライバル' ? 'ライバル襲来｜判断が必要' : 'AI業界速報｜判断が必要', nodes.concat(pre()), true);
}

function endTurn() {
  if (S.pendingChoice) { showNews(S.lastEv); return; }
  snapshot();
  // 収支
  const rev = calcRevenue();
  const b = burn();
  S.cash += rev - b;
  S.revenue = rev;
  log(`── ${dateLabel()} 決算：売上 ${fmt(rev)} ／ コスト ${fmt(b)} ／ 収支 ${rev - b >= 0 ? '+' : ''}${fmt(rev - b)}`, 'q');

  // プロダクト成長
  S.products.forEach(p => { p.age++; p.growth = Math.min(4, p.growth * (1 + (p.age < 8 ? 0.08 : 0.02) * debtF())); });
  // ライバル進化
  S.competitors.filter(c => c.alive).forEach(c => {
    c.score = Math.min(99, c.score + c.speed * rand(0.3, 1.3) * (1 - c.score / 130));
  });
  // ライバルのターン（公開していた「次の一手」を実行）→ 順位変動
  const rt = rivalTurn();
  S.lastMoves = resolvePapers().concat(rt.moves, updateRanks());
  S.lastMoves.forEach(m => log(`【ライバル】${m.h}${m.fx && m.fx.length ? '：' + chipsText(m.fx) : ''}`, m.good === false ? 'bad' : m.good ? 'good' : 'rival'));
  // 評判の自然減衰
  S.reputation = clamp(S.reputation + (S.reputation > 50 ? -1 : 0), 0, 100);
  // 市場心理の回帰
  S.sentiment += (1 - S.sentiment) * 0.15;
  S.computePrice += (1 - S.computePrice) * 0.2;
  if (S.ipoCooldown > 0) S.ipoCooldown--;
  // 3つの負荷の回復：計算負荷はよく抜ける、技術的負債は抜けにくい、チーム疲弊は研究者とムードメーカーで回復
  const stHigh = S.strain >= 75, dbHigh = S.debt >= 70;
  addLoad({ load: -(28 + (hasCrew('infra') ? 10 : 0) + (traitLv('eff') ? 10 * tb('eff') : 0)),
    debt: -(3 + Math.min(6, S.staff.engineer * 0.5) + (hasCrew('crafter') ? 3 : 0)),
    strain: -(18 + Math.min(8, S.staff.researcher * 0.6) + (hasCrew('mood') ? 8 : 0)) });
  addCond((55 - S.cond) * 0.2 + rand(-5, 5) + (stHigh ? -8 : 0) + (dbHigh ? -4 : 0));
  if (stHigh || dbHigh) { const L = advice(); log(`${stHigh ? 'チームの疲れが抜けきらず' : '技術的負債が重く'}調子落ち…（調子 ${condLv().n}${condLv().a}）${L.who}「${L.text}」`, 'bad'); }

  // イベント
  const ev = rt.choice || randomEvent();
  if (ev) log(`【${ev.cat}】${ev.t}${ev.choice ? '（判断待ち）' : ev.fx.length ? '：' + chipsText(ev.fx) : ''}`, 'event');

  // 買収提案（評価額が上がってきたら）
  S.buyoutOffer = null;
  const v = calcValuation();
  if (S.turn > 4 && Math.random() < 0.2) {
    const from = pick(['メガテック「アルファベット・スタリオン」', 'マイクロハード', '巨大EC「アマゾネス」']);
    S.buyoutOffer = { from, price: v * rand(1.2, 1.8) };
    log(`📨 ${from} から ${fmt(S.buyoutOffer.price)} での買収提案が届いた（M&Aから受諾可・今期限り）`, 'event');
  }
  // 買収候補の更新
  if (!S.target || Math.random() < 0.5) genTarget();

  // 敗北判定
  if (S.cash < 0 && S.turn <= EARLY_END && !S.flags.earlyBridge) {
    // 創業期だけの救済：エンジェル投資家のつなぎ資金（通常の救済回数は消費しない）
    S.flags.earlyBridge = true;
    const bridge = -S.cash + 1.5;
    S.cash += bridge; S.ownership *= 0.85; S.reputation = clamp(S.reputation - 5, 0, 100);
    log(`⚠ 資金ショート！創業期の特例でエンジェル投資家が ${fmt(bridge)} をつなぎ融資（持株 -15%・評判 -5）。この救済は1回限りです。「受託開発」で現金を稼ぐのも手。`, 'bad');
  }
  if (S.cash < 0) {
    if (!S.flags.warned) {
      S.flags.warned = true;
      const bridge = -S.cash + 1;
      S.cash += bridge; S.ownership *= 0.7; S.reputation = clamp(S.reputation - 15, 0, 100);
      log(`⚠ 資金ショート！既存投資家から ${fmt(bridge)} の緊急ブリッジ融資（持株 -30%・評判 -15）。次はありません。`, 'bad');
    } else { return endGame('bankrupt'); }
  }
  if (S.ownership < 0.08) return endGame('ousted');

  S.turn++;
  if (S.turn > MAX_TURNS) return endGame('timeup');
  S.ap = AP_PER_TURN; S.trainedThisTurn = 0; S.benchThisTurn = false;
  S.qAct = { seg: [], pr: false };
  planIntents();
  S.valuation = calcValuation();
  const rw = calcRevenue() >= burn() ? 99 : S.cash / (burn() - calcRevenue());
  if (rw < 2) log(`⚠ 資金が残り約${Math.max(0, Math.floor(rw))}四半期分。「受託開発」で稼ぐか「資金調達」を。${S.flags.warned ? '次の資金ショートは倒産です。' : ''}`, 'bad');
  render();
  S.lastEv = ev;
  if (ev || S.lastMoves.length) showNews(ev);
}

/* ===== 描画 ===== */
function delta(cur, prev, money) {
  if (prev === undefined) return '';
  const d = cur - prev;
  if (Math.abs(d) < 0.01) return '<span class="d">―</span>';
  const s = money ? fmt(Math.abs(d)) : Math.abs(d).toFixed(1);
  return `<span class="d ${d > 0 ? 'up' : 'down'}">${d > 0 ? '▲' : '▼'} ${s}</span>`;
}
function render() {
  S.valuation = calcValuation();
  $('hdr-company').textContent = S.name;
  $('hdr-date').textContent = `第${S.turn}四半期（${dateLabel()}）／${MAX_TURNS}`;
  $('hdr-ap').innerHTML = Array.from({ length: AP_PER_TURN }, (_, i) => `<i class="pip${i < S.ap ? ' on' : ''}"></i>`).join('');
  $('end-turn-btn').classList.toggle('pulse', S.ap === 0);
  const dock = $('turn-dock');
  if (dock) {
    const runway = calcRevenue() >= burn() ? 99 : S.cash / (burn() - calcRevenue());
    dock.classList.toggle('show', S.ap === 0);
    $('dock-msg').textContent = S.ap === 0 ? '行動力を使い切りました' : '';
    dock.classList.toggle('danger', runway < 1.5);
  }

  const rev = calcRevenue();
  const stats = [
    ['資金|CASH', fmt(S.cash), delta(S.cash, S.prev.cash, true)],
    ['評価額|VALUATION', fmt(S.valuation), delta(S.valuation, S.prev.valuation, true)],
    ['四半期売上|REV·Q', fmt(rev), delta(rev, S.prev.revenue, true)],
    ['四半期コスト|BURN', fmt(burn()), `<span class="d">収支 ${rev - burn() >= 0 ? '+' : '−'}${fmt(Math.abs(rev - burn()))}</span>`],
    ['モデルスコア|MODEL', S.modelScore.toFixed(1), delta(S.modelScore, S.prev.modelScore)],
    ['調子|MOMENTUM', `${condLv().n} ${condLv().a}`, `<span class="d">${myModelName()}・${genLabel()}</span>`],
    ['ラボ負荷|LOADS', `${gaugeLabel(GAUGES.reduce((m, g) => S[g.k] > S[m.k] ? g : m).k)}`, `<span class="d">負荷${Math.round(S.load)}・負債${Math.round(S.debt)}・疲弊${Math.round(S.strain)}</span>`],
    ['評判|REP', Math.round(S.reputation), delta(S.reputation, S.prev.reputation)],
    ['社員数|TEAM', headcount() + '名', `<span class="d">研${S.staff.researcher}・エ${S.staff.engineer}・営${S.staff.sales}</span>`],
    ['計算資源|COMPUTE', S.compute + ' PF', `<span class="d">GPU価格 ×${S.computePrice.toFixed(2)}</span>`],
    ['持株比率|EQUITY', (S.ownership * 100).toFixed(1) + '%', `<span class="d">次: ${ROUNDS[Math.min(S.roundIdx, ROUNDS.length - 1)].name}</span>`],
    ['ランウェイ|RUNWAY', rev >= burn() ? '黒字 ∞' : Math.floor(S.cash / (burn() - rev)) + '四半期', ''],
  ];
  $('stats').innerHTML = stats.map(([k, v, d], i) => { const [jp, en] = k.split('|');
    const meter = en === 'MODEL' ? `<div class="meter"><i style="width:${S.modelScore}%"></i></div>` : en === 'REP' ? `<div class="meter"><i style="width:${S.reputation}%"></i></div>` : en === 'MOMENTUM' ? `<div class="meter cond-m"><i style="width:${S.cond}%"></i></div>` : en === 'LOADS' ? GAUGES.map(g => `<div class="meter ${g.cls}"><i style="width:${S[g.k]}%"></i></div>`).join('') : '';
    return `<div class="stat${i < 2 ? ' key' : ''}"><div class="k">${jp}<em>${en}</em></div><div class="v">${v}</div>${meter}${d}</div>`; }).join('');

  const act = $('actions'); act.innerHTML = '';
  ACTIONS.forEach(a => {
    const b = document.createElement('button');
    b.className = 'btn';
    b.className = 'btn act act-' + a.id;
    b.innerHTML = `<i class="ai">${ICONS[a.id]}</i><span class="al">${a.label}<small>${a.sub}</small></span>`;
    b.disabled = S.ap < 1 && a.id !== 'ma';
    b.onclick = a.fn;
    act.appendChild(b);
  });

  $('products').innerHTML = S.products.length
    ? S.products.map(p => `<div class="row"><span>${p.name}</span><span class="tag">×${p.growth.toFixed(2)}</span><span>${fmt(productRevenue(p))}/Q</span></div>`).join('')
    : '<div class="row"><span style="color:var(--muted)">まだローンチ前です。モデルスコア15で最初のプロダクトを出せます。</span></div>';

  const board = boardRows();
  const mv = (d) => d > 0 ? `<b class="mv up">▲${d}</b>` : d < 0 ? `<b class="mv dn">▼${-d}</b>` : '';
  $('leaderboard').innerHTML = board.map((r, i) => {
    const d = r.me ? (S.myPrevRank || 0) - (S.myRank || 0) : (r.c.prevRank || 0) - (r.c.rank || 0);
    return `<div class="row ${r.me ? 'me' : ''}${!r.me && isNem(r.c) ? ' nem' : ''}"><span>${i + 1}. ${r.me ? '' : badge(r.c)}${esc(r.name)}${mv(d)}</span><div class="bar"${r.me ? '' : ` style="--c:${r.c.col}"`}><i style="width:${r.score}%"></i></div><span>${r.score.toFixed(1)}</span></div>`; }).join('');
  renderRivals(); renderLineage(); renderCrew(); renderConfCal();

  const t = S.target;
  $('market').innerHTML = `
    <div class="list">
      <div class="row"><span>市場心理</span><span>${S.sentiment >= 1.1 ? '🔥 過熱' : S.sentiment <= 0.85 ? '❄ 冷え込み' : '― 平常'}（×${S.sentiment.toFixed(2)}）</span></div>
      <div class="row"><span>買収候補</span><span>${t ? `${t.name}：${t.desc}（${fmt(t.price)}）` : 'なし'}</span></div>
      <div class="row"><span>買収提案</span><span>${S.buyoutOffer ? `${S.buyoutOffer.from}：${fmt(S.buyoutOffer.price)}` : 'なし'}</span></div>
      ${(() => { const cf = confAt(); const m = cf.hot === curGen().trait; return `<div class="row"><span>学会</span><span>${cf.n}（今期締切）注目：${TRAITS[cf.hot].n}${m ? '◆' : ''}／${S.paperSub ? '投稿済' : '未投稿'}・今年${S.yPapers}本</span></div>`; })()}
      <div class="row"><span>IPO条件</span><span>${ipoReq().filter(r => r[1]).length}/4 達成</span></div>
    </div>`;
}

const esc = (t) => String(t).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
function valRows() { return aliveRivals().map(c => ({ c, v: rivalVal(c) })).concat([{ me: true, v: calcValuation() }]).sort((a, b) => b.v - a.v); }
function renderRivals() {
  const el = $('rivals'), bar = $('nemesis-bar');
  const nm = nemesis();
  if (bar) {
    if (!nm) { bar.innerHTML = '<span class="nb-solo">ライバルはすべて退場。あなたが業界の覇者だ。</span>'; }
    else { const inf = intentInfo(nm), lead = S.modelScore - nm.score;
      if (bar.style.setProperty) bar.style.setProperty('--c', nm.col);
      bar.innerHTML = `<div class="nb-l">${badge(nm)}<div><small>${isNem(nm) ? '宿敵 NEMESIS' : '最大のライバル'}</small><b>${nm.name}</b></div></div>
        <div class="nb-vs"><span>モデル</span><b class="${lead >= 0 ? 'up' : 'dn'}">${S.modelScore.toFixed(1)} <i>vs</i> ${nm.score.toFixed(1)}</b><span>ベンチ ${nm.w}勝${nm.l}敗</span></div>
        <div class="nb-int ${inf.bad ? 'bad' : ''}"><small>次の一手</small>${inf.t}${inf.hint ? `<em>${inf.hint}</em>` : ''}</div>`; }
  }
  if (!el) return;
  const idx = S.roundIdx, fb = S.roundFirst[idx];
  const race = `<div class="rv-races">
    <div class="rv-race"><span>資金調達レース</span><b>${roundName(idx)}</b><em class="${fb === 'me' ? 'up' : fb ? 'dn' : ''}">${fb === undefined ? '先着：未定' : fb === 'me' ? '先着：自社' : '先着：' + fb}</em></div>
    <div class="rv-race"><span>上場レース</span><b>一番乗り</b><em class="${S.ipoFirst ? 'dn' : ''}">${S.ipoFirst || '未定'}</em></div></div>`;
  el.innerHTML = race + '<div class="rv-sort">評価額ランキング</div>' + valRows().map((x, i) => {
    if (x.me) return `<div class="rv-card me"><div class="rv-top"><i class="rv-badge me">◆</i><b>${i + 1}. ${esc(S.name)}（自社）</b><span class="rv-v">${fmt(x.v)}</span></div></div>`;
    const c = x.c, inf = intentInfo(c), nem = isNem(c);
    const rd = c.roundIdx === 0 ? 'シード' : roundName(c.roundIdx - 1) + '済';
    return `<div class="rv-card${nem ? ' nem' : ''}" style="--c:${c.col}"><div class="rv-top">${badge(c)}<b>${i + 1}. ${c.name}</b>${nem ? '<em class="rv-tag nem">宿敵</em>' : ''}${c.truce >= S.turn ? '<em class="rv-tag truce">休戦中</em>' : ''}${c.ipo ? '<em class="rv-tag">上場</em>' : ''}<span class="rv-v">${fmt(x.v)}</span></div>
      <div class="rv-sub">${c.style}｜モデル ${c.score.toFixed(1)}｜${rd}｜製品${c.products.length}｜評判${Math.round(c.rep)}</div>
      <div class="rv-int${inf.bad ? ' bad' : ''}"><span>次の一手</span>${inf.t}${inf.hint ? `<small>${inf.hint}</small>` : ''}</div>
      <div class="rv-heat"><span>因縁</span><i><b style="width:${Math.min(100, c.heat)}%"></b></i></div></div>`;
  }).join('') + (S.beaten.length ? `<div class="rv-sort">退場：${S.beaten.join('・')}</div>` : '');
}

/* ===== 終了 ===== */
function endGame(type) {
  const v = calcValuation();
  const titles = {
    ipo: ['🔔 IPO成功！', '鐘が鳴る。あなたの会社は上場企業となった。', 'win'],
    sold: ['🤝 会社売却', 'エグジット成功。あなたのモデルは新たな巨人の一部へ。', 'win'],
    bankrupt: ['💀 倒産', '資金が尽きた…GPUの灯が消えた。', 'lose'],
    ousted: ['🚪 CEO解任', '持株比率が下がりすぎ、取締役会に解任された。', 'lose'],
    timeup: ['⌛ 10年経過', 'IPOには届かなかったが、研究は続く。', ''],
    taken: ['敵対的買収', `${S.takenBy || 'ライバル'} の軍門に下った。あなたのモデルは宿敵の一部になる。`, 'lose'],
  };
  S.ended = true; S.pendingChoice = false; closeModal();
  if (type === 'ipo' && !S.ipoFirst) S.ipoFirst = 'me';
  const [t, sub, em] = titles[type];
  let personal = type === 'taken' ? S.takenPrice * S.ownership : type === 'sold' ? S.buyoutOffer.price * S.ownership : (type === 'ipo' ? v * 1.3 * S.ownership : (type === 'timeup' ? v * S.ownership * 0.5 : 0));
  const score = Math.round(personal * (type === 'ipo' ? 1.5 : 1) + S.modelScore * 10);
  $('end-title').textContent = clean(t); $('end-sub').textContent = sub; $('end-emblem').innerHTML = coreSVG(em);
  $('end-stats').innerHTML = `
    社名：<b>${S.name}</b><br>
    期間：<b>${S.turn}四半期</b>（${dateLabel()}）<br>
    評価額：<b>${fmt(type === 'ipo' ? v * 1.3 : v)}</b>${type === 'ipo' ? '（上場時時価総額）' : ''}<br>
    あなたの資産：<b>${fmt(personal)}</b>（持株 ${(S.ownership * 100).toFixed(1)}%）<br>
    最終モデルスコア：<b>${S.modelScore.toFixed(1)}</b>／社員 <b>${headcount()}名</b><br>
    系譜：<b>${S.lineage.map(g => g.name + '（' + TRAITS[g.trait].n + '）').join(' → ')}</b><br>
    採択論文：<b>${S.papers}本</b>／研究チーム：${S.crew.map(c => c.n).join('・')}<br>
    最終順位：モデル <b>${boardRows().findIndex(r => r.me) + 1}位</b>／評価額 <b>${valRows().findIndex(r => r.me) + 1}位</b>${type === 'ipo' && S.ipoFirst === 'me' ? '（上場一番乗り）' : ''}<br>
    ${(() => { const nm = nemesis() || S.competitors.reduce((m, c) => c.heat > m.heat ? c : m); return `宿敵：<b>${nm.name}</b>（ベンチ ${nm.w}勝${nm.l}敗）<br>`; })()}
    ${S.beaten.length ? `買収したライバル：<b>${S.beaten.join('・')}</b><br>` : ''}
    スコア：<b>${score.toLocaleString()}</b>`;
  const best = +(localStorage.getItem('chappy_best') || 0);
  if (score > best) localStorage.setItem('chappy_best', score);
  $('end-screen').className = 'screen end-' + type;
  show('end-screen');
}

function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); document.body.dataset.screen = id; if ($('modal').classList.contains('hidden')) unlockScroll(); window.scrollTo(0, 0); bgWake(); }
function showBest() { const b = localStorage.getItem('chappy_best'); $('best-score').textContent = b ? `ハイスコア：${(+b).toLocaleString()}` : ''; }

/* ===== 初期化 ===== */
window.addEventListener('DOMContentLoaded', () => {
  initEmblems(); initNeuralBg();
  showBest();
  $('start-btn').onclick = () => {
    $('log').innerHTML = '';
    newGame($('company-name').value.trim() || 'チャッピーAI', $('difficulty').value);
    show('game-screen'); render();
  };
  $('howto-btn').onclick = () => openModal('遊び方', [para(`
    ・1ターン＝1四半期。毎期 <b>行動力3</b> を使ってアクションを実行し、「四半期を終える」で決算。<br>
    ・<b>採用</b>と<b>計算資源</b>で地力をつけ、<b>トレーニング</b>でモデルを鍛える。研究者には<b>個性</b>（天才肌・慎重派・職人気質・論文マシン・ムードメーカー・インフラ番長・野心家）があり、効果とセリフが変わる。<br>
    ・学習は<b>スプリントFT・継続事前学習・対抗蒸留・フロンティア学習ラン・RLHF・リファクタリング・クールダウン</b>。回し方は<b>控えめ／標準／全開</b>。<br>
    ・ラボには3つの負荷：<b>計算負荷</b>（高いと学習スループット低下・毎期よく回復）、<b>技術的負債</b>（高いと学習とプロダクト成長が鈍る・自然には抜けにくい→リファクタや次世代リリースで返済）、<b>チーム疲弊</b>（高いほど速いがミス＝学習失敗が増える）。<br>
    ・スコアが伸びたら<b>次世代モデル</b>をリリース。親の特性を<b>継承</b>して系統Lvを上げるか、<b>新系統</b>に乗り換えるか。特性で売上・ベンチ・負荷が変わる。<br>
    ・<b>論文投稿</b>：四半期ごとに ICLR→ICML→ACL→NeurIPS。注目テーマが自社モデルの特性と合うと有利。Oral・Best Paperで評判と人材、年末に年間論文ランキング。<br>
    ・スコアが上がると<b>プロダクト</b>を解禁。売上が評価額を押し上げる。<br>
    ・評価額が上がれば<b>資金調達</b>（ただし持株が希薄化。8%未満で解任）。<br>
    ・<b>ベンチマーク</b>はモデル同士のレース。調子が良く負荷が低いと勝率UP、勝つと評判UP。<b>M&A</b>で企業やライバルを買収。<br>
    ・ライバル5社は毎期<b>「次の一手」</b>を公開して動きます（調達・新製品・新モデル・引き抜き・ネガキャン・値下げ・敵対的買収・上場）。先読みして対策しよう。<br>
    ・<b>宿敵</b>は因縁がいちばん深いライバル。<b>ライバル工作</b>で引き抜き・比較広告・休戦協定を仕掛けられる。<br>
    ・資金調達・新市場・上場には<b>一番乗りレース</b>があり、先着するとボーナス。Q1〜Q4はライバルから直接攻撃されず、Q5〜Q8も攻撃は半減。<br>
    ・評価額1,000億円・年売上40億円・評判60で<b>IPO</b>に挑戦！<br>
    ・四半期ごとにAI業界の<b>速報イベント</b>が発生。判断を迫られることも。<br>
    ・最初の2年（Q1〜Q8）は<b>創業期支援</b>：採用・GPU・学習・広報・新規ローンチが割安、人件費も軽減、悪いニュースも控えめ。<br>
    ・お金が足りないときは<b>受託開発</b>（無料）で現金を稼げる。<br>
    ・資金がマイナスになると1回だけ救済、2回目は倒産（創業期はさらに1回だけ特例の救済あり）。10年（40期）で終了。`)]);
  $('end-turn-btn').onclick = endTurn;
  if ($('dock-end')) $('dock-end').onclick = endTurn;
  document.body.dataset.screen = 'title-screen';
  $('modal-close').onclick = closeModal;
  // 背景（暗い部分）をタップしても閉じる
  $('modal').onclick = (e) => { if (e.target.id === 'modal' && !modalLocked) closeModal(); };
  $('restart-btn').onclick = () => { showBest(); show('title-screen'); };
});
