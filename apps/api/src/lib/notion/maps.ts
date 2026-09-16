/**
 * Option-id → label maps for the funnel intake, plus the two constant Notion
 * values every submission is written with.
 *
 * The maps are the option lists `apps/web` renders the dropdowns from, keyed by
 * id. They live in `@repo/funnel` so a submitted id always resolves to the label
 * the visitor actually picked. `SKILLS_MAP` labels double as the options of the
 * Notion `Skills` multi_select and `HEAR_ABOUT_MAP` labels as those of the
 * select named by `HEAR_ABOUT_QUESTION`, so renaming one means renaming the
 * option in Notion first -- see docs/funnel/AGENTS.md.
 */

export {
  CHAT_SERVICE_MAP,
  COUNTRY_MAP,
  HEAR_ABOUT_MAP,
  HEAR_ABOUT_QUESTION,
  SKILLS_MAP,
} from '@repo/funnel'

export const MVMT_STATUS_NEW_LEAD = 'New Lead'

export const BU_MOVEMENT = 'Movement'
