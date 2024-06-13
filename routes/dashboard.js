const express = require("express");
const connection = require("../connection");
const auth = require("../services/auth");
const role = require("../services/checkRole");

const router = express.Router();

router.get("/details", auth.authenticate, (req, res, next) => {
  let categoryCount;
  let productCount;
  let billCount;
  let notifications = [];

  let queryCategory = "select count(id) as categoryCount from category";
  connection.query(queryCategory, (err, results) => {
    if (!err) {
      categoryCount = results[0].categoryCount;
    } else {
      return res.status(500).json({ err });
    }
  });

  let queryProduct = "select count(id) as productCount from product";
  connection.query(queryProduct, (err, results) => {
    if (!err) {
      productCount = results[0].productCount;
    } else {
      return res.status(500).json({ err });
    }
  });
  
  let queryNotification = 'select * from notifications where isRead=0';
  connection.query(queryNotification, (err, result) => {
    if(!err) {
      result.forEach(notification => {
        notifications.push({notificationMsg: notification.notificationMsg, isRead: !!!notification.isRead})
      })
    }
  })

  let queryBill = "select count(id) as billCount from bill";
  connection.query(queryBill, (err, results) => {
    if (!err) {
      billCount = results[0].billCount;
      let data = {
        category: categoryCount,
        product: productCount,
        bill: billCount,
        notifications
      };
      return res.status(200).json({ data });
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.get("/markNotifications", auth.authenticate, (req, res, next) => {
  const queryMarkNotifications = `update notifications SET isRead=1` 
  connection.query(queryMarkNotifications, (err, result) => {
    console.log(`ERROR >> ${err}`)
    console.log(`result >> ${result}`)
    if(!err){
      return res.status(200).json({ message: "All notifications marked as read." });
    }
    else {
      return res.status(500).json({err})
    }
  })
})

module.exports = router;
