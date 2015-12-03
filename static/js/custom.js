$(document).ready(function() {


    var divElement = $('div'); //log all div elements
    var inputElement = $('input'); //log all div elements
    var textareaElement = $('textarea'); //log all div elements



    /* ---------- Data Table ---------- */   
    if($('table').hasClass('dynamicTable')){
                    var table = $('.dynamicTable').dataTable({
                        //"sScrollY": "60vh",
                        //"bPaginate": false,
                        //"bJQueryUI": false,
                        "iDisplayLength": 30,
                        //"fixedHeader": true,
                        "sPaginationType": "full_numbers",
                        "bAutoWidth": false,
                        "bLengthChange": false,
                        "fnInitComplete": function(oSettings, json) {
                          $('.dataTables_filter>label>input').attr('id', 'search');
                        }
                    });
                } 
    /* ---------- Data Table ---------- */   

 });
