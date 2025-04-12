// DOM 요소 가져오기
const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-canvas');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score');
const levelElement = document.getElementById('level');
const linesElement = document.getElementById('lines');
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');

// 게임 상수 정의
const COLS = 10;                  // 게임판 가로 칸 수
const ROWS = 20;                  // 게임판 세로 칸 수
const BLOCK_SIZE = 30;            // 블록 크기 (픽셀)
const NEXT_BLOCK_SIZE = 25;       // 다음 블록 미리보기 크기
const COLORS = [                  // 테트로미노 색상 배열
    'none',
    '#FF0D72', // I - 빨강
    '#0DC2FF', // J - 파랑
    '#0DFF72', // L - 초록
    '#F538FF', // O - 분홍
    '#FF8E0D', // S - 주황
    '#FFE138', // T - 노랑
    '#3877FF', // Z - 남색
    '#000000'  // 장애물 블록 - 검정색 (추가)
];

// 테트로미노 모양 정의 (I, J, L, O, S, T, Z)
const SHAPES = [
    [],
    // I 모양
    [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    // J 모양
    [
        [2, 0, 0],
        [2, 2, 2],
        [0, 0, 0]
    ],
    // L 모양
    [
        [0, 0, 3],
        [3, 3, 3],
        [0, 0, 0]
    ],
    // O 모양
    [
        [4, 4],
        [4, 4]
    ],
    // S 모양
    [
        [0, 5, 5],
        [5, 5, 0],
        [0, 0, 0]
    ],
    // T 모양
    [
        [0, 6, 0],
        [6, 6, 6],
        [0, 0, 0]
    ],
    // Z 모양
    [
        [7, 7, 0],
        [0, 7, 7],
        [0, 0, 0]
    ],
    // 1x1 크기의 검은 장애물 블록 모양 추가 (SHAPES 배열 마지막에 추가)
    [
        [8]
    ]
];

// 게임 상태 변수
let board = [];
let gameOver = false;
let isPaused = false;
let isPlaying = false;
let score = 0;
let level = 1;
let lines = 0;
let dropStart = Date.now();
let dropInterval = 500;
let piece = null;
let nextPiece = null;
let animationId = null;

// 게임 시작 키 입력을 무시하기 위한 플래그 추가
let isStartKeyPressed = false;

// 장애물 관련 변수들 추가 (게임 상태 변수 섹션 근처에 추가)
const OBSTACLE_TYPE = 8; // 장애물 블록 타입
let obstacleMode = false; // 장애물 모드 활성화 여부
let obstacleTimer = 0; // 장애물 타이머
let obstacleInterval = 15000; // 장애물 모드 간격 (15초)
let obstacleDuration = 3000; // 장애물 모드 지속 시간 (3초)

// 캔버스 크기 설정
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// 게임판 초기화
function createBoard() {
    board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0;
        }
    }
}

// 랜덤 테트로미노 생성
function randomPiece() {
    const type = Math.floor(Math.random() * 7) + 1;
    return {
        type: type,
        shape: SHAPES[type],
        x: Math.floor(COLS / 2) - 1,
        y: 0
    };
}

// 게임 초기화 (처음 로드 시)
function init() {
    createBoard();
    piece = randomPiece();
    nextPiece = randomPiece();
    updateScore();
    drawBoard();
    drawNextPiece();
    
    // 시작 화면 메시지 표시
    showStartMessage();
}

// 시작 화면 메시지 표시
function showStartMessage() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('아무 키나 눌러 시작하세요', canvas.width / 2, canvas.height / 2);
}

// 게임 시작
function startGame() {
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    createBoard();
    piece = randomPiece();
    nextPiece = randomPiece();
    gameOver = false;
    isPaused = false;
    isPlaying = true;
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 500;
    dropStart = Date.now();
    
    // 장애물 관련 변수 초기화
    obstacleMode = true;
    obstacleTimer = Date.now();
    
    updateScore();
    startButton.textContent = '게임 재시작';
    
    console.log('게임 시작!');
    
    // 게임 루프 시작
    animationId = requestAnimationFrame(gameLoop);
}

