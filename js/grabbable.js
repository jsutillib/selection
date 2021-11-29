/**
   Copyright 2021 Carlos A. (https://github.com/dealfonso)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

(function(exports, document) {
    "use strict";
    if (exports.jsutillib === undefined) {
        exports.jsutillib = {};
    }
    
    function grabbable(el, options = {}) {
        /** This is the shorthand to remove the grabbableability of the element */
        if (options === false) {
            this.each(function() {
                if (this._grabbable !== undefined) {
                    // Remove the handlers, if defined
                    this._grabbable.deactivate();
                    delete this._grabbable;
                }
            });
            return el;
        }

        let defaults = {
            // If set, this is the class which will be set for the object while being moved
            classdragging: 'grabbing',
            // If set, this function will be called upon start grabbing the object
            callbackstart: function() {},
            // If set, this function will be called upon end grabbing the object
            callbackend: function() {},
            // If set, this function will be called upon moving the object
            callbackmove: function(dx, dy) {},
        }

        // This is the handler for the movement, which basically calculates the new offset for the element
        function on_document_mousemove(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();

            let grabbable = $el.get(0)._grabbable;
            let dx = e.clientX - grabbable.initial.x0 + $('body').scrollLeft();
            let dy = e.clientY - grabbable.initial.y0 + $('body').scrollTop();

            $el.offset({left: grabbable.initial.position.left + dx, top: grabbable.initial.position.top + dy});

            $el.get(0).dispatchEvent(new CustomEvent('grabbable-move', { detail: { grabbed: $el }}));
            if (typeof grabbable.settings.callbackmove === 'function') {
                grabbable.settings.callbackmove.bind($el)(dx, dy);
            }
        };

        function on_document_mouseup(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();

            $el.get(0).dispatchEvent(new Event('object-dragged'));

            let grabbable = $el.get(0)._grabbable;

            $(document).off('mousemove', grabbable.handlers.document_mousemove);
            $(document).off('mouseup', grabbable.handlers.document_mouseup);

            if (grabbable.settings.classdragging !== null)
                $el.removeClass(grabbable.settings.classdragging);

            $el.get(0).dispatchEvent(new CustomEvent('grabbable-end', { detail: { grabbed: $el }}));
            if (typeof grabbable.settings.callbackend === 'function') {
                grabbable.settings.callbackend.bind($el)();
            }
        };

        function on_mousedown(e, $el) {
            if (e.which !== 1) {
                return;
            }

            e.preventDefault();
            e.stopImmediatePropagation();

            let grabbable = $el.get(0)._grabbable;

            if (grabbable.settings.classdragging !== null)
                $el.addClass(grabbable.settings.classdragging);

            grabbable.initial = {
                x0: e.clientX + $('body').scrollLeft(),
                y0: e.clientY + $('body').scrollTop(),
                position: $el.position(),
                parent: { left: 0, top: 0 }
            }

            if (["absolute", "fixed"].indexOf($el.css("position")) !== 1) {
                grabbable.initial.parent = $el.parent().offset();
            }

            $(document).on('mousemove', grabbable.handlers.document_mousemove);
            $(document).on('mouseup', grabbable.handlers.document_mouseup);

            $el.get(0).dispatchEvent(new CustomEvent('grabbable-start', { detail: { grabbed: $el }}));
            if (typeof grabbable.settings.callbackstart === 'function') {
                grabbable.settings.callbackstart.bind($el)();
            }
        }

        class Grabbable {
            constructor($el, settings) {
                this.settings = $.extend({}, defaults, settings);
                this.handlers = {
                    mousedown: function (e) {
                        on_mousedown(e, $el);
                    },
                    document_mousemove: function(e) {
                        on_document_mousemove(e, $el);
                    },
                    document_mouseup: function(e) {
                        on_document_mouseup(e, $el);
                    }
                };
                this.$el = $el;
            }
            activate() {
                this.$el.on('mousedown', this.handlers.mousedown);
            }
            deactivate() {
                this.$el.off('mousedown', this.handlers.mousedown);
                $('document').off('mousemove', this.handlers.document_mousemove);
                $('document').off('mouseup', this.handlers.document_mouseup);
            }
        };

        el.each(function() {
            let $this = $(this);

            // If it is already grabbable, we'll remove the prior settings
            if (this._grabbable !== undefined) {
                this._grabbable.deactivate();
                delete this._grabbable;
            }

            this._grabbable = new Grabbable($this, options);
            this._grabbable.activate();
        })

        return el;
    }

    exports.jsutillib.grabbable = grabbable;
})(window, document);