import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2015',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'map-vendor': ['@amap/amap-jsapi-loader'],
          'chart-vendor': ['echarts', 'echarts-for-react', 'recharts'],
          'animation-vendor': ['framer-motion', 'gsap'],
        },
      },
    },
    minify: 'esbuild',
    cssCodeSplit: true,
    sourcemap: false,
  },
})
