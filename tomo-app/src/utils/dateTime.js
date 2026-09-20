/** Trả thời gian local dạng ISO 8601 có offset để backend hiểu đúng “hôm nay/ngày mai”. */
export function toLocalIsoWithOffset(date = new Date()) {
  const pad = (value) => String(Math.abs(Math.trunc(value))).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offsetHours = pad(offsetMinutes / 60);
  const offsetRemainder = pad(offsetMinutes % 60);

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${offsetHours}:${offsetRemainder}`
  );
}

/** Trả múi giờ IANA, có fallback an toàn cho Android cũ. */
export function getDeviceTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Ho_Chi_Minh';
  } catch {
    return 'Asia/Ho_Chi_Minh';
  }
}
