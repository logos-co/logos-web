import { base } from '$app/paths';
export const CHOICE_TIME = 9;
/* Lagos steward froze on the first question (20 Oct 2026). The first clock runs longer. */
export const FIRST_CHOICE_TIME = 13;
export const choiceTime = (i) => (i === 0 ? FIRST_CHOICE_TIME : CHOICE_TIME);

/* tonnes in the canal when Nedu starts. "cleared %" is tonnes removed over this. */
export const CANAL_T = 13000;

const V = `${base}/choices/nedu/videos/`;
export const vid = (name, ext = '.mp4') => V + name + ext;

/* dir 'down' = a fall is bad. dir 'up' = a rise is bad.
   Kept 1:1 from the original with every option's `hit`. Only `cleared` reaches the screen. */
export const METRICS = [
	{ key: 'cleared', label: 'Canal cleared', dir: 'down', start: 2 },
	{ key: 'trust', label: 'Community trust', dir: 'down', start: 84 },
	{ key: 'independence', label: 'Independence', dir: 'down', start: 92 },
	{ key: 'integrity', label: 'Clean record', dir: 'down', start: 100 },
	{ key: 'capture', label: 'Political debt', dir: 'up', start: 4 },
	{ key: 'exposure', label: 'Personal risk', dir: 'up', start: 8 }
];

/* the community fund at 41 is sized to the organisation he has built:
   8% of everything received so far, floor ₦24m. Six sites billed, two done,
   so two thirds of it never reaches a site, on either path. */
export function fund5(received) {
	const i = Math.max(24000000, Math.round((received * 0.08) / 1e6) * 1e6);
	return { in: i, out: Math.round((i * 2) / 3 / 1e6) * 1e6 };
}

export const SCENES = [
	{
		n: 1,
		age: 23,
		clip: 'scene-1',
		tag: '01 · FIRST CLEAN-UP',
		setup: 'The truck is loaded. The letter has not come. The driver will go now for ₦15,000, cash.',
		title: 'Release the second truck?',
		A: {
			label: 'Wait for approval',
			did: 'Waited for approval.',
			head: 'The canal keeps the rest',
			clips: ['br-1a'],
			why: 'Lagos requires a job placement letter before waste work can begin. The approval and the letter are two different queues.',
			src: 'Lagos State Waste Management Authority',
			money: { in: 450000, out: 0 },
			tonnes: 60,
			hit: { trust: -6, exposure: 2 }
		},
		B: {
			label: 'Pay the “tip”',
			did: 'Paid the “tip”.',
			head: 'It is never one payment',
			clips: ['br-1b'],
			why: 'Nigerians paid an estimated ₦721 billion in cash bribes in 2023. Nobody calls it a bribe. It is hospitality. Something small for lunch.',
			src: 'UNODC · Corruption in Nigeria 2024',
			money: { in: 450000, out: 15000 },
			tonnes: 140,
			cost: 'Lunch for the driver',
			hit: { trust: 4, independence: -8, integrity: -22, capture: 9, exposure: 7 }
		}
	},
	{
		n: 2,
		age: 26,
		clip: 'scene-2',
		tag: '02 · FIRST FUNDING',
		setup: 'The NGO is broke. A plastic company offers ₦48m. Its bottles are what fill the canal.',
		title: 'Take the packaging money?',
		A: {
			label: 'Reject the donor',
			did: 'Turned the donor down.',
			head: 'The teams go first',
			clips: ['br-2a'],
			why: 'Nigeria scores 26 out of 100 on the Corruption Perceptions Index, 140th of 180 countries.',
			src: 'Transparency International · CPI',
			money: { in: 0, out: 0 },
			tonnes: 20,
			hit: { trust: -9, independence: 3, exposure: 4 }
		},
		B: {
			label: 'Take their money',
			did: 'Took the packaging money.',
			head: 'The polluter buys the clean-up',
			clips: ['br-2b'],
			why: 'Nigeria makes over 2.5 million tonnes of plastic waste a year. The polluter pays the cleaner, so the cleaner cannot name the polluter.',
			src: 'Reuters · Nigeria plastic waste',
			money: { in: 48000000, out: 0 },
			tonnes: 900,
			hit: { trust: -7, independence: -19, integrity: -12, capture: 11, exposure: 3 }
		}
	},
	{
		n: 3,
		age: 30,
		clip: 'scene-3',
		tag: '03 · CITY CONTRACT',
		setup: 'A ₦310m city contract. An official wants you in with his friend’s firm. Their cut comes first.',
		title: 'Get in the car?',
		A: {
			label: 'Bid without help',
			did: 'Bid alone. Lost the contract.',
			head: 'The tender was never open',
			clips: ['br-3a'],
			why: 'Nigeria’s Public Procurement Act requires open competition. In practice, contracts go to political associates.',
			src: 'Public Procurement Act 2007',
			money: { in: 0, out: 0 },
			tonnes: 30,
			hit: { trust: -4, independence: 2, exposure: 6 }
		},
		B: {
			label: 'Partner with the connected firm',
			did: 'Partnered with the connected firm.',
			head: 'Their fee comes out first',
			clips: ['br-3b'],
			why: '78% of Nigerian households expect contractors on public contracts to divert the money.',
			src: 'UNODC · Corruption in Nigeria 2024',
			money: { in: 310000000, out: 46500000 },
			tonnes: 2400,
			cost: 'The partner’s cut',
			hit: { trust: 5, independence: -24, integrity: -19, capture: 21, exposure: 12 }
		}
	},
	{
		n: 4,
		age: 34,
		clip: 'scene-4',
		tag: '04 · NATIONAL EXPANSION',
		setup: '₦1.2bn, national. The ministry hands you the contractors. You did not pick them.',
		title: 'Sign the ministry’s list?',
		A: {
			label: 'Refuse their list',
			did: 'Refused their list. The factory went elsewhere.',
			head: 'The factory goes to someone else',
			clips: ['br-4a'],
			why: 'Former environment minister Sharon Ikeazor said most companies awarded Niger Delta clean-up contracts were owned by politicians.',
			src: 'Sharon Ikeazor · Niger Delta clean-up',
			money: { in: 0, out: 0 },
			tonnes: 25,
			hit: { trust: -3, independence: 2, capture: -2, exposure: 9 }
		},
		B: {
			label: 'Use their contractors',
			did: 'Used their contractors.',
			head: 'Twenty-one of forty-one',
			clips: ['br-4b'],
			why: 'A UN review found 21 of the 41 contractors on a Nigerian clean-up had no relevant experience. The invoices were marked paid.',
			src: 'AP · leaked UN review, Dec 2024',
			money: { in: 1200000000, out: 390000000 },
			tonnes: 4100,
			cost: 'Contractors who never came',
			hit: { trust: -14, independence: -26, integrity: -24, capture: 26, exposure: 16 }
		}
	},
	{
		n: 5,
		age: 41,
		clip: 'scene-5',
		tag: '05 · DIRECTOR',
		setup: 'You run it now. Six sites billed. Two built. The report says six.',
		title: 'Sign the report?',
		A: {
			label: 'Report the missing money',
			did: 'Reported the missing money.',
			head: 'They’ll contact you',
			clips: ['br-5a'],
			why: 'Only 8% of Nigerians who paid a bribe in 2023 reported it. Of those, 17% saw any action.',
			src: 'UNODC · Corruption in Nigeria 2024',
			money: fund5,
			tonnes: 40,
			cost: 'Four sites never built',
			filed: true,
			hit: { trust: 11, independence: 4, capture: -6, exposure: 22 }
		},
		B: {
			label: 'Stay quiet to keep access',
			did: 'Stayed quiet.',
			head: 'Now we can continue',
			/* still the September clip: SC-05-5B was never delivered. Swap the file, keep the slot. */
			clips: ['br-5b'],
			why: 'Since 1960, Nigeria has lost an estimated $400 billion to corruption. Almost none of it left in one transfer.',
			src: 'Nigeria · $400bn estimate',
			money: fund5,
			tonnes: 1700,
			cost: 'Four sites never built',
			hit: { trust: -18, independence: -12, integrity: -18, capture: 14, exposure: -9 }
		}
	}
];

