import { z } from 'zod'

/**
 * Section keys mirror Figma section keys (e.g. "home.atf", "home.techStack",
 * "buildersHub.heroSection"). The shape is intentionally permissive because
 * design naming evolves.
 */
export const sectionKeySchema = z.string().min(1)
