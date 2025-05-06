import { cmd } from '../../data/handler.js';

cmd.add({
  name: ['listidgc'],
  type: "Push Kontak",
  async run({ m, conn }) {
    const args = m.args.join(" ");
    try {
         const page = parseInt(args) || 1 // args[0] adalah command-nya, args[1] adalah angka halaman

         const groupList = async () =>
            Object.entries(await conn.groupFetchAllParticipating()).map(entry => entry[1])
         const groups = await groupList()

         const pageSize = 10
         const totalPages = Math.ceil(groups.length / pageSize)

         if (page < 1 || page > totalPages) {
            return conn.sendMessage(m.from, {
               text: `Halaman tidak valid. Masukkan angka antara 1 hingga ${totalPages}.`
            })
         }

         const formatDate = timestamp => {
            return new Intl.DateTimeFormat('id-ID', {
               day: '2-digit',
               month: '2-digit',
               year: '2-digit',
               hour: '2-digit',
               minute: '2-digit',
               second: '2-digit',
               timeZone: 'Asia/Jakarta'
            }).format(timestamp)
         }

         const startIndex = (page - 1) * pageSize
         const selectedGroups = groups.slice(startIndex, startIndex + pageSize)

         let msg = `🤖 : ${groups.length} group\n\n`

         for (const x of selectedGroups) {
            msg += `- *${x.subject}*\n`
            msg += `  ↳ ID Grup: ${x.id}\n`
            msg += `  ↳ Anggota: ${x.participants.length}\n`
            msg += `  ↳ Dibuat: ${formatDate(x.creation * 1000)}\n\n`            
         }
            msg += `page ${page}/${totalPages}`
            msg += `\nnext page *groups <page>*\nexmp : *groups 2*`
            
         await conn.sendMessage(m.from, { text: msg.trim() }, { quoted: m})
      } catch (e) {
         console.error('Error listgroups:', e)
         conn.sendMessage(m.from, {
            text: `Terjadi kesalahan:\n${e?.message || JSON.stringify(e, null, 2)}`
         })
      }
  }
});

export default cmd;