/*!
 * ===================================================
 * bsGrid.js v1.0.0
 * https://github.com/bojik/bsGrid
 * ===================================================
 *
 * Copyright 2012 Alexander Rodionov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function ($) {
    $.fn.bsGrid = function (options) {
        this.each(function () {
            new bsGrid($(this), options).initTable();
        });
        return this;
    };
    function bsGrid($table, options) {
        this.url = options['url'] || $table.attr('data-url'); // url to obtain data
        this.limit = options['limit'] || $table.attr('data-limit') || 10; // how many rows are shown on page
        this.currentPage = options['currentPage'] || $table.attr('data-current-page') || 1; // current page
        this.pager = options['pagination'] || $table.attr('data-pagination'); // jQuery selector of pagination
        this.sortName = options['sortField'] || $table.attr('data-sort-field'); // field on which data is sorted
        this.sortOrder = options['sortOrder'] || $table.attr('data-sort-order') || 'asc'; // asc - direct sorting or desc - reverse sorting
        this.sortIcon = options['sortIcon'] || $table.attr('data-sort-icon') || '&uarr;&darr;'; // sorting icon
        this.sortIconDesc = options['sortIconDesc'] || $table.attr('data-sort-icon-desc') || '&darr;'; // icon for fields with reverse sort
        this.sortIconAsc = options['sortIconAsc'] || $table.attr('data-sort-icon-asc') || '&uarr;'; // icon for fields with direct sort
        this.nextPageIcon = options['nextPageIcon'] || $table.attr('data-next-page-icon') || '&rarr;'; // next page icon of pagination
        this.prevPageIcon = options['prevPageIcon'] || $table.attr('data-prev-page-icon') || '&larr;'; // previous page icon of pagination
        this.formFilter = options['formFilter'] || $table.attr('data-form-filter'); // jQuery selector of filter form
        this.displayingPages = options['displayingPages'] || $table.attr('data-displaying-pages') || 9; // how many pages are displayed on pagination
        this.formatTd = options['formatTd'] || false; // callback function of  formatting table cell
        this.beforeLoading = options['beforeLoading'] || function () {
        }; // function is performed before ajax request
        this.afterLoading = options['afterLoading'] || function () {
        }; // function is performed after ajax request
        this.onLoading = options['onLoading'] || function () {
        }; // function is performed after data loading
        this.onClick = options['onClick'] || function () {
        }; // function is performed on row click event

        this.$table = $table;
        this.$table.data('object', this);
        this.total = 0;

        this.initTable = function () {
            var self = this,
                $table = this.$table,
                $ths = $table.find('thead').find('th');
            $ths.each(function () {
                var $this = $(this);
                if ($this.attr('data-sortname')) {
                    var html = '<a href="" class="sort-column">' + $this.text() + ' <span class="dir">' + self.sortIcon + '</span></a>';
                    $this.html(html);
                }
            });

            $ths.find('.sort-column').click(function () {
                var sortField = self.sortName,
                    sortDir = self.sortOrder,
                    $parent = $(this).parent();
                if (sortField == $parent.attr('data-sortname')) {
                    sortDir = sortDir == 'asc' ? 'desc' : 'asc';
                } else {
                    sortDir = 'asc';
                    sortField = $parent.attr('data-sortname');
                }
                self.sortName = sortField;
                self.sortOrder = sortDir;
                self.currentPage = 1;

                self.updateSorting();
                return false;
            });
            this.updateSorting();
            this.bindEvents();
            this.bindGlobalEvents();
        };

        this.bindGlobalEvents = function () {
            var $table = this.$table;
            $table.bind('reload', function () {
                var o = $(this).data('object');
                o.currentPage = 1;
                o.reloadData();
            });
        };

        this.bindEvents = function () {
            var pager = this.pager,
                self = this;
            if (pager) {
                $(pager).find('a').live('click', function () {
                    var $this = $(this);
                    if (!$this.attr('data-page')) {
                        return true;
                    }
                    self.currentPage = $this.attr('data-page');
                    self.reloadData();
                    return false;
                })
            }

            var formFilter = this.formFilter;
            if (formFilter) {
                $(formFilter).submit(function () {
                    self.currentPage = 1;
                    self.reloadData();
                    return false;
                });
            }
        };

        this.updateSorting = function () {
            var sortField = this.sortName,
                sortDir = this.sortOrder,
                $table = this.$table,
                self = this;
            $table.find('thead').find('th').each(function () {
                var icon = self.sortIcon,
                    $this = $(this);
                if ($this.attr('data-sortname') == sortField) {
                    if (sortDir == 'asc') {
                        icon = self.sortIconAsc;
                    } else {
                        icon = self.sortIconDesc;
                    }
                }
                $this.find('.dir').html(icon);
            });
            this.reloadData();
        };

        this.reloadData = function () {
            var $table = this.$table,
                $tbody = $table.find('tbody'),
                self = this;
            if (this.url) {
                self.beforeLoading();
                var postData = self.getPostData();
                $.post(self.url, postData, function (data) {
                    self.onLoading(data);
                    if (data.success) {
                        var rows = data.rows,
                            tds = [];
                        $tbody.html('');
                        for (var i = 0; i < rows.length; i++) {
                            var row = rows[i];
                            tds = [];
                            $table.find('thead').find('th').each(function () {
                                var fieldName = $(this).attr('data-field');
                                tds.push(self.formatTableTd(row, fieldName));
                            });
                            $('<tr>' + tds.join('') + '</tr>')
                                .data('row', row)
                                .bind('click', function () {
                                    self.onClick($(this).data('row'), this);
                                })
                                .appendTo($tbody);
                        }
                        self.total = data.total;
                        if (data.currentPage) {
                            self.currentPage = data.currentPage;
                        }
                        self.updatePages();
                    }
                }, 'json')
                    .complete(function () {
                        self.afterLoading();
                    });
            }
        };

        this.formatTableTd = function (row, currentField) {
            var ret;
            if (this.formatTd && $.isFunction(this.formatTd)) {
                ret = this.formatTd(row, currentField);
            } else {
                ret = '<td>' + row[currentField] + '</td>';
            }
            return ret;
        };

        this.getPostData = function () {
            var a = {
                    'offset':(this.currentPage - 1) * this.limit,
                    'sortName':this.sortName,
                    'sortOrder':this.sortOrder,
                    'limit':this.limit
                },
                formFilter = this.formFilter,
                ret = [];
            for (var k in a) {
                ret.push(k + '=' + a[k]);
            }
            var str = ret.join('&');
            if (formFilter) {
                var $formFilter = $(formFilter);
                str += '&' + $formFilter.serialize();
            }
            return str;
        };

        this.updatePages = function () {
            var pager = this.pager;
            if (!pager) {
                return false;
            }
            var $container = $(pager),
                totalPages = Math.ceil(parseFloat(this.total) / parseFloat(this.limit));

            if (totalPages <= 1) { // don't show pagination
                $container.html('');
                return false;
            }
            var html = [],
                currentPage = parseInt(this.currentPage),
                prevPage = currentPage - 1 > 0 ? currentPage - 1 : currentPage, // calculate next page value
                nextPage = currentPage + 1 <= totalPages ? currentPage + 1 : currentPage, // calculate previous page value
                activePages = [], // pages will be displayed
                displayingPages = parseInt(this.displayingPages), // config value
                i = 0;

            if (displayingPages < totalPages) { // hardcore starts here
                var partLength = Math.floor(displayingPages / 3),
                    partActive = Math.floor(partLength / 2);
                for (i = 1; i <= partLength; i++) { // the first part
                    activePages.push(i);
                }

                var start = currentPage - partActive,
                    end = currentPage + partActive;
                if (i - 1 >= start) { // the second part intersects the first, fix bounds of second part
                    start = i;
                    end = start + partLength - 1;
                }
                end = end > totalPages ? totalPages : end; // if the second part is more than number of pages
                for (i = start; i <= end; i++) {
                    activePages.push(i);
                }

                start = totalPages - partLength + 1; // the last part
                end = totalPages;
                if (i - 1 >= start) { // fix bounds if the last part intersects the second
                    start = i;
                }
                for (i = start; i <= end; i++) {
                    activePages.push(i);
                }
                for (i = totalPages; i >= 1; i--) { // if the number of pages < displayingPages
                    if (activePages.length >= displayingPages) {
                        break;
                    }
                    if ($.inArray(i, activePages) == -1) { // check if page does not exist in array, put it into array
                        activePages.push(i);
                    }
                }
                activePages.sort(function (a, b) { // sorting as numeric
                    if (a == b) {
                        return 0;
                    }
                    return a > b ? 1 : -1;
                });
            } else { // softcore
                for (i = 1; i <= totalPages; i++) {
                    activePages.push(i);
                }
            }

            // html generating
            html.push('<li class="' + (currentPage == prevPage ? 'disabled' : '') + '"><a href="#page-' + prevPage + '" data-page="' + prevPage + '">' + this.prevPageIcon + '</a></li>');
            var page = 0;
            for (i = 0; i < activePages.length; i++) {
                if (page + 1 != activePages[i]) {
                    html.push('<li class="disabled"><a href="#">...</a></li>');
                }
                page = activePages[i];
                html.push('<li class="' + (page == currentPage ? 'active' : '') + '"><a href="#page-' + page + '" class="" data-page="' + page + '">' + page + '</a></li>');
            }
            html.push('<li class="' + (currentPage == nextPage ? 'disabled' : '') + '"><a href="#page-' + nextPage + '" data-page="' + nextPage + '">' + this.nextPageIcon + '</a></li>');
            $container.html('<ul>' + html.join('') + '</ul>');
            return true;
        }

    }
})(jQuery);