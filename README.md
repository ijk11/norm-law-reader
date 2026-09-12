# 규범과 법 · 문서 리더

상위 폴더의 논문 해설 Markdown 13편을 모바일과 데스크톱에서 읽기 위한 정적 PWA입니다.

## 원문을 수정한 뒤 동기화

PowerShell에서 `md-reader` 폴더를 기준으로 다음을 실행합니다.

```powershell
.\scripts\sync-content.ps1
```

## 로컬에서 실행

`file://`로 직접 열면 서비스 워커가 작동하지 않으므로 HTTP 서버를 사용합니다.

```powershell
python -m http.server 4173 -d dist
```

브라우저에서 `http://localhost:4173`을 엽니다. Android Chrome에서는 설치 버튼을, iPhone Safari에서는 공유 메뉴의 “홈 화면에 추가”를 사용합니다.

## 주요 기능

- 제목·저자·본문 전체검색과 연구선 필터
- 모바일 문서함·본문 목차
- 다크 모드, 글자 크기, 글꼴, 줄간격 조절
- 문서별 읽던 위치와 마지막 문서 자동 저장
- 서비스 워커 기반 오프라인 열람
- 문서 안의 다른 Markdown 파일 링크를 앱 내부 이동으로 처리
