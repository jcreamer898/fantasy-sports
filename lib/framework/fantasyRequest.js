var Q = require("q");

function FantasyRequest(auth, req, res) {
    this.auth = auth;
    this.req = req;
    this.res = res;
}

FantasyRequest.prototype.api = function(url, type) {
    var deferred = Q.defer();

    if (!this.req.session.oauthAccessToken) {
        throw new Error("No access token");
    }

    if (this.auth.isTokenExpired(this.req.session.timestamp)) {
        this.auth.refreshAuthentication(this.req, this.res)
            .done(function() {
                this._request(deferred, url, type);            
            }.bind(this));
    }
    else {
        this._request(deferred, url, type);
    }

    return deferred.promise;
};

FantasyRequest.prototype._request = function(deferred, url, type) {
    this.auth.getOAuth().getProtectedResource(
        url,
        type || "GET",
        this.req.session.oauthAccessToken,
        this.req.session.oauthAccessTokenSecret,
        function(err, data) {
            var json = typeof data === "string" ? JSON.parse(data) : data;

            if (err) {
                return deferred.reject(err);
            }

            deferred.resolve(json);
        });
};

exports = module.exports = FantasyRequest;