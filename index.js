/*
  Copyright (C) 2014 Yusuke Suzuki <utatane.tea@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:

    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
  AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
  IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
  ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
  THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function () {
    'use strict';

    var map = require('map-stream'),
        esprima = require('esprima'),
        esmangle = require('esmangle'),
        escodegen = require('escodegen'),
        clone = require('clone');

    function minify(code, options) {
        var tree, licenses, condition, formatOption;

        options = options || {};

        tree = esprima.parse(code, {
            loc: true,
            range: true,
            raw: true,
            tokens: true,
            comment: true
        });

        if (options.license) {
            if (!options.licenseRegExp) {
                condition = /@(?:license|preserve)|copyright/i;
            } else {
                condition = options.licenseRegExp;
            }
            licenses = tree.comments.filter(function (comment) {
                return (condition).test(comment.value);
            });
        } else {
            licenses = [];
        }

        tree = esmangle.optimize(tree, null, {
            destructive: true,
            directive: true,
            preserveCompletionValue: false
        });
        tree = esmangle.mangle(tree, {
            destructive: true
        });

        tree.leadingComments = licenses;

        formatOption = clone(escodegen.FORMAT_MINIFY);
        formatOption.indent.adjustMultilineComment = true;

        return escodegen.generate(tree, {
            format: formatOption,
            directive: true,
            comment: true
        });
    }

    module.exports = function (opt) {
        return map(function (file, callback) {
            try {
                file.contents = new Buffer(minify(String(file.contents), opt));
            } catch(e) {
                console.warn('Error caught from esmangle: ' + e.message + '. Returning unminified code');
            }
            callback(null, file);
        });
    };
    module.exports.minify = minify;
}());
/* vim: set sw=4 ts=4 et tw=80 : */
