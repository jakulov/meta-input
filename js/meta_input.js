(function ( $ ) {
    /**
     * Meta Input
     * @link http://github.com/jakulov/meta_input
     * @author Yakov Akulov
     * @email jakulov@gmail.com
     * @param options
     * @returns {jQuery}
     */
    $.fn.meta_input = function( options ) {

        this.options = $.extend({
            multiple: false,
            ajax: '',
            match: ['name'],
            matchFirst: false,
            filterSame: true,
            limit: 100,
            inputTimeout: 400,
            select: false,
            suggestTemplate: '{{name}}',
            customValues: false,
            selectPlaceholder: 'Type to filter',
            data: [],
            value: null
        }, options );

        if(this.length > 1) {
            this.each(function(){
                $(this).meta_input(options);
            });
            return this;
        }

        /**
         * @private
         */
        this._init = function() {
            if(self.options.required) {
                self._input.prop('required', true);
            }
            if(self.options.select) {
                self._wrap.find('.mi-input').append('<div class="dropdown">');
                self._wrap.find('.dropdown').on('click', function(e){
                    if(self._wrap.find('.mi-suggest').is(':visible')) {
                        self._input.blur();
                        self.closeSuggest();
                    }
                    else {
                        self._input.focus();
                        e.stopPropagation();
                        e.preventDefault();
                    }
                });
                self._input.on('click', function(e){
                    e.stopPropagation();
                    e.preventDefault();
                });
            }



            self._wrap.find('tr').prepend('<td class="mi-selected">');
            self._wrap.find('.mi-input').append($('<div class="mi-suggest">'));
            self._resetStyle();

            self.setValue(self.options.value);

            self._input.on('keypress', function(){
                if(self.requestTimeout) {
                    window.clearTimeout(self.requestTimeout);
                }
                self.requestTimeout = window.setTimeout(function(){
                    self.showSuggest();
                }, 400);
            });

            self._input.on('keydown', function(event) {
                if(event.keyCode == 40 || event.keyCode == 38) {
                    // up down
                    event.stopPropagation();
                    event.preventDefault();
                    self.navigate(event.keyCode == 40);
                }
                else if(event.keyCode == 27) {
                    // esc
                    self.closeSuggest();
                }
                else if(event.keyCode == 13) {
                    // enter
                    self.selectItem();
                }
                else if(event.keyCode == 8) {
                    // backspace
                    if(!$(this).val()) {
                        self.removeSelected();
                    }
                    if($(this).val().length <= 1 && !self.options.select) {
                        self.closeSuggest();
                    }
                    if($(this).val().length > 1) {
                        if(self.requestTimeout) {
                            window.clearTimeout(self.requestTimeout);
                        }
                        self.requestTimeout = window.setTimeout(function(){
                            self.showSuggest();
                        }, 400);
                    }
                }
            });
            self._input.on('focus', function(e){
                if(self.options.select) {
                    $(this).attr('placeholder', self.options.selectPlaceholder);
                    self.showSuggest();
                    e.stopPropagation();
                    e.preventDefault();
                }
            });
            self._wrap.on('mouseover', '.mi-si', function(e) {
                self._wrap.find('.mi-si').removeClass('active');
                $(this).addClass('active');
            });
            self._wrap.on('click', '.mi-si', function(e) {
                self.selectItem();
                if(self.options.multiple) {
                    self._input.focus();
                }
            });
            self._wrap.on('click', '.mi-sg-rm', function(e) {
                $(this).closest('.mi-sg').remove();
                self._input.focus();
                self._fixWidth();
            });

            $('body').on('click', function(e){
                self.closeSuggest();
            });
        };

        /**
         * @private
         */
        this._resetStyle = function() {
            self._input.
                css('display', 'block').
                css('border', 'none').
                css('outline', 'none').
                css('box-shadow', 'none');
        };

        /**
         * show suggest items
         */
        this.showSuggest = function() {
            var term = self._input.val().toLocaleLowerCase();
            if(term || self.options.select) {
                if(!self.termCache[term]) {
                    self._requestTermData(term);
                }
                else {
                    self._displayTermData(self.termCache[term]);
                }
            }
        };

        /**
         * Set active item as value
         */
        this.selectItem = function() {
            var current = self._wrap.find('.mi-si.active');
            if(current.length) {
                if(!self.options.multiple) {
                    self.removeSelected();
                }
                self._addValueItem(current.data('id'), current.data('label'));
                self._input.val('');
                self.closeSuggest();
                if(!self.options.multiple) {
                    self._input.blur();
                }
                if(self.options.select) {
                    self._input.attr('placeholder', '');
                }
            }
            else if(self.options.customValues) {
                if(self._input.val()) {
                    if(!self.options.multiple) {
                        self.removeSelected();
                    }
                    self._addValueItem(self._input.val(), self._input.val());
                    self._input.val('');
                    self.closeSuggest();
                    if(!self.options.multiple) {
                        self._input.blur();
                    }
                }
            }
        };

        /**
         * @param value
         * @param label
         * @private
         */
        this._addValueItem = function(value, label) {
            var vi = $(
                '<div class="mi-sg" id="'+ self._getValueItemId(1) +'"><div class="mi-sg-label">'+ label +'</div><div class="mi-sg-rm">&times;</div>' +
                '<input type="hidden" name="'+ self._name +'" value="'+ value +'"></div>'
            );
            self._wrap.find('.mi-selected').append(vi);
            self._fixWidth();
        };

        /**
         * @param inc
         * @returns {string}
         * @private
         */
        this._getValueItemId = function(inc){
            var id = self._wrap.find('.mi-sg').length;
            if(inc) {
                id += 1;
            }

            return self._name.replace(/\[\]/, '__') + '_' + id;
        };

        /**
         * remove last selected value
         */
        this.removeSelected = function() {
            self._wrap.find('.mi-sg:last').remove();
            self._fixWidth();
        };

        this.setValue = function(value) {
            self.options.value = value ? value : self.options.value;
            if(!self.options.value) {
                self.options.value = self._input.val();
            }
            self._input.val('');
            if(self.options.value) {
                if(Array.isArray(self.options.value)) {
                    $.each(self.options.value, function(i) {
                        var valItem = self.options.value[i];
                        if(typeof valItem === 'string') {
                            self._addValueItem(valItem, valItem);
                        }
                        else {
                            self._addValueItem(valItem.id, valItem.name);
                        }
                    });
                }
                else {
                    if(typeof self.options.value === 'string') {
                        self._addValueItem(self.options.value, self.options.value);
                    }
                    else {
                        self._addValueItem(self.options.value.id, self.options.value.name);
                    }
                }
            }
        };

        /**
         * @returns {*}
         */
        this.getValue = function() {
            if(self.options.multiple) {
                var values = [];
                self._wrap.find('.mi-selected').find('input[type=hidden]').each(function(){
                    values.push($(this).val());
                });

                return values;
            }
            else {
                return self._wrap.find('.mi-selected').find('input[type=hidden]').val();
            }
        };

        /**
         * @param item
         * @returns {boolean}
         * @private
         */
        this._isItemSelected = function(item) {
            var same = !self.options.filterSame;
            if(self.options.filterSame) {
                var value = self.getValue();
                if(value) {
                    same = (self.options.multiple) ? value.indexOf(item.id) !== -1 : value == item.id;
                }
            }

            return same;
        };

        /**
         * @param data
         * @private
         */
        this._displayTermData = function(data) {
            var suggest = $('<div class="mi-suggest-items">');
            $.each(data, function(i) {
                var item = data[i];
                if(!self._isItemSelected(item)) {
                    var el = $('<div class="mi-si" data-id="' + item.id + '" data-label="' + item.name + '"></div>');
                    var tpl = self.options.suggestTemplate;
                    for (var key in item) {
                        if (item.hasOwnProperty(key)) {
                            tpl = tpl.replace('{{' + key + '}}', item[key]);
                        }
                    }
                    el.html(tpl);
                    suggest.append(el);
                }
            });

            if(data) {
                self._wrap.find('.mi-suggest').html(suggest).show();
                self._fixWidth();
                if(!self.options.customValues) {
                    self.navigate(1);
                }
            }
        };

        /**
         * @private
         */
        this._fixWidth = function() {
            var col1 = 0;
            var maxCol1 = (self._wrap.width() / 3) * 2;
            self._wrap.find('.mi-sg').each(function(){
                col1 += $(this).width() + 5;
            });
            if(col1 > maxCol1) {
                col1 = maxCol1;
            }
            self._wrap.find('.mi-selected').css('width', col1 + 'px');
            var width = self._input.width() + 24;
            self._wrap.find('.mi-suggest').css('width', width + 'px');
        };

        /**
         * @param down
         */
        this.navigate = function(down) {
            var current = self._wrap.find('.mi-si.active');
            var select = null;
            if(down) {
                select = current.length ? current.next('.mi-si') : self._wrap.find('.mi-si:first');
            }
            else {
                select = current.length ? current.prev('.mi-si') : self._wrap.find('.mi-si:last');
            }
            self._wrap.find('.mi-si').removeClass('active');
            select.addClass('active');

            if(select.length) {
                var suggest = self._wrap.find('.mi-suggest');
                suggest.scrollTop(suggest.scrollTop() + select.position().top);
            }
        };

        /**
         * close suggest list
         */
        this.closeSuggest = function() {
            self._wrap.find('.mi-suggest').html('').hide();
        };

        /**
         * @param term
         * @private
         */
        this._requestTermData = function(term) {
            if(self.options.ajax) {
                $.getJSON(self.options.ajax, {term: term}, function(json) {
                    if(json && json.data) {
                        self._displayTermData(json.data);
                    }
                });
            }
            else {
                var found = 0;
                var data = [];
                for(var i = 0; i < self.options.data.length; i++) {
                    var item = self.options.data[i];
                    if(!term || self._matchItem(item, term)) {
                        data.push(typeof item === 'string' ? {id:item, name:item} : item);
                        found++;
                        if(found >= self.options.limit) {
                            break;
                        }
                    }
                }

                self._displayTermData(data);
            }
        };

        /**
         * @param item
         * @param term
         * @returns {boolean}
         * @private
         */
        this._matchItem = function(item, term) {
            if(typeof item === 'string') {
                var idx = item.toLocaleLowerCase().indexOf(term);
                if( (self.options.matchFirst && idx === 0) || (!self.options.matchFirst && idx !== -1) ) {
                    return true;
                }
            }
            else {
                var matched = false;
                $.each(this.options.match, function(k, e) {
                    var idx = item[e] ? item[e].toLocaleLowerCase().indexOf(term) : -1;
                    if( (self.options.matchFirst && idx === 0) || (!self.options.matchFirst && idx !== -1) ) {
                        matched = true;
                    }
                });

                return matched;
            }
        };

        /**
         * @param select
         * @returns {Array}
         * @private
         */
        this._getSelectData = function(select) {
            var data = [];
            var hasValues = select.find('option:first').attr('value');
            if(typeof hasValues !== typeof undefined && hasValues !== false) {
                select.find('option').each(function(){
                    data.push({
                        id: $(this).attr('value'),
                        name: $(this).text()
                    });
                });
            }
            else {
                select.find('option').each(function(){
                    data.push($(this).text());
                });
            }

            return data;
        };

        /**
         * @param select
         * @returns {Array}
         * @private
         */
        this._getSelectValue = function(select) {
            var data = [];
            var hasValues = select.find('option:first').attr('value');
            if(typeof hasValues !== typeof undefined && hasValues !== false) {
                select.find('option:selected').each(function(){
                    data.push({
                        id: $(this).attr('value'),
                        name: $(this).text()
                    });
                });
            }
            else {
                select.find('option:selected').each(function(){
                    data.push($(this).text());
                });
            }

            return data;
        };

        this._name = this.attr('name');

        if(this.prop('tagName') === 'SELECT') {
            this.options.data = this._getSelectData(this);
            if(!this.options.value) {
                this.options.value = this._getSelectValue(this)
            }
            if(this.prop('multiple')) {
                this.options.multiple = true;
            }
            this._input = $(
                '<input type="text" name="'+ this._name +'" class="'+ this.attr('class') +'" placeholder="">'
            );
            this.css('display', 'none').removeAttr('name');
            this._input.insertAfter(this);
            this.options.select = true;
            this.options.customValues = false;
        }
        else {
            this._input = this;
        }

        var wrap = '<div class="mi-wrap"><table><tr><td class="mi-input"></td></tr></table></div>';
        this._input.wrap($(wrap));
        this._wrap = this._input.closest('.mi-wrap');

        this.termCache = {};
        this.requestTimeout = null;

        var self = this;
        this._init();

        return this;
    };

}( jQuery ));