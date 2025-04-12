// DOM 요소 가져오기
const canvas = document.getElementById('tetris-canvas');
const ctx = canvas.getContext('2d');
const nextCanvas = document.getElementById('next-piece-preview');
const nextCtx = nextCanvas.getContext('2d');
const scoreElement = document.getElementById('score-display');
const levelElement = document.getElementById('level-display');
const linesElement = document.getElementById('lines-display');
const startButton = document.getElementById('start-button');
const pauseButton = document.getElementById('pause-button');

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
    '#000000'  // 검은 블록 - 8번 인덱스
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
let combo = 0;  // 콤보 카운터 추가
let lastClearWasCombo = false; // 마지막 드롭에서 라인 클리어 여부
let lastGarbageTime = 0;       // 마지막으로 검은 블록이 올라온 시간
const garbageInterval = 12000; // 검은 블록이 올라오는 간격 (12초)

// 게임 시작 키 입력을 무시하기 위한 플래그 추가
let isStartKeyPressed = false;

// 테트로미노 가방(bag) 시스템 구현
let pieceBag = [];

// 새로운 7-bag을 생성하고 섞는 함수
function generateBag() {
    // 1부터 7까지의 숫자 배열 생성 (7개 테트로미노 타입)
    const newBag = [1, 2, 3, 4, 5, 6, 7];
    
    // Fisher-Yates 알고리즘으로 배열 섞기
    for (let i = newBag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newBag[i], newBag[j]] = [newBag[j], newBag[i]];
    }
    
    return newBag;
}

// 다음 테트로미노 가져오기
function getNextPiece() {
    // 가방이 비어있으면 새 가방 생성
    if (pieceBag.length === 0) {
        pieceBag = generateBag();
    }
    
    // 가방에서 다음 조각 가져오기
    const type = pieceBag.pop();
    
    return {
        type: type,
        shape: SHAPES[type],
        x: Math.floor(COLS / 2) - 1,
        y: 0
    };
}

// 캔버스 크기 설정
canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// API URL 설정
let API_URL = '';
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_URL = 'http://localhost:8080';
} else {
    API_URL = 'https://api.' + window.location.hostname.replace('www.', '');
    if (window.location.hostname.includes('kakaotech.my')) {
        API_URL = 'https://api.kakaotech.my';
    }
}

// 게임 시작 시간 저장 변수
let gameStartTime = 0;

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

// 게임 초기화 (처음 로드 시)
function init() {
    createBoard();
    pieceBag = generateBag(); // 초기 가방 생성
    piece = getNextPiece();
    nextPiece = getNextPiece();
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
    pieceBag = generateBag();
    piece = getNextPiece();
    nextPiece = getNextPiece();
    gameOver = false;
    isPaused = false;
    isPlaying = true;
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 500;
    dropStart = Date.now();
    combo = 0;
    lastClearWasCombo = false;
    lastGarbageTime = Date.now();
    
    updateScore();
    startButton.textContent = '게임 재시작';
    pauseButton.textContent = '일시정지 (ESC)';
    
    console.log('게임 시작!');
    
    // 게임 루프 시작
    animationId = requestAnimationFrame(gameLoop);
}

// 게임 일시정지 토글
function togglePause() {
    if (!isPlaying || gameOver) return;
    
    isPaused = !isPaused;
    pauseButton.textContent = isPaused ? '게임 재개 (ESC)' : '일시정지 (ESC)';
    
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
    scoreElement.textContent = `점수: ${score}`;
    levelElement.textContent = `레벨: ${level}`;
    linesElement.textContent = `라인: ${lines}`;
    
    // 현재 콤보 표시 (선택사항 - 별도의 DOM 요소가 있다면)
    const comboElement = document.getElementById('combo');
    if (comboElement) {
        if (combo > 1) {
            comboElement.textContent = `콤보: ${combo}`;
            comboElement.style.display = 'block';
        } else {
            comboElement.style.display = 'none';
        }
    }
}

