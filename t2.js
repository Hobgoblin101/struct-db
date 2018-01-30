let Store = require('./component/struct.js');

let s = new Store('./data/test.dat');

s.define('vector2', {
  x: 'double',
  y: 'float'
});
s.define('_main_', {
  locations: 'vector2[10]'
});
s.compile('_main_');
s.init();





s.read('locations.0').then((res)=>{
  console.log('res', res);
})
.catch((e)=>{
  console.error(e);
})