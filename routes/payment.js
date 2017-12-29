var express = require('express');
var router = express.Router();

/*
 * GET userlist.
 */
router.get('/paymentlist', function(req, res) {    
    var db = req.db;
    var query = {};    

    db.collection('payment_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

module.exports = router;
