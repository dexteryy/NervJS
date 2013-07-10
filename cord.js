
define('cord', [
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
            v.validate();
        }
    }

    Model.prototype = {

        init: function(opt){
            this._data = this.getBase();
            this._defaults = opt.defaults || {};
            this._setters = {};
            this._getters = {};
            this.observer = event();
            return this;
        },

        each: function(fn, context){
            var data = this._data;
            for (var k in data) {
                if (fn.call(context, data[k], k) === false) {
                    break;
                }
            }
        },

        get: function(k){
            var res;
            if (k) {
                res = this.getMember(k);
                return res instanceof Model ? res.get() : res;
            }
            res = this.getBase();
            this.each(function(v, k){
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
            var new_value;
            if (_.isFunction(k) || typeof k === 'object') {
                context = fn;
                fn = k;
                this.unregisterAll();
                new_value = _.isFunction(fn)
                    ? fn.call(context, this._data)
                    : fn;
                if (typeof new_value === 'object') {
                    this.setAll(new_value);
                }
                this.registerAll();
                this.observer.fire('change');
                return this;
            }
            var old_value = this.getMember(k);
            this.unregister(old_value, k);
            old_value = this.get(k);
            new_value = _.isFunction(fn) 
                ? fn.call(context, this.getMember(k)) 
                : fn;
            if (this._setters[k]) {
                new_value = this._setters[k].call(this._data, k, new_value);
            } else if (new_value !== undefined) {
                this._data[k] = new_value;
            } else if (old_value && typeof old_value === 'object') {
                new_value = old_value;
            }
            var type = new_value !== undefined 
                && (old_value === undefined && 'new' || 'update');
            if (type) {
                this.register(new_value, k);
                var changes = {
                    type: type,
                    name: k,
                    oldValue: old_value,
                    newValue: new_value
                };
                this.observer.fire(k + ':' + changes.type, [changes])
                    .fire('change');
            }
            return this;
        },

        remove: function(k){
            var old_value = this.getMember(k);
            this.unregister(old_value, k);
            old_value = this.get(k);
            this.removeMember(k);
            var changes = {
                type: 'delete',
                name: k,
                oldValue: old_value
            };
            this.observer.fire(k + ':' + changes.type, [changes])
                .fire('change');
            return this;
        },

        setAll: function(data){
            this._data = _.config({}, data, this._defaults);
        },

        reset: function(){
            this.unregisterAll();
            this.setAll();
            this.registerAll();
            this.observer.fire('change');
            return this;
        },

        find: function(item){
            var res; 
            this.each(function(v, k){
                if (v === item) {
                    res = k;
                    return false;
                }
            });
            return res;
        },

        registerAll: function(){
            this.each(this.register, this);
        },

        unregisterAll: function(){
            this.each(this.unregister, this);
        },

        register: function(v, k){
            if (v && typeof v === 'object') {
                this.constructor.validate(v);
                v.observer.bind('change', this.observer.promise(k + ':update').pipe.fire)
                    .bind('change', this.observer.promise('change').pipe.fire);
            }
        },

        unregister: function(v, k){
            if (v && typeof v === 'object') {
                v.observer.unbind('change', this.observer.promise(k + ':update').pipe.fire)
                    .unbind('change', this.observer.promise('change').pipe.fire);
            }
        },

        validate: function(){
            this.each(this.constructor.validate);
        },

        getBase: function(){
            return {};
        },

        getMember: function(k){
            return this._getters[k] 
                ? this._getters[k].call(this._data, k)
                : this._data[k];
        },

        removeMember: function(k){
            delete this._data[k];
        },

        getter: function(k, fn) {
            this._getters[k] = fn;
        },

        setter: function(k, fn) {
            this._setters[k] = fn;
        }

    };

    var Collection = _.construct(Model);

    Collection.validate = Model.validate;

    Collection.prototype = {

        each: function(fn, context){
            var data = this._data;
            for (var i = 0, l = data.length; i < l; i++) {
                if (fn.call(context, data[i], i) === false) {
                    break;
                }
            }
        },

        setAll: function(data){
            this._data.length = 0;
            _.mix(this._data, data);
        },

        getBase: function(){
            return [];
        },

        removeMember: function(k){
            this._data.splice(k, 1);
        },

        add: function(v){
            this.set(this._data.length, v);
        }

    };

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
            return function(data){
                return _.mix(exports(data, opt.defaults), opt);
            };
        },

        collection: function(opt){
            return function(data){
                return _.mix(exports(data), opt);
            };
        }

    });

    return exports;

});

