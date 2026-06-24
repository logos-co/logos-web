interface NotionRichTextAnnotations {
  bold?: boolean
  code?: boolean
  italic?: boolean
}

interface NotionRichText {
  type: 'text'
  text: {
    content: string
    link?: { url: string }
  }
  annotations?: NotionRichTextAnnotations
}

export type NotionBlock =
  | {
      object: 'block'
      type: 'bulleted_list_item'
      bulleted_list_item: { rich_text: NotionRichText[] }
    }
  | {
      object: 'block'
      type: 'callout'
      callout: {
        rich_text: NotionRichText[]
        icon: { type: 'emoji'; emoji: string }
        color: 'gray_background'
      }
    }
  | {
      object: 'block'
      type: 'heading_1'
      heading_1: { rich_text: NotionRichText[] }
    }
  | {
      object: 'block'
      type: 'paragraph'
      paragraph: { rich_text: NotionRichText[] }
    }
  | {
      object: 'block'
      type: 'quote'
      quote: { rich_text: NotionRichText[] }
    }

function richText(
  content: string,
  annotations?: NotionRichTextAnnotations,
  href?: string
): NotionRichText {
  return {
    type: 'text',
    text: href ? { content, link: { url: href } } : { content },
    ...(annotations ? { annotations } : {}),
  }
}

function paragraph(richTextItems: NotionRichText[]): NotionBlock {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: richTextItems },
  }
}

function heading1(content: string): NotionBlock {
  return {
    object: 'block',
    type: 'heading_1',
    heading_1: { rich_text: [richText(content)] },
  }
}

function bullet(content = ''): NotionBlock {
  return {
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: content ? [richText(content)] : [] },
  }
}

function quote(content: string): NotionBlock {
  return {
    object: 'block',
    type: 'quote',
    quote: { rich_text: [richText(content, { bold: true })] },
  }
}

function callout(richTextItems: NotionRichText[]): NotionBlock {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: richTextItems,
      icon: { type: 'emoji', emoji: '💡' },
      color: 'gray_background',
    },
  }
}

const EVALUATION_GUIDANCE_URL =
  'https://app.notion.com/p/Candidate-Evaluation-Process-Guidance-3798f96fb65c802e9437ea109d97744f'

const VETTING_CRITERIA_URL =
  'https://app.notion.com/p/Vetting-Criteria-for-People-Ops-34a8f96fb65c80fbb07ec3321262d8ac?source=copy_link'

export const EVALUATION_TEMPLATE_CHILDREN: NotionBlock[] = [
  paragraph([
    richText('Evaluation process details ', { italic: true }),
    richText('here', { italic: true }, EVALUATION_GUIDANCE_URL),
    richText('\nVetting Criteria ', { italic: true }),
    richText('here', { italic: true }, VETTING_CRITERIA_URL),
  ]),
  heading1('Submission Evaluation'),
  bullet(),
  bullet(),
  quote('Briefly explain why this person is a Y/N:'),
  bullet(),
  callout([
    richText('Please update '),
    richText('Movement Status', { code: true }),
    richText(" to 'Eligible' or 'Redirected'"),
  ]),
  heading1('Call Evaluation'),
  bullet(),
  bullet(),
  bullet(),
  quote('Briefly explain why this person is a Y/N:'),
  bullet(),
  callout([
    richText('Please update '),
    richText('Movement Status', { code: true }),
    richText(" to 'No Show' or 'One Pager' or 'Redirected-Post call'"),
  ]),
  heading1('One Pager Evaluation (if applicable)'),
  bullet(),
  bullet(),
  bullet(),
  quote('Link or paste document:'),
  bullet(),
  quote('Briefly explain why this person is a Y/N:'),
  bullet(),
  callout([
    richText('Please update '),
    richText('Movement Status', { code: true }),
    richText(" to 'Training Call' or 'Redirected-Final'"),
  ]),
  heading1('Other Notes'),
]
