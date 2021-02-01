const log_level_none = 0;
const log_level_error = 1;
const log_level_trace = 2;

const log_level = log_level_error;

function logError(message) {
    if (log_level >= log_level_error) {
        console.log('# ' + message);
    }
}

function logTrace(message) {
    if (log_level >= log_level_trace) {
        console.log('# ' + message);
    }
}