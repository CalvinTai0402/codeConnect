import firebase from 'firebase/app'
import 'firebase/auth'
import 'firebase/database'
import 'firebase/storage'

const firebaseConfig = {
    apiKey: "AIzaSyA97c6gHXDPUXGrugIc_PSoag2Ya90_upM",
    authDomain: "slackclone-8cd3e.firebaseapp.com",
    projectId: "slackclone-8cd3e",
    storageBucket: "slackclone-8cd3e.appspot.com",
    messagingSenderId: "233272554635",
    appId: "1:233272554635:web:70cbfeb0720c6f3fd1108e",
    measurementId: "G-XHEH11RNPG"
};

firebase.initializeApp(firebaseConfig)
export default firebase