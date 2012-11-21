////////// Tracking selected list in URL //////////

var SmarksRouter = Backbone.Router.extend({
  routes: {
  	"": "home",
    "tags/:tag": "tags",
    "timeline": "timeline",
    "dateline": "dateline"
  },
  home: function() {
  	//console.log("router: call home");
	 Session.set('tag_filters', null);
  },
  tags: function (tag) {
    //console.log("setting tag filter to " + tag);
    console.log("page is " + _page);
    Session.set('tag_filters', [tag]);
  },
  timeline: function() {
    Session.set('layout', "view_cl");
  },
  dateline: function() {
    Session.set('layout', "view_tm");
  }
});

if (typeof Handlebars !== 'undefined') {
  Handlebars.registerHelper('renderPage', function(name) {

    if (! _.isString(name))
      name = Session.get('layout');
      console.log("template name is ", name);
    
    if (Template[name])
      return new Handlebars.SafeString(Template[name]());
    
  });
}
