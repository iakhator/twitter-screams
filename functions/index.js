const functions = require("firebase-functions");
const app = require("express")();
const FBAuth = require("./utils/fbAuth");

const { db } = require("./utils/admin");

const {
  getAllScreams,
  postScream,
  getScream,
  commentOnScream,
  likeScream,
  unlikeScream,
  deleteScream
} = require("./handlers/scream");
const {
  signUp,
  login,
  uploadImage,
  addUserDetails,
  getUser,
  getUserDetails,
  markNotificationsRead
} = require("./handlers/user");

// scream Routes
app.get("/screams", getAllScreams);
app.post("/scream", FBAuth, postScream);
app.get("/scream/:screamId", getScream);
app.delete("/scream/:screamId", FBAuth, deleteScream);
app.get("/scream/:screamId/like", FBAuth, likeScream);
app.get("/scream/:screamId/unlike", FBAuth, unlikeScream);
app.post("/scream/:screamId/comment", FBAuth, commentOnScream);

// user Routes
app.post("/signup", signUp);
app.post("/login", login);
app.post("/user/image", FBAuth, uploadImage);
app.post("/user", FBAuth, addUserDetails);
app.get("/user", FBAuth, getUser);
app.get("/user/:handle", getUserDetails);
app.post("/notifications", FBAuth, markNotificationsRead);

exports.api = functions.region("europe-west1").https.onRequest(app);

exports.createNoficationOnLike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().handle !== snapshot.data().handle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().handle,
            sender: snapshot.data().handle,
            type: "like",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.createNoficationOnComment = functions
  .region("europe-west1")
  .firestore.document("comments/{id}")
  .onCreate(snapshot => {
    return db
      .doc(`/screams/${snapshot.data().screamId}`)
      .get()
      .then(doc => {
        if (doc.exists && doc.data().handle !== snapshot.data().handle) {
          return db.doc(`/notifications/${snapshot.id}`).set({
            createdAt: new Date().toISOString(),
            recipient: doc.data().handle,
            sender: snapshot.data().handle,
            type: "comment",
            read: false,
            screamId: doc.id
          });
        }
      })
      .catch(err => {
        console.error(err);
      });
  });

exports.deleteNoficationOnUnlike = functions
  .region("europe-west1")
  .firestore.document("likes/{id}")
  .onDelete(snapshot => {
    return db
      .doc(`/notifications/${snapshot.id}`)
      .delete()
      .catch(err => {
        console.error(err);
        return;
      });
  });

exports.onUserImageChange = functions
  .region("europe-west1")
  .firestore.document("/users/{userId}")
  .onUpdated(change => {
    let batch = db.batch();
    if (change.before.data().imageUrl !== change.after.data().imageUrl) {
      return db
        .collection("screams")
        .where("handle", "==", change.before.data().handle)
        .get()
        .then(data => {
          data.forEach(doc => {
            const scream = db.doc(`/screams/${doc.id}`);
            batch.update(scream, { userImage: change.after.data().imageUrl });
          });
          return batch.commit();
        });
    }
  });

exports.onScreamDelete = functions
  .region("europe-west1")
  .firestore.document("screams/{screamId}")
  .onDelete((snapshot, context) => {
    const screamId = context.params.screamId;
    const batch = db.batch();
    return db
      .collection("comments")
      .where("screamId", "==", screamId)
      .get()
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/comment/${doc.id}`));
        });
        return db.collection("likes").where("screamId", "==", screamId);
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/likes/${doc.id}`));
        });
        return db.collection("notifications").where("screamId", "==", screamId);
      })
      .then(data => {
        data.forEach(doc => {
          batch.delete(db.doc(`/notifications/${doc.id}`));
        });
        return batch.commit();
      })
      .catch(error => {
        console.error;
      });
  });
