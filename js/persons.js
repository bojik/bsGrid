$(function(){
    $('#windowDetails').modal({show: false});
    $('#persons').bsGrid({
        url: 'data.php',
        limit: 10,
        displayingPages: 15,
        pagination: '.persons-pager',
        formFilter: '#person-filter',
        sortField: 'id',
        onClick: function(row, tr){
            //console.log(data, );
            if ($(tr).hasClass('success')){
                $(tr).removeClass('success');
            } else {
                $(tr).addClass('success');
            }

            var $window = $('#windowDetails');
            $window.find('.modal-body').html(
                '<b>Id:</b> ' + row['id'] + '<br>' +
                '<b>Name:</b> ' + row['name'] + '<br>' +
                '<b>Company:</b> ' + row['company']
            );
            $window.modal('show');
        },
        onLoading: function(data){
            $('#persons').find('tfoot th').text('Total: ' + data.total);
        },
        beforeLoading: function(){
            $('#loading').show();
        },
        afterLoading: function(data){
            $('#loading').hide();
        },
        formatTd: function(row, currentField){
            var ret = '<td>'+row[currentField]+'</td>';
            if (currentField == 'name'){
                ret = '<td><a href="#">'+row[currentField]+'</a></td>';
            }
            return ret;
        }
    });
});