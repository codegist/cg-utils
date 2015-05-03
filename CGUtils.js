(function(scope){
    var PolymerUtils = Polymer.api.instance.utils;

    var CGPropertyObserver = function(observed, watchedProperties, changeCallback, delay, observedTemplate){
        var observers = [];
        var propertyDefSource = observedTemplate || observed;
        for(var i = 0; i < watchedProperties.length;i++){
            var prop = watchedProperties[i];
            var isArray = Array.isArray(propertyDefSource[prop]);
            var obs = isArray ? new ArrayObserver(observed[prop]) : new PathObserver(observed, prop);
            obs.open(function(){
                this.scheduleChangeNotification();
            }.bind(this));
            observers.push(obs);
        }

        this.observed = observed;
        this.observers = observers;
        this.changeCallback = changeCallback;
        this.delay = delay || 3000;
        this.pendingChangeNotification = null;
    };
    CGPropertyObserver.prototype = {
        destroy:function(firePendingChangeNotification){
            var hadTask = this.task != null;
            hadTask && firePendingChangeNotification === true && this.firePendingChangeNotification();
            this.cancelPendingChangeNotification();
            this.observers.forEach(function(obs){
                obs.close();
            });
        },
        cancelPendingChangeNotification:function(){
            PolymerUtils.cancelAsync(this.pendingChangeNotification);
            this.pendingChangeNotification = null;
        },
        firePendingChangeNotification:function(){
            if(this.pendingChangeNotification == null) return;
            this.pendingChangeNotification = null;
            this.changeCallback(this.observed);
        },
        scheduleChangeNotification:function(){
            this.observed._dirty = true;
            this.cancelPendingChangeNotification();
            this.pendingChangeNotification = PolymerUtils.async(this.firePendingChangeNotification.bind(this), null, this.delay);
        }
    };

    var CGUtils = {
        observe:function(config){
            return new CGPropertyObserver(config.observed, config.watchedProperties, config.changeCallback, config.delay, config.observedTemplate);
        }
    };
    scope.CGUtils = CGUtils;
})(window);