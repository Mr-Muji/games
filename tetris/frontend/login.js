// login.js - 로그인 및 회원가입 관련 스크립트

// DOM 요소
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('login-btn');
const errorMessage = document.getElementById('error-message');
const signupLink = document.getElementById('signup-link');

// 백엔드 API URL
const API_URL = 'http://localhost:8080'; // 필요에 따라 변경

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
        
        // 게임 선택 페이지로 이동
        window.location.href = 'games.html';
        
    } catch (error) {
        console.error('로그인 오류:', error);
        showError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// 회원가입 페이지로 이동 함수
function handleSignup() {
    // 간단하게 창을 띄워 회원가입 정보를 입력받음
    const username = prompt('사용할 아이디를 입력하세요:');
    const password = prompt('사용할 비밀번호를 입력하세요:');
    
    if (!username || !password) return;
    
    // 회원가입 API 요청
    fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            alert('회원가입이 완료되었습니다. 로그인해주세요.');
        } else {
            alert(data.message || '회원가입에 실패했습니다.');
        }
    })
    .catch(error => {
        console.error('회원가입 오류:', error);
        alert('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    });
}

// 이벤트 리스너 설정
loginButton.addEventListener('click', handleLogin);
signupLink.addEventListener('click', handleSignup);

// 엔터 키 이벤트 처리
passwordInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleLogin();
    }
});