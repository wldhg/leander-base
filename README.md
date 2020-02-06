# 리엔더

> 디스코드 봇을 만들기 딱 좋은 시간이에요.

리엔더 베이스는 디스코드 봇 코드를 간단히 만들 수 있도록 미리 준비된 봇 구조입니다.

### 간단하게 구조 파악하기

+ `data` : 설정 및 각종 정보가 파일로 저장되는 디렉토리
+ `res/lang` : 봇이 말하는 언어 (인격) 디렉토리
+ `res/web` : 웹 기능에 사용되는 리소스 모음
+ `src/core` : `Node.js` CLI 프로그램의 동작을 관리하는 부분
+ `src/util` : 코어와 봇에서 사용되는 도구 모음
+ `src/bot` : "진짜" 디스코드 봇 코드
  - `src/bot/commands` : 명령어 모음
  - `src/bot/modules` : 모듈 모음

### 봇 작동시키기

1. `data/config.example.yml`을 개인화하여 `data/config.yml`에 작성합니다.
2. `yarn install` 명령어로 의존성 패키지를 설치합니다.
3. `yarn start` 명령어로 봇을 시작합니다.

### 봇 개발하기

##### 명령어 추가하기

명령어는 사용자가 `[접두사][명령어]`로 접근할 수 있는 봇의 기능입니다.

각 명령어는 `src/bot/commands` 폴더 아래에 작성되어야 하며, 그 아래 어디 있든지 로드됩니다.

하나의 명령어 파일은 `meta: LNDRCommandMeta`, `help: LNDRCommandHelp`, `fn: LNDRCommandFunction`을 내보내야 합니다.

각각의 인터페이스 및 타입은 [여기](/src/bot/types.ts)의 정의를 참조하세요.

[핑(ping) 명령어 코드](/src/bot/commands/system/ping.ts), [버전 명령어 코드](/src/bot/commands/system/version.ts)는 참고하기에 좋은 간단한 예시입니다.

##### 모듈 추가하기

모듈은 여러 명령어에서 공통적으로 쓰이는 기능 패키지입니다.

모듈 파일은 `src/bot/modules` 폴더 아래에 작성되어야 하며, 그 아래 어디 있든지 로드됩니다.
또한 하나의 모듈 파일은 하나의 `LNDRModule` 클래스를 `default`로 내보내야 합니다.
모듈 파일명은 [이 목록](/src/bot/modules.ts#L8)에서 제공하는 것 이외에는 모두 사용할 수 있습니다.

`LNDRModule` 인터페이스 구조는 [여기](/src/bot/types.ts)의 정의를 참조하세요.

로드된 모듈은 명령어에서 `lndr.[모듈 이름].[액션 이름]` 으로 접근할 수 있습니다.

### 라이선스

리엔더 베이스 프로젝트는 Mozilla Public License 2.0을 따릅니다. [이 곳](LICNESE.md)에서 확인할 수 있습니다.
