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

router.get('/detailPayment/:id', function(req, res) {    
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
	var paymentObjectId = ObjectId(req.params.id);
    var query = {_id : paymentObjectId};

    db.collection('payment_preferences').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.post('/updatePayment/:id', function(req, res) {
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var paymentObjectId = ObjectId(req.params.id);
    var transfered = req.body.transfered == "true" ? true : false;
    
    db.collection('payment_preferences').update({_id : paymentObjectId}, {$set: {transfered : transfered}}, {upsert:false});
	
    res.end();
});

module.exports = router;
