var Keypair = Backbone.Model.extend({

    initialize: function() {
      this.id = this.get("name");
    },

    region: undefined,

    getRegion: function() {
        if (this.region) {
            return this.region;
        }
        return UTILS.Auth.getCurrentRegion();
    },

    _action:function(method, options) {
        var model = this;
        options = options || {};
        var error = options.error;
        options.success = function(resp) {
            model.trigger('sync', model, resp, options);
            if (options.callback!==undefined) {
                options.callback(resp);
            }
        };
        options.error = function(resp) {
            model.trigger('error', model, resp, options);
            if (error!==undefined) {
                error(model, resp);
            }
        };
        var xhr = (this.sync || Backbone.sync).call(this, method, this, options);
        return xhr;
    },

    sync: function(method, model, options) {
           switch(method) {
               case "create":
                   JSTACK.Nova.createkeypair(model.get("name"), model.get("public_key"), options.success, options.error, this.getRegion());
                   break;
               case "delete":
                   JSTACK.Nova.deletekeypair(model.get("name"), options.success, options.error, this.getRegion());
                   break;
           }
   }

});

var Keypairs = Backbone.Collection.extend({
    model: Keypair,
    
    region: undefined,

    getRegion: function() {
        if (this.region) {
            return this.region;
        }
        return UTILS.Auth.getCurrentRegion();
    },

    sync: function(method, model, options) {
        if (method === "read") {
            JSTACK.Nova.getkeypairlist(options.success, options.error, this.getRegion());
        }
    },

    parse: function(resp) {
        var list = [];
        for (var index in resp.keypairs) {
            var keypair = resp.keypairs[index];
            list.push(keypair.keypair);
        }
        return list;
    }

});