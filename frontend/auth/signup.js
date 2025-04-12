// signup.js - 회원가입 관련 스크립트

// DOM 요소
const usernameInput = document.getElementById('username');
const nicknameInput = document.getElementById('nickname');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('password-confirm');
const signupButton = document.getElementById('signup-btn');
const errorMessage = document.getElementById('error-message');

// 백엔드 API URL 설정 - login.js와 동일한 로직
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

// 에러 메시지 표시 함수
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

// 에러 메시지 숨기기 함수
function hideError() {
    errorMessage.style.display = 'none';
}

// 입력 필드 유효성 검사 함수
function validateInputs() {
    const username = usernameInput.value.trim();
    const nickname = nicknameInput.value.trim();
    const password = passwordInput.value.trim();
    const passwordConfirm = passwordConfirmInput.value.trim();
    
    // 모든 필드 입력 확인
    if (!username) {
        showError('아이디를 입력해주세요.');
        return false;
    }
    
    if (!nickname) {
        showError('닉네임은 필수 입력 항목입니다.');
        return false;
    }
    
    if (!password) {
        showError('비밀번호를 입력해주세요.');
        return false;
    }
    
    if (!passwordConfirm) {
        showError('비밀번호 확인을 입력해주세요.');
        return false;
    }
    
    // // 아이디 길이 확인 (4~20자)
    // if (username.length < 4 || username.length > 20) {
    //     showError('아이디는 4~20자여야 합니다.');
    //     return false;
    // }
    
    // // 닉네임 길이 확인 (2~20자)
    // if (nickname.length < 2 || nickname.length > 20) {
    //     showError('닉네임은 2~20자여야 합니다.');
    //     return false;
    // }
    
    // // 비밀번호 길이 확인 (최소 6자)
    // if (password.length < 6) {
    //     showError('비밀번호는 최소 6자 이상이어야 합니다.');
    //     return false;
    // }
    
    // 비밀번호 일치 확인
    if (password !== passwordConfirm) {
        showError('비밀번호가 일치하지 않습니다.');
        return false;
    }
    
    return true;
}

// 회원가입 처리 함수
async function handleSignup() {
    hideError();
    
    // 입력 유효성 검사
    if (!validateInputs()) return;
    
    const username = usernameInput.value.trim();
    const nickname = nicknameInput.value.trim();
    const password = passwordInput.value.trim();
    
    try {
        // 회원가입 API 요청
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, nickname, password })
        });
        
        const data = await response.json();
        
        // 응답 처리
        if (!response.ok) {
            // 에러 메시지 개선 - 닉네임 중복 에러 명확히 표시
            if (data.message && data.message.includes('닉네임')) {
                showError(data.message);
                // 닉네임 입력 필드에 포커스
                nicknameInput.focus();
            } else if (data.message && data.message.includes('아이디')) {
                showError(data.message);
                // 아이디 입력 필드에 포커스
                usernameInput.focus();
            } else {
                showError(data.message || '회원가입에 실패했습니다.');
            }
            return;
        }
        
        // 회원가입 성공
        alert('회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.');
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('회원가입 오류:', error);
        showError('서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.');
    }
}

// 이벤트 리스너
signupButton.addEventListener('click', handleSignup);

// 엔터 키 이벤트 처리
passwordConfirmInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        handleSignup();
    }
});

// 입력 필드 포커스 시 에러 메시지 숨기기
const inputFields = [usernameInput, nicknameInput, passwordInput, passwordConfirmInput];
inputFields.forEach(input => {
    input.addEventListener('focus', hideError);
}); 