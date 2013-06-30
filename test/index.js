/**
 * Test of redis-ngram-search
 **/

var Search = require('../')
    , should = require('should')
    , redis = require('redis');

var start = new Date;
var search = Search.createSearch({n:3, key:'test', service:'stest', cache_time:0});

search.words('foo bar baz foo')
    .should.eql({foo:2, bar:1, baz:1});

try {
    search
        .index('fooboo barbaz', 6, function(err){
            if (err) throw err;
            search.query('foo bar', function(err, ids){
                if (err) throw err;
                ids.should.eql(['6']);
                search.query('boo baz', function(err, ids){
                    if (err) throw err;
                    ids.should.eql(['6']);
                    search.remove(6, function(err){
                        if (err) throw err;
                        search.query('fooboo', function(err, ids){
                            if (err) throw err;
                            ids.should.be.empty;
                            search.query('barbaz', function(err, ids){
                                if (err) throw err;
                                ids.should.be.empty;
                                done();
                            });
                        });
                    });
                });
            });
        });
} catch (e) {
    console.log(e);
}

function done() {
    console.log();
    console.log('  tests completed in %dms', new Date - start);
    console.log();
    process.exit();
}
