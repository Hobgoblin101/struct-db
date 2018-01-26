class Attribute{
  constructor(type){
    this.type = type;

    switch (type){
      case 'boolean':
        this.size = 1;
        break;
      case 'float':
        this.size = 4;
        break;
      case 'double':
        this.size = 8;
        break;
        case 'int8':
        this.size = 1;
        break;
      case 'int16':
        this.size = 2;
        break;
      case 'int32':
        this.size = 4;
        break;
      case 'int64':
        this.size = 8;
        break;
      case 'uint8':
        this.size = 1;
        break;
      case 'uint16':
        this.size = 2;
        break;
      case 'uint32':
        this.size = 4;
        break;
      case 'uint64':
        this.size = 6;
        break;
    }
  }
}

class Structure{
  constructor(parent, name, info){
    this.type = name;
    this.parent = parent;
    this.attribute = [];
    this.names = [];
    this.size = null;

    this.info = info;
  }

  build(){
    this.size = 0;
    let i=0;

    for (let key in this.info){
      for (let struct of this.parent.structs){
        if (struct.type == this.info[key]){
          if (struct.size === null){
            struct.build();
          }

          this.size += struct.size;
          this.attribute[i] = struct;
          this.names[i] = key;
          break;
        }
      }

      i++;
    }

    delete this.info;
  }
}

let baseStructs = [
  new Attribute('boolean'),
  new Attribute('float'),
  new Attribute('double'),
  new Attribute('int8'),
  new Attribute('int16'),
  new Attribute('int32'),
  new Attribute('int64'),
  new Attribute('uint8'),
  new Attribute('uint16'),
  new Attribute('uint32'),
  new Attribute('string'),
  new Attribute('blob')
];

class Store{
  constructor(){
    this.structs = [].concat(baseStructs);
  }

  build(){
    this.structs[baseStructs.length].build();
  }

  struct(name, info){
    this.structs.push(new Structure(this, name, info));

    return this;
  }
}

module.exports = Store;