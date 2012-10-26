Meteor.startup(function () {
// code to run on server at startup

    //fill one post in if empty
    if (Smarks.find().count() === 0) {
        Smarks.insert({
        	avatar:"Admin",
        	smark:"Hello World this is your post", 
        	owner:"admin",
        	timestamp:new Date().getTime()
        });
    }
});

Meteor.publish("smarks", function () {
  return Smarks.find({}, {sort: {timestamp: -1}});
});
