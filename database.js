var firebase = require('firebase-admin');
var serviceAccount = "./serviceAccountKey.json"     // firebase credentials

module.exports = {initializeApp,getRefRoot,createListener,updateUserProfile,updateUserAddress};

function initializeApp() {
    var serviceAccount = "./serviceAccountKey.json";

    firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: 'https://nacho-crumbs.firebaseio.com'
    });
    return firebase;    
}

function getRefRoot() {
    return firebase.database().ref();
}

function createListener(event, nodeRef) {
    // event = 'child_added', 'child_changed', 'child_removed', 'child_added'
    nodeRef.on(event, function(snap) {
        console.log(JSON.stringify(snap.val()) + "\n\n");
    });
}

function updateUserProfile(channelId, userId, obj) {
    var ref = getRefRoot();
    ref.child('users').child(channelId).child(userId).child('user_profile').update(JSON.parse(obj));
}

function updateUserAddress(channelId,userId,address) {
    var ref = getRefRoot();
    ref.child('users').child(channelId).child(userId).child('address').update(address);
}