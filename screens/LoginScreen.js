import {View, Text, Image} from 'react-native';
import React, {useEffect, useContext, useState} from 'react';
import {useNavigation} from '@react-navigation/native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useDispatch, useSelector} from 'react-redux';
import auth from '@react-native-firebase/auth';
import tw from 'twrnc';
import {Button} from 'react-native-elements';

import {postUser} from '../slices/userSlice';
import {AuthContext} from '../hooks/useAuth';
import {getSingleUser, getSingleProfile} from '../slices/profileSlice';
import {Icon} from 'react-native-elements';
import {SafeAreaView} from 'react-native';
import {GOOGLE_WEBCLIENTID} from '@env';

const LoginScreen = () => {
  const {googleSignin} = useContext(AuthContext);
  const {profile, setProfile} = useContext(AuthContext);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId: GOOGLE_WEBCLIENTID,
    });
  }, []);

  const dispatch = useDispatch();

  const handleUserSignIn = async () => {
    try {
      await googleSignin();
      const userInfo = auth().currentUser;
      const users = {
        uid: userInfo.uid,
        name: userInfo.displayName,
        email: userInfo.email,
        photoURL: userInfo.photoURL,
      };
      await dispatch(postUser({users}));
      dispatch(getSingleUser())
        .then(res => {
          if (res.payload == 200) {
            dispatch(getSingleProfile());
            setProfile(false);
          } else setProfile(true);
        })
        .catch(err => console.log(err));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <SafeAreaView style={tw`flex-1`}>
      <Image
        source={require('../assets/images/carbgw.jpg')}
        style={tw`absolute w-full h-full opacity-75`}
      />
      {/* <View style={tw`mb-10 mt-15 justify-center rounded-xl p-3 px-10 w-full`}>
        <View style={tw`flex-row`}>
          <Icon
            name="bolt"
            type="material"
            size={30}
            color="#ca8a04"
            style={tw``}
          />
          <Text style={tw`text-black font-medium text-xl `}>
            Rides for Free!
          </Text>
        </View>
        <View style={tw`flex-row`}>
          <Icon
            name="bolt"
            type="material"
            size={30}
            color="#ca8a04"
            style={tw``}
          />
          <Text style={tw`text-black font-medium text-xl `}>
            No more lonely rides!
          </Text>
        </View>
        <View style={tw`flex-row`}>
          <Icon
            name="bolt"
            type="material"
            size={30}
            color="#ca8a04"
            style={tw``}
          />
          <Text style={tw`text-black font-medium text-xl `}>
            Find a ride buddy!
          </Text>
        </View>
      </View> */}
      <View style={tw`flex items-center justify-center`}>
        <Image
          source={require('../assets/images/RideAlong.png')}
          style={tw` opacity-100 w-100 h-20 mt-55`}
        />

        <Button
          title="Google Sign-In"
          onPress={() => handleUserSignIn()}
          icon={{
            name: 'google',
            type: 'font-awesome',
            color: 'white',
            marginRight: 10,
            size: 20,
          }}
          buttonStyle={{
            marginTop: 30,
            backgroundColor: 'black',
            width: 200,
            height: 40,
            borderColor: 'transparent',
            borderWidth: 0,
            borderRadius: 5,
          }}
          //google button text style
          titleStyle={{
            color: 'white',
          }}
        />
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
