import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

// 创建连接池，使用默认设置
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456', // 默认密码，如需修改
  database: process.env.DB_NAME || 'ByteDance',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, // 最大空闲连接数，默认与 connectionLimit 相同
  idleTimeout: 60000, // 空闲连接超时时间（毫秒），默认 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

export default pool
