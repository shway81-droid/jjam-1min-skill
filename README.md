# jjam-1min

**교과서 한 차시를 1분 세로 영상으로.** NotebookLM 숏폼으로 만들고, 사람이 교과서와 대조하고, 유튜브 Shorts로 올린 뒤 정적 사이트에 등록하는 절차를 담은 [Aside](https://aside.com) 스킬입니다.

결과물: [짬짬이 1분 수업](https://shway81-droid.github.io/jjam-1min/)

절차 전체는 [`SKILL.md`](SKILL.md)에 있습니다. 규칙마다 **왜 그런지가 실측 근거와 함께** 적혀 있습니다.

## 설치

Aside 계정 스킬 폴더에 클론합니다.

```bash
# 윈도우
git clone https://github.com/shway81-droid/jjam-1min.git "$env:USERPROFILE/.aside/u/0/skills/user/jjam-1min"
# 맥·리눅스
git clone https://github.com/shway81-droid/jjam-1min.git ~/.aside/u/0/skills/user/jjam-1min
```

경로를 자기 컴퓨터에 맞게 적습니다.

```bash
cp config.sample.json config.json   # 그리고 경로를 채웁니다
```

## 준비물

1. **브라우저의 구글 로그인** — NotebookLM과 유튜브를 같은 세션으로 씁니다
2. **차시별로 잘린 교과서 PDF** — 학기 PDF를 차시로 자르는 일은 이 스킬 밖입니다
3. **사이트 저장소 클론** — 차시 데이터를 넣을 곳
4. **ffmpeg** — `pip install imageio-ffmpeg` 면 충분합니다

## 쓰는 법

에이전트에게 차시를 말하면 `SKILL.md` 절차대로 진행합니다.

> 사회 5-2 2단원 3차시 숏폼 만들어줘

## 먼저 알아 둘 것

**NotebookLM은 내용을 바꿉니다.** 고유명사를 바꾸고, 없던 문장을 지어내고, 한반도를 육각형으로 그린 적이 있습니다. 그래서 영상마다 **사람이 프레임을 넘겨 보며 교과서와 대조하는 단계**가 있습니다. 이 단계를 건너뛰면 이 스킬은 쓰면 안 됩니다.

**하루에 만들 수 있는 양이 제한됩니다.** NotebookLM은 5시간 창에 10~11편, 유튜브는 미인증 채널이 하루 15편입니다. 실질 병목은 대개 유튜브 쪽입니다.

**영상 파일은 저장소에 올리지 않습니다.** 유튜브가 호스팅이고 사이트는 영상 ID만 듭니다 — 영상을 직접 서비스하면 전송량이 곧 비용이 됩니다.

## 구조

```
SKILL.md                  전체 절차. 규칙마다 실측 근거가 붙어 있다
config.sample.json        경로 설정 본보기 (복사해서 config.json 으로)
references/prompt.md      숏폼 생성 프롬프트 골격과 실제 예시
scripts/config.mjs        경로 설정 읽기
scripts/add-lesson.mjs    사이트 데이터에 차시 한 건 추가 (중복·형식 검사 포함)
scripts/frames.mjs        mp4 → 규격 확인 + 검수용 프레임 시트
```

## 라이선스

MIT. 교과서 PDF와 생성된 영상은 이 저장소에 들어 있지 않습니다.
