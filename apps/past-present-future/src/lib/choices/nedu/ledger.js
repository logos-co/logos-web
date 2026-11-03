import { CANAL_T, METRICS, clamp } from './film.js';

const CLEARED_START = METRICS.find((m) => m.key === 'cleared').start;

export const naira = (n) => '₦' + Math.round(n).toLocaleString('en-GB');
/* compact, for the bar: ₦46.5M reads at a glance, ₦46,500,000 does not */
export function nairaShort(n) {
	if (n >= 1e9) return '₦' + (n / 1e9).toFixed(n >= 1e10 ? 0 : 2).replace(/\.?0+$/, '') + 'bn';
	if (n >= 1e6) return '₦' + (n / 1e6).toFixed(n >= 1e8 ? 0 : 1).replace(/\.0$/, '') + 'M';
	if (n >= 1e3) return '₦' + Math.round(n / 1e3) + 'k';
	return '₦' + Math.round(n);
}
/* "Lunch for the driver" → "lunch for the driver", for the middle of a sentence */
export const costText = (e) => (e.cost || '').charAt(0).toLowerCase() + (e.cost || '').slice(1);

/* the money, the tonnes and the measures across one life. a reported loss is
   still a loss, but it is on a file: the whole difference the last decision turns on. */
export function createLedger() {
	const s = { M: {}, moneyIn: 0, moneyOut: 0, reportedOut: 0, entries: [] };

	s.reset = () => {
		METRICS.forEach((m) => (s.M[m.key] = m.start));
		s.moneyIn = s.moneyOut = s.reportedOut = 0;
		s.entries = [];
	};
	s.unaccounted = () => s.moneyOut - s.reportedOut;
	s.tonnes = () => s.entries.reduce((a, e) => a + e.tonnes, 0);
	s.leakPct = () => (s.moneyIn > 0 ? Math.round((s.unaccounted() / s.moneyIn) * 100) : 0);

	s.pick = (S, which) => {
		const o = S[which];
		METRICS.forEach((m) => {
			if (o.hit?.[m.key] != null) s.M[m.key] = clamp(s.M[m.key] + o.hit[m.key]);
		});
		const mo = typeof o.money === 'function' ? o.money(s.moneyIn) : o.money || { in: 0, out: 0 };
		s.moneyIn += mo.in;
		s.moneyOut += mo.out;
		if (o.filed) s.reportedOut += mo.out;
		const e = {
			n: S.n,
			age: S.age,
			branch: which,
			label: o.label,
			did: o.did || o.label,
			src: o.src || '',
			inAmt: mo.in,
			outAmt: mo.out,
			tonnes: o.tonnes || 0,
			cost: o.cost || '',
			filed: !!o.filed
		};
		s.entries = [...s.entries, e];
		s.M.cleared = clamp(CLEARED_START + (s.tonnes() / CANAL_T) * 100);
		return e;
	};

	/* everything the statement prints, as plain data */
	s.snapshot = () => ({
		entries: s.entries,
		unaccounted: s.unaccounted(),
		moneyIn: s.moneyIn,
		leakPct: s.leakPct(),
		cleared: s.M.cleared,
		tonnes: s.tonnes()
	});

	s.reset();
	return s;
}

/* the stamp never changes. only the reason underneath it does. */
export function verdict(entries) {
	const filed = entries.some((e) => e.filed);
	return {
		stamp: 'NO FURTHER ACTION',
		stampSub: filed ? 'Report received · not pursued' : 'Insufficient evidence'
	};
}
