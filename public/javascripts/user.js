// Userlist data array for filling in info box
var userListData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();

    // Username link click
    $('#userList table tbody').on('click', 'td a.linkshowuser', showUserInfo);
    
    $('#goHome').on('click', goHome);

});

function goHome(event) {
    event.preventDefault();
    $(location).attr('href','http://ec2-18-228-85-34.sa-east-1.compute.amazonaws.com/users');
};

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
            tableContent += '<td>' + this.user_id + '</td>';
            tableContent += '<td>' + this.full_user_name + '</td>';
            tableContent += '<td>' + this.email + '</td>';
            tableContent += '<td>' + this.gender + '</td>';
            tableContent += '<td>' + this.city + '</td>';
            tableContent += '<td>' + this.is_blocked + '</td>';
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
    
    $(location).attr('href','http://ec2-18-228-85-34.sa-east-1.compute.amazonaws.com/detail-user/' + thisID);

    // Get Index of object based on id value
    /*var arrayPosition = userListData.map(function(arrayItem) { return arrayItem._id; }).indexOf(thisID);

    var thisUserObject = userListData[arrayPosition];

    //Populate Info Box
    $('#userInfoID').text(thisUserObject._id);
    $('#userInfoUserId').text(thisUserObject.user_id);
    $('#userInfoFullUserName').text(thisUserObject.full_user_name);
    $('#userInfoGender').text(thisUserObject.gender);
    $('#userInfoCpf').text(thisUserObject.cpf);
    $('#userInfoCellPhone').text(thisUserObject.cell_phone);
    $('#userInfoBirthDate').text(thisUserObject.birth_date);
    $('#userInfoEmail').text(thisUserObject.email);
    $('#userInfoRegisterDate').text(thisUserObject.register_date);
    $('#userInfoCountry').text(thisUserObject.country);
    $('#userInfoCity').text(thisUserObject.city);
    $('#userInfoNeighborhood').text(thisUserObject.neighborhood);
    $('#userInfoState').text(thisUserObject.state);
    $('#userInfoStreetAddress').text(thisUserObject.street_address);
    $('#userInfoStreetNumber').text(thisUserObject.street_number);
    $('#userInfoZipCode').text(thisUserObject.zip_code);
    $('#userInfoBank').text(thisUserObject.bank);
    $('#userInfoAgency').text(thisUserObject.agency);
    $('#userInfoAccount').text(thisUserObject.account);
    $('#userInfoDigit').text(thisUserObject.digit);*/

};
