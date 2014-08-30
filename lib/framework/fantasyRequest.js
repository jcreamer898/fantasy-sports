var Q = require("q");

function FantasyRequest(auth, req, res) {
    this.auth = auth;
    this.req = req;
    this.res = res;
}

FantasyRequest.prototype.isAuthenticated = function() {
    return !!this.req.session.oauthAccessToken;
};

FantasyRequest.prototype.api = function(url, type, data) {
    var deferred = Q.defer();

    if (!this.req.session.oauthAccessToken) {
        throw new Error("No access token");
    }

    if (arguments.length === 2) {
        data = type;
        type = "POST";
    }

    if (this.auth.isTokenExpired(this.req.session.timestamp)) {
        this.auth.refreshAuthentication(this.req, this.res)
            .done(function() {
                this._request(deferred, url, type, data);            
            }.bind(this));
    }
    else {
        this._request(deferred, url, type, data);
    }

    return deferred.promise;
};

FantasyRequest.prototype._request = function(deferred, url, type, data) {
    var oauth = this.auth.getOAuth();
    
    switch (type) {
        case "POST":
        case "PUT":
            oauth[type.toLowerCase()](url,
                this.req.session.oauthAccessToken,
                this.req.session.oauthAccessTokenSecret,
                data,
                "application/xml",
                function(err, data) {
                    var json = typeof data === "string" ? JSON.parse(data) : data;

                    if (err) {
                        return deferred.reject(err);
                    }

                    deferred.resolve(json);
                });
            break;
        default: 
            oauth.getProtectedResource(
                url,
                "GET",
                this.req.session.oauthAccessToken,
                this.req.session.oauthAccessTokenSecret,
                function(err, data) {
                    var json = typeof data === "string" ? JSON.parse(data) : data;

                    if (err) {
                        return deferred.reject(err);
                    }

                    deferred.resolve(json);
                });
    }
    
};

exports = module.exports = FantasyRequest;