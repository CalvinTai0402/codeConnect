import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyBKGMSoFtSIyciZCCxI5Fp22xqLR1x8XBk",
    authDomain: "codeconnect-ce7e0.firebaseapp.com",
    projectId: "codeconnect-ce7e0",
    storageBucket: "codeconnect-ce7e0.appspot.com",
    messagingSenderId: "431301942812",
    appId: "1:431301942812:web:9653fdc12716f237c489d9",
    measurementId: "G-L4KRZBRZ93"
};

firebase.initializeApp(firebaseConfig)
export default firebase

//https://stackoverflow.com/questions/37760695/firebase-storage-and-access-control-allow-origin/37765371