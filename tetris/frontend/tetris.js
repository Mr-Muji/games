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
    '#3877FF'  // Z - 남색
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
let board = createBoard();       // 게임판 생성
let gameOver = false;            // 게임 오버 상태
let isPaused = false;            // 일시정지 상태
let score = 0;                   // 점수
let level = 1;                   // 레벨
let lines = 0;                   // 제거한 라인 수
let dropStart = Date.now();      // 블록 드롭 시작 시간
let piece = randomPiece();       // 현재 조작 중인 블록
let nextPiece = randomPiece();   // 다음 블록
let requestId = null; // 게임 루프용 requestAnimationFrame ID

// 게임 속도 (ms, 레벨에 따라 조정됨)
let dropInterval = 1000;

// 키보드 이벤트 리스너 추가
document.addEventListener('keydown', keyControl);

// 버튼 이벤트 리스너 추가
startButton.addEventListener('click', startGame);
pauseButton.addEventListener('click', togglePause);

// 게임판 생성 함수
function createBoard() {
    // 10x20 크기의 빈 게임판 배열 생성
    let board = [];
    for (let row = 0; row < ROWS; row++) {
        board[row] = [];
        for (let col = 0; col < COLS; col++) {
            board[row][col] = 0; // 0은 빈 셀을 의미
        }
    }
    return board;
}

// 랜덤 테트로미노 생성 함수
function randomPiece() {
    // 1부터 7까지의 랜덤 숫자 생성 (각각의 테트로미노 모양에 해당)
    const type = Math.floor(Math.random() * 7) + 1;
    // 새로운 테트로미노 객체 생성
    const piece = {
        type: type,                           // 블록 타입
        shape: SHAPES[type],                  // 블록 모양
        x: Math.floor(COLS / 2) - 1,          // 초기 x 위치 (중앙)
        y: 0,                                 // 초기 y 위치 (맨 위)
        color: COLORS[type]                   // 블록 색상
    };
    return piece;
}

// 게임 시작 함수
function startGame() {
    // 항상 게임을 초기화하도록 수정 (gameOver 상태와 관계없이)
    // 게임 상태 초기화
    board = createBoard();
    score = 0;
    level = 1;
    lines = 0;
    gameOver = false;
    
    // UI 업데이트
    updateScore();
    
    // 새 블록 생성
    piece = randomPiece();
    nextPiece = randomPiece();
    
    // 게임 루프 시작
    requestAnimationFrame(gameLoop);
    
    // 시작 버튼 텍스트 설정
    startButton.textContent = '게임 재시작';
}

// 게임 일시정지 토글 함수
function togglePause() {
    if (!gameOver) {
        isPaused = !isPaused;
        pauseButton.textContent = isPaused ? '계속하기' : '일시정지';
        
        if (!isPaused) {
            // 일시정지 해제 시 게임 루프 재개
            dropStart = Date.now();
            requestAnimationFrame(gameLoop);
        }
    }
}

// 키보드 입력 처리 함수
function keyControl(e) {
    if (gameOver || isPaused) return;
    
    // 키보드 입력에 따라 블록 이동 또는 회전
    switch(e.keyCode) {
        case 37:    // 왼쪽 화살표: 왼쪽으로 이동
            movePiece(-1);
            break;
        case 39:    // 오른쪽 화살표: 오른쪽으로 이동
            movePiece(1);
            break;
        case 40:    // 아래쪽 화살표: 빠르게 내리기
            dropPiece();
            break;
        case 38:    // 위쪽 화살표: 회전
            rotatePiece();
            break;
        case 32:    // 스페이스바: 즉시 내리기
            hardDrop();
            break;
    }
}

// 블록 좌우 이동 함수
function movePiece(direction) {
    // 이동 전 현재 위치 저장
    const prevX = piece.x;
    
    // 좌우로 이동
    piece.x += direction;
    
    // 충돌 검사
    if (checkCollision()) {
        // 충돌 시 이전 위치로 복원
        piece.x = prevX;
    }
    
    // 화면 갱신
    drawBoard();
}

// 블록 회전 함수
function rotatePiece() {
    // 현재 블록의 모양 복사
    const originalShape = piece.shape;
    const length = originalShape.length;
    
    // 새로운 회전된 모양 계산
    const rotated = [];
    for (let i = 0; i < length; i++) {
        rotated[i] = [];
        for (let j = 0; j < length; j++) {
            rotated[i][j] = originalShape[length - j - 1][i];
        }
    }
    
    // 임시로 회전 적용
    piece.shape = rotated;
    
    // 충돌 검사
    if (checkCollision()) {
        // 충돌 시 원래 모양으로 복원
        piece.shape = originalShape;
    }
    
    // 화면 갱신
    drawBoard();
}

// 블록 드롭 함수 (부드럽게 내리기)
function dropPiece() {
    // 한 칸 아래로 이동
    piece.y++;
    
    // 충돌 검사
    if (checkCollision()) {
        // 충돌 시 이전 위치로 복원
        piece.y--;
        // 보드에 블록 고정
        lockPiece();
    }
    
    // 드롭 시작 시간 재설정
    dropStart = Date.now();
    
    // 화면 갱신
    drawBoard();
}

