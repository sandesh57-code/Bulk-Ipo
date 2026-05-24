import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchAccounts = createAsyncThunk('accounts/fetchAll', async (_, { rejectWithValue }) => {
  try { const { data } = await api.get('/accounts'); return data.accounts }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to fetch accounts') }
})
export const addAccount = createAsyncThunk('accounts/add', async (accountData, { rejectWithValue }) => {
  try { const { data } = await api.post('/accounts', accountData); return data.account }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to add account') }
})
export const updateAccount = createAsyncThunk('accounts/update', async ({ id, ...accountData }, { rejectWithValue }) => {
  try { const { data } = await api.put(`/accounts/${id}`, accountData); return data.account }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to update account') }
})
export const deleteAccount = createAsyncThunk('accounts/delete', async (id, { rejectWithValue }) => {
  try { await api.delete(`/accounts/${id}`); return id }
  catch (err) { return rejectWithValue(err.response?.data?.message || 'Failed to delete account') }
})

const accountSlice = createSlice({
  name: 'accounts',
  initialState: { accounts: [], loading: false, error: null, selectedAccounts: [] },
  reducers: {
    toggleAccountSelection: (state, action) => {
      const id = action.payload
      const idx = state.selectedAccounts.indexOf(id)
      if (idx === -1) state.selectedAccounts.push(id)
      else state.selectedAccounts.splice(idx, 1)
    },
    selectAllAccounts: (state) => { state.selectedAccounts = state.accounts.map(a => a._id) },
    clearSelection: (state) => { state.selectedAccounts = [] },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (s) => { s.loading = true })
      .addCase(fetchAccounts.fulfilled, (s, a) => { s.loading = false; s.accounts = a.payload })
      .addCase(fetchAccounts.rejected, (s, a) => { s.loading = false; s.error = a.payload })
      .addCase(addAccount.fulfilled, (s, a) => { s.accounts.push(a.payload) })
      .addCase(updateAccount.fulfilled, (s, a) => { const idx = s.accounts.findIndex(a2 => a2._id === a.payload._id); if (idx !== -1) s.accounts[idx] = a.payload })
      .addCase(deleteAccount.fulfilled, (s, a) => { s.accounts = s.accounts.filter(ac => ac._id !== a.payload) })
  },
})
export const { toggleAccountSelection, selectAllAccounts, clearSelection } = accountSlice.actions
export default accountSlice.reducer
