const functions = require("firebase-functions");
const admin = require('firebase-admin');
const axios = require('axios');
admin.initializeApp();
const db = admin.firestore();

exports.EnkhmunkhCreateInvoice = functions.https.onRequest(async (request, response) => {
    const { amount = null, callback = null } = request.query;
    
    if (amount == null || callback == null) {
        response.send(JSON.stringify({ response: "Not enough params!!!" }));
        return;
    }

    const doc = await db.collection(`enkhmunkh/test/invoice`)
        .add({
            amount: amount,
            callback,
            status: `pending`
        });
    response.send(JSON.stringify({ qrCode: doc.id }));
});
exports.EnkhmunkhPayInvoice = functions.https.onRequest(async (request, response) => {
    const { qrCode = null } = request.query;
    const doc = await db.collection(`enkhmunkh/test/invoice`).doc(qrCode).get();
    
    if (!doc.exists || qrCode == null) {
        response.send(JSON.stringify({ response: "failed" }));
        return;
    }
    
    await db.collection(`enkhmunkh/test/invoice`)
        .doc(qrCode)
        .update({
            status: "paid"
        });
    const doc2 = await db.collection(`enkhmunkh/test/invoice`).doc(qrCode).get();
    if (!doc2.exists) {
        response.send(JSON.stringify({ response: 'failed_to_get_invoice' }));
        return;
    }
    const data = doc2.data();
    await axios(data.callback);
    response.send(JSON.stringify({ response: "success" }));
});
exports.EnkhmunkhCheckInvoice = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    const { qrCode = null} = request.query;
    const doc = await db.collection(`enkhmunkh/test/invoice`).doc(qrCode).get();
    
    if (!doc.exists || qrCode == null) {
        response.send(JSON.stringify({ response: "failed" }));
        return;
    }
    const data = doc.data();

    response.send(JSON.stringify(data));
});
const getAmount = async (itemIds) => {
    const promiseAmounts = itemIds.map(async (itemId) => {
        const doc = await db.doc(`enkhmunkh/test/prices/${itemId}`).get();
        const data = doc.data();
        return data.price;
    });
    var amounts = await Promise.all(promiseAmounts);
    amounts = amounts.reduce((a, b) => a + b);
    return amounts;
}
exports.EnkhmunkhCheckOut = functions.https.onRequest(async (request, response) => {
    response.set('Access-Control-Allow-Origin', '*');
    const { uid = null, itemIds = null } = request.query;
    if (uid == null || itemIds == null) {
        response.send(JSON.stringify({ response: `not_enough_params` }));
        return;
    }
    let Ids = itemIds.split(',')
    const amount  = await getAmount(Ids);
    const doc = await db.collection(`enkhmunkh/test/cart`)
        .add({
            amount: amount,
            status: "pending",
            id: uid,
            items: Ids
        });
    const res = await axios.get(`https://us-central1-app-1-56fa0.cloudfunctions.net/EnkhmunkhCreateInvoice?amount=${amount}&callback=https://us-central1-app-1-56fa0.cloudfunctions.net//EnkhmunkhCallBack?cartId=${doc.id}`);
    response.send(JSON.stringify({
        qrCode: res.data.qrCode,
        amount: amount,
        cartId: doc.id
    }));
});
exports.EnkhmunkhCallBack = functions.https.onRequest(async (request, response) => {
    const { cartId = null } = request.query;
    if (cartId == null) {
        response.send(JSON.stringify({
            response: "failed",
        }))
    }
    await db.collection(`enkhmunkh/test/cart`)
        .doc(cartId)
        .update({
            status: "paid",
        });
    response.send(JSON.stringify({
        response: "success"
    }))
});