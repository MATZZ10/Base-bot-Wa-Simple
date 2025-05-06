const config = {
  botname: "Kishin Bot",
  OWNER: JSON.stringify(['62895406828812']),
  owner: ['62895406828812@s.whatsapp.net', "6289508186460@s.whatsapp.net"],
  pack: "Matzz",
  author: "MatzzDev",
  prefix: {
    multiPrefix: true,
    singlePrefix: "/",
    noPrefix: false,
  },
  api: '-',
  merchantId: '-',
  codeqr: '-',
  biayaAdmin: 10,
  energySystem: false, // kalau false, energy system mati / Sementara Jangan Dihidupkan Dlu soalnya lagi di perbaiki 
  maxEnergy: 100, // default 100%
  energyDrainRate: 5, // tiap aksi misal -5%
};

export default config 