// 게임 일시정지 토글
function togglePause() {
    if (!isPlaying || gameOver) return;
    
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '계속하기' : '일시정지';
    
    if (!isPaused) {
        dropStart = Date.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// 게임판 그리기
function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ecf0f1';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            const cellValue = board[row][col];
            if (cellValue > 0) {
                ctx.fillStyle = COLORS[cellValue];
                ctx.fillRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                ctx.strokeStyle = 'black';
                ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            } else {
                ctx.strokeStyle = '#dfe6e9';
                ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }
    
    // 현재 블록 그리기
    if (piece) {
        for (let row = 0; row < piece.shape.length; row++) {
            for (let col = 0; col < piece.shape[row].length; col++) {
                if (piece.shape[row][col] !== 0) {
                    const x = piece.x + col;
                    const y = piece.y + row;
                    
                    if (y >= 0) {
                        ctx.fillStyle = COLORS[piece.type];
                        ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                        ctx.strokeStyle = 'black';
                        ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
                    }
                }
            }
        }
    }
}

// 다음 블록 그리기
function drawNextPiece() {
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    const offsetX = Math.floor((nextCanvas.width / NEXT_BLOCK_SIZE - nextPiece.shape[0].length) / 2);
    const offsetY = Math.floor((nextCanvas.height / NEXT_BLOCK_SIZE - nextPiece.shape.length) / 2);
    
    for (let row = 0; row < nextPiece.shape.length; row++) {
        for (let col = 0; col < nextPiece.shape[row].length; col++) {
            if (nextPiece.shape[row][col] !== 0) {
                nextCtx.fillStyle = COLORS[nextPiece.type];
                nextCtx.fillRect(
                    (offsetX + col) * NEXT_BLOCK_SIZE,
                    (offsetY + row) * NEXT_BLOCK_SIZE,
                    NEXT_BLOCK_SIZE,
                    NEXT_BLOCK_SIZE
                );
                nextCtx.strokeStyle = 'black';
                nextCtx.strokeRect(
                    (offsetX + col) * NEXT_BLOCK_SIZE,
                    (offsetY + row) * NEXT_BLOCK_SIZE,
                    NEXT_BLOCK_SIZE,
                    NEXT_BLOCK_SIZE
                );
            }
        }
    }
}

// 점수 업데이트
function updateScore() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// 충돌 검사
function checkCollision() {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col] !== 0) {
                const x = piece.x + col;
                const y = piece.y + row;
                
                if (x < 0 || x >= COLS || y >= ROWS || 
                   (y >= 0 && board[y][x] !== 0)) {
                    return true;
                }
            }
        }
    }
    return false;
}

// 블록 이동
function movePiece(dir) {
    piece.x += dir;
    if (checkCollision()) {
        piece.x -= dir;
    } else {
        drawBoard();
    }
}

// 블록 회전
function rotatePiece() {
    const originalShape = piece.shape;
    const length = originalShape.length;
    
    const rotated = [];
    for (let i = 0; i < length; i++) {
        rotated[i] = [];
        for (let j = 0; j < length; j++) {
            rotated[i][j] = originalShape[length - j - 1][i];
        }
    }
    
    piece.shape = rotated;
    
    if (checkCollision()) {
        piece.shape = originalShape;
    } else {
        drawBoard();
    }
}

// 블록 내리기
function dropPiece() {
    piece.y++;
    if (checkCollision()) {
        piece.y--;
        lockPiece();
    } else {
        drawBoard();
    }
    
    dropStart = Date.now();
}

// 블록 바로 내리기
function hardDrop() {
    while (!checkCollision()) {
        piece.y++;
    }
    piece.y--;
    lockPiece();
}

