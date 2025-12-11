export type ItemStatus = 'Active' | 'Expiring' | 'Expired';

export const calculateStatus = (dateString: string | null | undefined): ItemStatus => {
  if (!dateString) return 'Active';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expirationDate = new Date(dateString);
  expirationDate.setHours(0, 0, 0, 0);

  const diffTime = expirationDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'Expired';
  if (diffDays <= 30) return 'Expiring';
  return 'Active';
};

export const getDaysUntilExpiration = (dateString: string | null | undefined): number => {
  if (!dateString) return 999;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expirationDate = new Date(dateString);
  expirationDate.setHours(0, 0, 0, 0);

  const diffTime = expirationDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getStatusColor = (status: ItemStatus): string => {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'Expiring':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Expired':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusDotColor = (status: ItemStatus): string => {
  switch (status) {
    case 'Active': return 'bg-green-500';
    case 'Expiring': return 'bg-yellow-500';
    case 'Expired': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};
