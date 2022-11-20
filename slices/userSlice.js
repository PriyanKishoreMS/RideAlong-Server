const {createSlice, createAsyncThunk} = require('@reduxjs/toolkit');
import AsyncStorage from '@react-native-community/async-storage';
import {IP} from '@env';
// send jwt token in header

const onValueChange = async (item, selectedValue) => {
  try {
    await AsyncStorage.setItem(item, selectedValue);
    console.log('saved');
  } catch (e) {
    console.log(`AsyncStorage error: ${e.message}`);
  }
};

export const postUser = createAsyncThunk('user/postUser', async ({users}) => {
  // console.log(users, 'users from postUser');
  return await fetch(`http://${IP}/api/users`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      uid: users.uid,
      email: users.email,
      name: users.name,
      photoURL: users.photoURL,
    }),
  })
    .then(res => res.json())
    .then(data => {
      onValueChange('token', data.token);
      // console.log(data.token, 'token from postUser');
    })
    .catch(err => console.log(err));
});

export const postFriend = createAsyncThunk('user/postFriend', async id => {
  var token = await AsyncStorage.getItem('token');
  return await fetch(`http://${IP}/api/users/friend/${id}`, {
    method: 'PATCH',
    headers: {
      'auth-token': token,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
    .then(res => res.json())
    .then(data => {
      console.log(data, 'data from postFriend');
      return data;
    })
    .catch(err => console.error(err, 'error from postFriend'));
});

const userSlice = createSlice({
  name: 'user',
  initialState: {
    user: null,
    loading: false,
    error: null,
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
  },
  extraReducers: {
    [postUser.pending]: (state, action) => {
      state.loading = true;
    },
    [postUser.fulfilled]: (state, action) => {
      state.loading = false;
      state.user = action.payload;
    },
    [postUser.rejected]: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    [postFriend.pending]: (state, action) => {
      state.loading = true;
    },
    [postFriend.fulfilled]: (state, action) => {
      state.loading = false;
      state.profile = action.payload;
    },
    [postFriend.rejected]: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export default userSlice.reducer;
