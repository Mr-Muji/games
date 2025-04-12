// games.js - 게임 선택 페이지 관련 스크립트

// 공통 API 유틸리티 가져오기 (추후 구현)
// import { apiCall } from '../assets/js/api.js';

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
    const nickname = localStorage.getItem('nickname');
    
    // 토큰이 없으면 로그인 페이지로 리다이렉트
    if (!token) {
        window.location.href = '../auth/login.html';
        return;
    }
    
    // 사용자 이름 표시 (닉네임이 있으면 닉네임 사용, 없으면 username 사용)
    if (nickname) {
        usernameElement.textContent = nickname;
    } else if (username) {
        usernameElement.textContent = username;
    }
}

// 로그아웃 함수
function handleLogout() {
    // 로컬 스토리지에서 토큰 및 사용자 정보 삭제
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('nickname');
    
    // 로그인 페이지로 리다이렉트
    window.location.href = '../auth/login.html';
}

// 게임 시작 함수
function startGame(gameType) {
    switch(gameType) {
        case 'tetris':
            // 로컬 스토리지 게임 상태 초기화 (선택사항)
            localStorage.removeItem('tetris-game-state');
            // 테트리스 게임 페이지로 이동 (올바른 경로 사용)
            window.location.href = '../games/tetris/tetris.html';
            break;
        case 'snake':
        case 'shooting':
        case 'puzzle':
            showDevelopingMessage(gameType);
            break;
        default:
            console.error('알 수 없는 게임 타입:', gameType);
    }
}

// 개발 중인 게임 알림
function showDevelopingMessage(gameName) {
    // 게임 이름을 한글로 변환
    let gameNameKorean;
    switch(gameName) {
        case 'snake': gameNameKorean = '스네이크'; break;
        case 'shooting': gameNameKorean = '슈팅'; break;
        case 'puzzle': gameNameKorean = '퍼즐'; break;
        default: gameNameKorean = gameName;
    }
    
    alert(`${gameNameKorean} 게임은 현재 개발 중입니다. 곧 만나보실 수 있습니다!`);
}

// 이벤트 리스너 설정
logoutButton.addEventListener('click', handleLogout);
tetrisGameCard.addEventListener('click', () => startGame('tetris'));
shootingGameCard.addEventListener('click', () => startGame('shooting'));
snakeGameCard.addEventListener('click', () => startGame('snake'));
puzzleGameCard.addEventListener('click', () => startGame('puzzle'));

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', loadUserInfo);