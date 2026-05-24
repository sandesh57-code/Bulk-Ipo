import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchReports = createAsyncThunk('reports/fetch', async (params, { rejectWithValue }) => {
  try { 
    const { data } = await api.get('/reports', { params })
    return data 
  }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch reports') }
})
export const retryApplication = createAsyncThunk('reports/retry', async (id, { rejectWithValue }) => {
  try { 
    const { data } = await api.post(`/reports/${id}/retry`)
    return data.application 
  }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Retry failed') }
})

const reportSlice = createSlice({
  name: 'reports',
  initialState: { reports: [], loading: false, error: null, totalPages: 1, totalCount: 0 },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchReports.fulfilled, (s, a) => { 
        s.loading = false
        s.reports = a.payload.applications
        s.totalPages = a.payload.totalPages
        s.totalCount = a.payload.total 
      })
      .addCase(fetchReports.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(retryApplication.fulfilled, (s, a) => { 
        const idx = s.reports.findIndex(r => r._id === a.payload._id)
        if (idx !== -1) s.reports[idx] = a.payload 
      })
  },
})
export default reportSlice.reducer
