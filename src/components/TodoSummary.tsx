import type { RefObject } from 'react';
import { StorageStatus } from '../types/todo';
import { TrashIcon, AlertIcon } from './Icons';
import styles from './TodoSummary.module.css';

interface TodoSummaryProps {
  activeCount: number;
  completedCount: number;
  onOpenClearDialog: () => void;
  storageStatus: StorageStatus;
  onResetCorruptedStorage: () => void;
  clearButtonRef?: RefObject<HTMLButtonElement>;
}

export function TodoSummary({
  activeCount,
  completedCount,
  onOpenClearDialog,
  storageStatus,
  onResetCorruptedStorage,
  clearButtonRef,
}: TodoSummaryProps) {
  const isClearDisabled = completedCount === 0;

  return (
    <footer className={styles.footer}>
      <div className={styles.actionRow}>
        <span className={styles.activeCountText}>
          남은 할 일 <strong>{activeCount}</strong>개
        </span>

        <button
          ref={clearButtonRef}
          type="button"
          className={styles.clearButton}
          onClick={onOpenClearDialog}
          disabled={isClearDisabled}
          aria-label={`완료된 할 일 ${completedCount}개 모두 삭제`}
        >
          <TrashIcon size={16} />
          <span>완료 항목 삭제 ({completedCount})</span>
        </button>
      </div>

      <div className={styles.statusRow}>
        {storageStatus === 'write_error' ? (
          <div className={styles.storageError} role="alert">
            <AlertIcon size={16} />
            <span>
              변경 내용을 이 브라우저에 저장하지 못했어요. 창을 닫으면 사라질 수 있습니다.
            </span>
          </div>
        ) : storageStatus === 'corrupted_read' ? (
          <div className={styles.storageError} role="alert">
            <AlertIcon size={16} />
            <div className={styles.corruptedWrapper}>
              <span>
                저장된 목록을 읽지 못했어요. 기존 데이터는 덮어쓰지 않았습니다.
              </span>
              <button
                type="button"
                className={styles.resetStorageButton}
                onClick={onResetCorruptedStorage}
              >
                새로 시작하기
              </button>
            </div>
          </div>
        ) : (
          <span className={styles.storageNotice}>이 브라우저에 자동 저장됩니다.</span>
        )}
      </div>
    </footer>
  );
}
