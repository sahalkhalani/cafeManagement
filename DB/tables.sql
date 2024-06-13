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

-- create table information(
-- 	id int primary key AUTO_INCREMENT,
-- 	revenue int);

-- CREATE TABLE payment_history (
-- 	id int primary key AUTO_INCREMENT,
--     emp_id INT,
--     payment_date DATE,
--     payment_amount INT,
--     FOREIGN KEY (emp_id) REFERENCES user(id)
-- );

select * from payment_history;

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
SELECT * from bill ;
-- SELECT createdBy, SUM(total) as total FROM bill where total > 100 AND bonusCalculated=0 GROUP BY createdBy;


-- PRODUCTS 

-- ALTER TABLE product ADD COLUMN stockQuantity int DEFAULT 0;

-- UPDATE product SET stockQuantity = (CASE when id = 1 then stockQuantity-1
-- 										 when id = 2 then stockQuantity-2
-- 									END)
--                                     WHERE id in (1,2,3);

-- SELECT * from product;

-- USER TABLE
-- ALTER TABLE user ADD COLUMN bonus int DEFAULT 0;
-- SELECT * from user;

-- LOW STOCK TRIGGER 
-- DELIMITER //
-- CREATE TRIGGER low_stock_trigger
-- AFTER UPDATE ON product
-- FOR EACH ROW
-- BEGIN
--     SET @productName = NEW.name;
--     SET @notificationString = CONCAT(@productName, ' needs to be restocked');
--     IF NEW.stockQuantity < 10 THEN
--         INSERT INTO notifications (notificationMsg) VALUES (@notificationString);
--     END IF;
-- END;
-- DELIMITER;
-- SHOW TRIGGERS;

-- BONUS TRIGGER 
DELIMITER //
CREATE TRIGGER pay_the_bonus_trigger
AFTER UPDATE ON user
FOR EACH ROW
BEGIN
    -- SET @productName = NEW.name;
    IF NEW.bonus >= 500 THEN
        INSERT INTO payment_history (emp_id, payment_date, payment_amount) VALUES (NEW.id, CURRENT_DATE, NEW.bonus);
    END IF;
END;
DELIMITER;

SHOW TRIGGERS;

-- DROP TRIGGER pay_the_bonus_trigger;

select * from payment_history;

select * from notifications;

select * from bill;
select * from user;
select * from information;




