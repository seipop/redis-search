# redis-search

  redis-search is a very light-weight search engine for node.js using redis. This module is an implementation of [n-gram method](http://en.wikipedia.org/wiki/N-gram). This is a light general purpose search library that could be integrated into a blog, a documentation server, etc.

## Installation

      $ npm install redis-search

## Example

The first thing you'll want to do is create a `Search` instance, which allows you to pass some options, used for namespacing within Redis, size of n-gram, and cache time.
```js
var search = Search.createSearch({
            service : STRING,   // The name of your service. used for namespacing. Default 'search'.
            key : STRING,       // The name of this search. used for namespacing. So that you may have several searches in the same db. Default 'ngram'.
            n : INT,            // The size of n-gram. Note that this method cannot match the word which length shorter then this size. Default '3'.
            cahce_time : INT,   // The second of cache retention. Default '60'.
            client : REDIS CLIENT // The redis client instance. Set if you want customize redis connect. Default connect to local.
        });
```

 redis-search acts against arbitrary numeric or string based ids, so you could utilize this library with essentially anything you wish, even combining data stores. The following example just uses an array for our "database", containing some strings, which we add to reds by calling `Search#index()` padding the body of text and an id of some kind, in this case the index.

```js
var strs = [];
strs.push('Foo boo');
strs.push('Foo test');
strs.push('test Boo');
strs.push('test Bar');
strs.forEach(function(str, i){ search.index(str, i); });
```

 To perform a query against reds simply invoke `Search#query()` with a string, and pass a callback, which receives an array of ids when present, or an empty array otherwise.

```js
search
    .query(query = 'test boo', function(err, ids) {
        if (err) throw err;
        console.log('Search results for "%s":', query);
        console.log(ids);
        process.exit();
    });
```

 By default performs an intersection of the search words, the previous example would yield the following output:

```
Search results for "test boo":
[ '2', '3', '1', '0' ]
```
 We can set the search type either "and" of "or" (Default) before query.

```js
search
    .type('and')
    .query(query = 'test boo', function(err, ids){
        if (err) throw err;
        console.log('Search results for "%s":', query);
        console.log(ids);
        process.exit();
    });
```
 Output:
```
Search results for "test boo":
[ '2' ]
```

## API

```js
Search.createSearch(opt);
Search#index(text, id[, fn]);
Search#type(and|or);
Search#remove(id[, fn]);
Search#query(text, fn);
```

 Examples:

```js
var Search = require('redis-search');
var search = Search.createSearch('test');
search.index('Foo bar baz', 'abc');
search.index('Foo bar', 'bcd');
search.remove('bcd');
search.query('foo bar', function(err, ids){});
```
## License 

(The MIT License)

Copyright (c) 2013 Cheng Zhang &lt;sei.vzc@gmail.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
