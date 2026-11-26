/**
 * 로컬 한국어 날짜 표시 유틸리티
 */
export function getKoreanDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
  return formatter.format(date);
}
