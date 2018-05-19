var notificationAllListData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();

    // Username link click
    $('#notificationAllList table tbody').on('click', 'td a.linkshownotificationall', showNotificationAllInfo);
    
    $('#goHome').on('click', goHome);

});

function goHome(event) {
    event.preventDefault();
    $(location).attr('href','http://nodejs-mongo-persistent-marcelomg21.1d35.starter-us-east-1.openshiftapps.com/notifications');
};

// Fill table with data
function populateTable() {

    // Empty content string
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON( '/notification/notificationalllist', function( data ) {

        // Stick our user data array into a userlist variable in the global object
        notificationAllListData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            tableContent += '<tr>';
            tableContent += '<td><a href="#" class="linkshownotificationall" rel="' + this._id + '" title="Mostrar Detalhes">' + this._id + '</a></td>';
            tableContent += '<td>' + this.timestamp + '</td>';
            tableContent += '<td>' + this.is_notified + '</td>';
            tableContent += '<td>' + this.app_type + '</td>';
            tableContent += '<td>' + this.message_title + '</td>';
            tableContent += '<td>' + this.message_data + '</td>';
            //tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
            tableContent += '</tr>';
        });

        // Inject the whole content string into our existing HTML table
        $('#notificationAllList table tbody').html(tableContent);
    });
};

// Show User Info
function showNotificationAllInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisID = $(this).attr('rel');
    
    $(location).attr('href','http://nodejs-mongo-persistent-marcelomg21.1d35.starter-us-east-1.openshiftapps.com/detail-notification-all/' + thisID);

};
