import { cmd } from '../../data/handler.js';

cmd.add({
  name: ['ping'],
  type: 'Advance',
  usage: '.ping',
  energy: true,
  async run({ m }) {
    m.reply('Pong! i');
  }
});

export default cmd;