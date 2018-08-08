// Paymentlist data array for filling in info box
//var detailPaymentData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();

    // Username link click
    //$('#paymentList table tbody').on('click', 'td a.linkshowpayment', showPaymentInfo);
    $('#savePayment').on('click', updatePayment);
    
    $('#goHome').on('click', goHome);

    // Add User button click
    //$('#btnAddUser').on('click', addUser);

    // Delete User link click
    //$('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);

});

// Fill table with data
function populateTable() {

    // Empty content string
    //var tableContent = '';

    // Prevent Link from Firing
    event.preventDefault();
    
    var paymentId = $(location).attr('href').split('detail-payment/')[1];

    //alert($(location).attr('href').split('detail-payment/')[1]);
    
    // jQuery AJAX call for JSON
    $.getJSON( '/payment/detailPayment/' + paymentId, function( data ) {

        // Stick our user data array into a userlist variable in the global object
        //detailPaymentData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            //Populate Info Box
            $('#paymentInfoID').text(this._id);
            $('#paymentInfoMatching').text(this.matching);
            $('#paymentInfoWorking').text(this.working);
            $('#paymentInfoCustomerName').text(this.user.full_user_name);
            $('#paymentInfoName').text(this.name);
            $('#paymentInfoType').text(this.type);
            $('#paymentInfoCard').text(this.card);
            $('#paymentInfoCondition').text(this.condition);
            $('#paymentInfoDate').text(this.date + ' ' + this.time);
            $('#paymentInfoPrice').text(this.price);
            $('#paymentInfoTax').text(this.tax);
            $('#paymentInfoPaid').text((this.paid ? 'Sim' : 'Não'));
            $('#paymentInfoBank').text(this.user.bank);
            $('#paymentInfoAgency').text(this.user.agency);
            $('#paymentInfoAccount').text(this.user.account);
            $('#paymentInfoDigit').text(this.user.digit);
            $('#paymentInfoTransfered').attr('checked', this.transfered);
            $('#paymentInfoAbandoned').text((this.abandoned ? 'Sim' : 'Não'));
        });

        // Inject the whole content string into our existing HTML table
        //$('#paymentList table tbody').html(tableContent);
        
        // Retrieve username from link rel attribute
        //var thisID = $(this).attr('rel');

        // Get Index of object based on id value
        //var arrayPosition = paymentListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(thisID);

        // Get our User Object
        //var thisPaymentObject = paymentListData[arrayPosition];
    });
};

function updatePayment(event) {
    event.preventDefault();

        var transfered = $('#paymentInfoTransfered').is(':checked') ? true : false;
    
        var updatePaymentBody = {
            'transfered': transfered
        }
        
        var paymentId = $('#paymentInfoID').text();

        // Use AJAX to post the object to our adduser service
        $.ajax({
            type: 'POST',
            data: updatePaymentBody,
            url: '/payment/updatePayment/' + paymentId,
            dataType: 'JSON'
        }).done(function( response ) {
            // Check for successful (blank) response
            if (response.msg === '') {
                alert('Pagamento salvo com sucesso.');
            }
            else {
                alert('Erro ao salvar: ' + response.msg);
            }
        });
};

function goHome(event) {
    event.preventDefault();
    $(location).attr('href','http://ec2-18-228-85-34.sa-east-1.compute.amazonaws.com/payments');
};

// Show User Info
function showPaymentInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisID = $(this).attr('rel');

    // Get Index of object based on id value
    var arrayPosition = paymentListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(thisID);

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
    $('#paymentInfoTransfered').text(thisPaymentObject.transfered);

};
