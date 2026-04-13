import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'worker-nightmare',
  brand: {
    displayName: '직장인 잔혹사 : 퇴근길',
    primaryColor: '#000000',
    icon: 'https://static.toss.im/appsintoss/28357/49b9471f-9a7f-43d6-8675-d5bbe0fdfaec.png',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --base /',
      build: 'tsc -b && vite build --outDir dist --base /',
    },
  },
  navigationBar: {
    withBackButton: false,
    withHomeButton: false,
  },
  permissions: [],
  outdir: 'dist',
});