// 충돌 검사 함수
function checkCollision(p = piece) {
    // p 매개변수는 기본값으로 현재 piece를 사용하지만, 다른 피스로 테스트할 수도 있음
    for (let row = 0; row < p.shape.length; row++) {
        for (let col = 0; col < p.shape[row].length; col++) {
            if (p.shape[row][col] !== 0) {
                const x = p.x + col;
                const y = p.y + row;
                
                // 벽이나 바닥, 또는 다른 블록과 충돌 확인
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

// 블록 회전 - 월 킥 시스템 추가
function rotatePiece() {
    const originalShape = piece.shape;
    const originalX = piece.x;
    const originalY = piece.y;
    const length = originalShape.length;
    
    // 회전된 모양 계산
    const rotated = [];
    for (let i = 0; i < length; i++) {
        rotated[i] = [];
        for (let j = 0; j < length; j++) {
            rotated[i][j] = originalShape[length - j - 1][i];
        }
    }
    
    // 원래 모양 저장
    piece.shape = rotated;
    
    // 기본 위치에서 충돌 여부 확인
    if (!checkCollision()) {
        // 충돌 없음 - 회전 성공
        drawBoard();
        return;
    }
    
    // 월 킥 시도 - 여러 위치 시도
    const kicks = [
        {x: 1, y: 0},   // 오른쪽으로 1칸
        {x: -1, y: 0},  // 왼쪽으로 1칸
        {x: 0, y: -1},  // 위로 1칸
        {x: 2, y: 0},   // 오른쪽으로 2칸
        {x: -2, y: 0},  // 왼쪽으로 2칸
        {x: 0, y: -2},  // 위로 2칸
        {x: 1, y: -1},  // 오른쪽 위로 1칸
        {x: -1, y: -1}  // 왼쪽 위로 1칸
    ];
    
    // 여러 위치에서 시도
    for (const kick of kicks) {
        piece.x = originalX + kick.x;
        piece.y = originalY + kick.y;
        
        if (!checkCollision()) {
            // 충돌 없는 위치 찾음 - 회전 성공
            drawBoard();
            return;
        }
    }
    
    // 모든 킥 위치에서 실패 - 원래 상태로 복원
    piece.shape = originalShape;
    piece.x = originalX;
    piece.y = originalY;
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

// 블록 고정 함수
function lockPiece() {
    for (let row = 0; row < piece.shape.length; row++) {
        for (let col = 0; col < piece.shape[row].length; col++) {
            if (piece.shape[row][col] !== 0) {
                const y = piece.y + row;
                const x = piece.x + col;
                
                if (y < 0) {
                    console.log("보드 위로 넘어감: 게임 오버");
                    gameOver = true;
                    showGameOver();
                    return;
                }
                
                board[y][x] = piece.type;
            }
        }
    }
    
    clearLines();
    
    // 새 블록 생성 및 충돌 확인
    const newPiece = nextPiece;
    nextPiece = getNextPiece(); // randomPiece 대신 getNextPiece 사용
    
    // 게임 오버 조건: 새 블록이 기존 블록과 겹치는지 확인
    if (checkCollision(newPiece)) {
        console.log("새 블록 충돌 감지: 게임 오버");
        
        // 충돌 상태를 시각적으로 보여주기 위해 블록 배치
        piece = newPiece;
        drawBoard();
        
        // 게임 오버 처리
        gameOver = true;
        showGameOver();
        
        // 애니메이션 프레임 취소
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
        return;
    }
    
    // 충돌이 없으면 계속 진행
    piece = newPiece;
    drawNextPiece();
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
        // 라인 클리어시 콤보 처리
        if (lastClearWasCombo) {
            combo++; // 연속 라인 클리어시 콤보 증가
        } else {
            combo = 1; // 첫 라인 클리어
            lastClearWasCombo = true;
        }
        
        const linePoints = [40, 100, 300, 1200]; // 1, 2, 3, 4줄
        let comboBonus = 0;
        
        if (combo > 1) {
            // 콤보 보너스 점수 계산 (콤보가 2 이상일 때부터 적용)
            comboBonus = 50 * combo * level;
            
            // 콤보 메시지 표시 (선택사항)
            showComboMessage(combo, comboBonus);
        }
        
        // 기본 점수 + 콤보 보너스
        score += linePoints[linesCleared - 1] * level + comboBonus;
        lines += linesCleared;
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 500 - (level - 1) * 100);
        
        updateScore();
    } else {
        // 라인을 클리어하지 못했으면 콤보 초기화
        if (lastClearWasCombo) {
            lastClearWasCombo = false;
            combo = 0;
        }
    }
}

// 콤보 메시지 표시 함수 추가 (캔버스에 시각적으로 표시)
function showComboMessage(comboCount, bonus) {
    // 캔버스 중앙에 콤보 메시지 표시
    ctx.font = '24px Arial';
    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; // 금색
    ctx.textAlign = 'center';
    
    // 콤보 메시지와 점수 표시
    if (comboCount >= 3) {
        // 3콤보 이상일 때 특별한 메시지
        ctx.fillText(`${comboCount} COMBO!`, canvas.width / 2, canvas.height / 2 - 50);
        ctx.font = '18px Arial';
        ctx.fillText(`+${bonus}`, canvas.width / 2, canvas.height / 2 - 20);
    }
    
    // 메시지는 다음 블록이 내려오면서 자연스럽게 사라짐
}

// 게임 오버 화면 함수
function showGameOver() {
    // 게임 루프 정지
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    isPlaying = false;
    gameOver = true;
    
    // 게임 오버 화면 표시
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.font = '20px Arial';
    ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText('아무 키나 눌러 다시 시작', canvas.width / 2, canvas.height / 2 + 50);
    
    // 점수 저장 - alert 제거
    saveScore(score, lines, level).then(result => {
        // alert 호출 제거하고 조용히 랭킹 업데이트만 수행
        if (result && result.isNewHighScore) {
            // 새 최고 점수 표시를 캔버스에 추가
            ctx.font = '24px Arial';
            ctx.fillStyle = '#FFDD00';
            ctx.fillText(`새 최고 점수! 랭킹: ${result.rank}위`, canvas.width / 2, canvas.height / 2 + 90);
        }
        
        // 랭킹 목록 업데이트
        updateLeaderboard();
    });
    
    console.log("게임 오버 화면 표시됨");
}

// 게임 루프
function gameLoop() {
    // 게임 오버 또는 일시정지면 루프 중단
    if (gameOver || isPaused) {
        return;
    }
    
    const now = Date.now();
    const delta = now - dropStart;
    
    // 레벨 2 이상에서 가비지 라인 추가
    if (level >= 2) {
        const garbageDelta = now - lastGarbageTime;
        
        // 레벨에 따라 가비지 간격 조정 (레벨이 높을수록 더 빨리)
        const adjustedInterval = garbageInterval - ((level - 2) * 500);
        const currentGarbageInterval = Math.max(5000, adjustedInterval); // 최소 5초 간격
        
        if (garbageDelta > currentGarbageInterval) {
            // 레벨 10 이상은 두 줄씩, 그 외에는 한 줄씩
            const linesToAdd = level >= 10 ? 2 : 1;
            addGarbageLines(linesToAdd);
            lastGarbageTime = now;
        }
    }
    
    if (delta > dropInterval) {
        dropPiece();
    }
    
    // 현재 게임 상태가 여전히 유효한지 확인
    if (!gameOver) {
        drawBoard();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// 키보드 입력 처리
function handleKeyPress(e) {
    // 스페이스바(32) 또는 화살표 키(37-40)가 눌렸을 때 스크롤 방지
    if (e.keyCode >= 32 && e.keyCode <= 40 || e.keyCode === 27) {
        e.preventDefault(); // 브라우저 기본 동작 방지
    }
    
    // 게임이 시작되지 않은 상태에서 아무 키나 누르면 게임 시작
    if (!isPlaying && !gameOver) {
        isStartKeyPressed = true;
        startGame();
        return;
    }

    // 게임 종료 상태에서 키를 누르면 게임 재시작
    if (gameOver) {
        isStartKeyPressed = true;
        startGame();
        return;
    }

    // ESC 키 처리 - 일시정지 토글
    if (e.keyCode === 27) { // ESC 키
        togglePause();
        return;
    }

    // 게임 일시정지 상태에서는 다른 키 입력 무시
    if (isPaused) {
        return;
    }

    // 시작 키가 아닌 경우에만 게임 로직 적용
    if (isStartKeyPressed) {
        isStartKeyPressed = false;
        return;
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
        case 80: // P 키
            togglePause();
            break;
    }
}

// 점수 저장 함수 - 최고 점수인 경우에만 서버에 저장
async function saveScore(score, lines, level) {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('점수 저장을 위해 로그인이 필요합니다.');
        return null;
    }
    
    try {
        const response = await fetch(`${API_URL}/tetris/score`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
            body: JSON.stringify({
                score,
                lines,
                level
            })
        });
        
        if (!response.ok) {
            throw new Error('점수 저장에 실패했습니다.');
        }
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('점수 저장 오류:', error);
        return null;
    }
}

// 랭킹 표시 함수 업데이트
async function updateLeaderboard() {
    const rankingList = document.getElementById('ranking-list');
    const myBestScoreElement = document.getElementById('my-best-score');
    
    // 랭킹 목록 가져오기
    try {
        const response = await fetch(`${API_URL}/tetris/leaderboard?limit=10`);
        if (!response.ok) {
            throw new Error('랭킹 데이터를 가져오는데 실패했습니다.');
        }
        
        const data = await response.json();
        const leaderboard = data.leaderboard || [];
        
        // 내 점수 정보 가져오기
        const token = localStorage.getItem('token');
        let myScoreData = null;
        
        if (token) {
            const myScoreResponse = await fetch(`${API_URL}/tetris/user/score`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (myScoreResponse.ok) {
                myScoreData = await myScoreResponse.json();
            }
        }
        
        // 랭킹 목록이 비어있는 경우
        if (leaderboard.length === 0) {
            rankingList.innerHTML = `
                <li class="ranking-item">
                    <span class="rank-position">-</span>
                    <span class="rank-name">아직 기록이 없습니다</span>
                    <span class="rank-score">-</span>
                </li>
            `;
        } else {
            // 랭킹 목록 생성
            rankingList.innerHTML = leaderboard.map((entry, index) => {
                const nickname = entry.nickname || entry.username;
                const isMe = myScoreData && myScoreData.nickname === entry.nickname;
                
                return `
                    <li class="ranking-item ${isMe ? 'my-rank' : ''}">
                        <span class="rank-position">${index + 1}</span>
                        <span class="rank-name">${nickname}</span>
                        <span class="rank-score">${entry.score.toLocaleString()}</span>
                    </li>
                `;
            }).join('');
        }
        
        // 내 최고 점수 표시
        if (myScoreData && myScoreData.hasRecord) {
            myBestScoreElement.innerHTML = `
                <div style="font-size: 16px; margin-bottom: 5px;">
                    <span style="color: #ffcc00; font-weight: bold;">${myScoreData.nickname}</span>님
                </div>
                <div style="font-size: 18px;">
                    최고 점수: <span style="color: #ffcc00; font-weight: bold;">${myScoreData.highScore.toLocaleString()}</span>
                </div>
                <div style="font-size: 14px; margin-top: 5px;">
                    현재 랭킹: <span style="color: #ffcc00; font-weight: bold;">${myScoreData.rank}위</span>
                </div>
            `;
        } else if (myScoreData) {
            myBestScoreElement.innerHTML = `
                <div style="font-size: 16px; margin-bottom: 5px;">
                    <span style="color: #ffcc00; font-weight: bold;">${myScoreData.nickname}</span>님
                </div>
                <div style="font-size: 18px;">
                    아직 기록이 없습니다
                </div>
            `;
        } else {
            myBestScoreElement.innerHTML = `
                <div style="color: #aaa;">로그인이 필요합니다</div>
            `;
        }
        
    } catch (error) {
        console.error('랭킹 업데이트 오류:', error);
        rankingList.innerHTML = `
            <li class="ranking-item">
                <span class="rank-position">-</span>
                <span class="rank-name">랭킹을 불러올 수 없습니다</span>
                <span class="rank-score">-</span>
            </li>
        `;
    }
}

// 검은 블록(가비지) 줄 생성 함수
function generateGarbageLine() {
    // 레벨에 따른 빈 공간 개수 계산 (최소 1개에서 최대 5개까지)
    const maxEmptySpaces = Math.min(5, Math.floor(COLS / 2)); // 최대 절반
    const minEmptySpaces = 1;
    
    // 레벨에 따라 빈 공간 개수 증가 (레벨 2는 1개, 레벨 10은 5개 정도)
    let emptySpaces = Math.min(
        maxEmptySpaces,
        minEmptySpaces + Math.floor((level - 2) / 1.6)
    );
    
    if (emptySpaces < minEmptySpaces) emptySpaces = minEmptySpaces;
    
    // 검은 블록으로 가득 찬 배열 생성
    const garbageLine = Array(COLS).fill(8); // 8은 검은 블록 색상 인덱스
    
    // 랜덤 위치에 빈 공간 생성
    const emptyPositions = [];
    while (emptyPositions.length < emptySpaces) {
        const pos = Math.floor(Math.random() * COLS);
        if (!emptyPositions.includes(pos)) {
            emptyPositions.push(pos);
            garbageLine[pos] = 0; // 빈 공간으로 설정
        }
    }
    
    return garbageLine;
}

// 보드에 가비지 라인 추가하는 함수
function addGarbageLines(lines = 1) {
    // 현재 피스가 충돌하는지 확인하기 위한 백업
    const originalY = piece.y;
    
    // 게임 오버 조건 확인: 첫 번째 줄에 블록이 있으면 게임 오버
    for (let col = 0; col < COLS; col++) {
        if (board[0][col] !== 0) {
            gameOver = true;
            showGameOver();
            return false;
        }
    }
    
    // 위쪽 줄을 모두 한 줄씩 위로 이동
    for (let row = 0; row < ROWS - lines; row++) {
        for (let col = 0; col < COLS; col++) {
            board[row][col] = board[row + lines][col];
        }
    }
    
    // 가비지 라인 생성 및 추가
    for (let i = 0; i < lines; i++) {
        const garbageLine = generateGarbageLine();
        for (let col = 0; col < COLS; col++) {
            board[ROWS - lines + i][col] = garbageLine[col];
        }
    }
    
    // 현재 피스 위치 조정 (가비지 라인만큼 위로)
    piece.y -= lines;
    
    // 피스가 가비지 라인과 충돌하면 게임 오버
    if (checkCollision()) {
        // 충돌이 발생하면 원래 위치로 복원 시도
        piece.y = originalY;
        
        // 그래도 충돌하면 게임 오버
        if (checkCollision()) {
            gameOver = true;
            showGameOver();
            return false;
        }
    }
    
    // 보드 다시 그리기
    drawBoard();
    return true;
}

// 이벤트 리스너
document.addEventListener('keydown', handleKeyPress);
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);

// 메뉴 버튼 이벤트 리스너
const menuButton = document.getElementById('menu-button');
menuButton.addEventListener('click', () => {
    window.location.href = '../../menu/games.html';
});

// 페이지 로드시 게임 초기화
document.addEventListener('DOMContentLoaded', function() {
    init();
    updateLeaderboard();
});
