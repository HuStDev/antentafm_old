class Logger {

    constructor() {
        this.log_level_ = log_level_values.no;
    }

    setLogLevel(level) {
        if ((level >= log_level_values.no) && (level <= log_level_values.trace)) {
            this.log_level_ = level;
        }
    }

    logError(message) {
        if (this.log_level_ >= log_level_values.error) {
            console.log(message);
        }
    }

    logTrace(message) {
        if (this.log_level_ >= log_level_values.trace) {
            console.log(message);
        }
    }
}


class Singleton {

  constructor() {
      if (!Singleton.instance) {
          Singleton.instance = new Logger();
      }
  }

  getInstance() {
      return Singleton.instance;
  }

}


const log_level_values = {"no":0, "error":1, "trace":2}
Object.freeze(log_level_values)


module.exports = Singleton;
module.exports.log_level = log_level_values;