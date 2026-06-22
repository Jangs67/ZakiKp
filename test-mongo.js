const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');
const mongoose = require('mongoose');
const uri = 'mongodb+srv://zaki:zakiganteng@datasekolah.0prayw8.mongodb.net/?appName=Datasekolah';
console.log('connecting...');
mongoose.connect(uri,{connectTimeoutMS:10000,serverSelectionTimeoutMS:10000}).then(()=>{console.log('connected'); return mongoose.disconnect();}).catch(err=>{ console.error('connect error', err); process.exit(1); });
