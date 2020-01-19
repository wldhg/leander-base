export default {
  name: '🎇 환영 메시지',
  help: {
    description: '디스코드 서버의 환영(안내) 문구를 지정합니다.',
    fields: {
      '문구 등록': '`[[prefix]]환영문구 등록 (환영문구)',
      '문구 삭제': '`[[prefix]]환영문구 삭제',
      '문구 확인': '`[[prefix]]환영문구',
      '문법 안내': '`[[언급]]` → 입장 멤버 언급\n`[[이름]]` → 입장 멤버 이름으로 치환',
      '채널 안내': '새 멤버 입장 시 채널 별로 등록한 문구가 출력됩니다.',
    },
  },
  section: '함대 커뮤니티',
  commands: ['환영문구', '입장문구'],
  conditions: {
    serverAdmin: true,
  },
  fn: (kernel, lndr, msg, pmsg) => {
    const context = { // eslint-disable-line no-unused-vars
      kernel, lndr, msg, pmsg,
    };
    msg.channel.startTyping();
    msg.channel.stopTyping();
  },
};
