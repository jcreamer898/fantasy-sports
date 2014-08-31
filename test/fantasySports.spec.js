"use strict";

var FantasySports = require("../lib/index.js");
var expect = require("expect.js");
var sinon = require("sinon");

describe("FantasySports", function() {
    it("should be a thing", function() {
        expect(FantasySports).to.be.ok();
    });

    it("should be configurable", function() {
        FantasySports.options({
            foo: "bar"
        });

        expect(FantasySports.config.foo).to.be("bar");
    });

    describe("Authentication", function() {
        it("should begin the oauth process", function() {
            var request = {
                    session: {}
                },
                response = {
                    redirect: sinon.spy()
                };

            sinon.stub(FantasySports.auth, "getOAuth")
                .returns({
                    getOAuthRequestToken: function(callback) {
                        callback(null, "abc123", "abc123secret");
                    }
                });

            FantasySports.startAuth(request, response);

            expect(response.redirect.calledOnce).to.be.ok();
            expect(request.session.oauthToken).to.be("abc123");
            expect(request.session.oauthTokenSecret).to.be("abc123secret");

            FantasySports.auth.getOAuth.restore();
        });

        it("should end the oauth process", function() {
            var request = {
                    session: {},
                    param: sinon.spy()
                },
                response = {
                    redirect: sinon.spy()
                };

            sinon.stub(FantasySports.auth, "getOAuth")
                .returns({
                    getOAuthAccessToken: function(token, secret, verifier, callback) {
                        callback(null, "access123", "access123secret", {
                            oauth_session_handle: "session1",
                            xoauth_yahoo_guid: "guid123"
                        });
                    }
                });

            FantasySports.endAuth(request, response);

            expect(response.redirect.calledOnce).to.be.ok();
            expect(request.session.oauthAccessToken).to.be("access123");
            expect(request.session.oauthAccessTokenSecret).to.be("access123secret");
            expect(request.session.timestamp).to.be.ok();
            expect(request.session.oauthSessionHandle).to.be("session1");
            expect(request.session.xoauthYahooGuid).to.be("guid123");

            FantasySports.auth.getOAuth.restore();
        });

        it("should tell whether a user is authenticated", function() {
            var req = {
                    session: {},
                },
                res = {};

            expect(!FantasySports.request(req, res).isAuthenticated()).to.be.ok();

            req.session.oauthAccessToken = "abc123";

            expect(FantasySports.request(req, res).isAuthenticated()).to.be.ok();
        });
    });

    describe("Request", function() {
        it("should make requests with a valid access token", function() {
            var request = {
                    session: { 
                        oauthAccessToken: "abc123"
                    }
                },
                response = {};

            sinon.stub(FantasySports.auth, "getOAuth")
                .returns({
                    getProtectedResource: function(url, type, accessToken, accessTokenSecret, callback) {
                        callback(null, {
                            players: ["1", "2", "3"]
                        });
                    }
                });

            FantasySports
                .request(request, response)
                .api("users;use_login=1/games;game_keys=nfl/leagues?format=json")
                .done(function(data) {  
                    expect(data.players.length).to.be(3);
                });

            FantasySports.auth.getOAuth.restore();
        });

        it("should make refresh authentication when a token is expired", function() {
            var now = new Date(),
                request = {},
                response = {};
                
            now.setMinutes(now.getMinutes() - 65);
            
            request = {
                session: { 
                    oauthAccessToken: "abc123",
                    timestamp: now
                }
            };

            sinon.stub(FantasySports.auth, "getOAuth")
                .returns({
                    getProtectedResource: function(url, type, accessToken, accessTokenSecret, callback) {
                        callback(null, {
                            players: ["1", "2", "3"]
                        });
                    }, 
                    refreshOAuthAccessToken: function(token, secret, verifier, callback) {
                        callback(null, "access123", "access123secret", {
                            oauth_session_handle: "session1",
                            xoauth_yahoo_guid: "guid123"
                        });
                    }
                });

            FantasySports
                .request(request, response)
                .api("users;use_login=1/games;game_keys=nfl/leagues?format=json")
                .done(function(data) {  
                    expect(data.players.length).to.be(3);

                    FantasySports.auth.getOAuth.restore();
                });
        });

        it("should refresh authentication when a token is not present on the session", function() {
            var request = {
                    session: { 
                        oauthAccessToken: "abc123"
                    }
                },
                response = {};

            sinon.stub(FantasySports.auth, "getOAuth")
                .returns({
                    getProtectedResource: function(url, type, accessToken, accessTokenSecret, callback) {
                        callback(null, {
                            players: ["1", "2", "3"]
                        });
                    }
                });

            FantasySports
                .request(request, response)
                .api("users;use_login=1/games;game_keys=nfl/leagues?format=json")
                .done(function(data) {  
                    expect(data.players.length).to.be(3);
                });

            FantasySports.auth.getOAuth.restore();
        });

        it("should accept posts", function () {
            var request = {
                    session: { 
                        oauthAccessToken: "abc123"
                    }
                },
                response = {};

            sinon.stub(FantasySports.auth, "getOAuth")
                .returns({
                    post: function(url, accessToken, accessTokenSecret, data, dataType, callback) {
                        callback(null, {
                            success: true
                        });
                    }
                });

            FantasySports
                .request(request, response)
                .api("users;use_login=1/games;game_keys=nfl/leagues?format=json", {
                    fantasy_content: {
                        transaction: {
                            type: "add",
                            player: {
                                player_key: "123",
                                transaction_data: {
                                    type: "add",
                                    destination_team_key: "team1"
                                }
                            }
                        }
                    }
                })
                .done(function(data) {  
                    expect(data.success).to.be.ok();
                });

            FantasySports.auth.getOAuth.restore();
        });

        it("should accept puts", function () {
            var request = {
                    session: { 
                        oauthAccessToken: "abc123"
                    }
                },
                response = {};

            sinon.stub(FantasySports.auth, "getOAuth")
                .returns({
                    put: function(url, accessToken, accessTokenSecret, data, dataType, callback) {
                        callback(null, {
                            success: true
                        });
                    }
                });

            FantasySports
                .request(request, response)
                .api("users;use_login=1/games;game_keys=nfl/leagues?format=json", "PUT", {
                    fantasy_content: {
                    roster: {
                        coverage_type: "week",
                        week: "1",
                        players: [
                            {
                                player: {
                                    player_key: "123",
                                    position: "BN"
                                }
                            }
                        ]
                    }
                }
                })
                .done(function(data) {  
                    expect(data.success).to.be.ok();
                });

            FantasySports.auth.getOAuth.restore();
        });
    });
});