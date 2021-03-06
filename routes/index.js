var express = require('express');
var router = express.Router();
var basicAuth = require('basic-auth');

var auth = function (req, res, next) {
  function unauthorized(res) {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    return res.send(401);
  };

  var user = basicAuth(req);

  if (!user || !user.name || !user.pass) {
    return unauthorized(res);
  };

  if (user.name === 'task' && user.pass === 'factory#2018') {
    return next();
  } else {
    return unauthorized(res);
  };
};

router.get('/payments', auth, function(req, res) {
    res.render('payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/all-payments', auth, function(req, res) {
    res.render('all-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/paid-payments', auth, function(req, res) {
    res.render('paid-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/not-paid-payments', auth, function(req, res) {
    res.render('not-paid-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/transfered-payments', auth, function(req, res) {
    res.render('transfered-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/not-transfered-payments', auth, function(req, res) {
    res.render('not-transfered-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/detail-payment/:id', function(req, res) {
    res.render('detail-payment', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/users', auth, function(req, res) {
    res.render('user', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/feedbacks', auth, function(req, res) {
    res.render('feedback', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/notifications', auth, function(req, res) {
    res.render('notification', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/notifications-single', auth, function(req, res) {
    res.render('notification-single', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/add-notifications-single', auth, function(req, res) {
    res.render('add-notification-single', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/notifications-all', auth, function(req, res) {
    res.render('notification-all', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/add-notifications-all', auth, function(req, res) {
    res.render('add-notification-all', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/detail-user/:id', function(req, res) {
    res.render('detail-user', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/detail-feedback/:id', function(req, res) {
    res.render('detail-feedback', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/detail-notification-single/:id', function(req, res) {
    res.render('detail-notification-single', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/detail-notification-all/:id', function(req, res) {
    res.render('detail-notification-all', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

router.get('/tracking-map', auth, function(req, res) {
    res.render('tracking-map', {
        'pathToAssets': '/bootstrap-3.3.1',
        'pathToOwnAssets': '/javascripts',
        'pathToSelectedTemplateWithinBootstrap' : '/bootstrap-3.3.1/docs/examples/theme'
    });
});

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
