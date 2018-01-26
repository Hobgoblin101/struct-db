let Store = require('./component/struct.js');

let s = new Store();

s.struct('_main_', {
  id: 'int32',
  age: 'int8'
});
s.build();

console.log(s.structs[12]);