// 블록 고정
function lockPiece() {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col] !== 0) {
                const y = piece.y + row;
                const x = piece.x + col;
                
                if (y < 0) {
                    gameOver = true;
                    showGameOver();
                    return;
                }
                
                board[y][x] = piece.type;
            }
        }
    }
    
    clearLines();
    
    piece = nextPiece;
    nextPiece = randomPiece();
    
    if (checkCollision()) {
        gameOver = true;
        showGameOver();
    } else {
        drawNextPiece();
    }
}

// 라인 제거
function clearLines() {
    let linesCleared = 0;
    
    for (let row = ROWS - 1; row >= 0; row--) {
        let full = true;
        
        for (let col = 0; col < COLS; col++) {
            if (board[row][col] === 0) {
                full = false;
                break;
            }
        }
        
        if (full) {
            linesCleared++;
            
            for (let r = row; r > 0; r--) {
                for (let c = 0; c < COLS; c++) {
                    board[r][c] = board[r-1][c];
                }
            }
            
            for (let c = 0; c < COLS; c++) {
                board[0][c] = 0;
            }
            
            row++; // 동일한 행 다시 검사
        }
    }
    
    if (linesCleared > 0) {
        const linePoints = [40, 100, 300, 1200]; // 1, 2, 3, 4줄
        score += linePoints[linesCleared - 1] * level;
        lines += linesCleared;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 500 - (level - 1) * 100);
        
        updateScore();
    }
}

// 게임 오버 화면
function showGameOver() {
    cancelAnimationFrame(animationId);
    animationId = null;
    isPlaying = false;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.font = '20px Arial';
    ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('아무 키나 눌러 다시 시작', canvas.width / 2, canvas.height / 2 + 50);
    
    saveScore();
}

// 게임 루프
function gameLoop() {
    if (gameOver || isPaused) {
        return;
    }
    
    const now = Date.now();
    const delta = now - dropStart;
    
    // 레벨 2 이상이고 장애물 모드가 아닐 때 장애물 타이머 관리
    if (level >= 2 && !obstacleMode) {
        // 장애물 타이머 갱신
        if (now - obstacleTimer > obstacleInterval) {
            obstacleTimer = now;
            startObstacleStorm();
        }
    }
    
    if (delta > dropInterval) {
        dropPiece();
    }
    
    drawBoard();
    animationId = requestAnimationFrame(gameLoop);
}

// 키보드 입력 처리
function handleKeyPress(e) {
    // 게임이 시작되지 않은 상태에서 아무 키나 누르면 게임 시작
    if (!isPlaying && !gameOver) {
        isStartKeyPressed = true; // 시작 키를 눌렀음을 표시
        startGame();
        // 이 키 입력은 게임에 영향을 주지 않도록 함
        return;
    }

    // 게임 종료 상태에서 키를 누르면 게임 재시작
    if (gameOver) {
        isStartKeyPressed = true;
        startGame();
        return;
    }

    // 게임 일시정지 상태에서는 키 입력 무시
    if (isPaused) {
        return;
    }

    // 시작 키가 아닌 경우에만 게임 로직 적용
    if (isStartKeyPressed) {
        isStartKeyPressed = false; // 플래그 초기화
        return; // 첫 번째 키 입력 무시
    }

    // 일반 게임 플레이 시 키 입력 처리
    switch(e.keyCode) {
        case 37: // 왼쪽
            movePiece(-1);
            break;
        case 39: // 오른쪽
            movePiece(1);
            break;
        case 40: // 아래
            dropPiece();
            break;
        case 38: // 위
            rotatePiece();
            break;
        case 32: // 스페이스
            hardDrop();
            break;
    }
}

// 점수 저장
function saveScore() {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    const scoreData = {
        score: score,
        lines: lines,
        level: level
    };
    
    fetch('http://localhost:8080/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scoreData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.newHighScore) {
            alert('축하합니다! 새로운 최고 점수를 달성했습니다!');
        }
    })
    .catch(error => {
        console.error('점수 저장 오류:', error);
    });
}

// 이벤트 리스너
// document.addEventListener('keydown', handleKeyPress);
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);

