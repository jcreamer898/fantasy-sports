var OAuth = require("oauth").OAuth,
    Q = require("q"),
    _ = require("underscore");

function Auth() {
}

Auth.prototype.refreshAuthentication = function(req, res) {
    var deferred = Q.defer();

    this.getOAuth().refreshOAuthAccessToken(
        req.session.oauthAccessToken, 
        req.session.oauthAccessTokenSecret, 
        req.session.oauthSessionHandle,
        function(error, oauth_access_token, oauth_access_token_secret, results2) {
            if(error) {
                res.json(error);
            }
            else {
                // store the access token in the session
                req.session.oauthAccessToken = oauth_access_token;
                //req.cookies.accessToken = oauth_access_token;
                req.session.oauthAccessTokenSecret = oauth_access_token_secret;
                req.session.timestamp = new Date();
                req.session.oauthSessionHandle = results2.oauth_session_handle;
                req.session.xoauthYahooGuid = results2.xoauth_yahoo_guid;

                deferred.resolve();
            }
    });

    return deferred.promise;
};

Auth.prototype.endAuthentication = function(req, res) {
    req.session.oauthVerifier = req.param("oauth_verifier");

    this.getOAuth().getOAuthAccessToken(
        req.session.oauthToken, 
        req.session.oauthTokenSecret, 
        req.session.oauthVerifier,
        function(error, oauth_access_token, oauth_access_token_secret, results2) {
            if(error) {
                res.json(error);
            }
            else {
                // store the access token in the session
                req.session.oauthAccessToken = oauth_access_token;
                // req.cookies.access_token = oauth_access_token;
                req.session.oauthAccessTokenSecret = oauth_access_token_secret;
                req.session.timestamp = new Date();
                req.session.oauthSessionHandle = results2.oauth_session_handle;
                req.session.xoauthYahooGuid = results2.xoauth_yahoo_guid;

                res.redirect("/");
            }
    });
};

Auth.prototype.beginAuthentication = function(req, res) {
    var oa = this.getOAuth();

    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret) {
        req.session.oauthToken = oauth_token;
        req.session.oauthTokenSecret = oauth_token_secret;

        // TODO: move to some config
        res.redirect("https://api.login.yahoo.com/oauth/v2/request_auth?oauth_token=" + oauth_token);
    });
};

Auth.prototype.setupMiddleware = function() {
    this.express.use(this.authenticateMiddleware.bind(this));
};

Auth.prototype.isTokenExpired = function(timestamp) {
    return (Math.round(((new Date() - new Date(timestamp)) % 86400000) / 3600000) >= 1);
};

Auth.prototype.getOAuth = function() {
    return new OAuth(
        this.config.accessTokenUrl,
        this.config.requestTokenUrl,
        this.config.oauthKey,
        this.config.oauthSecret,
        this.config.version,
        this.config.callback,
        this.config.encryption
    );
};

exports = module.exports = Auth;