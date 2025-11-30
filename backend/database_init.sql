-- 创建数据库
CREATE DATABASE IF NOT EXISTS ByteDance;
USE ByteDance;

-- 1. 普通用户表 (Users) - C端用户
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 商家表 (Merchants) - B端商家 (独立账号)
CREATE TABLE IF NOT EXISTS merchants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE, -- 商家登录账号
    password VARCHAR(255) NOT NULL,
    shop_name VARCHAR(100) NOT NULL, -- 店铺名称
    contact_phone VARCHAR(20),
    address VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2.1 常用地址簿 (Address Book)
CREATE TABLE IF NOT EXISTS address_book (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT NOT NULL,
    name VARCHAR(50) NOT NULL, -- 地址别名，如"北京总仓"
    contact_name VARCHAR(50) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    address_text VARCHAR(255) NOT NULL,
    lat DOUBLE,
    lng DOUBLE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

-- 3. 配送规则表 (Delivery Rules)
CREATE TABLE IF NOT EXISTS delivery_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    merchant_id INT, -- 关联商家
    company VARCHAR(100) NOT NULL,
    days VARCHAR(100),
    intra_city VARCHAR(50),
    in_province VARCHAR(50),
    inter_province VARCHAR(50),
    remote VARCHAR(50),
    area VARCHAR(100),
    path JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

-- 4. 订单表 (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    merchant_id INT, -- 商家ID
    user_id INT, -- 用户ID (如果是注册用户下单)
    status VARCHAR(20) DEFAULT 'pending',
    amount DECIMAL(10, 2),
    
    -- 发货人信息 (通常是商家，但也可以自定义)
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(20) NOT NULL,
    sender_address TEXT NOT NULL,
    sender_lat DOUBLE NOT NULL,
    sender_lng DOUBLE NOT NULL,

    -- 收货人信息
    recipient_name VARCHAR(100),
    recipient_phone VARCHAR(20),
    address_text TEXT,
    address_lat DOUBLE,
    address_lng DOUBLE,

    -- 货物信息
    item_name VARCHAR(100),
    weight DECIMAL(10, 2),
    quantity INT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 5. 订单轨迹表 (Order Tracking)
CREATE TABLE IF NOT EXISTS order_tracking (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) UNIQUE, -- 确保每个订单只有一条最新轨迹
    lat DOUBLE,
    lng DOUBLE,
    status VARCHAR(50),
    ts BIGINT,
    
    -- 物流信息 (冗余存储在轨迹表中)
    shipped_at DATETIME, -- 发货时间
    delivery_days VARCHAR(50), -- 承诺时效
    route_path JSON, -- 规划路径 [[lng, lat], [lng, lat], ...]

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

-- 初始化数据

-- 普通用户
INSERT INTO users (username, password, real_name, phone) VALUES ('user1', '123456', '张三', '13800000001');

-- 商家
INSERT INTO merchants (username, password, shop_name, contact_phone, address) 
VALUES ('wok', '123456', 'Wok Store', '13800138000', '北京市海淀区中关村');

-- 配送规则
INSERT INTO delivery_rules (merchant_id, company, days, intra_city, in_province, inter_province, remote, area, path) 
VALUES 
((SELECT id FROM merchants WHERE username='wok'), '顺丰速运', '次日达 / 次日达', '次日达', '次日达', '1-2天', '3-5天', '核心商务区', '[[116.38, 39.92], [116.42, 39.92], [116.42, 39.90], [116.38, 39.90]]'),
((SELECT id FROM merchants WHERE username='wok'), '京东物流', '次日达 / 1-2天', '次日达', '1-2天', '2-3天', '5天', '科技园区', '[[116.28, 40.05], [116.32, 40.05], [116.32, 40.02], [116.28, 40.02]]');

-- 订单
INSERT INTO orders (id, merchant_id, user_id, status, amount, sender_name, sender_phone, sender_address, recipient_name, recipient_phone, address_text, address_lat, address_lng, item_name, weight, quantity, created_at)
VALUES 
('O1001', (SELECT id FROM merchants WHERE username='wok'), (SELECT id FROM users WHERE username='user1'), 'pending', 199.00, 'Wok Store', '13800138000', '北京市海淀区', '张三', '13800000001', '上海市黄浦区', 31.2304, 121.4737, '电子产品', 1.5, 1, NOW()),
('O1002', (SELECT id FROM merchants WHERE username='wok'), NULL, 'pending', 299.00, 'Wok Store', '13800138000', '北京市海淀区', '李四', '13800000002', '北京市朝阳区', 39.9042, 116.4074, '书籍', 2.0, 5, NOW()),
('O1003', (SELECT id FROM merchants WHERE username='wok'), NULL, 'pending', 99.00, 'Wok Store', '13800138000', '北京市海淀区', '王五', '13800000003', '广州市天河区', 23.1291, 113.2644, '衣服', 0.5, 2, NOW());
