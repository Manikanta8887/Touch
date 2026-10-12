import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isStreaming: false,
  streamTitle: "",
  currentStreamerId: null,
};

const streamSlice = createSlice({
  name: "stream",
  initialState,
  reducers: {
    setIsStreaming: (state, action) => {
      state.isStreaming = action.payload;
    },
    setStreamTitle: (state, action) => {
      state.streamTitle = action.payload;
    },
    setStreamerId: (state, action) => {
      state.currentStreamerId = action.payload;
    },
    resetStreamState: (state) => {
      state.isStreaming = false;
      state.streamTitle = "";
      state.currentStreamerId = null;
    },
  },
});

export const { setIsStreaming, setStreamTitle, setStreamerId, resetStreamState } = streamSlice.actions;
export default streamSlice.reducer;
