// Base URL for all Notion REST API requests across the project.
export const NOTION_API_BASE_URL = 'https://api.notion.com/v1'

// Notion API version sent as the `Notion-Version` header on every request.
export const NOTION_API_VERSION = '2026-03-11'

/**
 * Notion caps the `content` of a single `rich_text`/`title` text element at
 * 2000 characters; submissions are truncated to this limit before being sent.
 */
export const NOTION_TEXT_MAX_LENGTH = 2000
