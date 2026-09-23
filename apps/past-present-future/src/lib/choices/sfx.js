let actx = null

export function initAudio() {
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)()
    if (actx.state === 'suspended') actx.resume()
  } catch (e) {}
}

export function printLineSfx() {
  if (!actx) return
  const t = actx.currentTime,
    dur = 0.07
  const master = actx.createGain()
  master.gain.value = 0.0001
  master.connect(actx.destination)
  master.gain.linearRampToValueAtTime(0.22, t + 0.005)
  master.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.01)
  const o = actx.createOscillator()
  o.type = 'square'
  o.frequency.setValueAtTime(1720, t)
  o.frequency.linearRampToValueAtTime(1440, t + dur)
  const og = actx.createGain()
  og.gain.value = 0.5
  const lfo = actx.createOscillator()
  lfo.type = 'square'
  lfo.frequency.value = 95
  const lg = actx.createGain()
  lg.gain.value = 0.45
  lfo.connect(lg)
  lg.connect(og.gain)
  o.connect(og)
  og.connect(master)
  const bs = Math.floor(actx.sampleRate * dur),
    buf = actx.createBuffer(1, bs, actx.sampleRate),
    d = buf.getChannelData(0)
  for (let i = 0; i < bs; i++) d[i] = (Math.random() * 2 - 1) * 0.4
  const nz = actx.createBufferSource()
  nz.buffer = buf
  const nf = actx.createBiquadFilter()
  nf.type = 'bandpass'
  nf.frequency.value = 2700
  nf.Q.value = 3
  const ng = actx.createGain()
  ng.gain.value = 0.5
  nz.connect(nf)
  nf.connect(ng)
  ng.connect(master)
  const low = actx.createOscillator()
  low.type = 'sine'
  low.frequency.value = 150
  const lowg = actx.createGain()
  lowg.gain.setValueAtTime(0.0001, t)
  lowg.gain.linearRampToValueAtTime(0.11, t + 0.004)
  lowg.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  low.connect(lowg)
  lowg.connect(actx.destination)
  o.start(t)
  lfo.start(t)
  nz.start(t)
  low.start(t)
  o.stop(t + dur + 0.02)
  lfo.stop(t + dur + 0.02)
  nz.stop(t + dur + 0.02)
  low.stop(t + 0.06)
}

export function typeTick() {
  if (!actx) return
  const t = actx.currentTime
  const o = actx.createOscillator()
  o.type = 'square'
  o.frequency.value = 1500 + Math.random() * 400
  const g = actx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.12, t + 0.004)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05)
  o.connect(g)
  g.connect(actx.destination)
  o.start(t)
  o.stop(t + 0.06)
}
