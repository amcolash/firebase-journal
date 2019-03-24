// Import the Firebase modules that you need in your app.
import firebase from 'firebase/app';
import 'firebase/auth';
import 'firebase/database';

// Initalize and export Firebase.
const config = {
  apiKey: "AIzaSyCwPVVnsjU7CwUhJLCzOXFVP7Ob76ROmcc",
  authDomain: "fir-journal-5a7a6.firebaseapp.com",
  databaseURL: "https://fir-journal-5a7a6.firebaseio.com",
  projectId: "fir-journal-5a7a6",
  storageBucket: "fir-journal-5a7a6.appspot.com",
  messagingSenderId: "335873153280"
};

const app = firebase.initializeApp(config);

function signIn() {
  app.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION).then(() => {
    app.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider()).then(result => {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken;
      // The signed-in user info.
      var user = result.user;
      console.log(token, user);
      // ...
    }).catch(error => {
      // Handle Errors here.
      var errorCode = error.code;
      var errorMessage = error.message;
      // The email of the user's account used.
      var email = error.email;
      // The firebase.auth.AuthCredential type that was used.
      var credential = error.credential;
      console.log(errorCode, errorMessage, email, credential);
      // ...
    });
  });
}

export default {
  app,
  signIn
};