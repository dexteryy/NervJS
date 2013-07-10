<!---
layout: intro
title: NervJS
-->

# NervJS

> * A tiny, pure, event-based model wrapper for the MVC or MDV (Model-driven Views) pattern.
> * It is far thinner than Backbone. None of View, Controller or Router is involved.
> * Strict data hiding but straightforward way to use.
> * Provides minimal built-in APIs but supports all external and conventional methods to access the model.
> * Model can be nested and supports bubbling events.

## In NodeJS

```
npm install nerv
```

## In browser

### AMD and OzJS

* NervJS can either be viewed as an independent library, or as a part of [OzJS mirco-framework](http://ozjs.org/#framework).
* It's wrapped as an [AMD (Asynchronous Module Definition)](https://github.com/amdjs/amdjs-api/wiki/AMD) module. You should use it with [oz.js](http://ozjs.org/#start) (or require.js or [similar](http://wiki.commonjs.org/wiki/Implementations) for handling dependencies). 
* If you want to make it available for both other AMD code and traditional code based on global namespace. OzJS provides [a mini define/require implementation](http://ozjs.org/examples/adapter/) to transform AMD module into traditional [module pattern](http://www.adequatelygood.com/2010/3/JavaScript-Module-Pattern-In-Depth).
* See [http://ozjs.org](http://ozjs.org) for details.

### Get the code

* [Download on Github](https://github.com/dexteryy/NervJS/blob/master/nerv.js)
* Add to your project as new dependency:
    * via [istatic](http://ozjs.org/istatic)
    * via [volo](https://github.com/volojs/volo)

## Dependencies

* [mo/lang/type](https://github.com/dexteryy/mo)
* [mo/lang/mix](https://github.com/dexteryy/mo)
* [mo/lang/oop](https://github.com/dexteryy/mo)
* [EventMaster](https://github.com/dexteryy/EventMaster)

## Examples

* [demo](http://ozjs.org/NervJS/examples/)

## API and usage

```javascript 
var nerv = require('nerv');
```

### nerv.Model

```javascript 
var papercover = nerv();
var hardcover = nerv({
    isHard: true
});
var pageModel = nerv.model({
    defaults: {
        text: '',
        number: 0
    },
    mark: function(){...}
});
var page = pageModel({ number: 1 });
var page2 = pageModel({ number: 2 });
```

* `page.get()` -- 
* `page.get(key)` -- 
* `page.set(key, function(value){ }, context)` -- 
* `page.set(key, function(model){ }, context)` -- 
* `page.set(key, value, context)` -- 
* `page.set(key, model, context)` -- 
* `page.set(function(data){ }, context)` -- 
* `page.set(model, context)` -- 
* `page.remove(key)` -- 
* `page.reset()` -- 
* `page.find(value)` -- 
* `page.find(model)` -- 
* `page.observer` -- 
    * API:
        * Same as [EventMaster](http://ozjs.org/EventMaster/)
    * Event:
        * `{key}:new` -- 
        * `{key}:update` --
        * `{key}:delete` --
        * `change` --

### nerv.Collection

```javascript 
var book = nerv([]);
var bookB = nerv.collection({
    selectPage: function(number){...}
});
```

* `book.add(value)` -- 
* `book.add(model)` -- 
* Same as `nerv.Model`

## More References

See [OzJS Project Homepage](http://ozjs.org/)

## Release History

See [OzJS Release History](http://ozjs.org/#release)

## License

Copyright (c) 2010 - 2013 dexteryy  
Licensed under the MIT license.


