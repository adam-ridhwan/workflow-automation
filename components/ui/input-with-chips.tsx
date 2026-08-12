'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

/** An insertable token shown in the dropdown. Picking it drops a `{{label}}`
 * chip into the input; an empty `label` renders `hint` as a disabled row. */
export type ChipOption = {
  id: string;
  label: string;
  hint?: string;
};

/** Matches a `{{label}}` token (no nested braces). */
const TOKEN_RE = /\{\{\s*([^{}]+?)\s*\}\}/g;

/** Chip styling shared by the inline chips and the dropdown options, so they
 * always match. Uses `foreground` (not `secondary`) for the fill because the
 * dropdown sits inside `.menu-inverted`, which remaps `--secondary` — so it
 * would render a different color there; `--foreground` resolves the same on
 * both surfaces. */
const CHIP_CLASS =
  'inline-flex select-none items-center rounded-md bg-foreground/10 px-1.5 ' +
  'py-0.5 font-sans text-[11px] font-medium text-foreground';

/** Builds a non-editable chip element for a `{{label}}` token, styled with the
 * same `CHIP_CLASS` as the dropdown options (plus a little inline spacing so it
 * sits in the text flow). The raw label lives on `data-token` so serialization
 * can round-trip it back to `{{label}}`. */
function createChip(label: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.contentEditable = 'false';
  span.dataset.token = label;
  span.className = cn(CHIP_CLASS, 'mx-0.5 align-baseline');
  span.textContent = label;
  return span;
}

/** Replaces the editor's DOM with `value`, turning each `{{label}}` into a chip
 * and the rest into text nodes. */
function renderValue(editor: HTMLElement, value: string) {
  editor.replaceChildren();
  let lastIndex = 0;
  for (const match of value.matchAll(TOKEN_RE)) {
    const before = value.slice(lastIndex, match.index);
    if (before) {
      editor.appendChild(document.createTextNode(before));
    }
    editor.appendChild(createChip(match[1]));
    lastIndex = match.index + match[0].length;
  }
  const tail = value.slice(lastIndex);
  if (tail) {
    editor.appendChild(document.createTextNode(tail));
  }
}

/** Serializes the editor DOM back to a plain string: chips become `{{label}}`,
 * `<br>`/block wrappers become newlines, text stays as-is. */
function serialize(node: ChildNode): string {
  if (node.nodeType === globalThis.Node.TEXT_NODE) {
    return node.textContent ?? '';
  }
  if (!(node instanceof HTMLElement)) {
    return '';
  }
  if (node.dataset.token !== undefined) {
    return `{{${node.dataset.token}}}`;
  }
  if (node.tagName === 'BR') {
    return '\n';
  }
  let inner = '';
  node.childNodes.forEach((child) => {
    inner += serialize(child);
  });
  return /^(DIV|P)$/.test(node.tagName) ? `\n${inner}` : inner;
}

function serializeEditor(editor: HTMLElement): string {
  let out = '';
  editor.childNodes.forEach((child) => {
    out += serialize(child);
  });
  return out;
}

/** Inserts a node at the caret (or the editor's end if the caret is elsewhere)
 * and places the caret just after it. */
function insertAtCaret(editor: HTMLElement, inserted: globalThis.Node) {
  const selection = window.getSelection();
  let range: Range;
  if (
    selection &&
    selection.rangeCount > 0 &&
    editor.contains(selection.anchorNode)
  ) {
    range = selection.getRangeAt(0);
  } else {
    range = document.createRange();
    range.selectNodeContents(editor);
    range.collapse(false);
  }
  range.deleteContents();
  range.insertNode(inserted);
  range.setStartAfter(inserted);
  range.collapse(true);
  selection?.removeAllRanges();
  selection?.addRange(range);
}

/** Open/close transition length (ms). The dropdown stays mounted this long
 * after closing so its exit animation can play. Matches `duration-100`. */
const TRANSITION_MS = 100;

/**
 * Flash-free presence for a controlled `open` flag. Mount/close state is
 * adjusted during render (an allowed React pattern), while the show/unmount
 * steps run async (rAF / timer) so a fast open→close interrupts from the
 * current opacity instead of snapping to full and flashing.
 */
function usePresence(open: boolean) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(open);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef<number | null>(null);

  if (open !== prevOpen) {
    setPrevOpen(open);
    setShown(false);
    if (open) {
      setMounted(true);
    }
  }

  useEffect(() => {
    if (open && mounted && !shown) {
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        setShown(true);
      });
      return () => {
        if (raf.current !== null) {
          cancelAnimationFrame(raf.current);
          raf.current = null;
        }
      };
    }
    if (!open && mounted) {
      timer.current = setTimeout(() => {
        timer.current = null;
        setMounted(false);
      }, TRANSITION_MS);
      return () => {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
      };
    }
    return undefined;
  }, [open, mounted, shown]);

  return { mounted, shown };
}

type InputWithChipsProps = {
  id?: string;
  /** The text value, with `{{label}}` tokens that render as chips. */
  value: string;
  /** Fired on every edit with the serialized value. */
  onChange: (value: string) => void;
  /** Fired when the editor loses focus (e.g. to persist). */
  onBlur?: () => void;
  /** Tokens offered in the focus-triggered "insert" dropdown. */
  options?: ChipOption[];
  /** Heading shown above the dropdown options. */
  menuHeading?: string;
  disabled?: boolean;
  /** Extra classes for the editor surface. */
  className?: string;
  /** Accessible name for the editor. Prefer `aria-labelledby` — a native
   * `<label htmlFor>` can't associate with the contentEditable element. */
  'aria-labelledby'?: string;
  'aria-label'?: string;
};

