/gameplatform
├── backend/
│   ├── main.go                  # 서버 진입점
│   ├── api/                     # API 라우터 및 핸들러
│   │   ├── auth.go              # 인증 관련 API
│   │   ├── scores.go            # 점수 관련 API
│   │   └── games.go             # 게임 목록/정보 API
│   ├── db/
│   │   ├── models/              # 데이터 모델 정의
│   │   │   ├── user.go          # 사용자 모델
│   │   │   └── score.go         # 점수 모델
│   │   └── migrations/          # DB 마이그레이션 스크립트
│   ├── middleware/              # 미들웨어 (인증, 로깅 등)
│   └── config/                  # 환경설정
│
├── frontend/
│   ├── public/                  # 정적 파일
│   │   ├── images/
│   │   └── favicon.ico
│   ├── index.html               # 메인 HTML
│   ├── assets/                  # 공유 자원
│   │   ├── css/                 # 공통 스타일
│   │   └── js/
│   │       ├── auth.js          # 인증 관련 공통 함수
│   │       └── api.js           # API 호출 관련 공통 함수
│   ├── components/              # 공통 컴포넌트
│   │   ├── navbar.js
│   │   └── scoreboard.js
│   ├── auth/                    # 인증 관련 페이지
│   │   ├── login.html
│   │   └── signup.html
│   ├── games/                   # 게임 모듈 디렉토리
│   │   ├── tetris/              # 테트리스 게임 모듈
│   │   │   ├── tetris.js        # 게임 로직
│   │   │   ├── tetris.html      # 게임 HTML
│   │   │   └── styles.css       # 게임별 스타일
│   │   └── snake/               # 스네이크 게임 모듈
│   │       ├── snake.js
│   │       ├── snake.html
│   │       └── styles.css
│   └── main.js                  # 프론트엔드 초기화 스크립트
│
├── docker-compose.yml           # 개발 및 배포 설정
└── README.md                    # 플랫폼 문서