import axios from 'axios';

const API = process.env.REACT_APP_API_URL;

const withAuth = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
});

const notificationsService = {
  async getUnreadCount() {
    const res = await axios.get(`${API}/api/notifications/count`, withAuth());
    return res.data?.data?.unread ?? 0;
  },
  async getNotifications(page = 1, limit = 10, unreadOnly = false) {
    const res = await axios.get(`${API}/api/notifications`, {
      ...withAuth(),
      params: { page, limit, unreadOnly },
    });
    return res.data;
  },
  async markAsRead(id) {
    const res = await axios.post(`${API}/api/notifications/${id}/read`, {}, withAuth());
    return res.data;
  },
  async markAllAsRead() {
    const res = await axios.post(`${API}/api/notifications/read-all`, {}, withAuth());
    return res.data;
  },
};

export default notificationsService;

