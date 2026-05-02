import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins:[react()], base:'/app9/', server:{ port:5178, proxy:{ '/api':{ target:'http://localhost:3000', changeOrigin:true } } }, build:{ outDir:'dist' } });
