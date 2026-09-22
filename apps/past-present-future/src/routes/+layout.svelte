<script>
	import '../app.css';
	import { page } from '$app/state';
	import Nav from '$lib/components/Nav.svelte';

	let { children } = $props();

	const chapters = $derived(!page.url.pathname.endsWith('/museum-of-civil-liberties'));

	
	
	const isChoices = $derived(page.url.pathname.includes('/past-present-future/choices'));
	const siteOrigin = 'https://logos.co';
	const ogImage = $derived(
		siteOrigin +
			(page.url.pathname.endsWith('/museum-of-civil-liberties')
				? '/past-present-future/og-museum.jpg'
				: isChoices
					? '/past-present-future/choices/og.png'
					: '/past-present-future/og.jpg')
	);
	const ogSize = $derived(isChoices ? { w: '1200', h: '630', type: 'image/png' } : { w: '2400', h: '1260', type: 'image/jpeg' });
	const canonical = $derived(siteOrigin + page.url.pathname);

	const ogTitle = $derived(isChoices ? 'Life’s Choices · Experience the Present' : 'Past. Present. Future.');
	const ogDesc = $derived(
		isChoices
			? 'Six life choices starting as a UK student. Choose a life to live.'
			: 'This is a Logos project to examine where society has been. Make a choice. Remain. Or exit with us.'
	);
</script>

<svelte:head>
	<link rel="canonical" href={canonical} />
	<meta property="og:type" content="website" />
	<meta property="og:site_name" content="Logos — Past · Present · Future" />
	<meta property="og:url" content={canonical} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDesc} />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDesc} />
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content={ogSize.w} />
	<meta property="og:image:height" content={ogSize.h} />
	<meta property="og:image:type" content={ogSize.type} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:image" content={ogImage} />
</svelte:head>

<Nav {chapters} />

{@render children()}
