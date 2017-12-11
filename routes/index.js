var express = require('express');
var router = express.Router();

/*router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});*/

router.get('/', function(req, res) {
    res.render('carousel', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/carousel'
    });
});

router.get('/signin', function(req, res) {
    res.render('signin', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/signin'
    });
});

router.get('/theme', function(req, res) {
    res.render('theme', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

module.exports = router;