/**
 * A multiline text input whose `{{label}}` tokens render as atomic, non-editable
 * chips. Focusing it reveals a dropdown of `options`; picking one inserts a chip
 * at the caret. The value round-trips to a plain string (chips ⇄ `{{label}}`),
 * so consumers store and read a normal string.
 *
 * The DOM is the source of truth while focused (so the caret never jumps); the
 * `value` prop is only re-rendered into the editor when it isn't being edited.
 */
export function InputWithChips({
  id,
  value,
  onChange,
  onBlur,
  options = [],
  menuHeading,
  disabled,
  className,
  'aria-labelledby': ariaLabelledBy,
  'aria-label': ariaLabel,
}: InputWithChipsProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const [focused, setFocused] = useState(false);
  // Escape closes the dropdown without blurring; reset on focus/blur so it
  // reopens next time the editor is focused.
  const [dismissed, setDismissed] = useState(false);

  // Load the value into the editor on mount and on external changes (undo/redo,
  // switching context) — but never while typing, which would blow away the DOM
  // and the caret.
  useEffect(() => {
    if (editorRef.current && !focusedRef.current) {
      renderValue(editorRef.current, value);
    }
  }, [value]);

  function commit() {
    if (editorRef.current) {
      onChange(serializeEditor(editorRef.current));
    }
  }

  function insertChip(label: string) {
    const editor = editorRef.current;
    if (!editor) {
      return;
    }
    editor.focus();
    insertAtCaret(editor, createChip(label));
    // A trailing space gives the caret somewhere to land after the chip.
    insertAtCaret(editor, document.createTextNode(' '));
    commit();
  }

  const open = focused && options.length > 0 && !dismissed;
  const { mounted, shown } = usePresence(open);

  return (
    <div className='relative'>
      <div
        id={id}
        ref={editorRef}
        role='textbox'
        aria-multiline='true'
        aria-disabled={disabled}
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={commit}
        onKeyDown={(e) => {
          // Escape dismisses the dropdown but keeps the editor focused (and
          // doesn't bubble to canvas/panel Escape handlers).
          if (e.key === 'Escape' && open) {
            e.preventDefault();
            e.stopPropagation();
            setDismissed(true);
            return;
          }
          // Keep newlines as plain "\n" text so serialization stays simple.
          if (e.key === 'Enter') {
            e.preventDefault();
            const editor = editorRef.current;
            if (editor) {
              insertAtCaret(editor, document.createTextNode('\n'));
              commit();
            }
          }
        }}
        onPaste={(e) => {
          // Paste as plain text so no foreign markup enters the editor.
          e.preventDefault();
          const editor = editorRef.current;
          const text = e.clipboardData.getData('text/plain');
          if (editor && text) {
            insertAtCaret(editor, document.createTextNode(text));
            commit();
          }
        }}
        onClick={() => {
          // Clicking the field reopens the dropdown after Escape dismissed it
          // (the editor is already focused, so onFocus won't refire).
          setDismissed(false);
        }}
        onFocus={() => {
          focusedRef.current = true;
          setFocused(true);
          setDismissed(false);
        }}
        onBlur={() => {
          focusedRef.current = false;
          setFocused(false);
          setDismissed(false);
          // Re-render from the serialized value so tokens typed by hand (not
          // just those inserted via the dropdown) become chips too.
          const editor = editorRef.current;
          if (editor) {
            renderValue(editor, serializeEditor(editor));
          }
          onBlur?.();
        }}
        className={cn(
          `border-input focus-visible:border-ring focus-visible:ring-ring/50
          dark:bg-input/30 max-h-48 min-h-20 w-full cursor-text overflow-y-auto
          rounded-md border bg-transparent px-2.5 py-1.5 font-mono text-[13px]
          break-words whitespace-pre-wrap outline-none focus-visible:ring-3`,
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      />

      {mounted && (
        <div
          onMouseDown={(e) => {
            e.preventDefault();
          }}
          className={cn(
            `menu-inverted bg-popover text-popover-foreground ring-foreground/10
            absolute top-full right-0 left-0 z-50 mt-1 origin-top
            overflow-hidden rounded-lg p-1 shadow-md ring-1 backdrop-blur-xl
            transition duration-100 ease-out`,
            shown && 'translate-y-0 scale-100 opacity-100',
            !shown && 'pointer-events-none scale-95 opacity-0',
            // Enter slides down from the top (like the Select); exit only fades
            // and zooms — no slide — so the close matches the Select exactly.
            !shown && open && '-translate-y-2'
          )}
        >
          {menuHeading && (
            <p className='text-muted-foreground px-2 py-1 text-[11px]'>
              {menuHeading}
            </p>
          )}
          {options.map((option) =>
            option.label === '' ? (
              <div
                key={option.id}
                className='text-muted-foreground px-2 py-1 text-[12px]'
              >
                {option.hint}
              </div>
            ) : (
              <button
                key={option.id}
                type='button'
                onClick={() => {
                  insertChip(option.label);
                }}
                className='hover:bg-accent flex w-full items-center rounded-sm
                  px-2 py-1.5 text-left'
              >
                {/* The same chip it inserts into the input. */}
                <span className={CHIP_CLASS}>{option.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
