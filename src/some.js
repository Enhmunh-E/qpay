const functions = require("firebase-functions");
const admin = require('firebase-admin');
const axios = require('axios');
admin.initializeApp();
const db = admin.firestore()
exports.EnkhmunkhCreateInvoice = functions.https.onRequest(async (request, response) => {
    const { amount = null, descriptions = null, callback = null } = request.query;
    // const path = callback.split('/');
    // const id = path[path.length-1];
    // console.log('=================')
    if (amount == null || descriptions == null || callback == null) {
        response.send(JSON.stringify({ response: "Not enough params!!!" }));
        return;
    }
    console.log(amount, descriptions, callback)
    const doc = await db.collection(`enkhmunkh/test/invoice`)
        .add({
            "amount": amount,
            "description": descriptions,
            "callback": `http://localhost:5001/app-1-56fa0/us-central1/EnkhmunkhPayInvoice?callback=${callback}`,
            "status": 'pending'
        })
    response.send(JSON.stringify({qrCode: doc.id}));
});
exports.EnkhmunkhPayInvoice = functions.https.onRequest(async (request, response) => {
    const { qrCode } = request.query;
    console.log
    const doc = await db.collection('enkhmunkh/test/invoice').doc(qrCode).get();
    if (!doc.exists) {
        response.send(JSON.stringify({ response: "failed" }));
        return;
    }
    const data = doc.data();
    if (data.status != 'pending') {
        response.send(JSON.stringify({ response: "failed" }));
        return;
    }
    await db.collection('enkhmunkh/test/invoice')
        .doc(qrCode)
        .update({
            "status": 'paid'
        });
    response.send('success');
});
exports.EnkhmunkhCheckInvoice = functions.https.onRequest(async (request, response) => {
    const { qrCode } = request.query;
    const doc = await db.doc(`enkhmunkh/test/invoice/${qrCode}`).get();
    if (!doc.exists) {
        response.send(JSON.stringify({ response: "failed" }));
        return;
    }
    const data = doc.data();
    response.send(data);
})
const getAmount = async (itemIds) => {
    const promiseAmounts = itemIds.map(async (itemId) => {
        const doc = await db.doc(`enkhmunkh/test/prices/${itemId}`).get();
        const data = doc.data();
        return data.price;
    })
    var amounts = await Promise.all(promiseAmounts);
    amounts = amounts.reduce((a, b) => a + b)
    return amounts;
}
exports.EnkhmunkhCheckOut = functions.https.onRequest(async (request, response) => {
    const { items = null, uid = null } = request.query; 
    if (items == null || uid == null) {
        response.send(JSON.stringify({ response: "no item found !" }));
        return;
    }
    var itemArray = items.split(',');
    const amount = await getAmount(itemArray);
    // console.log(amount, 'amount')
    // console.log(items);
    const doc = await db.collection(`enkhmunkh/test/get`).add({ 
        uid: uid, 
        itemArray: itemArray, 
        amount: amount  
    });
    const res = await axios.get(`http://localhost:5001/app-1-56fa0/us-central1/EnkhmunkhCreateInvoice?amount=${amount}&descriptions=${uid}&callback=${doc.id}`);
    response.send(JSON.stringify(res.data));
});
exports.EnkhmunkhCallOut = functions.https.onRequest(async (request, response) => {
    
})