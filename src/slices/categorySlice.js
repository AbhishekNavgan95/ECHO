import { createSlice } from "@reduxjs/toolkit"

const categorySlice = createSlice({
  name: "category",
  initialState: {
    data: []
  },
  reducers: {
    setCategory: (state, action) => {
      state.data = action.payload
    },
  },
})

export const {
    setCategory,
} = categorySlice.actions

export default categorySlice.reducer