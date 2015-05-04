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
        },
        formatNumber:function(value, format){
            return numeral(value).format(format);
        },
        formatDuration:function(duration){
            var one_minute=1000*60;
            var one_hour=one_minute*60;
            var one_day=one_hour*24;

            var days = Math.floor(duration/one_day);
            duration -= days * one_day;
            var hours = Math.floor(duration/one_hour);
            duration -= hours * one_hour;
            var minutes = Math.floor(duration/one_minute);

            var durationDisplay = "";
            days > 0 && (durationDisplay += (days + " day" + (days > 1 ? "s":"")));
            hours > 0 && (durationDisplay += (durationDisplay ? ", " : "") + (hours + " hour" + (hours > 1 ? "s":"")));
            minutes > 0 && (durationDisplay += (durationDisplay ? ", " : "") + (minutes + " minute" + (minutes > 1 ? "s":"")));
            return durationDisplay;
        },
        formatAboutDuration:function(d, templates){
            var duration = Math.abs(d);
            var one_minute=1000*60;
            var one_hour=one_minute*60;
            var one_day=one_hour*24;

            var days = Math.round(duration/one_day);
            duration -= days * one_day;
            var hours = Math.round(duration/one_hour);
            duration -= hours * one_hour;
            var minutes = Math.round(duration/one_minute);

            var weeks,months,years, precise = false;
            if(days >= 1) {
                hours = 0;
                minutes = 0;
                if(days < 7) {
                    // leave
                }else if(days < 30) {
                    weeks = Math.round(days / 7);
                    days = 0;
                }else if(days < 365) {
                    months = Math.round(days / (365/12));
                    days = 0;
                }else{
                    years = Math.round(days / 365);
                    days = 0;
                }
            }else{
                days = 0;
                if(hours >= 1) {
                    minutes = 0;
                }else{
                    precise = true;
                }
            }

            var position = d > 0 ? "past" : "future";
            var precision = precise? "Precise" : "About";
            var template = templates[position + precision];
            var durationDisplay = "";
            years > 0 && (durationDisplay += (years + " year" + (years > 1 ? "s":"")));
            months > 0 && (durationDisplay += (months + " month" + (months > 1 ? "s":"")));
            weeks > 0 && (durationDisplay += (weeks + " week" + (weeks > 1 ? "s":"")));
            days > 0 && (durationDisplay += (days + " day" + (days > 1 ? "s":"")));
            hours > 0 && (durationDisplay += (durationDisplay ? ", " : "") + (hours + " hour" + (hours > 1 ? "s":"")));
            minutes > 0 && (durationDisplay += (durationDisplay ? ", " : "") + (minutes + " minute" + (minutes > 1 ? "s":"")));
            return template.replace("{}", durationDisplay);
        }
    };
    scope.CGUtils = CGUtils;
})(window);