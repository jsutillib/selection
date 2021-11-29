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

    function sizable(el, options = {}) {
        /** This is the shorthand to remove the grabbableability of the element */
        if (options === false) {
            this.each(function() {
                if (this._sizable !== undefined) {
                    // Remove the handlers, if defined
                    this._sizable.deactivate();
                    delete this._sizable;
                }
            });
            return this;
        }

        let defaults = {
            // If set, a set of divs will be added to the object to be sized
            autoaddsizers: false,
            // If set, this function will be used to create the sizers
            createsizers: function($el) {
                $el.append($('<div class="resizer-h resizer-left"></div>'));
                $el.append($('<div class="resizer-h resizer-right"></div>'));
                $el.append($('<div class="resizer-v resizer-top"></div>'));
                $el.append($('<div class="resizer-v resizer-bottom"></div>'));
                $el.append($('<div class="resizer-sq resizer-top-left"></div>'));
                $el.append($('<div class="resizer-sq resizer-bottom-left"></div>'));
                $el.append($('<div class="resizer-sq resizer-top-right"></div>'));
                $el.append($('<div class="resizer-sq resizer-bottom-right"></div>'));
            },
            // If set, this is the class which will be set for the object while being moved
            classsizing: 'sizing',
            // If set, this function will be called upon start grabbing the object
            callbackstart: function() {},
            // If set, this function will be called upon end grabbing the object
            callbackend: function() {},
            // If set, this function will be called upon moving the object
            callbacksize: function(dx, dy) {},
        }

        // This is the handler for the movement, which basically calculates the new offset for the element
        function on_document_mousemove(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();

            let sizable = $el.get(0)._sizable;

            // Calculate the amount of space moved
            let diffx = e.clientX - sizable.initial.x0 + $('body').scrollLeft();
            let diffy = e.clientY - sizable.initial.y0 + $('body').scrollTop();

            // Calculate the new position of the element to be sized (according to the delta multipliers and the initial position)
            let position = sizable.initial.position;
            let parent = sizable.initial.parent;
            let offset = {
                top: position.top - parent.top + diffy * sizable.deltas.dy,
                left: position.left - parent.left + diffx * sizable.deltas.dx,
            }
            sizable.$sized.offset(offset);

            // Calculate the width and height according to the delta multipliers and the size moved
            let width = position.width + diffx * sizable.deltas.dw;
            if (width > 0) {
                sizable.$sized.width(width);
            }
            let height = position.height - diffy * sizable.deltas.dh;
            if (height > 0) {
                sizable.$sized.height(height);
            }

            // Callback if needed
            sizable.$sized.get(0).dispatchEvent(new CustomEvent('sizable-size', { detail: { sized: sizable.$sized }}));
            if (typeof sizable.settings.callbacksize === 'function') {
                sizable.settings.callbacksize.bind(sizable.$sized)(diffx, diffy);
            }
        };

        function on_document_mouseup(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();

            let sizable = $el.get(0)._sizable;

            // Remove the mouse handlers
            $(document).off('mousemove', sizable.handlers.document_mousemove);
            $(document).off('mouseup', sizable.handlers.document_mouseup);

            // Remove the sizing class (if needed)
            if (sizable.settings.classsizing !== null)
                $el.removeClass(sizable.settings.classsizing);

            // Call the callback if needed
            sizable.$sized.get(0).dispatchEvent(new CustomEvent('sizable-end', { detail: { sized: sizable.$sized }}));
            if (typeof sizable.settings.callbackend === 'function') {
                sizable.settings.callbackend.bind(sizable.$sized)();
            }
        };

        function on_mousedown(e, $el) {
            if (e.which !== 1) {
                return;
            }

            e.preventDefault();
            e.stopImmediatePropagation();

            let sizable = $el.get(0)._sizable;

            if (sizable.settings.classsizing !== null)
                $el.addClass(sizable.settings.classsizing);

            sizable.initial.x0 = e.clientX + $('body').scrollLeft();;
            sizable.initial.y0 = e.clientY + $('body').scrollTop();;

            let position = sizable.$sized.offset();
            position.width = sizable.$sized.width();
            position.height = sizable.$sized.height();

            sizable.initial.position = position;

            if (["absolute", "fixed"].indexOf($el.css("position")) !== 1) {
                let offset = sizable.$sized.parent().offset();
                position.left += offset.left;
                position.top += offset.top;
                sizable.initial.parent.left = offset.left;
                sizable.initial.parent.top = offset.top;
            }

            sizable.$sized.get(0).dispatchEvent(new CustomEvent('sizable-start', { detail: { sized: sizable.$sized }}));
            if (typeof sizable.settings.callbackstart === 'function') {
                sizable.settings.callbackstart.bind(sizable.$sized)();
            }

            $(document).on('mousemove', sizable.handlers.document_mousemove);
            $(document).on('mouseup', sizable.handlers.document_mouseup);
        }

        class Sizer {
            constructor($el, $sized, settings, dx, dy, dw, dh) {
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
                this.initial = {
                    position: { left: 0, top: 0, width: 0, height: 0 },
                    parent: { left: 0, top: 0 },
                    x0: 0, y0: 0
                }
                this.deltas = {
                    dx: dx,
                    dy: dy,
                    dw: dw,
                    dh: dh
                };
                this.$el = $el;
                this.$sized = $sized;
            }
            activate() {
                this.$el.on('mousedown', this.handlers.mousedown);
            }
            deactivate() {
                this.$el.off('mousedown', this.handlers.mousedown);
                $('document').off('mousemove', this.handlers.document_mousemove);
                $('document').off('mouseup', this.handlers.document_mouseup);
            }
        }

        class Sizable {
            constructor($el, settings) {
                this.settings = $.extend({}, defaults, settings);
                this.$el = $el;
                this.sizers = [];
            }
            activate() {
                let $this = this.$el;
                this.sizers.push(
                    ...$this.find('.resizer-left').map(function() {
                        this._sizable = new Sizer($(this), $this, options, 1, 0, -1, 0);
                        return this._sizable;
                    }),
                    ...$this.find('.resizer-right').map(function() {
                        this._sizable = new Sizer($(this), $this, options, 0, 0, 1, 0);
                        return this._sizable;
                    }),
                    ...$this.find('.resizer-top').map(function() {
                        this._sizable = new Sizer($(this), $this, options, 0, 1, 0, 1);
                        return this._sizable;
                    }),
                    ...$this.find('.resizer-bottom').map(function() {
                        this._sizable = new Sizer($(this), $this, options, 0, 0, 0, -1);
                        return this._sizable;
                    }),
                    ...$this.find('.resizer-top-left').map(function() {
                        this._sizable = new Sizer($(this), $this, options, 1, 1, -1, 1);
                        return this._sizable;
                    }),
                    ...$this.find('.resizer-top-right').map(function() {
                        this._sizable = new Sizer($(this), $this, options, 0, 1, 1, 1);
                        return this._sizable;
                    }),
                    ...$this.find('.resizer-bottom-left').map(function() {
                        this._sizable = new Sizer($(this), $this, options, 1, 0, -1, -1);
                        return this._sizable;
                    }),
                    ...$this.find('.resizer-bottom-right').map(function() {
                        this._sizable = new Sizer($(this), $this, options, 0, 0, 1, -1);
                        return this._sizable;
                    }),
                );                
                for (let sizer of this.sizers) {
                    sizer.activate();
                }
            }
            deactivate() {
                // Remove the sizers
                for (let sizer of this.sizers) {
                    sizer.deactivate();
                    delete sizer._sizable;
                }
            }
        };

        el.each(function() {
            if (this._sizable !== undefined) {
                this._sizable.deactivate();
                delete this._sizable;
            }

            let globaloptions = $.extend({}, defaults, options);
            if (globaloptions.autoaddsizers) {
                globaloptions.createsizers($(this));
            }

            // Why options are set in the object: just in case that we have declarative options
            this._sizable = new Sizable($(this), options);
            this._sizable.activate();
        })
    }    
    exports.jsutillib.sizable = sizable;
})(window, document);