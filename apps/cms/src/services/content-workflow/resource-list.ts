import {
  builderResourceLocaleSchema,
  builderResourcesFileSchema,
  circleResourcesFileSchema,
  type BuilderResourceLocale,
} from '@repo/content/schemas'
import type { FileChange } from '@repo/content/github'
import { prepareResourceRename } from './resource-recovery'
import { toJsonFileChange } from './fixture-helpers'
import {
  saveAsPullRequest,
  createContentUpdateSubject,
  createContentDeleteSubject,
  createContentUpdatePrBody,
  createContentDeletePrBody,
  type SaveContentAsPullRequestInput,
} from './save-as-pr'

export type ResourceDoc = BuilderResourceLocale
type ResourceType = 'builder-resource' | 'circle-resource'
const lists = {
  'builder-resource': {
    schema: builderResourcesFileSchema,
    path: 'content/builders-hub/resources/en.json',
    label: 'Builder resource',
  },
  'circle-resource': {
    schema: circleResourcesFileSchema,
    path: 'content/circles/resources/en.json',
    label: 'Circle resource',
  },
}

export function resourceListEdit(
  type: ResourceType,
  doc: ResourceDoc,
  operation: 'upsert' | 'delete',
  previousSlug?: string
) {
  const { schema, path } = lists[type]
  return {
    path,
    apply(parent: unknown): FileChange {
      const file = schema.parse(parent)
      const items = file.items.filter(
        (item) => item.slug !== doc.slug && item.slug !== previousSlug
      )
      if (operation === 'upsert') items.push(doc)
      items.sort((a, b) => a.slug.localeCompare(b.slug))
      return toJsonFileChange(path, schema.parse({ ...file, items }))
    },
  }
}

export function resourceSaver(
  type: ResourceType,
  operation: 'upsert' | 'delete',
  save = saveAsPullRequest
) {
  return async ({
    doc,
    previousDoc,
    payload,
    req,
    editor,
  }: SaveContentAsPullRequestInput<ResourceDoc & { id: string | number }>) => {
    const deleting = operation === 'delete'
    const list = lists[type]
    const subject = (
      deleting ? createContentDeleteSubject : createContentUpdateSubject
    )({ scope: type, slug: doc.slug })
    return save({
      payload,
      req,
      editor,
      contentType: type,
      resourceList: {
        path: list.path,
        async prepare(parent, activeReq) {
          const file = list.schema.parse(parent)
          const rename = await prepareResourceRename(activeReq, {
            list: type,
            id: doc.id,
            slugs: file.items.map((item) => item.slug),
            previous: previousDoc?.slug ?? doc.slug,
            requested: doc.slug,
            deleting,
          })
          let resource = builderResourceLocaleSchema.parse(doc)
          const published =
            rename.recovering &&
            file.items.find((item) => item.slug === rename.source)
          if (published && previousDoc && !deleting) {
            const edits = Object.fromEntries(
              Object.entries(resource).filter(
                ([field, value]) =>
                  previousDoc[field as keyof ResourceDoc] !== value
              )
            )
            resource = builderResourceLocaleSchema.parse({
              ...published,
              ...edits,
              slug: rename.target,
            })
          }
          resource = {
            ...resource,
            slug: deleting ? rename.source : rename.target,
          }
          if (!deleting && rename.recovering) {
            await payload.db.updateOne({
              collection:
                type === 'builder-resource'
                  ? 'builder-resources'
                  : 'circle-resources',
              id: doc.id,
              data: resource,
              req: activeReq,
              returning: false,
            })
          }
          return {
            resource,
            clearRename: rename.clear,
            change: resourceListEdit(
              type,
              resource,
              operation,
              rename.source
            ).apply(file),
          }
        },
      },
      commitMessage: subject,
      prTitle: subject,
      draft: true,
      prBody: (deleting
        ? createContentDeletePrBody
        : createContentUpdatePrBody)({
        displayName: doc.title,
        contentLabel: list.label,
        details: [
          `- updates: \`${list.path}\``,
          `- ${deleting ? 'removes' : 'slug'}: \`${doc.slug}\``,
        ],
      }),
    })
  }
}
