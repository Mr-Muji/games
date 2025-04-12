# 테트리스 프론트엔드

## 프론트엔드 실행 방법

### Python을 사용한 간단한 웹 서버 실행

1. Python 설치 확인
```bash
python3 --version
```

2. Python이 설치되어 있지 않다면 설치:

#### macOS
```bash
# Homebrew 사용
brew install python3

# 또는 공식 웹사이트에서 설치 패키지 다운로드
# https://www.python.org/downloads/
```

3. frontend 디렉토리로 이동 (현재 위치에 있다면 생략 가능)
```bash
cd tetris/frontend
```

4. Python 내장 HTTP 서버 실행
```bash
# Python 3
python3 -m http.server 3000
```