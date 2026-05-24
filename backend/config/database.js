import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, '../data/cake_shop.db')

let db = null

export function initDatabase() {
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      icon TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      price REAL NOT NULL,
      original_price REAL,
      image TEXT,
      images TEXT,
      category_id INTEGER,
      tags TEXT,
      specs TEXT,
      stock INTEGER DEFAULT 999,
      sales INTEGER DEFAULT 0,
      is_hot INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS banners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image TEXT NOT NULL,
      link TEXT,
      title TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS carts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      sku_id TEXT,
      quantity INTEGER DEFAULT 1,
      selected INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id, sku_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      order_no TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      total_amount REAL NOT NULL,
      discount_amount REAL DEFAULT 0,
      pay_amount REAL NOT NULL,
      remark TEXT,
      address TEXT NOT NULL,
      contact_name TEXT,
      contact_phone TEXT,
      paid_at DATETIME,
      pay_type TEXT,
      transaction_id TEXT,
      prepay_id TEXT,
      openid TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      product_name TEXT NOT NULL,
      product_image TEXT,
      spec_name TEXT,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'amount',
      value REAL NOT NULL,
      min_amount REAL DEFAULT 0,
      start_date TEXT,
      end_date TEXT,
      total INTEGER DEFAULT 0,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      coupon_id INTEGER NOT NULL,
      status TEXT DEFAULT 'unused',
      used_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      province TEXT,
      city TEXT,
      district TEXT,
      detail TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wechat_oauth_states (
      state TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      redirect TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  ensureColumns()
  seedData()
  return db
}

function ensureColumns() {
  try {
    const cols = db.prepare("PRAGMA table_info(users)").all().map(r => r.name)
    if (!cols.includes('openid')) {
      db.exec('ALTER TABLE users ADD COLUMN openid TEXT')
    }
  } catch {
    // ignore
  }
}

export function getDb() {
  return db
}

function seedData() {
  const row = db.prepare('SELECT COUNT(*) as c FROM categories').get()
  if (row.c > 0) return

  const catStmt = db.prepare('INSERT INTO categories (name, icon, sort_order) VALUES (?, ?, ?)')
  catStmt.run('生日蛋糕', 'cake', 1)
  catStmt.run('杯子蛋糕', 'cupcake', 2)
  catStmt.run('慕斯蛋糕', 'mousse', 3)
  catStmt.run('千层蛋糕', 'crepe', 4)
  catStmt.run('芝士蛋糕', 'cheese', 5)
  catStmt.run('季节限定', 'season', 6)

  const prodStmt = db.prepare(`INSERT INTO products (name, subtitle, description, price, original_price, image, category_id, tags, specs, is_hot, is_new, sales) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
  const products = [
    ['草莓奶油蛋糕', '时令鲜草莓 x 动物奶油', '精选当季丹东草莓，搭配法国进口动物奶油，入口即化的轻盈口感。', 168, 198, 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600', 1, '["热销","新品"]', '[{"name":"6寸","price":168},{"name":"8寸","price":228},{"name":"10寸","price":298}]', 1, 1, 128],
    ['抹茶千层', '宇治抹茶 x 手工煎皮', '选用日本宇治抹茶粉，20层手工煎制饼皮，层次分明，茶香浓郁。', 138, 168, 'https://images.unsplash.com/photo-1505253758473-96b701d2cd03?w=600', 4, '["热销"]', '[{"name":"6寸","price":138},{"name":"8寸","price":188}]', 1, 0, 86],
    ['经典提拉米苏', '意式咖啡 x 马斯卡彭', '正宗意式配方，咖啡与马斯卡彭芝士的完美融合，微苦回甘。', 128, 158, 'https://images.unsplash.com/photo-1571115177098-24ec42ed204d?w=600', 3, '["推荐"]', '[{"name":"6寸","price":128},{"name":"8寸","price":178}]', 0, 0, 64],
    ['蓝莓芝士蛋糕', '新西兰芝士 x 野生蓝莓', '浓郁芝士搭配酸甜蓝莓，口感丰富不腻。', 148, 178, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600', 5, '["热销"]', '[{"name":"6寸","price":148},{"name":"8寸","price":198}]', 1, 0, 92],
    ['芒果慕斯', '台农芒果 x 轻盈慕斯', '新鲜芒果果肉制作，慕斯轻盈绵密，夏日首选。', 118, 148, 'https://images.unsplash.com/photo-1515037530-f64dc9bde115?w=600', 3, '["新品"]', '[{"name":"6寸","price":118},{"name":"8寸","price":168}]', 0, 1, 45],
    ['红丝绒蛋糕', '经典红丝绒 x 奶油芝士霜', '经典美式红丝绒，奶油芝士霜的浓郁与蛋糕体的绵软完美结合。', 158, 188, 'https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=600', 1, '["热销"]', '[{"name":"6寸","price":158},{"name":"8寸","price":218}]', 1, 0, 110],
    ['巧克力熔岩', '70%黑巧 x 流心内馅', '比利时70%黑巧克力，切开后流心缓缓流出，浓郁醇厚。', 138, 168, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600', 1, '["推荐"]', '[{"name":"6寸","price":138},{"name":"8寸","price":188}]', 0, 0, 78],
    ['樱花限定', '春日限定 x 盐渍樱花', '春季限定款，盐渍樱花点缀，少女心爆棚。', 188, 228, 'https://images.unsplash.com/photo-1614707267537-b85aaf00c31b?w=600', 6, '["季节限定","新品"]', '[{"name":"6寸","price":188}]', 0, 1, 32],
    ['海盐焦糖', '法国海盐 x 焦糖酱', '甜咸交织的独特风味，焦糖香气浓郁。', 148, 178, 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?w=600', 2, '["推荐"]', '[{"name":"6个装","price":88},{"name":"12个装","price":148}]', 0, 0, 56],
    ['玫瑰荔枝', '云南玫瑰 x 岭南荔枝', '玫瑰花瓣与荔枝果肉的浪漫邂逅，花香果香交织。', 168, 198, 'https://images.unsplash.com/photo-1627834377411-8da5f4f09de8?w=600', 1, '["新品"]', '[{"name":"6寸","price":168},{"name":"8寸","price":228}]', 0, 1, 28]
  ]
  for (const p of products) prodStmt.run(...p)

  const banStmt = db.prepare('INSERT INTO banners (image, title, link, sort_order) VALUES (?, ?, ?, ?)')
  banStmt.run('https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', '春季新品上市', '/category?tag=season', 1)
  banStmt.run('https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?w=800', '手工定制蛋糕', '/category', 2)
  banStmt.run('https://images.unsplash.com/photo-1542826438-bd32f43d626f?w=800', '会员专享优惠', '/coupons', 3)

  const coupStmt = db.prepare('INSERT INTO coupons (name, type, value, min_amount, total, end_date) VALUES (?, ?, ?, ?, ?, ?)')
  coupStmt.run('新用户立减20元', 'amount', 20, 100, 999, '2026-12-31')
  coupStmt.run('满200减30', 'amount', 30, 200, 500, '2026-12-31')
  coupStmt.run('9折优惠券', 'percent', 0.9, 0, 300, '2026-12-31')

  // Seed default admin
  const adminRow = db.prepare('SELECT COUNT(*) as c FROM admins').get()
  if (adminRow.c === 0) {
    const hashed = bcrypt.hashSync('admin123', 10)
    db.prepare('INSERT INTO admins (username, password, nickname) VALUES (?, ?, ?)')
      .run('admin', hashed, '管理员')
  }
}
