const path = require('path');

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------

class Song {

    constructor() {
        this.song_ = null;
        this.song_start_ = null;
    }

    setSong(song) {
        this.song_ = song;
        this.song_start_ = Date.now() / 1000;
    }

    getSong() {
        const now = Date.now() / 1000;
        if ((now - this.song_start_) > 15*60) {
            this.song_ = null;
        }

        return this.song_;
    }
}


class Singleton {

  constructor() {
      if (!Singleton.instance) {
        Singleton.instance = new Song();
      }
  }

  getInstance() {
      return Singleton.instance;
  }

}

module.exports = Singleton;
