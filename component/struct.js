'use strict';
const fs = require('fs');

/**
 * Remove trailing white space
 */
Buffer.prototype.strip = function(){
  let i=this.length-1;

  while (this[i] === 0){
    i--;
  }

  return this.slice(0,i+1);
}
/**
 * Replace a section of buffer with another buffer
 * @param {Buffer} buff 
 * @param {Number=} offset 
 * @param {Number=} length 
 */
Buffer.prototype.replace = function(buff, offset=0, length=NaN){
  if (isNaN(length)){
    length = buff.length;
  }

  for (let i=0; i<length; i++){
    this[i+offset] = buff[i];
  }

  return this;
}
/**
 * Segment the buffer into parts
 * @param {number} interval 
 */
Buffer.prototype.split = function(interval){
  let len = Math.ceil(this.length/interval);
  let arr = new Array(len);
  let ptr = 0;

  for (let i=0; i<len; i++){
    let nx = ptr + interval;
    arr.push(this.slice(ptr, nx));

    ptr = nx;
  }

  return arr;
}





class Attribute{
  constructor(parent, type){
    this.parent = parent;
    this.type = type;
    this.size = 0;

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
      case 'int':
        this.size = 6;
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
      case 'uint':
        this.size = 6;
        break;
    }
  }

  /**
   * Encode the data to a buffer according to Attribute's type
   * @param {any} data 
   */
  async encode(data){
    let buff = new Buffer(this.size);
  
    switch(this.type){
      case 'double':
        buff.writeDoubleLE(data, 0, this.size);
        break;
      case 'float':
        buff.writeFloatLE(data, 0, this.size);
        break;
      case 'boolean':
        if (data === true){
          buff.write(255, 0, 1);
        }else{
          buff.write(0, 0, 1);
        }
        break;
      case 'int8':
        buff.writeInt8(data, 0, this.size);
        break;
      case 'int16':
        buff.writeInt16LE(data, 0, this.size);
        break;
      case 'int32':
        buff.writeInt32LE(data, 0, this.size);
        break;
      case 'int64':
        buff.writeIntLE(data, 0, this.size);
        break;
      case 'uint8':
        buff.writeUInt8(data, 0, this.size);
        break;
      case 'uint16':
        buff.writeUInt16LE(data, 0, this.size);
        break;
      case 'uint32':
        buff.writeUInt32LE(data, 0, this.size);
        break;
      case 'uint':
        buff.writeUIntLE(data, 0, this.size);
        break;
    }
  
    return buff;
  }

  /**
   * Decode the buffer to the set type
   * @param {Buffer} buff 
   */
  async decode(buff){
    let data;
  
    switch(this.type){
      case 'double':
        data = buff.readDoubleLE(0, this.size);
        break;
      case 'float':
        data = buff.readFloatLE(0, this.size);
        break;
      case 'boolean':
        if (buff[0] === 0){
          data = false;
        }else{
          data = true;
        }
        break;
      case 'int8':
        data = buff.readInt8(0, this.size);
        break;
      case 'int16':
        data = buff.readInt16LE(0, this.size);
        break;
      case 'int32':
        data = buff.readInt32LE(0, this.size);
        break;
      case 'int64':
        data = buff.readIntLE(0, this.size);
        break;
      case 'uint8':
        data = buff.readUInt8(0, this.size);
        break;
      case 'uint16':
        data = buff.readUInt16LE(0, this.size);
        break;
      case 'uint32':
        data = buff.readUInt32LE(0, this.size);
        break;
      case 'uint64':
        data = buff.readUIntLE(0, this.size);
        break;
    }
  
    return data;
  }

  /**
   * 
   * @param {number[]} path 
   * @param {number} offset 
   * @param {number} progress 
   */
  async trace(path, offset=0){
    if (path.length != 0){
      throw new ReferenceError(`Invalid path ${path.join('.')}`);
    }

    return offset;
  }

  /**
   * Get the buffer content
   * @param {number} ptr 
   */
  read(ptr){
    return new Promise((res)=>{
      let s = fs.createReadStream(this.parent.path, {
        start: ptr,
        end: ptr+this.size,
        highWaterMark: this.size
      });
      s.on('data', (c)=>{
        res(c);
        
        s.close();
      });
    });
  }

  /**
   * Write the buffer content
   * @param {number} ptr 
   * @param {any} data 
   */
  write(ptr, data){
    return new Promise(async (res)=>{
      let s = fs.createWriteStream(this.parent.path, {
        start: ptr,
        flags: 'r+'
      })
      s.on('close', res);
      s.end(await this.encode(data));
    });
  }
}





