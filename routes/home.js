var express = require('express');
var router = express.Router();

router.get('/home', function(req, res) {
    res.render('carousel', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/carousel'
    });
});

module.exports = router;
