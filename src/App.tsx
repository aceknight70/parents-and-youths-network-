/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import pynLogoImg from './assets/images/pyn_logo_1790721509272.jpg';

interface NodeDef {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  ink: string;
  name: string;
}

interface ArrowDef {
  d: string;
  lx: number;
  ly: number;
  anchor: 'start' | 'middle' | 'end';
  label: string;
  label2?: string;
  name: string;
}

const NODES: Record<string, NodeDef> = {
  cp:   { x: 8,   y: 12,  w: 110, h: 66,  fill: '#ffbe02', ink: '#2b2100', name: 'Cohort Partners' },
  coop: { x: 132, y: 12,  w: 220, h: 66,  fill: '#00378a', ink: '#ffffff', name: 'The cooperative' },
  par:  { x: 8,   y: 170, w: 136, h: 124, fill: '#0f6fe0', ink: '#ffffff', name: 'Parents' },
  yth:  { x: 216, y: 170, w: 136, h: 124, fill: '#ff8a00', ink: '#2b1400', name: 'Youths' },
  yng:  { x: 8,   y: 392, w: 136, h: 104, fill: '#3fa21a', ink: '#ffffff', name: 'Youngsters' },
  tch:  { x: 216, y: 392, w: 136, h: 104, fill: '#ef2974', ink: '#ffffff', name: 'Teachers' }
};

const ARROWS: Record<string, ArrowDef> = {
  sol: { d: 'M216 206 L150 206', lx: 181, ly: 196, anchor: 'middle', label: 'solutions', name: 'Youths offering parents a solution' },
  vou: { d: 'M146 264 L212 264', lx: 179, ly: 254, anchor: 'middle', label: 'vouch', name: 'Parents vouching for youths' },
  gui: { d: 'M76 298 L76 388', lx: 86, ly: 346, anchor: 'start', label: 'guide', name: 'Parents guiding youngsters' },
  tea: { d: 'M214 452 L148 452', lx: 181, ly: 430, anchor: 'middle', label: 'teach and', label2: 'prepare', name: 'Teachers teaching youngsters and preparing their work' },
  wrk: { d: 'M146 394 L221 300', lx: 196, ly: 358, anchor: 'start', label: 'their work', name: "Youngsters' work for youths to make visible" }
};

const FIXED = { registration: 10000, contribution: 1000, cohorts: 2, loanPool: 0.7 };

interface SliderDef {
  g?: string;
  k: keyof SimulationState;
  label: string;
  min: number;
  max: number;
  step: number;
  f: 'num' | 'dec' | 'pct' | 'naira' | 'months' | 'jobs';
}

const SLIDERS: SliderDef[] = [
  { g: 'People', k: 'teachers', label: 'Teachers by December', min: 10, max: 200, step: 5, f: 'num' },
  { k: 'parents', label: 'Parents by December', min: 10, max: 300, step: 10, f: 'num' },
  { k: 'youths', label: 'Youths (18 to 30) by December', min: 10, max: 300, step: 10, f: 'num' },
  { k: 'perParent', label: 'Youngsters (under 18) for each parent', min: 0.5, max: 3, step: 0.5, f: 'dec' },
  { k: 'startShare', label: 'Youngsters starting a small business', min: 5, max: 100, step: 5, f: 'pct' },
  { g: 'Savings', k: 'saving', label: 'Monthly saving for each member', min: 1000, max: 20000, step: 1000, f: 'naira' },
  { k: 'payRate', label: 'Members who keep paying every month', min: 50, max: 100, step: 5, f: 'pct' },
  { k: 'months', label: 'Months of saving', min: 1, max: 12, step: 1, f: 'months' },
  { g: 'Visibility jobs', k: 'active', label: 'Youths who actually take jobs', min: 10, max: 100, step: 5, f: 'pct' },
  { k: 'jobs', label: 'Jobs each active youth does a month', min: 0.5, max: 4, step: 0.5, f: 'jobs' },
  { k: 'avgPay', label: 'Average payment for one visibility job', min: 5000, max: 100000, step: 5000, f: 'naira' },
  { g: 'Loans', k: 'loanShare', label: 'Youths who want a loan', min: 5, max: 100, step: 5, f: 'pct' },
  { k: 'loanSize', label: 'Size of one loan', min: 20000, max: 500000, step: 10000, f: 'naira' },
  { g: 'Cohort Partner', k: 'gift', label: 'Launch money', min: 100000, max: 1000000, step: 50000, f: 'naira' },
  { k: 'costPer', label: 'Cost to launch one youth builder', min: 5000, max: 30000, step: 1000, f: 'naira' }
];

