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

    function selectable(el, options = {}) {
        /** This is the shorthand to remove the selectability of the element */
        if (options === false) {
            this.each(function() {
                if (this._selectable !== undefined) {
                    // Remove the handlers, if defined
                    this._selectable.deactivate();
                    delete this._selectable;
                }
            });
            return el;
        }

        let defaults = {
            // Function called to create the object that will act as the selection
            creatediv: () => $('<div id="selection" class="selection"></div>'), 
            // Callback function to be called when the selection drawing has been moved
            callbackmove: function(dx, dy) {},
            // Callback function to be called when the selection is being created (if false, the selection will not be created)
            callbackstart: (x, y) => true,
            // Callback function to be called when the selection has been created
            callbackend: function(x, y, w, h) {},
            // If true, the created selection will be automatically appended to the element
            autoappend: true,
            // Min width and height for the selection
            minw: 20,
            minh: 20,
            // The default size for the selection
            defaultsize: {w: 100, h: 100},
        }

        function on_document_mousemove(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();

            let selectable = $el.get(0)._selectable;

            let dx = e.clientX - selectable.initial.x0 + $('body').scrollLeft();
            let dy = e.clientY - selectable.initial.y0 + $('body').scrollTop();
            let x = selectable.initial.x0;
            let y = selectable.initial.y0;
            
            if (dx < 0) {
                dx = -dx;
                x = selectable.initial.x0 - dx;
            }
            if (dy < 0) {
                dy = -dy;
                y = selectable.initial.y0 - dy;
            }

            selectable.$selection.offset({left: x, top: y}).width(dx).height(dy);

            $el.get(0).dispatchEvent(new CustomEvent('selectable-move', { detail: { selection: selectable.$selection }}));
            if (typeof selectable.settings.callbackmove === 'function') {
                selectable.settings.callbackmove.bind($el)(dx, dy);
            }
        }

        function on_document_mouseup(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();

            // Get the structure
            let selectable = $el.get(0)._selectable;

            // Remove the handlers
            $(document).off('mousemove', selectable.handlers.document_mousemove);
            $(document).off('mouseup', selectable.handlers.document_mouseup);

            // Get the appropriate coordinates (positive)
            let x0 = selectable.initial.x0;
            let y0 = selectable.initial.y0;
            let dx = e.clientX - x0 + $('body').scrollLeft();
            let dy = e.clientY - y0 + $('body').scrollTop();

            if (dx < 0) {
                dx = -dx;
                x0 = selectable.initial.x0 - dx;
            }
            if (dy < 0) {
                dy = -dy;
                y0 = selectable.initial.y0 - dy;
            }

            // If there was a small movement, let's check whether there is a default selection size
            if ((dx < selectable.settings.minw) || (dy < selectable.settings.minh)) {
                if (selectable.settings.defaultsize !== undefined) {
                    if ((selectable.settings.defaultsize.w !== undefined) && (selectable.settings.defaultsize.h !== undefined)) {
                        dx = selectable.settings.defaultsize.w;
                        dy = selectable.settings.defaultsize.h;
                        if ((selectable.settings.defaultsize.x !== undefined) && (selectable.settings.defaultsize.y !== undefined)) {
                            x0 = selectable.settings.defaultsize.x;
                            y0 = selectable.settings.defaultsize.y;
                        } else {
                            x0 = x0 - (dx / 2);
                            y0 = y0 - (dy / 2);
                        }
                    }
                }                
            }

            // If the size of the selection is too small, let's remove it
            if ((dx < selectable.settings.minw) || (dy < selectable.settings.minh)) {
                selectable.$selection.remove();
                selectable.$seleccion = null;
                return;
            }

            // Place the selection in its final position
            selectable.$selection.offset({left: x0, top: y0}).width(dx).height(dy);

            $el.get(0).dispatchEvent(new CustomEvent('selectable-end', { detail: { selection: selectable.$selection }}));
            if (typeof selectable.settings.callbackend === 'function') {
                selectable.settings.callbackend.bind(selectable.$selection)(x0, y0, dx, dy);
            }
        }

        function on_mousedown(e, $el) {
            if (e.which !== 1)
                return;

            e.preventDefault();
            e.stopImmediatePropagation();

            let selectable = $el.get(0)._selectable;

            selectable.initial.x0 = e.clientX + $('body').scrollLeft();
            selectable.initial.y0 = e.clientY + $('body').scrollTop();

            if (typeof selectable.settings.callbackstart === 'function') {
                if (selectable.settings.callbackstart.bind($el)(selectable.initial.x0, selectable.initial.y0) === false)
                    return;
            }

            // Ahora creamos el div de seleccion, pero solo la parte parcial, y lo añadimos a la pagina
            let $selection = selectable.settings.creatediv();
            if (selectable.settings.autoappend) {
                $el.append($selection);
            }

            // Creamos el div inicialmente en la posicion del raton y cambiaremos el tamaño segun se mueva
            $selection.offset({left: selectable.initial.x0, top: selectable.initial.y0});

            // Añadimos el objeto recien creado
            selectable.$selection = $selection;

            // Añadimos los manejadores de eventos
            $(document).on('mousemove', selectable.handlers.document_mousemove);
            $(document).on('mouseup', selectable.handlers.document_mouseup);

            $el.get(0).dispatchEvent(new CustomEvent('selectable-start', { detail: { selection: selectable.$selection }}));
        }

        class Selectable {
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
                this.initial = {
                    x0: 0,
                    y0: 0
                };
                this.$el = $el;
                this.$selection = null;
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
            if (this._selectable !== undefined) {
                this._selectable.deactivate();
                delete this._selectable;
            }

            this._selectable = new Selectable($this, options);
            this._selectable.activate();
        })

        return el;
    }

    exports.jsutillib.selectable = selectable;
})(window, document);