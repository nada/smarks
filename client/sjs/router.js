////////// Tracking selected list in URL //////////

var SmarksRouter = Backbone.Router.extend({
  routes: {
  	"": "home",
    "tags/:tag": "tags"
  },
  home: function() {
  	//console.log("router: call home");
	Session.set('tag_filters', null);
  },
  tags: function (tag) {
    //console.log("setting tag filter to " + tag);
    Session.set('tag_filters', [tag]);
  }
});