const COLORS: Record<string, string> = {
  cp: '#ffbe02', coop: '#00378a', par: '#0f6fe0', yth: '#ff8a00',
  yng: '#3fa21a', tch: '#ef2974', sol: '#ff8a00', vou: '#0f6fe0',
  gui: '#3fa21a', tea: '#ef2974', wrk: '#3fa21a'
};

interface SimulationState {
  teachers: number;
  parents: number;
  youths: number;
  perParent: number;
  startShare: number;
  saving: number;
  payRate: number;
  months: number;
  active: number;
  jobs: number;
  avgPay: number;
  loanShare: number;
  loanSize: number;
  gift: number;
  costPer: number;
  cohortOn: boolean;
}

const INITIAL_STATE: SimulationState = {
  teachers: 30,
  parents: 60,
  youths: 60,
  perParent: 1,
  startShare: 30,
  saving: 5000,
  payRate: 80,
  months: 6,
  active: 50,
  jobs: 1,
  avgPay: 20000,
  loanShare: 30,
  loanSize: 100000,
  gift: 200000,
  costPer: 15000,
  cohortOn: true
};

function n0(n: number): string {
  return Math.round(n).toLocaleString('en-NG');
}

function naira(n: number): string {
  return '\u20A6' + n0(n);
}

function compact(n: number): string {
  if (n >= 1e6) return '\u20A6' + (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (n >= 1e3) return '\u20A6' + Math.round(n / 1e3) + 'k';
  return '\u20A6' + Math.round(n);
}

function fmt(k: SliderDef['f'], v: number): string {
  if (k === 'pct') return v + '%';
  if (k === 'naira') return naira(v);
  if (k === 'months') return v + (v === 1 ? ' month' : ' months');
  if (k === 'jobs') return v + ' a month';
  return String(v);
}

function center(key: string) {
  const n = NODES[key];
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 };
}

function pillSvg(text: string, fill: string, stroke: string): string {
  const w = Math.max(48, text.length * 6.8 + 16);
  return (
    '<rect x="' + (-w / 2) + '" y="-11" width="' + w + '" height="22" rx="11" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.5"/>' +
    '<text x="0" y="4" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffffff" font-family="Public Sans, system-ui, sans-serif">' + text + '</text>'
  );
}

