Meteor.startup(function () {
// code to run on server at startup

    //fill one post in if empty
    if (Smarks.find().count() === 0) {
        Smarks.insert({
        	avatar:"Admin",
        	smark:"Hello Smarks", 
        	owner:"admin",
        	timestamp:new Date().getTime(),
            tags:[]
        });
    }
});

Meteor.publish("smarks", function () {
  return Smarks.find({}, {sort: {timestamp: -1}});
});

Meteor.publish("favs", function() {
    return Favs.find({});
})

Meteor.publish("usertags", function() {
    return UserTags.find({});
})
