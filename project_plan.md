# 학원 관리 시스템 (Academy Management System)

## 1. 프로젝트 설명
원장님(관리자)과 선생님이 사용하는 학원 운영 관리 시스템입니다.
학생 명단을 등록·관리하고, 반/수업을 개설해 시간표를 만들고, 매일의 출결을 체크·기록하는 것을 핵심으로 합니다.

- **대상 사용자**: 원장님(관리자), 선생님
- **핵심 가치**: 학원 운영의 핵심 업무(학생·수업·출결)를 한 곳에서 간편하게 관리

## 2. 페이지 구조
- `/login` - 로그인
- `/signup` - 회원가입 (가입 신청 후 원장 승인 대기)
- `/approvals` - 가입 승인 (원장 전용, 신규 가입 승인/거절)
- `/dashboard` - 대시보드 (역할별 홈)
- `/students` - 학생 관리 (등록/목록/수정/삭제)
- `/classes` - 반/수업 관리
- `/timetable` - 시간표
- `/exams` - 시험기간 시간표 (학교/학년별 중간·기말고사 일정, 과목/시험범위, 목록/달력 보기)
- `/exam-papers` - 시험지 관리 (시험지 이미지 업로드, 연필 필기 제거, 답안지 기입)
- `/attendance` - 출결 체크와 기록 (당일 수업 전체 보기, 결석 사유/보충 일정, 당일 보충수업 출석)
- `/makeup` - 보충명단 (결석 학생 보충 일정 관리)
- `/absence-calendar` - 결석 달력 (월별 결석 학생만 표시, 보충 완료 날짜 표시)
- `/teachers` - 선생님 관리 (원장 전용)

## 3. 핵심 기능
- [x] 회원가입 / 로그인 (역할: 원장, 선생님)
- [x] 회원가입 승인 (원장이 신규 가입 승인/거절, 승인 전 대기 화면)
- [x] 역할별 대시보드 레이아웃
- [x] 학생 등록 / 목록 / 수정 / 삭제
- [x] 반(수업) 개설과 담당 선생님 배정
- [x] 시간표 생성과 조회
- [x] 출결 체크와 일자별 기록
- [x] 선생님 관리 (원장 전용)

## 4. 데이터 모델 설계

### Table: profiles (auth.users 와 1:1)
| 필드 | 타입 | 설명 |
|-------|------|------|
| id | uuid (PK) | auth.users.id 참조 |
| full_name | text | 이름 |
| role | text | 'admin'(원장) / 'teacher'(선생님) |
| phone | text | 연락처 |
| status | text | 'pending'(승인대기) / 'approved'(승인) / 'rejected'(거절) |
| created_at | timestamptz | 생성일 |

### Table: students (학생)
| 필드 | 타입 | 설명 |
|-------|------|------|
| id | uuid (PK) | |
| name | text | 이름 |
| birth_date | date | 생년월일 |
| school | text | 학교 |
| grade | text | 학년 |
| parent_name | text | 보호자 이름 |
| parent_phone | text | 보호자 연락처 |
| notes | text | 메모 |
| created_at | timestamptz | 등록일 |

### Table: classes (반/수업)
| 필드 | 타입 | 설명 |
|-------|------|------|
| id | uuid (PK) | |
| name | text | 반 이름 |
| subject | text | 과목 |
| teacher_id | uuid | 담당 선생님 (profiles.id) |
| description | text | 설명 |
| created_at | timestamptz | 개설일 |

### Table: class_students (반-학생 연결)
| 필드 | 타입 | 설명 |
|-------|------|------|
| class_id | uuid (FK) | |
| student_id | uuid (FK) | |

### Table: timetable (시간표)
| 필드 | 타입 | 설명 |
|-------|------|------|
| id | uuid (PK) | |
| class_id | uuid (FK) | |
| day_of_week | int | 요일 (0=일 ~ 6=토) |
| start_time | time | 시작 시각 |
| end_time | time | 종료 시각 |

### Table: attendance (출결 기록)
| 필드 | 타입 | 설명 |
|-------|------|------|
| id | uuid (PK) | |
| class_id | uuid (FK) | |
| student_id | uuid (FK) | |
| date | date | 날짜 |
| status | text | 'present'/'late'/'absent'/'early_leave'/'makeup' |
| note | text | 비고 |
| absence_type | text | 결석 사유 ('가족행사'/'학교행사'/'병결'/'무단결석'/'개인사정') |
| makeup_date | date | 보충 예정 날짜 |
| makeup_time | text | 보충 예정 시간 |
| makeup_status | text | 보충 상태 ('pending'/'completed') |
| makeup_completed_date | date | 보충 완료 날짜 (실제 보충한 날) |

### Table: exam_schedules (시험기간 시간표)
| 필드 | 타입 | 설명 |
|-------|------|------|
| id | uuid (PK) | |
| school | text | 학교 (다사고/심인고/와룡고/호산고/성서고/성산고/달서고/서재중/서동중/달서중) |
| grade | text | 학년 ('1학년'/'2학년'/'3학년') |
| term | text | '중간고사'/'기말고사' |
| subject | text | 과목 |
| exam_date | date | 시험 날짜 |
| start_time | text | 시작 시간 |
| end_time | text | 종료 시간 |
| exam_range | text | 시험 범위 |
| created_at | timestamptz | 등록일 |

### Table: exam_papers (시험지 관리)
| 필드 | 타입 | 설명 |
|-------|------|------|
| id | uuid (PK) | |
| title | text | 제목 |
| school | text | 학교 |
| grade | text | 학년 |
| term | text | '중간고사'/'기말고사' |
| subject | text | 과목 |
| image_url | text | 원본 시험지 이미지 URL |
| cleaned_image_url | text | 필기 제거된 정리본 이미지 URL |
| answer | text | 답안지 (내가 푼 답 기입) |
| created_at | timestamptz | 등록일 |

> 시험지 이미지는 `exam-papers`(public) 스토리지 버킷에 저장된다.

## 5. 백엔드 / 외부 연동 계획
- **데이터베이스**: SaaS Supabase (연결됨) - Auth + Database 사용
- Shopify / Stripe / PayPal: 불필요 (수강료 결제 도입 시 별도 검토)

## 6. 개발 단계 계획

### Phase 1: 인증 + 기본 레이아웃
- 목표: 회원가입/로그인과 역할별 대시보드 골격 완성
- 산출물: profiles 스키마, 로그인/회원가입 페이지, 사이드바 레이아웃, 대시보드 홈

### Phase 2: 학생 관리
- 목표: 학생 등록/목록/수정/삭제
- 산출물: students 스키마 + 학생 CRUD 페이지

### Phase 3: 반/수업 + 시간표
- 목표: 반 개설과 시간표 구성
- 산출물: classes/timetable 스키마 + 반 관리·시간표 페이지

### Phase 4: 출결
- 목표: 출결 체크와 일자별 기록
- 산출물: attendance 스키마 + 출결 페이지 ✅ 완료

### Phase 5: 선생님 관리 (원장 전용)
- 목표: 선생님 계정 관리
- 산출물: 선생님 목록/권한 관리 페이지 ✅ 완료