export default function App() {
  const [S, setS] = useState<SimulationState>(INITIAL_STATE);
  const [selKey, setSelKey] = useState<string | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [jobBtnText, setJobBtnText] = useState('Play one job');
  const [loanBtnText, setLoanBtnText] = useState('Play one loan');
  const [summaryText, setSummaryText] = useState('');

  const timersRef = useRef<number[]>([]);
  const layerRef = useRef<SVGGElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);
  const cTitleRef = useRef<HTMLHeadingElement | null>(null);
  const sheetTitleRef = useRef<HTMLHeadingElement | null>(null);

  // Sync body class for card
  useEffect(() => {
    if (selKey) {
      document.body.classList.add('card-open');
    } else {
      document.body.classList.remove('card-open');
    }
  }, [selKey]);

  // Sync body class for sheet modal
  useEffect(() => {
    if (isSheetOpen) {
      document.body.classList.add('locked');
      setTimeout(() => {
        sheetTitleRef.current?.focus({ preventScroll: true });
      }, 50);
    } else {
      document.body.classList.remove('locked');
    }
  }, [isSheetOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSheetOpen) {
          setIsSheetOpen(false);
          if (lastFocusRef.current && document.contains(lastFocusRef.current)) {
            lastFocusRef.current.focus();
          }
        } else if (selKey) {
          setSelKey(null);
          if (lastFocusRef.current && document.contains(lastFocusRef.current)) {
            lastFocusRef.current.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSheetOpen, selKey]);

  const shares = useCallback(() => {
    const sh = { youth: 65, mentor: 15, coop: 15, cp: 5 };
    if (!S.cohortOn) {
      sh.coop += sh.cp;
      sh.cp = 0;
    }
    return sh;
  }, [S.cohortOn]);

  const calc = useCallback(() => {
    const sh = shares();
    const members = S.teachers + S.parents + S.youths;
    const youngsters = Math.round(S.parents * S.perParent);
    const starting = Math.round(youngsters * S.startShare / 100);
    const offering = S.youths * S.active / 100;
    const jobsM = offering * S.jobs;
    const payM = jobsM * S.avgPay;
    const served = Math.min(S.parents, Math.round(jobsM));
    const saved = members * S.saving * (S.payRate / 100) * S.months;
    const loanPool = saved * FIXED.loanPool;
    const contribM = members * FIXED.contribution * (S.payRate / 100);
    const regTotal = members * FIXED.registration;
    const coopM = contribM + payM * sh.coop / 100;
    const wanters = Math.round(S.youths * S.loanShare / 100);
    const loanTotal = wanters * S.loanSize;
    const canFund = Math.floor(loanPool / S.loanSize);
    const launched = Math.floor(S.gift / S.costPer);
    const cohortPay = launched * (S.active / 100) * S.jobs * S.avgPay;
    const cpMonth = cohortPay * sh.cp / 100;
    const one = {
      youth: S.avgPay * sh.youth / 100,
      mentor: S.avgPay * sh.mentor / 100,
      coop: S.avgPay * sh.coop / 100,
      cp: S.avgPay * sh.cp / 100
    };
    return {
      sh, members, youngsters, starting, offering, jobsM, payM,
      served, saved, loanPool, contribM, regTotal, coopM,
      wanters, loanTotal, canFund, launched, cpMonth, one
    };
  }, [S, shares]);

  const c = useMemo(() => calc(), [calc]);

  const clearPlay = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (layerRef.current) {
      layerRef.current.innerHTML = '';
    }
    const hits = document.querySelectorAll('.nd.hit');
    hits.forEach(el => el.classList.remove('hit'));
    setSummaryText('');
  }, []);

  const wait = useCallback((ms: number) => {
    return new Promise<void>((r) => {
      const id = window.setTimeout(r, ms);
      timersRef.current.push(id);
    });
  }, []);

  const badge = useCallback((key: string, text: string) => {
    const n = NODES[key];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('transform', 'translate(' + (n.x + n.w - 6) + ' ' + Math.max(11, n.y) + ')');
    const w = Math.max(48, text.length * 6.8 + 16);
    g.innerHTML = '<g transform="translate(' + (-w / 2 + 4) + ' 0)">' + pillSvg(text, '#1a1b2e', '#ffffff') + '</g>';
    if (layerRef.current) {
      layerRef.current.appendChild(g);
    }
    const node = document.querySelector('.nd[data-key="' + key + '"]');
    if (node) node.classList.add('hit');
  }, []);

  const fly = useCallback((fromKey: string, toKey: string, text: string, ms: number) => {
    return new Promise<void>((resolve) => {
      const a = center(fromKey);
      const b = center(toKey);
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.innerHTML = pillSvg(text, '#1a1b2e', '#ffc629');
      if (layerRef.current) {
        layerRef.current.appendChild(g);
      }
      let t0: number | null = null;
      function step(t: number) {
        if (t0 === null) t0 = t;
        const p = Math.min(1, (t - t0) / ms);
        const e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        g.setAttribute('transform', 'translate(' + (a.x + (b.x - a.x) * e) + ' ' + (a.y + (b.y - a.y) * e) + ')');
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          g.remove();
          resolve();
        }
      }
      requestAnimationFrame(step);
    });
  }, []);

  const reduced = useCallback(() => {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const jobSummary = useCallback((currentC: ReturnType<typeof calc>) => {
    return (
      'A parent pays ' + naira(S.avgPay) + ' for a visibility job, and the work is confirmed delivered. The youth receives ' +
      naira(currentC.one.youth) + ', the teacher who prepared the work ' + naira(currentC.one.mentor) +
      ', the cooperative ' + naira(currentC.one.coop) + (currentC.sh.cp ? ', and the Cohort Partner ' + naira(currentC.one.cp) : '') +
      '. The parent keeps the job as evidence for their own loan.'
    );
  }, [S.avgPay]);

  const handlePlayJob = useCallback(() => {
    if (playing) return;
    setPlaying(true);
    clearPlay();
    const currentC = calc();
    const targets: [string, number][] = [
      ['yth', currentC.one.youth],
      ['tch', currentC.one.mentor],
      ['coop', currentC.one.coop]
    ];
    if (currentC.sh.cp) {
      targets.push(['cp', currentC.one.cp]);
    }

    const finish = () => {
      setSummaryText(jobSummary(currentC));
      setJobBtnText('Play again');
      setPlaying(false);
    };

    if (reduced()) {
      targets.forEach(t => badge(t[0], '+' + naira(t[1])));
      finish();
      return;
    }

    fly('par', 'yth', naira(S.avgPay) + ' paid', 1100).then(() => {
      badge('yth', '+' + naira(currentC.one.youth));
      return Promise.all(
        targets.slice(1).map((t, i) =>
          wait(i * 140).then(() => fly('yth', t[0], naira(t[1]), 900).then(() => badge(t[0], '+' + naira(t[1]))))
        )
      );
    }).then(finish, finish);
  }, [playing, clearPlay, calc, jobSummary, reduced, badge, fly, S.avgPay, wait]);

  const loanSummary = useCallback((currentC: ReturnType<typeof calc>) => {
    return (
      'A youth needs a loan. A parent who knows the youth vouches for them. The cooperative lends ' + naira(S.loanSize) +
      ' from its loan pool, and the youth repays it over time. The pool can fund about ' + n0(currentC.canFund) +
      ' loans of this size today.'
    );
  }, [S.loanSize]);

  const handlePlayLoan = useCallback(() => {
    if (playing) return;
    setPlaying(true);
    clearPlay();
    const currentC = calc();

    const finish = () => {
      setSummaryText(loanSummary(currentC));
      setLoanBtnText('Play again');
      setPlaying(false);
    };

    if (reduced()) {
      badge('par', 'vouches');
      badge('yth', '+' + naira(S.loanSize));
      finish();
      return;
    }

    fly('par', 'coop', 'vouches', 1000).then(() => {
      badge('par', 'vouches');
      return fly('coop', 'yth', naira(S.loanSize) + ' loan', 1100);
    }).then(() => {
      badge('yth', '+' + naira(S.loanSize));
    }).then(finish, finish);
  }, [playing, clearPlay, calc, loanSummary, reduced, badge, fly, S.loanSize]);

  const pick = useCallback((k: string, el?: HTMLElement | SVGElement | null) => {
    if (el) lastFocusRef.current = el as HTMLElement;
    setSelKey(k);
    setTimeout(() => {
      cTitleRef.current?.focus({ preventScroll: true });
    }, 50);
  }, []);

  const closeCard = useCallback(() => {
    setSelKey(null);
    if (lastFocusRef.current && document.contains(lastFocusRef.current)) {
      lastFocusRef.current.focus();
    }
  }, []);

  const openSheetModal = useCallback(() => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setIsSheetOpen(true);
  }, []);

  const closeSheetModal = useCallback(() => {
    setIsSheetOpen(false);
    if (lastFocusRef.current && document.contains(lastFocusRef.current)) {
      lastFocusRef.current.focus();
    }
  }, []);

  const handleSliderChange = useCallback((k: keyof SimulationState, val: number | boolean) => {
    setS(prev => ({ ...prev, [k]: val }));
    if (!playing) clearPlay();
  }, [playing, clearPlay]);

  // Card detail data
  const cardData = useMemo(() => {
    if (!selKey) return null;
    const sh = c.sh;
    const R = (a: string, b: string, cls = ''): [string, string, string] => [a, b, cls];

    if (selKey === 'par') {
      return {
        t: 'Parents',
        s: 'Run businesses, guide their youngsters, and vouch for youths',
        rows: [
          R('Parents', n0(S.parents)),
          R('Youngsters they guide', n0(c.youngsters)),
          R('Youths they can vouch for', n0(c.wanters)),
          R('Each saves a month', naira(S.saving))
        ],
        note: "Parents pay youths for visibility work that helps their businesses grow. A completed job also becomes evidence for the parent's own loan."
      };
    }
    if (selKey === 'yth') {
      return {
        t: 'Youths',
        s: 'Aged 18 to 30. Make the work of parents and youngsters visible',
        rows: [
          R('Youths', n0(S.youths)),
          R('Offering a solution right now', n0(c.offering)),
          R('Jobs a month', n0(c.jobsM)),
          R('Each active youth earns a month', naira(S.jobs * S.avgPay * sh.youth / 100)),
          R('Want a loan', n0(c.wanters))
        ],
        note: 'Visibility work only, for example content, pages and campaigns that help work and businesses be seen.'
      };
    }
    if (selKey === 'yng') {
      return {
        t: 'Youngsters',
        s: 'Under 18. Taught by teachers, guided by parents, starting something small',
        rows: [
          R('Youngsters', n0(c.youngsters)),
          R('Taught by', n0(S.teachers) + ' teachers'),
          R('Starting a small business', n0(c.starting)),
          R('Guided by', 'their parents')
        ],
        note: 'Their teachers prepare their work so a youth can make it visible. A parent or guardian acts for a youngster, and any business belongs to the youngster.'
      };
    }
    if (selKey === 'tch') {
      return {
        t: 'Teachers',
        s: 'Teach the youngsters and prepare their work',
        rows: [
          R('Teachers', n0(S.teachers)),
          R('Youngsters for each teacher', (c.youngsters / Math.max(1, S.teachers)).toFixed(1)),
          R('Each pays a month', naira(S.saving + FIXED.contribution)),
          R('Share of a paid visibility job', sh.mentor + '%'),
          R('Each teacher earns a month', naira(c.payM * sh.mentor / 100 / Math.max(1, S.teachers)))
        ],
        note: 'The share is a proposal. A teacher is paid only when a parent has paid and the work is confirmed delivered, never for recruiting. Youths have no teachers here: the teachers are for the youngsters.'
      };
    }
    if (selKey === 'coop') {
      return {
        t: 'The cooperative',
        s: 'Holds the savings, the loan pool and the fund',
        rows: [
          R('Members', n0(c.members)),
          R('Savings held', naira(c.saved)),
          R('Loan pool (70% of savings)', naira(c.loanPool)),
          R('Registration fees in all', naira(c.regTotal)),
          R('Income a month, excluding registration', naira(c.coopM))
        ],
        note: "How fees and savings can be used depends on the bye-laws. Members' savings are separate from the cooperative's income."
      };
    }
    if (selKey === 'cp') {
      const pct = S.gift ? (c.cpMonth * 12 / S.gift) * 100 : 0;
      const need = sh.cp ? S.gift / (sh.cp / 100) : 0;
      return {
        t: 'Cohort Partners',
        s: 'Fund the launch of a cohort of youth builders and work hand in hand with the cooperative',
        rows: [
          R('Launch money', naira(S.gift)),
          R('Youth builders launched', n0(c.launched)),
          R('Earned a month from that cohort', sh.cp ? naira(c.cpMonth) : 'share switched off'),
          R('Comes back in 12 months', sh.cp ? pct.toFixed(1) + '%' : 'not applicable', 'warn'),
          R('Payments to the cohort needed to recover it all', need ? naira(need) : 'not possible')
        ],
        note: 'Only paid and confirmed jobs count. This suits someone who also values the impact. It is not a promise of repayment.'
      };
    }
    if (selKey === 'sol') {
      return {
        t: 'Youths offering parents a solution',
        s: "Visibility and support for a parent's business",
        rows: [
          R('Youths offering a solution', n0(c.offering)),
          R('Parents being served', n0(c.served)),
          R('Jobs a month', n0(c.jobsM)),
          R('Paid for visibility work a month', naira(c.payM)),
          R('Average job', naira(S.avgPay))
        ],
        note: 'Each job is paid by the parent once the work is delivered.'
      };
    }
    if (selKey === 'vou') {
      return {
        t: 'Parents vouching for youths',
        s: 'A parent who knows the youth stands behind a loan',
        rows: [
          R('Youths who want a loan', n0(c.wanters)),
          R('Loans a parent vouches for', n0(c.wanters)),
          R('Total asked for', naira(c.loanTotal)),
          R('Loan pool', naira(c.loanPool)),
          R('Loans the pool can fund', n0(c.canFund), c.canFund < c.wanters ? 'warn' : '')
        ],
        note: 'Youths often need a loan and find it hard to get a guarantor. A parent who knows the terrain can vouch. If the pool is smaller than the demand, some youths wait.'
      };
    }
    if (selKey === 'gui') {
      return {
        t: 'Parents guiding youngsters',
        s: 'Helping them start something small',
        rows: [
          R('Youngsters', n0(c.youngsters)),
          R('Starting a small business', n0(c.starting)),
          R('Youngsters for each parent', String(S.perParent))
        ],
        note: 'The business belongs to the youngster.'
      };
    }
    if (selKey === 'tea') {
      return {
        t: 'Teachers teaching youngsters',
        s: "Teachers prepare the youngsters' work so there is something tangible to show",
        rows: [
          R('Teachers', n0(S.teachers)),
          R('Youngsters', n0(c.youngsters)),
          R('Youngsters for each teacher', (c.youngsters / Math.max(1, S.teachers)).toFixed(1)),
          R('Youngsters with work being prepared', n0(c.starting))
        ],
        note: "The better the youngsters' work is prepared, the more the youths have to make visible."
      };
    }
    if (selKey === 'wrk') {
      return {
        t: "The youngsters' work for youths to make visible",
        s: 'Something tangible for a youth to show the world',
        rows: [
          R('Youngsters with work ready', n0(c.starting)),
          R('Youths offering visibility', n0(c.offering)),
          R('Jobs a month', n0(c.jobsM)),
          R('Paid for visibility work a month', naira(c.payM))
        ],
        note: "Youths make this work visible, and also the parents' own businesses. Each job is paid once the work is delivered."
      };
    }
    return null;
  }, [selKey, c, S]);

  return (
    <div className="wrap">
      <header className="top">
        <div className="brand">
          {/* LOGO: put the uploaded PYN logo image here, 76 by 76 pixels, rounded corners, alt text "Parents and Youth Network logo" */}
          <img
            src={pynLogoImg}
            width="76"
            height="76"
            alt="Parents and Youth Network logo"
            onError={(e) => {
              // Graceful fallback if image has load error
              e.currentTarget.style.display = 'none';
            }}
          />
          <div>
            <h1>Parents and Youth Network</h1>
            <p className="lede">Who does what for whom. Tap any group or arrow to see who is involved and the numbers.</p>
          </div>
        </div>
        <div className="actions">
          <button
            className="btn job"
            type="button"
            id="playJob"
            disabled={playing}
            onClick={handlePlayJob}
          >
            {jobBtnText}
          </button>
          <button
            className="btn loan"
            type="button"
            id="playLoan"
            disabled={playing}
            onClick={handlePlayLoan}
          >
            {loanBtnText}
          </button>
          <button
            className="ghost"
            type="button"
            id="openSheet"
            onClick={openSheetModal}
          >
            Change the numbers
          </button>
        </div>
        {summaryText && (
          <p className="summary" id="summary" aria-live="polite">
            {summaryText}
          </p>
        )}
      </header>

      <div className="map">
        <svg
          className="net"
          id="net"
          viewBox="0 0 360 516"
          role="group"
          aria-label="Map of the Parents and Youth Network"
        >
          <defs>
            <marker
              id="ah"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path
                d="M2 1L8 5L2 9"
                fill="none"
                stroke="context-stroke"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </marker>
          </defs>

          {/* Background linking lines */}
          <path className="lk" d="M160 80 L76 168" />
          <path className="lk" d="M322 80 L284 168" />
          <text className="lknote" x="218" y="128" textAnchor="middle">
            savings and loans
          </text>
          <line x1="118" y1="45" x2="132" y2="45" stroke="var(--ink)" strokeWidth="3" />

          {/* Node: Cohort Partners */}
          <g
            className={`nd ${selKey === 'cp' ? 'on' : ''}`}
            data-key="cp"
            role="button"
            tabIndex={0}
            aria-label={NODES.cp.name}
            onClick={(e) => pick('cp', e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pick('cp', e.currentTarget);
              }
            }}
          >
            <rect x={NODES.cp.x} y={NODES.cp.y} width={NODES.cp.w} height={NODES.cp.h} rx="14" fill={NODES.cp.fill} />
            <text x={NODES.cp.x + 12} y={NODES.cp.y + 24} fontSize="14" fontWeight="700" fill={NODES.cp.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {NODES.cp.name}
            </text>
            <text x={NODES.cp.x + 12} y={NODES.cp.y + 46} fontSize="11.5" fontWeight="400" fill={NODES.cp.ink} fontFamily="Public Sans, system-ui, sans-serif">
              {FIXED.cohorts + ' partners'}
            </text>
            <text x={NODES.cp.x + 12} y={NODES.cp.y + 61} fontSize="11.5" fontWeight="400" fill={NODES.cp.ink} fontFamily="Public Sans, system-ui, sans-serif">
              fund the launch
            </text>
          </g>

          {/* Node: The cooperative */}
          <g
            className={`nd ${selKey === 'coop' ? 'on' : ''}`}
            data-key="coop"
            role="button"
            tabIndex={0}
            aria-label={NODES.coop.name}
            onClick={(e) => pick('coop', e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pick('coop', e.currentTarget);
              }
            }}
          >
            <rect x={NODES.coop.x} y={NODES.coop.y} width={NODES.coop.w} height={NODES.coop.h} rx="14" fill={NODES.coop.fill} />
            <text x={NODES.coop.x + 12} y={NODES.coop.y + 24} fontSize="14" fontWeight="700" fill={NODES.coop.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {NODES.coop.name}
            </text>
            <text x={NODES.coop.x + 12} y={NODES.coop.y + 46} fontSize="11.5" fontWeight="400" fill={NODES.coop.ink} fontFamily="Public Sans, system-ui, sans-serif">
              {compact(c.saved) + ' saved. Loan pool ' + compact(c.loanPool)}
            </text>
            <text x={NODES.coop.x + 12} y={NODES.coop.y + 61} fontSize="11.5" fontWeight="400" fill={NODES.coop.ink} fontFamily="Public Sans, system-ui, sans-serif">
              holds savings and loans
            </text>
          </g>

          {/* Node: Parents */}
          <g
            className={`nd ${selKey === 'par' ? 'on' : ''}`}
            data-key="par"
            role="button"
            tabIndex={0}
            aria-label={NODES.par.name}
            onClick={(e) => pick('par', e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pick('par', e.currentTarget);
              }
            }}
          >
            <rect x={NODES.par.x} y={NODES.par.y} width={NODES.par.w} height={NODES.par.h} rx="14" fill={NODES.par.fill} />
            <text x={NODES.par.x + 12} y={NODES.par.y + 24} fontSize="14" fontWeight="700" fill={NODES.par.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {NODES.par.name}
            </text>
            <text x={NODES.par.x + 12} y={NODES.par.y + 54} fontSize="24" fontWeight="700" fill={NODES.par.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {n0(S.parents)}
            </text>
            <text x={NODES.par.x + 12} y={NODES.par.y + 74} fontSize="11.5" fontWeight="400" fill={NODES.par.ink} fontFamily="Public Sans, system-ui, sans-serif">
              run businesses,
            </text>
            <text x={NODES.par.x + 12} y={NODES.par.y + 89} fontSize="11.5" fontWeight="400" fill={NODES.par.ink} fontFamily="Public Sans, system-ui, sans-serif">
              vouch for youths
            </text>
          </g>

          {/* Node: Youths */}
          <g
            className={`nd ${selKey === 'yth' ? 'on' : ''}`}
            data-key="yth"
            role="button"
            tabIndex={0}
            aria-label={NODES.yth.name}
            onClick={(e) => pick('yth', e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pick('yth', e.currentTarget);
              }
            }}
          >
            <rect x={NODES.yth.x} y={NODES.yth.y} width={NODES.yth.w} height={NODES.yth.h} rx="14" fill={NODES.yth.fill} />
            <text x={NODES.yth.x + 12} y={NODES.yth.y + 24} fontSize="14" fontWeight="700" fill={NODES.yth.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {NODES.yth.name}
            </text>
            <text x={NODES.yth.x + 12} y={NODES.yth.y + 54} fontSize="24" fontWeight="700" fill={NODES.yth.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {n0(S.youths)}
            </text>
            <text x={NODES.yth.x + 12} y={NODES.yth.y + 74} fontSize="11.5" fontWeight="400" fill={NODES.yth.ink} fontFamily="Public Sans, system-ui, sans-serif">
              aged 18 to 30
            </text>
            <text x={NODES.yth.x + 12} y={NODES.yth.y + 89} fontSize="11.5" fontWeight="400" fill={NODES.yth.ink} fontFamily="Public Sans, system-ui, sans-serif">
              make work visible
            </text>
            <text x={NODES.yth.x + 12} y={NODES.yth.y + 104} fontSize="11.5" fontWeight="400" fill={NODES.yth.ink} fontFamily="Public Sans, system-ui, sans-serif">
              for parents
            </text>
          </g>

          {/* Node: Youngsters */}
          <g
            className={`nd ${selKey === 'yng' ? 'on' : ''}`}
            data-key="yng"
            role="button"
            tabIndex={0}
            aria-label={NODES.yng.name}
            onClick={(e) => pick('yng', e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pick('yng', e.currentTarget);
              }
            }}
          >
            <rect x={NODES.yng.x} y={NODES.yng.y} width={NODES.yng.w} height={NODES.yng.h} rx="14" fill={NODES.yng.fill} />
            <text x={NODES.yng.x + 12} y={NODES.yng.y + 24} fontSize="14" fontWeight="700" fill={NODES.yng.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {NODES.yng.name}
            </text>
            <text x={NODES.yng.x + 12} y={NODES.yng.y + 54} fontSize="24" fontWeight="700" fill={NODES.yng.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {n0(c.youngsters)}
            </text>
            <text x={NODES.yng.x + 12} y={NODES.yng.y + 74} fontSize="11.5" fontWeight="400" fill={NODES.yng.ink} fontFamily="Public Sans, system-ui, sans-serif">
              under 18, taught,
            </text>
            <text x={NODES.yng.x + 12} y={NODES.yng.y + 89} fontSize="11.5" fontWeight="400" fill={NODES.yng.ink} fontFamily="Public Sans, system-ui, sans-serif">
              start small things
            </text>
          </g>

          {/* Node: Teachers */}
          <g
            className={`nd ${selKey === 'tch' ? 'on' : ''}`}
            data-key="tch"
            role="button"
            tabIndex={0}
            aria-label={NODES.tch.name}
            onClick={(e) => pick('tch', e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                pick('tch', e.currentTarget);
              }
            }}
          >
            <rect x={NODES.tch.x} y={NODES.tch.y} width={NODES.tch.w} height={NODES.tch.h} rx="14" fill={NODES.tch.fill} />
            <text x={NODES.tch.x + 12} y={NODES.tch.y + 24} fontSize="14" fontWeight="700" fill={NODES.tch.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {NODES.tch.name}
            </text>
            <text x={NODES.tch.x + 12} y={NODES.tch.y + 54} fontSize="24" fontWeight="700" fill={NODES.tch.ink} style={{ fontFamily: 'Bricolage Grotesque, system-ui, sans-serif' }}>
              {n0(S.teachers)}
            </text>
            <text x={NODES.tch.x + 12} y={NODES.tch.y + 74} fontSize="11.5" fontWeight="400" fill={NODES.tch.ink} fontFamily="Public Sans, system-ui, sans-serif">
              teach youngsters,
            </text>
            <text x={NODES.tch.x + 12} y={NODES.tch.y + 89} fontSize="11.5" fontWeight="400" fill={NODES.tch.ink} fontFamily="Public Sans, system-ui, sans-serif">
              prepare their work
            </text>
          </g>

          {/* Arrows */}
          {Object.entries(ARROWS).map(([key, a]) => (
            <g
              key={key}
              className={`ar ${selKey === key ? 'on' : ''}`}
              data-key={key}
              role="button"
              tabIndex={0}
              aria-label={a.name}
              onClick={(e) => pick(key, e.currentTarget)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  pick(key, e.currentTarget);
                }
              }}
            >
              <path className="hitline" d={a.d} />
              <path className="shaft" d={a.d} markerEnd="url(#ah)" />
              <text x={a.lx} y={a.ly} textAnchor={a.anchor}>
                {a.label}
              </text>
              {a.label2 && (
                <text x={a.lx} y={a.ly + 13} textAnchor={a.anchor}>
                  {a.label2}
                </text>
              )}
            </g>
          ))}

          {/* Dynamic Animation Layer */}
          <g id="layer" ref={layerRef}></g>
        </svg>
      </div>

      <p className="hint">
        Teachers teach the youngsters and prepare their work. Youths make that work, and the parents' businesses, visible. Parents guide their youngsters and vouch for youths who need a loan. The cooperative holds the savings and the loan pool.
      </p>

      <footer>
        <p>
          An illustration with numbers you can change, not a promise of returns. Nobody is paid until a parent or teacher has paid and the work is confirmed delivered, and nobody earns for signing people up. Fees, savings, loans and shares depend on the cooperative's bye-laws and the registrar.
        </p>
      </footer>

      {/* Reading detail card */}
      <aside
        className="card"
        id="card"
        hidden={!selKey || !cardData}
        aria-label="Details"
        style={{ '--cc': selKey ? (COLORS[selKey] || '#1f6fdb') : '#1f6fdb' } as React.CSSProperties}
      >
        {cardData && (
          <div className="in">
            <div className="ph">
              <div>
                <h3 id="cTitle" ref={cTitleRef} tabIndex={-1}>
                  {cardData.t}
                </h3>
                <p id="cSub">{cardData.s}</p>
              </div>
              <button className="close" type="button" id="cClose" onClick={closeCard}>
                Close
              </button>
            </div>
            <ul className="rows" id="cRows">
              {cardData.rows.map((row, idx) => (
                <li key={idx} className={row[2] || undefined}>
                  <span>{row[0]}</span>
                  <span>{row[1]}</span>
                </li>
              ))}
            </ul>
            {cardData.note && <p className="fine" id="cNote">{cardData.note}</p>}
          </div>
        )}
      </aside>

      {/* Scrim backdrop */}
      <div className="scrim" id="scrim" hidden={!isSheetOpen} onClick={closeSheetModal}></div>

      {/* Numbers Sheet */}
      <section
        className="sheet"
        id="sheet"
        hidden={!isSheetOpen}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheetTitle"
      >
        <div className="in">
          <div className="ph">
            <h3 id="sheetTitle" ref={sheetTitleRef} tabIndex={-1}>
              Change the numbers
            </h3>
            <button className="close" type="button" id="sheetClose" onClick={closeSheetModal}>
              Done
            </button>
          </div>
          <div id="sheetBody">
            {SLIDERS.map((slider) => (
              <React.Fragment key={slider.k}>
                {slider.g && <h4>{slider.g}</h4>}
                <div className="ctl">
                  <div className="head">
                    <label htmlFor={`s_${slider.k}`}>{slider.label}</label>
                    <output id={`o_${slider.k}`}>{fmt(slider.f, S[slider.k] as number)}</output>
                  </div>
                  <input
                    type="range"
                    id={`s_${slider.k}`}
                    data-key={slider.k}
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    value={S[slider.k] as number}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      handleSliderChange(slider.k, isNaN(v) ? 0 : v);
                    }}
                  />
                </div>
              </React.Fragment>
            ))}
            <div className="tick">
              <input
                type="checkbox"
                id="s_cohortOn"
                data-key="cohortOn"
                checked={S.cohortOn}
                onChange={(e) => handleSliderChange('cohortOn', e.target.checked)}
              />
              <label htmlFor="s_cohortOn">A Cohort Partner funded the cohort (takes 5% of each job)</label>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
