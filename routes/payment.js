var express = require('express');
var router = express.Router();

/*
 * GET userlist.
 */
router.get('/paymentlist', function(req, res) {
    /*var db = req.db;
    var collection = db.collection('userlist');
    collection.find({},function(e,docs){
        res.json(docs);
    });*/
    
    var db = req.db;
    var query = {};    

    db.collection('userlist').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

module.exports = router;
