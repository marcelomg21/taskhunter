// Paymentlist data array for filling in info box
//var detailPaymentData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();

    // Username link click
    //$('#paymentList table tbody').on('click', 'td a.linkshowpayment', showPaymentInfo);

    // Add User button click
    //$('#btnAddUser').on('click', addUser);

    // Delete User link click
    //$('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);

});

// Functions =============================================================
function getUrlParameter(name) {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

// Fill table with data
function populateTable() {

    // Empty content string
    //var tableContent = '';

    // Prevent Link from Firing
    event.preventDefault();
    
    var recursiveEncoded = getUrlParameter('id');

    alert( recursiveEncoded ); 
    
    // jQuery AJAX call for JSON
    $.getJSON( '/payment/detailPayment/' + recursiveEncoded, function( data ) {

        // Stick our user data array into a userlist variable in the global object
        //detailPaymentData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            //Populate Info Box
            $('#paymentInfoID').text(this._id);
            $('#paymentInfoMatching').text(this.matching);
            $('#paymentInfoWorking').text(this.working);
            $('#paymentInfoName').text(this.name);
            $('#paymentInfoType').text(this.type);
            $('#paymentInfoCard').text(this.card);
            $('#paymentInfoCondition').text(this.condition);
            $('#paymentInfoDate').text(this.date);
            $('#paymentInfoPrice').text(this.price);
            $('#paymentInfoTax').text(this.tax);
            $('#paymentInfoPaid').text(this.paid);
            $('#paymentInfoTransfered').text(this.transfered);
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
