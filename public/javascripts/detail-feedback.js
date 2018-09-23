// Paymentlist data array for filling in info box
//var detailPaymentData = [];

// DOM Ready =============================================================
$(document).ready(function() {

    // Populate the user table on initial page load
    populateTable();

    $('#saveFeedback').on('click', updateFeedback);
    
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
    
    var feedbackId = $(location).attr('href').split('detail-feedback/')[1];
    
    // jQuery AJAX call for JSON
    $.getJSON( '/feedback/detailFeedback/' + feedbackId, function( data ) {

        // Stick our user data array into a userlist variable in the global object
        //detailPaymentData = data;

        // For each item in our JSON, add a table row and cells to the content string
        $.each(data, function(){
            $('#feedbackInfoID').text(this._id);
            $('#feedbackInfoMatchingId').text(this.matching);
            $('#feedbackInfoWorkingId').text(this.working);
            $('#feedbackInfoComment').text(this.comment);
            $('#feedbackInfoAvaliation').text(this.evaluation);
            $('#feedbackInfoApproved').attr('checked', this.approved);
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

function updateFeedback(event) {
    event.preventDefault();
    
        var isApproved = $('#feedbackInfoApproved').is(':checked') ? true : false;
    
        var updateFeedbackBody = {
            'is_approved': isApproved
        }
        
        var feedbackId = $('#feedbackInfoID').text();

        // Use AJAX to post the object to our adduser service
        $.ajax({
            type: 'POST',
            data: updateFeedbackBody,
            url: '/feedback/updateFeedback/' + feedbackId,
            dataType: 'JSON'
        }).done(function( response ) {
            // Check for successful (blank) response
            if (response.msg === '') {
                alert('Feedback salvo com sucesso.');
            }
            else {
                alert('Erro ao salvar: ' + response.msg);
            }
        });
};

function goHome(event) {
    event.preventDefault();
    $(location).attr('href','http://ec2-18-228-85-34.sa-east-1.compute.amazonaws.com/feedbacks');
};
