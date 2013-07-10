/**
 * NervJS 
 * A tiny, pure, event-based model wrapper for the MVC or MDV (Model-driven Views) pattern.
 * It is far thinner than Backbone. None of View, Controller or Router is involved.
 * Strict data hiding but straightforward way to use.
 * Provides minimal built-in APIs but supports all external and conventional methods to access the model.
 * Model can be nested and supports bubbling events.
 *
 * using AMD (Asynchronous Module Definition) API with OzJS
 * see http://ozjs.org for details
 *
 * Copyright (C) 2010-2012, Dexter.Yy, MIT License
 * vim: et:ts=4:sw=4:sts=4
 */
define('nerv', [
    'mo/lang',
    'eventmaster'
], function(_, event){

    function Model(opt){
        this.init(opt);
        if (opt.data) {
            this.set(opt.data);
        } else {
            this.reset();
        }
    }

    Model.validate = function(v){
        if (v && typeof v === 'object') {
            if (!(v instanceof Model)) {
                throw('New value is an object but not instance of Model');
            }
            v._validate();
        }
    };

    Model.prototype = {

        init: function(opt){
            this._data = this._getBase();
            this._defaults = opt.defaults || {};
            this._setters = {};
            this._getters = {};
            this.observer = event();
            return this;
        },

        get: function(k){
            var res;
            if (k) {
                res = this._getMember(k);
                return res instanceof Model ? res.get() : res;
            }
            res = this._getBase();
            this._each(function(v, k){
                if (v instanceof Model) {
                    res[k] = v.get();
                } else {
                    res[k] = v;
                }
            });
            return res;
        },

        set: function(k, fn, context) {
            if (!k) {
                return this;
            }
            var new_data;
            if (_.isFunction(k) || typeof k === 'object') {
                context = fn;
                fn = k;
                this._unwatchAll();
                new_data = _.isFunction(fn)
                    ? fn.call(context, this._data)
                    : fn;
                if (typeof new_data === 'object') {
                    this._setAll(new_data);
                }
                this._watchAll();
                this.observer.fire('change');
                return this;
            }
            var old_data = this._getMember(k),
                old_value = this.get(k);
            this._unwatch(old_data, k);
            new_data = _.isFunction(fn) 
                ? fn.call(context, old_data) 
                : fn;
            if (this._setters[k]) {
                new_data = this._setters[k].call(this._data, k, new_data);
            } else if (new_data !== undefined) {
                this._data[k] = new_data;
            } else if (old_data && typeof old_data === 'object') {
                new_data = old_data;
            }
            var type = new_data !== undefined 
                && (old_data === undefined && 'new' || 'update');
            if (type) {
                this._watch(new_data, k);
                var changes = {
                    type: type,
                    name: k,
                    oldValue: old_value,
                    newValue: this.get(k)
                };
                this.observer.fire(k + ':' + changes.type, [changes])
                    .fire('change');
            }
            return this;
        },

        remove: function(k){
            var old_value = this.get(k);
            this._unwatch(this._getMember(k), k);
            this._removeMember(k);
            var changes = {
                type: 'delete',
                name: k,
                oldValue: old_value
            };
            this.observer.fire(k + ':' + changes.type, [changes])
                .fire('change');
            return this;
        },

        reset: function(){
            this._unwatchAll();
            this._setAll();
            this._watchAll();
            this.observer.fire('change');
            return this;
        },

        find: function(item){
            var res; 
            this._each(function(v, k){
                if (v === item) {
                    res = k;
                    return false;
                }
            });
            return res;
        },

        _watchAll: function(){
            this._each(this._watch, this);
        },

        _unwatchAll: function(){
            this._each(this._unwatch, this);
        },

        _watch: function(v, k){
            if (v && typeof v === 'object') {
                Model.validate(v);
                v.observer.bind('change', this.observer.promise(k + ':update').pipe.fire)
                    .bind('change', this.observer.promise('change').pipe.fire);
            }
        },

        _unwatch: function(v, k){
            if (v && typeof v === 'object') {
                v.observer.unbind('change', this.observer.promise(k + ':update').pipe.fire)
                    .unbind('change', this.observer.promise('change').pipe.fire);
            }
        },

        getter: function(k, fn) {
            this._getters[k] = fn;
        },

        setter: function(k, fn) {
            this._setters[k] = fn;
        },

        _validate: function(){
            this._each(Model.validate);
        },

        _each: function(fn, context){
            var data = this._data;
            for (var k in data) {
                if (fn.call(context, data[k], k) === false) {
                    break;
                }
            }
        },

        _getBase: function(){
            return {};
        },

        _getMember: function(k){
            return this._getters[k] 
                ? this._getters[k].call(this._data, k)
                : this._data[k];
        },

        _removeMember: function(k){
            delete this._data[k];
        },

        _setAll: function(data){
            this._data = _.mix(_.copy(this._defaults), data);
        }

    };

    var Collection = _.construct(Model);

    _.mix(Collection.prototype, {

        add: function(v){
            this.set(this._data.length, v);
        },

        _each: function(fn, context){
            var data = this._data;
            for (var i = 0, l = data.length; i < l; i++) {
                if (fn.call(context, data[i], i) === false) {
                    break;
                }
            }
        },

        _getBase: function(){
            return [];
        },

        _removeMember: function(k){
            this._data.splice(k, 1);
        },

        _setAll: function(data){
            this._data.length = 0;
            _.mix(this._data, data);
        }

    });

    function exports(data, defaults){
        if (data instanceof exports.Model) {
            return data;
        }
        var opt = {
            data: data,
            defaults: defaults
        };
        return Array.isArray(data) 
            ? new exports.Collection(opt)
            : new exports.Model(opt);
    }

    _.mix(exports, {

        Model: Model,

        Collection: Collection,

        model: function(opt){
            var Sub = _.construct(exports.Model);
            _.mix(Sub.prototype, opt);
            function factory(data){
                return new Sub({
                    data: data,
                    defaults: opt.defaults
                });
            }
            factory.Class = Sub;
            return factory;
        },

        collection: function(opt){
            var Sub = _.construct(exports.Collection);
            _.mix(Sub.prototype, opt);
            function factory(data){
                return new Sub({ data: data });
            }
            factory.Class = Sub;
            return factory;
        }

    });

    return exports;

});

