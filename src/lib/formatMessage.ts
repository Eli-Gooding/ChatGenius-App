// Convert markdown to HTML for display
export function markdownToHtml(content: string): string {
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/__(.*?)__/g, '<u>$1</u>')
}

// Convert HTML to markdown for storage
export function htmlToMarkdown(html: string): string {
  return html
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<b>(.*?)<\/b>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<i>(.*?)<\/i>/g, '*$1*')
    .replace(/<u>(.*?)<\/u>/g, '__$1__')
}

// Apply formatting to selected text
export function applyFormatting(text: string, type: 'bold' | 'italic' | 'underline'): string {
  const selection = window.getSelection()
  if (!selection || !selection.toString()) return text

  const start = selection.anchorOffset
  const end = selection.focusOffset
  const before = text.substring(0, start)
  const selected = text.substring(start, end)
  const after = text.substring(end)

  switch (type) {
    case 'bold':
      return `${before}<strong>${selected}</strong>${after}`
    case 'italic':
      return `${before}<em>${selected}</em>${after}`
    case 'underline':
      return `${before}<u>${selected}</u>${after}`
    default:
      return text
  }
} 