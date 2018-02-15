var express = require('express');
var router = express.Router();

router.get('/allPaymentlist', function(req, res) {    
    var db = req.db;
    var query = {};    

    db.collection('payment_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.get('/paidPaymentlist', function(req, res) {    
    var db = req.db;
    var query = {paid:true};    

    db.collection('payment_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.get('/notPaidPaymentlist', function(req, res) {    
    var db = req.db;
    var query = {paid:false};    

    db.collection('payment_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.get('/transferedPaymentlist', function(req, res) {    
    var db = req.db;
    var query = {transfered:true};    

    db.collection('payment_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.get('/notTransferedPaymentlist', function(req, res) {    
    var db = req.db;
    var query = {transfered:false};    

    db.collection('payment_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

module.exports = router;
