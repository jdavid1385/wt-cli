var Bluebird = require('bluebird');
var Boom = require('boom');
var Bunyan = require('bunyan');
var Cli = require('nested-yargs');
var Colors = require('colors');
var PrettyStream = require('bunyan-prettystream');
var Webtask = require('../');
var Fs = require('fs');
var Path = require('path');
var _ = require('lodash');


module.exports = Cli.createCommand('logs', 'Streaming, real-time logs', {
    params: '[container]',
    options: {
        raw: {
            alias: 'r',
            description: 'do not pretty print',
            type: 'boolean',
        },
        all: {
            alias: 'a',
            description: 'show cluster logs (deprecated, has no effect)',
            type: 'boolean',
        },
        verbose: {
            alias: 'v',
            description: 'show verbose logs',
            type: 'boolean',
        },
        profile: {
            alias: 'p',
            description: 'name of the webtask profile to use',
            'default': 'default',
            type: 'string',
        },
        browser: {
            alias: 'b',
            description: 'create URL to see logs in a browser',
            type: 'boolean',
        },
    },
    handler: handleStream,
});

  
function handleStream (argv) {
    var prettyStdOut = new PrettyStream({ mode: 'short' });
    var logger = Bunyan.createLogger({
          name: 'wt',
          streams: [{
              level: 'debug',
              type: 'raw',
              stream: prettyStdOut
          }]
    });    

    prettyStdOut.pipe(process.stdout);
    
    var container = argv.params.container;
    
    if (container) {
        argv.container = container;
    }
    
    var config = Webtask.configFile();
    
    config.load()
        .then(function (profiles) {
            if (_.isEmpty(profiles)) {
                throw new Error('You must create a profile to begin using '
                    + 'this tool: `wt init`.');
            }
            
            return config.getProfile(argv.profile);
        })
        .then(function (profile) {

            if (argv.browser) {
                var options = {
                    container: (argv.container || profile.container),
                    code: Fs.readFileSync(Path.resolve(__dirname, 'browser_logs.js'), { encoding: 'utf8' }),
                    exp: Math.floor(Date.now() / 1000) + 7200, // 2h
                    param: {
                        container: (argv.container || profile.container),
                        logging_url: profile.url + '/api/logs/tenant/' 
                            + (argv.container || profile.container)
                    }
                };
                return profile.createToken(options)
                    .then(function (token) {
                        console.log(profile.url + '/api/run/'
                                + (argv.container || profile.container)
                                + '?key=' + token);
                        process.exit(0);
                    });
            }
            else {
                return Bluebird.all([
                    profile,
                    profile.createLogStream(argv)
                ]);
            }
        })
        .spread(function (profile, stream) {
            logger.info({ container: argv.container || profile.container },
                'connected to streaming logs');

            setTimeout(function () {
                logger.warn('reached maximum connection time of 30min, '
                    +'disconnecting');
                process.exit(1);
            }, 30 * 60 * 1000).unref();
            
            stream.on('data', function (event) {
                if (event.type === 'data') {
                    try {
                        var data = JSON.parse(event.data);
                    } catch (__) { return; }
                    
                    if (!data)
                        return;
                    
                    if (argv.raw) console.log(data.msg);
                    else if (typeof data === 'string') logger.info(data);
                    else if (argv.verbose) logger.info(data, data.msg);
                    else logger.info(data.msg);
                }
            });
        })
        .catch(logError);
}

function logError (e) {
    console.error(e);
    console.log(e.message.red);
    if (e.trace) console.log(e.trace);
    process.exit(1);
}
