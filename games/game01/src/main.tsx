import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ensureAuth } from './game/services/api';
import { storage } from './game/services/storage';
import './index.css';

// 백그라운드에서 익명 인증 + 프로필 동기 (UI 블록 X)
ensureAuth({ character: storage.getSelectedCharacter() })
  .then(({ profile }) => {
    // 서버 닉네임을 로컬과 동기화 (서버가 첫 가입 시 기본 닉네임 발급)
    if (profile.nickname && !localStorage.getItem('nickname')) {
      localStorage.setItem('nickname', profile.nickname);
    }
  })
  .catch((e) => {
    console.warn('[api] auth failed, continuing offline:', e);
  });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
