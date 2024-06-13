const express = require("express");
const mysql = require("mysql");
const connection = require("../connection");
const auth = require("../services/auth");
const ejs = require("ejs");
const pdf = require("html-pdf");
const path = require("path");
const fs = require("fs");
const uuid = require("uuid");

const router = express.Router();

var mySqlConnection = mysql.createConnection({
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

router.post("/generateReport", auth.authenticate, async (req, res) => {
  const orderDetails = req.body;
  const generatedUUID = uuid.v1();
  let productDetailsReport = JSON.parse(orderDetails.productDetails);

  let updateQuery = "";
  let idString = "";
  productDetailsReport.forEach((productDetail) => {
    updateQuery = updateQuery + `when id=${productDetail.id} then stockQuantity-${productDetail.quantity} `;
    idString = idString + `${productDetail.id},`
  })

  await connection.promise().beginTransaction();
  try{
    const query = `insert into bill (name, uuid, email, contactNumber, paymentMethod, total, productDetails, createdBy) values(?,?,?,?,?,?,?,?);`
    connection.promise().query(query, 
      [
        orderDetails.name,
        generatedUUID,
        orderDetails.email,
        orderDetails.contactNumber,
        orderDetails.paymentMethod,
        orderDetails.totalAmount,
        orderDetails.productDetails,
        res.locals.email,
      ]).then(data => {
      const theQuery = `UPDATE product SET stockQuantity = ( CASE ${updateQuery} END) WHERE id in (${idString.slice(0, -1)});`
      return connection.promise().query(theQuery)
    }).then(async details => {
      await connection.promise().commit();
      ejs.renderFile(
        path.join(__dirname, "", "report.ejs"),
        {
          productDetails: productDetailsReport,
          name: orderDetails.name,
          email: orderDetails.email,
          contactNumber: orderDetails.contactNumber,
          paymentMethod: orderDetails.paymentMethod,
          totalAmount: orderDetails.totalAmount,
        },
        (err, results) => {
          if (err) {
            console.log(err)
            return res.status(500).json({ err });
          } else {
            pdf
              .create(results)
              .toFile(
                "../generated_PDF/" + generatedUUID + ".pdf",
                (err, data) => {
                  if (err) {
                    console.log(err);
                    return res.status(500).json({ err });
                  } else {
                    return res.status(200).json({ uuid: generatedUUID });
                  }
                }
              );
          }
        }
      );
      console.log("Commit done")
    })
  }
  catch (e){
    await connection.promise().rollback();
    
    console.log(`ROLLBACK ERROR >> ${e}`)
    return res.status(500).json({ e });
  }


  // connection.query(
  //   query,
  //   [
  //     orderDetails.name,
  //     generatedUUID,
  //     orderDetails.email,
  //     orderDetails.contactNumber,
  //     orderDetails.paymentMethod,
  //     orderDetails.totalAmount,
  //     orderDetails.productDetails,
  //     res.locals.email,
  //   ],
  //   (err, results) => {
  //     if (!err) {
  //       connection.query(updateQuery, (error, result)=> {
  //         console.log(error)
  //         console.log(result)
  //       })
  //       ejs.renderFile(
  //         path.join(__dirname, "", "report.ejs"),
  //         {
  //           productDetails: productDetailsReport,
  //           name: orderDetails.name,
  //           email: orderDetails.email,
  //           contactNumber: orderDetails.contactNumber,
  //           paymentMethod: orderDetails.paymentMethod,
  //           totalAmount: orderDetails.totalAmount,
  //         },
  //         (err, results) => {
  //           if (err) {
  //             console.log(err)
  //             return res.status(500).json({ err });
  //           } else {
  //             pdf
  //               .create(results)
  //               .toFile(
  //                 "../generated_PDF/" + generatedUUID + ".pdf",
  //                 (err, data) => {
  //                   if (err) {
  //                     console.log(err);
  //                     return res.status(500).json({ err });
  //                   } else {
  //                     return res.status(200).json({ uuid: generatedUUID });
  //                   }
  //                 }
  //               );
  //           }
  //         }
  //       );
  //     } else {
  //       console.log(err)
  //       return res.status(500).json({ err });
  //     }
  //   }
  // );
});

router.post("/getPDF", auth.authenticate, (req, res) => {
  const orderDetails = req.body;
  const pdfPath = "../generated_PDF/" + orderDetails.uuid + ".pdf";
  if (fs.existsSync(pdfPath)) {
    res.contentType("application/pdf");
    fs.createReadStream(pdfPath).pipe(res);
  } else {
    let productDetailsReport = JSON.parse(orderDetails.productDetails);
    ejs.renderFile(
      path.join(__dirname, "", "report.ejs"),
      {
        productDetails: productDetailsReport,
        name: orderDetails.name,
        email: orderDetails.email,
        contactNumber: orderDetails.contactNumber,
        paymentMethod: orderDetails.paymentMethod,
        totalAmount: orderDetails.totalAmount,
      },
      (err, results) => {
        if (err) {
          return res.status(200).json({ err });
        } else {
          pdf
            .create(results)
            .toFile(
              "./generated_PDF/" + orderDetails.uuid + ".pdf",
              (err, data) => {
                if (err) {
                  console.log(err);
                  return res.status(500).json({ err });
                } else {
                  res.contentType("application/pdf");
                  fs.createReadStream(pdfPath).pipe(res);
                }
              }
            );
        }
      }
    );
  }
});

router.get("/getBills", auth.authenticate, (req, res, next) => {
  let query = "select * from bill order by id DESC";
  connection.query(query, (err, results) => {
    let revenue = 0;
    if (!err) {
      connection.query("select revenue from information", (err, result) => {
        revenue = result[0].revenue;
        return res.status(200).json({ data: results, revenue: revenue });
      })
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.delete("/delete/:id", auth.authenticate, async (req, res, next) => {
  const id = req.params.id;
  let query = `UPDATE information SET revenue = revenue + (SELECT SUM(total) FROM bill where id=${id});`;
  let deleteQuery = `delete from bill where id=${id}`;

  await connection.promise().beginTransaction();
  try{
    await connection.promise().query(query).then(data => {
      return connection.promise().query(deleteQuery)
    }).then(async details => {
      await connection.promise().commit();})
      return res.status(200).json({ message: "Bill deleted successfully" });
  } catch(err) {
    await connection.promise().rollback();
    return res.status(500).json({ err });
  }

});

module.exports = router;
