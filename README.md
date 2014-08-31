# FantasySports [![Build Status](https://secure.travis-ci.org/jcreamer898/fantasy-sports.png?branch=master)](http://travis-ci.org/jcreamer898/fantasy-sports)

This is a node.js library for interacting with the Yahoo Fantasy API. It currently works with Express 3.0, and maybe 4.0, but haven't tried it in 4 yet as of 8/4/14.

The Yahoo API is an OAuth v1 API (gross), so I did my best to make it easy to use, but feel free to contribute any way to making it better!


## Getting Started
Install the module with: `npm install fantasysports`

### Configure
For my setup, I configure the API in the router with this...

```js
var FantasySports = require('FantasySports');
FantasySports.options({
    "accessTokenUrl": "https://api.login.yahoo.com/oauth/v2/get_request_token",
    "requestTokenUrl": "https://api.login.yahoo.com/oauth/v2/get_token",
    "oauthKey": process.env.OAUTHKEY,
    "oauthSecret": process.env.OAUTHSECRET,
    "version": "1.0",
    "callback": "http://yourwebsite.com/auth/oauth/callback",
    "encryption": "HMAC-SHA1"
};);
```

To get an access token you'll have to set up 2 routes in your express app...

```js
// routes/index.js

// app.get("/auth/oauth")
exports.oauth = function(req, res) {
    FantasySports.startAuth(req, res);
};

// app.get("/auth/oauth/callback")
exports.authorize = function(req, res) {
    FantasySports.endAuth(req, res);
};
```

You also need to make sure that you have session support setup in express.

I'm currently using `cookieSession` in express 3.0.

```js
app.use(express.cookieSession({ 
    key: 'some key', 
    secret: 'some secret', 
    proxy: true 
}));
```

Then calling the API in a route is as easy as...

```js
exports.myTeams = function(req, res) {
    FantasySports
        .request(req, res)
        .api('http://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues?format=json')
        .done(function(data) {
            var leagueData = data.fantasy_content.users[0].user[1].games[0].game[1].leagues,
                leagues = [];

            _.each(leagueData, function(value) {
                if (value.league) leagues.push(value.league[0]);
            });

            res.json(leagues);
        });
};
```

The data model for the Yahoo API is as weird as I've ever seen... hence stuff like `var leagueData = data.fantasy_content.users[0].user[1].games[0].game[1].leagues,`.

## POST/PUT
You can pass an object full of data as a second parameter to the `.api` function for a `POST`

** NOTE: You have to pass XML data in your posts, which is... weird**

```js
FantasySports
    .request(req, res)
    .api('http://fantasysports.yahooapis.com/fantasy/v2/league/LEAGUEID/transactions?format=json', '<?xml version="1.0" encoding="UTF-8" ?>' +
'<fantasy_content>' +
    '<transaction>' +
        '<type>drop</type>' +
        '<player>' +
            '<player_key>331.p.24869</player_key>' +
            '<transaction_data>' +
                '<type>drop</type>' +
                '<source_team_key>331.l.198983.t.2</source_team_key>' +
            '</transaction_data>' +
        '</player>' +
    '</transaction>' +
'</fantasy_content>')
    .done(function(data) {
        res.json(data);
    }, function(err) {
        res.json(err);
    });
```

You can also specify the type as well

```js
FantasySports
    .request(req, res)
    .api('http://fantasysports.yahooapis.com/fantasy/v2/league/LEAGUEID/transactions?format=json', 'PUT', XMLDATA
    .done(function(data) {
        res.json(data);
    }, function(err) {
        res.json(err);
    });
```

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
v0.2.0 8/3/2014

## License
Copyright (c) 2014 Jonathan Creamer  
Licensed under the MIT license.
