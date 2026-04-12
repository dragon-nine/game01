import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** /game01 → /game01/ 리다이렉트 (dev server) */
function trailingSlashRedirect(): Plugin {
  return {
    name: 'trailing-slash-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/game01') {
          res.writeHead(301, { Location: '/game01/' });
          res.end();
          return;
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), trailingSlashRedirect()],
  base: '/game01/',
  server: {
    host: '0.0.0.0',
  },
  build: {
    outDir: '../../dist/game01',
    emptyOutDir: true,
    // Phaser 게임 특성상 메인 청크가 1.5MB대가 정상 (Phaser ~280KB gz, gzip 총 435KB).
    // 기본 500KB 임계치는 콘텐츠 사이트 기준이라 게임엔 너무 빡빡함. 1700KB로 상향.
    chunkSizeWarningLimit: 1700,
  },
})
