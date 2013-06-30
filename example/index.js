var Search = require('../'),
    search = Search.createSearch();

var strs = [];
strs.push('Foo boo');
strs.push('Foo test');
strs.push('test Boo');
strs.push('test Bar');
strs.forEach(function(str, i){ search.index(str, i); });

search
    .query(query = 'test boo', function(err, ids) {
        if (err) throw err;
        console.log('Search results for "%s":', query);
        console.log(ids);
        search
            .type('and')
            .query(query = 'test boo', function(err, ids){
                if (err) throw err;
                console.log('Search results for "%s":', query);
                console.log(ids);
                process.exit();
            });
    });

