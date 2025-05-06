// import cmd from '../../data/handler.js';
// import util from 'util';
// import { createRequire } from 'module';

// const dynamicImport = async (modulePath) => {
  // const require = createRequire(import.meta.url);
  // return await require(modulePath);
// };

// const inspect = async (obj) => {
  // if (typeof obj === 'object' || typeof obj === 'function') {
    // return util.inspect(obj, { depth: 0 });
  // }
  // return String(obj);
// };

// cmd.add({
  // async call({ m }) {
    // if (m.text && m.text.includes('ping')) {
      // await m.reply('Pong!');
    // }
    
    // if (m.body && m.body.startsWith('=>')) {
      // if (!m.isOwner) return;
        // try {
          // const evaled = await eval(m.body.slice(2).trim());
          // const result = await inspect(evaled);
          // await m.reply(result);
        // } catch (err) {
          // await m.reply(String(err));
      // }
    // } else if (m.body && m.body.startsWith('>')) {
      // if (!m.isOwner) return;
        // try {
          // const evaluate = await eval(`(async () => { ${m.body.slice(1).trim()} })()`);
          // const result = await inspect(evaluate);
          // await m.reply(result);
        // } catch (err) {
          // await m.reply(String(err));
        // }
    // } else 
  // }
// });

// export default cmd;