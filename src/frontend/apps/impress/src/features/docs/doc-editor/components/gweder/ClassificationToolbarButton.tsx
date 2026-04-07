/**
 * ClassificationToolbarButton
 *
 * A FormattingToolbar button that shows the classification level of the
 * currently selected block(s) and lets the user change it via the
 * ClassificationBadge dropdown.
 *
 * The component reads `block.props.classification` from the first selected
 * block and calls `editor.updateBlock` to persist changes.
 */
import { useBlockNoteEditor, useSelectedBlocks } from '@blocknote/react';
import { useCallback } from 'react';

import { ClassificationBadge } from './ClassificationBadge';
import { DEFAULT_CLASSIFICATION, type Classification } from './constants';

export function ClassificationToolbarButton() {
  const editor = useBlockNoteEditor();
  const selectedBlocks = useSelectedBlocks(editor);

  // Read classification from the first selected block.
  const currentBlock = selectedBlocks[0];
  const classification: Classification =
    (currentBlock?.props as Record<string, unknown>)?.classification as
      | Classification
      | undefined ?? DEFAULT_CLASSIFICATION;

  const handleChange = useCallback(
    (value: Classification) => {
      // Update all selected blocks.
      for (const block of selectedBlocks) {
        editor.updateBlock(block, {
          props: { classification: value } as Record<string, unknown>,
        } as Parameters<typeof editor.updateBlock>[1]);
      }
    },
    [editor, selectedBlocks],
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        paddingLeft: '4px',
        borderLeft: '1px solid #ddd',
        marginLeft: '4px',
      }}
    >
      <ClassificationBadge value={classification} onChange={handleChange} />
    </div>
  );
}
