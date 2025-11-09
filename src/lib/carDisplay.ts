import { Car } from './types';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function getCategory(car: Car) {
  return car.VehicleCategory || car.Type || 'Other';
}
