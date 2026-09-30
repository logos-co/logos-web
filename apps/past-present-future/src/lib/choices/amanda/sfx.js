let actx = null,
	bus = null,
	noiseBuf = null;

export function initAudio() {
	try {
		if (!actx) {
			actx = new (window.AudioContext || window.webkitAudioContext)();
			const hp = actx.createBiquadFilter();
			hp.type = 'highpass';
			hp.frequency.value = 140;
			const comp = actx.createDynamicsCompressor();
			comp.threshold.value = -20;
			comp.knee.value = 20;
			comp.ratio.value = 8;
			comp.attack.value = 0.002;
			comp.release.value = 0.14;
			bus = actx.createGain();
			bus.gain.value = 0.9;
			bus.connect(hp);
			hp.connect(comp);
			comp.connect(actx.destination);
			const n = Math.floor(actx.sampleRate * 1.2);
			noiseBuf = actx.createBuffer(1, n, actx.sampleRate);
			const d = noiseBuf.getChannelData(0);
			for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
		}
		if (actx.state === 'suspended') actx.resume();
	} catch (e) {}
}

function env(g, t, peak, atk, dec) {
	g.gain.setValueAtTime(0.0001, t);
	g.gain.linearRampToValueAtTime(peak, t + atk);
	g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
}

function nz(t, freq, q, peak, dur, type) {
	if (!actx) return;
	const s = actx.createBufferSource();
	s.buffer = noiseBuf;
	s.loop = true;
	const f = actx.createBiquadFilter();
	f.type = type || 'bandpass';
	f.frequency.value = freq;
	f.Q.value = q;
	const g = actx.createGain();
	env(g, t, peak, 0.001, dur);
	s.connect(f);
	f.connect(g);
	g.connect(bus);
	s.start(t);
	s.stop(t + dur + 0.06);
}

function tone(t, freq, peak, dur, type, detune) {
	if (!actx) return;
	const o = actx.createOscillator();
	o.type = type || 'triangle';
	o.frequency.value = freq;
	if (detune) o.detune.value = detune;
	const g = actx.createGain();
	env(g, t, peak, 0.0015, dur);
	o.connect(g);
	g.connect(bus);
	o.start(t);
	o.stop(t + dur + 0.06);
}

const SCALE = [0, 2, 3, 7, 10, 12, 14, 15];

export function sfxData(step, vel) {
	if (!actx) return;
	const t = actx.currentTime,
		v = vel == null ? 1 : vel;
	const f = 740 * Math.pow(2, SCALE[(step || 0) % SCALE.length] / 12);
	nz(t, 3400, 7, 0.05 * v, 0.02);
	tone(t + 0.004, f, 0.048 * v, 0.055, 'triangle');
	tone(t + 0.004, f * 2, 0.014 * v, 0.032, 'square');
	tone(t, 104, 0.028 * v, 0.045, 'sine');
}

export function sfxKey() {
	if (!actx) return;
	const t = actx.currentTime;
	nz(t, 2100 + Math.random() * 900, 2.2, 0.026, 0.011);
	nz(t, 5600, 1.2, 0.01, 0.007, 'highpass');
}

export function sfxSweep(dur) {
	if (!actx) return;
	const t = actx.currentTime,
		D = dur || 1.0;
	const s = actx.createBufferSource();
	s.buffer = noiseBuf;
	s.loop = true;
	const f = actx.createBiquadFilter();
	f.type = 'bandpass';
	f.Q.value = 3.2;
	f.frequency.setValueAtTime(420, t);
	f.frequency.exponentialRampToValueAtTime(5200, t + D);
	const g = actx.createGain();
	g.gain.setValueAtTime(0.0001, t);
	g.gain.linearRampToValueAtTime(0.028, t + 0.12);
	g.gain.setValueAtTime(0.028, t + D * 0.72);
	g.gain.exponentialRampToValueAtTime(0.0001, t + D + 0.12);
	s.connect(f);
	f.connect(g);
	g.connect(bus);
	s.start(t);
	s.stop(t + D + 0.25);
	tone(t, 58, 0.048, 0.22, 'sine');
	nz(t, 1800, 4, 0.038, 0.03);
}

export function sfxRoll(dur, n) {
	if (!actx) return;
	const t = actx.currentTime,
		N = n || 10,
		D = dur || 1.0;
	for (let i = 0; i < N; i++) {
		const k = i / N;
		nz(t + D * (1 - Math.pow(1 - k, 2.2)), 4200 + Math.random() * 1800, 3, 0.013 * (1 - k * 0.6), 0.008);
	}
}

export function sfxAlert() {
	if (!actx) return;
	const t = actx.currentTime;
	tone(t, 146.8, 0.032, 0.3, 'sawtooth', -5);
	tone(t + 0.006, 207.6, 0.026, 0.26, 'sawtooth', 7);
	nz(t, 900, 5, 0.018, 0.05);
}

export function sfxArm() {
	if (!actx) return;
	const t = actx.currentTime;
	tone(t, 73.4, 0.055, 0.34, 'sine');
	nz(t, 1200, 3, 0.026, 0.06);
	nz(t + 0.09, 3000, 6, 0.016, 0.02);
}

export function sfxCommit() {
	if (!actx) return;
	const t = actx.currentTime;
	nz(t, 2600, 5, 0.045, 0.018);
	tone(t + 0.004, 523.3, 0.042, 0.05, 'triangle');
	tone(t + 0.1, 392.0, 0.038, 0.09, 'triangle');
	tone(t + 0.1, 98, 0.034, 0.14, 'sine');
}
