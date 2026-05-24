import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import accountReducer from './slices/accountSlice'
import ipoReducer from './slices/ipoSlice'
import portfolioReducer from './slices/portfolioSlice'
import notificationReducer from './slices/notificationSlice'
import reportReducer from './slices/reportSlice'
import uiReducer from './slices/uiSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    accounts: accountReducer,
    ipo: ipoReducer,
    portfolio: portfolioReducer,
    notifications: notificationReducer,
    reports: reportReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
})
