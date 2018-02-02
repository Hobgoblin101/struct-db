let Store = require('./component/struct.js');

let s = new Store('./data/test.dat');

s.define('vector2', {
  x: 'double',
  y: 'float'
});
s.define('_main_', {
  location: 'vector2[~2]'
});
s.compile('_main_');
s.init();

// s.struct[13].extend(0);
s.set('location.3.x', 0.25).then((e)=>{
  console.log('size', s.size);

  s.get('location.3.x')
    .then((data)=>{
      console.log(data);
    })
});