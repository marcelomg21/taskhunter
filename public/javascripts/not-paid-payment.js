// Paymentlist data array for filling in info box
var paymentListData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();

    // Username link click
    $('#paymentList table tbody').on('click', 'td a.linkshowpayment', showPaymentInfo);
    
    $('#goHome').on('click', goHome);

    // Add User button click
    //$('#btnAddUser').on('click', addUser);

    // Delete User link click
    //$('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);

});

function goHome(event) {
    event.preventDefault();
    $(location).attr('href','http://ec2-18-228-85-34.sa-east-1.compute.amazonaws.com/payments');
};

// Functions =============================================================

// Fill table with data
function populateTable() {

    // Empty content string
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON( '/payment/notPaidPaymentlist', function( data ) {

        // Stick our user data array into a userlist variable in the global object
        paymentListData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            tableContent += '<tr>';
            tableContent += '<td><a href="#" class="linkshowpayment" rel="' + this._id + '" title="Mostrar Detalhes">' + this._id + '</a></td>';
            tableContent += '<td>' + this.matching + '</td>';
            tableContent += '<td>' + this.working + '</td>';
            tableContent += '<td>' + this.name + '</td>';
            tableContent += '<td>' + this.type + '</td>';
            tableContent += '<td>' + this.card + '</td>';
            tableContent += '<td>' + this.condition + '</td>';
            tableContent += '<td>' + this.date + ' ' + this.time + '</td>';
            tableContent += '<td>' + this.price + '</td>';
            tableContent += '<td>' + this.tax + '</td>';
            tableContent += '<td>' + this.fee + '</td>';
            tableContent += '<td>' + (this.paid ? 'Sim' : 'Não') + '</td>';
            tableContent += '<td>' + (this.transfered ? 'Sim' : 'Não') + '</td>';
            //tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
            tableContent += '</tr>';
        });

        // Inject the whole content string into our existing HTML table
        $('#paymentList table tbody').html(tableContent);
    });
};

// Show User Info
function showPaymentInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisID = $(this).attr('rel');
    
    $(location).attr('href','http://ec2-18-228-85-34.sa-east-1.compute.amazonaws.com/detail-payment/' + thisID);

    // Get Index of object based on id value
    /*var arrayPosition = paymentListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(thisID);

    // Get our User Object
    var thisPaymentObject = paymentListData[arrayPosition];

    //Populate Info Box
    $('#paymentInfoID').text(thisPaymentObject._id);
    $('#paymentInfoMatching').text(thisPaymentObject.matching);
    $('#paymentInfoWorking').text(thisPaymentObject.working);
    $('#paymentInfoName').text(thisPaymentObject.name);
    $('#paymentInfoType').text(thisPaymentObject.type);
    $('#paymentInfoCard').text(thisPaymentObject.card);
    $('#paymentInfoCondition').text(thisPaymentObject.condition);
    $('#paymentInfoDate').text(thisPaymentObject.date);
    $('#paymentInfoPrice').text(thisPaymentObject.price);
    $('#paymentInfoTax').text(thisPaymentObject.tax);
    $('#paymentInfoPaid').text(thisPaymentObject.paid);
    $('#paymentInfoTransfered').text(thisPaymentObject.transfered);*/

};
