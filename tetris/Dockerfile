# Nginx를 베이스 이미지로 사용
FROM nginx:alpine

# 작업 디렉토리 설정
WORKDIR /usr/share/nginx/html

# 프론트엔드 파일 복사
COPY frontend/ .

# Nginx 설정 파일 복사 (선택 사항)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# 80번 포트 노출
EXPOSE 80

# Nginx 시작
CMD ["nginx", "-g", "daemon off;"] 