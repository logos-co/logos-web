'use client'

import { useRef, useState } from 'react'

import { RichTextView } from './rich-text-view'

interface RichTextEditorProps {
  value: string
  placeholder?: string
  rows?: number
  label: string
  onChange: (value: string) => void
}

interface Formatter {
  key: string
  label: string
  hint: string
  /** Returns the replacement for the selection and where to leave the caret. */
  apply: (selected: string) => { text: string; caretOffset: number }
}

/**
 * A toolbar over a textarea rather than a contenteditable surface.
 *
 * A WYSIWYG editor owns its own document model, and the moment it does, what is
 * stored stops being something a person can read in a database row or a CSV
 * export. Notes here are Markdown, so the toolbar only ever inserts characters
 * the author could have typed - which also means paste, undo, and spellcheck
 * behave the way the browser already makes them behave.
 */
const FORMATTERS: readonly Formatter[] = [
  {
    key: 'bold',
    label: 'B',
    hint: 'Bold',
    apply: (selected) => ({
      text: `**${selected || 'bold text'}**`,
      caretOffset: 2,
    }),
  },
  {
    key: 'italic',
    label: 'I',
    hint: 'Italic',
    apply: (selected) => ({
      text: `_${selected || 'italic text'}_`,
      caretOffset: 1,
    }),
  },
  {
    key: 'code',
    label: '{ }',
    hint: 'Inline code',
    apply: (selected) => ({
      text: `\`${selected || 'code'}\``,
      caretOffset: 1,
    }),
  },
  {
    key: 'bullet',
    label: '• —',
    hint: 'Bullet list',
    apply: (selected) => ({
      text: (selected || 'point')
        .split('\n')
        .map((line) => `- ${line}`)
        .join('\n'),
      caretOffset: 2,
    }),
  },
  {
    key: 'number',
    label: '1.',
    hint: 'Numbered list',
    apply: (selected) => ({
      text: (selected || 'point')
        .split('\n')
        .map((line, index) => `${index + 1}. ${line}`)
        .join('\n'),
      caretOffset: 3,
    }),
  },
  {
    key: 'quote',
    label: '“',
    hint: 'Quote',
    apply: (selected) => ({
      text: `> ${selected || 'quoted text'}`,
      caretOffset: 2,
    }),
  },
  {
    key: 'link',
    label: 'Link',
    hint: 'Link',
    apply: (selected) => ({
      text: `[${selected || 'label'}](https://)`,
      caretOffset: 1,
    }),
  },
  {
    key: 'image',
    label: 'Image',
    hint: 'Image by URL',
    apply: (selected) => ({
      text: `![${selected || 'screenshot'}](https://)`,
      caretOffset: 2,
    }),
  },
]

export function RichTextEditor({
  value,
  placeholder,
  rows = 4,
  label,
  onChange,
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [isPreview, setPreview] = useState(false)

  function format(formatter: Formatter): void {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    const { text, caretOffset } = formatter.apply(selected)

    onChange(`${value.slice(0, start)}${text}${value.slice(end)}`)

    // Restored after React has written the new value, or the browser puts the
    // caret at the end and the author loses their place mid-sentence.
    window.requestAnimationFrame(() => {
      textarea.focus()
      const caret = selected
        ? start + text.length
        : start + caretOffset + (selected.length || 0)
      const selectionEnd = selected
        ? caret
        : caret + text.length - caretOffset * 2
      textarea.setSelectionRange(caret, Math.max(caret, selectionEnd))
    })
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar">
        {FORMATTERS.map((formatter) => (
          <button
            className="rich-editor-tool cursor-pointer"
            disabled={isPreview}
            key={formatter.key}
            title={formatter.hint}
            type="button"
            onClick={() => format(formatter)}
          >
            <span aria-hidden="true">{formatter.label}</span>
            <span className="visually-hidden">{formatter.hint}</span>
          </button>
        ))}
        <span className="rich-editor-spacer" />
        <button
          aria-pressed={isPreview}
          className="rich-editor-tool cursor-pointer"
          type="button"
          onClick={() => setPreview((current) => !current)}
        >
          {isPreview ? 'Write' : 'Preview'}
        </button>
      </div>

      {isPreview ? (
        <div className="rich-editor-preview">
          {value.trim() ? (
            <RichTextView body={value} />
          ) : (
            <p className="record-empty">Nothing to preview yet.</p>
          )}
        </div>
      ) : (
        <textarea
          aria-label={label}
          placeholder={placeholder}
          ref={textareaRef}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </div>
  )
}
