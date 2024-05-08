const winston = require('winston');
const fs = require('fs');
const yaml = require('js-yaml');

// Load YAML logging configuration
const logConfigYAML = fs.readFileSync('./config/log_conf.yml', 'utf8');
const logConfig = yaml.load(logConfigYAML);

// Create the loggers defined in the YAML
const loggers = {};

for (const [loggerName, loggerOpts] of Object.entries(logConfig.loggers)) {
  const transports = [];

  loggerOpts.handlers.forEach(handlerName => {
    const handlerOpts = logConfig.handlers[handlerName];
    let format;
    if (handlerOpts.formatter === 'detailed') {
      format = winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.printf(info => `${info.timestamp} - ${info.level.toUpperCase()} - ${info.message}`)
      );
    } else {
      format = handlerOpts.format === 'simple' ? winston.format.simple() : winston.format.json();
    }

    if (handlerOpts.type === 'console') {
      transports.push(new winston.transports.Console({
        level: handlerOpts.level,
        format: format
      }));
    } else if (handlerOpts.type === 'file') {
      transports.push(new winston.transports.File({
        level: handlerOpts.level,
        filename: handlerOpts.filename,
        format: format
      }));
    }
  });

  loggers[loggerName] = winston.createLogger({
    level: loggerOpts.level,
    transports: transports
  });
}

module.exports = loggers['basicLogger'];
