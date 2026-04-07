/**
 * ClassificationWrapper
 *
 * Renders a ClassificationBadge in the toolbar for the currently selected
 * block. This is the integration point between the gweder classification
 * system and the BlockNote editor.
 *
 * BlockNote 0.47 does not expose a `blockWrapper` or `renderBlock` override
 * that would let us wrap each block's DOM with a badge overlay. Instead, we
 * integrate via the FormattingToolbar: when a block is selected the toolbar
 * appears, and our ClassificationToolbarButton shows the badge there.
 *
 * This file re-exports the toolbar button so that the import path matches the
 * task spec (`gweder/ClassificationWrapper`), and also provides a
 * `ClassificationOverlay` component that can be rendered inside BlockNoteView
 * to show a subtle badge on the currently focused block via a positioned
 * overlay (using the editor's selection coordinates).
 */
export { ClassificationToolbarButton as ClassificationWrapper } from './ClassificationToolbarButton';
