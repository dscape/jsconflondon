var ircb = require('ircb')
  , openSockets = {}
  , irc;

var cfg =
  { channel : '#londonjsconf'
  , host    : 'irc.freenode.org'
  , nick    : 'jsbot'
  , name    : 'jsbot'
  }
  ;

function connectToIRC(cb) {
  var irc = ircb({
    host: cfg.host,
    nick: cfg.nick + '_' + (~~(Math.random() * 1e9)).toString(36),
    username: cfg.nick,
    realName: cfg.name
  }, function (err) {
    if(err) {
      return cb(err);
    }
    irc.join(cfg.channel, function (err) {
      if (err) {
        return cb(err);
      }
      irc.connected=true;
      cb(null, irc);
    });
  });

  irc.on('close', function () {
    throw new Error('IRCB disconnected, restarting process');
  });
  irc.on('end', function () {
    throw new Error('IRCB disconnected, restarting process');
  });
}

connectToIRC(function (err, ircb) {
  if(err) {
    console.log(JSON.stringify(err));
    throw err;
  }
  console.log('connected to irc as ' + ircb.nick);
  irc = ircb;
  irc.connected = true;
  irc.on('message', function (who, where, wat) {
    var match = wat.match(/#[a-z0-9]{5,6}/);
    if(match) {
      var uuid = match[0];
      var socket = openSockets[uuid];
      if(socket) {
        var toSend = wat.replace(/#[a-z0-9]{5,6}/, '');
        console.log(uuid + '< ' + toSend);
        socket.send(toSend);
      }
    }
  });
});

module.exports = exports = function () {
  return {
    connected: function () { return irc && irc.connected; },
    say: function (uuid, msg) {
      console.log('saying', msg, 'to', cfg.channel);
      irc.say(cfg.channel, msg + ' ' + uuid);
    },
    register: function (uuid, socket) {
      openSockets[uuid] = socket;
    },
    unregister: function (uuid) {
      delete openSockets[uuid];
    },
    get: function (uuid) {
      return openSockets[uuid];
    }
  };
};