// 메뉴 버튼 이벤트 리스너
const menuButton = document.getElementById('menu-btn');
if (menuButton) {
    menuButton.addEventListener('click', function() {
        window.location.href = 'games.html';
    });
}

// 페이지 로드 시 실행
window.onload = function() {
    console.log('테트리스 초기화 시작...');
    
    // DOM 요소 확인 (이 부분은 그대로 유지!)
    console.log('start-btn 요소:', startButton);
    console.log('pause-btn 요소:', pauseButton);
    console.log('menu-btn 요소:', menuButton);
    
    // 개발 모드 여부 확인 (URL 파라미터로 확인)
    const isDevMode = window.location.search.includes('dev=true');
    
    // 로그인 확인 (개발 모드에서는 건너뛰기)
    const token = localStorage.getItem('token');
    if (!token && !isDevMode) {
        console.log('로그인 필요, 리다이렉트...');
        window.location.href = 'login.html';
        return;
    } else if (isDevMode) {
        // 개발 모드에서는 임시 토큰 설정
        console.log('개발 모드 활성화: 자동 로그인');
        localStorage.setItem('token', 'dev-token');
        localStorage.setItem('username', '개발자');
    }
    
    // 사용자 이름 표시 (기존 코드 유지)
    const username = localStorage.getItem('username');
    if (username) {
        const gameTitle = document.querySelector('.game-info h1');
        if (gameTitle) {
            gameTitle.textContent = `테트리스 - ${username}`;
            console.log('사용자 이름 표시됨:', username);
        }
    }
    
    // 이벤트 리스너 관련 코드 (기존 코드 유지)
    document.removeEventListener('keydown', handleKeyPress);
    window.removeEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress);
    
    // 게임 초기화
    init();
    
    // 이벤트 리스너 명시적 추가 (기존 코드 유지)
    startButton.onclick = function() {
        console.log('시작 버튼 클릭됨');
        startGame();
    };
    
    pauseButton.onclick = function() {
        console.log('일시정지 버튼 클릭됨');
        togglePause();
    };
    
    if (menuButton) {
        menuButton.onclick = function() {
            console.log('메뉴 버튼 클릭됨');
            window.location.href = 'games.html';
        };
    }
    
    console.log('테트리스 초기화 완료!');
};

// 검은 블록을 떨어뜨리는 함수 (새로 추가)
function dropObstacle() {
    // 랜덤한 x 좌표에 장애물 생성
    const x = Math.floor(Math.random() * COLS);
    
    // 새 장애물 블록 생성
    const obstacle = {
        type: OBSTACLE_TYPE,
        shape: SHAPES[OBSTACLE_TYPE],
        x: x,
        y: 0
    };
    
    // 기존 게임 로직으로 처리하기 위해 현재 블록 임시 저장
    const originalPiece = piece;
    piece = obstacle;
    
    // 블록 충돌 테스트 및 배치
    // (이미 블록이 있는 위치라면 배치하지 않음)
    if (!checkCollision()) {
        // 블록이 바닥에 닿을 때까지 하강
        while (!checkCollision()) {
            piece.y++;
        }
        piece.y--;
        lockPiece();
    }
    
    // 원래 조작 중이던 블록으로 복원
    piece = originalPiece;
}

// 장애물 폭풍 시작 함수 (새로 추가)
function startObstacleStorm() {
    if (level < 2) return; // 레벨 2 이상에서만 작동
    
    console.log("장애물 폭풍 시작!");
    obstacleMode = true;
    
    // 0.5초마다 장애물 떨어뜨리기
    const stormInterval = setInterval(() => {
        if (!obstacleMode || gameOver || isPaused) {
            clearInterval(stormInterval);
            return;
        }
        dropObstacle();
    }, 500);
    
    // 지정된 지속 시간 후 장애물 폭풍 종료
    setTimeout(() => {
        obstacleMode = false;
        clearInterval(stormInterval);
        console.log("장애물 폭풍 종료");
    }, obstacleDuration);
} 