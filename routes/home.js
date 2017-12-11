var express = require('express');

module.exports = (function () {
    'use strict';
    var router = express.Router();
    
    router.get('/template/:selectedTemplate', function (req, res) {
        res.render('carousel', {
            'pathToAssets': '/bootstrap-3.3.1',
            'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/carousel'
        });
    });
    return router;
})();
