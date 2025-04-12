// login.js - 로그인 관련 스크립트

// DOM 요소
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-btn');
const errorMessage = document.getElementById('error-message');
const signupLink = document.getElementById('signup-link');

// 백엔드 API URL - 환경에 따라 동적 설정
let API_URL = '';

// 현재 호스트명에 따라 백엔드 URL 결정
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 로컬 개발 환경
    API_URL = 'http://localhost:8080';
} else {
    // 프로덕션 환경 - 'api.' 서브도메인 사용
    API_URL = 'https://api.' + window.location.hostname.replace('www.', '');
    
    // 또는 도메인이 kakaotech.my인 경우 명시적으로 지정
    if (window.location.hostname.includes('kakaotech.my')) {
        API_URL = 'https://api.kakaotech.my';
    }
}

console.log('현재 사용 중인 API URL:', API_URL); // 디버깅용

// 입력 필드 유효성 체크 함수
function validateInputs() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
        showError('아이디와 비밀번호를 모두 입력해주세요.');
        return false;
    }
    
    return true;
}

// 에러 메시지 표시 함수
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// 로그인 요청 함수
async function handleLogin() {
    // 입력 유효성 검사
    if (!validateInputs()) return;
    
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    try {
        // 로그인 API 요청
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        // 응답 처리
        if (!response.ok) {
            const data = await response.json();
            showError(data.message || '로그인에 실패했습니다.');
            return;
        }
        
        // 로그인 성공 처리
        const data = await response.json();
        
        // JWT 토큰 저장
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        
        // 닉네임이 있으면 저장
        if (data.nickname) {
            localStorage.setItem('nickname', data.nickname);
        }
        
        // 게임 선택 페이지로 이동
        window.location.href = '../menu/games.html';
        
    } catch (error) {
        console.error('로그인 오류:', error);
        showError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// 회원가입 링크 처리 함수
function handleSignupClick(e) {
    e.preventDefault();
    window.location.href = 'signup.html';
}

// 이벤트 리스너
loginButton.addEventListener('click', handleLogin);
signupLink.addEventListener('click', handleSignupClick);

// 엔터 키 이벤트 처리
passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleLogin();
    }
});