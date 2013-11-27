/**
 * Really Simple Color Picker in jQuery
 *
 * Licensed under the MIT (MIT-LICENSE.txt) licenses.
 *
 * Copyright (c) 2008-2012
 * Lakshan Perera (www.laktek.com) & Daniel Lacy (daniellacy.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to
 * deal in the Software without restriction, including without limitation the
 * rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
 * sell copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

(function ($) {
    /**
     * Create a couple private variables.
    **/
    var selectorOwner,
        activePalette,
        cItterate       = 0,
        templates       = {
            control : $('<div class="colorPicker-picker">&nbsp;</div>'),
            palette : $('<div id="colorPicker_palette" class="colorPicker-palette" />'),
            swatch  : $('<div class="colorPicker-swatch">&nbsp;</div>'),
            hexLabel: $('<label for="colorPicker_hex">Hex</label>'),
            hexField: $('<input type="text" id="colorPicker_hex" />')
        },
        transparent     = "transparent",
        lastColor;

    /**
     * Create our colorPicker function
    **/
    $.fn.colorPicker = function (options) {

        return this.each(function () {
            // Setup time. Clone new elements from our templates, set some IDs, make shortcuts, jazzercise.
            var element      = $(this),
                opts         = $.extend({}, $.fn.colorPicker.defaults, options),
                defaultColor = $.fn.colorPicker.toHex(
                        (element.val().length > 0) ? element.val() : opts.pickerDefault
                    ),
                newControl   = templates.control.clone(),
                newPalette   = templates.palette.clone().attr('id', 'colorPicker_palette-' + cItterate),
                newHexLabel  = templates.hexLabel.clone(),
                newHexField  = templates.hexField.clone(),
                paletteId    = newPalette[0].id,
                swatch, controlText;


            /**
             * Build a color palette.
            **/
            $.each(opts.colors, function (i) {
                swatch = templates.swatch.clone();

                if (opts.colors[i] === transparent) {
                    swatch.addClass(transparent).text('X');
                    $.fn.colorPicker.bindPalette(newHexField, swatch, transparent);
                } else {
                    swatch.css("background-color", "#" + this);
                    $.fn.colorPicker.bindPalette(newHexField, swatch);
                }
                swatch.appendTo(newPalette);
            });


            newHexLabel.attr('for', 'colorPicker_hex-' + cItterate);

            newHexField.attr({
                'id'    : 'colorPicker_hex-' + cItterate,
                'value' : defaultColor
            });

            newHexField.bind("keydown", function (event) {
                if (event.keyCode === 13) {
                    var hexColor = $.fn.colorPicker.toHex($(this).val());
                    $.fn.colorPicker.changeColor(hexColor ? hexColor : element.val());
                }
                if (event.keyCode === 27) {
                    $.fn.colorPicker.hidePalette();
                }
            });

            newHexField.bind("keyup", function (event) {
              var hexColor = $.fn.colorPicker.toHex($(event.target).val());
              $.fn.colorPicker.previewColor(hexColor ? hexColor : element.val());
            });

            $('<div class="colorPicker_hexWrap" />').append(newHexLabel).appendTo(newPalette);

            newPalette.find('.colorPicker_hexWrap').append(newHexField);
            if (opts.showHexField === false) {
                newHexField.hide();
                newHexLabel.hide();
            }

            $("body").append(newPalette);

            newPalette.hide();


            /**
             * Build replacement interface for original color input.
            **/
            newControl.css("background-color", defaultColor);

            newControl.bind("click", function () {
                if( element.is( ':not(:disabled)' ) ) {
                                    $.fn.colorPicker.togglePalette($('#' + paletteId), $(this));
                }
            });

            if( options && options.onColorChange ) {
              newControl.data('onColorChange', options.onColorChange);
            } else {
              newControl.data('onColorChange', function() {} );
            }

            if (controlText = element.data('text'))
                newControl.html(controlText)

            element.after(newControl);

            element.bind("change", function () {
                element.next(".colorPicker-picker").css(
                    "background-color", $.fn.colorPicker.toHex($(this).val())
                );
            });

            element.val(defaultColor);

            // Hide the original input.
            if (element[0].tagName.toLowerCase() === 'input') {
                try {
                    element.attr('type', 'hidden')
                } catch(err) { // oldIE doesn't allow changing of input.type
                    element.css('visibility', 'hidden').css('position', 'absolute')
                }
            } else {
                element.hide();
            }

            cItterate++;
        });
    };

    /**
     * Extend colorPicker with... all our functionality.
    **/
    $.extend(true, $.fn.colorPicker, {
        /**
         * Return a Hex color, convert an RGB value and return Hex, or return false.
         *
         * Inspired by http://code.google.com/p/jquery-color-utils
        **/
        toHex : function (color) {
            // If we have a standard or shorthand Hex color, return that value.
            if (color.match(/[0-9A-F]{6}|[0-9A-F]{3}$/i)) {
                return (color.charAt(0) === "#") ? color : ("#" + color);

            // Alternatively, check for RGB color, then convert and return it as Hex.
            } else if (color.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/)) {
                var c = ([parseInt(RegExp.$1, 10), parseInt(RegExp.$2, 10), parseInt(RegExp.$3, 10)]),
                    pad = function (str) {
                        if (str.length < 2) {
                            for (var i = 0, len = 2 - str.length; i < len; i++) {
                                str = '0' + str;
                            }
                        }

                        return str;
                    };

                if (c.length === 3) {
                    var r = pad(c[0].toString(16)),
                        g = pad(c[1].toString(16)),
                        b = pad(c[2].toString(16));

                    return '#' + r + g + b;
                }

            // Otherwise we wont do anything.
            } else {
                return false;

            }
        },

        /**
         * Check whether user clicked on the selector or owner.
        **/
        checkMouse : function (event, paletteId) {
            var selector = activePalette,
                selectorParent = $(event.target).parents("#" + selector.attr('id')).length;

            if (event.target === $(selector)[0] || event.target === selectorOwner[0] || selectorParent > 0) {
                return;
            }

            $.fn.colorPicker.hidePalette();
        },

        /**
         * Hide the color palette modal.
        **/
        hidePalette : function () {
            $(document).unbind("mousedown", $.fn.colorPicker.checkMouse);

            $('.colorPicker-palette').hide();
        },

        /**
         * Show the color palette modal.
        **/
        showPalette : function (palette) {

            var hexColor = selectorOwner.prev("input").val();

            palette.css({
                top: selectorOwner.offset().top + (selectorOwner.outerHeight()),
                left: selectorOwner.offset().left
            });

            $("#color_value").val(hexColor);

            palette.show();

            $(document).bind("mousedown", $.fn.colorPicker.checkMouse);
        },

        /**
         * Toggle visibility of the colorPicker palette.
        **/
        togglePalette : function (palette, origin) {
            // selectorOwner is the clicked .colorPicker-picker.
            if (origin) {
                selectorOwner = origin;
            }

            activePalette = palette;

            if (activePalette.is(':visible')) {
                $.fn.colorPicker.hidePalette();

            } else {
                $.fn.colorPicker.showPalette(palette);

            }
        },

        /**
         * Update the input with a newly selected color.
        **/
        changeColor : function (value) {
            selectorOwner.css("background-color", value);
            selectorOwner.prev("input").val(value).change();

            $.fn.colorPicker.hidePalette();

            selectorOwner.data('onColorChange').call(selectorOwner, $(selectorOwner).prev("input").attr("id"), value);
        },


        /**
         * Preview the input with a newly selected color.
        **/
        previewColor : function (value) {
            selectorOwner.css("background-color", value);
        },

        /**
         * Bind events to the color palette swatches.
        */
        bindPalette : function (paletteInput, element, color) {
            color = color ? color : $.fn.colorPicker.toHex(element.css("background-color"));

            element.bind({
                click : function (ev) {
                    lastColor = color;

                    $.fn.colorPicker.changeColor(color);
                },
                mouseover : function (ev) {
                    lastColor = paletteInput.val();

                    $(this).css("border-color", "#598FEF");

                    paletteInput.val(color);

                    $.fn.colorPicker.previewColor(color);
                },
                mouseout : function (ev) {
                    $(this).css("border-color", "#000");

                    paletteInput.val(selectorOwner.css("background-color"));

                    paletteInput.val(lastColor);

                    $.fn.colorPicker.previewColor(lastColor);
                }
            });
        }
    });

    /**
     * Default colorPicker options.
     *
     * These are publibly available for global modification using a setting such as:
     *
     * $.fn.colorPicker.defaults.colors = ['151337', '111111']
     *
     * They can also be applied on a per-bound element basis like so:
     *
     * $('#element1').colorPicker({pickerDefault: 'efefef', transparency: true});
     * $('#element2').colorPicker({pickerDefault: '333333', colors: ['333333', '111111']});
     *
    **/
    $.fn.colorPicker.defaults = {
        // colorPicker default selected color.
        pickerDefault : "FFFFFF",

        // Default color set.
        colors : [

/*
            'dee9f7', 'dcecf8', 'dbecf9', 'dfedf9', 'e5f5fd', 'e4f5fd', 'e4f4f8', 'e4f4f4', 'e3f3ef', 'def0ea', 'deeee5',
            'dfefe3', 'e0f0e3', 'e6f2e2', 'eef5e1', 'f5f8df', 'fbf8dd', 'fbfadd', 'fcfadd', 'fff7d6', 'fff3e1',
            'fff3e3', 'fff0e8', 'fdeaed', 'fdeaee', 'fdeaf2', 'fdebf3', 'f7ebf2', 'f6eaf3', 'efe6f2', 'eae5f2',
            'e6e4f2', 'e5e4f2', 'd6e1f3', 'd1e4f5', 'cde4f7', 'cfecfb', 'ceedfc', 'd0ecfb', 'cfecf6', 'cfebef',
            'cfeae6', 'c9e7dd', 'cae6d7', 'c8e6d2', 'cbe5d1', 'd4eacf', 'e0eecd', 'edf2c8', 'f9f7c6', 'fbf7c4',
            'fff3ba', 'feeaca', 'ffe9d0', 'fde3d7', 'fbd9e1', 'fbd8e0', 'fbd9e3', 'fcdae2', 'fbdae5', 'fcdce6',
            'fbdcea', 'f4dceb', 'eedaea', 'e5d7ea', 'dbd4e9', 'd6d1e9', 'e5c1dc', 'f0c5dd', 'f9cade', 'f9c8dc',
            'f9c3d4', 'f9c1d1', 'f8bbca', '9ad9f3', '98d8f7', '97d1f2', '97caed', '9fc7ea', 'a0c4e8', 'e2ecb5',
            'f2f2b3', 'fcf5b5', 'fef6b5', 'ffe6aa', 'fed7ad', 'fdd7bf', 'fbc4ba', 'f8b5c2',	'f6b7c6', '9cb6df',
            '95acd9', 'babadd', 'a3a1cf', 'd4d1e9', 'bbcdea', 'c0d2ec', 'b5d0ed', 'add4ef', 'a9d6f3', 'aad9f4',
            'ade0f9', 'b7e3f0', 'b6e2e4', 'b4e0d9', 'b2dece', 'b4dcc6', 'b1dcc2', 'b7debf', 'bfe0bc', 'd1e5b8',
            '9fdae8', 'a6dadc', 'a1d6cf', '9dd5bd', 'a3d5b4', 'a5d5af', 'aed9ac', 'c3e0ab', 'd8e6a7', 'edeea6',
            'fef6a6', 'ffefa9', 'ffe0a6', 'fdd1a7', 'fccdb4', 'f9bab0', 'f6aab4', 'f7adb9', 'f7aebf', 'f7b0c3',
            'f7b4c8', 'f7b3ce', 'f5b5d0', 'dbabcf', 'cba9d0', 'b7a5d0', 'a9a0ce', '768ac5', '7997ce', '8db4df',
            '89bae4', '84bfe8', '85caf0', '83d1f5', '8ed4e7', '8dd1dd', '8dd0c7', '8fceb6', '90ceac', '91cda6',
            '99d0a6', 'a8d5a4', 'b9dca3', 'd2e5a2', 'e8eb9d', 'fef5a1', 'fee59d', 'ffdd9d', 'fdcc9f', 'fbc5ac',
            'f9b6a8', 'f7a6b0', 'f6a5b1', 'f6a6b5', 'f6a6ba', 'f6a6bf', 'f6a7c5', 'f4a7c8', 'eaa3c8', 'd8a0c7',
            'bf98c5', 'a995c6', '9992c5', '9693c7', '576cb3', '5a7abb', '729ad0', '6aa4d9', '6cb5e4', '6bc2ed',
            '62c8f3', '71cbde', '76c9ca', '7ac8b9', '7dc7a9', '7ec5a3', '7dc597', '89ca97', '99cf94', 'add593',
            'c9e096', 'e6ea91', 'fef491', 'fee691', 'ffd991', 'fdc894', 'fbbe9d', 'f8a997', 'f5969e', 'f595a0',
            'f595a6', 'f596ac', 'f497b4', 'f498ba', 'f497bf', 'e794be', 'd38ebd', 'b98abe', 'a086be', '8c83be',
            '8582be', '3e59a6', '3f68b1', '537fc1', '5395d0', '46a8df', '40b8ea', '46c1f0', '51c3db', '5dc3c5',
            '62c1b0', '65c0a1', '65c094', '68bf8a', '7cc48a', '8dca87', 'a7d185', 'cde18d', 'e4e582', 'fdf383',
            'fee881', 'ffd781', 'fdc485', 'fab38a', 'f79d89', 'f4848d', 'f28390', 'f38598', 'f3859f', 'f386a8',
            'f388b0', 'f287b4', 'e684b3', 'd181b5', 'b57db5', '9978b6', '8075b6', '7473b5', '27499a', '275ba8',
            '346bb4', '408ac9', '379ed8', '24afe5', '22bbee', '07bae9', '2cb9ca', '36b59e', '3eb590', '43b483',
            '46b476', '5eba76', '82c57c', '9bcc79', 'c8de83', 'e0e575', 'fdf176', 'fee273', 'ffcc6e', 'fbb774',
            'f89d6c', 'f58c73', 'f27276', 'f26f75', 'f06d7b', 'f07089', 'ef7195', 'ef729e', 'ef6ba4', 'e16ea7',
            'c76da8', 'a86aa9', '906cad', '7569ac', '6466ae', '214292', '253e8f', '2156a4', '0c5ca8', '1077be',
            '0e8ece', '18a5de', '25b1e6', '00b3d2', '00b1b7', '00b09d', '01ae88', '00ac74', '2cb06b', '48b465',
            '6ebd61', '8fc65f', 'c2da60', 'dbe150', 'fdf05a', 'fbcf46', 'fcb545', 'f89b4b', 'f5854b', 'f16c4a',
            'ef534d', 'f05255', 'f05360', 'f0546b', 'ee567d', 'ee5289', 'ec4593', 'da5496', 'c15297', '9e5098',
            '7c519c', '59509d', '454f9e', '253e8f', '164998', '0257a5', '0a66b2', '117bc0', '2293d1', '2da6df',
            '00a8d2', '03a5aa', '00a38b', '00a373', '00a15c', '00a554', '0aa74b', '46b149', '73bd44', 'b8d134',
            'dae02c', 'fdee20', 'f6c21e', 'faa620', 'f68523', 'f26a26', 'ee4b24', 'ec2d2a', 'ee2934', 'ea2942',
            'eb2b52', 'eb2964', 'ea2574', 'ec008c', 'd22482', 'b92c85', '97338a', '6c388e', '3e3b92', '243f92',
            '263d8b', '1e4593', '074e9d', '035aa8', '0e6eb7', '1b86c8', '2ca3dc', '00a3c1', '00a199', '009f7b',
            '009e63', '019d50', '009d49', '09a34a', '1aa94a', '54b448', 'a1c93a', 'c9d82c', 'fff200', 'f7ba17',
            'f7911e', 'f36e21', 'ee5423', 'eb3824', 'ed1c24', 'ea1d28', 'ea1c33', 'ea1a42', 'ea1754', 'ea116a',
            'e80982', 'cb187b', '832b85', '273b8b', '293a85', '253e89', '054f9a', '0057a3', '0563ac', '2592d0',
            '0094c0', '009690', '00957a', '02956d', '00954c', '009448', '009347', '3d9d46', '5aa445', '80ad41',
            'b2bd36', 'f7ce0e', 'f5ab1c', 'ee8722', 'e86824', 'e45025', 'e32e26', 'e11f26', 'e01f27', 'de1d3a',
            'dc1d41', 'db1c50', 'da1570', 'd9117b', 'c51a7c', '95257f', '7e2980', '692c82', '3c3186', '283a87',
            '29377d', '253c81', '144b93', '005199', '0059a3', '0c71b9', '047dad', '008286', '008477', '06846b',
            '008648', '068743', '078944', '408840', '5e913f', '75973d', '91a13a', 'ecad20', 'e38b25', 'de7026',
            'd95e27', 'ce4727', 'd02927', 'cb2127', 'c4202e', 'c32035', 'bf1f3f', 'bd1e62', 'b81f6f', 'a7216f',
            '842675', '732876', '5d2b7a', '352e7e', '29377e', '273777', '1d4486', '154a8f', '005297', '066cb5',
            '1176bd', '006ba3', '037185', '026b6c', '007164', '017643', '01773d', '05773d', '3b7639', '627b36',
            '738135', '858935', 'e39925', 'd77228', 'cb5f28', 'c75127', 'b63926', 'b42625', 'b42025', 'b22024',
            'aa1e2d', 'a81e33', 'a21c3b', '9e1e58', '992062', '8a2164', '76256c', '6a266d', '5a286f', '352c73',
            '293272', '282f6b', '28326f', '20417f', '1c4585', '144a8c', '0360a9', '005d9a', '02617b', '01626f',
            '016463', '00693f', '016a37', '0d6a37', '396430', '59672d', '706e2d', '82762f', 'b8752a', 'c45b28',
            'bd5227', 'b13f25', 'b03825', 'a22022', 'a21e22', '9f1e21', '961a2c', '951a30', '8e1835', '881b50',
            '831d58', '7a1d59', '6a2364', '632466', '552567', '30296a', '292e6b', '272c67', '27316c', '223e7a',
            '204180', '1b4687', '00529d', '00549f', '00538b', '025975', '025a68', '005d5b', '016139', '006233',
            '105a2e', '355528', '4c5728', '675c26', '9b5725', '9e4623', '9f3e22', 'a23622', '9b2e21', '8f211d',
            '8b191c', '88181c', '831623', '7f1428', '7b142d', '781649', '771a52', '641d57', '66215f', '5b2261',
            '4e2362', '2b2766', '272c65', '252860', '262c64', '25316a', '243c7a', '1f4388', '1a4790', '1b468d',
            '154474', '014b64', '044e59', '014e50', '015031', '035129', '0d5028', '334d25', '414923', '534923',
            '763c1c', '6f2c1a', '7c2b1a', '802a1a', '7e281a', '7a1b19', '771817', '761619', '741322', '731525',
            '711427', '67173d', '601543', '5b1645', '571e57', '511e58', '491f5a', '27245e', '25275f', '202152',
            '202557', '222d60', '223064', '24346c', '233c79', '213f7d', '173e6c', '07435d', '014451', '064549',
            '04492d', '064925', '174924', '2d4522', '3c4222', '4c411f', '512b19', '542818', '592618', '5f2117',
            '681c16', '681916', '6a181b', '671724', '671527', '62142b', '5e1438', '59143d', '54163e', '451846',
            '3f1848', '361847', '211d51', '202153', '1d1d4e', '1d1e4f', '1e2656', '1e2958', '232d61', '223165',
            '19335d', '0d3354', '0e3442', '083324', '093320', '0d351c', '13331c', '18331b', '25321b', '322f18',
            '3e2d18', '432215', '442215', '492115', '4f2317', '532218', '581e17', '581b17', '581a1a', '571a24',
            '571927', '561829', '501632', '4f1835', '4a1737', '3e183e', '3c1843', '321943', '1e1a4c', '161844',
            '161945', '181c49', '191c4a', '1d2050', '181b48', '161c47', '141f47', '0c213d', '0e222e', '0d2320',
            '0e2417', '102415', '142415', '162415', '1e2214', '232113', '292013', '3a1a11', '3a1911', '371712',
            '351712', '351713', '371613', '381614', '391615', '3c151b', '34131a', '3c141f', '391324', '381326',
            '361429', '2e1531', '2c1535', '291537', '12103b', '181947', '151642', '151641', '131640', '10163e',
            '0c1738', '0d1a26', '081914', '0c1b11', '0e1c0f', '0e1b10', '121a0f', '19170c', '1f120b', '26100c',
            '280f0c', '280e0d', '270e0d', '270e0e', '270e10', '291013', '2a1118', '2b111b', '2d121e', '2c121e',
            '2c1220', '2a1327', '25112f', '1c1239', '13143e', 'f6f6f7', 'ffffff', 'f1f0f1', 'eaeaec', 'e4e5e6',
            'dedfe0', 'd8d9db', 'd3d4d5', 'cccfd0', 'c7c8c9', 'c2c2c5', 'bbbdbf', 'b6b8ba', 'b0b1b4', 'a9abae',
            'a4a5a7', '9d9fa2', '989b9d', '939598', '8e9093', '898b8d', '848588', '7e8083', '7a7c7d', '757679',
            '6e7172', '6a6a6c', '636567', '5d5e60', '58595a', '515253', '4a4a4c', '434345', '3a393b', '2c2b2c',
            '1a1a1b', '000000'
        ],
*/
    'dee9f7', 'dcecf8', 'dbecf9', 'dfedf9', 'e5f5fd', 'e4f5fd', 'e4f4f8', 'e4f4f4', 'e3f3ef', 'def0ea', 'deeee5',
	'dfefe3', 'e0f0e3', 'e6f2e2', 'eef5e1', 'f5f8df', 'fbf8dd', 'fbfadd', 'fcfadd', 'fff7d6', 'fff3e1',
    'fff3e3', 'fff0e8', 'fdeaed', 'fdeaee', 'fdeaf2', 'fdebf3', 'f7ebf2', 'f6eaf3', 'efe6f2', 'eae5f2',
    'e6e4f2', 'e5e4f2', 'd6e1f3', 'd1e4f5', 'cde4f7', 'cfecfb', 'ceedfc', 'd0ecfb', 'cfecf6', 'cfebef',
    'cfeae6', 'c9e7dd', 'cae6d7', 'c8e6d2', 'cbe5d1', 'd4eacf', 'e0eecd', 'edf2c8', 'f9f7c6', 'fbf7c4',
    'fff3ba', 'feeaca', 'ffe9d0', 'fde3d7', 'fbd9e1', 'fbd8e0', 'fbd9e3', 'fcdae2', 'fbdae5', 'fcdce6',
    'fbdcea', 'f4dceb', 'eedaea', 'e5d7ea', 'dbd4e9', 'd6d1e9', 'e5c1dc', 'f0c5dd', 'f9cade', 'f9c8dc',
    'f9c3d4', 'f9c1d1', 'f8bbca', '9ad9f3', '98d8f7', '97d1f2', '97caed', '9fc7ea', 'a0c4e8', 'e2ecb5',
    'f2f2b3', 'fcf5b5', 'fef6b5', 'ffe6aa', 'fed7ad', 'fdd7bf', 'fbc4ba', 'f8b5c2',	'f6b7c6', '9cb6df',
    '95acd9', 'babadd', 'a3a1cf', 'd4d1e9', 'bbcdea', 'c0d2ec', 'b5d0ed', 'add4ef', 'a9d6f3', 'aad9f4',
    'ade0f9', 'b7e3f0', 'b6e2e4', 'b4e0d9', 'b2dece', 'b4dcc6', 'b1dcc2', 'b7debf', 'bfe0bc', 'd1e5b8',
    '9fdae8', 'a6dadc', 'a1d6cf', '9dd5bd', 'a3d5b4', 'a5d5af', 'aed9ac', 'c3e0ab', 'd8e6a7', 'edeea6',
    'fef6a6', 'ffefa9', 'ffe0a6', 'fdd1a7', 'fccdb4', 'f9bab0', 'f6aab4', 'f7adb9', 'f7aebf', 'f7b0c3',
    'f7b4c8', 'f7b3ce', 'f5b5d0', 'dbabcf', 'cba9d0', 'b7a5d0', 'a9a0ce', '768ac5', '7997ce', '8db4df',
    '89bae4', '84bfe8', '85caf0', '83d1f5', '8ed4e7', '8dd1dd', '8dd0c7', '8fceb6', '90ceac', '91cda6',
    '99d0a6', 'a8d5a4', 'b9dca3', 'd2e5a2', 'e8eb9d', 'fef5a1', 'fee59d', 'ffdd9d', 'fdcc9f', 'fbc5ac',
    'f9b6a8', 'f7a6b0', 'f6a5b1', 'f6a6b5', 'f6a6ba', 'f6a6bf', 'f6a7c5', 'f4a7c8', 'eaa3c8', 'd8a0c7',
    'bf98c5', 'a995c6', '9992c5', '9693c7', '576cb3', '5a7abb', '729ad0', '6aa4d9', '6cb5e4', '6bc2ed',
    '62c8f3', '71cbde', '76c9ca', '7ac8b9', '7dc7a9', '7ec5a3', '7dc597', '89ca97', '99cf94', 'add593',
    'c9e096', 'e6ea91', 'fef491', 'fee691', 'ffd991', 'fdc894', 'fbbe9d', 'f8a997', 'f5969e', 'f595a0',
    'f595a6', 'f596ac', 'f497b4', 'f498ba', 'f497bf', 'e794be', 'd38ebd', 'b98abe', 'a086be', '8c83be',
    '8582be', '3e59a6', '3f68b1', '537fc1', '5395d0', '46a8df', '40b8ea', '46c1f0', '51c3db', '5dc3c5',
    '62c1b0', '65c0a1', '65c094', '68bf8a', '7cc48a', '8dca87', 'a7d185', 'cde18d', 'e4e582', 'fdf383',
    'fee881', 'ffd781', 'fdc485', 'fab38a', 'f79d89', 'f4848d', 'f28390', 'f38598', 'f3859f', 'f386a8',
    'f388b0', 'f287b4', 'e684b3', 'd181b5', 'b57db5', '9978b6', '8075b6', '7473b5', '27499a', '275ba8',
	'346bb4', '408ac9', '379ed8', '24afe5', '22bbee', '07bae9', '2cb9ca', '36b59e', '3eb590', '43b483',
 	'46b476', '5eba76', '82c57c', '9bcc79', 'c8de83', 'e0e575', 'fdf176', 'fee273', 'ffcc6e', 'fbb774',
 	'f89d6c', 'f58c73', 'f27276', 'f26f75', 'f06d7b', 'f07089', 'ef7195', 'ef729e', 'ef6ba4', 'e16ea7',
 	'c76da8', 'a86aa9', '906cad', '7569ac', '6466ae', '214292', '253e8f', '2156a4', '0c5ca8', '1077be',
 	'0e8ece', '18a5de', '25b1e6', '00b3d2', '00b1b7', '00b09d', '01ae88', '00ac74', '2cb06b', '48b465',
 	'6ebd61', '8fc65f', 'c2da60', 'dbe150', 'fdf05a', 'fbcf46', 'fcb545', 'f89b4b', 'f5854b', 'f16c4a',
	'ef534d', 'f05255', 'f05360', 'f0546b', 'ee567d', 'ee5289', 'ec4593', 'da5496', 'c15297', '9e5098',
 	'7c519c', '59509d', '454f9e', '253e8f', '164998', '0257a5', '0a66b2', '117bc0', '2293d1', '2da6df',
 	'00a8d2', '03a5aa', '00a38b', '00a373', '00a15c', '00a554', '0aa74b', '46b149', '73bd44', 'b8d134',
 	'dae02c', 'fdee20', 'f6c21e', 'faa620', 'f68523', 'f26a26', 'ee4b24', 'ec2d2a', 'ee2934', 'ea2942',
 	'eb2b52', 'eb2964', 'ea2574', 'ec008c', 'd22482', 'b92c85', '97338a', '6c388e', '3e3b92', '243f92',
 	'263d8b', '1e4593', '074e9d', '035aa8', '0e6eb7', '1b86c8', '2ca3dc', '00a3c1', '00a199', '009f7b',
	'009e63', '019d50', '009d49', '09a34a', '1aa94a', '54b448', 'a1c93a', 'c9d82c', 'fff200', 'f7ba17',
 	'f7911e', 'f36e21', 'ee5423', 'eb3824', 'ed1c24', 'ea1d28', 'ea1c33', 'ea1a42', 'ea1754', 'ea116a',
 	'e80982', 'cb187b', '832b85', '273b8b', '293a85', '253e89', '054f9a', '0057a3', '0563ac', '2592d0',
 	'0094c0', '009690', '00957a', '02956d', '00954c', '009448', '009347', '3d9d46', '5aa445', '80ad41',
 	'b2bd36', 'f7ce0e', 'f5ab1c', 'ee8722', 'e86824', 'e45025', 'e32e26', 'e11f26', 'e01f27', 'de1d3a',
 	'dc1d41', 'db1c50', 'da1570', 'd9117b', 'c51a7c', '95257f', '7e2980', '692c82', '3c3186', '283a87',
 	'29377d', '253c81', '144b93', '005199', '0059a3', '0c71b9', '047dad', '008286', '008477', '06846b',
 	'008648', '068743', '078944', '408840', '5e913f', '75973d', '91a13a', 'ecad20', 'e38b25', 'de7026',
 	'd95e27', 'ce4727', 'd02927', 'cb2127', 'c4202e', 'c32035', 'bf1f3f', 'bd1e62', 'b81f6f', 'a7216f',
 	'842675', '732876', '5d2b7a', '352e7e', '29377e', '273777', '1d4486', '154a8f', '005297', '066cb5',
	'1176bd', '006ba3', '037185', '026b6c', '007164', '017643', '01773d', '05773d', '3b7639', '627b36',
 	'738135', '858935', 'e39925', 'd77228', 'cb5f28', 'c75127', 'b63926', 'b42625', 'b42025', 'b22024',
 	'aa1e2d', 'a81e33', 'a21c3b', '9e1e58', '992062', '8a2164', '76256c', '6a266d', '5a286f', '352c73',
 	'293272', '282f6b', '28326f', '20417f', '1c4585', '144a8c', '0360a9', '005d9a', '02617b', '01626f',
 	'016463', '00693f', '016a37', '0d6a37', '396430', '59672d', '706e2d', '82762f', 'b8752a', 'c45b28',
 	'bd5227', 'b13f25', 'b03825', 'a22022', 'a21e22', '9f1e21', '961a2c', '951a30', '8e1835', '881b50',
 	'831d58', '7a1d59', '6a2364', '632466', '552567', '30296a', '292e6b', '272c67', '27316c', '223e7a',
 	'204180', '1b4687', '00529d', '00549f', '00538b', '025975', '025a68', '005d5b', '016139', '006233',
 	'105a2e', '355528', '4c5728', '675c26', '9b5725', '9e4623', '9f3e22', 'a23622', '9b2e21', '8f211d',
 	'8b191c', '88181c', '831623', '7f1428', '7b142d', '781649', '771a52', '641d57', '66215f', '5b2261',
 	'4e2362', '2b2766', '272c65', '252860', '262c64', '25316a', '243c7a', '1f4388', '1a4790', '1b468d',
 	'154474', '014b64', '044e59', '014e50', '015031', '035129', '0d5028', '334d25', '414923', '534923',
 	'763c1c', '6f2c1a', '7c2b1a', '802a1a', '7e281a', '7a1b19', '771817', '761619', '741322', '731525',
 	'711427', '67173d', '601543', '5b1645', '571e57', '511e58', '491f5a', '27245e', '25275f', '202152',
 	'202557', '222d60', '223064', '24346c', '233c79', '213f7d', '173e6c', '07435d', '014451', '064549',
 	'04492d', '064925', '174924', '2d4522', '3c4222', '4c411f', '512b19', '542818', '592618', '5f2117',
 	'681c16', '681916', '6a181b', '671724', '671527', '62142b', '5e1438', '59143d', '54163e', '451846',
 	'3f1848', '361847', '211d51', '202153', '1d1d4e', '1d1e4f', '1e2656', '1e2958', '232d61', '223165',
 	'19335d', '0d3354', '0e3442', '083324', '093320', '0d351c', '13331c', '18331b', '25321b', '322f18',
 	'3e2d18', '432215', '442215', '492115', '4f2317', '532218', '581e17', '581b17', '581a1a', '571a24',
 	'571927', '561829', '501632', '4f1835', '4a1737', '3e183e', '3c1843', '321943', '1e1a4c', '161844',
 	'161945', '181c49', '191c4a', '1d2050', '181b48', '161c47', '141f47', '0c213d', '0e222e', '0d2320',
 	'0e2417', '102415', '142415', '162415', '1e2214', '232113', '292013', '3a1a11', '3a1911', '371712',
 	'351712', '351713', '371613', '381614', '391615', '3c151b', '34131a', '3c141f', '391324', '381326',
 	'361429', '2e1531', '2c1535', '291537', '12103b', '181947', '151642', '151641', '131640', '10163e',
 	'0c1738', '0d1a26', '081914', '0c1b11', '0e1c0f', '0e1b10', '121a0f', '19170c', '1f120b', '26100c',
 	'280f0c', '280e0d', '270e0d', '270e0e', '270e10', '291013', '2a1118', '2b111b', '2d121e', '2c121e',
 	'2c1220', '2a1327', '25112f', '1c1239', '13143e', 'f6f6f7', 'ffffff', 'f1f0f1', 'eaeaec', 'e4e5e6',
 	'dedfe0', 'd8d9db', 'd3d4d5', 'cccfd0', 'c7c8c9', 'c2c2c5', 'bbbdbf', 'b6b8ba', 'b0b1b4', 'a9abae',
 	'a4a5a7', '9d9fa2', '989b9d', '939598', '8e9093', '898b8d', '848588', '7e8083', '7a7c7d', '757679',
 	'6e7172', '6a6a6c', '636567', '5d5e60', '58595a', '515253', '4a4a4c', '434345', '3a393b', '2c2b2c',
 	'1a1a1b', '000000', 
						],

        // If we want to simply add more colors to the default set, use addColors.
        addColors : [],

        // Show hex field
        showHexField: true
    };

})(jQuery);