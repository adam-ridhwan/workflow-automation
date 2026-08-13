'use client';

import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/cn';
import remarkGfm from 'remark-gfm';

type MarkdownProps = {
  children: string;
  className?: string;
};

/** Renders GFM Markdown (headings, bold, lists, tables, code) with a shared
 * prose style. Used for node outputs and the file viewer so they stay
 * consistent. */
export function Markdown({ children, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        `[&_a]:text-primary [&_code]:bg-muted [&_pre]:bg-muted
        [&_td]:border-border [&_th]:border-border space-y-1.5 text-[13px]
        leading-relaxed wrap-break-word whitespace-pre-wrap [&_a]:underline
        [&_code]:rounded [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono
        [&_code]:text-[12px] [&_h1]:text-[15px] [&_h1]:font-semibold
        [&_h2]:text-[14px] [&_h2]:font-semibold [&_h3]:font-semibold [&_li]:ml-4
        [&_li]:list-disc [&_ol_li]:list-decimal [&_pre]:overflow-x-auto
        [&_pre]:rounded-md [&_pre]:p-2 [&_strong]:font-semibold [&_table]:block
        [&_table]:overflow-x-auto [&_td]:border [&_td]:px-1.5 [&_th]:border
        [&_th]:px-1.5 [&_th]:font-semibold`,
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
