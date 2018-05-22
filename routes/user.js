var express = require('express');
var router = express.Router();

/*
 * GET userlist.
 */
router.get('/userlist', function(req, res) {
    /*var db = req.db;
    var collection = db.collection('userlist');
    collection.find({},function(e,docs){
        res.json(docs);
    });*/
    
    var db = req.db;
    var query = {};    

    db.collection('users').find(query).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.post('/adduser', function(req, res) {
    var db = req.db;
    var collection = db.collection('userlist');    
    collection.insert(req.body, function(err, result){
        res.send(
            (err === null) ? { msg: '' } : { msg: err }
        );
    });
});

router.get('/detailUser/:id', function(req, res) {    
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var userObjectId = ObjectId(req.params.id);
	
    db.collection('users').find({'_id' : userObjectId}).toArray(function (err, docs_users) {
		return res.json(docs_users);
	});
});

router.post('/trackingUser/:id', function(req, res) {    
    var db = req.db;

    db.collection('positions').find({'user_id' : parseInt(req.params.id), timestamp : { "$gte" : new Date(req.body.date_tracking + "T00:00:00Z") } }).toArray(function (err, docs_tracking) {
        return res.json(docs_tracking);
    });
});

router.post('/updateUser/:id', function(req, res) {
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var userObjectId = ObjectId(req.params.id);
	
    db.collection('users').update(
	   {_id : userObjectId}, 
	   {$set: {discount_rate : req.body.discount_rate}}, 
	   {upsert:false},
	   function (err, result) {
	      res.send(
		  (err === null) ? { msg: '' } : { msg: err }
	      );
	   });
});

router.delete('/deleteuser/:id', function(req, res) {
    var db = req.db;
    var collection = db.collection('userlist');
    var userToDelete = req.params.id;
    collection.remove({ '_id' : userToDelete }, function(err) {
        res.send((err === null) ? { msg: '' } : { msg:'error: ' + err });
    });
});

module.exports = router;
