import type { MusterCopySection } from '@repo/content/schemas'

import { Paragraphs } from './shared'

type ArchitectureCopy = MusterCopySection['architecture']
type NodeCopy = ArchitectureCopy['basecamp']['core']

function DiagramNode({ node }: { node: NodeCopy }) {
  return (
    <div className="muster-diagram-node">
      <dt>{node.title}</dt>
      <dd>{node.body}</dd>
    </div>
  )
}

function DiagramColumn({ group }: { group: ArchitectureCopy['reach'] }) {
  return (
    <div className="muster-diagram-side">
      <h3 className="muster-mono">{group.label}</h3>
      <dl>
        {group.nodes.map((node) => (
          <DiagramNode key={node.title} node={node} />
        ))}
      </dl>
    </div>
  )
}

export function Architecture({ copy }: { copy: ArchitectureCopy }) {
  const { basecamp } = copy

  return (
    <section className="muster-section muster-grey">
      <div className="muster-container">
        <div className="muster-split muster-section-intro">
          <h2 className="muster-heading">{copy.title}</h2>
          <Paragraphs body={copy.body} />
        </div>
        <figure className="muster-architecture" data-muster-reveal>
          <div className="muster-diagram">
            <DiagramColumn group={copy.dependencies} />
            <div className="muster-diagram-centre">
              <h3 className="muster-mono">{basecamp.label}</h3>
              <div className="muster-diagram-boundary">
                <h4 className="muster-mono">{basecamp.musterLabel}</h4>
                <dl>
                  <DiagramNode node={basecamp.interface} />
                  <DiagramNode node={basecamp.core} />
                </dl>
              </div>
              <div className="muster-handoff">
                <h4 className="muster-mono">{basecamp.handoffLabel}</h4>
                <span className="muster-handoff-lines" aria-hidden="true" />
                <dl className="muster-handoff-nodes">
                  <DiagramNode node={basecamp.wallet} />
                  <DiagramNode node={basecamp.app} />
                </dl>
              </div>
            </div>
            <DiagramColumn group={copy.reach} />
          </div>
          <figcaption className="muster-mono">{copy.caption}</figcaption>
        </figure>
      </div>
    </section>
  )
}
