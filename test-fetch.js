import https from 'https';

const url = 'https://corsproxy.io/?' + encodeURIComponent('https://app.revendamais.com.br/application/index.php/apiGeneratorXml/companyFeed/id/11486/type/sitedaloja/hash/963b5853f27472297b42c3630a86fa26.xml');

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }
}, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
    if (data.length > 5000) {
      console.log(data.substring(0, 5000));
      process.exit(0);
    }
  });
  res.on('end', () => {
    console.log(data.substring(0, 5000));
  });
}).on('error', (err) => {
  console.error(err);
});
