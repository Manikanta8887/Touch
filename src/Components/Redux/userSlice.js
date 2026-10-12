import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  firebaseUser: null,
  profilePic: null,
  bio: "",
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setFirebaseUser: (state, action) => {
      if (!action.payload) {
        state.firebaseUser = null;
        state.profilePic = null;
        state.bio = "";
        return;
      }
      const { uid, email, displayName, photoURL, bio } = action.payload;
      state.firebaseUser = { uid, email, displayName, photoURL };
      if (photoURL) state.profilePic = photoURL;
      if (bio !== undefined) state.bio = bio;
    },

    updateProfilePic: (state, action) => {
      state.profilePic = action.payload;
      if (state.firebaseUser) {
        state.firebaseUser.photoURL = action.payload;
      }
    },

    updateUser: (state, action) => {
      if (!action.payload) return;
      if (state.firebaseUser) {
        state.firebaseUser = { ...state.firebaseUser, ...action.payload };
      } else {
        state.firebaseUser = action.payload;
      }
      if (action.payload.profilePic) {
        state.profilePic = action.payload.profilePic;
      }
      if (action.payload.bio !== undefined) {
        state.bio = action.payload.bio;
      }
    },

    logoutUser: (state) => {
      state.firebaseUser = null;
      state.profilePic = null;
      state.bio = "";
    },
  },
});

export const { setFirebaseUser, updateProfilePic, updateUser, logoutUser } = userSlice.actions;

export default userSlice.reducer;
