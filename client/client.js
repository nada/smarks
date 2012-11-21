

// collections
Smarks = new Meteor.Collection("smarks");
Favs = new Meteor.Collection("favs");
UserTags = new Meteor.Collection("usertags");
SuperU = new Meteor.Collection("superu");

//routing events via backbone
Router = new SmarksRouter;

Session.set('tag_filters', null);
Session.set('taggingPost', null);
//Session.set('layout', 'view_cl');

Meteor.subscribe("smarks");
Meteor.subscribe("favs");
Meteor.subscribe("superu");
Meteor.subscribe("usertags");

Accounts.ui.config({
  passwordSignupFields: 'USERNAME_AND_EMAIL'
});

// _________________________________________________________________________

Meteor.startup(function () {
	$(window).resize(sJS.repositionPosts);

	Backbone.history.start({pushState: true});

	if (SuperU.find().count() === 0) {
		console.log("no super user set until now!")
	}

});


