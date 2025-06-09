// utils/feedUnit.ts
export function toKg(quantity: number, unit: string): number {
  if (unit === 'ton') return quantity * 1000;
  return quantity;
}

export function fromKg(quantityKg: number, unit: string): number {
  if (unit === 'ton') return quantityKg / 1000;
  return quantityKg;
}