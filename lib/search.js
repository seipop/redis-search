var redis = require('redis')
  , noop = function(){};

exports.createSearch = function (opt) {
    return new Search(opt);
};

Array.prototype.searchFilter = function (min) {
    var unique = {};
    for (var i = 0; i < this.length; i += 1) {
        if (this[i].length >= min)
            unique[this[i]] = (unique[this[i]] || 0) + 1;
    }
    return unique;
};

function Search (opt) {
    opt = opt || {};
    this._n = parseInt(opt.n, 10) || 3;
    this._key = opt.key || 'ngram';
    this._service = opt.service || 'search';
    this._cache_time = parseInt(opt.cache_time, 10) != null ? parseInt(opt.cache_time, 10) : 60;
    this._client = opt.client || redis.createClient();
    this._type = 'or';
    this._query_str = '';
}

Search.prototype.words = function(str){
    return String(str).match(/\S+/g).searchFilter(this._n);
};

Search.prototype.type = function(str){
    this._type = /^(and|or)$/.test(str) ? str : this._type;
    return this;
};

Search.prototype.index = function (str, id, fn) {
    var search = this;
    fn = fn || noop;
    str = this.words(str);
    var multi = this._client.multi();
    this._client.exists(this._service + ':' + this._key + ':id:' + id, function(err, exist) {
        if (err) fn(err);
        else {
            var index = function () {
                var ngram = [];
                for (key in str) {
                    for (var i = 0; i <= key.length - search._n; i++) {
                        multi.zadd(search._service + ':' + search._key + ':key:' + key.substr(i, search._n).toLowerCase(), str[key], id);
                        ngram.push(search._service + ':' + search._key + ':key:' + key.substr(i, search._n).toLowerCase());
                    }
                }
                multi.sadd(search._service + ':' + search._key + ':id:' + id, ngram);
                multi.exec(fn);
            };
            if (exist) {
                search.remove(id, index);
            } else {
                index();
            }
        }
    });
    return this;
};

Search.prototype.remove = function (id, fn) {
    var search = this;
    fn = fn || noop;
    var multi = this._client.multi();
    this._client.smembers(this._service + ':' + this._key + ':id:' + id, function(err, keys) {
        if (err) fn(err);
        else {
            for (i in keys) {
                multi.zrem(keys[i], id);
            }
            multi.del(search._service + ':' + search._key + ':id:' + id);
            multi.exec(fn);
        }
    });
    return this;
};

Search.prototype.query = function (str, fn) {
    var search = this;
    fn = fn || noop;
    str = this.words(str);
    if (Object.keys(str).length > 0) {
        var multi = this._client.multi();
        var time = new Date().getTime();
        var type = Object.keys(str).length == 1 ? 'one' : this._type;
        var dbkey = this._service + ':' + this._key + ':search:';
        var searchKey = '';
        for (key in str) {
            searchKey += key;
        }
        search._client.zrevrangebyscore(dbkey + type + ':' + searchKey, '+inf', '-inf', function(err, replis) {
            if (err) fn(err);
            else if (replis.length > 0) {
                fn(err, replis);
            } else {
                var grams = [];
                var grams_and = [];
                var count = 0;
                for (key in str) {
                    for (var i = 0; i <= key.length - search._n; i++) {
                        grams.push(search._service + ':' + search._key + ':key:' + key.substr(i, search._n).toLowerCase());
                    }
                    if (type == 'and') {
                        grams.unshift(dbkey + 'one:' + key, Object.keys(grams).length);
                        multi.zunionstore(grams);
                        multi.expire(dbkey + 'one:' + key, search._cache_time);
                        grams_and.push(dbkey + 'one:' + key);
                        grams = [];
                    }
                }
                if (type == 'and') {
                    grams_and.unshift(dbkey + type + ':' + searchKey, Object.keys(grams_and).length);
                    multi.zinterstore(grams_and);
                } else {
                    grams.unshift(dbkey + type + ':' + searchKey, Object.keys(grams).length);
                    multi.zunionstore(grams);
                }
                multi.zrevrangebyscore(dbkey + type + ':' + searchKey, '+inf', '-inf', fn);
                multi.expire(dbkey + type + ':' + searchKey, search._cache_time);
                multi.exec(noop);
            }
        });
    } else {
        fn(null, []);
    }
    return this;
};
