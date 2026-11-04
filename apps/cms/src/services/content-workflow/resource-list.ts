import {
  builderResourcesFileSchema,
  circleResourcesFileSchema,
  type BuilderResourceLocale,
} from '@repo/content/schemas'
import type { FileChange } from '@repo/content/github'
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
  return ({
    doc,
    previousDoc,
    payload,
    req,
    editor,
  }: SaveContentAsPullRequestInput<ResourceDoc>) => {
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
      resourceList: resourceListEdit(type, doc, operation, previousDoc?.slug),
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
