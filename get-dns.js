const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
(async () => {
  try {
    const srv = await dns.promises.resolveSrv('_mongodb._tcp.datasekolah.0prayw8.mongodb.net');
    console.log('SRV', srv);
  } catch (e) {
    console.error('SRV ERROR', e);
  }
  try {
    const txt = await dns.promises.resolveTxt('datasekolah.0prayw8.mongodb.net');
    console.log('TXT', txt);
  } catch (e) {
    console.error('TXT ERROR', e);
  }
})();
