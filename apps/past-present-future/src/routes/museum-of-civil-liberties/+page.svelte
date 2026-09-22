<script>
	import { onMount, tick, flushSync } from "svelte";
	import { SvelteSet } from "svelte/reactivity";
	import WallModal from "$lib/components/WallModal.svelte";

	const WINGS = {
		d: {
			num: "I",
			name: "The Control of Money Exhibition",
			line: "Governments borrow. Citizens pay.",
			blurb: "When states can no longer afford their debts, they erode the people’s wealth. This exhibition looks at what nations across the globe have done to afford their own spending.",
		},
		s: {
			num: "II",
			name: "The Surveillance State Exhibition",
			line: "Security: The ultimate excuse to expand surveillance",
			blurb: "Governments have built systems capable of collecting, searching, and unlocking private communications. This exhibition examines how powers introduced for exceptional threats expanded into the surveillance of ordinary life.",
		},
		g: {
			num: "III",
			name: "The Censored World Exhibition",
			line: "Controlling speech and knowledge",
			blurb: "When governments and platforms control information, they limit what people can access, share, and know. This exhibition examines how communication is restricted, knowledge is suppressed, and those who challenge these boundaries are punished.",
		},
		c: {
			num: "IV",
			name: "The Failure of Voice Exhibition",
			line: "How protesting against stagnation and corruption rarely results in change",
			blurb: "When civil liberties are infringed, people take to the streets to voice their outrage. This exhibition examines how protest is an understandable response to corruption and stagnation, but rarely leads to meaningful change and often results in incarceration and lives lost.",
		},
		i: {
			num: "V",
			name: "The Systems of Control Exhibition",
			line: "Turning personal data into control",
			blurb: "Governments, platforms and financial institutions collect information about ordinary people, then use it to influence their decisions, restrict their choices and control their access to essential systems. This exhibition examines how personal data becomes institutional power.",
		},
	};
	const WING_ORDER = ["d", "s", "g", "c", "i"];
	const CAT_LABEL = {
		d: "The Control of Money",
		s: "The Surveillance State",
		g: "The Censored World",
		c: "The Failure to be Heard",
		i: "The Systems of Control",
	};

	
	const EVENTS = [
		
		{
			y: 2022,
			c: "d",
			status: "lost",
			label: "Disconnected",
			m: "unplug",
			title: "The Russian SWIFT Exclusions",
			t: "European sanctions disconnected seven Russian banks from SWIFT, making international transfers, overseas payments, and access to money abroad harder for ordinary Russians.",
			src: "Council Regulation (EU) 2022/345. 1 March 2022.",
		},
		{
			y: 2016,
			c: "d",
			status: "lost",
			label: "Invalidated",
			m: "percent",
			title: "India’s Demonetisation",
			t: 'India invalidated its 500 and 1,000 rupee notes with four hours’ notice. In a single night, <span class="num">86%</span> of the country’s cash lost its legal status.',
			src: "Government of India Gazette Notification S.O. 3407(E). 8 November 2016.",
		},
		{
			y: 2013,
			c: "d",
			status: "lost",
			label: "Converted",
			m: "ratio",
			title: "The Cyprus Bank Bail-In",
			t: 'Cyprus used uninsured deposits to rescue failing banks. At the Bank of Cyprus, <span class="num">47.5%</span> of deposits above €100,000 were converted into shares.',
			src: "Central Bank of Cyprus, Bank of Cyprus Resolution Decrees. March to July 2013.",
		},
		{
			y: 2001,
			c: "d",
			status: "lost",
			label: "Restricted",
			m: "cage",
			title: "Argentina’s Corralito",
			t: "Argentina limited bank withdrawals to 250 pesos a week, then equal to US$250. People still owned their savings, but the state controlled access to them.",
			src: "Argentine Executive Decree 1570/2001. 1 December 2001.",
		},
		{
			y: 1933,
			c: "d",
			status: "lost",
			label: "Confiscated",
			m: "gavel",
			title: "The American Gold Confiscation",
			t: "The United States ordered citizens to surrender most privately held gold. Refusal could bring a $10,000 fine and ten years in prison.",
			src: "United States Executive Order 6102. 5 April 1933.",
		},

		
		{
			y: 2022,
			c: "s",
			status: "lost",
			label: "Proposed",
			m: "envelope",
			title: "The EU “Chat Control” Proposal",
			t: "The EU proposed scanning private messaging services for abusive material, raising concerns about the privacy of encrypted conversations.",
			src: "European Commission Proposal COM(2022) 209 final. 11 May 2022.",
		},
		{
			y: 2016,
			c: "s",
			status: "lost",
			label: "Consolidated",
			m: "wire",
			title: "The Investigatory Powers Act",
			t: "Britain consolidated interception, device hacking, and bulk data collection powers, making surveillance of private communications a permanent legal capability.",
			src: "United Kingdom Investigatory Powers Act 2016. 29 November 2016.",
		},
		{
			y: 2016,
			c: "s",
			status: "lost",
			label: "Contested",
			m: "phone",
			title: "The Apple–FBI Encryption Dispute",
			t: "The FBI demanded software to unlock an iPhone. Apple warned that any encryption backdoor could never remain safely contained.",
			src: "Order Compelling Apple, Inc. to Assist Agents in Search. 16 February 2016.",
		},
		{
			y: 2013,
			c: "s",
			status: "lost",
			label: "Revealed",
			m: "eye",
			title: "The Snowden Revelations",
			t: "Snowden revealed surveillance across global communications networks, showing how private digital life had become accessible to intelligence agencies.",
			src: "National Security Agency, PRISM/US-984XN Overview presentation. April 2013.",
		},
		{
			y: 1993,
			c: "s",
			status: "lost",
			label: "Escrowed",
			m: "door",
			title: "The Clipper Chip",
			t: "The Clipper Chip placed encryption keys in government escrow, allowing authorities to unlock private conversations with legal approval.",
			src: "White House Statement on the Clipper Chip Initiative. 16 April 1993.",
		},

		
		{
			y: 2021,
			c: "g",
			status: "lost",
			label: "Blocked",
			m: "unplug",
			title: "The Myanmar Internet Shutdown",
			t: "After seizing power, Myanmar’s military ordered mobile operators to shut down data networks and block major social media platforms.",
			src: "Ministry of Transport and Communications Network Directive. 6 February 2021.",
		},
		{
			y: 2020,
			c: "g",
			status: "lost",
			label: "Criminalised",
			m: "book",
			title: "The Hong Kong National Security Law",
			t: "Hong Kong criminalised broadly defined acts of secession, subversion, and collusion. Publications disappeared and political expression became grounds for arrest.",
			src: "Hong Kong Government Gazette, Government Notice 72 of 2020. 30 June 2020.",
		},
		{
			y: 2020,
			c: "g",
			status: "lost",
			label: "Removed",
			m: "feedstack",
			title: "The COVID-19 Moderation Policies",
			t: "Platforms removed claims that contradicted public health guidance, making private companies powerful arbiters of acceptable medical discussion.",
			src: "YouTube COVID-19 Medical Misinformation Policy. 2020.",
		},
		{
			y: 2019,
			c: "g",
			status: "lost",
			label: "Cut off",
			m: "wire",
			title: "The Kashmir Communications Blackout",
			t: "India disconnected telephone and internet services as it revoked Kashmir’s autonomy, leaving millions without ordinary access to communication or news.",
			src: "Jammu and Kashmir Home Department Communications Suspension Order. 4 August 2019.",
		},
		{
			y: 2010,
			c: "g",
			status: "lost",
			label: "Blockaded",
			m: "strings",
			title: "The WikiLeaks Banking Blockade",
			t: "Visa, Mastercard, and PayPal stopped processing donations to WikiLeaks. It later turned to Bitcoin, demonstrating an alternative beyond conventional payment controls.",
			src: "WikiLeaks Banking Blockade Records. December 2010.",
		},
		{
			y: 2000,
			c: "g",
			status: "lost",
			label: "Restricted",
			m: "tower",
			title: "The Great Firewall of China",
			t: "China made internet services responsible for policing prohibited information, building censorship into the infrastructure through which its citizens accessed the world.",
			src: "State Council Order No. 292, Internet Information Service Management Measures. 25 September 2000.",
		},

		
		{
			y: 2022,
			c: "c",
			status: "lost",
			label: "Detained",
			m: "cage",
			title: "The Mahsa Amini Protests",
			t: 'Protests spread across Iran after Mahsa Jina Amini died in police custody. As many as <span class="num">551</span> people were killed, while the laws the movement opposed remained in force.',
			src: "United Nations Independent Fact-Finding Mission on Iran. Report A/HRC/55/67. Feb 2024.",
		},
		{
			y: 2020,
			c: "c",
			status: "lost",
			label: "Disputed",
			m: "ratio",
			title: "The Belarus Election Protests",
			t: 'Hundreds of thousands challenged a disputed presidential election. More than <span class="num">35,000</span> people were later arbitrarily detained, while the government they opposed remained in power.',
			src: "United Nations Human Rights Council Resolution 49/26. 1 April 2022.",
		},
		{
			y: 2011,
			c: "c",
			status: "lost",
			label: "Cleared",
			m: "steps",
			title: "The Bahrain Uprising",
			t: "Protesters gathered at Pearl Roundabout demanding political reform and equal rights. Security forces cleared the camp, arrested opposition figures, and dismissed thousands of workers.",
			src: "Report of the Bahrain Independent Commission of Inquiry. 23 November 2011.",
		},
		{
			y: 1989,
			c: "c",
			status: "lost",
			label: "Crushed",
			m: "pyramid",
			title: "Tiananmen Square",
			t: "Students gathered in Beijing demanding accountability, free expression, and political reform. The army opened fire, killing hundreds, possibly thousands, and the movement was crushed.",
			src: "United Nations, Note by the Secretary-General on the Situation in China (E/CN.4/1990/52). 30 January 1990.",
		},
		{
			y: 1956,
			c: "c",
			status: "lost",
			label: "Suppressed",
			m: "exit",
			title: "The Hungarian Revolution",
			t: "Hungarians rose against Soviet control and briefly formed a new government. Soviet forces returned, crushed the uprising and drove nearly 200,000 people from the country.",
			src: "United Nations Special Committee Report on Hungary. Report A/3592. 1957.",
		},
		{
			y: 2020,
			c: "c",
			status: "lost",
			label: "Defied",
			m: "bubble",
			title: "Thailand’s Youth Protests",
			t: "Young protesters demanded a new constitution, the prime minister’s resignation, and reform of the monarchy. Their demands were rejected, while protest leaders faced criminal prosecution.",
			src: "OHCHR, Statement by the Spokesperson for the UN High Commissioner for Human Rights on Thailand. 18 December 2020.",
		},

		
		{
			y: 2022,
			c: "i",
			status: "lost",
			label: "Frozen",
			m: "cage",
			title: "The Canadian Bank Freezes",
			t: "Canada used financial information to identify and freeze accounts linked to convoy protests, turning access to money into a means of institutional pressure.",
			src: "Emergency Economic Measures Order, SOR/2022-22. 15 February 2022.",
		},
		{
			y: 2019,
			c: "i",
			status: "lost",
			label: "Standardised",
			m: "wire",
			title: "The FATF Travel Rule",
			t: "A global standard required a sender’s and receiver’s identity to be attached to every virtual-asset transfer, building financial surveillance into the movement of money itself.",
			src: "FATF Interpretive Note to Recommendation 15. June 2019.",
		},
		{
			y: 2014,
			c: "i",
			status: "lost",
			label: "Exchanged",
			m: "column",
			title: "The Common Reporting Standard",
			t: "Governments began automatically exchanging financial account information, creating an international system for making citizens and their wealth more visible.",
			src: "OECD Standard for Automatic Exchange of Financial Account Information. 15 July 2014.",
		},
		{
			y: 2013,
			c: "i",
			status: "lost",
			label: "Restricted",
			m: "gavel",
			title: "Operation Choke Point",
			t: "American authorities classified industries as high risk and scrutinised their banks, using institutional pressure to restrict access to financial services.",
			src: "United States Department of Justice Operation Choke Point Records. 2013.",
		},
		{
			y: 1970,
			c: "i",
			status: "lost",
			label: "Monitored",
			m: "eye",
			title: "The Bank Secrecy Act",
			t: "American banks became reporting intermediaries for the state, making private financial activity available for government monitoring and investigation.",
			src: "Bank Secrecy Act, Public Law 91-508. 26 October 1970.",
		},
	];

	
	const EVENT_IMG = {
		1: "/past-present-future/museum/01-russian-swift-exclusions.webp",
		2: "/past-present-future/museum/02-india-demonetisation.webp",
		3: "/past-present-future/museum/03-cyprus-bank-bail-in.webp",
		4: "/past-present-future/museum/04-argentina-corralito.webp",
		5: "/past-present-future/museum/05-american-gold-confiscation.webp",
		6: "/past-present-future/museum/06-eu-chat-control.webp",
		7: "/past-present-future/museum/07-investigatory-powers-act.webp",
		8: "/past-present-future/museum/08-apple-fbi-encryption.webp",
		9: "/past-present-future/museum/09-snowden-revelations.webp",
		10: "/past-present-future/museum/10-clipper-chip.webp",
		11: "/past-present-future/museum/11-myanmar-internet-shutdown.webp",
		12: "/past-present-future/museum/12-hong-kong-national-security-law.webp",
		13: "/past-present-future/museum/13-covid-moderation-policies.webp",
		14: "/past-present-future/museum/14-kashmir-blackout.webp",
		15: "/past-present-future/museum/15-wikileaks-banking-blockade.webp",
		16: "/past-present-future/museum/16-great-firewall-of-china.webp",
		17: "/past-present-future/museum/17-mahsa-amini-protests.webp",
		18: "/past-present-future/museum/19-belarus-election-protests.webp",
		19: "/past-present-future/museum/19-bahrain-uprising.webp",
		20: "/past-present-future/museum/20-tiananmen-square.webp",
		21: "/past-present-future/museum/21-hungarian-revolution.webp",
		22: "/past-present-future/museum/20-thailand-youth-protests.webp",
		23: "/past-present-future/museum/22-canadian-bank-freezes.webp",
		24: "/past-present-future/museum/23-travel-rule-implementation.webp",
		25: "/past-present-future/museum/24-common-reporting-standard.webp",
		26: "/past-present-future/museum/25-operation-choke-point.webp",
		27: "/past-present-future/museum/26-bank-secrecy-act.webp",
	};

	

	
	const EVENT_FIT_CONTAIN = new Set([24, 25]);

	
	const MAINEX = {
		d: {
			date: "15 August 1971",
			title: "The Nixon Shock",
			y: 1971,
			m: "tvgold",
			img: "/past-present-future/museum/nixon-shock-broadcast.webp",
			bg: true,
			color: true,
			cap: "“The Broadcast” — marble and glass. Hall I, installation view",
			quote: "The dollar is our currency, but it’s your problem.",
			by: "John Connally, US Treasury Secretary",
			paras: [
				"On the evening of 15 August 1971, President Richard Nixon went on television to announce a decision that would reshape the world’s money. “I have directed Secretary Connally,” he said, “to temporarily suspend the convertibility of the dollar into gold.” He called it temporary. More than fifty years later, it is still in force.",
				"Previously, under the Bretton Woods system, established in 1944, a dollar could be exchanged for a fixed weight of gold. It allowed money to hold the value of a person’s work across their life. With a single broadcast in 1971, that discipline was gone. Nixon’s own Treasury Secretary, John Connally, summed up the new order for the world’s finance ministers at the G-10 in Rome: “The dollar is our currency, but it’s your problem.”",
				'In its place came discretionary money. Created at will, its worth now rests on the judgement of central banks rather than on any fixed reserve. That change altered the relationship between citizens and the institutions that govern them. English economist John Maynard Keynes had described the mechanism decades earlier: “By a continuing process of inflation, governments can confiscate, secretly and unobserved, an important part of the wealth of their citizens.” Since 1971, the dollar has lost close to <span class="num">88%</span> of its purchasing power.',
				'Gold had capped borrowing: a government could issue only what it could redeem. Remove the cap, and debt need never be repaid at the value it was borrowed at, only inflated away. The American national debt has grown from around 400 billion dollars in 1971 to more than <span class="num">39 trillion</span> as of July 2026, now larger than the entire US economy. Japan owes more than twice what it produces in a year. Together, the world’s governments carry over 100 trillion dollars in debt, the most ever recorded.',
				"None of this is new. Two thousand years ago, Rome paid for its wars and its debts by thinning the silver in its coins from near-pure to barely five percent, and the inflation that followed became one of the forces that brought the empire down. Money cut loose from a hard limit has always ended the same way: inflated into worthlessness, or never repaid at all.",
			],
		},
		s: {
			date: "26 October 2001",
			title: "The Patriot Act",
			y: 2001,
			m: "eye",
			img: "/past-present-future/museum/patriot-act.webp",
			bg: true,
			color: true,
			cap: "The signing, East Room of the White House, 26 October 2001 — White House photo, NARA",
			quote: "That probably would not be a country in which we would want to live.",
			by: "Senator Russ Feingold, the lone no",
			paras: [
				"Forty-four days after the attacks of 11 September 2001, Congress passed one of the largest surveillance laws in the nation’s history. The USA PATRIOT Act ran to hundreds of pages, yet its final text reached the Senate floor the night before the vote. It passed ninety-eight to one. Its furthest-reaching powers were written to expire within four years. They would last fourteen.",
				"Before the Act, reaching into a person’s private life generally required a warrant and a judge. The Act lowered that threshold, letting the government demand phone records and even library borrowing records on its own authority, under a gag order forbidding anyone from revealing the demand had been made. The lone senator to vote no, Russ Feingold, warned that a state free to read every letter and hear every call would catch more criminals, “but that probably would not be a country in which we would want to live.”",
				"How far the powers reached was hidden from the public. One clause, Section 215, became the legal basis for the National Security Agency to collect the phone records of virtually every American, in bulk and in secret. For years, officials denied it. Asked under oath whether the agency gathered data on millions of Americans, the Director of National Intelligence answered, “No, sir… not wittingly.”",
				"In 2013, a contractor named Edward Snowden proved otherwise. A single order, his documents showed, had forced one carrier to surrender the call records of more than a hundred million customers, and the FBI had issued nearly two hundred thousand secret demands for records of its own. “I don’t want to live in a world,” Snowden said, “where everything I do, everyone I talk to, is recorded.”",
				'Some powers were permanent, while others were meant to lapse in 2005. Instead they were renewed in 2006, 2010, and 2011, and much of the machinery still stands. Roughly <span class="num">a billion</span> surveillance cameras now cover the world, about one for every seven people alive. One firm, Clearview AI, has scraped more than forty billion faces from the internet and sells the search tool to over three thousand police forces. Data brokers keep up to fifteen hundred details on nearly every adult, a trade now worth some 260 billion dollars a year. Almost everything you do is recorded now, and most of it is for sale.',
			],
		},
		g: {
			date: "25 January 2011",
			title: "Egyptian Uprising",
			y: 2011,
			m: "unplug",
			img: "/past-present-future/museum/egyptian-uprising.webp",
			bg: true,
			color: true,
			cap: "Tahrir Square, Cairo, February 2011 — Jonathan Rashad, CC BY",
			quote: "We are obliged to comply.",
			by: "Vodafone Egypt, January 2011",
			paras: [
				'Shortly after midnight on 28 January 2011, Egypt disappeared from the internet. In the space of minutes, the country’s largest providers erased nearly <span class="num">88%</span> of the Egyptian internet. By morning, mobile voice calls and text messages had also been suspended. More than eighty million people had been cut off during the largest protests of President Hosni Mubarak’s thirty-year rule.',
				"The demonstrations had begun three days earlier, part of the Arab Spring then sweeping the region, inspired by the revolution in Tunisia. It was organised partly through Facebook, Twitter, and mobile phones. Egyptians marched against police brutality, corruption, and an emergency law that had suspended basic rights for almost three decades. The government concluded that if the protesters could not communicate, they could not assemble. Vodafone later explained that the authorities had the legal power to order the shutdown: “We are obliged to comply.”",
				"The internet was not destroyed. It was withdrawn. Egypt’s principal providers, Telecom Egypt, Link Egypt, Vodafone, and Etisalat, were ordered to disconnect their networks from the global internet. One smaller provider, Noor, remained online briefly, preserving connections for the stock exchange and some government institutions. But the shutdown damaged the economy, drew international condemnation, and failed to clear the streets. The government restored the public internet after five days and text messaging after eight days. Mubarak remained in power for another six.",
				"The blackout failed because the movement no longer depended on the network. Protesters spread meeting points through mosques, printed leaflets, and word of mouth. Engineers abroad opened international dial-up numbers, while Google and Twitter created a service that converted telephone messages into public posts. On the “Day of Anger”, crowds overwhelmed police lines and occupied Tahrir Square. After eighteen days of protest, Mubarak resigned. At least 840 people had been killed and around 6,500 injured, but the network the state had tried to break had continued without the internet.",
				'Egypt demonstrated that a modern country could be disconnected from the world. It also gave other governments a model. In 2025, authorities and armed groups imposed at least <span class="num">313</span> internet shutdowns across fifty-two countries, the highest number yet recorded. Not one day of the year passed without a shutdown active somewhere in the world, with the most famous recently being in Iran. A society’s news, money, work, and memory are now heavily digital, and access to them still rests on infrastructure that states command. Egypt pulled the switch to preserve a system already defined by political and economic stagnation. Instead, it showed how quickly that stagnation could become impossible to hide.',
			],
		},
		c: {
			date: "17 September 2011",
			title: "Occupy Wall Street",
			y: 2011,
			m: "tent99",
			img: "/past-present-future/museum/occupy-wall-street.webp",
			bg: true,
			color: true,
			cap: "Zuccotti Park, New York, autumn 2011 — David Shankbone, CC BY",
			quote: "We are the 99%.",
			by: "Zuccotti Park, autumn 2011",
			paras: [
				"On 17 September 2011, several hundred people gathered in New York’s financial district. Police barricades blocked their intended meeting places near Wall Street, so they moved to Zuccotti Park. There, an occupation of tents, kitchens, medical stations, and a public library would last fifty-nine days. Its message was repeated across the square: “We are the 99%.”",
				'The protest began three years after the financial crisis. Congress had authorised a 700-billion-dollar programme to stabilise the financial system, while American households lost more than eleven trillion dollars in wealth. Home prices had fallen by around thirty percent, millions of mortgages had entered foreclosure, and fourteen million people remained unemployed. The banks survived, and even flourished. In the first full year of the recovery, the top one percent captured <span class="num">93 percent</span> of all income gains, their incomes rising 11.6 percent while everyone else’s rose by 0.2 percent.',
				"Occupy Wall Street had no leader and issued no single list of demands. Decisions were made through open assemblies, while the crowd repeated each speaker’s words in what became known as the “human microphone”. This lack of hierarchy made the movement difficult to control, but also difficult to direct. What united it was a belief that economic and political power had become concentrated in the hands of a small minority. The 99% became a name for everyone paying for a system they seemed to have no say in.",
				"Within a month, related demonstrations had appeared in more than 900 cities. FBI records later showed counterterrorism agents monitoring Occupy from its earliest days, with reports filed under “Domestic Terrorism”, even as the bureau acknowledged that the movement was peaceful. Police arrested around 700 people during a march across the Brooklyn Bridge. On 15 November, officers cleared Zuccotti Park before dawn and arrested as many as 140 people. Other encampments soon followed. Micah White, one of Occupy’s co-creators, later called the movement a “constructive failure”. It changed political language but failed to produce the transformation it sought. For White, its defeat showed that mass protest alone was not enough, and that an alternative is needed. By the end of the year, most of Occupy’s physical presence was gone.",
				'But its language remained. “The 1%” entered ordinary speech, returning inequality to the centre of political debate. Today, the richest one percent of American households hold nearly <span class="num">a third</span> of the country’s wealth, while the poorest half hold around two and a half percent. The camps disappeared, but the conditions that produced them did not. What looked like a temporary protest was a warning about deeper economic and political stagnation.',
			],
		},
		i: {
			date: "17 March 2018",
			title: "Cambridge Analytica",
			y: 2018,
			m: "facegrid",
			img: "/past-present-future/museum/cambridge-analytica.webp",
			bg: true,
			color: true,
			cap: "Mark Zuckerberg, 2018, the year of the reckoning — Anthony Quintano, CC BY",
			quote: "A full-service propaganda machine.",
			by: "Christopher Wylie, whistleblower",
			paras: [
				"On 17 March 2018, reports revealed that a political consultancy had obtained the personal data of tens of millions of Facebook users without their informed consent. Cambridge Analytica claimed it could turn this information into psychological profiles and use them to influence political behaviour. Whistleblower Christopher Wylie described the company as a “full-service propaganda machine”.",
				'The operation began with a Facebook personality quiz called “This Is Your Digital Life”. Around 270,000 people installed the app and agreed to share their information. Facebook’s system also allowed it to collect data from many of their friends, who had never used the quiz or given permission. One small group of participants opened access to as many as <span class="num">87 million</span> profiles. Their likes, locations, relationships, and interests became raw material for political analysis.',
				"Cambridge Analytica combined this information with consumer and voter records, dividing people by personality, fear, and political preference. It promised campaign messages tailored to the private vulnerabilities of each voter. The company and its parent group worked in elections across America, Africa, Asia, Europe, and the Caribbean. In the United States, its clients included Ted Cruz and Donald Trump, whose campaign paid it nearly six million dollars. The extent to which its profiling changed votes has never been established.",
				'Facebook had learned about the transfer of data in 2015, but relied on assurances that it had been deleted and did not inform affected users. The public found out nearly three years later. Mark Zuckerberg was called before Congress, Cambridge Analytica closed within weeks, and Facebook was eventually fined <span class="num">five billion dollars</span> by the Federal Trade Commission. The penalty was the largest privacy fine in the agency’s history, but amounted to less than one month of Facebook’s revenue.',
				"The scandal showed that privacy is not only about keeping secrets. Every search, purchase, location, friendship, and click can reveal something about who we are and can be used to predict and even influence what we might do next. Cambridge Analytica disappeared, but the system that made it possible remained. Platforms, advertisers, data brokers, and political campaigns continue to collect, combine and use our information, often through consent buried inside terms few people read. Technology has advanced faster than our control over it. Our data does not simply record our lives anymore. It is used to shape them.",
			],
		},
	};

	
	const SIDEEX = {
		d: {
			title: "Hall I – The Control of Money",
			y: 2022,
			m: "column",
			stats: [
				["88%", "US dollar value lost since 1971"],
				["$39T", "US national debt, now bigger than the US economy"],
				["86%", "of India’s cash cancelled overnight"],
			],
			paras: [
				"The same move repeats across a century: America seizing private gold in 1933, Argentina limiting withdrawals to 250 pesos a week in 2001, Cyprus taking nearly half of every large deposit in 2013, seven Russian banks cutting from the global payment system in 2022. Ultimately, whatever the spending, whatever the financial problem, the public ultimately pays for it through taxes.",
				"History has taught us that everyone needs “sound money” – money that is resistant to manipulation and inflation by the powers that be. It’s still possible, and we’re helping to create it.",
			],
			cta: { line: null, btn: "Join the movement" },
		},
		s: {
			title: "Hall II – The Surveillance State",
			y: 2022,
			m: "envelope",
			stats: [
				["1 billion", "surveillance cameras watching the world"],
				["40 billion", "faces scraped from the web by a single firm"],
				["$260B", "spent buying and selling personal data each year"],
			],
			paras: [
				"Dramatic powers are suggested or brought in for the worst threats and often stay for everyone. In 1993, the Clipper Chip tried to keep a government key to every conversation; Britain made bulk interception permanent in 2016; the FBI’s demand that Apple unlock one iPhone was really a request for a backdoor to all of them; and Europe’s Chat Control would scan private messages before they are even sent. The threat is made to feel exceptional; the surveillance then becomes ordinary.",
				"History shows us that privacy is not a feature of the sovereign network. It is the condition under which sovereignty emerges. We believe in working towards a more private future.",
			],
			cta: { line: null, btn: "Join the movement" },
		},
		g: {
			title: "Hall III – The Censored World",
			y: 2025,
			m: "mega",
			stats: [
				["313", "internet shutdowns across 52 countries in 2025"],
				["80 million", "Egyptians cut offline in a single night"],
				["550 days", "India’s internet blackout in Kashmir"],
			],
			paras: [
				"Silence comes in many forms. China built censorship into the wires with its Great Firewall; Myanmar’s generals pulled the plug after their 2021 coup; Hong Kong’s security law turned a social post into grounds for arrest; and cutting WikiLeaks off from Visa, Mastercard, and PayPal proved speech can be starved of money too. The network can always be switched off, and someone always holds the switch.",
			],
		},
		c: {
			title: "Hall IV – The Failure to be Heard",
			y: 2022,
			m: "bubble",
			stats: [
				["93%", "of the recovery’s gains captured by the top 1%"],
				[
					"551",
					"killed in Iran’s 2022 uprising, its laws left standing",
				],
				["35,000", "detained after Belarus’s disputed election"],
			],
			paras: [
				"The ending rarely changes. Hungary’s 1956 uprising was crushed by Soviet tanks; at Tiananmen, the army opened fire on its own students; Bahrain cleared Pearl Roundabout and sacked thousands who had marched; Thailand answered its students with prosecutions. People protest, make noise and even headlines, but the grievance that brought them out is almost always still there when they leave.",
				"History has taught us that voice isn’t the answer. Exit is the only option.",
			],
			cta: { line: null, btn: "Join the movement" },
		},
		i: {
			title: "Hall V – The Systems of Control",
			y: 2018,
			m: "eye",
			stats: [
				["87 million", "Facebook profiles harvested from one quiz"],
				["270,000", "quiz-takers whose friends’ data was taken too"],
				[
					"$5 billion",
					"Facebook’s record fine, under a month of its revenue",
				],
			],
			paras: [
				"The information collected about you is the same information used to control you. Since the 1970 Bank Secrecy Act, banks have reported their customers to the state; Operation Choke Point pressured them to drop lawful but disfavoured businesses; the Common Reporting Standard made citizens’ accounts visible across borders; and in 2022 Canada froze the accounts of protesters and their donors. A record kept to run the system becomes a lever to lock you out of it.",
			],
		},
	};

	
	const FOOTAGE = {
		d: [
			{
				after: 1,
				id: "7_Xw5tWsOQo",
				src: "Carl Menger Center",
				cap: "The broadcast, 15 August 1971",
			},
			{
				after: 5,
				id: "BEVOhEtXINk",
				src: "APMEX",
				cap: "What the end of the gold standard did",
			},
			{
				after: 5,
				id: "eEXlcNcMTAI",
				src: "Uncover History",
				cap: "The day the dollar stopped being real",
			},
		],
		s: [
			{
				after: 1,
				id: "Gz7S1v1k664",
				src: "ABC News",
				cap: "The address to the nation, 11 September 2001",
			},
			{
				after: 5,
				id: "KP9VklrXPZs",
				src: "History",
				cap: "What the Act permitted",
			},
			{
				after: 5,
				id: "9fCJCF3Z2n8",
				src: "VICE News",
				cap: "Twenty years on",
			},
		],
		g: [
			{
				after: 1,
				id: "wYs0n7-HCKQ",
				poster: "FnGFBzy2Oa4",
				src: "Associated Press",
				cap: "Cairo, 28 January 2011",
			},
			{
				after: 5,
				id: "l_D7LLqufVE",
				src: "BBC What’s New",
				cap: "How the Arab Spring began in Tunisia",
			},
			{
				after: 5,
				id: "_0f43xopCWs",
				src: "Al Jazeera English",
				cap: "Remembering the Arab Spring: Tunisia",
			},
		],
		c: [
			{
				after: 1,
				id: "GgJ5f9ZqOFc",
				src: "CNN",
				cap: "Zuccotti Park, 17 September 2011",
			},
			{
				after: 5,
				id: "uaDqUZSp4cw",
				poster: "FFA_MA3vqJw",
				src: "CBS News",
				cap: "The unions join the protest, October 2011",
			},
			{
				after: 5,
				id: "kGgZvjdaYhg",
				src: "Business Insider",
				cap: "Ten years after the camps",
			},
		],
		i: [
			{
				after: 1,
				id: "mrnXv-g4yKU",
				src: "The New York Times",
				cap: "How the profiles were assembled",
			},
			{
				after: 5,
				id: "FXdYSQ6nu-M",
				src: "The Guardian",
				cap: "Christopher Wylie, the whistleblower",
			},
			{
				after: 5,
				id: "84gTofMPz1k",
				src: "BBC News",
				cap: "The psychology the profiles were built on",
			},
		],
	};

	
	const WALK = (() => {
		const per = {};
		WING_ORDER.forEach((w) => {
			per[w] = EVENTS.filter((e) => e.c === w).sort((a, b) => b.y - a.y);
		});
		const q = [];
		WING_ORDER.forEach((w, i) => {
			q.push({ kind: "break", c: w });
			q.push({ kind: "mainex", c: w });
			for (const f of per[w])
				q.push({ kind: "fact", c: f.c, f, idx: EVENTS.indexOf(f) + 1 });
			q.push({ kind: "sideex", c: w });
			const next = WING_ORDER[i + 1];
			if (next) q.push({ kind: "transition", c: next });
		});
		return q;
	})();

	
	const sideCtaLine = (d) =>
		d.cta && d.cta.line !== undefined
			? d.cta.line
			: "Exiting into a parallel society is the only option.";
	const sideCtaBtn = (d) => (d.cta && d.cta.btn ? d.cta.btn : "Learn more");

	
	const CTA_LABEL = {
		"Learn more": "Learn more about Logos",
		"Join the movement": "Join the Logos movement",
	};
	const ctaLabel = (t) => CTA_LABEL[t] ?? t;
	const sideTitleHtml = (d) =>
		"Summary of " + d.title.replace(/\s*–\s*/, ' – <br class="mbr">');

	
	
	let wall = $state(null);
	
	let booted = $state(false);
	let dockOpen = $state(true);
	let attnClass = $state(null);
	let attnKey = $state(0);
	let glowStyle = $state("");
	let activeHall = $state(null);
	let hallTyped = $state({});
	let hallTyping = $state({});
	let progress = $state("0%");
	let flashHit = $state(false);
	
	let motes = {};

	
	let rootEl, feedEl, hallbarEl, halldockEl, hdPanelEl, heroBgEl;
	let hallPillEls = $state({});
	let mxTitleEls = $state({});
	let breakPEls = $state({});

	let alive = false;
	let reduceMotion;
	const timers = [];
	const later = (fn, ms) => {
		const id = window.setTimeout(fn, ms);
		timers.push(id);
		return id;
	};
	const every = (fn, ms) => {
		const id = window.setInterval(fn, ms);
		timers.push(id);
		return id;
	};

	
	function typeHallName(c) {
		if (hallTyped[c] !== undefined || hallTyping[c]) return;
		if (reduceMotion.matches) {
			hallTyped[c] = WINGS[c].name;
			return;
		}
		const full = WINGS[c].name;
		hallTyping[c] = true;
		hallTyped[c] = "";
		let i = 0;
		(function step() {
			hallTyped[c] = full.slice(0, i);
			if (i < full.length) {
				i++;
				later(step, full[i - 1] === " " ? 26 : 38);
			} else hallTyping[c] = false;
		})();
	}

	
	let revealIo, thresholdObs, hallbarTransObs;
	const transitionEls = new Set();
	const thresholdSeen = new WeakSet();
	const activeTransitions = new Set();
	let hallbarInTransition = false;

	
	const revealed = new SvelteSet();
	const revealItemOf = new WeakMap();

	
	function revealIn(node, item) {
		revealItemOf.set(node, item);
		revealIo?.observe(node);
		return {
			destroy() {
				revealIo?.unobserve(node);
			},
		};
	}
	
	function transitionFx(node, item) {
		transitionEls.add(node);
		revealItemOf.set(node, item);
		revealIo?.observe(node);
		thresholdObs?.observe(node);
		hallbarTransObs?.observe(node);
		return {
			destroy() {
				transitionEls.delete(node);
				activeTransitions.delete(node);
				revealIo?.unobserve(node);
				thresholdObs?.unobserve(node);
				hallbarTransObs?.unobserve(node);
			},
		};
	}

	
	function revealProgress(el, startFrac, endFrac, vh) {
		const r = el.getBoundingClientRect();
		const mid = r.top + r.height / 2;
		const start = vh * startFrac,
			end = vh * endFrac;
		let p = (start - mid) / (start - end);
		return Math.max(0, Math.min(1, p));
	}
	function updateTransitions() {
		const vh = window.innerHeight;
		transitionEls.forEach((el) => {
			el.querySelectorAll(".m-dot").forEach((dot) => {
				const p = revealProgress(dot, 0.92, 0.55, vh);
				dot.style.opacity = p.toFixed(3);
				dot.style.transform = `scale(${(0.6 + p * 0.4).toFixed(3)})`;
			});
			el.querySelectorAll(".m-line").forEach((line) => {
				const p = revealProgress(line, 0.9, 0.5, vh);
				line.style.opacity = Math.min(1, p * 1.4).toFixed(3);
				line.style.transform = `scaleY(${p.toFixed(3)})`;
			});
			const entering = el.querySelector(".entering");
			if (entering) {
				const p = revealProgress(entering, 0.78, 0.34, vh);
				entering.style.opacity = p.toFixed(3);
				entering.style.transform = `translateY(${((1 - p) * -6).toFixed(2)}px)`;
			}
		});
	}

	
	
	function fitMxTitles() {
		Object.values(mxTitleEls).forEach((el) => {
			if (!el) return;
			el.style.transform = "none";
			const avail = el.parentElement.clientWidth;
			const need = el.scrollWidth;
			el.style.transform =
				need > avail ? `scale(${Math.max(0.5, avail / need)})` : "none";
		});
	}
	
	function fitBreakBlurbs() {
		Object.values(breakPEls).forEach((el) => {
			if (!el) return;
			el.style.maxWidth = "";
			el.style.fontSize = "";
			const lines = () =>
				Math.round(
					el.scrollHeight /
						parseFloat(getComputedStyle(el).lineHeight),
				);
			let widthCh = 78;
			while (lines() > 3 && widthCh < 92) {
				widthCh += 2;
				el.style.maxWidth = widthCh + "ch";
			}
			if (lines() > 3) {
				let size = parseFloat(getComputedStyle(el).fontSize);
				const floor = size * 0.82;
				while (lines() > 3 && size > floor) {
					size -= 0.4;
					el.style.fontSize = size + "px";
				}
			}
		});
	}

	
	let spyLast = 0;
	let spyCur = null;
	let hallbarExpanded = false;
	let hallbarShow = $state(false);
	
	function expandHallbar(pillRect) {
		const hb = hallbarEl;
		hb.style.transition = "none";
		hb.style.left = pillRect.left + "px";
		hb.style.width = pillRect.width + "px";
		hb.style.borderRadius = "100px";

		flushSync(() => (hallbarShow = true));
		void hb.offsetWidth;
		hb.style.transition = "";
		requestAnimationFrame(() => {
			hb.style.left = "0px";
			hb.style.width = "100%";
			hb.style.borderRadius = "0px";
		});
		hallbarExpanded = true;
	}
	function collapseHallbar() {
		hallbarShow = false;
		hallbarExpanded = false;
	}
	function updateHallbarVisibility(c) {
		if (!c || hallbarInTransition) {
			if (hallbarExpanded) collapseHallbar();
			return;
		}
		const pill = hallPillEls[c];
		if (!pill) {
			if (hallbarExpanded) collapseHallbar();
			return;
		}
		
		const nav = document.querySelector(".topnav");
		const navBottom = nav ? nav.getBoundingClientRect().bottom : 0;
		const touching = pill.getBoundingClientRect().top <= navBottom;
		if (touching && !hallbarExpanded)
			expandHallbar(pill.getBoundingClientRect());
		else if (!touching && hallbarExpanded) collapseHallbar();
	}
	function updateHall() {
		const y = innerHeight * 0.42;
		let cur = null;
		for (const el of feedEl.children) {
			const r = el.getBoundingClientRect();
			if (r.top > y) break;
			if (el.dataset.c) cur = el.dataset.c;
		}
		if (cur) activeHall = cur;
		spyCur = cur;
		updateHallbarVisibility(cur);
	}
	function onScroll() {
		const now = performance.now();
		if (now - spyLast >= 120) {
			spyLast = now;
			updateHall();
		}
		
		const h = document.documentElement.scrollHeight - window.innerHeight;
		progress = Math.min(100, (window.scrollY / h) * 100) + "%";
	}

	
	let suppressCloseUntil = 0;
	let attnTimer = null;
	let attnClear = null;
	
	function fireAttnPulse(triple) {

		if (!dockOpen) return;
		if (hdPanelEl && halldockEl) {
			const pr = hdPanelEl.getBoundingClientRect();
			const dr = halldockEl.getBoundingClientRect();
			glowStyle = `left:${pr.left - dr.left}px;top:${pr.top - dr.top}px;width:${pr.width}px;height:${pr.height}px`;
		}
		attnClass = triple ? "attn-triple" : "attn";
		attnKey++;
		clearTimeout(attnClear);
		attnClear = later(() => (attnClass = null), triple ? 6700 : 2300);
	}
	function closeDock() {
		dockOpen = false;
		
		clearInterval(attnTimer);
		attnClass = null;
	}
	
	async function heroCtaClick(e) {
		e.stopPropagation();

		suppressCloseUntil = performance.now() + 900;
		dockOpen = true;
		await tick();
		halldockEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
		fireAttnPulse(false);
	}
	function docClick(e) {
		if (performance.now() < suppressCloseUntil) return;
		if (dockOpen && !halldockEl.contains(e.target)) closeDock();
	}

	
	let hallBreakEls = $state({});
	function gotoWing(c) {
		const t = hallBreakEls[c];
		if (!t) return;

		for (let i = 0; i < 12; i++) {
			const top = t.getBoundingClientRect().top;
			if (Math.abs(top - 84) <= 4) break;
			window.scrollTo({
				top: window.scrollY + top - 84,
				behavior: "instant",
			});
		}
		updateHall();
		closeDock();
	}
	function roomKeydown(e, c) {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			gotoWing(c);
		}
	}

	
	function openWall(c, kind) {
		const d = kind === "side" ? SIDEEX[c] : MAINEX[c];
		if (!d) return;
		const w = WINGS[c];
		wall = {
			c,
			title: d.title,
			hall: d.date || d.y,
			cat: `Hall ${w.num} – ${w.name}`,
			paras: d.paras,
			films: kind === "side" ? [] : FOOTAGE[c] || [],
		};
	}

	
	onMount(() => {
		alive = true;
		document.body.classList.add("museum");

		reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
		const applyMotionPref = () => {
			for (const v of rootEl.querySelectorAll("video[autoplay]")) {
				if (reduceMotion.matches) v.pause();
				else v.play().catch(() => {});
			}
		};
		reduceMotion.addEventListener("change", applyMotionPref);
		queueMicrotask(applyMotionPref);

		
		revealIo = new IntersectionObserver(
			(ents) => {
				ents.forEach((e) => {
					if (e.isIntersecting) {
						const item = revealItemOf.get(e.target);
						if (item) {
							revealed.add(item);
							if (item.kind === "break") typeHallName(item.c);
						}
						revealIo.unobserve(e.target);
					}
				});
			},
			{ rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
		);
		
		thresholdObs = new IntersectionObserver(
			(ents) => {
				ents.forEach((e) => {
					if (e.isIntersecting && !thresholdSeen.has(e.target)) {
						thresholdSeen.add(e.target);
						flashHit = true;
						requestAnimationFrame(() =>
							requestAnimationFrame(() => (flashHit = false)),
						);
					}
				});
			},
			{ rootMargin: "-45% 0px -45% 0px", threshold: 0 },
		);
		
		hallbarTransObs = new IntersectionObserver(
			(ents) => {
				ents.forEach((e) => {
					if (e.isIntersecting) activeTransitions.add(e.target);
					else activeTransitions.delete(e.target);
				});
				hallbarInTransition = activeTransitions.size > 0;
				updateHallbarVisibility(spyCur);
			},
			{ rootMargin: "0px 0px 220px 0px", threshold: 0 },
		);

		
		(function transitionLoop() {
			if (!alive) return;
			updateTransitions();
			requestAnimationFrame(transitionLoop);
		})();

		
		(function heroLoop() {
			if (!alive) return;
			const y = window.scrollY;
			if (heroBgEl && y < window.innerHeight * 1.3)
				heroBgEl.style.transform = `translateY(${y * 0.12}px) scale(1.06)`;
			requestAnimationFrame(heroLoop);
		})();

		
		const boot = () => {
			if (booted || !alive) return;
			
			WING_ORDER.forEach((c) => {
				const n = 5 + Math.floor(Math.random() * 3);
				motes[c] = Array.from({ length: n }, () => ({
					left: 8 + Math.random() * 84,
					top: 30 + Math.random() * 60,
					mx: Math.random() * 40 - 20,
					dur: 9 + Math.random() * 7,
					delay: Math.random() * 10,
				}));
			});
			booted = true;
			tick().then(() => {
				fitMxTitles();
				fitBreakBlurbs();
				updateTransitions();
				updateHall();
			});
		};
		if (document.fonts && document.fonts.ready) {
			
			Promise.all([
				document.fonts.load('150px "Rhymes Display"'),
				document.fonts.load('500 40px "Fira Code"'),
			])
				.then(boot)
				.catch(boot);
			later(boot, 700);
			document.fonts.ready.then(() => {
				if (!alive) return;
				fitMxTitles();
				fitBreakBlurbs();
			});
		} else boot();

		later(() => fireAttnPulse(true), 700);
		attnTimer = every(() => fireAttnPulse(false), 8000);

		return () => {
			alive = false;
			timers.forEach(clearTimeout);
			timers.forEach(clearInterval);
			reduceMotion.removeEventListener("change", applyMotionPref);
			revealIo.disconnect();
			thresholdObs.disconnect();
			hallbarTransObs.disconnect();
			document.body.classList.remove("museum");
		};
	});
</script>

<svelte:window
	onscroll={onScroll}
	onresize={() => {
		fitMxTitles();
		fitBreakBlurbs();
	}}
	onkeydown={(e) => {
		if (e.key === "Escape") closeDock();
	}}
/>
<svelte:document onclick={docClick} />

<svelte:head>
	<title>The Museum of Civil Liberties</title>
	<meta
		name="description"
		content="Your freedoms are eroding. We’re creating the record. So current and future generations know what was."
	/>
	
</svelte:head>

{#snippet cubeFaces(src, photo, fitContain)}
	<div class="cube">
		<span class="face f-back"></span>
		<span class="face f-left"></span>
		<span class="face f-right"></span>
		<span class="face f-top"></span>
		<span class="face f-bottom"></span>
		<div class="art" class:photo class:fit-contain={fitContain}>
			<img alt="" {src} />
		</div>
		<span class="face f-front"></span>
	</div>
{/snippet}

<div class="museum" bind:this={rootEl}>
	<div class="grain" aria-hidden="true"></div>
	<div class="progress" style:width={progress} aria-hidden="true"></div>
	<div
		class="hallbar"
		class:show={hallbarShow}
		data-c={activeHall}
		aria-hidden="true"
		bind:this={hallbarEl}
	>
		<span>Hall <span>{activeHall ? WINGS[activeHall].num : ""}</span></span>
	</div>
	<div class="threshold-flash" class:hit={flashHit} aria-hidden="true"></div>

	
	<nav
		class="halldock"
		class:open={dockOpen}
		class:attn={attnClass === "attn"}
		class:attn-triple={attnClass === "attn-triple"}
		bind:this={halldockEl}
		aria-label="The five exhibitions"
	>
		<button
			class="hd-btn"
			type="button"
			data-c={activeHall}
			aria-expanded={dockOpen}
			onclick={() => (dockOpen = true)}
		>
			<span class="sq"></span>
			<span class="hd-cur">Navigate the museum</span>
			<span class="burger" aria-hidden="true"><i></i><i></i><i></i></span>
		</button>
		{#key attnKey}
			<div class="hd-glow" style={glowStyle} aria-hidden="true"></div>
		{/key}
		<div class="hd-panel" bind:this={hdPanelEl}>
			<div class="hd-head">
				<span>Navigate the museum</span><button
					class="hd-min"
					type="button"
					aria-label="Minimise the map"
					title="Minimise"
					onclick={(e) => {
						e.stopPropagation();
						closeDock();
					}}><i></i></button
				>
			</div>
			<div class="hd-map">
				<svg
					viewBox="0 0 240 372"
					xmlns="http://www.w3.org/2000/svg"
					role="navigation"
					aria-label="Floor plan"
				>
					
					<circle class="mm-thin" cx="120" cy="28" r="13" />
					<circle class="mm-thin" cx="120" cy="28" r="4" />
					<rect fill="#0A0908" x="108" y="46" width="24" height="4" />

					<rect
						class="mm-wall"
						x="12"
						y="54"
						width="216"
						height="46"
					/>
					<text class="mm-name" x="120" y="81" text-anchor="middle"
						>Lobby</text
					>

					<g
						class="room mm-room"
						class:active={activeHall === "d"}
						tabindex="0"
						role="link"
						aria-label="Hall I Control of Money"
						data-w="d"
						onclick={() => gotoWing("d")}
						onkeydown={(e) => roomKeydown(e, "d")}
					>
						<rect
							class="floor"
							x="12"
							y="100"
							width="108"
							height="92"
						/>
						<rect
							class="mm-wall"
							x="12"
							y="100"
							width="108"
							height="92"
						/>
						<text class="mm-num" x="38" y="130">I</text>
						<rect
							x="21.2"
							y="116.2"
							width="9.6"
							height="9.6"
							fill="var(--debt)"
						/>
						<text class="mm-name" x="38" y="160">Control of</text>
						<text class="mm-name" x="38" y="172">Money</text>
					</g>
					<g
						class="room mm-room"
						class:active={activeHall === "s"}
						tabindex="0"
						role="link"
						aria-label="Hall II Surveillance State"
						data-w="s"
						onclick={() => gotoWing("s")}
						onkeydown={(e) => roomKeydown(e, "s")}
					>
						<rect
							class="floor"
							x="120"
							y="100"
							width="108"
							height="92"
						/>
						<rect
							class="mm-wall"
							x="120"
							y="100"
							width="108"
							height="92"
						/>
						<text class="mm-num" x="146" y="130">II</text>
						<rect
							x="129.2"
							y="116.2"
							width="9.6"
							height="9.6"
							fill="var(--surveillance)"
						/>
						<text class="mm-name" x="146" y="160">Surveillance</text
						>
						<text class="mm-name" x="146" y="172">State</text>
					</g>
					<g
						class="room mm-room"
						class:active={activeHall === "g"}
						tabindex="0"
						role="link"
						aria-label="Hall III Censored World"
						data-w="g"
						onclick={() => gotoWing("g")}
						onkeydown={(e) => roomKeydown(e, "g")}
					>
						<rect
							class="floor"
							x="12"
							y="192"
							width="108"
							height="92"
						/>
						<rect
							class="mm-wall"
							x="12"
							y="192"
							width="108"
							height="92"
						/>
						<text class="mm-num" x="38" y="222">III</text>
						<rect
							x="21.2"
							y="208.2"
							width="9.6"
							height="9.6"
							fill="var(--stagnation)"
						/>
						<text class="mm-name" x="38" y="252">Censored</text>
						<text class="mm-name" x="38" y="264">World</text>
					</g>
					<g
						class="room mm-room"
						class:active={activeHall === "c"}
						tabindex="0"
						role="link"
						aria-label="Hall IV Failure of Voice"
						data-w="c"
						onclick={() => gotoWing("c")}
						onkeydown={(e) => roomKeydown(e, "c")}
					>
						<rect
							class="floor"
							x="120"
							y="192"
							width="108"
							height="92"
						/>
						<rect
							class="mm-wall"
							x="120"
							y="192"
							width="108"
							height="92"
						/>
						<text class="mm-num" x="146" y="222">IV</text>
						<rect
							x="129.2"
							y="208.2"
							width="9.6"
							height="9.6"
							fill="var(--corruption)"
						/>
						<text class="mm-name" x="146" y="252">Failure of</text>
						<text class="mm-name" x="146" y="264">Voice</text>
					</g>
					<g
						class="room mm-room"
						class:active={activeHall === "i"}
						tabindex="0"
						role="link"
						aria-label="Hall V Systems of Control"
						data-w="i"
						onclick={() => gotoWing("i")}
						onkeydown={(e) => roomKeydown(e, "i")}
					>
						<rect
							class="floor"
							x="12"
							y="284"
							width="216"
							height="70"
						/>
						<rect
							class="mm-wall"
							x="12"
							y="284"
							width="216"
							height="70"
						/>
						<text class="mm-num" x="38" y="316">V</text>
						<rect
							x="21.2"
							y="302.2"
							width="9.6"
							height="9.6"
							fill="var(--influence)"
						/>
						<text class="mm-name" x="38" y="340"
							>Systems of Control</text
						>
					</g>

					
					<rect fill="#0A0908" x="50" y="98" width="22" height="4" />
					<rect fill="#0A0908" x="168" y="98" width="22" height="4" />
					<rect
						fill="#0A0908"
						x="118"
						y="132"
						width="4"
						height="22"
					/>
					<rect fill="#0A0908" x="50" y="190" width="22" height="4" />
					<rect
						fill="#0A0908"
						x="168"
						y="190"
						width="22"
						height="4"
					/>
					<rect
						fill="#0A0908"
						x="118"
						y="224"
						width="4"
						height="22"
					/>
					<rect fill="#0A0908" x="50" y="282" width="22" height="4" />
					<rect
						fill="#0A0908"
						x="168"
						y="282"
						width="22"
						height="4"
					/>
				</svg>
			</div>
		</div>
	</nav>

	<section class="hero" aria-labelledby="museum-title">
		<div class="herobg" aria-hidden="true">
			
			<video autoplay muted loop playsinline bind:this={heroBgEl}>
				<source src="/past-present-future/video/museum.webm" type="video/webm" />
				<source src="/past-present-future/video/museum.mp4" type="video/mp4" />
			</video>
		</div>
		<div class="kicker">
			<span>Preserved immutably on the Logos Network</span>
		</div>
		<h1 id="museum-title">Welcome to the<br />Museum of Civil Liberties</h1>
		<div class="sub">
			Your freedoms are eroding. We’re creating the record. So current and
			future generations know what was.<br />And can make the choice:
			remain, or exit. Preserved immutably on the Logos Network.
		</div>
		<button class="scrollcue" type="button" onclick={heroCtaClick}
			>Navigate the museum</button
		>
	</section>

	<main class="feed" aria-live="off" bind:this={feedEl}>
		{#if booted}
			{#each WALK as item (item)}
				{#if item.kind === "break"}
					{@const w = WINGS[item.c]}
					<section
						class="break"
						class:in={revealed.has(item)}
						data-c={item.c}
						id={"wing-" + item.c}
						use:revealIn={item}
						bind:this={hallBreakEls[item.c]}
					>
						<div class="label">
							<span class="hall" bind:this={hallPillEls[item.c]}
								>Hall {w.num}</span
							>
						</div>
						<div
							class="hallname"
							class:typing={hallTyping[item.c]}
							aria-label={w.name}
						>
							{hallTyped[item.c] ?? w.name}
						</div>
						<h2>{w.line}</h2>
						<p bind:this={breakPEls[item.c]}>{w.blurb}</p>
					</section>
				{:else if item.kind === "transition"}
					{@const w = WINGS[item.c]}
					<section
						class="transition"
						class:in={revealed.has(item)}
						use:transitionFx={item}
					>
						<div class="marker">
							<span class="m-dot" aria-hidden="true"></span>
							<span class="m-line" aria-hidden="true"></span>
							<p class="entering">Entering Hall {w.num}</p>
							<span class="m-line" aria-hidden="true"></span>
							<span class="m-dot" aria-hidden="true"></span>
						</div>
					</section>
				{:else if item.kind === "mainex"}
					{@const w = WINGS[item.c]}
					{@const d = MAINEX[item.c]}
					<section
						class="mainex hasbg"
						class:in={revealed.has(item)}
						data-c={item.c}
						data-kind="main"
						use:revealIn={item}
					>
						<div class="mx-bg">
							<img
								src={d.img}
								class:color={d.color}
								alt=""
								loading="lazy"
								aria-hidden="true"
							/>
							<div class="mx-overlay">
								<div class="mx-hall">
									Hall {w.num} – {w.name}
								</div>
								<h3
									class="mx-title"
									bind:this={mxTitleEls[item.c]}
								>
									{d.title}
								</h3>
								{#if d.date}<div class="mx-date">
										{d.date}
									</div>{/if}
							</div>
							{#each motes[item.c] ?? [] as m}
								<span
									class="mote"
									style="left:{m.left}%;top:{m.top}%;--mx:{m.mx}px;animation-duration:{m.dur}s;animation-delay:{m.delay}s"
								></span>
							{/each}
						</div>
						<div class="mx-info">
							<div class="mx-grid">
								<div class="mx-cred">{@html d.cap}</div>
								<div class="plq">
									<div class="plq-head">
										<span class="wm-brand"
											>The Museum of Civil Liberties</span
										><span class="no"
											>Cat. M-0{WING_ORDER.indexOf(
												item.c,
											) + 1} · {d.y}</span
										>
									</div>
									<p class="mx-lede">{@html d.paras[0]}</p>
									{#if d.quote}
										<aside class="mx-quote">
											“{d.quote}”<span class="by"
												>— {d.by}</span
											>
										</aside>
									{/if}
									<button
										class="mx-more"
										type="button"
										onclick={() => openWall(item.c, "main")}
										><span class="pm">+</span>Enter exhibit</button
									>
								</div>
							</div>
						</div>
					</section>
				{:else if item.kind === "sideex"}
					{@const d = SIDEEX[item.c]}
					<section
						class="mainex side"
						class:in={revealed.has(item)}
						data-c={item.c}
						data-kind="side"
						use:revealIn={item}
					>
						<div class="plq">
							<h3 class="mx-title">{@html sideTitleHtml(d)}</h3>
							{#if d.stats}
								<div class="mx-stats">
									{#each d.stats as s}
										<div class="st">
											<span class="stv">{s[0]}</span><span
												class="stc">{s[1]}</span
											>
										</div>
									{/each}
								</div>
							{/if}
							<div class="sp-grid">
								<div class="sp-text">
									{#each d.paras as p, i}
										<p
											class="mx-lede{i > 0
												? ' no-cap'
												: ''}"
										>
											{@html p}
										</p>
									{/each}
									{#if d.quote}
										<aside class="mx-quote">
											“{d.quote}”<span class="by"
												>— {d.by}</span
											>
										</aside>
									{/if}
									{#if sideCtaLine(d)}<p class="mx-cta">
											{sideCtaLine(d)}
										</p>{/if}
					<a
						class="mx-cta-btn"
						href="/build-the-parallel"
						aria-label={ctaLabel(sideCtaBtn(d))}
										><span class="pm">+</span>{sideCtaBtn(
											d,
										)}</a
									>
								</div>
								<div class="exhibit" aria-hidden="true">
									{@render cubeFaces(
										MAINEX[item.c].img,
										false,
										false,
									)}
								</div>
							</div>
						</div>
					</section>
				{:else}
					<article
						class="entry lost"
						class:in={revealed.has(item)}
						data-c={item.f.c}
						use:revealIn={item}
					>
						<div class="rail">
							<span class="year">{item.f.y}</span>
							<span class="tag"
								><span class="sq"></span>{CAT_LABEL[
									item.f.c
								]}</span
							>
							<span class="status">Status — {item.f.label}</span>
						</div>
						<div class="body">
							<h4 class="fact-title">{item.f.title}</h4>
							<p class="fact">{@html item.f.t}</p>
							<p class="src"><span>{item.f.src}</span></p>
						</div>
						<div class="exhibit" aria-hidden="true">
							{@render cubeFaces(
								EVENT_IMG[item.idx],
								true,
								EVENT_FIT_CONTAIN.has(item.idx),
							)}
						</div>
					</article>
				{/if}
			{/each}
		{/if}
	</main>

	<footer class="loader" class:done={booted} aria-live="polite">
		{#if booted}
			<div class="loader-ctas">
				<a
					class="loader-cta"
					href="/build-the-parallel"
					aria-label={ctaLabel("Learn more")}>Learn more</a
				>
				<a
					class="loader-cta"
					href="/movement"
					aria-label={ctaLabel("Join the movement")}>Join the movement</a
				>
			</div>
		{:else}
			Cataloguing further losses<span class="blink">_</span>
		{/if}
	</footer>

	<WallModal data={wall} onclose={() => (wall = null)} />
</div>

<style>
	.grain {
		position: fixed;
		inset: 0;
		pointer-events: none;
		z-index: 60;
		opacity: 0.05;
		mix-blend-mode: overlay;
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
	}
	.halldock {
		position: fixed;
		right: clamp(28px, 5.5vw, 92px);
		top: 50%;
		transform: translateY(-50%);
		z-index: 90;
		font-family: "Fira Code", ui-monospace, monospace;
	}
	.hd-btn {
		display: flex;
		align-items: center;
		gap: 11px;
		cursor: pointer;
		background: rgba(0, 0, 0, 0.86);
		backdrop-filter: blur(8px);
		border: 1px solid var(--line-strong);
		color: rgba(255, 255, 255, 0.78);
		padding: 13px 17px;
		font-family: inherit;
		font-weight: 300;
		border-radius: 100px;
		font-size: 10px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		transition:
			color 0.25s,
			border-color 0.25s;
	}
	.hd-btn:hover {
		color: var(--ink);
		border-color: var(--ink);
	}
	.hd-btn .sq {
		width: 8px;
		height: 8px;
		flex: none;
		background: var(--faint);
	}
	.hd-btn[data-c="s"] .sq {
		background: var(--surveillance);
	}
	.hd-btn[data-c="c"] .sq {
		background: var(--corruption);
	}
	.hd-btn[data-c="d"] .sq {
		background: var(--debt);
	}
	.hd-btn[data-c="g"] .sq {
		background: var(--stagnation);
	}
	.hd-btn[data-c="i"] .sq {
		background: var(--influence);
	}
	.hd-btn .burger {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}
	.hd-btn .burger i {
		display: block;
		width: 13px;
		height: 1px;
		background: currentColor;
	}
	.hd-panel {
		display: none;
		position: absolute;
		right: 0;
		top: 50%;
		transform: translateY(-50%);
		background: #0a0908;
		border-radius: 18px;
		overflow: hidden;
		border: 1px solid var(--line-strong);
		width: 288px;
		padding: 0 0 6px;
		box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7);
	}
	.hd-map {
		padding: 10px 14px 12px;
	}
	.hd-map svg {
		display: block;
		width: 100%;
		height: auto;
	}
	.mm-wall {
		fill: none;
		stroke: rgba(255, 255, 255, 0.5);
		stroke-width: 1.2;
	}
	.mm-thin {
		fill: none;
		stroke: rgba(255, 255, 255, 0.3);
		stroke-width: 1;
	}
	.mm-num {
		font-family: "Rhymes Display", Georgia, serif;
		font-size: 20px;
		fill: rgba(255, 255, 255, 0.92);
	}
	.mm-name {
		font-family: "Fira Code", ui-monospace, monospace;
		font-size: 8px;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		fill: rgba(255, 255, 255, 0.55);
	}
	.mm-room {
		cursor: pointer;
	}
	.mm-room .floor {
		fill: rgba(255, 255, 255, 0);
		transition: fill 0.2s;
	}
	.mm-room[data-w="s"]:hover .floor {
		fill: var(--surveillance);
	}
	.mm-room[data-w="c"]:hover .floor {
		fill: var(--corruption);
	}
	.mm-room[data-w="d"]:hover .floor {
		fill: var(--debt);
	}
	.mm-room[data-w="g"]:hover .floor {
		fill: var(--stagnation);
	}
	.mm-room[data-w="i"]:hover .floor {
		fill: var(--influence);
	}
	.mm-room:hover .mm-name {
		fill: var(--logos-ink);
	}
	.mm-room:hover .mm-num {
		fill: var(--logos-ink);
	}
	.mm-room[data-w="g"]:hover .mm-name,
	.mm-room[data-w="g"]:hover .mm-num {
		fill: var(--logos-off);
	}
	.mm-room:hover .mm-wall {
		stroke: var(--ink);
	}
	.mm-room.active .mm-name {
		fill: rgba(255, 255, 255, 0.95);
	}
	.mm-room[data-w="s"].active .floor {
		fill: rgba(198, 235, 247, 0.16);
	}
	.mm-room[data-w="c"].active .floor {
		fill: rgba(255, 211, 40, 0.14);
	}
	.mm-room[data-w="d"].active .floor {
		fill: rgba(161, 136, 99, 0.2);
	}
	.mm-room[data-w="g"].active .floor {
		fill: rgba(95, 121, 124, 0.24);
	}
	.mm-room[data-w="i"].active .floor {
		fill: rgba(226, 224, 201, 0.16);
	}
	.mm-room[data-w="s"].active:hover .floor {
		fill: var(--surveillance);
	}
	.mm-room[data-w="c"].active:hover .floor {
		fill: var(--corruption);
	}
	.mm-room[data-w="d"].active:hover .floor {
		fill: var(--debt);
	}
	.mm-room[data-w="g"].active:hover .floor {
		fill: var(--stagnation);
	}
	.mm-room[data-w="i"].active:hover .floor {
		fill: var(--influence);
	}
	.mm-room.active:hover .mm-name,
	.mm-room.active:hover .mm-num {
		fill: var(--logos-ink);
	}
	.mm-room[data-w="g"].active:hover .mm-name,
	.mm-room[data-w="g"].active:hover .mm-num {
		fill: var(--logos-off);
	}
	.halldock.open .hd-btn {
		visibility: hidden;
	}
	.halldock.open .hd-panel {
		display: block;
	}
	.hd-glow {
		position: absolute;
		z-index: -1;
		border-radius: 18px;
		pointer-events: none;
		background: rgba(255, 255, 255, 0.24);
		border: 1px solid rgba(255, 255, 255, 0.65);
		opacity: 0;
		transform: scale(1);
		transform-origin: center;
	}
	.halldock.attn .hd-glow {
		animation: m-attnPulse 2.2s cubic-bezier(0.3, 0.6, 0.4, 1) 1;
	}
	.halldock.attn-triple .hd-glow {
		animation: m-attnPulse 2.2s cubic-bezier(0.3, 0.6, 0.4, 1) 3;
	}
	@keyframes m-attnPulse {
		0% {
			opacity: 0.75;
			transform: scale(1);
		}
		70% {
			opacity: 0;
			transform: scale(1.3);
		}
		100% {
			opacity: 0;
			transform: scale(1.3);
		}
	}
	.hd-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 14px 14px 12px 18px;
		margin-bottom: 6px;
		font-weight: 300;
		font-size: 9px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 0.72);
		border-bottom: 1px solid var(--line);
	}
	.hd-min {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: none;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		cursor: pointer;
		background: none;
		border: 1px solid var(--line-strong);
		color: rgba(255, 255, 255, 0.7);
		transition:
			color 0.2s,
			border-color 0.2s,
			background 0.2s;
	}
	.hd-min:hover {
		color: var(--logos-ink);
		background: var(--ink);
		border-color: var(--ink);
	}
	.hd-min i {
		display: block;
		width: 9px;
		height: 1px;
		background: currentColor;
	}
	@media (max-width: 820px) {
		.halldock {
			top: auto;
			bottom: 18px;
			right: 14px;
			transform: none;
		}
		.hd-panel {
			top: auto;
			bottom: 0;
			transform: none;
			width: 232px;
		}
		.hd-map {
			padding: 8px 11px 10px;
		}
		.hd-head {
			padding: 11px 11px 9px 14px;
			font-size: 8.5px;
			letter-spacing: 0.18em;
		}
		.mm-name {
			font-size: 7.5px;
		}
		.mm-num {
			font-size: 17px;
		}
	}
	.hero {
		min-height: 78vh;
		display: flex;
		flex-direction: column;
		justify-content: center;
		max-width: 1320px;
		margin: 0 auto;
		padding: 190px clamp(18px, 4vw, 56px) 90px;
		position: relative;
		z-index: 0;
	}
	.herobg {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 50%;
		width: 100vw;
		margin-left: -50vw;
		z-index: 0;
		overflow: hidden;
		pointer-events: none;
	}
	.herobg video {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center 42%;
		filter: brightness(0.72);
	}
	.herobg::after {
		content: "";
		position: absolute;
		inset: 0;
		background: linear-gradient(
				90deg,
				rgba(0, 0, 0, 0.42) 0%,
				rgba(0, 0, 0, 0.18) 40%,
				rgba(0, 0, 0, 0) 70%
			),
			linear-gradient(
				180deg,
				rgba(0, 0, 0, 0.12) 0%,
				rgba(0, 0, 0, 0.34) 55%,
				rgba(0, 0, 0, 0.88) 100%
			);
	}
	.hero .kicker,
	.hero h1,
	.hero .sub,
	.hero .scrollcue {
		position: relative;
		z-index: 1;
	}
	.hero .kicker {
		font-size: 13.2px;
		letter-spacing: 0.01em;
		line-height: 0.92;
		text-transform: uppercase;
		color: rgba(236, 236, 228, 0.6);
		margin-bottom: calc(
			clamp(10px, 1.35vh, 15px) + clamp(6px, 0.82vw, 14px)
		);
		display: flex;
		gap: 16px;
		align-items: center;
		flex-wrap: wrap;
	}
	.hero h1 {
		font-family: "Rhymes Display", "Rhymes Text", serif;
		font-weight: 400;
		font-size: clamp(39.5px, 5.47vw, 94.7px);
		line-height: 0.94;
		letter-spacing: -0.03em;
		color: #ecece4;
		
		margin-bottom: clamp(10px, 1.35vh, 15px);
	}
	.hero .sub {
		font-family:
			"Public Sans",
			system-ui,
			-apple-system,
			sans-serif;
		font-weight: 400;
		font-size: clamp(13.6px, calc(0.92vw + 2px), 14.9px);
		line-height: 1.2;
		letter-spacing: normal;
		color: rgba(236, 236, 228, 0.6);
		max-width: 90ch;
		margin-bottom: clamp(10px, 1.35vh, 15px);
	}
	.scrollcue {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		font-size: 10.1px;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: #ecece4;
		font-family: inherit;
		border: 1px solid var(--line-strong);
		background: rgba(255, 255, 255, 0.05);
		border-radius: 100px;
		padding: 12px 22px;
		margin-top: clamp(10px, 1.35vh, 15px);
		width: fit-content;
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		transition:
			background-color 0.25s,
			border-color 0.25s;
	}
	.scrollcue:hover {
		background: rgba(255, 255, 255, 0.14);
		border-color: var(--ink);
	}
	.feed {
		max-width: 1320px;
		margin: 0 auto;
		border-top: 1px solid var(--line-strong);
	}
	.entry {
		border-bottom: 1px solid var(--line);
		content-visibility: auto;
		contain-intrinsic-size: auto 620px;
		padding: clamp(34px, 5vw, 70px) clamp(18px, 4vw, 56px);
		display: grid;
		grid-template-columns: 190px 1fr clamp(210px, 22vw, 280px);
		gap: clamp(20px, 3.5vw, 52px);
		align-items: center;
		opacity: 0;
		transform: translateY(18px);
		transition:
			opacity 0.7s ease,
			transform 0.7s ease;
	}
	.entry.in {
		opacity: 1;
		transform: none;
	}
	@media (max-width: 960px) {
		.entry {
			grid-template-columns: 190px 1fr;
		}
		.entry .exhibit {
			grid-column: 1 / -1;
			justify-self: center;
			margin-top: 10px;
		}
	}
	@media (max-width: 720px) {
		.entry {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
	.entry .rail {
		font-size: 11px;
		letter-spacing: 0.13em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.entry .rail .year {
		font-family: "Rhymes Display", "Rhymes Text", serif;
		font-weight: 400;
		font-size: clamp(40px, 4.4vw, 62px);
		line-height: 0.9;
		letter-spacing: 0;
		color: var(--ink);
		display: block;
		margin-bottom: 18px;
	}
	.entry.lost .rail .year {
		color: var(--muted);
	}
	.entry .rail .tag {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--ink);
		font-size: 9px;
		letter-spacing: 0.06em;
		white-space: nowrap;
	}
	.entry .rail .tag .sq {
		width: 8px;
		height: 8px;
		flex: none;
	}
	.entry .rail .status {
		display: none;
		margin-top: 14px;
		font-size: 10px;
		letter-spacing: 0.16em;
		color: var(--faint);
	}
	.entry .body .fact-title {
		font-family: "Rhymes Display", "Rhymes Text", serif;
		font-weight: 400;
		font-size: clamp(25px, 2.1vw, 32px);
		line-height: 1.15;
		letter-spacing: 0;
		color: var(--ink);
		margin-bottom: 12px;
	}
	.entry .body .fact {
		font-family: "Public Sans", system-ui, sans-serif;
		font-weight: 400;
		font-size: clamp(15px, 1.35vw, 17px);
		line-height: 1.16;
		letter-spacing: 0;
		color: var(--muted);
		margin-bottom: 26px;
	}
	.entry .body .src {
		font-size: 11.5px;
		letter-spacing: 0.05em;
		color: var(--muted);
		display: flex;
		gap: 12px;
		align-items: baseline;
		flex-wrap: wrap;
	}
	.entry[data-c="s"] .tag .sq {
		background: var(--surveillance);
	}
	.entry[data-c="c"] .tag .sq {
		background: var(--corruption);
	}
	.entry[data-c="d"] .tag .sq {
		background: var(--debt);
	}
	.entry[data-c="g"] .tag .sq {
		background: var(--stagnation);
	}
	.entry[data-c="i"] .tag .sq {
		background: var(--influence);
	}
	.entry[data-c="s"] .fact :global(.num) {
		color: var(--surveillance);
	}
	.entry[data-c="c"] .fact :global(.num) {
		color: var(--corruption);
	}
	.entry[data-c="d"] .fact :global(.num) {
		color: var(--debt);
	}
	.entry[data-c="g"] .fact :global(.num) {
		color: var(--stagnation);
	}
	.entry[data-c="i"] .fact :global(.num) {
		color: var(--influence);
	}
	.entry[data-c="s"] .rail .year {
		color: var(--surveillance);
	}
	.entry[data-c="c"] .rail .year {
		color: var(--corruption);
	}
	.entry[data-c="d"] .rail .year {
		color: var(--debt);
	}
	.entry[data-c="g"] .rail .year {
		color: var(--stagnation);
	}
	.entry[data-c="i"] .rail .year {
		color: var(--influence);
	}
	.entry[data-c="s"] .body .src {
		color: var(--surveillance);
	}
	.entry[data-c="c"] .body .src {
		color: var(--corruption);
	}
	.entry[data-c="d"] .body .src {
		color: var(--debt);
	}
	.entry[data-c="g"] .body .src {
		color: var(--stagnation);
	}
	.entry[data-c="i"] .body .src {
		color: var(--influence);
	}
	.exhibit {
		align-self: center;
		justify-self: end;
		width: clamp(200px, 21vw, 260px);
		perspective: 1100px;
		pointer-events: none;
	}
	.cube {
		--d: 104px;
		position: relative;
		width: 100%;
		aspect-ratio: 4/5;
		transform-style: preserve-3d;
		animation: m-vitrine 8s ease-in-out infinite alternate;
	}
	.mainex.side .cube {
		aspect-ratio: 2048/1000;
	}
	@keyframes m-vitrine {
		0% {
			transform: rotateX(-3deg) rotateY(-17deg);
		}
		100% {
			transform: rotateX(-6deg) rotateY(17deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.cube {
			animation: none;
			transform: rotateX(-4deg) rotateY(-13deg);
		}
	}
	.cube .face {
		position: absolute;
		inset: 0;
		border: 1px solid rgba(214, 238, 247, 0.26);
		background: linear-gradient(
			133deg,
			rgba(214, 238, 247, 0.1) 0%,
			rgba(214, 238, 247, 0.02) 42%,
			rgba(214, 238, 247, 0.07) 100%
		);
	}
	.f-front {
		transform: translateZ(0);
		background:
      
			radial-gradient(
				130% 100% at 14% 8%,
				rgba(226, 244, 252, 0.3) 0%,
				rgba(226, 244, 252, 0) 46%
			),
			radial-gradient(
				120% 90% at 88% 94%,
				rgba(198, 235, 247, 0.24) 0%,
				rgba(198, 235, 247, 0) 44%
			),
			
				linear-gradient(
					148deg,
					rgba(232, 246, 252, 0.16) 0%,
					rgba(232, 246, 252, 0.04) 40%,
					rgba(232, 246, 252, 0.13) 74%,
					rgba(232, 246, 252, 0.05) 100%
				),
			
				url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.62' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%25' height='100%25' filter='url(%23f)' opacity='0.5'/></svg>");
		background-size:
			auto,
			auto,
			auto,
			190px 190px;
		box-shadow:
			inset 0 0 22px rgba(226, 244, 252, 0.16),
			inset 0 1px 0 rgba(240, 250, 255, 0.35);
	}
	.f-front::after {
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
			106deg,
			rgba(255, 255, 255, 0) 30%,
			rgba(255, 255, 255, 0.13) 44%,
			rgba(255, 255, 255, 0.02) 52%,
			rgba(255, 255, 255, 0) 66%
		);
	}
	.f-back {
		transform: translateZ(calc(var(--d) * -1));
		background: linear-gradient(180deg, #0a0d0f 0%, #06080a 100%);
		border-color: rgba(214, 238, 247, 0.12);
	}
	.f-left {
		right: auto;
		width: var(--d);
		transform-origin: left center;
		transform: rotateY(90deg);
	}
	.f-right {
		left: auto;
		width: var(--d);
		transform-origin: right center;
		transform: rotateY(-90deg);
	}
	.f-top {
		bottom: auto;
		height: var(--d);
		transform-origin: center top;
		transform: rotateX(-90deg);
		background: linear-gradient(
			180deg,
			rgba(226, 244, 252, 0.16) 0%,
			rgba(226, 244, 252, 0.04) 100%
		);
	}
	.f-bottom {
		top: auto;
		height: var(--d);
		transform-origin: center bottom;
		transform: rotateX(90deg);
		background: rgba(6, 9, 11, 0.92);
		border-color: rgba(214, 238, 247, 0.12);
	}
	.art {
		position: absolute;
		left: 10%;
		right: 10%;
		top: 9%;
		bottom: 9%;
		transform: translateZ(calc(var(--d) * -0.66));
		background: #0b0a09;
		overflow: hidden;
		box-shadow: 0 20px 44px rgba(0, 0, 0, 0.65);
	}
	.art img {
		width: 100%;
		height: 100%;
		display: block;
		object-fit: cover;
		filter: blur(0.35px) saturate(0.72) brightness(1.06) contrast(0.9);
	}
	.art.photo img {
		filter: grayscale(1) blur(0.35px) brightness(1.02) contrast(1.05);
	}
	.art.photo.fit-contain img {
		object-fit: contain;
		background: rgba(0, 0, 0, 0.55);
	}
	.art::after {
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
				120% 95% at 50% 0%,
				rgba(214, 238, 247, 0.2) 0%,
				rgba(214, 238, 247, 0) 55%
			),
			linear-gradient(
				180deg,
				rgba(206, 232, 244, 0.12) 0%,
				rgba(206, 232, 244, 0.03) 45%,
				rgba(206, 232, 244, 0.14) 100%
			);
	}
	.break {
		border-bottom: 1px solid var(--line);
		border-top: 1px solid var(--line-strong);
		padding: clamp(64px, 9vw, 120px) clamp(18px, 4vw, 56px);
		position: relative;
		overflow: hidden;
		opacity: 0;
		transform: translateY(18px);
		transition:
			opacity 0.7s ease,
			transform 0.7s ease;
		scroll-margin-top: 84px;
	}
	.break.in {
		opacity: 1;
		transform: none;
	}
	.break::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
	}
	.break[data-c="s"]::before {
		background: var(--surveillance);
	}
	.break[data-c="c"]::before {
		background: var(--corruption);
	}
	.break[data-c="d"]::before {
		background: var(--debt);
	}
	.break[data-c="g"]::before {
		background: var(--stagnation);
	}
	.break[data-c="i"]::before {
		background: var(--influence);
	}
	.break {
		text-align: center;
	}
	.break .label {
		font-size: 11px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 33px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 14px;
		flex-wrap: wrap;
	}
	.break .label .hall {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		padding: 8px 16px;
		border-radius: 100px;
		color: var(--logos-ink);
		font-weight: 500;
	}
	.break[data-c="g"] .label .hall {
		color: var(--logos-off);
	}
	.break[data-c="s"] .label .hall {
		background: var(--surveillance);
	}
	.break[data-c="c"] .label .hall {
		background: var(--corruption);
	}
	.break[data-c="d"] .label .hall {
		background: var(--debt);
	}
	.break[data-c="g"] .label .hall {
		background: var(--stagnation);
	}
	.break[data-c="i"] .label .hall {
		background: var(--influence);
	}
	.break .hallname.typing::after {
		content: "";
		display: inline-block;
		vertical-align: baseline;
		width: 0.42em;
		height: 0.74em;
		margin-left: 0.06em;
		background: currentColor;
		animation: mn-caret 1.05s steps(1, end) infinite;
	}
	@keyframes mn-caret {
		0%,
		49% {
			opacity: 1;
		}
		50%,
		100% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.break .hallname.typing::after {
			display: none;
		}
	}
	.break .hallname {
		font-family: "Rhymes Display", "Rhymes Text", serif;
		font-weight: 400;
		font-size: clamp(21px, 4.48vw, 67px);
		line-height: 1;
		letter-spacing: -0.015em;
		margin-bottom: 8px;
		white-space: nowrap;
	}
	.break h2 {
		font-family: "Public Sans", system-ui, sans-serif;
		font-weight: 300;
		font-size: clamp(18px, 2.3vw, 27px);
		line-height: 1.16;
		color: var(--muted);
		margin-bottom: 11px;
	}
	.break p {
		font-family:
			"Public Sans",
			system-ui,
			-apple-system,
			sans-serif;
		font-size: 15.5px;
		color: #ecece4;
		max-width: 78ch;
		margin: 0 auto 34px;
		line-height: 1.16;
	}
	.transition {
		padding: clamp(76px, 10.1vw, 126px) clamp(18px, 4vw, 56px);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
	}
	.transition .marker {
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.transition .m-dot {
		width: 19px;
		height: 19px;
		border-radius: 50%;
		flex: 0 0 auto;
		position: relative;
		
		border: 2px solid rgba(236, 236, 228, 0.7);
		opacity: 0;
		transform: scale(0.6);
	}
	.transition .m-dot::after {
		content: "";
		position: absolute;
		inset: 6px;
		border-radius: 50%;
		background: #ecece4;
	}
	.transition .m-line {
		width: 2px;
		height: clamp(72px, 10.8vw, 168px);
		background: linear-gradient(
			180deg,
			rgba(236, 236, 228, 1),
			rgba(236, 236, 228, 0)
		);
		opacity: 0;
		transform: scaleY(0);
		transform-origin: top;
	}
	
	.transition .m-line ~ .m-line {
		background: linear-gradient(
			180deg,
			rgba(236, 236, 228, 0),
			rgba(236, 236, 228, 1)
		);
	}
	.transition .entering {
		font-family: "Fira Code", monospace;
		font-weight: 400;
		text-transform: uppercase;
		font-size: clamp(10.6px, 1.12vw, 14px);
		letter-spacing: 0.01em;
		color: var(--muted);
		margin: 22px 0;
		opacity: 0;
	}
	.mainex {
		border-bottom: 1px solid var(--line);
		content-visibility: auto;
		contain-intrinsic-size: auto 760px;
		padding: clamp(46px, 6vw, 88px) clamp(18px, 4vw, 56px);
		opacity: 0;
		transform: translateY(18px);
		transition:
			opacity 0.7s ease,
			transform 0.7s ease;
	}
	.mainex.in {
		opacity: 1;
		transform: none;
	}
	.mainex {
		--trgb: 201, 142, 98;
	}
	.mainex[data-c="s"] {
		--trgb: 198, 235, 247;
	}
	.mainex[data-c="c"] {
		--trgb: 255, 211, 40;
	}
	.mainex[data-c="d"] {
		--trgb: 161, 136, 99;
	}
	.mainex[data-c="g"] {
		--trgb: 95, 121, 124;
	}
	.mainex[data-c="i"] {
		--trgb: 226, 224, 201;
	}
	.mx-date {
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--faint);
	}
	.mx-title {
		font-family: "Rhymes Display", "Rhymes Text", serif;
		font-weight: 400;
		font-size: clamp(34px, 5.6vw, 76px);
		line-height: 1;
		letter-spacing: -0.01em;
		margin-bottom: 14px;
	}
	.mx-title :global(.mbr) {
		display: none;
	}
	.mainex.side .mx-title {
		font-size: clamp(22px, 3.6vw, 46px);
		color: rgba(var(--trgb), 1);
	}
	.mx-hall {
		font-size: 11px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--muted);
		margin-bottom: 36px;
	}
	.mx-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: clamp(24px, 4vw, 64px);
		align-items: start;
	}
	.mainex .exhibit {
		width: clamp(228px, 26.4vw, 300px);
		margin: 0 auto;
	}
	.mainex.side {
		padding: clamp(40px, 5vw, 72px) clamp(18px, 4vw, 56px);
	}
	.sp-grid {
		display: grid;
		grid-template-columns: 1fr clamp(228px, 26.4vw, 300px);
		gap: clamp(28px, 4.5vw, 72px);
		align-items: center;
		margin-top: 4px;
	}
	.sp-grid .exhibit {
		transform: translateX(-30px);
	}
	@media (max-width: 860px) {
		.sp-grid {
			grid-template-columns: 1fr;
		}
		.sp-grid .exhibit {
			margin: 26px auto 0;
			transform: none;
		}
	}
	.side .mx-lede {
		font-family:
			"Public Sans",
			system-ui,
			-apple-system,
			sans-serif;
		font-weight: 400;
		font-size: 15.5px;
		line-height: 1.16;
		max-width: 64ch;
	}
	.side .mx-lede::first-letter {
		font-size: 1em;
		float: none;
		padding: 0;
		font-family: inherit;
	}
	.side .mx-lede.no-cap {
		margin-top: 1em;
	}
	.side .mx-quote {
		font-size: clamp(17px, 1.9vw, 23px);
		padding: 4px 0 4px 20px;
		margin-bottom: 26px;
	}
	.side .mx-cta {
		margin-top: 20px;
		padding-top: 18px;
		border-top: 1px solid rgba(var(--trgb), 0.3);
		font-size: clamp(12px, 1.2vw, 13.5px);
		letter-spacing: 0.02em;
		line-height: 1.6;
		color: var(--muted);
		max-width: 64ch;
	}
	.mx-cta-btn {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		margin-top: 14px;
		cursor: pointer;
		font-family: "Fira Code", ui-monospace, monospace;
		font-size: 10.5px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: rgba(var(--trgb), 0.95);
		background: rgba(var(--trgb), 0.08);
		text-decoration: none;
		border: 1px solid rgba(var(--trgb), 0.55);
		border-radius: 100px;
		padding: 12px 22px;
		transition:
			color 0.25s,
			border-color 0.25s,
			background-color 0.25s;
	}
	.mx-cta-btn:hover {
		color: var(--ink);
		border-color: rgba(var(--trgb), 1);
		background: rgba(var(--trgb), 0.18);
	}
	.mx-cta-btn .pm {
		color: rgba(var(--trgb), 0.7);
	}
	.plq {
		position: relative;
		border-radius: 20px;
		border: 1px solid rgba(var(--trgb), 0.7);
		background: radial-gradient(
				circle 3px at 15px 15px,
				rgba(var(--trgb), 0.95) 1.6px,
				rgba(var(--trgb), 0) 3px
			),
			radial-gradient(
				circle 3px at calc(100% - 15px) 15px,
				rgba(var(--trgb), 0.95) 1.6px,
				rgba(var(--trgb), 0) 3px
			),
			radial-gradient(
				circle 3px at 15px calc(100% - 15px),
				rgba(var(--trgb), 0.95) 1.6px,
				rgba(var(--trgb), 0) 3px
			),
			radial-gradient(
				circle 3px at calc(100% - 15px) calc(100% - 15px),
				rgba(var(--trgb), 0.95) 1.6px,
				rgba(var(--trgb), 0) 3px
			),
			linear-gradient(
				158deg,
				rgba(var(--trgb), 0.09) 0%,
				rgba(var(--trgb), 0.025) 38%,
				rgba(var(--trgb), 0.07) 74%,
				rgba(var(--trgb), 0.035) 100%
			);
		padding: clamp(26px, 3.4vw, 48px);
		box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
	}
	.plq-head {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 16px;
		flex-wrap: wrap;
		padding-bottom: 16px;
		margin-bottom: 22px;
		border-bottom: 1px solid rgba(var(--trgb), 0.45);
		font-size: 10px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: rgba(var(--trgb), 0.95);
	}
	.plq-head .no {
		color: rgba(var(--trgb), 0.65);
	}
	.mainex .plq .mx-lede {
		color: rgba(255, 255, 255, 1);
	}
	.mainex[data-c]:not(.side) .plq .mx-quote {
		color: rgba(var(--trgb), 1);
	}
	.mainex.side[data-c] .plq .mx-quote {
		box-shadow: inset 3px 0 0 rgba(var(--trgb), 0.9);
		color: rgba(255, 255, 255, 1);
	}
	.mainex[data-c] .plq .mx-quote .by {
		color: rgba(var(--trgb), 0.8);
	}
	.mainex .plq .mx-stats {
		border-color: rgba(var(--trgb), 0.3);
	}
	.mainex[data-c] .plq .stv {
		color: rgba(var(--trgb), 0.95);
	}
	.mainex[data-c] .plq .stc {
		color: rgba(var(--trgb), 0.7);
	}
	.mainex[data-c] .plq :global(.num) {
		color: rgba(var(--trgb), 0.95);
	}
	.mainex .plq .mx-more {
		border-color: rgba(var(--trgb), 0.55);
		color: rgba(var(--trgb), 0.9);
	}
	.mainex .plq .mx-more:hover {
		border-color: rgba(var(--trgb), 1);
		color: var(--ink);
	}
	.mainex.hasbg {
		position: relative;
		padding: 0;
	}
	.mainex.hasbg::before {
		content: "";
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4px;
		background: rgba(var(--trgb), 1);
		z-index: 2;
	}
	.mx-bg {
		position: relative;
		width: 100%;
		aspect-ratio: 2048/1000;
		overflow: hidden;
		border-radius: 20px;
	}
	.mx-bg img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		filter: grayscale(1) contrast(1.08) brightness(0.86);
	}
	.mx-bg img.color {
		filter: brightness(0.94);
	}
	.mx-bg::after {
		content: "";
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: linear-gradient(
				90deg,
				rgba(0, 0, 0, 0.65) 0%,
				rgba(0, 0, 0, 0) 14%,
				rgba(0, 0, 0, 0) 86%,
				rgba(0, 0, 0, 0.65) 100%
			),
			linear-gradient(
				180deg,
				rgba(0, 0, 0, 0) 38%,
				rgba(0, 0, 0, 0.55) 68%,
				rgba(0, 0, 0, 0.94) 100%
			);
	}
	.mx-overlay {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 3;
		padding: 0 clamp(18px, 4vw, 56px) clamp(22px, 3.4vw, 36px);
	}
	.mx-info {
		padding: clamp(28px, 4vw, 48px) clamp(18px, 4vw, 56px)
			clamp(40px, 5.5vw, 72px);
	}
	.hasbg .mx-hall {
		margin-bottom: 10px;
		color: rgba(255, 255, 255, 0.9);
		text-shadow: 0 2px 16px rgba(0, 0, 0, 0.9);
	}
	.hasbg .mx-title {
		font-size: clamp(30px, 4.6vw, 58px);
		max-width: none;
		white-space: nowrap;
		color: rgba(var(--trgb), 1);
		text-shadow: 0 6px 28px rgba(0, 0, 0, 0.85);
		margin-bottom: 10px;
	}
	.hasbg .mx-date {
		color: rgba(255, 255, 255, 0.85);
		text-shadow: 0 2px 16px rgba(0, 0, 0, 0.9);
	}
	@media (max-width: 480px) {
		.hasbg .mx-title {
			white-space: normal;
			font-size: clamp(22px, 7.2vw, 32px);
		}
	}
	.hasbg .mx-grid {
		grid-template-columns: 1fr;
		justify-content: start;
		align-items: end;
		margin-top: clamp(20px, 3vh, 32px);
	}
	.mx-cred {
		display: none;
		align-self: end;
		padding-bottom: 4px;
		max-width: 32ch;
		font-size: 9.5px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: rgba(255, 255, 255, 1);
		line-height: 1.7;
		text-shadow: 0 1px 12px rgba(0, 0, 0, 0.9);
	}
	@media (max-width: 860px) {
		.hasbg .mx-grid {
			grid-template-columns: 1fr;
		}
		.mx-cred {
			order: 2;
			padding: 14px 0 0;
		}
	}
	.hasbg .plq {
		background-color: rgba(10, 8, 6, 0.82);
		backdrop-filter: blur(12px);
		padding: clamp(34px, 4.5vw, 64px);
	}
	.hasbg .plq-head {
		display: none;
	}
	.hasbg .plq .mx-lede {
		font-size: 15.5px;
		line-height: 1.04;
		max-width: none;
		margin-bottom: 20px;
		color: rgba(255, 255, 255, 1);
	}
	.hasbg .plq .mx-lede::first-letter {
		font-size: 1em;
		float: none;
		padding: 0;
		font-family: inherit;
	}
	.hasbg .plq .mx-quote {
		font-size: 32px;
		line-height: 1;
		padding: 2px 0;
		margin-bottom: 20px;
		max-width: none;
	}
	.hasbg .plq .mx-quote .by {
		margin-top: 8px;
		font-size: 9px;
	}
	.hasbg .plq .mx-more {
		border: 1px solid rgba(var(--trgb), 0.55);
		border-radius: 100px;
		background: rgba(var(--trgb), 0.08);
		padding: 12px 22px;
		font-size: 10.5px;
		letter-spacing: 0.18em;
		gap: 10px;
	}
	.hasbg .plq .mx-more:hover {
		background: rgba(var(--trgb), 0.18);
		border-color: rgba(var(--trgb), 1);
		color: var(--ink);
	}
	.mx-stats {
		
		display: grid;
		grid-template-columns: repeat(3, auto);
		justify-content: start;
		gap: clamp(20px, 3.4vw, 56px);
		border-top: 1px solid var(--line);
		border-bottom: 1px solid var(--line);
		padding: 22px 0;
		margin-bottom: 34px;
	}
	@media (max-width: 640px) {
		.mx-stats {
			grid-template-columns: 1fr;
			gap: 18px;
		}
	}
	@media (max-width: 820px) {
		.mx-info {
			padding-bottom: 86px;
		}
		.mx-cred {
			max-width: 60%;
		}
	}
	@media (max-width: 380px) {
		.break .hallname {
			white-space: normal;
		}
	}
	.mx-stats .stv {
		display: block;
		font-family: "Rhymes Display", serif;
		font-size: clamp(30px, 3.6vw, 48px);
		line-height: 1;
	}
	.mainex.side .mx-stats .stv {
		font-size: clamp(26px, 3.6vw, 44px);
	}
	.mainex[data-c="s"] .stv {
		color: var(--surveillance);
	}
	.mainex[data-c="c"] .stv {
		color: var(--corruption);
	}
	.mainex[data-c="d"] .stv {
		color: var(--debt);
	}
	.mainex[data-c="g"] .stv {
		color: var(--stagnation);
	}
	.mainex[data-c="i"] .stv {
		color: var(--influence);
	}
	.mx-stats .stc {
		
		display: block;
		margin-top: 9px;
		max-width: 24ch;
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
		line-height: 1.6;
	}
	.mx-lede {
		font-family: "Rhymes Display", "Rhymes Text", serif;
		font-weight: 400;
		font-size: clamp(14px, 1.5vw, 17px);
		line-height: 1.04;
		color: var(--ink);
		margin-bottom: 30px;
		max-width: 62ch;
	}
	.mainex:not(.side) .mx-lede {
		font-family:
			"Public Sans",
			system-ui,
			-apple-system,
			sans-serif;
		font-weight: 400;
		line-height: 1.16;
	}
	.mx-lede::first-letter {
		font-family: "Rhymes Display", serif;
		font-size: 3.1em;
		line-height: 0.8;
		float: left;
		padding: 8px 12px 0 0;
	}
	.mx-quote {
		margin: 0 0 34px;
		padding: 6px 0;
		max-width: 44ch;
		font-family: "Rhymes Text", serif;
		font-size: clamp(45.6px, 5.28vw, 67.2px);
		line-height: 1.35;
		color: rgba(255, 255, 255, 1);
	}
	.mainex.side[data-c="s"] .mx-quote {
		box-shadow: inset 3px 0 0 var(--surveillance);
	}
	.mainex.side[data-c="c"] .mx-quote {
		box-shadow: inset 3px 0 0 var(--corruption);
	}
	.mainex.side[data-c="d"] .mx-quote {
		box-shadow: inset 3px 0 0 var(--debt);
	}
	.mainex.side[data-c="g"] .mx-quote {
		box-shadow: inset 3px 0 0 var(--stagnation);
	}
	.mainex.side[data-c="i"] .mx-quote {
		box-shadow: inset 3px 0 0 var(--influence);
	}
	.mx-quote .by {
		display: block;
		margin-top: 12px;
		font-family: "Fira Code", ui-monospace, monospace;
		font-style: normal;
		font-size: 10px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--muted);
	}
	.mx-more {
		display: inline-flex;
		align-items: center;
		gap: 14px;
		cursor: pointer;
		font-family: "Fira Code", ui-monospace, monospace;
		font-size: 12px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--muted);
		background: none;
		border: 1px dashed var(--line-strong);
		padding: 14px 22px;
		transition:
			color 0.25s,
			border-color 0.25s;
	}
	.mx-more:hover {
		color: var(--ink);
		border-color: var(--ink);
	}
	.mx-more .pm {
		color: var(--faint);
	}
	.mainex[data-c="s"] :global(.num) {
		color: var(--surveillance);
	}
	.mainex[data-c="c"] :global(.num) {
		color: var(--corruption);
	}
	.mainex[data-c="d"] :global(.num) {
		color: var(--debt);
	}
	.mainex[data-c="g"] :global(.num) {
		color: var(--stagnation);
	}
	.mainex[data-c="i"] :global(.num) {
		color: var(--influence);
	}
	.loader {
		padding: 60px;
		text-align: center;
		font-size: 11px;
		letter-spacing: 0.22em;
		text-transform: uppercase;
		color: var(--faint);
	}
	.loader .blink {
		animation: m-bl 1.1s steps(2) infinite;
	}
	@keyframes m-bl {
		50% {
			opacity: 0;
		}
	}
	.loader-ctas {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
		gap: 12px;
	}
	.loader-cta {
		display: inline-flex;
		align-items: center;
		font-family: "Fira Code", ui-monospace, monospace;
		font-size: 10.5px;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--ink);
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid var(--line-strong);
		border-radius: 100px;
		padding: 12px 22px;
		text-decoration: none;
		transition:
			background-color 0.25s,
			border-color 0.25s;
	}
	.loader-cta:hover {
		background: rgba(255, 255, 255, 0.14);
		border-color: var(--ink);
	}
	.progress {
		position: fixed;
		left: 0;
		top: 0;
		height: 2px;
		width: 0;
		background: var(--corruption);
		z-index: 55;
		opacity: 0.7;
	}
	.hallbar {
		position: fixed;
		top: 58px;
		z-index: 110;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: "Fira Code", ui-monospace, monospace;
		font-weight: 500;
		font-size: 11px;
		letter-spacing: 0.2em;
		text-transform: uppercase;
		color: var(--logos-ink);
		overflow: hidden;
		white-space: nowrap;
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 0.3s ease,
			width 0.45s cubic-bezier(0.16, 1, 0.3, 1),
			left 0.45s cubic-bezier(0.16, 1, 0.3, 1),
			border-radius 0.45s cubic-bezier(0.16, 1, 0.3, 1),
			background-color 0.3s ease;
	}
	.hallbar.show {
		opacity: 1;
	}
	.hallbar[data-c="s"] {
		background: var(--surveillance);
	}
	.hallbar[data-c="c"] {
		background: var(--corruption);
	}
	.hallbar[data-c="d"] {
		background: var(--debt);
	}
	.hallbar[data-c="g"] {
		background: var(--stagnation);
		color: var(--logos-off);
	}
	.hallbar[data-c="i"] {
		background: var(--influence);
	}
	@media (max-width: 680px) {
		.hallbar {
			top: 52px;
			height: 38px;
			font-size: 10px;
			letter-spacing: 0.14em;
		}
	}
	.threshold-flash {
		position: fixed;
		inset: 0;
		z-index: 80;
		background: #000;
		opacity: 0;
		pointer-events: none;
		transition: opacity 1.1s ease;
	}
	.threshold-flash.hit {
		opacity: 0.5;
		transition: opacity 0.15s ease;
	}
	@keyframes m-glassBreath {
		0%,
		100% {
			filter: brightness(1);
		}
		50% {
			filter: brightness(1.045);
		}
	}
	.f-front {
		animation: m-glassBreath 9s ease-in-out infinite;
	}
	.f-front::after {
		background-size: 250% 250%;
		background-position: 0% 0%;
		transition:
			background-position 1.6s cubic-bezier(0.16, 1, 0.3, 1),
			opacity 0.6s;
	}
	.cube:hover .f-front::after {
		background-position: 100% 100%;
		opacity: 1.3;
	}
	.exhibit {
		position: relative;
	}
	.exhibit::before {
		content: "";
		position: absolute;
		left: 8%;
		right: 8%;
		bottom: -16px;
		height: 20px;
		background: radial-gradient(
			closest-side,
			rgba(0, 0, 0, 0.6),
			rgba(0, 0, 0, 0) 74%
		);
		transform: scaleY(0.4);
		z-index: -1;
		pointer-events: none;
	}
	@keyframes m-hereGlow {
		0%,
		100% {
			opacity: 0.75;
		}
		50% {
			opacity: 1;
		}
	}
	.mm-room.active .floor {
		animation: m-hereGlow 2.4s ease-in-out infinite;
	}
	.mote {
		position: absolute;
		width: 3px;
		height: 3px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.55);
		pointer-events: none;
		opacity: 0;
		animation: m-moteDrift linear infinite;
	}
	@keyframes m-moteDrift {
		0% {
			opacity: 0;
			transform: translate(0, 0);
		}
		8% {
			opacity: 0.5;
		}
		92% {
			opacity: 0.4;
		}
		100% {
			opacity: 0;
			transform: translate(var(--mx, 20px), -140px);
		}
	}
	.herobg video {
		will-change: transform;
	}

	
	@media (max-width: 680px) {
		.break h2 {
			font-size: 15px;
		}
		.mx-title :global(.mbr) {
			display: inline;
		}
	}
</style>
