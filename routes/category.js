const express = require("express");
const connection = require("../connection");
const auth = require("../services/auth");
const role = require("../services/checkRole");

const router = express.Router();

router.post("/add", auth.authenticate, role.checkRole, (req, res, next) => {
  let category = req.body;
  let query = "insert into category (name) values(?)";
  connection.query(query, [category.name], (err, results) => {
    if (!err) {
      return res.status(200).json({ message: "Category added successfully" });
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.get("/get", (req, res, next) => {
  let query = "select * from category order by name";
  connection.query(query, (err, results) => {
    if (!err) {
      return res.status(200).json({ data: results });
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.patch("/update", auth.authenticate, role.checkRole, (req, res, next) => {
  let product = req.body;
  let query = "update category set name=? where id=?";
  connection.query(query, [product.name, product.id], (err, results) => {
    if (!err) {
      if (results.affectedRows == 0) {
        return res.status(404).json({ message: " Category ID not found" });
      }
      return res.status(200).json({ message: "Category updated successfully" });
    } else {
      return res.status(500).json({ err });
    }
  });
});

router.delete("/delete/:id", auth.authenticate, role.checkRole, async (req, res, next)=>{
  const id=req.params.id;
  await connection.promise().beginTransaction();
  try{
    const deleteCategoryQuery = `delete from category where id=${id}`;
    connection.promise().query(deleteCategoryQuery).then(result => {
      const deleteProductsQuery = `delete from product where categoryID=${id}`;
      return connection.promise().query(deleteProductsQuery);
    }).then(async details => {
      await connection.promise().commit();
      return res
        .status(200)
        .json({ message: "Category deleted successfully" });
    })
  }catch(e) {
    await connection.promise().rollback();
    
    console.log(`ROLLBACK ERROR >> ${e}`)
    return res.status(500).json({ e });

  }
})

module.exports = router;
