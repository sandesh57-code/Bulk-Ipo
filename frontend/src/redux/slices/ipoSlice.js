import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchOpenIPOs = createAsyncThunk('ipo/fetchOpen', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/ipos?status=open'); return data.ipos }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch IPOs') }
})
export const fetchAllIPOs = createAsyncThunk('ipo/fetchAll', async (params, { rejectWithValue }) => {
  try { const { data } = await api.get('/ipos', { params }); return data }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch IPOs') }
})
export const bulkApplyIPO = createAsyncThunk('ipo/bulkApply', async (payload, { rejectWithValue }) => {
  try { const { data } = await api.post('/ipos/bulk-apply', payload); return data }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Bulk apply failed') }
})
export const checkBulkResults = createAsyncThunk('ipo/checkResults', async (payload, { rejectWithValue }) => {
  try { const { data } = await api.post('/results/bulk-check', payload); return data.results }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to check results') }
})

const ipoSlice = createSlice({
  name: 'ipo',
  initialState: { openIPOs: [], allIPOs: [], results: [], loading: false, applying: false, error: null, selectedIPO: null, applyProgress: [], totalPages: 1 },
  reducers: {
    setSelectedIPO: (s, a) => { s.selectedIPO = a.payload },
    clearApplyProgress: (s) => { s.applyProgress = [] },
    updateProgress: (s, a) => { 
      const idx = s.applyProgress.findIndex(p => p.accountId === a.payload.accountId)
      if (idx !== -1) s.applyProgress[idx] = a.payload
      else s.applyProgress.push(a.payload)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOpenIPOs.pending, (s) => { s.loading = true })
      .addCase(fetchOpenIPOs.fulfilled, (s, a) => { s.loading = false; s.openIPOs = a.payload })
      .addCase(fetchOpenIPOs.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(fetchAllIPOs.fulfilled, (s, a) => { s.allIPOs = a.payload.ipos; s.totalPages = a.payload.totalPages || 1 })
      .addCase(bulkApplyIPO.pending, (s) => { s.applying = true })
      .addCase(bulkApplyIPO.fulfilled, (s, a) => { s.applying = false; s.applyProgress = a.payload.results || [] })
      .addCase(bulkApplyIPO.rejected, (s, a) => { s.applying = false; s.error = a.payload })
      .addCase(checkBulkResults.fulfilled, (s, a) => { s.results = a.payload })
  },
})
export const { setSelectedIPO, clearApplyProgress, updateProgress } = ipoSlice.actions
export default ipoSlice.reducer
