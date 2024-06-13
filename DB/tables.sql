-- create table user(
--     id int primary key AUTO_INCREMENT,
--     name varchar(250),
--     phone varchar(20),
--     email varchar(50),
--     password varchar(250),
--     status varchar(20),
--     role varchar(20),
--     UNIQUE (email)
-- );

-- insert into
--     user(name, phone, email, password, status, role)
-- values
--     (
--         'Admin',
--         '0722613777',
--         'admin@admin.com',
--         'admin',
--         'true',
--         'admin'
--     );

-- create table category(
--     id int NOT NULL AUTO_INCREMENT,
--     name varchar(255) NOT NULL UNIQUE,
--     primary key(id)
-- );

-- create table product(
--     id int NOT NULL AUTO_INCREMENT,
--     name varchar(255) NOT NULL UNIQUE,
--     categoryID int NOT NULL,
--     description varchar(255),
--     price int,
--     stockQuantity int,
--     status varchar(20),
--     primary key(id)
-- );

-- create table bill(
--     id int NOT NULL AUTO_INCREMENT,
--     uuid varchar(200) NOT NULL UNIQUE,
--     name varchar(255) NOT NULL,
--     email varchar(255) NOT NULL,
--     contactNumber varchar(20) NOT NULL,
--     paymentMethod varchar(50) NOT NULL,
--     total int NOT NULL,
--     productDetails JSON DEFAULT NULL,
--     createdBy varchar(255) NOT NULL,
--     primary key(id)
-- );


-- BILLS
SELECT * from bill
-- SELECT createdBy, SUM(total) FROM bill where total > 100 GROUP BY createdBy ;


-- PRODUCTS 

-- ALTER TABLE product ADD COLUMN stockQuantity int DEFAULT 0;

-- UPDATE product SET stockQuantity = (CASE when id = 1 then stockQuantity-1
-- 										 when id = 2 then stockQuantity-2
-- 									END)
--                                     WHERE id in (1,2,3);

-- SELECT * from product;

-- USER TABLE
-- UPDATE user SET name = 'Staff1', email='staff1@mailinator.com', password='staff1@1234' WHERE id='2';
-- ALTER TABLE user ADD COLUMN bonus int DEFAULT 0;
-- SELECT * from user;