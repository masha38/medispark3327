# 실제 HTML 폼 + Apps Script 연동 가이드

## 연결 파일

- 폼 마크업: `index.html`의 `#consult-form`
- 브라우저 전송 코드: `script.js`
- 웹 앱 URL 설정: `config.js`
- Apps Script 서버: `Code.gs`
- 시트 컬럼 샘플: `google_sheet_columns.csv`

## HTML 폼 필드 매핑

```html
<form id="consult-form" novalidate>
  <input type="hidden" name="developer" value="장문희">
  <input type="text" name="name" autocomplete="name" required>
  <input type="tel" name="phone" autocomplete="tel" inputmode="numeric" required>
  <textarea name="inquiry" required></textarea>
  <input type="checkbox" name="privacy" required>
  <button type="submit">방문상담 신청하기</button>
</form>
```

`developer`는 화면에도 포함하지만 최종 저장값은 Apps Script의 `DEVELOPER = '장문희'` 상수가 결정한다.

## 배포 URL 설정

```js
window.LANDING_CONFIG = {
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/배포ID/exec"
};
```

반드시 `/exec`로 끝나는 운영 배포 URL을 사용한다.

## 전송 핵심 코드

```js
const response = await fetch(window.LANDING_CONFIG.APPS_SCRIPT_URL, {
  method: "POST",
  headers: { "Content-Type": "text/plain;charset=utf-8" },
  body: JSON.stringify({
    name: form.elements.name.value.trim(),
    phone: form.elements.phone.value,
    inquiry: form.elements.inquiry.value.trim(),
    developer: "장문희",
    pageUrl: location.href
  })
});

const result = await response.json();
if (!result.success) throw new Error(result.error);
```

전체 운영 코드는 입력 검증, 중복 제출 방지, UTM 기록, 성공·실패 UI가 포함된 `script.js`를 사용한다.

## 연결 확인 순서

1. 브라우저에서 Apps Script `/exec` URL을 직접 열어 `success: true` 상태 응답을 확인한다.
2. 랜딩페이지 폼에 테스트 값을 입력하고 제출한다.
3. 화면에 신청 완료 메시지가 표시되는지 확인한다.
4. `방문상담_DB` 시트에서 이름, 연락처, 문의, 개발자 `장문희`, 접수 ID를 확인한다.
5. Apps Script 실행 기록에서 오류가 없는지 확인한다.

테스트가 끝나면 테스트 고객 행을 삭제하고 실제 고객정보 수집 전에 개인정보 고지와 접근 권한을 최종 점검한다.
