const ngrok = require('@ngrok/ngrok');

async function test() {
  console.log('Testing Ngrok SDK Connection...');
  try {
    const listener = await ngrok.connect({
      addr: 3000,
      authtoken: '3Hr56NkQmK7fScedP090Ry6c8ll_78W6QjADbCB92cWhD8ZpT',
      domain: 'kabob-suspect-mandate.ngrok-free.dev'
    });
    console.log('✅ Ngrok connected successfully! URL:', listener.url());
  } catch (err) {
    console.error('❌ Ngrok Connection Error:', err);
  }
}

test();
