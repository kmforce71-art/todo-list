import { useMemo } from 'react';
import { getKoreanDateString } from '../lib/date';
import styles from './Header.module.css';

interface HeaderProps {
  totalCount: number;
  completedCount: number;
  completionRate: number;
}

export function Header({ totalCount, completedCount, completionRate }: HeaderProps) {
  const currentDateStr = useMemo(() => getKoreanDateString(), []);

  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <span className={styles.date}>{currentDateStr}</span>
        <h1 className={styles.title}>밍혜의 오늘 할 일</h1>
        <p className={styles.subtitle}>작은 실천으로 채우는 하루</p>
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.statsLabels}>
          <span className={styles.statItem}>
            전체 <strong>{totalCount}</strong>
          </span>
          <span className={styles.statDivider}>·</span>
          <span className={styles.statItem}>
            완료 <strong>{completedCount}</strong>
          </span>
          <span className={styles.statDivider}>·</span>
          <span className={styles.statPercent}>진행률 {completionRate}%</span>
        </div>

        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="오늘의 할 일 진행률"
        >
          <div
            className={styles.progressBar}
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>
    </header>
  );
}