// 블록 하드 드롭 함수 (즉시 내리기)
function hardDrop() {
    // 바닥에 닿을 때까지 반복
    while (!checkCollision()) {
        piece.y++;
    }
    
    // 마지막 위치 수정
    piece.y--;
    
    // 보드에 블록 고정
    lockPiece();
    
    // 화면 갱신
    drawBoard();
}

// 충돌 검사 함수
function checkCollision() {
    const shape = piece.shape;
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            // 블록이 있는 셀만 검사
            if (shape[y][x] !== 0) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                
                // 게임판 범위 밖인지 검사
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }
                
                // 아래쪽으로 이동 중 보드 바닥 검사
                if (boardY < 0) {
                    continue; // 아직 보드 위쪽 영역이면 무시
                }
                
                // 다른 블록과 충돌 검사
                if (board[boardY][boardX] !== 0) {
                    return true;
                }
            }
        }
    }
    
    // 충돌 없음
    return false;
}

// 블록을 게임판에 고정하는 함수
function lockPiece() {
    const shape = piece.shape;
    
    // 게임 오버 확인을 위한 변수
    let isAboveBoard = true;
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            // 블록이 있는 셀만 처리
            if (shape[y][x] !== 0) {
                const boardY = piece.y + y;
                
                // 게임판 범위 내 블록이 있는지 확인 (게임 오버 체크용)
                if (boardY >= 0) {
                    isAboveBoard = false;
                }
                
                // 게임판 범위 밖이면 해당 블록은 건너뜀
                if (boardY < 0) continue;
                
                // 게임판에 블록 고정
                board[boardY][piece.x + x] = piece.type;
            }
        }
    }
    
    // 게임 오버 체크: 블록이 모두 게임판 위에 있으면 게임 오버
    if (isAboveBoard) {
        gameOver = true;
        return;
    }
    
    // 새 블록 생성 전 게임 오버 체크: 새 블록이 현재 블록과 겹치면 게임 오버
    piece = nextPiece;
    nextPiece = randomPiece();
    
    if (checkCollision()) {
        gameOver = true;
        drawGameOver(); // 바로 게임오버 화면 표시
        return;
    }
    
    // 완성된 라인 제거 및 점수 계산
    clearLines();
    
    // 다음 블록 미리보기 업데이트
    drawNextPiece();
}

// 완성된 라인 제거 함수
function clearLines() {
    let linesCleared = 0;
    
    for (let y = ROWS - 1; y >= 0; y--) {
        let isLineComplete = true;
        
        // 한 줄이 모두 채워졌는지 검사
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] === 0) {
                isLineComplete = false;
                break;
            }
        }
        
        // 완성된 라인 제거
        if (isLineComplete) {
            linesCleared++;
            
            // 위에 있는 라인들을 한 칸씩 아래로 이동
            for (let yy = y; yy > 0; yy--) {
                for (let x = 0; x < COLS; x++) {
                    board[yy][x] = board[yy - 1][x];
                }
            }
            
            // 맨 위 라인을 비움
            for (let x = 0; x < COLS; x++) {
                board[0][x] = 0;
            }
            
            // 같은 y 위치를 다시 검사 (여러 줄이 동시에 제거될 수 있음)
            y++;
        }
    }
    
    // 점수 계산 및 업데이트
    if (linesCleared > 0) {
        // 점수 계산 (라인 수에 따라 보너스)
        const lineScores = [40, 100, 300, 1200]; // 1, 2, 3, 4줄
        score += lineScores[linesCleared - 1] * level;
        
        // 라인 수 업데이트
        lines += linesCleared;
        
        // 레벨 업데이트 (10줄마다 레벨업)
        level = Math.floor(lines / 10) + 1;
        
        // 게임 속도 업데이트
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);
        
        // UI 업데이트
        updateScore();
    }
}

// 점수 UI 업데이트 함수
function updateScore() {
    scoreElement.textContent = score;
    levelElement.textContent = level;
    linesElement.textContent = lines;
}

// 게임판 그리기 함수
function drawBoard() {
    // 캔버스 초기화
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 고정된 블록 그리기
    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (board[y][x] !== 0) {
                drawBlock(x, y, board[y][x]);
            }
        }
    }
    
    // 현재 조작 중인 블록 그리기
    drawPiece();
}

