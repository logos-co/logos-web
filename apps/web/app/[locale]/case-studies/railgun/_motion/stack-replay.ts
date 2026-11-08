import { compactLayout, readLabels, type MotionScope } from './scope'

export function mountStackReplay(scope: MotionScope) {
  const { select, reduced, signal } = scope
  const button = select<HTMLButtonElement>('#playbtn')
  const status = select('#playst')
  const label = select('#playlab')
  const labels = readLabels(label, 'steps')
  const cols = select('#cols')
  const fig = select('.fig')
  const wallet = select('#n-wallet')
  const client = select('#n-client')
  const topics = select('#n-topics')
  const service = select('#n-service')
  const poi = select('#n-poi')
  const account = select('#n-0x')
  const contracts = select('#n-contracts')
  const delivery = select('#c1')
  const broadcaster = select('#c2')
  const proof = select('#va')
  const poiData = select('#vb')
  const gas = select('#vc')
  const submit = select('#v3')

  const wait = (ms: number) =>
    new Promise<void>((resolve) => {
      if (signal.aborted || reduced) {
        resolve()
        return
      }
      const stop = () => {
        window.clearTimeout(timer)
        signal.removeEventListener('abort', stop)
        resolve()
      }
      const timer = scope.timeout(stop, ms)
      signal.addEventListener('abort', stop, { once: true })
    })

  async function travel(
    connector: HTMLElement,
    direction: number,
    duration: number
  ) {
    if (reduced || signal.aborted) return
    const packet = connector.querySelector<HTMLElement>('.pkt')
    if (!packet) return
    const local = connector.matches('.vconn, .vgap')
    const vertical = local || compactLayout()
    const distance = Math.max(
      0,
      vertical
        ? connector.clientHeight - (local ? 4 : 12)
        : connector.clientWidth - 12
    )
    const axis = vertical ? 'Y' : 'X'
    const spread =
      compactLayout() && connector.classList.contains('vgap')
        ? Math.max(0, (46 - distance) / 2)
        : 0
    const ends = [-spread, distance + spread]
    const [from, to] = direction > 0 ? ends : [ends[1], ends[0]]
    const motion = packet.animate(
      [
        { transform: `translate${axis}(${from}px)`, opacity: 1 },
        { transform: `translate${axis}(${to}px)`, opacity: 1 },
      ],
      { duration, easing: 'linear' }
    )
    await new Promise<void>((resolve) => {
      motion.addEventListener('finish', () => resolve(), { once: true })
      motion.addEventListener('cancel', () => resolve(), { once: true })
    })
  }

  const hot = (node: HTMLElement, active: boolean) =>
    node.classList.toggle('hot', active)
  async function hop(
    from: HTMLElement,
    connector: HTMLElement,
    direction: number,
    to: HTMLElement
  ) {
    hot(from, true)
    await wait(120)
    await travel(connector, direction, 520)
    hot(from, false)
    hot(to, true)
    await wait(80)
    hot(to, false)
  }

  function step(index: number) {
    status.textContent = `${index} / 4`
    label.textContent = labels[index - 1]
  }

  async function play() {
    if (button.disabled) return
    button.disabled = true

    step(1)
    await hop(service, broadcaster, -1, topics)
    await hop(topics, delivery, -1, client)
    await wait(260)
    if (signal.aborted) return

    step(2)
    hot(wallet, true)
    await travel(proof, 1, 300)
    hot(wallet, false)
    await hop(client, delivery, 1, topics)
    await hop(topics, broadcaster, 1, service)
    await wait(260)
    hot(poi, true)
    await travel(poiData, 1, 300)
    hot(poi, false)
    hot(service, true)
    await wait(160)
    hot(service, false)
    if (signal.aborted) return

    step(3)
    await travel(gas, 1, 300)
    hot(account, true)
    await wait(120)
    await travel(submit, 1, 520)
    hot(account, false)
    hot(contracts, true)
    await wait(360)
    hot(contracts, false)
    await wait(160)
    if (signal.aborted) return

    step(4)
    await hop(service, broadcaster, -1, topics)
    await hop(topics, delivery, -1, client)
    hot(wallet, true)
    await wait(400)
    hot(wallet, false)

    status.textContent = ''
    label.textContent = label.dataset.rest ?? ''
    button.disabled = false
  }

  button.addEventListener('click', play, { signal })
  if (!reduced) {
    scope
      .observe(
        ([entry], observer) => {
          if (!entry.isIntersecting) return
          void play()
          observer.disconnect()
        },
        { threshold: 0.5 }
      )
      .observe(cols)
  }

  return function layout() {
    for (const [connector, node] of [
      [delivery, client],
      [broadcaster, service],
    ]) {
      const rect = node.getBoundingClientRect()
      connector.style.setProperty(
        '--cy',
        `${Math.round(rect.top + rect.height / 2 - connector.getBoundingClientRect().top)}px`
      )
    }
    const bounds = fig.getBoundingClientRect()
    const from = account.getBoundingClientRect()
    const to = contracts.getBoundingClientRect()
    const compact = compactLayout()
    const start = compact ? cols.getBoundingClientRect().bottom : from.bottom
    const end = compact ? select('#chain').getBoundingClientRect().top : to.top
    submit.style.left = `${compact ? 48 : Math.round(from.left - bounds.left + 40)}px`
    submit.style.top = `${Math.round(start - bounds.top)}px`
    submit.style.height = `${Math.round(end - start)}px`
  }
}
