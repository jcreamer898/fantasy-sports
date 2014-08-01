var Q = require("q"),
    _ = require("underscore"),
    FantasyRequest = require("./fantasyRequest");

function FantasySports(auth) {
    this.defaults = {
        apiRoot: "http://fantasysports.yahooapis.com/fantasy/v2/"
    };
    this.auth = auth;
}

FantasySports.prototype.options = function(opts) {
    this.config = _.extend(this.defaults, opts);
    this.auth.config = this.config;
};

FantasySports.prototype.startAuth = function(req, res) {
    this.auth.beginAuthentication(req, res);
};

FantasySports.prototype.endAuth = function(req, res) {
    this.auth.endAuthentication(req, res);
};

FantasySports.prototype.request = function(req, res) {
    var request = new FantasyRequest(this.auth, req, res);
    return request;
};

exports = module.exports = FantasySports;
