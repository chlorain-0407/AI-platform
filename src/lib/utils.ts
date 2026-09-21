export function formatCurrency(wan: number): string {
  if (wan >= 10000) {
    const yi = wan / 10000;
    return `${yi.toFixed(2)} 億`;
  }
  return `${wan.toLocaleString('zh-TW')} 萬`;
}

export function formatNumber(num: number, decimals: number = 1): string {
  return Number(num).toFixed(decimals);
}

export function calculateUnitPrice(priceWan: number, areaPing: number): string {
  if (!areaPing || areaPing <= 0) return '0 萬/坪';
  const unit = priceWan / areaPing;
  return `${unit.toFixed(1)} 萬/坪`;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}
