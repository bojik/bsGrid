(function($){
$.fn.bsGrid = function(options){
    this.each(function(){
        new bsGrid($(this), options).initTable();
    });
    return this;
};
function bsGrid($table, options){
    this.url = options['url'] || $table.attr('data-url');
    this.limit = options['limit'] || $table.attr('data-limit') || 10;
    this.currentPage = options['currentPage'] || $table.attr('data-current-page') || 1;
    this.pager = options['pagination'] || $table.attr('data-pagination');
    this.sortName = options['sortField'] || $table.attr('data-sort-field');
    this.sortOrder = options['sortOrder'] || $table.attr('data-sort-order') || 'asc';
    this.sortIcon = options['sortIcon'] || '&uarr;&darr;';
    this.sortIconDesc = options['sortIconDesc'] || '&darr;';
    this.sortIconAsc = options['sortIconAsc'] || '&uarr;';
    this.nextPageIcon = options['nextPageIcon'] || '&rarr;';
    this.prevPageIcon = options['prevPageIcon'] || '&larr;';
    this.formFilter = options['formFilter'] || $table.attr('data-form-filter');
    this.displayingPages = options['displayingPages'] || $table.attr('data-displaying-pages') || 9;
    this.formatTd = options['formatTd'] || false;
    this.beforeLoading = options['beforeLoading'] || function(){};
    this.afterLoading = options['afterLoading'] || function(){};
    this.onLoading = options['onLoading'] || function(){};
    this.onClick = options['onClick'] || function(){};

    this.$table = $table;
    this.$table.data('object', this);
    this.total = 0;

    this.initTable = function(){
        var self = this,
            $table = this.$table,
            $ths = $table.find('thead').find('th');
        $ths.each(function(){
            var $this = $(this);
            if ($this.attr('data-sortname')){
                var html = '<a href="" class="sort-column">'+$this.text()+' <span class="dir">'+self.sortIcon+'</span></a>';
                $this.html(html);
            }
        });

        $ths.find('.sort-column').click(function(){
            var sortField = self.sortName,
                sortDir = self.sortOrder,
                $parent = $(this).parent();
            if (sortField == $parent.attr('data-sortname')){
                sortDir = sortDir == 'asc' ? 'desc' : 'asc';
            } else {
                sortDir = 'asc';
                sortField = $parent.attr('data-sortname');
            }
            self.sortName = sortField;
            self.sortOrder = sortDir;
            self.currentPage = 1;

            self.updateSorting();
//            $table.trigger('reloadData');
            return false;
        });
        this.updateSorting();
        this.bindEvents();
        this.bindGlobalEvents();
    }

    this.bindGlobalEvents = function(){
        var $table = this.$table;
        $table.bind('reload', function(){
            var o = $(this).data('object');
            o.currentPage = 1;
            o.reloadData();
        });
    }

    this.bindEvents = function(){
        var $table = this.$table,
            pager = this.pager,
            self = this;
        if (pager){
            $(pager).find('a').live('click', function(){
                var $this = $(this);
                if (!$this.attr('data-page')){
                    return true;
                }
                //$table.data('currentPage', $this.attr('data-page'));
                self.currentPage = $this.attr('data-page');
                self.reloadData();
                return false;
            })
        }

        var formFilter = this.formFilter;
        if (formFilter){
            $(formFilter).submit(function(){
                self.currentPage = 1;
                self.reloadData();
                return false;
            });
        }
    }

    this.updateSorting = function(){
        var sortField = this.sortName,
            sortDir = this.sortOrder,
            $table = this.$table,
            self = this;
        $table.find('thead').find('th').each(function(){
            var icon = self.sortIcon,
                $this = $(this);
            if ($this.attr('data-sortname') == sortField){
                if (sortDir == 'asc'){
                    icon = self.sortIconAsc;
                } else {
                    icon = self.sortIconDesc;
                }
            }
            $this.find('.dir').html(icon);
        });
        this.reloadData();
    }

    this.reloadData = function(){
        var $table = this.$table,
            $tbody = $table.find('tbody'),
            self = this;
        if (this.url){
            self.beforeLoading();
            var postData = self.getPostData();
            $.post(self.url, postData, function(data){
                self.onLoading(data);
                if (data.success){
                    var rows = data.rows,
                        trs = [],
                        tds = [];
                    $tbody.html('');
                    for (var i = 0; i < rows.length; i++){
                        var row = rows[i];
                        tds = [];
                        $table.find('thead').find('th').each(function(){
                            var fieldName = $(this).attr('data-field');
                            tds.push(self.formatTableTd(row, fieldName));
                        });
                        $('<tr>'+tds.join('')+'</tr>')
                            .data('row', row)
                            .bind('click', function(){
                                self.onClick($(this).data('row'), this);
                            })
                            .appendTo($tbody);
                    }
                    self.total = data.total;
                    if (data.currentPage){
                        self.currentPage = data.currentPage;
                    }
                    self.updatePages();
                }
            }, 'json')
                .complete(function() {
                    self.afterLoading();
                });
        }
    }

    this.formatTableTd = function(row, currentField){
        var ret;
        if (this.formatTd && $.isFunction(this.formatTd)){
            ret = this.formatTd(row, currentField);
        } else {
            ret = '<td>'+row[currentField]+'</td>';
        }
        return ret;
    }

    this.getPostData = function(){
        var a = {
                'offset': (this.currentPage-1) * this.limit,
                'sortName': this.sortName,
                'sortOrder': this.sortOrder,
                'limit': this.limit
            },
            formFilter = this.formFilter,
            ret = [];
        for (var k in a){
            ret.push(k + '=' + a[k]);
        }
        var str = ret.join('&');
        if (formFilter){
            var $formFilter = $(formFilter);
            str += '&' + $formFilter.serialize();
        }
        return str;
    }

    this.updatePages = function(){
        var $table = this.$table,
            pager = this.pager;
        if (!pager){
            return false;
        }
        var $container = $(pager),
            totalPages = Math.ceil(parseFloat(this.total)/parseFloat(this.limit));

        if (totalPages <= 1){
            $container.html('');
            return false;
        }
        var html = [],
            currentPage = parseInt(this.currentPage),
            prevPage = currentPage - 1 > 0 ? currentPage - 1 : currentPage,
            nextPage = currentPage + 1 <= totalPages ? currentPage + 1 :currentPage,
            activePages = [],
            displayingPages = parseInt(this.displayingPages);

        if (displayingPages < totalPages){
            var partLength = Math.floor(displayingPages / 3),
                partActive = Math.floor(partLength / 2),
                i = 0;
            for (i = 1; i <= partLength; i++){
                activePages.push(i);
            }
            var start = currentPage - partActive,
                end = currentPage + partActive;
            if (i-1 >= start){
                start = i;
                end = start + partLength-1;
            }
            end = end > totalPages ? totalPages : end;
            for (i = start; i <= end; i++){
                activePages.push(i);
            }

            start = totalPages - partLength+1,
                end = totalPages;
            if (i-1 >= start){
                start = i;
            }
            for (i = start; i <= end; i++){
                activePages.push(i);
            }
            for (i = totalPages; i >= 1; i--){
                if (activePages.length >= displayingPages){
                    break;
                }
                if ($.inArray(i, activePages) == -1){
                    activePages.push(i);
                }
            }
            activePages.sort(function(a, b){
                if (a == b){
                    return 0;
                }
                return a > b ? 1 : -1;
            });
        } else {
            for (var i = 1; i <= totalPages; i++){
                activePages.push(i);
            }
        }

        html.push('<li class="'+(currentPage == prevPage ? 'disabled' : '')+'"><a href="#page-'+prevPage+'" data-page="'+prevPage+'">'+this.prevPageIcon+'</a></li>');
        var page = 0;
        for (var i = 0; i < activePages.length; i++){
            if (page+1 != activePages[i]){
                html.push('<li class="disabled"><a href="#">...</a></li>');
            }
            page = activePages[i];
            html.push('<li class="'+(page == currentPage ? 'active' : '')+'"><a href="#page-'+page+'" class="" data-page="'+page+'">'+page+'</a></li>');
        }
        html.push('<li class="'+(currentPage == nextPage ? 'disabled' : '')+'"><a href="#page-'+nextPage+'" data-page="'+nextPage+'">'+this.nextPageIcon+'</a></li>');
        $container.html('<ul>'+html.join('')+'</ul>');
    }

}
})(jQuery);