(function(scope){
    var Async = Polymer.Async;

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
            var hadTask = this.pendingChangeNotification != null;
            hadTask && firePendingChangeNotification === true && this.firePendingChangeNotification();
            this.cancelPendingChangeNotification();
            this.observers.forEach(function(obs){
                obs.close();
            });
        },
        cancelPendingChangeNotification:function(){
            Async.cancel(this.pendingChangeNotification);
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
            this.pendingChangeNotification = Async.run(this.firePendingChangeNotification.bind(this), this.delay);
        }
    };


    var isNode = function(o){
        return (
            typeof Node === "object" ? o instanceof Node :
            o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
        );
    };
    var isElement = function(o){
        return (
            typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
        );
    };
    var jsonDomStripper = function(k,v){
        if(isNode(v) || isElement(v)) {
            return v.toString();
        }
        return v;
    };

    var Utils = {
        Objects:{
            deepClone:function(o){
                var target = Array.isArray(o) ? [] : {};
                return $.extend(true, target, o);
            },
            clone:function(deep, target, objectA, objectB){
                return $.extend.apply(this, arguments);
            },
            observe:function(config){
                return new CGPropertyObserver(config.observed, config.watchedProperties, config.changeCallback, config.delay, config.observedTemplate);
            }
        },
        Json:{
            stringify:function(object, stripDomProperties, maxLength){
                var json = JSON.stringify(object, stripDomProperties === true ? jsonDomStripper : undefined);
                if(maxLength > 0) {
                    json = String(json).substr(0, maxLength);
                }
                return json;
            }
        },
        Ranges:{
            dateRangeIntersects: function(e1, e2){
                var a1 = e1.from.getTime();
                var a2 = e1.to.getTime();
                var b1 = e2.from.getTime();
                var b2 = e2.to.getTime();
                return Utils.Ranges.intersects(a1,a2,b1,b2);
            },
            intersects:function(a1,a2,b1,b2){
                return (a1 < b2 && b1 < a2 );
            }
        },
        Comparators:{
            dateRange:function(a,b){
                var aFrom = a.from.getTime();
                var bFrom = b.from.getTime();
                var aTo = a.to.getTime();
                var bTo = b.to.getTime();
                return  aFrom < bFrom ? -1 : aFrom > bFrom ? 1 : aTo < bTo ? 1 : aTo > bTo ? -1 : 0;
            },
            number:function(a,b){
                return a < b ? -1 : a > b ? 1 : 0;
            }
        },
        Formats:{
            number:function(value, format){
                if(!value) return "n/a";
                return numeral(value).format(format);
            },
            duration:function(duration){
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
            durationAbout:function(d, templates){
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
        },
        Displays:{
            countFound:function(type, plural, total){
                total = total || 0;
                return total + " " + (total > 1 ? plural : type) + " found.";
            }
        },
        Randoms:{
            id:function(){
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random()*16|0, v = c === 'x' ? r : (r&0x3|0x8);
                    return v.toString(16);
                });
            }
        }
    };
    scope.CG.Utils = Utils;
})(window);