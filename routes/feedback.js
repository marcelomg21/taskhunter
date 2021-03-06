var express = require('express');
var router = express.Router();

router.get('/feedbacklist', function(req, res) {
    var db = req.db;
    var query = {};
    var desc_sort = { _id: -1 };

    db.collection('feedback_preferences').find(query).sort(desc_sort).toArray(function (err, docs) {                                   
            return res.json(docs);                
    });
});

router.get('/detailFeedback/:id', function(req, res) {    
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var feedbackObjectId = ObjectId(req.params.id);
	
    db.collection('feedback_preferences').find({'_id' : feedbackObjectId}).toArray(function (err, docs_feedbacks) {
		return res.json(docs_feedbacks);
	});
});

router.post('/updateFeedback/:id', function(req, res) {
    var db = req.db;
    var ObjectId = require('mongodb').ObjectID;
    var feedbackObjectId = ObjectId(req.params.id);
    var isApproved = req.body.is_approved == "true" ? true : false;
	
    db.collection('feedback_preferences').update(
	   {_id : feedbackObjectId}, 
	   {$set: { approved : isApproved }},
	   {upsert:false},
	   function (err, result) {
	      res.send(
		  (err === null) ? { msg: '' } : { msg: err }
	      );
	   });
});

module.exports = router;
