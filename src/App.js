import React, { useState, useEffect } from 'react'
import axios from 'axios'
import QrCode from 'qrcode.react' 
import { firebase, db } from './firebase.js'
import './App.css';
const App = () => {
  const [data, setData] = useState({
    uid: '',
    items: ''
  });
  const [pend, setPend] = useState('');
  const [dt, setDt] = useState({})
  const buy = async () => {
    const res = await axios.get(`https://us-central1-app-1-56fa0.cloudfunctions.net/EnkhmunkhCheckOut?uid=${data.uid}&itemIds=${data.items}`);
    setDt(res.data);
  }
  const handler = (e) => {
    setData({...data, [e.target.id]: e.target.value});
  }
  useEffect(async () => {
    if (dt.qrCode !== '') {
      await db.collection('enkhmunkh/test/invoice').doc(dt.qrCode).onSnapshot((doc) => {
        // const dat = doc.data();
        console.log(doc.data());
       if (doc.data() !== undefined) {
         setPend(doc.data().status);
       }
        // setPend(doc.data().status);
      })
    }
    return () => {}
  }, [firebase, db, dt])
  return (
    <>
      <div className="flex flex-col">
          <input id="items" type="text" value={data.items} onChange={handler}/>
          <input id="uid" type="text" value={data.uid} onChange={handler}/>
          <button onClick={buy}>Buy</button>
      </div>
      {
        pend != '' && (
          <div>pending: {pend}</div>
        )
      }
      {
        dt !== {} && (
          <div className="flex flex-col">
            <div>{dt.qrCode}</div>
            { 
              dt.qrCode && (
                <QrCode value={`https://us-central1-app-1-56fa0.cloudfunctions.net/EnkhmunkhPayInvoice?qrCode=${dt.qrCode}`}/>
              )
            }
            <div>{dt.amount}</div>
            <div>{dt.cartId}</div>
          </div>
        )
      }
    </>
  );
}

export default App;
