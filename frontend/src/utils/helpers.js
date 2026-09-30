export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

export const formatDateTime = (date) => {
  return new Date(date).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
};

export const calculateNights = (checkIn, checkOut) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

export const getStatusColor = (status) => {
  const colors = {
    pending: 'badge-yellow',
    confirmed: 'badge-green',
    checked_in: 'badge-navy',
    checked_out: 'badge-navy',
    cancelled: 'badge-red'
  };
  return colors[status] || 'badge-yellow';
};

export const getStatusLabel = (status) => {
  const labels = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    checked_in: 'Đã nhận phòng',
    checked_out: 'Đã trả phòng',
    cancelled: 'Đã hủy'
  };
  return labels[status] || status;
};

export const getPaymentLabel = (status) => {
  const labels = {
    unpaid: 'Chưa thanh toán',
    paid: 'Đã thanh toán',
    refunded: 'Đã hoàn tiền'
  };
  return labels[status] || status;
};

export const truncate = (str, length = 100) => {
  if (!str) return '';
  return str.length > length ? str.substring(0, length) + '...' : str;
};
