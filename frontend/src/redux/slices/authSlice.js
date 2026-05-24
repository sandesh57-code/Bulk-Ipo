import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Login failed') }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Registration failed') }
})

export const updateProfile = createAsyncThunk('auth/updateProfile', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/profile', userData)
    localStorage.setItem('user', JSON.stringify(data.user))
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Update failed') }
})

export const changePassword = createAsyncThunk('auth/changePassword', async (passwords, { rejectWithValue }) => {
  try {
    const { data } = await api.put('/auth/change-password', passwords)
    return data
  } catch (err) { return rejectWithValue(err.response?.data?.message || 'Password change failed') }
})

const savedUser = localStorage.getItem('user')
const savedTheme = localStorage.getItem('theme') || 'dark'

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser ? JSON.parse(savedUser) : null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,
    error: null,
    theme: savedTheme,
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    },
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('theme', state.theme)
    },
    loadUserFromStorage: (state) => {
      const token = localStorage.getItem('token')
      const user = localStorage.getItem('user')
      if (token && user) {
        state.token = token
        state.user = JSON.parse(user)
        state.isAuthenticated = true
      }
    },
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (s) => { s.loading = true; s.error = null })
      .addCase(loginUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.isAuthenticated = true })
      .addCase(loginUser.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(registerUser.pending, (s) => { s.loading = true; s.error = null })
      .addCase(registerUser.fulfilled, (s, a) => { s.loading = false; s.user = a.payload.user; s.token = a.payload.token; s.isAuthenticated = true })
      .addCase(registerUser.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload.user })
  },
})

export const { logout, toggleTheme, loadUserFromStorage, clearError } = authSlice.actions
export default authSlice.reducer
