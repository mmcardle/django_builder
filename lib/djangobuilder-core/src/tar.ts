import Tar from 'tar-js'

class Tarball {

  tarfile: Tar;

  constructor () {
    this.tarfile = new Tar()
  }

  uInt8ToString (buf: Uint8Array) {
    let length  = 0;
    let i = 0;
    let out = "";
    for (i = 0, length = buf.length; i < length; i += 1) {
        out += String.fromCharCode(buf[i])
    }
    return out
  }

  append (file_name: string, content: string, mode='644') {
    const opts = {
      mode: parseInt(mode, 8) & 0xfff
    }
    this.tarfile.append(file_name, content, opts)
  }

  get_content () {
    return this.tarfile.out;
  }

  get_url () {
    const base64 = btoa(this.uInt8ToString(this.tarfile.out));
    return "data:application/tar;base64," + base64;
  }
}

export default Tarball
