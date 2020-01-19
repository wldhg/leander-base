import http from 'http';
import https from 'https';

export default {
  name: '💬  말 시키기',
  help: {
    description: '리엔더가 대신 말해드려요.',
    fields: {
      '텍스트 전달': '`[[prefix]]말 (할 말)` 혹은 `[[prefix]]> (할 말)`',
      '이미지 전달': '`[[prefix]]말 (이미지 URL) 혹은 `[[prefix]]> (이미지 URL)`',
    },
  },
  section: '기타',
  commands: ['말', '>'],
  conditions: { DM: false },
  fn: (kernel, lndr, msg, pmsg) => {
    // Delete message
    let wasDeleted = false;
    if (msg.deletable) {
      msg.delete();
      wasDeleted = true;
    }

    // Message sending part
    let echo;
    const sendEcho = (forcePriv) => {
      if (wasDeleted && !forcePriv) {
        msg.channel.send(echo);
      } else {
        msg.author.createDM().then((ch) => {
          if (!forcePriv) {
            ch.send('메시지를 지울 수 없는 곳이어서 아래의 메시지를 대신 말해드리지 못했어요.');
          }
          ch.send(echo);
        });
      }
    };

    // Create echo delivery - Check if it is image. If image, send it as file.
    const message = pmsg.raw;
    if (msg.attachments.size > 0) {
      echo = '디스코드에 직접 첨부하신 파일이 아닌, 파일 링크만 대신 말해드릴 수 있어요.';
      sendEcho(true);
    } else if (pmsg.raw.length > 0) {
      if (message.indexOf('http') === 0) {
        (message.indexOf('https') === 0 ? https : http).get(message, (response) => {
          let isFirstEvent = false;
          response.on('readable', () => {
            if (!isFirstEvent) {
              isFirstEvent = true;
              response.destroy();
              if (response.headers['content-type'].indexOf('image') > -1) {
                echo = lndr.createEmbed();
                echo.setImage(message);
              } else {
                echo = message;
              }
              sendEcho();
            }
          });
        });
      } else {
        echo = message;
        sendEcho();
      }
    }
  },
};
