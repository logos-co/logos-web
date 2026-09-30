import { base } from '$app/paths';
export const CHOICE_TIME = 9;

const V = `${base}/choices/amanda/videos/`;
export const vid = (name) => V + name + '.mp4';

export const METRICS = [
	{ key: 'anxiety', label: 'Anxiety', dir: 'up', start: 18 },
	{ key: 'sleep', label: 'Sleep quality', dir: 'down', start: 76 },
	{ key: 'image', label: 'Self-image', dir: 'down', start: 68 },
	{ key: 'isolation', label: 'Isolation', dir: 'up', start: 15 },
	{ key: 'screen', label: 'Screen time', dir: 'up', start: 38 }
];

export const SCENES = [
	{
		n: 1,
		clip: 'scene-1',
		tag: '01 · WITH FRIENDS',
		title: 'Try the filter?',
		prompt: '“It’s just a filter, Amanda. Try it…” · her friend',
		A: {
			label: 'Try the filter',
			head: 'The filter doesn’t switch off',
			clips: ['br-1a'],
			why: 'In the American Academy of Facial Plastic and Reconstructive Surgery’s annual survey, 72% of its US surgeons reported patients asking for procedures to look better in their selfies — up 15% on the year before.',
			src: 'AAFPRS · US member survey · 2019',
			hit: { image: -20, anxiety: 8, screen: 4, sleep: -2 },
			profile: 18,
			dp: 1240
		},
		B: {
			label: 'Take a normal photo',
			head: 'Even the good photo costs her',
			clips: ['br-1b'],
			why: 'Meta’s own researchers found that among US teenage girls who already felt bad about their bodies, 32% said Instagram made them feel worse. The company did not publish it.',
			src: 'Meta internal research · US Senate hearing · 2021',
			hit: { image: -12, anxiety: 5, screen: 3 },
			profile: 11,
			dp: 820
		}
	},
	{
		n: 2,
		clip: 'scene-2',
		tag: '02 · COMPARING HER LIFE',
		title: 'Keep scrolling?',
		prompt: 'The next fitness video starts on its own.',
		A: {
			label: 'Keep scrolling',
			head: 'Built to hold her there',
			clips: ['br-2a'],
			why: 'In 2026, a jury found Meta and YouTube negligent after infinite feeds, autoplay, and notifications drove a 20-year-old woman’s compulsive use and contributed to her declining mental health. She was awarded $6 million.',
			src: 'NPR · Meta & YouTube verdict · 2026',
			hit: { anxiety: 19, image: -18, sleep: -14, screen: 16, isolation: 9 },
			profile: 9,
			dp: 640
		},
		B: {
			label: 'Put the phone down',
			head: 'The gap before the next check',
			clips: ['br-2b'],
			why: 'Americans check their phones 96 times a day — once every 10 minutes.',
			src: 'Asurion · US survey of 1,998 smartphone owners · 2019',
			hit: { anxiety: 8, image: -9, sleep: -6, screen: 7, isolation: 4 },
			profile: 6,
			dp: 410
		}
	},
	{
		n: 3,
		clip: 'scene-3',
		tag: '03 · POSTING HER OPINION',
		title: 'Post it?',
		prompt: '“I mean… it’s just an opinion.” · her boyfriend',
		A: {
			label: 'Post it',
			head: 'By morning it’s a work problem',
			clips: ['br-3a'],
			why: 'In McVey v. AtlantiCare, a private employer dismissed an employee over personal Facebook comments about Black Lives Matter. Her profile identified her employer, and the court upheld the dismissal.',
			src: 'McVey v. AtlantiCare · NJ Appellate Division · 2022',
			hit: { anxiety: 11, image: -6, sleep: -5, isolation: 4 },
			profile: 16,
			dp: 1580
		},
		B: {
			label: 'Don’t post',
			head: 'She said nothing. It didn’t matter.',
			clips: ['br-3b'],
			why: 'In 2025, AP reported that facial-recognition software identified protesters from rally footage. Names and employers were circulated online, and some identified protesters were reported to US authorities for possible deportation.',
			src: 'Associated Press · 2025',
			hit: { anxiety: 15, image: -11, sleep: -7, isolation: 6 },
			profile: 20,
			dp: 1900
		}
	},
	{
		n: 4,
		clip: 'scene-4',
		tag: '04 · THE VIDEO',
		title: 'Keep chasing it?',
		prompt: '“I just want it taken down.”',
		A: {
			label: 'Keep reporting it',
			head: 'Every report changes nothing',
			clips: ['br-4a'],
			why: 'In a 2024 test, 93% of abusive Instagram comments remained visible one week after researchers reported them.',
			src: 'Center for Countering Digital Hate · 2024',
			hit: { anxiety: 21, isolation: 16, sleep: -18, image: -14, screen: 14 },
			profile: 10,
			dp: 730
		},
		B: {
			label: 'Stop chasing it',
			head: 'The button was never going to work',
			clips: ['br-4b'],
			why: 'Researchers reported 50 non-consensual images on X. The 25 reported through the platform’s own tool were still up three weeks later. The 25 reported as copyright breaches were gone within 25 hours.',
			src: 'University of Michigan · reporting audit · 2026',
			hit: { anxiety: 15, isolation: 22, sleep: -13, image: -14, screen: 5 },
			profile: 12,
			dp: 960
		}
	},
	{
		n: 5,
		clip: 'scene-5',
		tag: '05 · CHECKING HER SYMPTOMS',
		title: 'Where does she ask?',
		prompt: '“At least figure out what it could be…”',
		A: {
			label: 'Ask Alexa',
			head: 'The ad found her at home',
			clips: ['br-5a'],
			why: 'Researchers found Amazon used Alexa voice interactions to infer private interests, including health and religion, then targeted users with ads on websites and other devices.',
			src: 'Iqbal et al. · “Your Echos are Heard” · 2022',
			hit: { anxiety: 9, sleep: -6, isolation: 5, screen: 6 },
			profile: 14,
			dp: 1460
		},
		B: {
			label: 'Check on her phone',
			head: 'She typed it once. It travelled.',
			clips: ['br-5b'],
			why: 'BetterHelp paid $7.8 million after the FTC alleged it shared users’ sensitive mental-health data with Facebook, Snapchat, and other advertisers.',
			src: 'FTC · BetterHelp',
			hit: { anxiety: 12, sleep: -9, isolation: 4, screen: 11 },
			profile: 15,
			dp: 1710
		}
	}
];

