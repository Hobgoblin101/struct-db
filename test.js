let Store = require('./component/store.js');

let s = new Store('./data/test');

console.log(s.build);

s.define('vector2', {
  x: 'float',
  y: 'float'
});
s.define('_main_', {
  locations: 'vector2[10]'
});
s.build('_main_');

// s.get(['locations', 4])
//   .then((res)=>{
//     console.log(res);
//   })
//   .catch((e)=>{
//     console.error(e);
//   })