// 다음 블록 그리기 함수
function drawNextPiece() {
    // 캔버스 초기화
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    // 다음 블록의 중앙 위치 계산
    const offsetX = Math.floor((nextCanvas.width / NEXT_BLOCK_SIZE - nextPiece.shape[0].length) / 2);
    const offsetY = Math.floor((nextCanvas.height / NEXT_BLOCK_SIZE - nextPiece.shape.length) / 2);
    
    // 다음 블록 그리기
    for (let y = 0; y < nextPiece.shape.length; y++) {
        for (let x = 0; x < nextPiece.shape[y].length; x++) {
            if (nextPiece.shape[y][x] !== 0) {
                // 각 블록 셀 그리기
                nextCtx.fillStyle = COLORS[nextPiece.type];
                nextCtx.fillRect(
                    (offsetX + x) * NEXT_BLOCK_SIZE,
                    (offsetY + y) * NEXT_BLOCK_SIZE,
                    NEXT_BLOCK_SIZE,
                    NEXT_BLOCK_SIZE
                );
                
                // 블록 테두리 그리기
                nextCtx.strokeStyle = 'black';
                nextCtx.lineWidth = 1;
                nextCtx.strokeRect(
                    (offsetX + x) * NEXT_BLOCK_SIZE,
                    (offsetY + y) * NEXT_BLOCK_SIZE,
                    NEXT_BLOCK_SIZE,
                    NEXT_BLOCK_SIZE
                );
            }
        }
    }
}

// 현재 블록 그리기 함수
function drawPiece() {
    const shape = piece.shape;
    
    for (let y = 0; y < shape.length; y++) {
        for (let x = 0; x < shape[y].length; x++) {
            if (shape[y][x] !== 0) {
                const boardX = piece.x + x;
                const boardY = piece.y + y;
                
                // 보드 영역 안에 있는 블록만 그림
                if (boardY >= 0) {
                    drawBlock(boardX, boardY, piece.type);
                }
            }
        }
    }
}

// 단일 블록 그리기 함수
function drawBlock(x, y, type) {
    // 블록 배경 그리기
    ctx.fillStyle = COLORS[type];
    ctx.fillRect(
        x * BLOCK_SIZE,
        y * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );
    
    // 블록 테두리 그리기
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    ctx.strokeRect(
        x * BLOCK_SIZE,
        y * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );
}

// 게임 오버 화면 그리기 함수
function drawGameOver() {
    // 반투명 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 텍스트 스타일 설정
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    
    // 텍스트 그리기
    ctx.fillText('게임 오버', canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText('다시 시작하려면 시작 버튼을 누르세요', canvas.width / 2, canvas.height / 2 + 20);
}

// 게임 오버를 처리하는 함수를 endGame()으로 이름 변경
function endGame() {
    if (requestId) {
        cancelAnimationFrame(requestId);
    }
    gameOver = true;
    
    // 게임 오버 메시지 표시
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.font = '30px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('게임 오버', canvas.width / 2
        , canvas.height / 2 - 50);
    
    ctx.font = '20px Arial';
    ctx.fillText(`최종 점수: ${score}`, canvas.width / 2, canvas.height / 2);
    
    // (필요하면 점수 저장 로직 실행)
    saveScore();

    startButton.textContent = '다시 시작';
}

// main gameLoop 쪽에서 requestAnimationFrame 호출 시 반환값을 requestId에 저장
function gameLoop() {
    drawBoard();
    
    if (gameOver) {
        drawGameOver(); // 혹은 endGame()으로 바로 처리
        return;
    }
    if (isPaused) {
        return;
    }

    const now = Date.now();
    const delta = now - dropStart;

    if (delta > dropInterval) {
        dropPiece();
    }

    requestId = requestAnimationFrame(gameLoop);
}

// 초기화 및 게임 시작
window.onload = function() {
    // 로그인 확인
    const token = localStorage.getItem('token');
    if (!token) {
        // 로그인되지 않은 경우 로그인 페이지로 리다이렉트
        window.location.href = 'login.html';
        return;
    }
    
    // UI에 사용자 이름 표시 (필요시)
    const username = localStorage.getItem('username');
    if (username) {
        // 예: 게임 정보 영역에 사용자 이름 표시
        document.querySelector('.game-info h1').textContent = `테트리스 - ${username}`;
    }
    
    // 게임판 초기 그리기
    drawBoard();
    // 다음 블록 그리기
    drawNextPiece();
    // 시작 버튼 텍스트 설정
    startButton.textContent = '게임 시작';
    
    // 게임 메뉴 버튼 추가
    const menuButton = document.getElementById('menu-btn');
    if (menuButton) {
        menuButton.addEventListener('click', function() {
            window.location.href = 'games.html';
        });
    }
}

// 게임 점수 저장 함수
function saveScore() {
    // 게임 오버 시에만 호출
    if (!gameOver) return;
    
    // JWT 토큰이 없으면 저장하지 않음
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('로그인이 필요합니다.');
        return;
    }
    
    // 점수 데이터 생성
    const scoreData = {
        score: score,
        lines: linesCleared,
        level: level
    };
    
    // API 서버로 점수 전송
    fetch('http://localhost:8080/api/scores', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(scoreData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('점수 저장에 실패했습니다.');
        }
        return response.json();
    })
    .then(data => {
        if (data.newHighScore) {
            // 새로운 최고 점수인 경우 표시
            alert('축하합니다! 새로운 최고 점수를 달성했습니다!');
        } else {
            console.log('게임 점수가 기록되었습니다.');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
} 