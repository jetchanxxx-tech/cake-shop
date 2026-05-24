import express from 'express'
import cors from 'cors'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './config/database.js'
import authRoutes from './routes/auth.js'
import bannerRoutes from './routes/banners.js'
import categoryRoutes from './routes/categories.js'
import productRoutes from './routes/products.js'
import cartRoutes from './routes/cart.js'
import orderRoutes from './routes/orders.js'
import favoriteRoutes from './routes/favorites.js'
import couponRoutes from './routes/coupons.js'
import addressRoutes from './routes/addresses.js'
import adminRoutes from './routes/admin.js'
import paymentRoutes from './routes/payment.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

initDatabase()

app.use('/api/auth', authRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/favorites', favoriteRoutes)
app.use('/api', couponRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/pay', paymentRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() })
})

// Serve frontend static files
const distPath = join(__dirname, '../../frontend/dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  const indexPath = join(distPath, 'index.html')
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Frontend index.html not found at:', indexPath)
      res.status(404).send('Frontend build not found. Please run npm run build in the frontend directory.')
    }
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mio Bakery running on http://0.0.0.0:${PORT}`)
})
