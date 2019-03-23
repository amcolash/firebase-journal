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

export default firebase.initializeApp(config);