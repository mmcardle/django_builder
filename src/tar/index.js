import Tar from 'tar-js'

class Tarball {

  constructor () {
    this.tarfile = new Tar()
  }

  uInt8ToString (buf) {
    var i, length, out = ''
    for (i = 0, length = buf.length; i < length; i += 1) {
        out += String.fromCharCode(buf[i])
    }
    return out
  }

  append (file_name, content, mode='644') {
    const opts = {
      mode: parseInt(mode, 8) & 0xfff
    }
    this.tarfile.append(file_name, content, opts)
  }

  get_url () {
    var base64 = btoa(this.uInt8ToString(this.tarfile.out));
    return "data:application/tar;base64," + base64;
  }
}

export default Tarball
