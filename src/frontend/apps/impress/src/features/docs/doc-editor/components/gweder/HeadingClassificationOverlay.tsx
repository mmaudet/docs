/**
 * HeadingClassificationOverlay
 *
 * Renders a persistent classification pill badge next to each heading in the
 * BlockNote editor. Observes the editor state and updates badges when blocks
 * change. Clicking a badge opens the classification dropdown.
 *
 * This uses a DOM overlay approach: we read the editor's blocks, find headings,
 * and render React portals positioned next to each heading element in the DOM.
 */
import { useBlockNoteEditor } from '@blocknote/react';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ClassificationBadge } from './ClassificationBadge';
import { type Classification, DEFAULT_CLASSIFICATION } from './constants';

interface HeadingInfo {
  blockId: string;
  classification: Classification;
  element: HTMLElement;
}

export function HeadingClassificationOverlay() {
  const editor = useBlockNoteEditor();
  const [headings, setHeadings] = useState<HeadingInfo[]>([]);

  const updateHeadings = useCallback(() => {
    try {
      const blocks = editor.document;
      const found: HeadingInfo[] = [];

      for (const block of blocks) {
        if (block.type === 'heading') {
          // Find the DOM element for this block
          const el = document.querySelector(
            `[data-id="${block.id}"]`,
          ) as HTMLElement;
          if (el) {
            const classification =
              ((block.props as Record<string, unknown>)
                ?.classification as Classification) || DEFAULT_CLASSIFICATION;
            found.push({
              blockId: block.id,
              classification,
              element: el,
            });
          }
        }
      }

      setHeadings(found);
    } catch {
      // Editor not ready yet
    }
  }, [editor]);

  // Update on editor content change
  useEffect(() => {
    updateHeadings();

    // Poll for changes (BlockNote doesn't expose a clean onChange for props)
    const interval = setInterval(updateHeadings, 1000);
    return () => clearInterval(interval);
  }, [updateHeadings]);

  const handleClassificationChange = useCallback(
    (blockId: string, value: Classification) => {
      const block = editor.document.find((b) => b.id === blockId);
      if (block) {
        editor.updateBlock(block, {
          props: { classification: value } as Record<string, unknown>,
        } as any);
      }

      // Notify Gweder renderer (same logic as ClassificationToolbarButton)
      try {
        const gwederRef = (window as any).__gwederDocRef;
        if (gwederRef) {
          const slugify = (text: string) =>
            text
              .toLowerCase()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/^-|-$/g, '');
          const headingText =
            block?.content?.map((c: any) => c.text || '').join('') ?? '';
          const sectionId = slugify(headingText);
          if (sectionId) {
            const gwederApi =
              (window as any).__gwederApiUrl || 'http://localhost:8000';
            const systemUser = btoa(
              JSON.stringify({
                email: 'system@gweder.app',
                role: 'directeur',
                org: 'LINAGORA',
              }),
            );
            fetch(`${gwederApi}/doc/${gwederRef}/update`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-User-Info': systemUser,
              },
              body: JSON.stringify({
                section_id: sectionId,
                classification: value,
              }),
            }).catch(() => {});
          }
        }
      } catch {
        // Best effort
      }

      // Refresh headings
      setTimeout(updateHeadings, 100);
    },
    [editor, updateHeadings],
  );

  return (
    <>
      {headings.map((h) => {
        // Position the badge inside the heading element
        // Find or create a container for the badge
        let container = h.element.querySelector(
          '.gweder-classification-container',
        ) as HTMLElement;
        if (!container) {
          container = document.createElement('span');
          container.className = 'gweder-classification-container';
          container.style.cssText =
            'position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:10;';
          h.element.style.position = 'relative';
          h.element.appendChild(container);
        }

        return createPortal(
          <ClassificationBadge
            key={h.blockId}
            value={h.classification}
            onChange={(v) => handleClassificationChange(h.blockId, v)}
            variant="pill"
          />,
          container,
        );
      })}
    </>
  );
}
