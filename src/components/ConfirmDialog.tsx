import { useRef, useEffect, useCallback, type KeyboardEvent, type MouseEvent } from 'react';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  isOpen: boolean;
  count: number;
  onConfirm: () => void;
  onCancel: () => void;
  triggerElement?: HTMLElement | null;
}

export function ConfirmDialog({
  isOpen,
  count,
  onConfirm,
  onCancel,
  triggerElement,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
      // 열릴 때 취소 버튼에 포커스
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);
    } else {
      if (dialog.open) {
        dialog.close();
      }
      // 닫힐 때 호출 버튼 또는 유효 요소로 포커스 복귀
      if (triggerElement) {
        if (!triggerElement.hasAttribute('disabled')) {
          triggerElement.focus();
        } else {
          // 호출 버튼이 disabled된 경우 body나 첫 번째 유효 요소로
          const firstFocusable = document.querySelector<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [tabindex="0"]'
          );
          firstFocusable?.focus();
        }
      }
    }
  }, [isOpen, triggerElement]);

  // Esc 키 누를 때 취소 처리
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    },
    [onCancel]
  );

  // 다이얼로그 배경(backdrop) 클릭 시 취소 처리
  const handleDialogClick = (e: MouseEvent<HTMLDialogElement>) => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const rect = dialog.getBoundingClientRect();
    const isInDialog =
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      onClick={handleDialogClick}
      onKeyDown={handleKeyDown}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-desc"
    >
      <div className={styles.dialogContent}>
        <h2 id="confirm-dialog-title" className={styles.title}>
          완료한 할 일을 삭제할까요?
        </h2>
        <p id="confirm-dialog-desc" className={styles.description}>
          완료한 할 일 {count}개가 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
        </p>

        <div className={styles.buttonGroup}>
          <button
            ref={cancelButtonRef}
            type="button"
            className={styles.cancelButton}
            onClick={onCancel}
          >
            취소
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={onConfirm}
          >
            {count}개 삭제
          </button>
        </div>
      </div>
    </dialog>
  );
}
