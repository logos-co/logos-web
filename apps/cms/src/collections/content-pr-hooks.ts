import type {
  CollectionAfterChangeHook,
  CollectionBeforeChangeHook,
  CollectionBeforeDeleteHook,
  Payload,
  User,
} from 'payload'

import type {
  SaveAsPullRequestResult,
  SaveContentAsPullRequestInput,
  SavePrEditor,
} from '@/services/content-workflow'

import { lockResourceRecord } from '@/services/content-workflow/content-transaction'

export const SKIP_CONTENT_PR_CONTEXT = 'skipContentPr'

type FindByIdCollection = Parameters<Payload['findByID']>[0]['collection']

interface CreateChangePullRequestHookInput<TDoc> {
  save: (
    input: SaveContentAsPullRequestInput<TDoc>
  ) => Promise<SaveAsPullRequestResult>
}

interface CreateDeletePullRequestHookInput<
  TDoc,
> extends CreateChangePullRequestHookInput<TDoc> {
  collection: FindByIdCollection
}

const getEditor = (user: User): SavePrEditor => ({
  email: typeof user.email === 'string' ? user.email : undefined,
  payloadUserId: user.id,
})

const shouldSkipContentPr = (context: Record<string, unknown>): boolean =>
  context[SKIP_CONTENT_PR_CONTEXT] === true

// Take the same record lock before an update locks the row or a deletion locks the list.
export const lockResourceBeforeChange: CollectionBeforeChangeHook = async ({
  collection,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'update')
    await lockResourceRecord(req, collection.slug, originalDoc.id)
}

export const lockResourceBeforeDelete: CollectionBeforeDeleteHook = async ({
  collection,
  id,
  req,
}) => {
  await lockResourceRecord(req, collection.slug, id)
}

export const createChangePullRequestHook =
  <TDoc>({
    save,
  }: CreateChangePullRequestHookInput<TDoc>): CollectionAfterChangeHook =>
  async ({ context, doc, previousDoc, req }) => {
    if (shouldSkipContentPr(context) || !req.user) return doc

    await save({
      doc: doc as TDoc,
      previousDoc: previousDoc as TDoc | undefined,
      payload: req.payload,
      req,
      editor: getEditor(req.user),
    })

    return doc
  }

export const createDeletePullRequestHook =
  <TDoc>({
    collection,
    save,
  }: CreateDeletePullRequestHookInput<TDoc>): CollectionBeforeDeleteHook =>
  async ({ context, id, req }) => {
    if (shouldSkipContentPr(context) || !req.user) return

    const doc = (await req.payload.findByID({
      collection,
      id,
      req,
      depth: 0,
    })) as TDoc

    await save({
      doc,
      payload: req.payload,
      req,
      editor: getEditor(req.user),
    })
  }
