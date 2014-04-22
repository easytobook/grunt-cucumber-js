module.exports = function (grunt) {

  var util = require('util');

  // The Cucumber Task
  grunt.registerMultiTask('cucumberjs', 'Runs cucumber.js', function () {
    // Make this task async
    var done = this.async();

    // hijack console.info to capture reporter output
    var dest = this.data.dest;
    var output = [];
    var consoleInfo = console.info;

    if (dest) {
      console.info = function() {
        consoleInfo.apply(console, arguments);
        output.push(util.format.apply(util, arguments));
      };
    }

    // Load all the options
    var options = this.options();

    var steps = options.steps;
    var tags = options.tags;
    var format = options.format;
    var environment = options.environment;
    var modulePath = options.modulePath;

    grunt.verbose.writeflags(options, 'Options');

    var uncaughtExceptionHandlers = process.listeners('uncaughtException');
    process.removeAllListeners('uncaughtException');

    var restore = function() {
      uncaughtExceptionHandlers.forEach(
      process.on.bind(process, 'uncaughtException'));
      if (dest) {
        console.info = consoleInfo;
        grunt.file.write(dest, output.join('\n'));
      }
    };

    var callback = function(succeeded) {
      var exitFunction = function() {
        restore();
        done(succeeded);
      };

      // --- exit after waiting for all pending output ---
      var waitingIO = false;
      process.stdout.on('drain', function() {
        if (waitingIO) {
          // the kernel buffer is now empty
          exitFunction();
        }
      });
      if (process.stdout.write("")) {
        // no buffer left, exit now:
        exitFunction();
      } else {
        // write() returned false, kernel buffer is not empty yet...
        waitingIO = true;
      }
    };

    var files = this.filesSrc;


    var execOptions = ['node', 'node_modules/.bin/cucumber-js'];

    var _ = grunt.util._;
    if (! _.isEmpty(files)) {
      execOptions = execOptions.concat(files);
    }

    if (! _.isEmpty(steps)) {
      execOptions.push('-r');
      execOptions.push(steps);
    }

    if (! _.isEmpty(tags)) {
      execOptions.push('-t');
      execOptions.push(tags);
    }

    if (! _.isEmpty(format)) {
      execOptions.push('-f');
      execOptions.push(format);
    }

    if (! _.isEmpty(tags)) {
      execOptions.push('-e');
      execOptions.push(environment);
    }

    var cucumberPath = 'cucumber';
    if (! _.isEmpty(modulePath)) {
      cucumberPath = modulePath;
    }

    grunt.verbose.writeln('Exec Options: ' + execOptions.join(' '));
    var cucumber = require(cucumberPath);
    cucumber.Cli(execOptions).run(callback);

  });
};
