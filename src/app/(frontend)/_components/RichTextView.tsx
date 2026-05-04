import { RichText } from '@payloadcms/richtext-lexical/react'
import type { ComponentProps } from 'react'

type RichTextData = ComponentProps<typeof RichText>['data']

type RichTextViewProps = {
  content?: null | RichTextData
}

export function RichTextView({ content }: RichTextViewProps) {
  if (!content) {
    return null
  }

  return <RichText className="rich-text" data={content} />
}
