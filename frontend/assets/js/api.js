// api.js - API 통신 관련 공통 함수

// 백엔드 API 기본 URL 설정
let API_BASE_URL = '';

// 현재 호스트명에 따라 백엔드 URL 결정
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // 로컬 개발 환경
    API_BASE_URL = 'http://localhost:8080';
} else {
    // 프로덕션 환경 - 'api.' 서브도메인 사용
    API_BASE_URL = 'https://api.' + window.location.hostname.replace('www.', '');
    
    // 또는 도메인이 kakaotech.my인 경우 명시적으로 지정
    if (window.location.hostname.includes('kakaotech.my')) {
        API_BASE_URL = 'https://api.kakaotech.my';
    }
}

/**
 * API 호출을 위한 범용 함수
 * @param {string} endpoint - API 엔드포인트 경로 (예: '/scores')
 * @param {Object} options - fetch 옵션 (method, headers, body 등)
 * @param {boolean} requiresAuth - 인증이 필요한지 여부
 * @returns {Promise} fetch 응답 프로미스
 */
async function apiCall(endpoint, options = {}, requiresAuth = false) {
    // 기본 요청 옵션 설정
    const requestOptions = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };
    
    // 요청 바디가 있으면 추가
    if (options.body) {
        requestOptions.body = JSON.stringify(options.body);
    }
    
    // 인증이 필요한 경우 토큰 추가
    if (requiresAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('인증이 필요합니다.');
        }
        
        requestOptions.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        // API 요청 실행
        const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);
        
        // 401 Unauthorized 응답 처리
        if (response.status === 401 && requiresAuth) {
            // 로컬 스토리지에서 토큰 제거
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            localStorage.removeItem('nickname');
            
            // 로그인 페이지로 리디렉션
            window.location.href = '/auth/login.html';
            throw new Error('인증이 만료되었습니다. 다시 로그인해주세요.');
        }
        
        // JSON 응답 반환
        return await response.json();
        
    } catch (error) {
        console.error('API 요청 오류:', error);
        throw error;
    }
}

// 모듈로 내보내기
export { API_BASE_URL, apiCall }; 