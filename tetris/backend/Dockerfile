# ---------------------------
# 1단계: 빌드 스테이지
# ---------------------------
    FROM --platform=$BUILDPLATFORM golang:1.19-alpine AS builder

    # 환경 변수 설정 (CGO_DISABLE은 OS 라이브러리에 의존 줄이기 위해 자주 사용)
    ENV CGO_ENABLED=0 \
        GOOS=linux \
        GOARCH=amd64
    
    # 작업 디렉토리 생성
    WORKDIR /app
    
    # 필요한 라이브러리 설치 (alpine이므로, git 등 필요한 패키지 설치)
    RUN apk update && apk add --no-cache git
    
    # 호스트의 소스 코드를 컨테이너 내부로 복사
    COPY . /app
    
    # Go 모듈 다운로드
    RUN go mod download
    
    # 실제 Go 바이너리 빌드
    RUN go build -o server main.go
    
    # ---------------------------
    # 2단계: 배포 스테이지
    # ---------------------------
    FROM --platform=$BUILDPLATFORM alpine:3.17
    
    # 작업 디렉토리 설정
    WORKDIR /root/
    
    # builder 스테이지에서 만든 실행 파일 복사
    COPY --from=builder /app/server .
    
    # 8080 포트 사용 (main.go 참고)
    EXPOSE 8080
    
    # 서버 실행
    CMD ["./server"]