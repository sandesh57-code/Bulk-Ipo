import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchNotifications = createAsyncThunk('notifications/fetch', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/notifications'); return data.notifications }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch notifications') }
})
export const markAsRead = createAsyncThunk('notifications/markRead', async (id, { rejectWithValue }) => {
  try { await api.put(`/notifications/${id}/read`); return id }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to mark as read') }
})
export const markAllRead = createAsyncThunk('notifications/markAllRead', async (_, { rejectWithValue }) => {
  try { await api.put('/notifications/read-all'); return true }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to mark all as read') }
})

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: { notifications: [], loading: false, unreadCount: 0 },
  reducers: {
    addNotification: (s, a) => { s.notifications.unshift(a.payload); s.unreadCount++ },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.fulfilled, (s, a) => {
        s.notifications = a.payload
        s.unreadCount = a.payload.filter(n => !n.isRead).length
      })
      .addCase(markAsRead.fulfilled, (s, a) => {
        const n = s.notifications.find(n2 => n2._id === a.payload)
        if (n && !n.isRead) { n.isRead = true; s.unreadCount = Math.max(0, s.unreadCount - 1) }
      })
      .addCase(markAllRead.fulfilled, (s) => {
        s.notifications.forEach(n => { n.isRead = true })
        s.unreadCount = 0
      })
  },
})
export const { addNotification } = notificationSlice.actions
export default notificationSlice.reducer
