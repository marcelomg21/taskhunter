// Paymentlist data array for filling in info box
//var detailPaymentData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    //populateTable();

    // Username link click
    $('#saveNotificationAll').on('click', updateNotificationAll);
    
    $('#goHome').on('click', goHome);

    // Add User button click
    //$('#btnAddUser').on('click', addUser);

    // Delete User link click
    //$('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);

});

function goHome(event) {
    event.preventDefault();
    $(location).attr('href','http://nodejs-mongo-persistent-marcelomg21.1d35.starter-us-east-1.openshiftapps.com/notifications');
};

// Fill table with data
function populateTable() {

    // Empty content string
    //var tableContent = '';

    // Prevent Link from Firing
    /*event.preventDefault();
    
    var notificationAllId = $(location).attr('href').split('detail-notification-all/')[1];
    
    // jQuery AJAX call for JSON
    $.getJSON( '/notification/addnotificationall/' + notificationAllId, function( data ) {

        // Stick our user data array into a userlist variable in the global object
        //detailPaymentData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            $('#notificationAllInfoID').text(this._id);
            $('#notificationAllInfoUserId').text(this.user_id);
            $('#notificationAllInfoTimestamp').text(this.timestamp);
            $('#notificationAllInfoIsNotified').attr('checked', this.is_notified);
            $('#notificationAllInfoMessageTitle').text(this.message_title);
            $('#notificationAllInfoMessageData').text(this.message_data);
            
        });*/

        // Inject the whole content string into our existing HTML table
        //$('#paymentList table tbody').html(tableContent);
        
        // Retrieve username from link rel attribute
        //var thisID = $(this).attr('rel');

        // Get Index of object based on id value
        //var arrayPosition = paymentListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(thisID);

        // Get our User Object
        //var thisPaymentObject = paymentListData[arrayPosition];
    //});
};

function updateNotificationAll(event) {
    event.preventDefault();
    
         var isNotifiedAll = $('#notificationAllInfoIsNotified').is(':checked') ? true : false;
    
        var updateNotificationAllBody = {
            'message_title': $('#notificationAllInfoMessageTitle').val(),
            'message_data': $('#notificationAllInfoMessageData').val(),
            'is_notified': isNotifiedAll
        }
        
        //var notificationAllId = $('#notificationAllInfoID').text();

        // Use AJAX to post the object to our adduser service
        $.ajax({
            type: 'POST',
            data: updateNotificationAllBody,
            url: '/notification/addnotificationall',
            dataType: 'JSON'
        }).done(function( response ) {
            // Check for successful (blank) response
            if (response.msg === '') {
                alert('Notificação Geral salva com sucesso.');
            }
            else {
                alert('Erro ao salvar: ' + response.msg);
            }
        });
};