/* every link checked in a real browser, 26 Oct 2026 */
export const SRC_URLS = {
	'UNODC · Corruption in Nigeria 2024': 'https://unis.unvienna.org/unis/pressrels/2024/uniscp1179.html',
	'Transparency International · CPI': 'https://www.transparency.org/en/cpi/2024/index/nga',
	'AP · leaked UN review, Dec 2024':
		'https://www.africanews.com/2024/12/25/nigeria-niger-delta-oil-spill-clean-up-total-failure-leaked-files-say/',
	'Sharon Ikeazor · Niger Delta clean-up':
		'https://www.africanews.com/2024/12/25/nigeria-niger-delta-oil-spill-clean-up-total-failure-leaked-files-say/',
	'Public Procurement Act 2007': 'https://www.bpp.gov.ng/',
	'Lagos State Waste Management Authority': 'https://lawma.gov.ng/',
	'Reuters · Nigeria plastic waste':
		'https://www.africanews.com/2024/06/26/nigeria-to-ban-single-use-plastics-from-january/',
	'Nigeria · $400bn estimate': 'https://www.chathamhouse.org/2017/05/collective-action-corruption-nigeria'
};
export const srcOf = (name) => (name ? { name, url: SRC_URLS[name] } : null);

/* one ending for every path (Jack, 26 Oct) */
export const ENDING = {
	kick: 'CORRUPTION IS UNAVOIDABLE',
	title: 'Nedu did his best.',
	fact: 'Corruption has become so ingrained, not just in Nigeria but around the world, that it has become unavoidable. Since 1960, Nigeria is estimated to have lost more than $400 billion to it. Almost none of it left in one transfer. It left the way this did. Approvals, fees and lunches, one reasonable request at a time.',
	src: 'Nigeria · $400bn estimate',
	next: 'How can you make a difference? ►'
};

export const CIRCLE = {
	title: 'No matter the choices, corruption is inevitable in Nigeria and across the world. The system is broken.',
	lead: 'Logos believes the only option is to work outside the system, within communities.',
	strong: 'Join our Circle to find out how.',
	cta: 'Find your Circle →',
	href: 'https://logos.co/movement#circles-map'
};

export const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
