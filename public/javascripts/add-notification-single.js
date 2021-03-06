// Paymentlist data array for filling in info box
//var detailPaymentData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    //populateTable();

    // Username link click
    $('#saveNotification').on('click', updateNotification);
    
    $('#goHome').on('click', goHome);

    // Add User button click
    //$('#btnAddUser').on('click', addUser);

    // Delete User link click
    //$('#userList table tbody').on('click', 'td a.linkdeleteuser', deleteUser);

});

function goHome(event) {
    event.preventDefault();
    $(location).attr('href','http://ec2-18-228-85-34.sa-east-1.compute.amazonaws.com/notifications');
};

// Fill table with data
function populateTable() {

    // Empty content string
    //var tableContent = '';

    // Prevent Link from Firing
    /*event.preventDefault();
    
    var notificationId = $(location).attr('href').split('detail-notification/')[1];
    
    // jQuery AJAX call for JSON
    $.getJSON( '/notification/addnotification/' + notificationId, function( data ) {

        // Stick our user data array into a userlist variable in the global object
        //detailPaymentData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            $('#notificationInfoID').text(this._id);
            $('#notificationInfoUserId').text(this.user_id);
            $('#notificationInfoTimestamp').text(this.timestamp);
            $('#notificationInfoIsNotified').attr('checked', this.is_notified);
            $('#notificationInfoMessageTitle').text(this.message_title);
            $('#notificationInfoMessageData').text(this.message_data);
            
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

function updateNotification(event) {
    event.preventDefault();
    
        var isNotified = $('#notificationInfoIsNotified').is(':checked') ? true : false;
    
        var updateNotificationBody = {
            'message_title': $('#notificationInfoMessageTitle').val(),
            'message_data': $('#notificationInfoMessageData').val(),
            'user_id': $('#notificationInfoUserId').val(),
            'is_notified': isNotified
        }
        
        var notificationId = $('#notificationInfoID').text();

        // Use AJAX to post the object to our adduser service
        $.ajax({
            type: 'POST',
            data: updateNotificationBody,
            url: '/notification/addnotification',
            dataType: 'JSON'
        }).done(function( response ) {
            // Check for successful (blank) response
            if (response.msg === '') {
                alert('Notificação Individual salva com sucesso.');
            }
            else {
                alert('Erro ao salvar: ' + response.msg);
            }
        });
};
