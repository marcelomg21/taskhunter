// Userlist data array for filling in info box
var userListData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();

    // Username link click
    $('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);

});

// Functions =============================================================

// Fill table with data
function populateTable() {

    // Empty content string
    var tableContent = '';

    // jQuery AJAX call for JSON
    $.getJSON( '/user/userlist', function( data ) {

        // Stick our user data array into a userlist variable in the global object
        userListData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            tableContent += '<tr>';
            tableContent += '<td><a href="#" class="linkshowuser" rel="' + this._id + '" title="Mostrar Detalhes">' + this._id + '</a></td>';
            tableContent += '<td>' + this.matching + '</td>';
            tableContent += '<td>' + this.working + '</td>';
            tableContent += '<td>' + this.name + '</td>';
            tableContent += '<td>' + this.type + '</td>';
            tableContent += '<td>' + this.card + '</td>';
            tableContent += '<td>' + this.condition + '</td>';
            tableContent += '<td>' + this.date + '</td>';
            tableContent += '<td>' + this.price + '</td>';
            tableContent += '<td>' + this.tax + '</td>';
            tableContent += '<td>' + this.paid + '</td>';
            //tableContent += '<td><a href="#" class="linkdeleteuser" rel="' + this._id + '">delete</a></td>';
            tableContent += '</tr>';
        });

        // Inject the whole content string into our existing HTML table
        $('#userList table tbody').html(tableContent);
    });
};

// Show User Info
function showUserInfo(event) {

    // Prevent Link from Firing
    event.preventDefault();

    // Retrieve username from link rel attribute
    var thisID = $(this).attr('rel');

    // Get Index of object based on id value
    var arrayPosition = userListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(thisID);

    // Get our User Object
    var thisUserObject = userListData[arrayPosition];

    //Populate Info Box
    $('#userInfoID').text(thisUserObject._id);
    $('#userInfoMatching').text(thisUserObject.matching);
    $('#userInfoWorking').text(thisUserObject.working);
    $('#userInfoName').text(thisUserObject.name);
    $('#userInfoType').text(thisUserObject.type);
    $('#userInfoCard').text(thisUserObject.card);
    $('#userInfoCondition').text(thisUserObject.condition);
    $('#userInfoDate').text(thisUserObject.date);
    $('#userInfoPrice').text(thisUserObject.price);
    $('#userInfoTax').text(thisUserObject.tax);
    $('#userInfoPaid').text(thisUserObject.paid);    

};
