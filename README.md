# Selection Utilities (part of jsutilslib)

_Selection Utilities_ is a set of javascript components that enable to have components in which _draw selections_, _make html elements grabbable_ to be moved around the page, and also make _div resizable_.

_Selection Utilities_ can be used by themselves in your web applications, but they are also part of [`jsutilslib`](https://github.com/jsutilslib/jsutilslib), which is a library that consists of a set of curated components, utility functions, clases, etc. that are flexible enough to be re-used in different javascript applications.

> Some parts of the library are intended to be used in conjunction with jQuery, and so it is advisable to include jQuery in your project prior to including jsutilslib.

## Selection Utilities
The library consists of the next utilities:

- _selectable_: makes one div to be selectable (i.e. enables to draw a selection)
- _grabbable_: makes an object to be grabbable (i.e. the object can be grabbed using the mouse and the moved around)
- _sizable_: makes a div to be sizable (i.e. if sizers are present, the size is changed moving these sizers; tipically top, bottom, left, right...)

## Using

There are a set of _javascript_ files that contain a part of the library, each one (in folder `js`). These files can be used individually or combined into a single one, by concatenating them (or by using `uglify-js`).

There are also a set of _css_ files that contain some styles to be used with the library. These files can also be included individually in your project, or combined into a single file by concatenating them (or by using `clean-css`).

A `Makefile` is provided to create the single all-in-one `js` and `css` files for the library.

```console
# npm install -g uglify-js clean-css-cli
...
# git clone https://github.com/jsutilslib/common
# cd common
# make
uglifyjs js/*.js  -b | cat notice - > common.js
uglifyjs js/*.js  | cat notice.min - > common.min.js
# git clone https://github.com/jsutilslib/selection
# cd selection
# make
uglifyjs js/*.js  -b | cat notice - > selection.js
uglifyjs js/*.js  | cat notice.min - > selection.min.js
cleancss css/*.css --format beautify | cat notice - > selection.css
cleancss css/*.css | cat notice.min - > selection.min.css
```

Now you can use files `common.min.js`, `selection.min.js` and `selection.min.css` in your project (jQuery is a prerrequisite):

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="common.min.js"></script>
<script src="selection.min.js"></script>
<link rel="stylesheet" href="selection.min.css">
```

> Library `jsutilslib/common` is a prerrequisite for this library.

### From a CDN

It is possible to use `selection` directly from a CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/jsutilslib/common@1.0.0-beta/common.min.js"></script>
<script src="https://cdn.jsdelivr.net/gh/jsutilslib/selection@1.0.0-beta/selection.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/jsutilslib/selection@1.0.0-beta/selection.min.css">
```

## Selectable

In order to make an object to be selectable, it is needed a code like the next one:

```html
<div class="w-100 h-50 selectable"></div>
<script>
jsutilslib.selectable($('.selectable')
</script>
```

The code will allow multiple selections to be created. If you only want one selection to exist, the alternative is to provide a callback to be executed upon start selecting:

```html
<div class="w-100 h-50 selectable"></div>
<script>
jsutilslib.selectable($('.selectable'), {
    callbackstart: function () {
        $(this).find('.selection').remove();
    }
})
<script>
```

The full list of options that `jsutilslib.selectable` accepts are the next:

- _creatediv_: is the function used to create the div that will act as the selection. Default: `() => $('<div id="selection" class="selection"></div>')`
- _callbackstart_: is a function that will be called prior to starting the selection. If returns false, the selection will not be created. Default: `(x0, y0) => true`
- _callbackmove_: is a function that will be called when the selection has changed its size (while is being drawn). Default: `(dx, dy) => null`
- _callbackend_: is a function that will be called when the selection has been finally created. Default: `(x, y, w, h) => null`
- _autoappend_: if true, the selection will be automatically appended to the selectable element. Default: `true`
- _minw_: the minimal width valid for the selection (if the user drawed less, the selection will be discarded). Default: `20`
- _minh_: the minimal height valid for the selection (if the user drawed less, the selection will be discarded). Default: `20`
- _defaultsize_: the default size for the selection, if the selection drawn by the user is to be discarded. Default: `{w: 100, h: 100}`

### Events
The selectable element will trigger the next events:
- _selectable-start_:
- _selectable-move_:
- _selectable-end_:

## Grabbable

```html
<div class="w-100 h-50 selectable"><div class="selection" style="top:10;left:10;width:100;height:100;"></div></div>
<script>
jsutilslib.grabbable($('.selection'));
</script>
```

The full list of options that `jsutilslib.grabbable` accepts are the next:

- _classdragging_: If set, this is the class which will be set for the object while being moved. Default: `grabbing`
- _callbackstart_: is a function that will be called when the object has been grabbed to be moved. Default: `() => {}`
- _callbackmove_: is a function that will be called when the object has changed its position. Default: `(dx, dy) => null`
- _callbackend_: is a function that will be called when the object has been released while being grabbed. Default: `() => {}`

### Events
The grabbable element will trigger the next events:
- _grabbable-start_:
- _grabbable-move_:
- _grabbable-end_:

## Sizable

```html
<div class="w-100 h-50 selectable"><div class="selection sizable" style="top:10;left:10;width:100;height:100;"></div></div>
<script>
jsutilslib.sizable($('.sizable'),{ autoaddsizers: true});
</script>
```

The full list of options that `jsutilslib.sizable` accepts are the next:

- _autoaddsizers_: If set, a set of divs will be added to the object to be sized. Default: `false`
- _createsizers_: Is a function to be called to append the sizers to the object. Default: _a function that creates the 8 common sizers_
- _classsizing_: If set, this is the class which will be set for the object while being sized. Default: `sizing`

- _callbackstart_: is a function that will be called when a sizer is clicked to start sizing the object. Default: `() => {}`
- _callbackmove_: is a function that will be called when the object has changed its size. Default: `(dx, dy) => null`
- _callbackend_: is a function that will be called when the object ends its re-sizing. Default: `() => {}`

### Events

The grabbable element will trigger the next events:
- _sizable-start_:
- _sizable-size_:
- _sizable-end_:
