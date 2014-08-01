var _ = require("underscore");
var FantasySports = require("./framework/fantasy");
var Auth = require("./framework/auth");
var FantasyRequest = ("./framework/fantasyRequest");

module.exports = new FantasySports(new Auth());