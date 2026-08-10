import { RunWorkflowButton } from './run-workflow-button';
import { SaveIndicator } from './save-indicator';
import { UndoRedoButtons } from './undo-redo-buttons';

/** The workflow toolbar's right-side action group. The live toggle, version
 * history, and more-menu live up in the site header via the @headerActions
 * slot. */
export function WorkflowHeaderActions() {
  return (
    <div className='flex items-center gap-2'>
      <SaveIndicator />
      <UndoRedoButtons />
      <RunWorkflowButton />
    </div>
  );
}
