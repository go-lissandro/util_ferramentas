import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins:[react()], base:'/app10/', server:{ port:5179, proxy:{ '/api':{ target:'http://localhost:3000', changeOrigin:true } } }, build:{ outDir:'dist' } });
