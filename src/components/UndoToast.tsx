import { DeletedTaskRecord } from '../types/todo';
import { CloseIcon } from './Icons';
import styles from './UndoToast.module.css';

interface UndoToastProps {
  deletedRecord: DeletedTaskRecord | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ deletedRecord, onUndo, onDismiss }: UndoToastProps) {
  if (!deletedRecord) return null;

  return (
    <aside className={styles.toastContainer} role="status" aria-live="polite" aria-label="실행 취소 알림">
      <div className={styles.toastContent}>
        <span className={styles.message}>
          할 일을 삭제했어요.
        </span>

        <div className={styles.actionGroup}>
          <button
            type="button"
            className={styles.undoButton}
            onClick={onUndo}
            aria-label={`"${deletedRecord.item.text}" 삭제 실행 취소`}
          >
            실행 취소
          </button>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onDismiss}
            aria-label="알림 닫기"
          >
            <CloseIcon size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