class AttrArray{
  constructor(parent, struct, length, fixed){
    this.parent = parent;
    this.struct = struct;
    this.length = length;
    this.fixed = fixed;

    this.size = this.struct.size * this.length;
    if (!fixed){ // Add trailing chain link
      this.size += 8;
    }
  }

  /**
   * Decode the given data + any trailing data
   * @param {Buffer} buffer 
   * @returns {Promise}
   */
  decode(buffer){
    return new Promise(async (resolve, reject)=>{
      let res = [];
      let i=0;

      //Decode the given data
      let s = 0;
      let e = this.struct.length;
      for (i=0; i<this.length; i++){
        res.push(await this.struct.decode(buffer.slice(s, e)));

        s = e;
        e += this.struct.length;
      }

      // If there is more data then read that too
      if (!this.fixed){
        let offset = buffer.slice(-6).readUIntLE();

        let loop = function(){
          i=0;

          let stream = fs.createReadStream(this.parent, {
            start: offset,
            end: this.size,
            highWaterMark: this.struct.size
          })
          stream.on('data', async(chunk)=>{
            if (i > this.length){
              offset = chunk.slice(0, 6).readUIntLE();

              if (offset > 0){
                loop();
              }else{
                resolve(res);
              }

              stream.close();
              return;
            }

            res.push(await this.struct.decode(chunk));
            i++;
          })
        }
        loop();
      }else{ // Otherwise just return the current results
        resolve(res);
        return;
      }
    })
  }

  /**
   * Find the byte index for the requrested path
   * @param {number[]} path 
   * @param {number} offset 
   */
  trace(path, offset=0, writing=false){
    return new Promise(async (res)=>{
      if (this.fixed){
        offset += this.struct.size * path[0];

        if (path.length === 0){
          res(path.slice(1), offset);
          return;
        }

        res(await this.struct.trace(path.slice(1), offset, writing));
        return;
      }

      let i = path[0];
      let loop = async ()=>{
        if (i < this.length){
          offset += this.struct.size * i;

          if (path.length === 0){
            res(offset);
            return;
          }

          res(await this.struct.trace(path.slice(1), offset, writing));
          return;
        }

        // Travel to the next chunk
        i -= this.length;
        let ptr = this.struct.size*this.length;
        let s = fs.createReadStream(this.parent.path, {
          start: ptr,
          end: ptr + 8,
          highWaterMark: 8
        }).on('data', (b)=>{
          let nx = b.readUIntLE(0, 8);
          s.close(); // Close the filesystem handle

          if (nx === 0){ //Invalid Pointer
            if (!writing){
              throw new ReferenceError(`Index out of range`);
              return;
            }

            // Since the trace is for a write cycle, expand the array
            this.extend(offset, (nx)=>{
              offset = nx;
              loop();
            });

            return;
          }

          offset = nx;
          loop();
        });
      };
      loop();
    });
  }

  /**
   * Read the buffer of the 
   * @param {number} ptr 
   */
  read(ptr){
    return new Promise((res)=>{
      if (this.fixed){
        let s = fs.createReadStream(this.parent.path, {
          start: ptr,
          end: ptr+this.size-8,
          highWaterMark: this.size-8
        });
        s.on('data', (c)=>{
          res(c);
          s.close();
        });

        return;
      }

      let data;
      let loop = ()=>{
        let s = fs.createReadStream(this.parent.path, {
          start: ptr,
          end: ptr+this.size,
          highWaterMark: this.size
        });
        s.on('data', (c)=>{
          ptr = c.slice(-8).readUIntLE(0,8);
          data.concat([data, c.slice(0, -8)]);

          if (ptr == 0){
            res(data);
          }else{
            loop();
          }

          s.close();
        })
      }
    })
  }

