'use client'

import { useState } from 'react'

import { useNodeProbes, type NodeProbe } from '@/components/use-node-probes'
import { SkeletonCard, SkeletonLine, SkeletonStat } from '@/components/skeleton'
import { useStorageFleet } from '@/components/use-storage-fleet'
import type { FleetName, StorageNode } from '@/lib/storage-fleet'
import {
  countByRole,
  FLEETS,
  groupByRegion,
  shortenKey,
} from '@/lib/storage-fleet'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-label text-gray-05">{label}</dt>
      <dd className="text-mono-body break-all text-gray-06">
        {value || 'not published'}
      </dd>
    </div>
  )
}

/**
 * Reachability as checked by echo.codex.storage, which sits outside the source
 * filter these nodes apply. A browser sees `refused` for the same port, so the
 * answer here is about the node, not about the viewer.
 */
function Reachability({ isReachable }: { isReachable: boolean | null }) {
  if (isReachable === null) return <SkeletonLine className="w-20" />
  return (
    <span className={isReachable ? 'text-brand-dark-green' : 'text-gray-05'}>
      {isReachable ? 'answering' : 'no answer'}
    </span>
  )
}

/**
 * A field whose value is still being looked up.
 *
 * The roster arrives before the geolocation does, so these two rows would sit
 * empty and then fill in. A placeholder the height of the value keeps the card
 * from growing under the reader.
 */
function PendingField({
  label,
  value,
}: {
  label: string
  value: string | undefined | null | false
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-label text-gray-05">{label}</dt>
      <dd className="text-mono-body break-all text-gray-06">
        {value || <SkeletonLine className="w-32" />}
      </dd>
    </div>
  )
}

function NodeCard({ node, probe }: { node: StorageNode; probe?: NodeProbe }) {
  const location = probe?.location

  return (
    <article className="flex flex-col gap-3 border border-gray-01 bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-h4-sans text-brand-dark-green">{node.name}</span>
        <span className="text-body-sans text-gray-05">role {node.role}</span>
      </div>
      <dl className="flex flex-col gap-2">
        <PendingField
          label="Located"
          value={
            location &&
            [location.city, location.country].filter(Boolean).join(', ')
          }
        />
        <PendingField label="Network" value={location?.asnOrg} />
        <Field label="Peer id" value={shortenKey(node.peerId)} />
        <Field label="Address" value={`${node.address}:${node.port}`} />
        <Field
          label="Mix relay"
          value={node.mixPubKey ? 'yes' : 'no mix key published'}
        />
        <div className="flex flex-col gap-0.5">
          <dt className="text-label text-gray-05">Port {node.port}</dt>
          <dd className="text-mono-body">
            <Reachability isReachable={probe?.isReachable ?? null} />
          </dd>
        </div>
      </dl>
    </article>
  )
}

/**
 * The roster's shape while it is being fetched.
 *
 * Six nodes across three regions is what both published fleets hold, so the
 * placeholder is that size: the page settles into the same layout instead of
 * jumping when the answer lands.
 */
function RosterSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Reading the roster"
      className="flex flex-col gap-6"
    >
      <dl className="grid grid-cols-2 gap-5 border border-gray-01 bg-white p-5 sm:grid-cols-4">
        {['Nodes', 'Regions', 'Mix relays', 'Roles'].map((label) => (
          <SkeletonStat key={label} label={label} />
        ))}
      </dl>

      {Array.from({ length: 2 }, (_, group) => (
        <section key={group} className="flex flex-col gap-3">
          <SkeletonLine className="text-label w-40" />
          <div className="grid gap-3 sm:grid-cols-2">
            <SkeletonCard lines={4} />
            <SkeletonCard lines={4} />
          </div>
        </section>
      ))}
    </div>
  )
}

export function StorageNetwork() {
  const [fleet, setFleet] = useState<FleetName>('logos-test')
  const { nodes, isLoading, error } = useStorageFleet(fleet)
  const probes = useNodeProbes(nodes)

  const regions = groupByRegion(nodes)
  const roles = countByRole(nodes)
  const mixCapable = nodes.filter((node) => node.mixPubKey).length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {FLEETS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => setFleet(name)}
            className={`text-body-sans cursor-pointer border px-3 py-1.5 ${
              name === fleet
                ? 'border-brand-dark-green bg-brand-dark-green text-brand-off-white'
                : 'border-gray-01 bg-white text-gray-06 hover:border-gray-02'
            }`}
          >
            {name.replace('-', '.')}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="text-body-sans text-accent-purple">
          {error}
        </p>
      )}

      {isLoading && nodes.length === 0 && !error && <RosterSkeleton />}

      {nodes.length > 0 && (
        <>
          <dl className="grid grid-cols-2 gap-5 border border-gray-01 bg-white p-5 sm:grid-cols-4">
            <div className="flex flex-col gap-1">
              <dt className="text-label text-gray-05">Nodes</dt>
              <dd className="text-h4-sans text-brand-dark-green">
                {nodes.length}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label text-gray-05">Regions</dt>
              <dd className="text-h4-sans text-brand-dark-green">
                {regions.length}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label text-gray-05">Mix relays</dt>
              <dd className="text-h4-sans text-brand-dark-green">
                {mixCapable}
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-label text-gray-05">Roles</dt>
              <dd className="text-h4-sans text-brand-dark-green">
                {Object.entries(roles)
                  .map(([role, count]) => `${count} ${role}`)
                  .join(', ')}
              </dd>
            </div>
          </dl>

          {regions.map(({ region, nodes: group }) => (
            <section key={region} className="flex flex-col gap-3">
              <h2 className="text-label text-gray-05">
                {region} ({group.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.map((node) => (
                  <NodeCard
                    key={node.host}
                    node={node}
                    probe={probes[node.host]}
                  />
                ))}
              </div>
            </section>
          ))}
        </>
      )}

      <p className="text-body-sans text-gray-05">
        Read from the roster published at fleets.logos.co. This shows who runs
        the network, not its contents: a browser cannot join Logos Storage, so
        there is nothing here to upload a file to.
      </p>
    </div>
  )
}
