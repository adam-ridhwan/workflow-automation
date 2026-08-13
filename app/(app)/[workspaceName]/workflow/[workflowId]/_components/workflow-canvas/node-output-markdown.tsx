'use client';

import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type NodeOutputMarkdownProps = {
  output: string;
};

/** Renders a node's Markdown output (headings, bold, lists, tables, code) as
 * formatted HTML, scaled down for the compact node card. */
export function NodeOutputMarkdown({ output }: NodeOutputMarkdownProps) {
  return (
    <div
      className='[&_a]:text-primary [&_code]:bg-muted [&_pre]:bg-muted
        [&_td]:border-border [&_th]:border-border wrap-break-wor space-y-1.5
        text-[13px] leading-snug [&_a]:underline [&_code]:rounded [&_code]:px-1
        [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[12px]
        [&_h1]:text-[15px] [&_h1]:font-semibold [&_h2]:text-[14px]
        [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-4 [&_li]:list-disc
        [&_ol_li]:list-decimal [&_pre]:overflow-x-auto [&_pre]:rounded-md
        [&_pre]:p-2 [&_strong]:font-semibold [&_table]:block
        [&_table]:overflow-x-auto [&_td]:border [&_td]:px-1.5 [&_th]:border
        [&_th]:px-1.5 [&_th]:font-semibold'
    >
      <Markdown remarkPlugins={[remarkGfm]}>{output}</Markdown>
    </div>
  );
}