  /**
   * Write the data to store
   * @param {Number} ptr 
   * @param {any[]} data 
   */
  write(ptr, data){
    return new Promise((res)=>{
 
      if (!this.fixed){ // Just write the single chain
        let s = fs.createWriteStream(this.parent.path, {
          start: ptr,
          end: ptr+this.size,
          flags: 'r+'
        })
        s.on('close', res);
        s.end(data.slice(0, this.size));
        
        return;
      }

      let interval = this.length*this.struct.size;
      data = this.encode(data).split(interval);
      let loop = (i)=>{
        let t = ptr + interval;

        // Write the chain data
        let s = fs.createWriteStream(this.parent.path, {
          start: ptr,
          flags: 'r+',
        });
        s.on('close', ()=>{

          // Read the trailing pointer
          let s = fs.createWriteStream(this.parent.path, {
            start: t,
            end: t+8,
            flags: 'r+',
            highWaterMark: 8
          }).on('data', (c)=>{
            s.close(); // Close the read handle

            // Decode the trailing pointer
            ptr = c.readUIntLE(0, 8);
  
            if (i+1 === data.length){ // If there is no more data
              res();
              return;
            }
  
            if (ptr < 1){ //Not another chain link, but more data
              self.extend().then((nx)=>{ // Extend the chain
                ptr = nx;
                loop(i+1);
              });

              return;
            }

            loop(i+1);
          });

        });
        s.end(data[i]);
      }

      // Initilize the loop
      loop(0);
    });
  }

  /**
   * Create a new chain for the array
   * @param {Number} ptr 
   */
  extend(ptr){
    return new Promise((res)=>{
      if (this.fixed){
        throw new TypeError(`Cannot extend a fixed`);
      }

      let nx = this.parent.size;
      this.parent.size += this.size;

      // Write a new blank chain
      fs.appendFile(this.parent.path, Buffer(this.size), (e)=>{
        if (e){
          throw e;
        }

        // Make the reference
        ptr += this.length * this.struct.size;
        let b = Buffer(8);
        b.writeUIntLE(nx, 0, 8);

        // Write the refernces
        let s = fs.createWriteStream(this.parent.path, {
          start: ptr,
          flags: 'r+'
        });
        s.on('close', ()=>{
          res(nx);
        });
        s.end(b);
      });
    });
  }
}





class Struct{
  /**
   * Data structure class
   * @param {Store} parent 
   * @param {string} name 
   * @param {any} info 
   */
  constructor(parent, name, info){
    this.parent = parent;
    this.type = name;
    this.size = 0;

    this.attr = [];
    this.name = [];

    //Build
    let i=0;
    for (let key in info){
      let type = info[key];
      let isArray = false;
      let fixed = false;
      let length = 0;

      // Type is array, and get it's info
      if (type[type.length-1] == ']'){
        let i = info[key].indexOf('[');

        length = info[key].slice(i+1, -1);
        type = info[key].slice(0, i);
        isArray = true;

        // Check if the array is of unfixed size, and if so what sizing
        if (length.length == 0){        // Use Default chain size
          length = 50;
          fixed = false;
        }else if (length[0] === '~'){   // Use custom chain size
          fixed = false;
          length = parseInt(length.slice(1));
        }else{                          // Use fixed array length
          fixed = true;
          length = parseInt(length);
        }

        // Check that the given length is valid
        if (isNaN(length)){
          throw new TypeError(`Invalid Array Length ${info}`);
        }
      }

      for (let struct of this.parent.struct){
        if(struct.type == type){
          if (isArray){
            let j = this.parent.struct.length;
            this.parent.struct[j] = new AttrArray(this.parent, struct, length, fixed);

            this.attr[i] = this.parent.struct[j];
            this.name[i] = key;

            this.size += this.attr[i].size;
            break;
          }

          this.size += struct.size;
          this.attr[i] = struct;
          this.name[i] = key;
          break;
        }
      }

      if (!this.name[i]){
        throw new TypeError(`Cannot find type ${type}`);
      }

      i++;
    }
  }

  /**
   * Get the index of the item within the file
   * @param {number[]} path 
   * @param {number} offset 
   */
  async trace(path, offset=0, writing=false){
    if (path.length == 0){
      return offset;
    }

    for (let j=0; j<path[0]; j++){
      if (!this.attr[j]){
        throw new ReferenceError(`${this.type}: Missing attribute ${j}.\n\tRemaining path: ${path},\n\toffset: ${offset}`);
      }

      offset += this.attr[j].size;
    }

    return await this.attr[path[0]].trace(path.slice(1), offset, writing);
  }

  /**
   * Get the object
   * @param {number} ptr 
   * @returns {Promise}
   */
  read(ptr){
    return new Promise((res)=>{
      let s = fs.createReadStream(this.parent.path, {
        start: ptr,
        end: ptr+this.size,
        highWaterMark: this.size
      });
      s.on('data', function(c){
        if (c.length < this.size){
          throw new ReferenceError(`Read failed, invalid index?\n\t${ptr}-${ptr+this.size}`);
          s.close();
          return;
        }

        res(c);
        s.close();
      });
    })
  }

