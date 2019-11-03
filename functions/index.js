const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./utils/fbAuth");

const { getAllScreams, postScream } = require("./handlers/scream");
const { signUp, login, uploadImage } = require("./handlers/user");

// scream Routes
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postScream);

// user Routes
app.post("/signup", signUp);
app.post("/login", login);
app.post("/user/image", uploadImage);

exports.api = functions.region("europe-west1").https.onRequest(app);
