// games.js - 게임 선택 페이지 관련 스크립트

// DOM 요소
const usernameElement = document.getElementById('username');
const logoutButton = document.getElementById('logout-btn');
const tetrisGameCard = document.getElementById('tetris-game');
const shootingGameCard = document.getElementById('shooting-game');
const snakeGameCard = document.getElementById('snake-game');
const puzzleGameCard = document.getElementById('puzzle-game');

// 페이지 로드 시 사용자 정보 설정
function loadUserInfo() {
    // 로컬 스토리지에서 사용자 정보 가져오기
    const token = localStorage.getItem('token');
    const username = localStorage.getItem('username');
    
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    
    // 사용자 이름 표시
    if (username) {
        usernameElement.textContent = username;
    }
}

// 로그아웃 함수
function handleLogout() {
    // 로컬 스토리지에서 토큰 및 사용자 정보 삭제
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    
    // 로그인 페이지로 리다이렉트
    window.location.href = 'login.html';
}

// 테트리스 게임 시작 함수
function startTetrisGame() {
    window.location.href = 'index.html';
}

// 개발 중인 게임 알림
function showDevelopingMessage(gameName) {
    alert(`${gameName} 게임은 현재 개발 중입니다. 곧 만나보실 수 있습니다!`);
}

// 이벤트 리스너 설정
logoutButton.addEventListener('click', handleLogout);
tetrisGameCard.addEventListener('click', startTetrisGame);
shootingGameCard.addEventListener('click', () => showDevelopingMessage('슈팅'));
snakeGameCard.addEventListener('click', () => showDevelopingMessage('스네이크'));
puzzleGameCard.addEventListener('click', () => showDevelopingMessage('퍼즐'));

// 페이지 로드 시 초기화
loadUserInfo();