  /**
   * Write the object
   * @param {number} ptr 
   * @param {number} data 
   */
  write(ptr, data){
    return new Promise(async (res)=>{
      let w = 0;

      let fin = ()=>{
        w -= 1;

        // If there are no attributes currently being written, then it must be the end
        if (w === 0){
          res();
        }
      }

      for (let i=0; i<this.name.length; i++){
        if (data[name]){
          this.attr[name].write( ptr, await this.attr[name].encode(data[name]) ).then(fin);
          w += 1;
        }

        ptr += this.attr[name].size;
      }
    });
  }
}





class Store{
  constructor(path){
    this.path = path;
    this.struct = [
      new Attribute(this,'boolean'),
      new Attribute(this,'float'),
      new Attribute(this,'double'),
      new Attribute(this,'int8'),
      new Attribute(this,'int16'),
      new Attribute(this,'int32'),
      new Attribute(this,'int64'),
      new Attribute(this,'uint8'),
      new Attribute(this,'uint16'),
      new Attribute(this,'uint32'),
      new Attribute(this,'string'),
      new Attribute(this,'blob')
    ];

    this.root = null;
    this.size = 0;
  }

  /**
   * Create a new structure for this store
   * @param {string} name 
   * @param {any} info 
   */
  define(name, info){
    this.struct.push(new Struct(this, name, info));
  }

  /**
   * Setup the store for the root
   * @param {String} root 
   */
  compile(root){

    // Make sure the root is valid
    let i=0;
    for (let struct of this.struct){
      if (struct.type == root){
        if (struct.size <= 0){
          break;
        }

        this.root = struct;
        break;
      }

      i++;
    }
    if (!this.root){
      throw new TypeError(`Invalid root structure name (${root})`);
    }
    this.size = this.root.size;

    fs.writeFileSync(this.path, Buffer(this.size));
    Object.preventExtensions(this);
    Object.freeze(this.struct);
  }

  /**
   * Create a blank file
   * @returns {void}
   */
  init(){
    fs.writeFileSync(this.path, Buffer(this.size));
    return this;
  }

  /**
   * Replace the string path with the relative index for the attribute at each point
   * @param {string} path 
   */
  compilePath(path){
    let origin = path;
    path = path.split('.');
    var ref = this.root;

    loop1:
    for (let i=0; i<path.length; i++){
      // Array
      if (ref.struct){
        path[i] = parseInt(path[i]);

        if (ref.fixed && ref.length <= path[i]){
          throw new ReferenceError(`Invalid Path, index out of range ${origin}, failed at ${i}`);
        }

        ref = ref.struct;
        continue;
      }

      // Check if it is a valid structure
      if (!ref.attr){
        throw new ReferenceError(`Invalid Path ${origin}, failed at ${i}\n\t`, ref);
      }

      // Find the id of the element
      loop2:
      for (let j=0; j<ref.name.length; j++){
        if (ref.name[j] == path[i]){
          ref = ref.attr[j];
          path[i] = j;
          continue loop1;
        }
      }

      throw new ReferenceError(`Invalid path ${origin}, failed at ${i}`)
    }

    return path;
  }

  /**
   * Get a pointer to a specific attribute
   * @param {string} path 
   * @returns {Promise}
   */
  async trace(path, writing=false){
    if (!Array.isArray(path)){
      path = this.compilePath(path);
    }

    return await this.root.trace(path, 0, writing);
  }

  /**
   * Get the object's data
   * @param {String} path 
   * @param {Struct=} ref 
   */
  async get(path, ref){
    if (!Array.isArray(path)){
      path = this.compilePath(path);
    }

    let ptr = await this.trace(path);
    if (!ref){
      ref = this.root;
      for (let i=0; i<path.length; i++){
        if (ref.struct){
          ref = ref.struct;
          continue;
        }

        ref = ref.attr[path[i]];
      }
    }

    return await ref.decode( await ref.read(ptr) );
  }

  /**
   * Write the object's data
   * @param {String} path 
   * @param {Any} data to be written
   * @param {Struct=} ref 
   */
  async set(path, data, ref){
    if (!Array.isArray(path)){
      path = this.compilePath(path);
    }

    if (!ref){
      ref = this.root;
      for (let i=0; i<path.length; i++){
        if (ref.struct){
          ref = ref.struct;
          continue;
        }

        ref = ref.attr[path[i]];
      }
    }
    let ptr = await this.trace(path, true);

    return await ref.write(ptr, await ref.encode(data));
  }
}





module.exports = Store;