require("dotenv").config();
const admin = require("firebase-admin");
var serviceAccount = require("../config/serviceAccountKey.js");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialmedia-7466e.firebaseio.com",
  storageBucket: process.env.STORAGE_BUCKET
});

const db = admin.firestore();
module.exports = { admin, db };
