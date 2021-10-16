const path = require('path');

//-----------------------------------------------------------------------------
// exported functions
//-----------------------------------------------------------------------------

class Song {

    constructor() {
        this.song_ = null;
        this.song_start_ = null;

        this.song_list_ = [];
    }

    setSong(song) {
        // Check that song will not be reported again
        if (this.song_list_.includes(song)) {
            return;
        }

        // Add song to buffer of last played list
        this.song_list_.push(song);
        if (this.song_list_.length > 25) {
            this.song_list_.splice(0, 1);
        }

        // Set current song title
        this.song_ = song;
        this.song_start_ = Date.now() / 1000;
    }

    getSong() {
        // Don't output song if title wasn't set in last 15 minutes
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