export const SRC_URLS = {
	'AAFPRS · US member survey · 2019':
		'https://www.aafprs.org/Media/Press_Releases/Selfies%20Endure%20February%2027,%202020.aspx',
	'Meta internal research · US Senate hearing · 2021':
		'https://www.commerce.senate.gov/meetings/subcommittee-protecting-kids-online-facebook-instagram-and-mental-health-harms/',
	'NPR · Meta & YouTube verdict · 2026':
		'https://www.npr.org/2026/03/25/nx-s1-5746125/meta-youtube-social-media-trial-verdict',
	'Asurion · US survey of 1,998 smartphone owners · 2019':
		'https://www.asurion.com/press-releases/americans-check-their-phones-96-times-a-day/',
	'McVey v. AtlantiCare · NJ Appellate Division · 2022':
		'https://www.njcourts.gov/court-opinion/heather-j-mcvey-vs-atlanticare-medical-system-incorporated-et-al-l-3186-20-atlantic',
	'Associated Press · 2025':
		'https://www.usnews.com/news/politics/articles/2025-03-29/private-groups-work-to-identify-and-report-student-protesters-for-possible-deportation',
	'Center for Countering Digital Hate · 2024': 'https://counterhate.com/research/abusing-women-in-politics/',
	'University of Michigan · reporting audit · 2026': 'https://arxiv.org/abs/2409.12138',
	'Iqbal et al. · “Your Echos are Heard” · 2022': 'https://arxiv.org/abs/2204.10920',
	'FTC · BetterHelp':
		'https://www.ftc.gov/business-guidance/blog/2023/03/ftc-says-online-counseling-service-betterhelp-pushed-people-handing-over-health-information-broke'
};

export const FOCUS = {
	'scene-1': 49,
	'br-1a': 43,
	'br-1b': 64,
	'scene-2': 38,
	'br-2a': 41,
	'br-2b': 64,
	'scene-3': 57,
	'br-3a': 59,
	'br-3b': 53,
	'scene-4': 51,
	'br-4a': 40,
	'br-4b': 49,
	'scene-5': 32,
	'br-5a': 62,
	'br-5b': 62
};

export const ENDING_FACT = {
	text: 'US data brokers hold files on nearly every American adult — thousands of data points each. None of it was taken. All of it was handed over, one reasonable request at a time.',
	src: 'Source · Federal Trade Commission'
};

export const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));
export const severity = (m, v) => (m.dir === 'down' ? 100 - v : v);
export const bandOf = (sev) => (sev >= 72 ? 'bad' : sev >= 45 ? 'warn' : '');
