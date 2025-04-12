// db 패키지는 데이터베이스 연결 및 쿼리 처리를 담당합니다.
package db

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/lib/pq" // PostgreSQL 드라이버
)

// DB 전역 변수로 선언
var DB *sql.DB

// InitDB 함수는 PostgreSQL 데이터베이스에 연결을 설정합니다.
func InitDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL 환경변수가 설정되지 않았습니다.")
	}

	// DB 연결 시작 시간 기록
	startTime := time.Now()

	// 연결 정보 로깅 (비밀번호 제외)
	// postgres://username:password@host:port/dbname 형식에서 비밀번호만 숨김
	logURL := dbURL
	if i := strings.Index(logURL, ":"); i > 0 {
		if j := strings.Index(logURL[i+1:], "@"); j > 0 {
			logURL = logURL[:i+1] + "******" + logURL[i+1+j:]
		}
	}
	log.Printf("데이터베이스 연결 시도: %s", logURL)

	var err error
	DB, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("DB 연결 객체 생성 실패:", err)
	}

	// 연결 설정
	DB.SetMaxOpenConns(25)                 // 최대 연결 수
	DB.SetMaxIdleConns(5)                  // 유휴 연결 수
	DB.SetConnMaxLifetime(5 * time.Minute) // 연결 최대 수명

	// 실제 연결 테스트
	if err = DB.Ping(); err != nil {
		log.Fatal("DB Ping 실패:", err)
	}

	// 연결 시간 계산
	elapsed := time.Since(startTime)

	// 데이터베이스 버전 확인
	var version string
	err = DB.QueryRow("SELECT version()").Scan(&version)
	if err != nil {
		log.Printf("데이터베이스 버전 확인 실패: %v", err)
	}

	// 연결 통계 정보
	stats := DB.Stats()

	log.Printf("PostgreSQL 데이터베이스 연결 성공 (소요시간: %v)", elapsed)
	log.Printf("데이터베이스 버전: %s", version)
	log.Printf("연결 통계: 열린 연결 %d개, 사용 중인 연결 %d개, 유휴 연결 %d개",
		stats.OpenConnections, stats.InUse, stats.Idle)

	// 마이그레이션 실행: 테이블이 없으면 생성합니다.
	if err := runMigrations(); err != nil {
		log.Fatal("마이그레이션 실패:", err)
	}

	// 테이블 수 확인
	var tableCount int
	err = DB.QueryRow(`
		SELECT COUNT(*) FROM information_schema.tables 
		WHERE table_schema = 'public'
	`).Scan(&tableCount)
	if err != nil {
		log.Printf("테이블 수 확인 실패: %v", err)
	} else {
		log.Printf("데이터베이스에 %d개의 테이블이 있습니다.", tableCount)
	}

	// 사용자 테이블 행 수 확인
	var userCount int
	err = DB.QueryRow("SELECT COUNT(*) FROM users").Scan(&userCount)
	if err != nil {
		log.Printf("사용자 수 확인 실패: %v", err)
	} else {
		log.Printf("users 테이블에 %d명의 사용자가 있습니다.", userCount)
	}
}

// runMigrations 함수는 migrations 폴더에 있는 SQL 파일을 읽어 실행합니다.
func runMigrations() error {
	log.Println("데이터베이스 마이그레이션 시작...")
	// 마이그레이션 디렉토리 경로
	migrationsDir := "db/migrations"

	// 사용자 테이블 마이그레이션
	usersTableSQL, err := os.ReadFile(filepath.Join(migrationsDir, "create_users_table.sql"))
	if err != nil {
		return fmt.Errorf("사용자 테이블 마이그레이션 파일 읽기 실패: %v", err)
	}

	log.Println("사용자 테이블 마이그레이션 실행 중...")
	// SQL 실행
	_, err = DB.Exec(string(usersTableSQL))
	if err != nil {
		return fmt.Errorf("사용자 테이블 마이그레이션 실행 실패: %v", err)
	}
	log.Println("사용자 테이블 마이그레이션 완료")

	// 게임 기록 테이블 마이그레이션
	gameRecordsSQL, err := os.ReadFile(filepath.Join(migrationsDir, "create_game_records_table.sql"))
	if err != nil {
		return fmt.Errorf("게임 기록 테이블 마이그레이션 파일 읽기 실패: %v", err)
	}

	log.Println("게임 기록 테이블 마이그레이션 실행 중...")
	// SQL 실행
	_, err = DB.Exec(string(gameRecordsSQL))
	if err != nil {
		return fmt.Errorf("게임 기록 테이블 마이그레이션 실행 실패: %v", err)
	}
	log.Println("게임 기록 테이블 마이그레이션 완료")

	// 테트리스 점수 테이블 마이그레이션 추가
	tetrisScoresSQL, err := os.ReadFile(filepath.Join(migrationsDir, "create_tetris_scores_table.sql"))
	if err != nil {
		return fmt.Errorf("테트리스 점수 테이블 마이그레이션 파일 읽기 실패: %v", err)
	}

	log.Println("테트리스 점수 테이블 마이그레이션 실행 중...")
	// SQL 실행
	_, err = DB.Exec(string(tetrisScoresSQL))
	if err != nil {
		return fmt.Errorf("테트리스 점수 테이블 마이그레이션 실행 실패: %v", err)
	}
	log.Println("테트리스 점수 테이블 마이그레이션 완료")

	log.Println("마이그레이션이 성공적으로 완료되었습니다.")
	return nil
}
