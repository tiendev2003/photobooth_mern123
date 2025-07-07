export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

export const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString('vi-VN');
};

export const generateRandomCode = () => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Generates number from 1000-9999
};
