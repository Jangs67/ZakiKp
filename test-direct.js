const mongoose = require('mongoose');
const uri = "mongodb://zaki:zakiganteng@ac-tekdmrg-shard-00-00.0prayw8.mongodb.net:27017,ac-tekdmrg-shard-00-01.0prayw8.mongodb.net:27017,ac-tekdmrg-shard-00-02.0prayw8.mongodb.net:27017/?tls=true&authSource=admin&appName=Datasekolah";
console.log('connecting direct...');
mongoose.connect(uri,{connectTimeoutMS:10000,serverSelectionTimeoutMS:10000}).then(()=>{console.log('connected direct'); return mongoose.disconnect();}).catch(err=>{ console.error('connect direct error', err); process.exit(1); });
