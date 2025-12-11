/**
 * 批量创建订单的脚本
 * 可以直接运行: node generateOrders.js [数量]
 * 或者在代码中调用: require('./generateOrders').createOrders(10)
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// 创建数据库连接
async function getConnection() {
  return await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'ByteDance',
  });
}

/**
 * 批量创建订单并插入数据库
 * @param {number} nums - 需要创建的订单数量
 */
async function createOrders(nums) {
  const connection = await getConnection();
  
  try {
    console.log(`开始创建 ${nums} 个订单...`);
    
    // 固定的商家ID
    const merchantId = 2;
    
    // 发货信息（商家）
    const sender = {
      name: '我爱薯片',
      address: '我爱薯片',
      phone: '18312781731',
      fullAddress: '广东省梅州市梅县区',
      lat: 24.266191,
      lng: 116.081395
    };
    
    // 可选收货地址（随机从中抽取） —— 共 4 个地址
    const recipients = [
      {
        name: '我爱薯片',
        phone: '18312781730',
        address: '北京市天安门',
        lat: 39.909187,
        lng: 116.397455,
        note: 'was'
      },
      {
        name: '我爱薯片',
        phone: '18312781730',
        address: '广东省广州市广东财经大学广州校区',
        lat: 23.095396,
        lng: 113.353825,
        note: 'campus'
      },
      {
        name: '我爱薯片',
        phone: '18312781730',
        address: '广东省广州市新港东',
        lat: 23.099621,
        lng: 113.362971,
        note: 'xg'
      },
      {
        name: '我爱薯片',
        phone: '18312781730',
        address: '广东省广州市万胜围',
        lat: 23.09994,
        lng: 113.385112,
        note: 'wsw'
      }
    ];
    
    // 货物信息
    const cargo = {
      weight: 1.00,
      quantity: 1
    };
    
    let successCount = 0;
    
    for (let i = 0; i < nums; i++) {
      // 用户ID在1和2之间交替
      const userId = 2;
      
      // 随机价格 10-1000
      const amount = Math.floor(Math.random() * 991) + 10;
      
      // 随机选择一个收货地址
      const recipient = recipients[Math.floor(Math.random() * recipients.length)];

      // 生成订单ID
      const orderId = `O${Date.now().toString().slice(-11)}${i.toString().padStart(3, '0')}`;
      
      // 插入订单
      const sql = `
        INSERT INTO orders (
          id, merchant_id, user_id, 
          sender_name, sender_phone, sender_address, sender_lat, sender_lng,
          recipient_name, recipient_phone, address_text, address_lat, address_lng,
          weight, quantity, amount, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())
      `;
      
      await connection.execute(sql, [
        orderId,
        merchantId,
        userId,
        sender.name,
        sender.phone,
        sender.fullAddress,
        sender.lat,
        sender.lng,
        recipient.name,
        recipient.phone,
        recipient.address,
        recipient.lat,
        recipient.lng,
        cargo.weight,
        cargo.quantity,
        amount
      ]);
      
      successCount++;
      
      // 每10个订单输出一次进度
      if ((i + 1) % 10 === 0 || i === nums - 1) {
        console.log(`已创建 ${successCount} / ${nums} 个订单`);
      }
      
      // 避免订单ID重复，稍微延迟
      if (i < nums - 1) {
        await new Promise(resolve => setTimeout(resolve, 2));
      }
    }
    
    console.log(`✅ 成功创建 ${successCount} 个订单！`);
    return successCount;
    
  } catch (error) {
    console.error('创建订单失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const nums = parseInt(process.argv[2]) || 10; // 默认创建10个订单
  
  console.log(`准备创建 ${nums} 个订单到数据库...`);
  
  createOrders(nums)
    .then(() => {
      console.log('订单创建完成！');
      process.exit(0);
    })
    .catch((error) => {
      console.error('执行失败:', error);
      process.exit(1);
    });
}

module.exports = { createOrders };
