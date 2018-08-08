// Paymentlist data array for filling in info box
//var detailPaymentData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();

    // Username link click
    $('#saveUser').on('click', updateUser);
    
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
    
    var userId = $(location).attr('href').split('detail-user/')[1];
    
    // jQuery AJAX call for JSON
    $.getJSON( '/user/detailUser/' + userId, function( data ) {

        // Stick our user data array into a userlist variable in the global object
        //detailPaymentData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            $('#userInfoID').text(this._id);
            $('#userInfoUserId').text(this.user_id);
            $('#userInfoFullUserName').text(this.full_user_name);
            $('#userInfoGender').text(this.gender);
            $('#userInfoCpf').text(this.cpf);
            $('#userInfoCellPhone').text(this.cell_phone);
            $('#userInfoBirthDate').text(this.birth_date);
            $('#userInfoEmail').text(this.email);
            $('#userInfoRegisterDate').text(this.register_date);
            $('#userInfoCountry').text(this.country);
            $('#userInfoCity').text(this.city);
            $('#userInfoNeighborhood').text(this.neighborhood);
            $('#userInfoState').text(this.state);
            $('#userInfoStreetAddress').text(this.street_address);
            $('#userInfoStreetNumber').text(this.street_number);
            $('#userInfoZipCode').text(this.zip_code);
            $('#userInfoBank').text(this.bank);
            $('#userInfoAgency').text(this.agency);
            $('#userInfoAccount').text(this.account);
            $('#userInfoDigit').text(this.digit);
            $('#userInfoDiscountRate').val(this.discount_rate);
            $('#userInfoBlocked').attr('checked', this.is_blocked);
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

function updateUser(event) {
    event.preventDefault();
    
        var isBlocked = $('#userInfoBlocked').is(':checked') ? true : false;
    
        var updateUserBody = {
            'is_blocked': isBlocked,
            'discount_rate': $('#userInfoDiscountRate').val()
        }
        
        var userId = $('#userInfoID').text();

        // Use AJAX to post the object to our adduser service
        $.ajax({
            type: 'POST',
            data: updateUserBody,
            url: '/user/updateUser/' + userId,
            dataType: 'JSON'
        }).done(function( response ) {
            // Check for successful (blank) response
            if (response.msg === '') {
                alert('Usuário salvo com sucesso.');
            }
            else {
                alert('Erro ao salvar: ' + response.msg);
            }
        });
};

function goHome(event) {
    event.preventDefault();
    $(location).attr('href','http://ec2-18-228-9-130.sa-east-1.compute.amazonaws.com/users');
};
