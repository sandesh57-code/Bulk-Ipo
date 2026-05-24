import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchPortfolio = createAsyncThunk('portfolio/fetch', async (params, { rejectWithValue }) => {
  try {
    const { accountId, sync } = params || {}
    let url = '/portfolio'
    const queryParams = []
    if (accountId) queryParams.push(`accountId=${accountId}`)
    if (sync) queryParams.push(`sync=true`)
    
    if (queryParams.length) {
      url += `?${queryParams.join('&')}`
    }
    
    const { data } = await api.get(url)
    return data
  } catch (err) { 
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch portfolio') 
  }
})

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState: { 
    portfolios: [], 
    consolidatedHoldings: [], 
    summary: {
      totalInvestment: 0,
      currentValue: 0,
      totalProfitLoss: 0,
      totalProfitLossPercent: 0,
      totalHoldings: 0,
    },
    loading: false, 
    error: null, 
    selectedAccount: null 
  },
  reducers: { 
    setSelectedAccount: (s, a) => { s.selectedAccount = a.payload } 
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (s) => { s.loading = true; s.error = null })
      .addCase(fetchPortfolio.fulfilled, (s, a) => { 
        s.loading = false
        s.portfolios = a.payload.portfolios
        s.consolidatedHoldings = a.payload.consolidatedHoldings || []
        s.summary = a.payload.summary || {}
      })
      .addCase(fetchPortfolio.rejected, (s, a) => { s.loading = false; s.error = a.payload })
  },
})
export const { setSelectedAccount } = portfolioSlice.actions
export default portfolioSlice.reducer
