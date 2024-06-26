const express = require("express");
const connection = require("../connection");
const { query } = require("../connection");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const nodemailer = require("nodemailer");

const auth = require("../services/auth");
const role = require("../services/checkRole");

const router = express.Router();

router.post("/signup", (req, res) => {
  let user = req.body;

  let query = "select email, password, role, status from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        let query =
          "insert into user(name, phone, email, password, status, role) values(?, ?, ?, ?, 'false', 'user')";

        connection.query(
          query,
          [user.name, user.phone, user.email, user.password],
          (err, results) => {
            if (!err) {
              return res.status(200).json({
                message: "Successfully registered",
              });
            } else {
              return res.status(500).json({ err });
            }
          }
        );
      } else {
        return res.status(400).json({ message: "Email already exists" });
      }
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.post("/login", (req, res) => {
  const user = req.body;

  let query = "select email, password, role, status from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0 || results[0].password !== user.password) {
        return res.status(401).json({ message: "Incorrect username/password" });
      } else if (results[0].status === "false") {
        return res.status(401).json({ message: "Await admin approval" });
      } else if (results[0].password === user.password) {
        const response = {
          email: results[0].email,
          role: results[0].role,
        };

        const accessToken = jwt.sign(response, process.env.SECRET, {
          expiresIn: "1h",
        });

        res.status(200).json({
          token: accessToken,
          message: "User logged in",
        });
      } else {
        return res
          .status(400)
          .json({ message: "Something went wrong. Please try again!" });
      }
    } else {
      return res.status(500).json({ err });
    }
  });
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

router.post("/forgotPassword", (req, res) => {
  const user = req.body;
  let query = "select email, password from user where email=?";
  connection.query(query, [user.email], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        return res.status(200).json({
          message: "Password sent to your email",
        });
      } else {
        let mailOptions = {
          from: process.env.EMAIL,
          to: results[0].email,
          subject: "Password retrieval by Cafe Management system",
          html:
            "<p>Your login details for the Cafe Management System <br> Email: " +
            results[0].email +
            "<br> Password: " +
            results[0].password +
            "<br> <a href='http://localhost:8088'>Click Here to Login</a>" +
            "</p>",
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
          } else {
            console.log(info.response);
            console.log(" \n Email sent");
            return res.status(200).json({
              message: "Password sent to your email",
            });
          }
        });
      }
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.get("/get", auth.authenticate, role.checkRole, (req, res) => {
  let query = 'select id,name,email,phone, bonus, status from user';

  connection.query(query, (err, results) => {
    if (!err) {
      return res.status(200).json({ data: results });
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.get("/bonus", auth.authenticate, role.checkRole, async (req, res) => {
  const query = `SELECT createdBy, SUM(total) as total FROM bill where total >= 100 AND bonusCalculated=0 GROUP BY createdBy;`
  let details = []
  await connection.promise().query(query).then(data => {
    details = data[0];
    console.log(`DATA >> ${details}`)
  })
  console.log(`DETAILS >> ${details}`)

  if(details.length==0){
    return res.status(200).json({ message: "No Pending Bonus"})
  }
  
  let updateQuery = ""
  let idString = "";
  details.forEach(empDetail => {
    updateQuery = updateQuery + `when email='${empDetail.createdBy}' then bonus+${empDetail.total/10} `;
    idString = idString + `'${empDetail.createdBy}',`
  })

  let finalQuery = `UPDATE user SET bonus = ( CASE ${updateQuery} END) WHERE email in (${idString.slice(0, -1)});`
  console.log(`FINAL QUERY >> ${finalQuery}`)
  await connection.promise().beginTransaction();
  try{
    connection.promise().query(finalQuery).then(data => {
      console.log(`BONUS DATA >> ${JSON.stringify(data)}`)
      const theQuery = `UPDATE bill SET bonusCalculated=1 WHERE bonusCalculated=0;`
      return connection.promise().query(theQuery)
    }).then(async details => {
      await connection.promise().commit();
    })
  } catch(err) {
    await connection.promise().rollback();
    return res.status(500).json({ err });
  }

  return res.status(200).json({ message: "bonus has been imbursed"})
})

router.patch("/update", auth.authenticate, role.checkRole, (req, res) => {
  let user = req.body;
  let query = "update user set status=? where id=?";
  connection.query(query, [user.status, user.id], (err, results) => {
    if (!err) {
      if (results.affectedRows == 0) {
        return res.status(404).json({ message: "User ID does not exist" });
      }
      return res.status(200).json({ message: " User updated successfully" });
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.get("/checkToken", auth.authenticate, (req, res) => {
  return res.status(200).json({ message: "true" });
});

router.post("/changePassword", auth.authenticate, (req, res) => {
  const user = req.body;
  const email = res.locals.email;
  let query = "select * from user where email=? and password=?";
  connection.query(query, [email, user.oldPassword], (err, results) => {
    if (!err) {
      if (results.length <= 0) {
        return res.status(400).json({ message: "Incorrect password" });
      } else if (results[0].password === user.oldPassword) {
        let query = "update user set password=? where email=?";
        connection.query(query, [user.newPassword, email], (err, results) => {
          if (!err) {
            return res
              .status(200)
              .json({ message: "Password updated successfully" });
          } else {
            return res.status(500).json({ err });
          }
        });
      } else {
        return res
          .status(400)
          .json({ message: "Something went wrong!! Please try again" });
      }
    } else {
      return res.status(500).json({ err });
    }
  });
});

module.exports = router;
